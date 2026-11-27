// Bedwars Main Game Coordinator & Game Loop with Multi-Team & Multi-Player Support
class BedwarsGame {
  constructor() {
    this.container = document.getElementById('game-container');
    this.canvas = document.getElementById('render-canvas');

    this.scene = null;
    this.camera = null;
    this.renderer = null;

    this.world = null;
    this.player = null;
    this.bots = [];
    this.generatorManager = null;
    this.shopManager = null;

    // Game Mode Options:
    // mode: '2teams' (Red vs Blue) or '4teams' (Red, Blue, Green, Yellow)
    // teamSize: 1 (singles) or 2 (doubles)
    // difficulty: 'normal', 'hard', 'nightmare'
    // map: 'boogie' (布吉浮岛), 'castle' (城堡要塞), 'nether' (地狱熔岩), 'end' (虚空末地)
    this.selectedMode = '2teams';
    this.selectedTeamSize = 1;
    this.selectedDifficulty = 'hard';
    this.selectedMap = 'boogie';
    this.currentMap = 'boogie';
    this.teams = ['red', 'blue'];

    this.mapThemes = {
      boogie: {
        name: '布吉浮岛',
        sky: 0x87ceeb,
        fog: 0xa0d8ef,
        fogDensity: 0.0055,
        ambient: 0xffffff,
        ambientInt: 0.72,
        sun: 0xfffaed,
        sunInt: 0.85
      },
      castle: {
        name: '城堡要塞',
        sky: 0x5a7c99,
        fog: 0x7692ad,
        fogDensity: 0.0060,
        ambient: 0xd4e2ee,
        ambientInt: 0.70,
        sun: 0xffe9cf,
        sunInt: 0.90
      },
      nether: {
        name: '地狱熔岩',
        sky: 0x280606,
        fog: 0x3d0b0b,
        fogDensity: 0.0080,
        ambient: 0xff9977,
        ambientInt: 0.65,
        sun: 0xff5533,
        sunInt: 0.95
      },
      end: {
        name: '虚空末地',
        sky: 0x0c0714,
        fog: 0x180d28,
        fogDensity: 0.0070,
        ambient: 0xc8a4e8,
        ambientInt: 0.60,
        sun: 0xe0c0ff,
        sunInt: 0.80
      },
      school: {
        name: '阳光校园',
        sky: 0x87ceeb,
        fog: 0xa0d8ef,
        fogDensity: 0.0070,
        ambient: 0xffffff,
        ambientInt: 0.75,
        sun: 0xfffaed,
        sunInt: 0.90
      },
      survival: {
        name: '生存荒野 (R=300)',
        sky: 0x87ceeb,
        fog: 0x9ad8f0,
        fogDensity: 0.0028,
        ambient: 0xffffff,
        ambientInt: 0.78,
        sun: 0xfff8e7,
        sunInt: 0.92
      }
    };

    this.isGameRunning = false;
    this.lastTime = performance.now();
    this.survivalDuelStarted = false;
    this.survivalDuelTimer = 600;

    // Stats
    this.matchTime = 0;
    this.diamondTimer = 12;
    this.emeraldTimer = 15;
    this.kills = 0;
    this.finalKills = 0;
    this.bedsBroken = 0;
    this.sbTimer = 0;
    this.healPoolTimer = 0;

    // Team Upgrades (Purchased with Diamonds)
    this.teamUpgrades = {
      red: { sharpness: 0, protection: 0, forge: 1, healPool: false, trap: false },
      blue: { sharpness: 0, protection: 0, forge: 1, healPool: false, trap: false },
      green: { sharpness: 0, protection: 0, forge: 1, healPool: false, trap: false },
      yellow: { sharpness: 0, protection: 0, forge: 1, healPool: false, trap: false }
    };

    // Touch Controls System (Minecraft Bedrock / NetEase PE Style)
    this.touchControls = (window.TouchControls) ? new window.TouchControls(this) : null;

    this.initThree();
    this.bindUIEvents();
    this.initGame();
  }

  initThree() {
    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb); // Minecraft sky blue
    this.scene.fog = new THREE.FogExp2(0xa0d8ef, 0.012);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.scene.add(this.camera);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    this.renderer.shadowMap.enabled = false;

    // 4. Lighting
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.72);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xfffaed, 0.85);
    this.sunLight.position.set(40, 60, 20);
    this.scene.add(this.sunLight);

    // Resize handler
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  applyMapAtmosphere(mapType = 'boogie') {
    const theme = this.mapThemes[mapType] || this.mapThemes.boogie;
    if (this.scene) {
      this.scene.background = new THREE.Color(theme.sky);
      this.scene.fog = new THREE.FogExp2(theme.fog, theme.fogDensity);
    }
    if (this.ambientLight) {
      this.ambientLight.color.setHex(theme.ambient);
      this.ambientLight.intensity = theme.ambientInt;
    }
    if (this.sunLight) {
      this.sunLight.color.setHex(theme.sun);
      this.sunLight.intensity = theme.sunInt;
    }
  }

  initGame() {
    this.setupMode(this.selectedMode, this.selectedTeamSize, this.selectedDifficulty, this.selectedMap);
    this.updateStartButtonSummary();
  }

  updateStartButtonSummary() {
    const startBtn = document.getElementById('start-btn');
    if (!startBtn) return;
    let modeName = '经典单挑 1v1';
    if (this.selectedMode === 'survival_war') {
      modeName = '🌲 生存战争 16人4队决战';
    } else if (this.selectedMode === 'school_br') {
      modeName = '🐔 校园吃鸡 16人混战';
    } else if (this.selectedMode === 'pvp_1v1') {
      modeName = '⚔️ 纯粹 PVP 决斗';
    } else if (this.selectedMode === 'skywars_1v1') {
      modeName = '🏝️ 空岛战争 1v1';
    } else if (this.selectedMode === 'skywars_4p') {
      modeName = '🏝️ 空岛战争 4人混战';
    } else if (this.selectedMode === '4teams') {
      modeName = (this.selectedTeamSize === 2 ? '四队双人 2v2v2v2' : '四队单挑 1v1v1v1');
    } else {
      modeName = (this.selectedTeamSize === 2 ? '双人配合 2v2' : '经典单挑 1v1');
    }
    const mapName = (this.mapThemes[this.selectedMap] && this.mapThemes[this.selectedMap].name) || '布吉浮岛';
    const diffMap = {
      'normal': '普通人机',
      'hard': '高手身法人机',
      'nightmare': '职业噩梦人机'
    };
    const diffName = diffMap[this.selectedDifficulty] || '高手身法人机';
    startBtn.innerHTML = `⚡ 开始战斗 [${modeName} · ${diffName}] ⚡<div style="font-size: 13px; font-weight: normal; opacity: 0.9; margin-top: 2px;">(点击开始 / 触屏点按 / 按回车键进入游戏)</div>`;
  }

  returnToMainMenu() {
    this.isGameRunning = false;
    if (document.pointerLockElement) {
      try {
        document.exitPointerLock();
      } catch (err) {}
    }
    const resumeOverlay = document.getElementById('resume-overlay');
    if (resumeOverlay) resumeOverlay.style.display = 'none';
    const gameoverModal = document.getElementById('gameover-modal');
    if (gameoverModal) gameoverModal.style.display = 'none';
    const shopModal = document.getElementById('shop-modal');
    if (shopModal) shopModal.style.display = 'none';
    const teamModal = document.getElementById('team-modal');
    if (teamModal) teamModal.style.display = 'none';
    const chestModal = document.getElementById('chest-modal');
    if (chestModal) chestModal.style.display = 'none';
    if (window.player && window.player.chestIsOpen) window.player.closeChest();
    if (window.TeammateManager) window.TeammateManager.isOpen = false;
    const startScreen = document.getElementById('start-screen');
    if (startScreen) startScreen.style.display = 'flex';

    this.setupMode(this.selectedMode, this.selectedTeamSize, this.selectedDifficulty, this.selectedMap);
    this.updateStartButtonSummary();
    if (window.soundManager && typeof window.soundManager.playDing === 'function') {
      window.soundManager.playDing(500);
    }
  }

  setupMode(mode = '2teams', teamSize = 1, difficulty = 'hard', mapType = null) {
    this.selectedMode = mode;
    this.selectedTeamSize = teamSize;
    this.selectedDifficulty = difficulty;
    if (mapType) this.selectedMap = mapType;

    this.currentMode = mode;
    this.currentTeamSize = teamSize;
    this.currentDifficulty = difficulty;
    if (mode === 'survival_war') {
      this.currentMap = 'survival';
    } else if (mode === 'school_br') {
      this.currentMap = 'school';
    } else {
      this.currentMap = this.selectedMap || 'boogie';
    }

    this.applyMapAtmosphere(this.currentMap);

    // 1. Clear previous entities from scene
    if (this.world) {
      if (typeof this.world.clear === 'function') {
        this.world.clear();
      } else if (this.world.voxelMap) {
        for (const b of this.world.voxelMap.values()) {
          if (b.mesh) this.scene.remove(b.mesh);
        }
        this.world.voxelMap.clear();
      }
    }
    if (this.world && this.world.particles) {
      for (const p of this.world.particles) {
        if (p.mesh) this.scene.remove(p.mesh);
      }
      this.world.particles = [];
    }

    if (this.bots) {
      for (const bot of this.bots) {
        if (bot.group) this.scene.remove(bot.group);
      }
    }
    this.bots = [];
    this.endBoss = null;
    this.endBossSpawned = false;
    this.endBossIsRespawning = false;
    this.endBossRespawnTimer = 0;
    const bossBar = document.getElementById('boss-bar-container');
    if (bossBar) bossBar.style.display = 'none';

    if (this.generatorManager) {
      this.generatorManager.clearAll();
    }

    if (this.shopManager && this.shopManager.villagers) {
      for (const v of this.shopManager.villagers) {
        if (v.group) this.scene.remove(v.group);
      }
      this.shopManager.villagers = [];
    }

    if (this.player) {
      if (typeof this.player.destroy === 'function') {
        this.player.destroy();
      } else if (this.player.handGroup) {
        this.camera.remove(this.player.handGroup);
      }
    }

    // 2. Voxel World
    this.world = new VoxelWorld(this.scene);
    this.world.generateWorld(mode, this.currentMap);

    // 3. Player
    this.player = new Player(this.camera, this.scene, this.world);
    window.player = this.player;
    if (this.touchControls) {
      this.touchControls.setPlayer(this.player);
    }

    // 4. Resource Generators & Shop NPCs
    const isPvp = (mode === 'pvp_1v1');
    const isSkyWars = (mode && mode.startsWith('skywars'));
    const isSchoolBR = (mode === 'school_br');
    const isSurvivalWar = (mode === 'survival_war');

    this.survivalDuelStarted = false;
    this.survivalDuelTimer = 600; // 10 minutes survival before 4-team duel

    this.generatorManager = new GeneratorManager(this.scene);
    this.generators = this.generatorManager; // Alias
    if (!isPvp && !isSkyWars && !isSchoolBR && !isSurvivalWar) {
      this.generatorManager.initSpawners(mode);
    }

    if (!this.shopManager) {
      this.shopManager = new ShopManager(this.scene, this.player);
    } else {
      this.shopManager.player = this.player;
    }
    if (!isPvp && !isSkyWars && !isSchoolBR && !isSurvivalWar) {
      this.shopManager.initVillagerNPCs(mode);
    }
    window.shopManager = this.shopManager;

    const resDisplay = document.getElementById('resources-display');
    if (resDisplay) {
      resDisplay.style.display = (isPvp || isSkyWars || isSchoolBR || isSurvivalWar) ? 'none' : 'flex';
    }

    // 5. Spawn Bots & Configure Equipment based on Mode
    if (isPvp) {
      this.teams = ['red', 'blue'];

      // Player Spawn: Duel Arena North side, Facing South directly at opponent
      this.player.position.set(0, 0.6, 7);
      this.player.yaw = 0;
      this.player.pitch = 0;
      this.player.armorTier = 'diamond';
      this.player.hotbar = [
        { id: 'sword_diamond', name: '钻石剑', type: 'weapon', count: 1, damage: 7 },
        { id: 'golden_apple', name: '金苹果 x4', type: 'utility', count: 4 },
        { id: 'enchanted_golden_apple', name: '附魔金苹果 x2', type: 'utility', count: 2 },
        { id: 'bow_power', name: '力量弓 (增伤)', type: 'bow', bowType: 'power', count: 1 },
        { id: 'arrow_16', name: '箭矢 x32', type: 'arrow', count: 32 },
        { id: 'wood_planks', name: '橡木木板 x64', type: 'block', blockType: 'OAK_PLANKS', count: 64 },
        { id: 'pickaxe_diamond', name: '钻石镐', type: 'tool', count: 1 },
        { id: 'potion_speed', name: '迅捷药水 II (45秒)', type: 'potion', potionType: 'speed', duration: 45, count: 1 },
        { id: 'ender_pearl', name: '末影珍珠 x2', type: 'utility', count: 2 }
      ];
      this.player.updateHUD();
      this.player.updateHeldItemVisual();

      // Bot Spawn: Duel Arena South side, Fully armed with diamond equipment in COMBAT state
      this.bots.push(new Bot(this.scene, this.world, {
        id: 'blue_pvp', name: '蓝队决斗大师', team: 'blue', difficulty,
        spawnPos: { x: 0, y: 0.6, z: -7 },
        initialState: 'COMBAT',
        initialWeapon: 'diamond',
        initialArmor: 'diamond',
        hasGapple: 3,
        hasBow: true
      }));
    } else if (isSkyWars) {
      if (mode === 'skywars_4p') {
        this.teams = ['red', 'blue', 'green', 'yellow'];

        // Player Spawn on Red Island
        this.player.position.set(0, 1.2, 36);
        this.player.spawnPoint = new THREE.Vector3(0, 1.2, 36);
        this.player.velocity.set(0, 0, 0);
        this.player.onGround = false;
        this.player.yaw = Math.PI;
        this.player.pitch = 0;
        this.player.armorTier = 'none';
        this.player.hotbar = [
          { id: 'sword_wooden', name: '木剑', type: 'weapon', count: 1, damage: 4 },
          null, null, null, null, null, null, null, null
        ];
        this.player.updateHUD();
        this.player.updateHeldItemVisual();

        // 3 Enemy Bots on their own sky islands, ready to loot their chests
        this.bots.push(new Bot(this.scene, this.world, {
          id: 'blue_skywars', name: '蓝队人机', team: 'blue', difficulty,
          spawnPos: { x: 0, y: 0.6, z: -36 },
          spawnChestPos: { x: 0, y: 1, z: -39 },
          initialBedPos: { x: 0, y: 1, z: -33 },
          initialState: 'LOOT_CHEST'
        }));
        this.bots.push(new Bot(this.scene, this.world, {
          id: 'green_skywars', name: '绿队人机', team: 'green', difficulty,
          spawnPos: { x: 36, y: 0.6, z: 0 },
          spawnChestPos: { x: 39, y: 1, z: 0 },
          initialBedPos: { x: 33, y: 1, z: 0 },
          initialState: 'LOOT_CHEST'
        }));
        this.bots.push(new Bot(this.scene, this.world, {
          id: 'yellow_skywars', name: '黄队人机', team: 'yellow', difficulty,
          spawnPos: { x: -36, y: 0.6, z: 0 },
          spawnChestPos: { x: -39, y: 1, z: 0 },
          initialBedPos: { x: -33, y: 1, z: 0 },
          initialState: 'LOOT_CHEST'
        }));
      } else {
        // SkyWars 1v1
        this.teams = ['red', 'blue'];

        // Player on Island 1
        this.player.position.set(0, 1.2, 32);
        this.player.spawnPoint = new THREE.Vector3(0, 1.2, 32);
        this.player.velocity.set(0, 0, 0);
        this.player.onGround = false;
        this.player.yaw = Math.PI;
        this.player.pitch = 0;
        this.player.armorTier = 'none';
        this.player.hotbar = [
          { id: 'sword_wooden', name: '木剑', type: 'weapon', count: 1, damage: 4 },
          null, null, null, null, null, null, null, null
        ];
        this.player.updateHUD();
        this.player.updateHeldItemVisual();

        // Bot on Island 2
        this.bots.push(new Bot(this.scene, this.world, {
          id: 'blue_skywars', name: '蓝队空岛人机', team: 'blue', difficulty,
          spawnPos: { x: 0, y: 0.6, z: -32 },
          spawnChestPos: { x: 0, y: 1, z: -35 },
          initialBedPos: { x: 0, y: 1, z: -29 },
          initialState: 'LOOT_CHEST'
        }));
      }
    } else if (isSurvivalWar) {
      // 16-Player Survival War across Radius-300 Circular World
      const survSpawnPoints = [];
      for (let i = 0; i < 16; i++) {
        const ang = (i / 16) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
        const rad = 110 + (i % 3) * 45 + Math.random() * 25;
        const sx = Math.round(Math.cos(ang) * rad);
        const sz = Math.round(Math.sin(ang) * rad);
        const sy = (this.world && typeof this.world.getSurvivalHeight === 'function')
          ? this.world.getSurvivalHeight(sx, sz) + 1.5
          : 4.5;
        survSpawnPoints.push(new THREE.Vector3(sx, sy, sz));
      }
      const pSpawn = survSpawnPoints[0];
      this.player.position.copy(pSpawn);
      this.player.spawnPoint = pSpawn.clone();
      this.player.velocity.set(0, 0, 0);
      this.player.onGround = false;
      this.player.yaw = Math.random() * Math.PI * 2;
      this.player.pitch = 0;
      this.player.armorTier = 'none';
      this.player.hotbar = [
        { id: 'sword_wooden', name: '木剑', type: 'weapon', count: 1, damage: 4 },
        { id: 'pickaxe_wood', name: '木镐', type: 'tool', count: 1 },
        { id: 'crafting_table', name: '工作台', type: 'block', blockType: 'CRAFTING_TABLE', count: 1 },
        { id: 'wood_planks', name: '橡木木板', type: 'block', blockType: 'OAK_PLANKS', count: 8 },
        null, null, null, null, null
      ];
      this.player.updateHUD();
      this.player.updateHeldItemVisual();

      const survBotNames = [
        '荒野猎人', '矿洞大师', '红石学者', '末影行者', '铁傀儡护卫',
        '钻石挖矿王', '森林游侠', '孤狼生存家', '雪原战神', '狂战士阿飞',
        '潜行刺客', '跳劈宗师', '雷霆剑圣', '熔炉工匠', '苍穹骑士'
      ];
      const presetList = ['steve', 'alex', 'zombie', 'skeleton', 'enderman', 'creeper', 'knight', 'cyber', 'demon'];

      this.teams = ['red'];
      for (let i = 0; i < 15; i++) {
        const bTeam = `surv_${i + 1}`;
        this.teams.push(bTeam);
        const bId = `bot_surv_${i + 1}`;
        const bSpawn = survSpawnPoints[i + 1];
        const randomSkinId = presetList[Math.floor(Math.random() * presetList.length)];
        if (window.SkinManager) {
          window.SkinManager.setBotSkin(bId, { type: 'preset', id: randomSkinId });
        }

        const bot = new Bot(this.scene, this.world, {
          id: bId,
          name: survBotNames[i],
          team: bTeam,
          difficulty,
          spawnPos: { x: bSpawn.x, y: bSpawn.y, z: bSpawn.z },
          initialState: 'SURVIVAL_GATHER',
          initialWeapon: 'wood',
          initialArmor: 'none'
        });
        this.bots.push(bot);
      }
    } else if (isSchoolBR) {
      // 16-Player Battle Royale across Campus
      const schoolSpawnPoints = [
        new THREE.Vector3(-23, 1.2, 0),    // 操场中圈
        new THREE.Vector3(-23, 1.2, 20),   // 操场北球门前
        new THREE.Vector3(-23, 1.2, -20),  // 操场南球门前
        new THREE.Vector3(-10, 1.2, 18),   // 操场东侧跑道
        new THREE.Vector3(-39, 5.2, 0),    // 操场看台最高层
        new THREE.Vector3(-2, 1.2, -26),   // 校园大门
        new THREE.Vector3(0, 1.2, 0),      // 校园喷泉广场
        new THREE.Vector3(-2, 1.2, 24),    // 校园北花园林道
        new THREE.Vector3(10, 1.2, 0),     // 教学楼1F主大厅
        new THREE.Vector3(26, 1.2, 12),    // 教学楼1F 101教室
        new THREE.Vector3(26, 1.2, -12),   // 教学楼1F 102教室
        new THREE.Vector3(26, 6.2, 12),    // 教学楼2F 201实验实训室
        new THREE.Vector3(26, 6.2, -12),   // 教学楼2F 202机房
        new THREE.Vector3(10, 6.2, 12),    // 教学楼2F 图书馆
        new THREE.Vector3(26, 11.2, 12),   // 教学楼3F 301美术多功能厅
        new THREE.Vector3(25, 16.2, -8)    // 教学楼天台水塔观景台
      ];

      // Shuffle 16 spawn points so every participant gets a unique location
      const spawnIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].sort(() => Math.random() - 0.5);

      // Player spawn
      const pSpawn = schoolSpawnPoints[spawnIndices[0]];
      this.player.position.copy(pSpawn);
      this.player.spawnPoint = pSpawn.clone();
      this.player.velocity.set(0, 0, 0);
      this.player.onGround = false;
      this.player.yaw = Math.random() * Math.PI * 2;
      this.player.pitch = 0;
      this.player.armorTier = 'none';
      this.player.hotbar = [
        { id: 'sword_wooden', name: '战术木剑', type: 'weapon', count: 1, damage: 4 },
        null, null, null, null, null, null, null, null
      ];
      this.player.updateHUD();
      this.player.updateHeldItemVisual();

      // 15 Bot participants
      const botNames = [
        '操场飞人', '隔壁班小王', '绝地神剑', '空岛老六', '校霸阿强',
        '学委小红', '风骚走位哥', '狙击之王', '天台老哥', '伏地魔',
        '跳劈大神', '末影游侠', '夜行刺客', '自律学神', '幻影剑客'
      ];
      const presetList = ['steve', 'alex', 'zombie', 'skeleton', 'enderman', 'creeper', 'knight', 'cyber', 'demon'];

      this.teams = ['red'];
      for (let i = 0; i < 15; i++) {
        const bTeam = `br_${i + 1}`;
        this.teams.push(bTeam);
        const bId = `bot_br_${i + 1}`;
        const bSpawn = schoolSpawnPoints[spawnIndices[i + 1]];

        // Random skin assignment
        const randomSkinId = presetList[Math.floor(Math.random() * presetList.length)];
        if (window.SkinManager) {
          window.SkinManager.setBotSkin(bId, { type: 'preset', id: randomSkinId });
        }

        const bot = new Bot(this.scene, this.world, {
          id: bId,
          name: botNames[i],
          team: bTeam,
          difficulty,
          spawnPos: { x: bSpawn.x, y: bSpawn.y, z: bSpawn.z },
          initialState: 'LOOT_CHEST'
        });
        this.bots.push(bot);
      }
    } else if (mode === '4teams') {
      this.teams = ['red', 'blue', 'green', 'yellow'];

      if (teamSize === 1) {
        // 4 teams, 1 player per team
        this.bots.push(new Bot(this.scene, this.world, {
          id: 'blue_1', name: '蓝队人机', team: 'blue', difficulty,
          spawnPos: { x: 0, y: 0.6, z: -56 }
        }));
        this.bots.push(new Bot(this.scene, this.world, {
          id: 'green_1', name: '绿队人机', team: 'green', difficulty,
          spawnPos: { x: 56, y: 0.6, z: 0 }
        }));
        this.bots.push(new Bot(this.scene, this.world, {
          id: 'yellow_1', name: '黄队人机', team: 'yellow', difficulty,
          spawnPos: { x: -56, y: 0.6, z: 0 }
        }));
      } else {
        // 4 teams, 2 players per team (Player + 1 Red Teammate vs 2 Blue vs 2 Green vs 2 Yellow)
        this.bots.push(new Bot(this.scene, this.world, {
          id: 'red_mate', name: '红队队友', team: 'red', difficulty,
          spawnPos: { x: 2, y: 0.6, z: 56 }
        }));
        this.bots.push(new Bot(this.scene, this.world, {
          id: 'blue_1', name: '蓝队 1号', team: 'blue', difficulty,
          spawnPos: { x: -2, y: 0.6, z: -56 }
        }));
        this.bots.push(new Bot(this.scene, this.world, {
          id: 'blue_2', name: '蓝队 2号', team: 'blue', difficulty,
          spawnPos: { x: 2, y: 0.6, z: -56 }
        }));
        this.bots.push(new Bot(this.scene, this.world, {
          id: 'green_1', name: '绿队 1号', team: 'green', difficulty,
          spawnPos: { x: 56, y: 0.6, z: -2 }
        }));
        this.bots.push(new Bot(this.scene, this.world, {
          id: 'green_2', name: '绿队 2号', team: 'green', difficulty,
          spawnPos: { x: 56, y: 0.6, z: 2 }
        }));
        this.bots.push(new Bot(this.scene, this.world, {
          id: 'yellow_1', name: '黄队 1号', team: 'yellow', difficulty,
          spawnPos: { x: -56, y: 0.6, z: -2 }
        }));
        this.bots.push(new Bot(this.scene, this.world, {
          id: 'yellow_2', name: '黄队 2号', team: 'yellow', difficulty,
          spawnPos: { x: -56, y: 0.6, z: 2 }
        }));
      }
    } else {
      // 2 Teams Mode (Red vs Blue)
      this.teams = ['red', 'blue'];

      if (teamSize === 1) {
        // 1v1
        this.bots.push(new Bot(this.scene, this.world, {
          id: 'blue_1', name: '蓝队人机', team: 'blue', difficulty,
          spawnPos: { x: 0, y: 0.6, z: -56 }
        }));
      } else {
        // 2v2 (Player + Red teammate vs 2 Blue bots)
        this.bots.push(new Bot(this.scene, this.world, {
          id: 'red_mate', name: '红队队友', team: 'red', difficulty,
          spawnPos: { x: 2, y: 0.6, z: 56 }
        }));
        this.bots.push(new Bot(this.scene, this.world, {
          id: 'blue_1', name: '蓝队 1号', team: 'blue', difficulty,
          spawnPos: { x: -2, y: 0.6, z: -56 }
        }));
        this.bots.push(new Bot(this.scene, this.world, {
          id: 'blue_2', name: '蓝队 2号', team: 'blue', difficulty,
          spawnPos: { x: 2, y: 0.6, z: -56 }
        }));
      }
    }

    window.bots = this.bots;
    window.bot = this.bots[0];

    // Refresh bot skins
    if (window.SkinManager && typeof window.SkinManager.refreshAllBots === 'function') {
      window.SkinManager.refreshAllBots();
    }

    // Update scoreboard title
    const sbTitleEl = document.getElementById('scoreboard-title');
    const modeTitleEl = document.getElementById('sb-mode-title');
    if (sbTitleEl) {
      if (isSurvivalWar) sbTitleEl.innerText = 'SURVIVAL WAR';
      else if (isSchoolBR) sbTitleEl.innerText = 'BATTLE ROYALE';
      else if (isPvp) sbTitleEl.innerText = '1V1 DUEL';
      else if (isSkyWars) sbTitleEl.innerText = 'SKY WARS';
      else sbTitleEl.innerText = 'BED WARS';
    }
    if (modeTitleEl) {
      if (isSurvivalWar) {
        modeTitleEl.innerText = '🌲 生存战争 · 16人4队决战';
      } else if (isSchoolBR) {
        modeTitleEl.innerText = '🐔 校园吃鸡 · 16人混战';
      } else if (isPvp) {
        modeTitleEl.innerText = '决斗角斗场 · 纯粹 PVP';
      } else if (isSkyWars) {
        modeTitleEl.innerText = mode === 'skywars_4p' ? '空岛战争 4人混战' : '空岛战争 1v1';
      } else {
        const modeName = mode === '4teams' ?
          (teamSize === 2 ? '四队双人 2v2v2v2' : '四队单挑 1v1v1v1') :
          (teamSize === 2 ? '双人配合 2v2' : '经典单挑 1v1');
        const mapName = (this.mapThemes[this.currentMap] && this.mapThemes[this.currentMap].name) || '布吉浮岛';
        modeTitleEl.innerText = `${mapName} · ${modeName}`;
      }
    }

    this.updateScoreboard();
    if (window.TeammateManager && window.TeammateManager.isOpen) {
      window.TeammateManager.renderModal();
    }
  }

  spawnEndBoss(isRespawn = false) {
    if (this.endBoss && !this.endBoss.isDead) return;
    this.endBossSpawned = true;
    this.endBossIsRespawning = false;
    this.endBossRespawnTimer = 0;

    // End Map center is x=0, z=0. The central monolith reaches y=8.
    let spawnY = 9.2;
    if (this.world && this.world.voxelMap) {
      for (let y = 30; y >= -5; y--) {
        const key = `0,${y},0`;
        const b = this.world.voxelMap.get(key);
        if (b && b.solid) {
          spawnY = y + 1.2;
          break;
        }
      }
    }

    if (this.endBoss) {
      // Clean reuse and respawn of existing boss instance (zero array splicing, zero memory leak)
      this.endBoss.spawnPoint = new THREE.Vector3(0, spawnY, 0);
      this.endBoss.respawn();
    } else if (window.EndBoss) {
      this.endBoss = new window.EndBoss(this.scene, this.world, {
        spawnPos: { x: 0, y: spawnY, z: 0 }
      });
      this.bots.push(this.endBoss);
    }

    // Play thunder / awakening ding sounds
    if (window.soundManager && typeof window.soundManager.playDing === 'function') {
      window.soundManager.playDing(300);
      setTimeout(() => window.soundManager.playDing(600), 120);
      setTimeout(() => window.soundManager.playDing(1200), 240);
    }

    // Violet shockwave particles
    if (window.WeaponModelBuilder && typeof window.WeaponModelBuilder.spawnSmashShockwave === 'function') {
      window.WeaponModelBuilder.spawnSmashShockwave(this.world, new THREE.Vector3(0, spawnY, 0));
    }

    if (isRespawn) {
      this.showBigBanner('§5★ 末地领主浴火复活！ ★', '末地核心领主重构神躯，再次降临中央遗迹！');
      this.addChatMessage('§5★ 警告：【末地领主】已成功复活！它携 500 点生命值与 10 点攻击力再次向所有玩家与床位宣战！');
    } else {
      this.showBigBanner('§5★ 末地领主降临 ★', '末地核心领主苏醒，正在摧毁一切！');
      this.addChatMessage('§5★ 警告：【末地领主】已在中央黑曜石遗迹苏醒！它拥有 500 点生命值与 10 点攻击力，将袭击所有玩家并粉碎所有床！');
    }
    this.updateScoreboard();
  }

  onEndBossDied() {
    this.endBossIsRespawning = true;
    this.endBossRespawnTimer = 60; // 1 minute (60s) respawn cooldown as requested
    this.updateScoreboard();
  }

  bindUIEvents() {
    const startScreen = document.getElementById('start-screen');
    const startBtn = document.getElementById('start-btn');
    const resumeOverlay = document.getElementById('resume-overlay');

    // Initialize Skin Management UI
    if (window.SkinManager && typeof window.SkinManager.initUI === 'function') {
      window.SkinManager.initUI();
    }

    // Initialize Teammate Tactical System UI
    if (window.TeammateManager && typeof window.TeammateManager.init === 'function') {
      window.TeammateManager.init();
    }

    // Map Selection Buttons with immediate sound & live scene preview
    document.querySelectorAll('.map-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.map-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedMap = btn.dataset.map;
        if (window.soundManager && typeof window.soundManager.playDing === 'function') {
          window.soundManager.playDing(600);
        }
        this.updateStartButtonSummary();
        if (!this.isGameRunning) {
          this.setupMode(this.selectedMode, this.selectedTeamSize, this.selectedDifficulty, this.selectedMap);
        }
      });
    });

    // Mode Selection Buttons with immediate sound & live scene preview
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedMode = btn.dataset.mode;
        this.selectedTeamSize = parseInt(btn.dataset.teamsize);
        if (window.soundManager && typeof window.soundManager.playDing === 'function') {
          window.soundManager.playDing(600);
        }
        this.updateStartButtonSummary();
        if (!this.isGameRunning) {
          this.setupMode(this.selectedMode, this.selectedTeamSize, this.selectedDifficulty, this.selectedMap);
        }
      });
    });

    // Difficulty Selection Buttons with immediate sound & live scene preview
    document.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedDifficulty = btn.dataset.diff;
        if (window.soundManager && typeof window.soundManager.playDing === 'function') {
          window.soundManager.playDing(600);
        }
        this.updateStartButtonSummary();
        if (!this.isGameRunning) {
          this.setupMode(this.selectedMode, this.selectedTeamSize, this.selectedDifficulty, this.selectedMap);
        }
      });
    });

    // Control Mode Selection (Touch vs PC Keyboard/Mouse)
    const touchBtn = document.getElementById('start-touch-btn');
    const pcBtn = document.getElementById('start-pc-btn');
    const updateControlBtns = () => {
      const isTouch = this.touchControls ? this.touchControls.enabled : false;
      if (touchBtn) touchBtn.classList.toggle('active', isTouch);
      if (pcBtn) pcBtn.classList.toggle('active', !isTouch);
    };

    if (touchBtn) {
      touchBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.touchControls) {
          this.touchControls.enabled = true;
          localStorage.setItem('bedwars_touch_enabled', 'true');
          this.touchControls.applyVisibility();
          updateControlBtns();
          if (window.soundManager && typeof window.soundManager.playDing === 'function') {
            window.soundManager.playDing(700);
          }
        }
      });
    }

    if (pcBtn) {
      pcBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.touchControls) {
          this.touchControls.enabled = false;
          localStorage.setItem('bedwars_touch_enabled', 'false');
          this.touchControls.applyVisibility();
          updateControlBtns();
          if (window.soundManager && typeof window.soundManager.playDing === 'function') {
            window.soundManager.playDing(500);
          }
        }
      });
    }
    updateControlBtns();

    const lockPointer = () => {
      try {
        if (window.soundManager && typeof window.soundManager.init === 'function') {
          window.soundManager.init();
        }
        if (document.pointerLockElement !== this.canvas) {
          const promise = this.canvas.requestPointerLock();
          if (promise && typeof promise.catch === 'function') {
            promise.catch(() => {});
          }
        }
      } catch (e) {
        console.warn('Pointer lock request ignored:', e);
      }
    };

    const startGame = () => {
      if (this.isGameRunning) return;
      this.isGameRunning = true;

      if (startScreen) startScreen.style.display = 'none';

      // Re-setup only if options changed from what was initially constructed
      if (this.currentMode !== this.selectedMode ||
          this.currentTeamSize !== this.selectedTeamSize ||
          this.currentDifficulty !== this.selectedDifficulty ||
          this.currentMap !== this.selectedMap) {
        try {
          this.setupMode(this.selectedMode, this.selectedTeamSize, this.selectedDifficulty, this.selectedMap);
        } catch (err) {
          console.error('Error during setupMode:', err);
        }
      }

      this.lastTime = performance.now();
      lockPointer();

      if (this.currentMode === 'survival_war') {
        this.addChatMessage('§a[生存战争] 16人已分散降临半径300格荒野地表！');
        this.addChatMessage('§e按照原版生存规则砍树、挖矿、搜箱升级，按 §bC §e打开原版合成台升级神装！');
        this.addChatMessage('§610分钟后全员将分为 4 队传送进入高空决斗场决一胜负，最后存活队伍获胜！');
      } else if (this.currentMode === 'school_br') {
        this.addChatMessage('§6[校园吃鸡 16人混战] 比赛正式开始！');
        this.addChatMessage('§e16人全随机散布操场与教学楼！快速搜箱抢装，下落跳劈双倍暴击！');
      } else if (this.currentMode === 'pvp_1v1') {
        this.addChatMessage('§6[1v1 纯粹决斗] 比赛正式开始！');
        this.addChatMessage('§e满配钻石神装已发放！运用身法与跳劈击败对手！');
      } else if (this.currentMode && this.currentMode.startsWith('skywars')) {
        this.addChatMessage('§b[空岛战争] 比赛正式开始！');
        this.addChatMessage('§e快速开启空岛战备箱搜刮装备，搭桥抢占中岛神装！');
      } else {
        this.addChatMessage('§a[起床战争] 游戏正式开始！');
        this.addChatMessage('§e保护红队的床，破坏敌方的床，将所有敌人淘汰出局！');
      }
    };

    this.startGameDirect = startGame;

    if (startBtn) {
      startBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        startGame();
      });
    }

    // Space or Enter key on the start screen launches the match
    window.addEventListener('keydown', (e) => {
      if (!this.isGameRunning && startScreen && startScreen.style.display !== 'none') {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          startGame();
        }
      }
      // 'O' key shortcut to immediately summon / respawn End Boss for testing/demo
      if (this.isGameRunning && (e.key === 'o' || e.key === 'O')) {
        if (!this.endBoss || this.endBoss.isDead || this.endBossIsRespawning || !this.endBossSpawned) {
          this.spawnEndBoss(this.endBossSpawned);
        }
      }
    });

    window.spawnEndBoss = (isRespawn = false) => {
      this.spawnEndBoss(isRespawn);
    };

    if (resumeOverlay) {
      resumeOverlay.addEventListener('click', (e) => {
        if (e.target === resumeOverlay) {
          resumeOverlay.style.display = 'none';
          lockPointer();
        }
      });
    }

    const resumeGameBtn = document.getElementById('resume-game-btn');
    if (resumeGameBtn) {
      resumeGameBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (resumeOverlay) resumeOverlay.style.display = 'none';
        lockPointer();
      });
    }

    const resumeMenuBtn = document.getElementById('resume-menu-btn');
    if (resumeMenuBtn) {
      resumeMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.returnToMainMenu();
      });
    }

    const reselectModeBtn = document.getElementById('reselect-mode-btn');
    if (reselectModeBtn) {
      reselectModeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.returnToMainMenu();
      });
    }

    this.container.addEventListener('click', (e) => {
      const isShopOpen = this.shopManager && this.shopManager.isOpen;
      const isTeamOpen = window.TeammateManager && window.TeammateManager.isOpen;
      const isSkinOpen = window.SkinManager && window.SkinManager.isOpen;
      const isChestOpen = window.player && (window.player.chestIsOpen || window.player.justClosedChest);
      const isBackpackOpen = window.player && (window.player.backpackIsOpen || window.player.justClosedBackpack);
      if (this.isGameRunning && !isShopOpen && !isTeamOpen && !isSkinOpen && !isChestOpen && !isBackpackOpen && document.pointerLockElement !== this.canvas) {
        if (!e.target.closest('#shop-modal') && !e.target.closest('#team-modal') && !e.target.closest('#start-screen') && !e.target.closest('#gameover-modal') && !e.target.closest('#chest-modal') && !e.target.closest('#backpack-modal')) {
          lockPointer();
        }
      }
    });

    // Pointer lock change listener
    document.addEventListener('pointerlockchange', () => {
      const isLocked = (document.pointerLockElement === this.canvas);
      if (this.player) {
        this.player.isRightMouseDown = false;
        this.player.stopMining();
      }

      if (!isLocked) {
        const isShopOpen = this.shopManager && (this.shopManager.isOpen || this.shopManager.justClosed);
        const isTeamOpen = window.TeammateManager && (window.TeammateManager.isOpen || window.TeammateManager.justClosed);
        const isSkinOpen = window.SkinManager && window.SkinManager.isOpen;
        const isChestOpen = window.player && (window.player.chestIsOpen || window.player.justClosedChest);
        const isBackpackOpen = window.player && (window.player.backpackIsOpen || window.player.justClosedBackpack);
        const isTouchActive = this.touchControls && this.touchControls.enabled;
        if (this.isGameRunning && !isShopOpen && !isTeamOpen && !isSkinOpen && !isChestOpen && !isBackpackOpen && !isTouchActive) {
          if (resumeOverlay) resumeOverlay.style.display = 'flex';
        }
      } else {
        if (resumeOverlay) resumeOverlay.style.display = 'none';
      }
    });

    document.addEventListener('pointerlockerror', () => {
      console.warn('Pointer lock error/throttled');
    });

    // Restart button in gameover modal
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        location.reload();
      });
    }
  }

  onBedDestroyed(team) {
    const teamNames = { red: '红队', blue: '蓝队', green: '绿队', yellow: '黄队' };
    const teamColors = { red: '§4', blue: '§9', green: '§a', yellow: '§e' };
    const tName = teamNames[team] || team;
    const tCol = teamColors[team] || '§c';

    if (team === 'red') {
      this.showBigBanner('§4你的床被摧毁了！', '你将无法再次复活！');
      this.addChatMessage('§4[起床战争] 红队的床已被敌人摧毁！红队成员将无法再次复活！');
    } else {
      this.bedsBroken++;
      this.showBigBanner(`${tCol}${tName}的床已被摧毁！`, '该队伍将无法再次复活！');
      this.addChatMessage(`${tCol}[起床战争] ${tName}的床已被破坏！${tName}成员将无法再次复活！`);
    }
    this.updateScoreboard();
    if (window.TeammateManager && window.TeammateManager.isOpen) {
      window.TeammateManager.renderModal();
    }
  }

  startSurvivalDuelPhase() {
    if (this.survivalDuelStarted) return;
    this.survivalDuelStarted = true;
    this.survivalDuelTimer = 0;

    // 1. Revive any participant currently waiting on 5s survival respawn so all 16 enter the 4-team duel!
    if (this.player && this.player.isDead) {
      this.player.respawn();
    }
    for (const bot of this.bots) {
      if (bot.isDead) bot.respawn();
    }

    // 2. Shuffle 15 bots and assign 4 teams of 4 (Player + 3 Red bots vs 4 Blue vs 4 Green vs 4 Yellow)
    const shuffled = [...this.bots].sort(() => Math.random() - 0.5);
    const teamList = ['red', 'blue', 'green', 'yellow'];
    this.teams = teamList;

    const teamSpawns = {
      red: new THREE.Vector3(0, 50.0, 18),
      blue: new THREE.Vector3(0, 50.0, -18),
      green: new THREE.Vector3(18, 50.0, 0),
      yellow: new THREE.Vector3(-18, 50.0, 0)
    };
    const teamYaws = { red: 0, blue: Math.PI, green: Math.PI / 2, yellow: -Math.PI / 2 };

    // Teleport Player (Red Team)
    if (this.player) {
      this.player.position.copy(teamSpawns.red);
      this.player.spawnPoint = teamSpawns.red.clone();
      this.player.velocity.set(0, 0, 0);
      this.player.yaw = teamYaws.red;
      this.player.health = this.player.maxHealth;
      this.player.updateHUD();
    }

    // Assign & teleport 15 Bots (first 3 -> red, next 4 -> blue, next 4 -> green, last 4 -> yellow)
    for (let i = 0; i < shuffled.length; i++) {
      const bot = shuffled[i];
      const assignedTeam = (i < 3) ? 'red' : (i < 7) ? 'blue' : (i < 11) ? 'green' : 'yellow';
      bot.team = assignedTeam;
      const baseSpawn = teamSpawns[assignedTeam];
      const offset = (i % 4) - 1.5;
      const bx = baseSpawn.x + (assignedTeam === 'red' || assignedTeam === 'blue' ? offset * 2.2 : 0);
      const bz = baseSpawn.z + (assignedTeam === 'green' || assignedTeam === 'yellow' ? offset * 2.2 : 0);
      bot.spawnPoint = new THREE.Vector3(bx, 50.0, bz);
      bot.position.set(bx, 50.0, bz);
      bot.velocity.set(0, 0, 0);
      bot.health = bot.maxHealth;
      bot.state = 'COMBAT';
      bot.currentTarget = null;
      bot.stateTimer = 0;
      bot.updateEquipmentVisuals();
      if (typeof bot.updateNametag === 'function') bot.updateNametag();
    }

    if (window.soundManager && typeof window.soundManager.playDing === 'function') {
      window.soundManager.playDing(500);
      setTimeout(() => window.soundManager.playDing(900), 150);
    }
    this.showBigBanner('§6★ 10分钟生存结束 · 4队决斗开启！ ★', '16人已分为 红/蓝/绿/黄 4队进入决斗场，最后存活队伍胜利！');
    this.addChatMessage('§6★ 【生存战争】10分钟发育阶段结束！全员已分为 §c红 §9蓝 §a绿 §e黄 §64支4人小队传送进入高空决斗场！');
    this.addChatMessage('§e决斗场内无法复活，最后存活下来的一组获得最终胜利！');
    this.updateScoreboard();
  }

  onFinalKill(team, bot, killer = null) {
    if (this.currentMode === 'survival_war') {
      if (killer && (killer.includes('玩家') || killer === '你')) {
        this.kills++;
      }
      const teamNames = { red: '红队', blue: '蓝队', green: '绿队', yellow: '黄队' };
      const tName = teamNames[team] || team;
      const victimName = bot ? bot.name : '你';
      const killerDisplay = killer ? `被 §f${killer} §e` : '';
      this.addChatMessage(`§e[决斗淘汰] §f[${tName}] ${victimName} §e${killerDisplay}淘汰出局！`);
      this.updateScoreboard();
      this.checkMatchOutcome();
      return;
    }

    if (this.currentMode === 'school_br') {
      let aliveBots = 0;
      for (const b of this.bots) {
        if (!b.isDead) aliveBots++;
      }
      const totalAlive = (this.player && !this.player.isDead ? 1 : 0) + aliveBots;

      if (killer && (killer.includes('玩家') || killer === '你')) {
        this.kills++;
      }

      const victimName = bot ? bot.name : (team === 'red' ? '你' : team);
      const killerDisplay = killer ? `被 §f${killer} §e` : '';
      this.addChatMessage(`§e[淘汰] §f${victimName} §e${killerDisplay}淘汰出局！(剩余 §c${totalAlive} §e人)`);

      this.updateScoreboard();
      this.checkMatchOutcome();
      return;
    }

    const teamNames = { red: '红队', blue: '蓝队', green: '绿队', yellow: '黄队' };
    const tName = teamNames[team] || team;

    // Check if player or player's teammate caused the kill
    this.finalKills++;
    this.kills++;

    // Count remaining alive members in this team
    let aliveCount = 0;
    if (team === 'red') {
      if (this.player && !this.player.isDead) aliveCount++;
      for (const b of this.bots) {
        if (b.team === 'red' && !b.isDead) aliveCount++;
      }
    } else {
      for (const b of this.bots) {
        if (b.team === team && !b.isDead) aliveCount++;
      }
    }

    if (aliveCount <= 0) {
      this.addChatMessage(`§c[队伍淘汰] ${tName} 已被完全淘汰出局！`);
    }

    this.updateScoreboard();

    // Check Victory / Defeat conditions
    this.checkMatchOutcome();
  }

  checkMatchOutcome() {
    if (this.currentMode === 'survival_war') {
      if (!this.survivalDuelStarted) return;
      let redAlive = (this.player && !this.player.isDead) ? 1 : 0;
      for (const b of this.bots) {
        if (b.team === 'red' && !b.isDead) redAlive++;
      }
      if (redAlive === 0) {
        this.defeat();
        return;
      }
      let anyEnemyAlive = false;
      for (const t of ['blue', 'green', 'yellow']) {
        for (const b of this.bots) {
          if (b.team === t && !b.isDead) {
            anyEnemyAlive = true;
            break;
          }
        }
        if (anyEnemyAlive) break;
      }
      if (!anyEnemyAlive) {
        this.victory();
      }
      return;
    }

    if (this.currentMode === 'school_br') {
      let aliveBots = 0;
      for (const b of this.bots) {
        if (!b.isDead) aliveBots++;
      }
      const playerAlive = (this.player && !this.player.isDead);

      if (!playerAlive) {
        this.defeat();
        return;
      }

      if (playerAlive && aliveBots === 0) {
        this.victory();
        return;
      }
      return;
    }

    // 1. Check if Red Team is eliminated
    const redBedDead = !this.world.bedStatus.red;
    let redAlive = 0;
    if (this.player && !this.player.isDead) redAlive++;
    for (const b of this.bots) {
      if (b.team === 'red' && !b.isDead) redAlive++;
    }

    if (redBedDead && redAlive === 0) {
      this.defeat();
      return;
    }

    // 2. Check if all enemy teams are eliminated
    let anyEnemyTeamAlive = false;
    for (const t of this.teams) {
      if (t === 'red') continue;
      const bedAlive = this.world.bedStatus[t];
      let membersAlive = 0;
      for (const b of this.bots) {
        if (b.team === t && !b.isDead) membersAlive++;
      }

      if (bedAlive || membersAlive > 0) {
        anyEnemyTeamAlive = true;
        break;
      }
    }

    if (!anyEnemyTeamAlive) {
      this.victory();
    }
  }

  victory() {
    this.isGameRunning = false;
    window.soundManager.playVictory();

    if (this.currentMode === 'survival_war') {
      this.showBigBanner('§6★ 生存战争 · 终极胜利！ ★', '红队成为4组决斗场最后存活的王者之师！');
      setTimeout(() => {
        if (document.exitPointerLock) document.exitPointerLock();
        const modal = document.getElementById('gameover-modal');
        const title = document.getElementById('modal-title');
        const stats = document.getElementById('modal-stats');
        if (modal && title && stats) {
          title.innerHTML = '§6★ 生存战争 · 终极胜利！ ★';
          stats.innerHTML = `
            🏆 获胜队伍: 红队 (4人小组)<br>
            ⚔️ 个人击杀: ${this.kills}<br>
            ⏱️ 比赛用时: ${Math.floor(this.matchTime)} 秒<br>
            成功在半径300格生存与4队决斗场中笑到最后！
          `;
          modal.style.display = 'block';
        }
      }, 2500);
      return;
    }

    if (this.currentMode === 'school_br') {
      this.showBigBanner('§6★ 大吉大利，今晚吃鸡！ ★', '你是校园大逃杀唯一幸存者！');
      setTimeout(() => {
        if (document.exitPointerLock) document.exitPointerLock();
        const modal = document.getElementById('gameover-modal');
        const title = document.getElementById('modal-title');
        const stats = document.getElementById('modal-stats');
        if (modal && title && stats) {
          title.innerHTML = '§6★ 大吉大利，今晚吃鸡！ ★';
          stats.innerHTML = `
            🏆 最终排名: #1 / 16 (吃鸡大赢家)<br>
            ⚔️ 淘汰击杀: ${this.kills}<br>
            ⏱️ 比赛用时: ${Math.floor(this.matchTime)} 秒<br>
            恭喜在操场与3层教学楼中成功称霸！
          `;
          modal.style.display = 'block';
        }
      }, 2500);
      return;
    }

    this.showBigBanner('§6★ 恭喜胜利！ ★', '所有敌方队伍均已被歼灭！');

    setTimeout(() => {
      if (document.exitPointerLock) document.exitPointerLock();
      const modal = document.getElementById('gameover-modal');
      const title = document.getElementById('modal-title');
      const stats = document.getElementById('modal-stats');
      if (modal && title && stats) {
        title.innerHTML = '§6★ 恭喜胜利！ ★';
        stats.innerHTML = `
          击杀数: ${this.kills}<br>
          最终击杀: ${this.finalKills}<br>
          破坏床数: ${this.bedsBroken}<br>
          比赛用时: ${Math.floor(this.matchTime)} 秒
        `;
        modal.style.display = 'block';
      }
    }, 2500);
  }

  defeat() {
    this.isGameRunning = false;

    if (this.currentMode === 'survival_war') {
      this.showBigBanner('§c红队全员阵亡！', '红队已被淘汰出决斗场！');
      setTimeout(() => {
        if (document.exitPointerLock) document.exitPointerLock();
        const modal = document.getElementById('gameover-modal');
        const title = document.getElementById('modal-title');
        const stats = document.getElementById('modal-stats');
        if (modal && title && stats) {
          title.innerHTML = '§c红队淘汰出局';
          stats.innerHTML = `
            个人击杀: ${this.kills}<br>
            存活用时: ${Math.floor(this.matchTime)} 秒
          `;
          modal.style.display = 'block';
        }
      }, 2500);
      return;
    }

    if (this.currentMode === 'school_br') {
      let aliveBots = 0;
      for (const b of this.bots) {
        if (!b.isDead) aliveBots++;
      }
      const rank = aliveBots + 1;
      this.showBigBanner('§c你已被淘汰！', `最终排名: #${rank} / 16`);

      setTimeout(() => {
        if (document.exitPointerLock) document.exitPointerLock();
        const modal = document.getElementById('gameover-modal');
        const title = document.getElementById('modal-title');
        const stats = document.getElementById('modal-stats');
        if (modal && title && stats) {
          title.innerHTML = '§c淘汰出局';
          stats.innerHTML = `
            最终排名: #${rank} / 16<br>
            淘汰击杀: ${this.kills}<br>
            存活用时: ${Math.floor(this.matchTime)} 秒
          `;
          modal.style.display = 'block';
        }
      }, 2500);
      return;
    }

    this.showBigBanner('§c游戏结束', '红队已被彻底淘汰！');

    setTimeout(() => {
      if (document.exitPointerLock) document.exitPointerLock();
      const modal = document.getElementById('gameover-modal');
      const title = document.getElementById('modal-title');
      const stats = document.getElementById('modal-stats');
      if (modal && title && stats) {
        title.innerHTML = '§c游戏失败';
        stats.innerHTML = `
          击杀数: ${this.kills}<br>
          最终击杀: ${this.finalKills}<br>
          破坏床数: ${this.bedsBroken}<br>
          比赛用时: ${Math.floor(this.matchTime)} 秒
        `;
        modal.style.display = 'block';
      }
    }, 2500);
  }

  showBigBanner(title, subtitle) {
    const banner = document.getElementById('big-banner');
    const tEl = document.getElementById('banner-title');
    const sEl = document.getElementById('banner-subtitle');
    if (!banner || !tEl || !sEl) return;

    tEl.innerHTML = this.parseMinecraftColors(title);
    sEl.innerHTML = this.parseMinecraftColors(subtitle);
    banner.style.display = 'block';

    setTimeout(() => {
      banner.style.display = 'none';
    }, 3500);
  }

  addChatMessage(text) {
    const chatBox = document.getElementById('chat-box');
    if (!chatBox) return;

    const msg = document.createElement('div');
    msg.className = 'chat-msg';
    msg.innerHTML = this.parseMinecraftColors(text);
    chatBox.appendChild(msg);

    while (chatBox.children.length > 9) {
      chatBox.removeChild(chatBox.firstChild);
    }
  }

  parseMinecraftColors(text) {
    const colorMap = {
      '0': '#000000', '1': '#0000AA', '2': '#00AA00', '3': '#00AAAA',
      '4': '#AA0000', '5': '#AA00AA', '6': '#FFAA00', '7': '#AAAAAA',
      '8': '#555555', '9': '#5555FF', 'a': '#55FF55', 'b': '#55FFFF',
      'c': '#FF5555', 'd': '#FF55FF', 'e': '#FFFF55', 'f': '#FFFFFF'
    };

    let result = '';
    let currentColor = '#FFFFFF';
    const parts = text.split('§');

    result += parts[0];
    for (let i = 1; i < parts.length; i++) {
      const code = parts[i][0];
      const rest = parts[i].slice(1);
      if (colorMap[code]) {
        currentColor = colorMap[code];
      }
      result += `<span style="color:${currentColor}">${rest}</span>`;
    }
    return result;
  }

  updateScoreboard() {
    const diaTimerEl = document.getElementById('sb-diamond-timer');
    const emeTimerEl = document.getElementById('sb-emerald-timer');
    const killsEl = document.getElementById('sb-kills');
    const finalKillsEl = document.getElementById('sb-final-kills');
    const bedsEl = document.getElementById('sb-beds');
    const teamsContainer = document.getElementById('sb-teams-container');

    if (this.currentMode === 'survival_war') {
      if (diaTimerEl && diaTimerEl.parentElement) diaTimerEl.parentElement.style.display = 'none';
      if (emeTimerEl && emeTimerEl.parentElement) emeTimerEl.parentElement.style.display = 'none';
      if (killsEl) killsEl.innerText = this.kills;
      if (finalKillsEl && finalKillsEl.parentElement) finalKillsEl.parentElement.style.display = 'none';
      if (bedsEl && bedsEl.parentElement) bedsEl.parentElement.style.display = 'none';

      if (teamsContainer) {
        if (!this.survivalDuelStarted) {
          const rem = Math.max(0, Math.ceil(this.survivalDuelTimer));
          const m = Math.floor(rem / 60);
          const s = String(rem % 60).padStart(2, '0');
          const r = this.player ? this.player.resources : {};
          teamsContainer.innerHTML = `
            <div style="font-size: 14px; font-weight: bold; color: #fbbf24; margin-bottom: 6px;">
              ⏳ 决斗场开启: <span style="color:#fff;">${m}:${s}</span>
            </div>
            <div style="font-size: 12px; color: #86efac; margin-bottom: 6px;">
              🌲 阶段: 原版生存 (按 <b>C</b>/右键工作台 · 右键熔炉炼矿)
            </div>
            <div style="font-size: 12px; color: #e2e8f0; line-height: 1.6;">
              🪵 木材: <b>${r.wood || 0}</b> &nbsp; 🪨 圆石: <b>${r.cobble || 0}</b><br>
              ⚫ 煤炭: <b>${r.coal || 0}</b> &nbsp; 🪨 粗铁/粗金: <b>${r.raw_iron || 0}/${r.raw_gold || 0}</b><br>
              ⚙️ 铁锭: <b>${r.iron || 0}</b> &nbsp; 🪙 金锭: <b>${r.gold || 0}</b><br>
              💎 钻石: <b>${r.diamond || 0}</b> &nbsp; 🍎 苹果: <b>${r.apple || 0}</b>
            </div>
          `;
        } else {
          const teamLabels = {
            red: '[R] 红队 (你)',
            blue: '[B] 蓝队',
            green: '[G] 绿队',
            yellow: '[Y] 黄队'
          };
          let html = '<div style="font-size: 13px; font-weight: bold; color: #f87171; margin-bottom: 6px;">⚔️ 决斗场 · 4队决战</div>';
          for (const t of ['red', 'blue', 'green', 'yellow']) {
            let alive = (t === 'red' && this.player && !this.player.isDead) ? 1 : 0;
            for (const b of this.bots) {
              if (b.team === t && !b.isDead) alive++;
            }
            const statusHtml = alive > 0
              ? `<span style="color:#ffff55; font-weight:bold;">${alive} 人存活</span>`
              : `<span class="sb-status-dead">✘ 淘汰</span>`;
            html += `<div class="sb-team ${t}"><span>${teamLabels[t]}:</span>${statusHtml}</div>`;
          }
          teamsContainer.innerHTML = html;
        }
      }
      return;
    }

    if (this.currentMode === 'school_br') {
      let aliveBots = 0;
      for (const b of this.bots) {
        if (!b.isDead) aliveBots++;
      }
      const totalAlive = (this.player && !this.player.isDead ? 1 : 0) + aliveBots;

      if (diaTimerEl && diaTimerEl.parentElement) diaTimerEl.parentElement.style.display = 'none';
      if (emeTimerEl && emeTimerEl.parentElement) emeTimerEl.parentElement.style.display = 'none';
      if (killsEl) killsEl.innerText = this.kills;
      if (finalKillsEl && finalKillsEl.parentElement) finalKillsEl.parentElement.style.display = 'none';
      if (bedsEl && bedsEl.parentElement) bedsEl.parentElement.style.display = 'none';

      if (teamsContainer) {
        let html = `
          <div style="font-size: 14px; font-weight: bold; color: #67e8f9; margin-bottom: 6px;">
            👥 存活人数: <span style="color: #ffff55;">${totalAlive} / 16</span>
          </div>
          <div style="font-size: 13px; color: #ffaa00; margin-bottom: 4px;">
            ⚔️ 击败敌人数: <span style="color: #fff; font-weight: bold;">${this.kills}</span>
          </div>
          <div style="font-size: 12px; color: #aaa;">
            ⏱️ 比赛用时: <span style="color: #fff;">${Math.floor(this.matchTime)} 秒</span>
          </div>
        `;
        teamsContainer.innerHTML = html;
      }
      return;
    }

    if (diaTimerEl && diaTimerEl.parentElement) diaTimerEl.parentElement.style.display = 'block';
    if (emeTimerEl && emeTimerEl.parentElement) emeTimerEl.parentElement.style.display = 'block';
    if (finalKillsEl && finalKillsEl.parentElement) finalKillsEl.parentElement.style.display = 'block';
    if (bedsEl && bedsEl.parentElement) bedsEl.parentElement.style.display = 'block';

    if (diaTimerEl) diaTimerEl.innerText = `0:${String(Math.ceil(this.diamondTimer)).padStart(2, '0')}`;
    if (emeTimerEl) emeTimerEl.innerText = `0:${String(Math.ceil(this.emeraldTimer)).padStart(2, '0')}`;
    if (killsEl) killsEl.innerText = this.kills;
    if (finalKillsEl) finalKillsEl.innerText = this.finalKills;
    if (bedsEl) bedsEl.innerText = this.bedsBroken;

    if (teamsContainer) {
      const teamLabels = {
        red: '[R] 红队 (你)',
        blue: '[B] 蓝队',
        green: '[G] 绿队',
        yellow: '[Y] 黄队'
      };

      let html = '';
      for (const t of this.teams) {
        const bedAlive = this.world ? this.world.bedStatus[t] : true;
        let membersAlive = 0;

        if (t === 'red') {
          if (this.player && !this.player.isDead) membersAlive++;
          for (const b of this.bots) {
            if (b.team === 'red' && !b.isDead) membersAlive++;
          }
        } else {
          for (const b of this.bots) {
            if (b.team === t && !b.isDead) membersAlive++;
          }
        }

        let statusHtml = '';
        if (bedAlive) {
          statusHtml = '<span class="sb-status-alive">✔</span>';
        } else if (membersAlive > 0) {
          statusHtml = `<span style="color:#ffff55">${membersAlive}</span>`;
        } else {
          statusHtml = '<span class="sb-status-dead">✘</span>';
        }

        html += `
          <div class="sb-team ${t}">
            <span>${teamLabels[t] || t}:</span>
            ${statusHtml}
          </div>
        `;
      }

      // End Map Boss Countdown / Live Status Display
      if (this.currentMap === 'end') {
        let bossStatusHtml = '';
        if (!this.endBossSpawned) {
          const remSec = Math.max(0, Math.ceil(300 - this.matchTime));
          const m = Math.floor(remSec / 60);
          const s = String(remSec % 60).padStart(2, '0');
          bossStatusHtml = `
            <div style="font-size: 13px; color: #c084fc; margin-top: 6px; padding-top: 6px; border-top: 1px dashed rgba(192, 132, 252, 0.4);">
              🟣 领主初临: <span style="color:#fdf4ff; font-weight:bold;">${m}:${s}</span>
            </div>
          `;
        } else if (this.endBoss && !this.endBoss.isDead) {
          bossStatusHtml = `
            <div style="font-size: 13px; color: #ec4899; margin-top: 6px; padding-top: 6px; border-top: 1px dashed rgba(236, 72, 153, 0.4);">
              👑 末地领主: <span style="color:#f0abfc; font-weight:bold;">${Math.max(0, Math.round(this.endBoss.health))}/${this.endBoss.maxHealth || 500} HP</span>
            </div>
          `;
        } else if (this.endBossIsRespawning) {
          const remSec = Math.max(0, Math.ceil(this.endBossRespawnTimer));
          const m = Math.floor(remSec / 60);
          const s = String(remSec % 60).padStart(2, '0');
          bossStatusHtml = `
            <div style="font-size: 13px; color: #c084fc; margin-top: 6px; padding-top: 6px; border-top: 1px dashed rgba(192, 132, 252, 0.4);">
              🟣 领主复活: <span style="color:#fdf4ff; font-weight:bold;">${m}:${s}</span>
            </div>
          `;
        } else {
          bossStatusHtml = `
            <div style="font-size: 13px; color: #94a3b8; margin-top: 6px; padding-top: 6px; border-top: 1px dashed rgba(148, 163, 184, 0.4);">
              👑 末地领主: <span style="color:#22c55e; font-weight:bold;">☠ 已讨伐</span>
            </div>
          `;
        }
        html += bossStatusHtml;
      }

      teamsContainer.innerHTML = html;
    }
  }

  start() {
    const loop = (timestamp) => {
      if (!this.lastTime || isNaN(this.lastTime)) this.lastTime = timestamp;
      const rawDt = (timestamp - this.lastTime) / 1000;
      const dt = Math.max(0.001, Math.min(isNaN(rawDt) ? 0.016 : rawDt, 0.04));
      this.lastTime = timestamp;

      if (this.isGameRunning) {
        this.matchTime += dt;

        // Survival War 10-minute (600s) Survival -> 4-Team Duel Arena Transition
        if (this.currentMode === 'survival_war' && !this.survivalDuelStarted) {
          const prevSec = Math.ceil(this.survivalDuelTimer);
          this.survivalDuelTimer -= dt;
          const curSec = Math.ceil(this.survivalDuelTimer);
          if (curSec !== prevSec && (curSec === 300 || curSec === 60 || curSec === 10 || (curSec <= 5 && curSec >= 1))) {
            this.addChatMessage(`§e[生存战争] 距离 4 队决斗场开启还有 §c${curSec} §e秒！`);
            if (window.soundManager && typeof window.soundManager.playBeep === 'function') {
              window.soundManager.playBeep();
            }
          }
          if (this.survivalDuelTimer <= 0) {
            this.startSurvivalDuelPhase();
          }
        }

        if (this.currentMode === 'survival_war' && window.survivalUI) {
          window.survivalUI.updateFurnaces(dt);
        }

        // End Realm Boss initial awakening: 5 minutes (300 seconds) after match starts
        if (this.currentMap === 'end' && !this.endBossSpawned && this.matchTime >= 300) {
          this.spawnEndBoss(false);
        }

        // End Realm Boss Respawn cooldown timer (revives after 2 minutes)
        if (this.currentMap === 'end' && this.endBossIsRespawning) {
          this.endBossRespawnTimer -= dt;
          if (this.endBossRespawnTimer <= 0) {
            this.endBossRespawnTimer = 0;
            this.endBossIsRespawning = false;
            this.spawnEndBoss(true);
          }
        }

        this.diamondTimer = Math.max(0, this.diamondTimer - dt);
        if (this.diamondTimer <= 0) this.diamondTimer = 12;

        this.emeraldTimer = Math.max(0, this.emeraldTimer - dt);
        if (this.emeraldTimer <= 0) this.emeraldTimer = 15;

        // Team Heal Pool Upgrade (Regen 1 HP every 1.5s when near base bed)
        this.healPoolTimer += dt;
        if (this.healPoolTimer >= 1.5) {
          this.healPoolTimer = 0;
          if (this.teamUpgrades.red.healPool && this.player && !this.player.isDead) {
            const dHome = Math.hypot(this.player.position.x - 0, this.player.position.z - 36);
            if (dHome < 14.0 && this.player.health < 20) {
              this.player.health = Math.min(20, this.player.health + 1);
              this.player.updateHUD();
            }
          }
        }

        // Team Alarm Trap Upgrade (Detects and slows enemies approaching Red Bed)
        if (this.teamUpgrades.red.trap && this.bots) {
          for (const b of this.bots) {
            if (b.team !== 'red' && !b.isDead) {
              const dBed = Math.hypot(b.position.x - 0, b.position.z - 40);
              if (dBed < 9.0) {
                this.teamUpgrades.red.trap = false;
                b.velocity.multiplyScalar(0.3);
                if (window.soundManager && typeof window.soundManager.playDing === 'function') {
                  window.soundManager.playDing();
                }
                this.addChatMessage('§c[警戒陷阱] 警告：敌方正在逼近红队的床！目标已受到减速！');
                break;
              }
            }
          }
        }

        // 1. Update Player
        if (this.player) {
          this.player.update(dt);
        }

        // 2. Update Bots
        for (const bot of this.bots) {
          bot.update(dt, this.player, this.bots);
        }

        // 3. Update Generators
        if (this.generatorManager) {
          this.generatorManager.update(dt, this.player, this.bots);
        }

        // 4. Update World Particles & NPC Nametags
        if (this.world) {
          this.world.update(dt);
        }
        if (this.shopManager && this.shopManager.update) {
          this.shopManager.update(this.camera);
        }

        // 5. Update Scoreboard (throttled to 5 times/sec to eliminate DOM reflow lag)
        this.sbTimer += dt;
        if (this.sbTimer >= 0.2) {
          this.sbTimer = 0;
          this.updateScoreboard();
        }
      }

      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }
}

function initGameInstance() {
  if (!window.game) {
    window.game = new BedwarsGame();
    window.game.start();
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initGameInstance);
} else {
  initGameInstance();
}
