// Autonomous Minecraft Bedwars Bot (High-IQ AI Opponent with Pro PVP Mechanics)
class Bot {
  constructor(scene, world, config = {}) {
    this.scene = scene;
    this.world = world;

    this.id = config.id || 'bot_1';
    this.name = config.name || '人机';
    this.team = config.team || 'blue'; // 'red', 'blue', 'green', 'yellow'
    this.difficulty = config.difficulty || 'normal'; // 'normal', 'hard', 'nightmare'
    this.isTeammate = (this.team === 'red');

    // Team metadata & coordinates
    this.teamData = {
      red: {
        name: '红队',
        colorStr: '#d32f2f',
        colorHex: 0xd32f2f,
        prefix: '§c',
        spawn: new THREE.Vector3(2, 0.6, 56),
        gen: new THREE.Vector3(0, 0.6, 47),
        shop: new THREE.Vector3(-6, 0.5, 56),
        bed: new THREE.Vector3(0, 1, 62),
        wool: 'RED_WOOL',
        bedType: 'BED_RED'
      },
      blue: {
        name: '蓝队',
        colorStr: '#1e56a0',
        colorHex: 0x1e56a0,
        prefix: '§9',
        spawn: new THREE.Vector3(0, 0.6, -56),
        gen: new THREE.Vector3(0, 0.6, -47),
        shop: new THREE.Vector3(6, 0.5, -56),
        bed: new THREE.Vector3(0, 1, -62),
        wool: 'BLUE_WOOL',
        bedType: 'BED_BLUE'
      },
      green: {
        name: '绿队',
        colorStr: '#2e9e2e',
        colorHex: 0x2e9e2e,
        prefix: '§a',
        spawn: new THREE.Vector3(56, 0.6, 0),
        gen: new THREE.Vector3(47, 0.6, 0),
        shop: new THREE.Vector3(56, 0.5, -6),
        bed: new THREE.Vector3(62, 1, 0),
        wool: 'GREEN_WOOL',
        bedType: 'BED_GREEN'
      },
      yellow: {
        name: '黄队',
        colorStr: '#d4be17',
        colorHex: 0xd4be17,
        prefix: '§e',
        spawn: new THREE.Vector3(-56, 0.6, 0),
        gen: new THREE.Vector3(-47, 0.6, 0),
        shop: new THREE.Vector3(-56, 0.5, 6),
        bed: new THREE.Vector3(-62, 1, 0),
        wool: 'YELLOW_WOOL',
        bedType: 'BED_YELLOW'
      }
    };

    const myTeam = this.teamData[this.team] || this.teamData.blue;
    if (config.initialBedPos) {
      myTeam.bed = new THREE.Vector3(config.initialBedPos.x, config.initialBedPos.y, config.initialBedPos.z);
    }
    this.spawnPoint = config.spawnPos ?
      new THREE.Vector3(config.spawnPos.x, config.spawnPos.y, config.spawnPos.z) :
      myTeam.spawn.clone();

    // Position & Physics
    this.position = this.spawnPoint.clone();
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.yaw = 0;
    this.targetYaw = 0;
    this.pitch = 0;
    this.walkTimer = 0;
    this.onGround = false;
    this.isDead = false;

    // Stats & Difficulty Tuning
    this.maxHealth = 20;
    this.health = 20;

    let speedMult = 1.0;
    if (this.difficulty === 'hard') speedMult = 1.12;
    else if (this.difficulty === 'nightmare') speedMult = 1.25;

    this.speed = 4.3 * speedMult;
    this.sprintSpeed = 5.5 * speedMult;
    this.jumpForce = 8.5;
    this.gravity = 26.0;

    // Combat attributes (Authentic MC 1.8 fast PVP damage)
    this.critChance = this.difficulty === 'nightmare' ? 0.65 : (this.difficulty === 'hard' ? 0.45 : 0.25);
    this.baseAttackInterval = this.difficulty === 'nightmare' ? 0.46 : (this.difficulty === 'hard' ? 0.58 : 0.75);

    // Equipment & Inventory (Starts with basic Wooden Sword & Leather Tunic, fair identical to player)
    this.armorTier = 'leather'; // 'leather', 'chain', 'iron', 'diamond'
    this.armorSlots = null;     // Per-piece armor for Survival War: { helmet, chestplate, leggings, boots }
    this.weaponTier = 'wood'; // 'wood', 'stone', 'iron', 'diamond'
    this.damage = 4;
    this.woolCount = 36;
    this.goldenApples = config.goldenApples !== undefined ? config.goldenApples : (config.hasGapple !== undefined ? config.hasGapple : 0);
    this.fireballs = 0;
    this.hasShears = false;
    this.hasDefendedBed = false;
    this.pickaxeTier = 'none'; // 'none', 'wood', 'iron', 'diamond'
    this.bedDefenseMaterials = { obsidian: 0, end_stone: 0, wood: 0 };
    this.bedDefenseTier = 0; // 0: None, 1: Wool, 2: Wood, 3: End Stone, 4: Obsidian
    this.needsBedUpgrade = false;
    this.miningBlock = null; // { x, y, z, type, timer, requiredTime, lastSound }
    this._lastBedHitSound = 0;
    this.hasBow = config.hasBow !== undefined ? config.hasBow : false;
    this.arrowCount = config.arrowCount !== undefined ? config.arrowCount : (this.hasBow ? 32 : 0);
    this.bowCooldown = 0;

    // Resources
    this.resources = {
      iron: 0,
      gold: 0,
      diamond: 0,
      emerald: 0
    };

    // Advanced PVP Variables
    this.strafeDir = Math.random() < 0.5 ? 1 : -1;
    this.strafeTimer = 0;
    this.strafeChangeInterval = this.difficulty === 'nightmare' ? 0.6 : (this.difficulty === 'hard' ? 0.9 : 1.4);
    this.jumpCooldown = 0;
    this.attackCooldown = 0;
    this.healCooldown = 0;
    this.fireballCooldown = 0;
    this.mineBedTimer = 0;
    this.wTapTimer = 0;

    // Tactical Role for Teammates: 'AUTO', 'DEFEND_BED', 'GATHER_RESOURCES', 'ATTACK_BED', 'FOLLOW'
    this.tacticalRole = config.tacticalRole || 'AUTO';
    this.shareCooldown = 0;
    this.patrolTimer = 0;
    this.patrolTarget = 'bed';

    // AI States: 'GATHER', 'SHOP', 'DEFEND_BED', 'BRIDGE', 'ATTACK_BED', 'COMBAT', 'GATHER_DIAMOND', 'GATHER_EMERALD', 'PATROL_BASE', 'FOLLOW_PLAYER', 'LOOT_CHEST', 'BRIDGE_MID'
    this.spawnChestPos = config.spawnChestPos || null;
    this.state = config.initialState || 'GATHER';
    if (config.initialWeapon) this.weaponTier = config.initialWeapon;
    if (config.initialArmor) this.armorTier = config.initialArmor;
    if (config.hasGapple !== undefined) {
      this.hasGapple = config.hasGapple;
      this.goldenApples = config.hasGapple;
    }
    if (config.hasBow !== undefined) {
      this.hasBow = config.hasBow;
      if (this.arrowCount === 0 && this.hasBow) this.arrowCount = 32;
    }
    this.stateTimer = 0;
    this.currentTarget = null; // Either player or enemy bot

    // Anti-Stuck watchdog
    this.lastPos = this.position.clone();
    this.stuckTimer = 0;
    this.aiTickTimer = 0;    // Throttle AI ticks to reduce CPU load
    this.nametagTimer = 0;   // Throttle nametag canvas redraws

    // 3D Model
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.initModel();

    // Nametag
    this.initNametag();
    this.updateEquipmentVisuals();
  }

  initModel() {
    const skinMat = new THREE.MeshLambertMaterial({
      map: TextureGenerator.getBotSkin(this.team)
    });

    const myTeam = this.teamData[this.team] || this.teamData.blue;

    // Head
    const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    this.headMesh = new THREE.Mesh(headGeo, skinMat);
    this.headMesh.position.set(0, 1.55, 0);
    this.headMesh.castShadow = true;
    this.group.add(this.headMesh);

    // 3D Helmet Layer (Visually distinct for each armor tier)
    const helmetGeo = new THREE.BoxGeometry(0.56, 0.32, 0.56);
    this.helmetMat = new THREE.MeshLambertMaterial({ color: myTeam.colorHex });
    this.helmetMesh = new THREE.Mesh(helmetGeo, this.helmetMat);
    this.helmetMesh.position.set(0, 0.16, 0);
    this.headMesh.add(this.helmetMesh);

    // Torso (Armor)
    const torsoGeo = new THREE.BoxGeometry(0.6, 0.75, 0.3);
    this.armorMat = new THREE.MeshLambertMaterial({ color: myTeam.colorHex });
    this.torsoMesh = new THREE.Mesh(torsoGeo, this.armorMat);
    this.torsoMesh.position.set(0, 0.95, 0);
    this.torsoMesh.castShadow = true;
    this.group.add(this.torsoMesh);

    // Team Identity Trim: Belt & Shoulder Insignia (Preserves Team Color even with Iron/Diamond armor)
    this.teamTrimMat = new THREE.MeshLambertMaterial({ color: myTeam.colorHex });
    this.beltMesh = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.12, 0.32), this.teamTrimMat);
    this.beltMesh.position.set(0, -0.32, 0);
    this.torsoMesh.add(this.beltMesh);

    // Arms (Rigged to rotate cleanly around Shoulder Joints)
    const armGeo = new THREE.BoxGeometry(0.24, 0.72, 0.24);
    armGeo.translate(0, -0.36, 0); // Pivot point at shoulder top!

    this.leftArm = new THREE.Mesh(armGeo, this.armorMat);
    this.leftArm.position.set(-0.42, 1.28, 0);
    this.group.add(this.leftArm);

    this.shoulderLeft = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.28), this.teamTrimMat);
    this.shoulderLeft.position.set(0, -0.05, 0);
    this.leftArm.add(this.shoulderLeft);

    this.rightArm = new THREE.Mesh(armGeo, this.armorMat);
    this.rightArm.position.set(0.42, 1.28, 0);
    this.group.add(this.rightArm);

    this.shoulderRight = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.28), this.teamTrimMat);
    this.shoulderRight.position.set(0, -0.05, 0);
    this.rightArm.add(this.shoulderRight);

    // Sword in right hand (Starts with Wooden Sword)
    if (window.WeaponModelBuilder) {
      this.swordMesh = window.WeaponModelBuilder.createSword(this.weaponTier || 'wood', { isBot: true });
    } else {
      const swordGeo = new THREE.BoxGeometry(0.06, 0.5, 0.03);
      this.swordMat = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
      this.swordMesh = new THREE.Mesh(swordGeo, this.swordMat);
    }
    if (this.swordMesh) {
      this.swordMesh.position.set(0, -0.58, 0.20);
      this.swordMesh.rotation.x = -Math.PI / 3;
    }
    this.rightArm.add(this.swordMesh);

    // Legs (Rigged to rotate cleanly around Hip Joints)
    const legGeo = new THREE.BoxGeometry(0.26, 0.72, 0.26);
    legGeo.translate(0, -0.36, 0); // Pivot point at hip top!
    this.legMat = new THREE.MeshLambertMaterial({ color: 0x153570 });
    this.leftLeg = new THREE.Mesh(legGeo, this.legMat);
    this.leftLeg.position.set(-0.16, 0.72, 0);
    this.group.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeo, this.legMat);
    this.rightLeg.position.set(0.16, 0.72, 0);
    this.group.add(this.rightLeg);

    // Apply custom or preset skin from SkinManager
    if (window.SkinManager && typeof window.SkinManager.applySkinToBot === 'function') {
      window.SkinManager.applySkinToBot(this);
    }
  }

  initNametag() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, 512, 128);

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;

    const mat = new THREE.SpriteMaterial({ 
      map: tex, 
      transparent: true,
      depthTest: true 
    });
    this.nametag = new THREE.Sprite(mat);
    this.nametag.scale.set(1.6, 0.40, 1);
    this.nametag.position.set(0, 2.22, 0);
    this.group.add(this.nametag);
    this.updateNametag(true);
  }

  updateNametag(force = false) {
    const now = performance.now();
    if (!force && this._lastNametagUpdate && now - this._lastNametagUpdate < 150) return;
    this._lastNametagUpdate = now;

    if (!this.nametag || !this.nametag.material || !this.nametag.material.map) return;
    const canvas = this.nametag.material.map.image;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 512, 128);

    // Dark pill container
    ctx.fillStyle = 'rgba(10, 10, 12, 0.82)';
    this.roundRect(ctx, 8, 8, 496, 112, 16, true, false);

    const myTeam = this.teamData[this.team] || this.teamData.blue;

    // Team-colored outer border
    ctx.lineWidth = 3;
    ctx.strokeStyle = myTeam.colorStr;
    this.roundRect(ctx, 8, 8, 496, 112, 16, false, true);

    // Line 1: Bot Team, Name, Role, Equipment
    ctx.font = 'bold 30px "Minecraft", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';

    const swordName = this.weaponTier === 'mace' ? '重锤' : (this.weaponTier === 'diamond' ? '钻剑' : (this.weaponTier === 'iron' ? '铁剑' : (this.weaponTier === 'stone' ? '石剑' : '木剑')));
    let armorName = this.armorTier === 'diamond' ? '钻甲' : (this.armorTier === 'iron' ? '铁甲' : (this.armorTier === 'chain' ? '链甲' : '皮甲'));
    if (this.armorSlots) {
      const vals = Object.values(this.armorSlots).filter(v => v !== 'none');
      if (vals.length === 0) armorName = '无甲';
      else if (vals.every(v => v === 'diamond') && vals.length === 4) armorName = '全钻';
      else if (vals.includes('diamond') && vals.includes('iron')) armorName = '铁钻';
      else if (vals.includes('diamond')) armorName = '半钻';
      else if (vals.includes('iron')) armorName = '铁甲';
      else armorName = '链甲';
    }
    let roleTag = '';
    if (this.isTeammate) {
      const roleNameMap = {
        DEFEND_BED: '[守床]',
        GATHER_RESOURCES: '[抢资源]',
        ATTACK_BED: '[突袭]',
        FOLLOW: '[掩护]',
        AUTO: '[队友]'
      };
      roleTag = ` ${roleNameMap[this.tacticalRole] || '[队友]'}`;
    }
    let nameLine = `[${this.team.toUpperCase()[0]}] ${this.name}${roleTag} [${swordName}/${armorName}]`;
    let nameColor = myTeam.colorStr;
    if (window.game && window.game.currentMode === 'school_br') {
      nameLine = `🐔 ${this.name} [${swordName}/${armorName}]`;
      nameColor = '#ffdd44';
    }

    // High contrast black text outline
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#000000';
    ctx.strokeText(nameLine, 256, 48);

    ctx.fillStyle = nameColor;
    ctx.fillText(nameLine, 256, 48);

    // Line 2: HP Bar + Large Numeric HP
    const curHp = Math.max(0, this.health);
    const maxHp = this.maxHealth;
    const hpPct = Math.max(0, Math.min(1, curHp / maxHp));

    const barX = 55;
    const barY = 66;
    const barW = 230;
    const barH = 28;

    // Health bar container
    ctx.fillStyle = 'rgba(25, 25, 25, 0.95)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barW, barH);

    // Health bar fill with vivid colors
    const hpColor = curHp > 10 ? '#44ff44' : (curHp > 5 ? '#ffff33' : '#ff3333');
    ctx.fillStyle = hpColor;
    if (hpPct > 0) {
      ctx.fillRect(barX + 2, barY + 2, (barW - 4) * hpPct, barH - 4);
    }

    // HP Text
    const hpText = `HP ${curHp}/${maxHp}`;
    ctx.font = 'bold 26px "Minecraft", "Segoe UI", sans-serif';
    ctx.textAlign = 'left';

    ctx.lineWidth = 4;
    ctx.strokeStyle = '#000000';
    ctx.strokeText(hpText, barX + barW + 18, barY + 22);

    ctx.fillStyle = hpColor;
    ctx.fillText(hpText, barX + barW + 18, barY + 22);

    this.nametag.material.map.needsUpdate = true;
  }

  roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  updateEquipmentVisuals() {
    // 1. Visually Distinct Armor Colors per Tier & Team
    const myTeam = this.teamData[this.team] || this.teamData.blue;

    const tierColors = {
      chain: { helmet: 0x607d8b, chest: 0x78909c, legs: 0x455a64 },
      iron: { helmet: 0xf8fafc, chest: 0xe2e8f0, legs: 0xb0bec5 },
      diamond: { helmet: 0x00e5ff, chest: 0x00d4ec, legs: 0x0097a7 }
    };

    if (this.armorSlots) {
      // Piece-by-piece survival armor rendering (1 piece crafted = only that piece shown!)
      const s = this.armorSlots;
      this.flashMeshColor(this.headMesh, 0xffffff);
      if (this.helmetMesh) {
        this.helmetMesh.visible = (s.helmet !== 'none');
        if (s.helmet !== 'none' && this.helmetMat && tierColors[s.helmet]) {
          this.helmetMat.color.setHex(tierColors[s.helmet].helmet);
        }
      }
      if (s.chestplate !== 'none' && tierColors[s.chestplate]) {
        this.armorMat.color.setHex(tierColors[s.chestplate].chest);
        this.torsoMesh.material = this.armorMat;
      } else if (this.customSkinMats && this.customSkinMats.torso) {
        this.torsoMesh.material = this.customSkinMats.torso;
        this.flashMeshColor(this.torsoMesh, 0xffffff);
      }
      const legTier = s.leggings !== 'none' ? s.leggings : s.boots;
      if (legTier !== 'none' && tierColors[legTier]) {
        this.legMat.color.setHex(tierColors[legTier].legs);
        this.leftLeg.material = this.legMat;
        this.rightLeg.material = this.legMat;
      } else if (this.customSkinMats) {
        if (this.customSkinMats.leftLeg) { this.leftLeg.material = this.customSkinMats.leftLeg; this.flashMeshColor(this.leftLeg, 0xffffff); }
        if (this.customSkinMats.rightLeg) { this.rightLeg.material = this.customSkinMats.rightLeg; this.flashMeshColor(this.rightLeg, 0xffffff); }
      }
      if (this.customSkinMats) {
        if (this.customSkinMats.leftArm) { this.leftArm.material = this.customSkinMats.leftArm; this.flashMeshColor(this.leftArm, 0xffffff); }
        if (this.customSkinMats.rightArm) { this.rightArm.material = this.customSkinMats.rightArm; this.flashMeshColor(this.rightArm, 0xffffff); }
      }
      this.updateNametag();
      return;
    }

    const isLeather = (this.armorTier === 'leather');
    let helmetColor = myTeam.colorHex;
    let armorColor = myTeam.colorHex;
    let legColor = 0x2a2421;

    if (this.armorTier === 'chain') {
      // Chainmail: gunmetal steel grey coif, tunic & leggings
      helmetColor = 0x607d8b;
      armorColor = 0x78909c;
      legColor = 0x455a64;
    } else if (this.armorTier === 'iron') {
      // Iron Armor: brilliant gleaming silver-white plate armor
      helmetColor = 0xf8fafc;
      armorColor = 0xe2e8f0;
      legColor = 0xb0bec5;
    } else if (this.armorTier === 'diamond') {
      // Diamond Armor: radiant saturated cyan-aqua diamond armor
      helmetColor = 0x00e5ff;
      armorColor = 0x00d4ec;
      legColor = 0x0097a7;
    } else {
      // Leather Armor: dyed in vibrant team colors
      helmetColor = myTeam.colorHex;
      armorColor = myTeam.colorHex;
      legColor = 0x2e2722;
    }

    // Helmet mesh: hide on leather/basic armor so custom skin hair/hat is visible!
    if (this.helmetMesh) {
      this.helmetMesh.visible = !isLeather;
    }
    if (this.helmetMat) this.helmetMat.color.setHex(helmetColor);

    // Reset skin face materials to pure white (so damage flash red is cleared!)
    this.flashMeshColor(this.headMesh, 0xffffff);

    if (isLeather && this.customSkinMats) {
      // When wearing basic gear, display full custom skin textures
      if (this.customSkinMats.torso) this.torsoMesh.material = this.customSkinMats.torso;
      if (this.customSkinMats.leftArm) this.leftArm.material = this.customSkinMats.leftArm;
      if (this.customSkinMats.rightArm) this.rightArm.material = this.customSkinMats.rightArm;
      if (this.customSkinMats.leftLeg) this.leftLeg.material = this.customSkinMats.leftLeg;
      if (this.customSkinMats.rightLeg) this.rightLeg.material = this.customSkinMats.rightLeg;

      // Clear any damage flash tint on custom skin materials
      this.flashMeshColor(this.torsoMesh, 0xffffff);
      this.flashMeshColor(this.leftArm, 0xffffff);
      this.flashMeshColor(this.rightArm, 0xffffff);
      this.flashMeshColor(this.leftLeg, 0xffffff);
      this.flashMeshColor(this.rightLeg, 0xffffff);
    } else {
      // Upgraded armor plates
      this.armorMat.color.setHex(armorColor);
      this.torsoMesh.material = this.armorMat;
      this.legMat.color.setHex(legColor);
      this.leftLeg.material = this.legMat;
      this.rightLeg.material = this.legMat;
      if (this.customSkinMats) {
        if (this.customSkinMats.leftArm) {
          this.leftArm.material = this.customSkinMats.leftArm;
          this.flashMeshColor(this.leftArm, 0xffffff);
        }
        if (this.customSkinMats.rightArm) {
          this.rightArm.material = this.customSkinMats.rightArm;
          this.flashMeshColor(this.rightArm, 0xffffff);
        }
      }
    }

    if (this.teamTrimMat) this.teamTrimMat.color.setHex(myTeam.colorHex);

    // 2. Weapon 3D Model & Damage
    if (this.weaponTier === 'mace') {
      this.damage = 6;
    } else if (this.weaponTier === 'stone') {
      this.damage = 5;
    } else if (this.weaponTier === 'iron') {
      this.damage = 6;
    } else if (this.weaponTier === 'diamond') {
      this.damage = 7;
    } else {
      this.damage = 4;
    }

    if (this.rightArm) {
      if (this.swordMesh && this.swordMesh.parent) {
        this.swordMesh.parent.remove(this.swordMesh);
      }
      const isEnchanted = !!(window.game && window.game.teamUpgrades && window.game.teamUpgrades[this.team] && window.game.teamUpgrades[this.team].sharpness > 0);
      if (this.weaponTier === 'mace') {
        this.swordMesh = window.WeaponModelBuilder ? window.WeaponModelBuilder.createMace({ isBot: true }) : null;
      } else if (window.WeaponModelBuilder) {
        this.swordMesh = window.WeaponModelBuilder.createSword(this.weaponTier, { isBot: true, enchanted: isEnchanted });
      } else {
        const swordGeo = new THREE.BoxGeometry(0.06, 0.5, 0.03);
        this.swordMat = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
        this.swordMesh = new THREE.Mesh(swordGeo, this.swordMat);
      }
      if (this.swordMesh) {
        this.swordMesh.position.set(0, -0.58, 0.20);
        this.swordMesh.rotation.x = -Math.PI / 3;
      }
      this.rightArm.add(this.swordMesh);
    }

    this.updateNametag();
  }

  addResource(type, amount) {
    if (this.resources[type] !== undefined) {
      this.resources[type] += amount;
    } else if (type === 'wool') {
      this.woolCount += 16 * amount;
    } else if (type === 'gapple') {
      this.goldenApples = (this.goldenApples || 0) + amount;
    }
  }

  hasAffordableShopItem() {
    const tu = (window.game && window.game.teamUpgrades && window.game.teamUpgrades[this.team]) ? window.game.teamUpgrades[this.team] : null;

    // Bed Defense Materials (When own bed is still standing!)
    if (this.world.bedStatus[this.team]) {
      // Obsidian (4 Emeralds) - Top defense
      if (this.resources.emerald >= 4 && this.bedDefenseTier < 4 && this.bedDefenseMaterials.obsidian <= 0) return true;
      // End Stone (24 Iron) - Blast-proof defense
      if (this.resources.iron >= 24 && this.bedDefenseTier < 3 && this.bedDefenseMaterials.end_stone <= 0) return true;
      // Wood Planks (4 Gold) - Anti-shears defense
      if (this.resources.gold >= 4 && this.bedDefenseTier < 2 && this.bedDefenseMaterials.wood <= 0) return true;
    }

    // Mining Tools (for cracking enemy defenses)
    if (this.resources.gold >= 6 && this.pickaxeTier !== 'diamond') return true;
    if (this.resources.iron >= 20 && this.pickaxeTier === 'none') return true;

    // 1. Emerald Gear
    if (this.resources.emerald >= 6 && this.armorTier !== 'diamond') return true;
    if (this.resources.emerald >= 4 && this.weaponTier !== 'diamond') return true;

    // 2. Team Diamond Upgrades
    if (tu) {
      if (this.resources.diamond >= 4 && tu.sharpness === 0) return true;
      if (this.resources.diamond >= 2 && tu.protection === 0) return true;
      if (this.resources.diamond >= 4 && tu.protection === 1) return true;
      if (this.resources.diamond >= 2 && tu.forge === 1) return true;
    }

    // 3. Gold Upgrades
    if (this.resources.gold >= 12 && (this.armorTier === 'leather' || this.armorTier === 'chain')) return true;
    if (this.resources.gold >= 7 && (this.weaponTier === 'wood' || this.weaponTier === 'stone')) return true;
    if (this.resources.gold >= 14 && !this.hasBow) return true;
    if (this.resources.gold >= 3 && this.goldenApples < 2) return true;

    // 4. Iron Upgrades
    if (this.woolCount < 16 && this.resources.iron >= 4) return true; // High priority wool when low!
    if (this.resources.iron >= 40 && this.armorTier === 'leather') return true;
    if (this.resources.iron >= 40 && this.fireballs < 1) return true;
    if (this.resources.iron >= 20 && !this.hasShears) return true;
    if (this.resources.iron >= 10 && this.weaponTier === 'wood') return true;
    if (this.resources.iron >= 4 && this.woolCount < 32) return true;

    return false;
  }

  buyShopItems() {
    let boughtSomething = false;
    const myTeam = this.teamData[this.team] || this.teamData.blue;
    const prefix = myTeam.prefix;
    const tu = (window.game && window.game.teamUpgrades && window.game.teamUpgrades[this.team]) ? window.game.teamUpgrades[this.team] : null;

    // 1. Diamond Armor (6 Emeralds) - Top Gear Priority
    if (this.resources.emerald >= 6 && this.armorTier !== 'diamond') {
      this.resources.emerald -= 6;
      this.armorTier = 'diamond';
      boughtSomething = true;
      window.game.addChatMessage(`${prefix}[${this.name}] 成功装备了 钻石盔甲！`);
    }

    // 2. Diamond Sword (4 Emeralds) - Top Weapon Priority
    if (this.resources.emerald >= 4 && this.weaponTier !== 'diamond') {
      this.resources.emerald -= 4;
      this.weaponTier = 'diamond';
      boughtSomething = true;
      window.game.addChatMessage(`${prefix}[${this.name}] 成功装备了 钻石剑！`);
    }

    // --- Team Diamond Upgrades ---
    if (tu) {
      // Sharpened Swords (4 Diamonds)
      if (this.resources.diamond >= 4 && tu.sharpness === 0) {
        this.resources.diamond -= 4;
        tu.sharpness = 1;
        boughtSomething = true;
        window.game.addChatMessage(`${prefix}[${this.name}] 为全队激活了 锋利之刃 (Sharpness I)！`);
      }

      // Reinforced Armor I (2 Diamonds)
      if (this.resources.diamond >= 2 && tu.protection === 0) {
        this.resources.diamond -= 2;
        tu.protection = 1;
        boughtSomething = true;
        window.game.addChatMessage(`${prefix}[${this.name}] 为全队激活了 强化装甲 I (Protection I)！`);
      }

      // Reinforced Armor II (4 Diamonds)
      if (this.resources.diamond >= 4 && tu.protection === 1) {
        this.resources.diamond -= 4;
        tu.protection = 2;
        boughtSomething = true;
        window.game.addChatMessage(`${prefix}[${this.name}] 为全队升级了 强化装甲 II (Protection II)！`);
      }

      // Iron Forge (2 Diamonds)
      if (this.resources.diamond >= 2 && tu.forge === 1) {
        this.resources.diamond -= 2;
        tu.forge = 2;
        boughtSomething = true;
        window.game.addChatMessage(`${prefix}[${this.name}] 为全队升级了 铁矿熔炉 (Iron Forge)！`);
      }
    }

    // 3. Iron Armor (12 Gold) - Core Gold Armor Upgrade!
    if (this.resources.gold >= 12 && (this.armorTier === 'leather' || this.armorTier === 'chain')) {
      this.resources.gold -= 12;
      this.armorTier = 'iron';
      boughtSomething = true;
      window.game.addChatMessage(`${prefix}[${this.name}] 成功装备了 铁盔甲！`);
    }

    // 4. Iron Sword (7 Gold) - Core Gold Weapon Upgrade!
    if (this.resources.gold >= 7 && (this.weaponTier === 'wood' || this.weaponTier === 'stone')) {
      this.resources.gold -= 7;
      this.weaponTier = 'iron';
      boughtSomething = true;
      window.game.addChatMessage(`${prefix}[${this.name}] 成功装备了 铁剑！`);
    }

    // Emergency Wool: When wool is critically low (< 16), buying wool is TOP iron priority!
    if (this.woolCount < 16 && this.resources.iron >= 4) {
      this.resources.iron -= 4;
      this.woolCount += 16;
      boughtSomething = true;
      window.game.addChatMessage(`${prefix}[${this.name}] 在商人处补充了 羊毛 x16！`);
    }

    // 5. Chain Armor (40 Iron) - Fallback iron armor upgrade
    if (this.resources.iron >= 40 && this.armorTier === 'leather') {
      this.resources.iron -= 40;
      this.armorTier = 'chain';
      boughtSomething = true;
      window.game.addChatMessage(`${prefix}[${this.name}] 成功购买了 锁链甲！`);
    }

    // 6. Stone Sword (10 Iron) - Early weapon upgrade
    if (this.resources.iron >= 10 && this.weaponTier === 'wood') {
      this.resources.iron -= 10;
      this.weaponTier = 'stone';
      boughtSomething = true;
      window.game.addChatMessage(`${prefix}[${this.name}] 成功购买了 石剑！`);
    }

    // 7. Wool for bridging (Buy 16 wool when below 32, ensures sufficient bridging stockpile)
    if (this.woolCount < 32 && this.resources.iron >= 4) {
      this.resources.iron -= 4;
      this.woolCount += 16;
      boughtSomething = true;
      window.game.addChatMessage(`${prefix}[${this.name}] 在商人处购买了 羊毛 x16！`);
    }

    // 6. Shears (20 Iron)
    if (this.resources.iron >= 20 && !this.hasShears) {
      this.resources.iron -= 20;
      this.hasShears = true;
      boughtSomething = true;
      window.game.addChatMessage(`${prefix}[${this.name}] 购买了 剪刀！`);
    }

    // Bow & Arrows (14 Gold for Bow + 16 Arrows)
    if (this.resources.gold >= 14 && !this.hasBow) {
      this.resources.gold -= 14;
      this.hasBow = true;
      this.arrowCount = 16;
      boughtSomething = true;
      window.game.addChatMessage(`${prefix}[${this.name}] 购买了 弓 与 箭矢！`);
    } else if (this.hasBow && this.arrowCount <= 4 && this.resources.gold >= 2) {
      this.resources.gold -= 2;
      this.arrowCount += 8;
      boughtSomething = true;
    }

    // 7. Golden Apples (3 Gold)
    if (this.resources.gold >= 3 && this.goldenApples < 2) {
      this.resources.gold -= 3;
      this.goldenApples += 1;
      boughtSomething = true;
      window.game.addChatMessage(`${prefix}[${this.name}] 购买了 金苹果！`);
    }

    // 8. Fireball (40 Iron)
    if (this.resources.iron >= 40 && this.fireballs < 1) {
      this.resources.iron -= 40;
      this.fireballs += 1;
      boughtSomething = true;
      window.game.addChatMessage(`${prefix}[${this.name}] 购买了 火焰弹！`);
    }

    // --- 9. Bed Defense Materials (Upgraded Materials) ---
    if (this.world.bedStatus[this.team]) {
      // 1. Obsidian (4 Emeralds) - Top Priority
      if (this.resources.emerald >= 4 && this.bedDefenseTier < 4 && this.bedDefenseMaterials.obsidian <= 0) {
        this.resources.emerald -= 4;
        this.bedDefenseMaterials.obsidian = 4;
        this.needsBedUpgrade = true;
        boughtSomething = true;
        window.game.addChatMessage(`${prefix}[${this.name}] 斥巨资购买了 黑曜石 x4 准备打造终极防爆守床！`);
      }

      // 2. End Stone (24 Iron) - Blast-resistant defense
      if (this.resources.iron >= 24 && this.bedDefenseTier < 3 && this.bedDefenseMaterials.end_stone <= 0) {
        this.resources.iron -= 24;
        this.bedDefenseMaterials.end_stone = 12;
        this.needsBedUpgrade = true;
        boughtSomething = true;
        window.game.addChatMessage(`${prefix}[${this.name}] 购买了 防爆末地石 x12 准备升级床位防线！`);
      }

      // 3. Wood Planks (4 Gold) - Anti-shears defense
      if (this.resources.gold >= 4 && this.bedDefenseTier < 2 && this.bedDefenseMaterials.wood <= 0) {
        this.resources.gold -= 4;
        this.bedDefenseMaterials.wood = 16;
        this.needsBedUpgrade = true;
        boughtSomething = true;
        window.game.addChatMessage(`${prefix}[${this.name}] 购买了 橡木木板 x16 准备进行防剪刀防线！`);
      }
    }

    // --- 10. Mining Tools for Enemy Defenses ---
    if (this.resources.gold >= 6 && this.pickaxeTier !== 'diamond') {
      this.resources.gold -= 6;
      this.pickaxeTier = 'diamond';
      boughtSomething = true;
      window.game.addChatMessage(`${prefix}[${this.name}] 购买了 钻石镐 (破除黑曜石与末地石神速)！`);
    } else if (this.resources.iron >= 20 && this.pickaxeTier === 'none') {
      this.resources.iron -= 20;
      this.pickaxeTier = 'iron';
      boughtSomething = true;
      window.game.addChatMessage(`${prefix}[${this.name}] 购买了 铁镐 (快速破除末地石)！`);
    }

    if (boughtSomething) {
      this.updateEquipmentVisuals();
    }
  }

  eatGoldenApple() {
    if (this.goldenApples <= 0 || this.healCooldown > 0) return;
    this.goldenApples--;
    this.healCooldown = 6.0;
    this.health = Math.min(this.maxHealth, this.health + 8);
    window.soundManager.playPickup();
    this.updateNametag();

    const myTeam = this.teamData[this.team] || this.teamData.blue;
    window.game.addChatMessage(`${myTeam.prefix}[${this.name}] 吃下了金苹果，生命值大恢复！`);

    // Gold sparkle visual flash
    this.flashMeshColor(this.torsoMesh, 0xffff55);
    this.flashMeshColor(this.headMesh, 0xffff55);
    setTimeout(() => this.updateEquipmentVisuals(), 300);
  }

  shootFireball(targetPos) {
    if (this.fireballs <= 0 || this.fireballCooldown > 0) return;
    this.fireballs--;
    this.fireballCooldown = 10.0;

    const origin = new THREE.Vector3(this.position.x, this.position.y + 1.4, this.position.z);
    const dir = new THREE.Vector3().subVectors(targetPos, origin).normalize();

    window.soundManager.playSwing();
    const myTeam = this.teamData[this.team] || this.teamData.blue;
    window.game.addChatMessage(`${myTeam.prefix}[${this.name}] 发射了火焰弹！`);

    const fbGeo = new THREE.SphereGeometry(0.25, 8, 8);
    const fbMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });
    const fbMesh = new THREE.Mesh(fbGeo, fbMat);
    fbMesh.position.copy(origin).addScaledVector(dir, 0.6);
    this.scene.add(fbMesh);

    const speed = 18.0;
    const velocity = dir.clone().multiplyScalar(speed);
    const spawnTime = performance.now();

    const animateFb = () => {
      fbMesh.position.addScaledVector(velocity, 0.016);
      const bx = Math.round(fbMesh.position.x);
      const by = Math.round(fbMesh.position.y);
      const bz = Math.round(fbMesh.position.z);

      const block = this.world.getBlock(bx, by, bz);
      let hitTarget = false;

      // Check player hit
      if (window.player && !window.player.isDead && this.team !== 'red') {
        if (fbMesh.position.distanceTo(window.player.position) < 1.6) {
          hitTarget = true;
          window.player.takeDamage(10, dir);
        }
      }

      // Check other bots hit
      if (window.game && window.game.bots) {
        for (const otherBot of window.game.bots) {
          if (otherBot !== this && otherBot.team !== this.team && !otherBot.isDead) {
            if (fbMesh.position.distanceTo(otherBot.position) < 1.6) {
              hitTarget = true;
              otherBot.takeDamage(10, dir, this.name);
              break;
            }
          }
        }
      }

      if (block || hitTarget || performance.now() - spawnTime > 3500) {
        window.soundManager.playExplosion();
        this.scene.remove(fbMesh);

        // Break nearby wool
        for (let ox = -2; ox <= 2; ox++) {
          for (let oy = -2; oy <= 2; oy++) {
            for (let oz = -2; oz <= 2; oz++) {
              const tb = this.world.getBlock(bx + ox, by + oy, bz + oz);
              if (tb && tb.canBreak && tb.type.includes('WOOL')) {
                this.world.removeBlock(bx + ox, by + oy, bz + oz);
              }
            }
          }
        }
        return;
      }
      requestAnimationFrame(animateFb);
    };
    requestAnimationFrame(animateFb);
  }

  shootArrow(targetPos) {
    if (this.arrowCount <= 0 || this.bowCooldown > 0) return;
    this.arrowCount--;
    this.bowCooldown = 3.2;

    const origin = new THREE.Vector3(this.position.x, this.position.y + 1.4, this.position.z);
    const dir = new THREE.Vector3().subVectors(targetPos, origin).normalize();

    if (window.soundManager && typeof window.soundManager.playBowShoot === 'function') {
      window.soundManager.playBowShoot();
    }

    const arrowGroup = new THREE.Group();
    const shaft = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.04, 0.65),
      new THREE.MeshLambertMaterial({ color: 0xc19a6b })
    );
    arrowGroup.add(shaft);
    const tip = new THREE.Mesh(
      new THREE.ConeGeometry(0.065, 0.14, 4),
      new THREE.MeshLambertMaterial({ color: 0x4a4a4a })
    );
    tip.rotation.x = -Math.PI / 2;
    tip.position.set(0, 0, -0.38);
    arrowGroup.add(tip);

    arrowGroup.position.copy(origin).addScaledVector(dir, 0.6);
    this.scene.add(arrowGroup);

    const speed = 32.0;
    const velocity = dir.clone().multiplyScalar(speed);
    velocity.y += 0.9;

    const forwardAxis = new THREE.Vector3(0, 0, -1);
    arrowGroup.quaternion.setFromUnitVectors(forwardAxis, velocity.clone().normalize());

    const gravity = 11.5;
    let lifetime = 0;
    let isStuck = false;

    const animateBotArrow = () => {
      if (this.isDead || isStuck) return;

      const dt = 0.016;
      lifetime += dt;
      velocity.y -= gravity * dt;

      arrowGroup.position.addScaledVector(velocity, dt);

      const curDir = velocity.clone().normalize();
      if (curDir.lengthSq() > 0.001) {
        arrowGroup.quaternion.setFromUnitVectors(forwardAxis, curDir);
      }

      // Check hit player
      if (window.player && !window.player.isDead && this.team !== 'red') {
        const playerChest = window.player.position.clone().add(new THREE.Vector3(0, 1.0, 0));
        if (arrowGroup.position.distanceTo(playerChest) < 1.25) {
          isStuck = true;
          this.scene.remove(arrowGroup);
          window.player.takeDamage(6, dir);
          if (window.soundManager && typeof window.soundManager.playHit === 'function') {
            window.soundManager.playHit();
          }
          return;
        }
      }

      // Check hit other enemy bots
      if (window.game && window.game.bots) {
        for (const other of window.game.bots) {
          if (other !== this && other.team !== this.team && !other.isDead) {
            const chest = other.position.clone().add(new THREE.Vector3(0, 1.0, 0));
            if (arrowGroup.position.distanceTo(chest) < 1.25) {
              isStuck = true;
              this.scene.remove(arrowGroup);
              other.takeDamage(6, dir, this.name + '的弓箭');
              return;
            }
          }
        }
      }

      // Check solid block
      const bx = Math.floor(arrowGroup.position.x + 0.5);
      const by = Math.floor(arrowGroup.position.y + 0.5);
      const bz = Math.floor(arrowGroup.position.z + 0.5);
      if (this.world.getBlock(bx, by, bz)) {
        isStuck = true;
        setTimeout(() => this.scene.remove(arrowGroup), 2500);
        return;
      }

      if (arrowGroup.position.y < -22 || lifetime > 4.5) {
        this.scene.remove(arrowGroup);
        return;
      }

      requestAnimationFrame(animateBotArrow);
    };

    requestAnimationFrame(animateBotArrow);
  }

  flashMeshColor(mesh, hexColor) {
    if (!mesh || !mesh.material) return;
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach(m => {
        if (m && m.color) m.color.setHex(hexColor);
      });
    } else if (mesh.material.color) {
      mesh.material.color.setHex(hexColor);
    }
  }

  takeDamage(amount, knockbackDir = null, attackerName = '敌人') {
    if (this.isDead) return;

    let reduction = 0;
    if (this.armorSlots) {
      const slotPts = {
        helmet: { none: 0, chain: 1, iron: 2, diamond: 3 },
        chestplate: { none: 0, chain: 3, iron: 6, diamond: 8 },
        leggings: { none: 0, chain: 2, iron: 5, diamond: 6 },
        boots: { none: 0, chain: 1, iron: 2, diamond: 3 }
      };
      const s = this.armorSlots;
      const pts =
        (slotPts.helmet[s.helmet] || 0) +
        (slotPts.chestplate[s.chestplate] || 0) +
        (slotPts.leggings[s.leggings] || 0) +
        (slotPts.boots[s.boots] || 0);
      reduction = Math.min(0.65, (pts / 20) * 0.65);
    } else {
      if (this.armorTier === 'chain') reduction = 0.3;
      else if (this.armorTier === 'iron') reduction = 0.5;
      else if (this.armorTier === 'diamond') reduction = 0.65;
    }

    const teamProt = (window.game && window.game.teamUpgrades && window.game.teamUpgrades[this.team]) ? window.game.teamUpgrades[this.team].protection : 0;
    reduction = Math.min(0.85, reduction + teamProt * 0.15);

    const actual = Math.max(1, Math.round(amount * (1 - reduction)));
    this.health -= actual;
    this.updateNametag(true);

    // Damage flash red across all visible character parts
    this.flashMeshColor(this.torsoMesh, 0xff3333);
    this.flashMeshColor(this.headMesh, 0xff3333);
    this.flashMeshColor(this.leftArm, 0xff3333);
    this.flashMeshColor(this.rightArm, 0xff3333);
    this.flashMeshColor(this.leftLeg, 0xff3333);
    this.flashMeshColor(this.rightLeg, 0xff3333);
    setTimeout(() => this.updateEquipmentVisuals(), 150);

    // Apply Knockback (moderate, not overwhelming)
    if (knockbackDir) {
      this.velocity.x += knockbackDir.x * 4.5;
      this.velocity.y = 3.0;
      this.velocity.z += knockbackDir.z * 4.5;
    }

    // Retaliate into COMBAT mode immediately
    this.state = 'COMBAT';

    // Emergency golden apple consumption
    if (this.health <= 13 && this.goldenApples > 0 && this.healCooldown <= 0) {
      this.eatGoldenApple();
    }

    if (this.health <= 0) {
      this.die('killed', attackerName);
    }
  }

  die(cause = 'killed', killer = '玩家') {
    if (this.isDead) return;
    this.isDead = true;
    this.health = 0;
    this.group.visible = false;

    const myTeam = this.teamData[this.team] || this.teamData.blue;
    if (cause === 'void') {
      window.game.addChatMessage(`${myTeam.prefix}${this.name} 掉进了虚空！`);
    } else {
      window.game.addChatMessage(`${myTeam.prefix}${this.name} 被 §f${killer} §r击杀了！`);
    }

    // In School Battle Royale, no beds, instant permanent elimination
    if (window.game && window.game.currentMode === 'school_br') {
      window.game.onFinalKill(this.team, this, killer);
      return;
    }

    // In Survival War: 5s respawn during 10-min survival phase, permanent elimination in Duel Arena
    if (window.game && window.game.currentMode === 'survival_war') {
      if (!window.game.survivalDuelStarted) {
        window.game.addChatMessage(`${myTeam.prefix}${this.name} 将在 5 秒后于随机地表复活！`);
        setTimeout(() => {
          if (window.game && !window.game.survivalDuelStarted && window.game.isGameRunning) {
            this.respawn();
          }
        }, 5000);
      } else {
        window.game.onFinalKill(this.team, this, killer);
      }
      return;
    }

    // Check if bed of this team is still alive
    const bedAlive = this.world.bedStatus[this.team];
    if (bedAlive) {
      window.game.addChatMessage(`${myTeam.prefix}${this.name} 将在 5 秒后复活！`);
      setTimeout(() => this.respawn(), 5000);
    } else {
      window.game.onFinalKill(this.team, this, killer);
    }
  }

  respawn() {
    this.isDead = false;
    this.health = this.maxHealth;
    if (window.game && window.game.currentMode === 'survival_war' && !window.game.survivalDuelStarted && this.world && typeof this.world.getSurvivalHeight === 'function') {
      const ang = Math.random() * Math.PI * 2;
      const rad = 40 + Math.random() * 210;
      const rx = Math.round(Math.cos(ang) * rad);
      const rz = Math.round(Math.sin(ang) * rad);
      const ry = this.world.getSurvivalHeight(rx, rz) + 1.5;
      this.position.set(rx, ry, rz);
      this.state = 'SURVIVAL_GATHER';
    } else {
      this.position.copy(this.spawnPoint);
      this.state = 'GATHER';
      this.weaponTier = 'wood'; // Reset weapon to basic wooden sword on respawn
      this.resources = { iron: 0, gold: 0, diamond: 0, emerald: 0 };
    }
    this.velocity.set(0, 0, 0);
    this.group.visible = true;

    this.stateTimer = 0;
    this.woolCount = 32;
    this.updateEquipmentVisuals();

    const myTeam = this.teamData[this.team] || this.teamData.blue;
    window.game.addChatMessage(`${myTeam.prefix}${this.name} 已复活！`);
  }

  update(dt, player, allBots = []) {
    if (this.isDead) return;

    this.stateTimer += dt;
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.jumpCooldown = Math.max(0, this.jumpCooldown - dt);
    this.healCooldown = Math.max(0, this.healCooldown - dt);
    this.fireballCooldown = Math.max(0, this.fireballCooldown - dt);
    this.bowCooldown = Math.max(0, this.bowCooldown - dt);
    this.wTapTimer = Math.max(0, this.wTapTimer - dt);
    if (this.shareCooldown > 0) this.shareCooldown -= dt;
    if (this.patrolTimer > 0) this.patrolTimer -= dt;

    // Teammate Proactive Resource Sharing: when holding extra minerals and meeting player
    if (this.isTeammate && player && !player.isDead && this.shareCooldown <= 0 && this.state !== 'COMBAT') {
      const dToP = this.position.distanceTo(player.position);
      if (dToP < 3.8) {
        let sharedType = null;
        let sharedCount = 0;
        if (this.resources.emerald >= 2) {
          sharedType = 'emerald';
          sharedCount = 1;
        } else if (this.resources.diamond >= 2) {
          sharedType = 'diamond';
          sharedCount = 1;
        } else if (this.resources.iron >= 24) {
          sharedType = 'iron';
          sharedCount = 8;
        }
        if (sharedType && sharedCount > 0) {
          this.resources[sharedType] -= sharedCount;
          player.addResource(sharedType, sharedCount);
          this.shareCooldown = 20.0;
          const resNames = { iron: '铁锭', gold: '金锭', diamond: '钻石', emerald: '绿宝石' };
          if (window.soundManager && typeof window.soundManager.playDing === 'function') {
            window.soundManager.playDing(880);
          }
          window.game.addChatMessage(`${this.teamData[this.team].prefix}[${this.name}] 队长，分给你 ${sharedCount} 个${resNames[sharedType]}！拿去升级装备！`);
          if (window.TeammateManager && window.TeammateManager.isOpen) {
            window.TeammateManager.renderModal();
          }
        }
      }
    }

    // AI Decision Loop
    this.runAIStateMachine(dt, player, allBots);

    // Physics & Movement (every frame for smooth motion)
    this.applyPhysics(dt);

    // Anti-Stuck Watchdog: detect if bot is physically stuck on an obstacle or corner
    const distMoved = this.position.distanceTo(this.lastPos);
    const myTeam = this.teamData[this.team] || this.teamData.blue;
    const isAtGen = myTeam.gen && Math.hypot(myTeam.gen.x - this.position.x, myTeam.gen.z - this.position.z) < 2.5 && this.state === 'GATHER';
    const isAtShop = myTeam.shop && Math.hypot(myTeam.shop.x - this.position.x, myTeam.shop.z - this.position.z) < 2.5 && this.state === 'SHOP';
    const diaSpawner = (this.state === 'GATHER_DIAMOND') ? this.findNearestDiamondSpawner() : null;
    const isAtDia = diaSpawner && Math.hypot(diaSpawner.x - this.position.x, diaSpawner.z - this.position.z) < 2.2;
    const emeSpawner = (this.state === 'GATHER_EMERALD') ? this.findNearestEmeraldSpawner() : null;
    const isAtEme = emeSpawner && Math.hypot(emeSpawner.x - this.position.x, emeSpawner.z - this.position.z) < 2.5;
    const isAtPatrol = this.state === 'PATROL_BASE';
    const isAtFollow = this.state === 'FOLLOW_PLAYER' && player && this.position.distanceTo(player.position) < 4.0;

    // Only exempt shop if bot just arrived (< 1.0s); also exempt active melee combat so bot never jumps in place while fighting
    const shopExempt = isAtShop && this.stateTimer < 1.0;
    const isInMeleeCombat = (this.state === 'COMBAT' && this.currentTarget && this.currentTarget.pos && this.position.distanceTo(this.currentTarget.pos) < 4.2);

    if (distMoved < 0.06 && !isAtGen && !shopExempt && !isAtDia && !isAtEme && !isAtPatrol && !isAtFollow && !isInMeleeCombat && !this.isDead) {
      this.stuckTimer += dt;
      if (this.stuckTimer > 1.2) {
        // Only jump if bot has wool and is unstuck from small blocks; NEVER jump in place with 0 wool!
        if (this.woolCount > 0 && this.onGround && this.jumpCooldown <= 0) {
          this.velocity.y = this.jumpForce * 0.8;
          this.jumpCooldown = 0.8;
        }
      }
      if (this.stuckTimer > 1.8) {
        this.stuckTimer = 0;
        this.activeBridgeAxis = null;
        // Break any stuck state deadlock
        if (this.woolCount <= 0) {
          this.state = (this.resources.iron >= 4) ? 'SHOP' : 'GATHER';
        } else if (this.state === 'SHOP') {
          this.buyShopItems();
          this.chooseNextObjective(true);
        } else if (this.state === 'DEFEND_BED') {
          this.chooseNextObjective(true);
        } else if (this.state === 'BRIDGE') {
          this.state = 'GATHER';
        } else if (this.state === 'COMBAT') {
          this.state = 'BRIDGE';
        } else {
          this.chooseNextObjective(true);
        }
        this.stateTimer = 0;
      }
    } else {
      this.stuckTimer = 0;
    }

    this.lastPos.copy(this.position);

    // Smooth yaw rotation towards target facing (no instant 180 snap)
    let angleDiff = this.targetYaw - this.yaw;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    this.yaw += angleDiff * Math.min(1.0, dt * 14.0);

    // Sync Model Transform
    this.group.position.copy(this.position);
    this.group.rotation.y = this.yaw;

    // Stable Nametag Sizing (Minecraft standard: strictly based on 3D distance, 100% invariant to mouse rotation or camera angle)
    const cam = (window.game && window.game.camera) ? window.game.camera : (player ? player.camera : null);
    if (cam && this.nametag) {
      const camPos = cam.position;
      const dist = this.position.distanceTo(camPos);
      if (dist > 0.2) {
        // Subtle distance compensation so it remains readable across bridges without giant or tiny jitter
        const scaleFactor = Math.min(1.35, Math.max(0.9, 0.9 + Math.max(0, dist - 4.0) * 0.018));
        const baseW = 1.6;
        const baseH = 0.40;
        this.nametag.scale.set(baseW * scaleFactor, baseH * scaleFactor, 1);
        this.nametag.position.y = 2.22 + (scaleFactor - 1.0) * 0.08;
      }
    }

    // Walking animation (smoothly synchronized with velocity, no 60Hz jitter)
    const hSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    if (hSpeed > 0.4) {
      this.walkTimer += dt * hSpeed * 2.5;
      this.leftLeg.rotation.x = Math.sin(this.walkTimer) * 0.6;
      this.rightLeg.rotation.x = -Math.sin(this.walkTimer) * 0.6;
      this.leftArm.rotation.x = -Math.sin(this.walkTimer) * 0.5;
      if (this.attackCooldown <= 0) {
        this.rightArm.rotation.x = Math.sin(this.walkTimer) * 0.5;
      }
    } else {
      this.leftLeg.rotation.x = THREE.MathUtils.lerp(this.leftLeg.rotation.x, 0, dt * 12);
      this.rightLeg.rotation.x = THREE.MathUtils.lerp(this.rightLeg.rotation.x, 0, dt * 12);
      this.leftArm.rotation.x = THREE.MathUtils.lerp(this.leftArm.rotation.x, 0, dt * 12);
    }

    // Void Check
    if (this.position.y < -18) {
      this.die('void');
    }
  }

  // Check direct line of sight through voxel world (solid walls/floors block line of sight)
  hasLineOfSight(targetPos) {
    if (!this.world || !targetPos) return true;
    const eyeY = this.position.y + 1.5;
    const targetY = (targetPos.y !== undefined) ? (targetPos.y + 1.2) : eyeY;
    const dx = targetPos.x - this.position.x;
    const dy = targetY - eyeY;
    const dz = targetPos.z - this.position.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist <= 1.5) return true; // Close melee proximity awareness

    const steps = Math.ceil(dist * 2.5); // 0.4m per step sampling
    const stepX = dx / steps;
    const stepY = dy / steps;
    const stepZ = dz / steps;

    // Start 0.4m ahead of bot eye, stop 0.5m before target
    const startStep = Math.min(2, Math.floor(steps * 0.08));
    const endStep = Math.max(startStep, steps - Math.floor(steps * 0.12));

    for (let i = startStep; i <= endStep; i++) {
      const bx = Math.round(this.position.x + stepX * i);
      const by = Math.round(eyeY + stepY * i);
      const bz = Math.round(this.position.z + stepZ * i);
      const b = this.world.getBlock(bx, by, bz);
      if (b && b.type) {
        // Transparent glass or open chest does not block vision
        if (b.type.includes('GLASS') || b.type === 'CHEST') continue;
        return false;
      }
    }
    return true;
  }

  // Check if bot can detect/spot player (Invisible player is ONLY spotted if holding a weapon/sword/bow or recently attacked!)
  // In addition: solid walls block vision unless within close melee hearing distance (1.8m)
  canDetectPlayer(player) {
    if (!player || player.isDead) return false;
    const dPlayer = this.position.distanceTo(player.position);
    if (dPlayer > 1.8 && !this.hasLineOfSight(player.position)) {
      return false; // Cannot see player through solid walls!
    }

    const isPlayerInvis = player.isInvisible || (player.hasEffect && player.hasEffect('invisibility'));
    if (!isPlayerInvis) return true;

    // 隐身药水规则：只有拿刀/武器才会被看见！
    const isHoldingWeapon = (typeof player.isHoldingWeapon === 'function') ?
      player.isHoldingWeapon() :
      Boolean(player.hotbar && player.hotbar[player.selectedSlot] && (player.hotbar[player.selectedSlot].type === 'weapon' || player.hotbar[player.selectedSlot].type === 'bow' || (player.hotbar[player.selectedSlot].id && player.hotbar[player.selectedSlot].id.startsWith('sword'))));

    const attackedRecently = Boolean(player.lastAttackTime && (performance.now() - player.lastAttackTime < 3500));

    return Boolean(isHoldingWeapon || attackedRecently);
  }

  // Calculate required mining/break time for any block
  getRequiredBreakTime(blockType) {
    if (!blockType) return 1.0;
    if (blockType.startsWith('BED_') || blockType.includes('BED')) {
      return this.hasShears ? 1.0 : 1.8;
    }
    if (blockType.includes('WOOL')) {
      return this.hasShears ? 0.25 : 0.85;
    }
    if (blockType === 'OAK_PLANKS' || blockType.includes('PLANK') || blockType.includes('WOOD')) {
      return 1.4;
    }
    if (blockType === 'END_STONE') {
      if (this.pickaxeTier === 'diamond') return 1.0;
      if (this.pickaxeTier === 'iron') return 1.6;
      if (this.pickaxeTier === 'wood') return 2.4;
      return 5.5; // Without pickaxe
    }
    if (blockType === 'OBSIDIAN') {
      if (this.pickaxeTier === 'diamond') return 4.5;
      return 20.0; // Without diamond pickaxe, extremely slow
    }
    return 1.0;
  }

  // Find optimal target: nearest hostile player or enemy bot (cannot see through solid walls)
  findTarget(player, allBots) {
    let closestTarget = null;
    let closestDist = 999;

    // Check player (if player is not on my team)
    if (player && !player.isDead && this.team !== 'red') {
      if (this.canDetectPlayer(player)) {
        const dPlayer = this.position.distanceTo(player.position);
        if (dPlayer < closestDist) {
          closestDist = dPlayer;
          closestTarget = { type: 'player', entity: player, pos: player.position };
        }
      }
    }

    // Check other bots (solid walls block line of sight unless within 1.8m close proximity)
    for (const b of allBots) {
      if (b !== this && !b.isDead && b.team !== this.team) {
        const dBot = this.position.distanceTo(b.position);
        if (dBot < closestDist) {
          if (dBot > 1.8 && !this.hasLineOfSight(b.position)) continue;
          closestDist = dBot;
          closestTarget = { type: 'bot', entity: b, pos: b.position };
        }
      }
    }

    return { target: closestTarget, dist: closestDist };
  }

  // Intercept any intruder within radius of own island (bed or generator)
  findIntruderNearBase(radius = 16.0, allBots = [], player = null) {
    const myTeam = this.teamData[this.team] || this.teamData.blue;
    const baseBed = myTeam.bed;
    const baseGen = myTeam.gen;

    for (const b of allBots) {
      if (b !== this && !b.isDead && b.team !== this.team) {
        const dBed = b.position.distanceTo(baseBed);
        const dGen = b.position.distanceTo(baseGen);
        if (dBed <= radius || dGen <= radius) {
          return { type: 'bot', entity: b, pos: b.position };
        }
      }
    }
    if (player && !player.isDead && this.team !== 'red') {
      if (this.canDetectPlayer(player)) {
        const dBed = player.position.distanceTo(baseBed);
        const dGen = player.position.distanceTo(baseGen);
        if (dBed <= radius || dGen <= radius) {
          return { type: 'player', entity: player, pos: player.position };
        }
      }
    }
    return null;
  }

  // Find nearest diamond spawner on diamond islands
  findNearestDiamondSpawner() {
    const gm = window.game ? (window.game.generatorManager || window.game.generators) : null;
    if (!gm || !gm.spawners) return null;
    const spawners = gm.spawners.filter(s => s.type === 'diamond');
    let nearest = null;
    let minDist = 9999;
    for (const s of spawners) {
      const d = Math.hypot(s.x - this.position.x, s.z - this.position.z);
      if (d < minDist) {
        minDist = d;
        nearest = s;
      }
    }
    return nearest;
  }

  // Find nearest emerald spawner in center island
  findNearestEmeraldSpawner() {
    const gm = window.game ? (window.game.generatorManager || window.game.generators) : null;
    if (!gm || !gm.spawners) return null;
    const spawners = gm.spawners.filter(s => s.type === 'emerald');
    let nearest = null;
    let minDist = 9999;
    for (const s of spawners) {
      const d = Math.hypot(s.x - this.position.x, s.z - this.position.z);
      if (d < minDist) {
        minDist = d;
        nearest = s;
      }
    }
    return nearest;
  }

  // Opportunistic scavenging: pick up nearby valuable dropped emeralds or diamonds
  findNearbyValuableDrop(maxDist = 9.0) {
    const gm = window.game ? (window.game.generatorManager || window.game.generators) : null;
    if (!gm || !gm.items) return null;
    let bestItem = null;
    let bestScore = -9999;
    for (const it of gm.items) {
      if (!it.mesh) continue;
      const isValuable = (it.type === 'emerald' || it.type === 'diamond');
      if (!isValuable) continue;
      const dist = Math.hypot(it.mesh.position.x - this.position.x, it.mesh.position.z - this.position.z);
      if (dist <= maxDist) {
        const score = (it.type === 'emerald' ? 30 : 15) - dist;
        if (score > bestScore) {
          bestScore = score;
          bestItem = it;
        }
      }
    }
    return bestItem;
  }

  // Breadth-First Search on existing walkable blocks to find the next deterministic step towards target
  // Eliminates Euclidean local minima oscillation and prevents 60Hz jitter
  findWalkablePathStep(curBx, curBz, destBx, destBz) {
    if (curBx === destBx && curBz === destBz) return null;

    const hasFloorAt = (bx, bz) => {
      return !!(this.world.getBlock(bx, 0, bz) ||
                this.world.getBlock(bx, 1, bz) ||
                this.world.getBlock(bx, -1, bz) ||
                this.world.getBlock(bx, -2, bz));
    };

    if (!hasFloorAt(curBx, curBz)) {
      const cardinals = [
        { x: curBx + 1, z: curBz },
        { x: curBx - 1, z: curBz },
        { x: curBx, z: curBz + 1 },
        { x: curBx, z: curBz - 1 }
      ];
      for (const c of cardinals) {
        if (hasFloorAt(c.x, c.z)) return { x: c.x, z: c.z };
      }
      return null;
    }

    const queue = [];
    const visited = new Set();
    visited.add(`${curBx},${curBz}`);

    const cardinals = [
      { x: curBx + 1, z: curBz },
      { x: curBx - 1, z: curBz },
      { x: curBx, z: curBz + 1 },
      { x: curBx, z: curBz - 1 }
    ];

    cardinals.sort((a, b) => {
      const da = (a.x - destBx) ** 2 + (a.z - destBz) ** 2;
      const db = (b.x - destBx) ** 2 + (b.z - destBz) ** 2;
      return da - db;
    });

    for (const c of cardinals) {
      if (hasFloorAt(c.x, c.z)) {
        if (c.x === destBx && c.z === destBz) {
          return { x: c.x, z: c.z };
        }
        visited.add(`${c.x},${c.z}`);
        queue.push({ x: c.x, z: c.z, firstX: c.x, firstZ: c.z });
      }
    }

    let closestNode = null;
    let minTargetDist = (curBx - destBx) ** 2 + (curBz - destBz) ** 2;
    let iterations = 0;

    while (queue.length > 0 && iterations < 350) {
      iterations++;
      const curr = queue.shift();

      if (curr.x === destBx && curr.z === destBz) {
        return { x: curr.firstX, z: curr.firstZ };
      }

      const curDist = (curr.x - destBx) ** 2 + (curr.z - destBz) ** 2;
      if (curDist < minTargetDist) {
        minTargetDist = curDist;
        closestNode = curr;
      }

      const nextCardinals = [
        { x: curr.x + 1, z: curr.z },
        { x: curr.x - 1, z: curr.z },
        { x: curr.x, z: curr.z + 1 },
        { x: curr.x, z: curr.z - 1 }
      ];

      for (const nc of nextCardinals) {
        const k = `${nc.x},${nc.z}`;
        if (!visited.has(k) && hasFloorAt(nc.x, nc.z)) {
          visited.add(k);
          queue.push({ x: nc.x, z: nc.z, firstX: curr.firstX, firstZ: curr.firstZ });
        }
      }
    }

    if (closestNode) {
      return { x: closestNode.firstX, z: closestNode.firstZ };
    }
    return null;
  }

  // Universal Navigation & Bridging helper towards any target coordinate
  navigateAndBridge(destX, destZ, passThroughCenter = false) {
    const myTeam = this.teamData[this.team] || this.teamData.blue;
    let navTargetX = destX;
    let navTargetZ = destZ;

    if (passThroughCenter) {
      const distToCenter = Math.hypot(this.position.x, this.position.z);
      if (distToCenter > 10.0 && Math.abs(destX - this.position.x) > 10 && Math.abs(destZ - this.position.z) > 10) {
        navTargetX = 0;
        navTargetZ = 0;
      }
    }

    const dx = navTargetX - this.position.x;
    const dz = navTargetZ - this.position.z;
    const distToTarget = Math.hypot(dx, dz);

    if (distToTarget < 1.4) {
      this.activeBridgeAxis = null;
      return 'ARRIVED';
    }

    const curBx = Math.floor(this.position.x + 0.5);
    const curBz = Math.floor(this.position.z + 0.5);

    // If out of wool: NEVER attempt to step into void! Strictly follow existing walkable blocks using BFS pathfinding.
    if (this.woolCount <= 0) {
      this.activeBridgeAxis = null;
      const targetBx = Math.floor(navTargetX + 0.5);
      const targetBz = Math.floor(navTargetZ + 0.5);
      if (curBx === targetBx && curBz === targetBz) {
        this.moveTo(navTargetX, navTargetZ, this.speed * 0.85);
        return distToTarget < 1.4 ? 'ARRIVED' : 'MOVING';
      }
      const nextStep = this.findWalkablePathStep(curBx, curBz, targetBx, targetBz);
      if (nextStep) {
        this.moveTo(nextStep.x, nextStep.z, this.speed * 0.85);
        return 'MOVING';
      }
      return 'NO_WOOL';
    }

    // Stick to a single cardinal axis until aligned to build clean straight bridges
    if (!this.activeBridgeAxis) {
      this.activeBridgeAxis = Math.abs(dz) >= Math.abs(dx) ? 'z' : 'x';
    }

    let stepX = 0;
    let stepZ = 0;

    if (this.activeBridgeAxis === 'z') {
      if (Math.abs(dz) > 0.8) {
        stepZ = Math.sign(dz);
      } else {
        this.activeBridgeAxis = 'x';
        if (Math.abs(dx) > 0.4) {
          stepX = Math.sign(dx);
        }
      }
    } else {
      if (Math.abs(dx) > 0.8) {
        stepX = Math.sign(dx);
      } else {
        this.activeBridgeAxis = 'z';
        if (Math.abs(dz) > 0.4) {
          stepZ = Math.sign(dz);
        }
      }
    }

    if (stepX === 0 && stepZ === 0) {
      if (Math.abs(dx) > 0.3) stepX = Math.sign(dx);
      else if (Math.abs(dz) > 0.3) stepZ = Math.sign(dz);
      else {
        this.activeBridgeAxis = null;
        return 'ARRIVED';
      }
    }

    const nextBx = curBx + stepX;
    const nextBz = curBz + stepZ;
    const hasNextFloor = this.world.getBlock(nextBx, 0, nextBz) ||
                         this.world.getBlock(nextBx, 1, nextBz) ||
                         this.world.getBlock(nextBx, -1, nextBz) ||
                         this.world.getBlock(nextBx, -2, nextBz);

    if (!hasNextFloor) {
      if (this.woolCount > 0) {
        this.world.setBlock(nextBx, 0, nextBz, myTeam.wool, true, this.team);
        if (window.soundManager && typeof window.soundManager.playPlace === 'function') {
          window.soundManager.playPlace();
        }
        this.woolCount--;
      } else {
        this.activeBridgeAxis = null;
        const targetBx = Math.floor(navTargetX + 0.5);
        const targetBz = Math.floor(navTargetZ + 0.5);
        const nextStep = this.findWalkablePathStep(curBx, curBz, targetBx, targetBz);
        if (nextStep) {
          this.moveTo(nextStep.x, nextStep.z, this.speed * 0.85);
          return 'MOVING';
        }
        return 'NO_WOOL';
      }
    }

    // Move centered along the bridge line
    if (stepZ !== 0) {
      this.moveTo(curBx, nextBz, this.speed * 0.85);
    } else {
      this.moveTo(nextBx, curBz, this.speed * 0.85);
    }
    return 'MOVING';
  }

  // Strategic Decision Maker: Evaluates whether to Gather Diamonds, Rush Emeralds, or Attack Enemy Bed
  chooseNextObjective(fromShop = false) {
    // Survival War Mode: Gather & upgrade during 10-min survival phase; hunt enemy teams in Duel Arena!
    if (window.game && window.game.currentMode === 'survival_war') {
      if (window.game.survivalDuelStarted) {
        this.state = 'COMBAT';
        this.stateTimer = 0;
        return;
      }
      const { target, dist } = this.findTarget(window.player, window.bots || []);
      if (target && dist < 10.0) {
        this.state = 'COMBAT';
        this.currentTarget = target;
      } else {
        this.state = 'SURVIVAL_GATHER';
      }
      this.stateTimer = 0;
      return;
    }

    // School Battle Royale Mode: Loot chests across campus, patrol school, hunt enemies!
    if (window.game && window.game.currentMode === 'school_br') {
      const { target, dist } = this.findTarget(window.player, window.bots || []);
      if (target && dist < 14.0) {
        this.state = 'COMBAT';
        this.currentTarget = target;
      } else {
        this.state = 'LOOT_CHEST';
      }
      this.stateTimer = 0;
      return;
    }

    // PvP Duel Mode: Always seek and hunt down enemy! Never bridge or gather resources.
    if (window.game && window.game.currentMode === 'pvp_1v1') {
      this.state = 'COMBAT';
      this.stateTimer = 0;
      return;
    }

    // SkyWars Mode: Authentic SkyWars decision tree!
    // 1. Loot spawn chest if not done yet
    // 2. Bridge to Center Island to grab mega chests
    // 3. Hunt down nearest alive enemy on other sky islands
    if (window.game && window.game.currentMode && window.game.currentMode.startsWith('skywars')) {
      this.activeBridgeAxis = null;
      this.miningBlock = null;

      // 0. Prioritize attacking enemy beds if enemy beds are still alive
      const targetBed = this.findTargetBed();
      if (targetBed) {
        // If enemy player/bot is nearby, fight first
        if (target && dist < 12.0) {
          this.state = 'COMBAT';
          this.currentTarget = target;
          this.stateTimer = 0;
          return;
        }

        // Bridge or rush towards enemy bed to destroy it!
        this.state = 'BRIDGE';
        this.stateTimer = 0;
        return;
      }

      // 1. If enemy is nearby, engage in combat
      if (target) {
        if (dist < 14.0) {
          this.state = 'COMBAT';
          this.currentTarget = target;
          this.stateTimer = 0;
          return;
        }

        // Bridge or march towards enemy island
        this.state = 'COMBAT';
        this.currentTarget = target;
        this.stateTimer = 0;
        return;
      }

      // If mid-island not reached, bridge to center (0, 0)
      const distToMid = Math.hypot(this.position.x, this.position.z);
      if (distToMid > 4.5 && this.weaponTier !== 'diamond') {
        this.state = 'BRIDGE_MID';
        this.stateTimer = 0;
        return;
      }

      // Default to COMBAT seeking
      this.state = 'COMBAT';
      this.stateTimer = 0;
      return;
    }

    const myTeam = this.teamData[this.team] || this.teamData.blue;
    const prefix = myTeam.prefix;
    const tu = (window.game && window.game.teamUpgrades && window.game.teamUpgrades[this.team]) ? window.game.teamUpgrades[this.team] : null;

    this.activeBridgeAxis = null;
    this.islandStayTimer = 0;
    this.miningBlock = null;

    // Teammate Tactical Role Assignment
    if (this.isTeammate && this.tacticalRole !== 'AUTO') {
      if (this.tacticalRole === 'DEFEND_BED') {
        const hasDefenseMaterials = (this.bedDefenseMaterials.obsidian > 0 || this.bedDefenseMaterials.end_stone > 0 || this.bedDefenseMaterials.wood > 0 || this.woolCount >= 4);
        if ((!this.hasDefendedBed || this.needsBedUpgrade) && this.world.bedStatus[this.team] && hasDefenseMaterials) {
          this.state = 'DEFEND_BED';
          this.stateTimer = 0;
          return;
        }
        if (!fromShop && this.hasAffordableShopItem()) {
          this.state = 'SHOP';
          this.stateTimer = 0;
          return;
        }
        if (this.woolCount < 8 && this.resources.iron < 4) {
          this.state = 'GATHER';
          this.stateTimer = 0;
          return;
        }
        this.state = 'PATROL_BASE';
        this.stateTimer = 0;
        return;
      } else if (this.tacticalRole === 'GATHER_RESOURCES') {
        if (this.woolCount < 8) {
          this.state = (this.resources.iron >= 4 && !fromShop) ? 'SHOP' : 'GATHER';
          this.stateTimer = 0;
          return;
        }
        if (!fromShop && this.hasAffordableShopItem() && (this.resources.diamond >= 2 || this.resources.emerald >= 4 || this.resources.iron >= 12)) {
          this.state = 'SHOP';
          this.stateTimer = 0;
          return;
        }
        if (Math.random() < 0.55 || this.resources.diamond < 2) {
          this.state = 'GATHER_DIAMOND';
        } else {
          this.state = 'GATHER_EMERALD';
        }
        this.stateTimer = 0;
        return;
      } else if (this.tacticalRole === 'ATTACK_BED') {
        if (this.woolCount < 8) {
          this.state = (this.resources.iron >= 4 && !fromShop) ? 'SHOP' : 'GATHER';
          this.stateTimer = 0;
          return;
        }
        if (!fromShop && this.hasAffordableShopItem()) {
          this.state = 'SHOP';
          this.stateTimer = 0;
          return;
        }
        this.state = 'BRIDGE';
        this.stateTimer = 0;
        return;
      } else if (this.tacticalRole === 'FOLLOW') {
        if (this.woolCount < 8 && this.resources.iron < 4) {
          this.state = 'GATHER';
          this.stateTimer = 0;
          return;
        }
        this.state = 'FOLLOW_PLAYER';
        this.stateTimer = 0;
        return;
      }
    }

    // 0. Low wool safeguard: NEVER embark on void bridging or defense with less than 8 wool (unless holding upgraded defense materials)!
    if (this.woolCount < 8 && !this.needsBedUpgrade) {
      if (this.resources.iron >= 4 && !fromShop) {
        this.state = 'SHOP';
      } else {
        this.state = 'GATHER';
      }
      this.stateTimer = 0;
      return;
    }

    // 1. Bed protection & upgrade (requires wool or upgraded defense materials!)
    const hasDefenseMaterials = (this.bedDefenseMaterials.obsidian > 0 || this.bedDefenseMaterials.end_stone > 0 || this.bedDefenseMaterials.wood > 0 || this.woolCount >= 4);
    if ((!this.hasDefendedBed || this.needsBedUpgrade) && this.world.bedStatus[this.team] && hasDefenseMaterials) {
      this.state = 'DEFEND_BED';
      this.stateTimer = 0;
      return;
    }

    // 2. Return to shop ONLY if NOT just finished shopping AND actually has an affordable item!
    if (!fromShop && this.hasAffordableShopItem()) {
      this.state = 'SHOP';
      this.stateTimer = 0;
      return;
    }

    // 3. Low on wool and iron -> gather iron & gold at base generator
    if (this.woolCount < 12 && this.resources.iron < 4) {
      this.state = 'GATHER';
      this.stateTimer = 0;
      return;
    }

    // 4. Strategic priorities: Diamonds for team upgrades, Emeralds for diamond armor/sword, or Bed assault
    const needSharpness = tu && tu.sharpness === 0;
    const needProtection = tu && tu.protection < 2;
    const needDiamondGear = (this.armorTier !== 'diamond' || this.weaponTier !== 'diamond');
    const hasEnemyBed = !!this.findTargetBed();

    const roll = Math.random();
    // High priority to rush diamonds when team upgrades are still missing!
    if ((needSharpness || needProtection) && roll < 0.60) {
      this.state = 'GATHER_DIAMOND';
      this.stateTimer = 0;
      if (Math.random() < 0.35) {
        window.game.addChatMessage(`${prefix}[${this.name}] 前往钻石岛收集钻石！`);
      }
    } else if (needDiamondGear && roll < 0.85) {
      this.state = 'GATHER_EMERALD';
      this.stateTimer = 0;
      if (Math.random() < 0.35) {
        window.game.addChatMessage(`${prefix}[${this.name}] 前往中路抢夺绿宝石！`);
      }
    } else if (hasEnemyBed) {
      this.state = 'BRIDGE';
      this.stateTimer = 0;
      if (Math.random() < 0.35) {
        window.game.addChatMessage(`${prefix}[${this.name}] 搭路突袭敌方床位！`);
      }
    } else {
      this.state = 'GATHER_DIAMOND';
      this.stateTimer = 0;
    }
  }

  // Find nearest enemy bed that is still alive
  findTargetBed() {
    const teams = ['red', 'blue', 'green', 'yellow'];
    let bestBed = null;
    let bestDist = 999;

    for (const t of teams) {
      if (t === this.team) continue;
      if (this.world.bedStatus[t]) {
        // Look up bed position in world voxel map or teamData
        let bedPos = this.teamData[t] ? this.teamData[t].bed : null;
        if (window.game && window.game.currentMode && window.game.currentMode.startsWith('skywars')) {
          // In SkyWars, find actual bed coordinates from world
          const targetBedType = `BED_${t.toUpperCase()}`;
          for (const [k, b] of this.world.voxelMap.entries()) {
            if (b && b.type === targetBedType) {
              bedPos = new THREE.Vector3(b.x, b.y, b.z);
              break;
            }
          }
        }
        if (bedPos) {
          const d = this.position.distanceTo(bedPos);
          if (d < bestDist) {
            bestDist = d;
            bestBed = { team: t, pos: bedPos };
          }
        }
      }
    }
    return bestBed;
  }

  runAIStateMachine(dt, player, allBots) {
    const myTeam = this.teamData[this.team] || this.teamData.blue;
    const { target, dist } = this.findTarget(player, allBots);
    this.currentTarget = target;

    // If an enemy is within 8.5 blocks, immediately engage in COMBAT!
    if (target && dist < 8.5) {
      this.state = 'COMBAT';
    }

    switch (this.state) {
      case 'SURVIVAL_GATHER': {
        if (window.game && window.game.survivalDuelStarted) {
          this.state = 'COMBAT';
          this.stateTimer = 0;
          break;
        }
        // Defend self if enemy gets very close (< 9m)
        if (target && dist < 9.0) {
          this.state = 'COMBAT';
          this.currentTarget = target;
          this.stateTimer = 0;
          break;
        }

        // Roam surface waypoints within radius 270
        if (!this.survWp || Math.hypot(this.survWp.x - this.position.x, this.survWp.z - this.position.z) < 3.0 || this.stateTimer > 10) {
          const ang = Math.random() * Math.PI * 2;
          const rad = 20 + Math.random() * 245;
          this.survWp = { x: Math.cos(ang) * rad, z: Math.sin(ang) * rad };
          this.stateTimer = 0;
        }
        this.moveTo(this.survWp.x, this.survWp.z, this.speed * 0.92);

        // Simulate vanilla survival mining & piece-by-piece gear crafting over the 5-min phase
        if (!this.armorSlots) {
          this.armorSlots = { helmet: 'none', chestplate: 'none', leggings: 'none', boots: 'none' };
        }
        if (!this._survCraftTimer) this._survCraftTimer = 0;
        this._survCraftTimer += dt;
        if (this._survCraftTimer >= 18.0) {
          this._survCraftTimer = 0;
          this._survLevel = (this._survLevel || 0) + 1;
          if (this._survLevel === 1) {
            this.weaponTier = 'stone';
          } else if (this._survLevel === 3) {
            this.armorSlots.boots = 'iron';
          } else if (this._survLevel === 5) {
            this.weaponTier = 'iron';
            this.armorSlots.helmet = 'iron';
          } else if (this._survLevel === 7) {
            this.armorSlots.leggings = 'iron';
          } else if (this._survLevel === 9) {
            this.armorSlots.chestplate = 'iron';
            this.hasGapple = Math.min(2, (this.hasGapple || 0) + 1);
            this.goldenApples = this.hasGapple;
          } else if (this._survLevel === 11) {
            // Found cave diamonds: craft 1 piece at a time (weapon or 1 armor piece, NOT full set!)
            this.weaponTier = 'diamond';
            this.hasBow = true;
          } else if (this._survLevel === 13) {
            this.armorSlots.boots = 'diamond';
          } else if (this._survLevel === 15) {
            this.armorSlots.helmet = 'diamond';
            this.hasGapple = Math.min(3, (this.hasGapple || 0) + 1);
            this.goldenApples = this.hasGapple;
          } else if (this._survLevel >= 17 && this._survLevel <= 19) {
            if (this._survLevel === 17) this.armorSlots.leggings = 'diamond';
            if (this._survLevel === 19) this.armorSlots.chestplate = 'diamond';
          }
          this.updateEquipmentVisuals();
        }
        break;
      }

      case 'LOOT_CHEST': {
        if (window.game && window.game.currentMode === 'school_br') {
          if (!this.targetChest || this.targetChest.opened) {
            let closestChest = null;
            let closestDist = 999;
            for (const [key, c] of this.world.chests.entries()) {
              if (c.opened) continue;
              const d = Math.hypot(c.x - this.position.x, c.z - this.position.z);
              if (d < closestDist) {
                closestDist = d;
                closestChest = c;
              }
            }
            this.targetChest = closestChest;
          }

          if (this.targetChest) {
            const distToChest = Math.hypot(this.targetChest.x - this.position.x, this.targetChest.z - this.position.z);
            if (distToChest > 2.0) {
              this.moveTo(this.targetChest.x, this.targetChest.z, this.speed * 0.95);
            } else {
              this.lookAt(this.targetChest.x, this.targetChest.y, this.targetChest.z);
              if (this.stateTimer > 0.6) {
                this.targetChest.opened = true;
                const wTiers = ['stone', 'iron', 'diamond'];
                const aTiers = ['chain', 'iron', 'diamond'];
                this.weaponTier = wTiers[Math.floor(Math.random() * wTiers.length)];
                this.armorTier = aTiers[Math.floor(Math.random() * aTiers.length)];
                this.goldenApples = Math.min(4, this.goldenApples + 2);
                this.hasGapple = this.goldenApples;
                if (Math.random() < 0.6) {
                  this.hasBow = true;
                  this.arrowCount = 32;
                }
                this.updateEquipmentVisuals();
                if (window.soundManager && typeof window.soundManager.playChestOpen === 'function') {
                  window.soundManager.playChestOpen();
                }
                this.targetChest = null;
                this.stateTimer = 0;
                if (target && dist < 14.0) {
                  this.state = 'COMBAT';
                } else {
                  this.state = 'PATROL_CAMPUS';
                }
              }
            }
          } else {
            if (target) {
              this.state = 'COMBAT';
            } else {
              this.state = 'PATROL_CAMPUS';
            }
          }
          break;
        }

        if (!this.spawnChestPos) {
          this.state = 'COMBAT';
          break;
        }
        const distToChest = Math.hypot(this.spawnChestPos.x - this.position.x, this.spawnChestPos.z - this.position.z);
        if (distToChest > 2.0) {
          this.moveTo(this.spawnChestPos.x, this.spawnChestPos.z, this.speed * 0.95);
        } else {
          this.lookAt(this.spawnChestPos.x, this.spawnChestPos.y, this.spawnChestPos.z);
          if (this.stateTimer > 0.8) {
            // Finished looting
            this.weaponTier = (this.difficulty === 'nightmare') ? 'iron' : 'stone';
            this.armorTier = (this.difficulty === 'nightmare') ? 'iron' : 'chain';
            this.woolCount = 32;
            this.goldenApples = 2;
            this.hasGapple = 2;
            this.hasBow = true;
            this.arrowCount = 32;
            this.updateEquipmentVisuals();
            if (window.soundManager && typeof window.soundManager.playChestOpen === 'function') {
              window.soundManager.playChestOpen();
            }
            if (window.game) {
              window.game.addChatMessage(`${myTeam.prefix}${this.name} 开启了战利品箱子并装备武器！`);
            }
            this.state = 'BRIDGE_MID';
            this.stateTimer = 0;
          }
        }
        break;
      }

      case 'PATROL_CAMPUS': {
        if (target && dist < 14.0) {
          this.state = 'COMBAT';
          this.stateTimer = 0;
          break;
        }

        const campusWaypoints = [
          { x: -23, z: 0 },    // 操场中圈
          { x: -38, z: 0 },    // 看台
          { x: -10, z: 15 },   // 跑道
          { x: 0, z: 0 },      // 喷泉广场
          { x: 10, z: 0 },     // 1F大厅
          { x: 26, z: 12 },    // 1F教室
          { x: 26, z: -12 },   // 1F教室
          { x: 16, z: 15 },    // 走廊
          { x: 25, z: -8 }     // 天台
        ];

        if (this.campusPatrolIndex === undefined || this.stateTimer > 7.0) {
          this.campusPatrolIndex = Math.floor(Math.random() * campusWaypoints.length);
          this.stateTimer = 0;
        }

        const wp = campusWaypoints[this.campusPatrolIndex];
        const distToWp = Math.hypot(wp.x - this.position.x, wp.z - this.position.z);
        if (distToWp > 2.5) {
          this.moveTo(wp.x, wp.z, this.speed * 0.9);
        } else {
          this.campusPatrolIndex = Math.floor(Math.random() * campusWaypoints.length);
          this.stateTimer = 0;
        }
        break;
      }

      case 'BRIDGE_MID': {
        if (target && dist < 12.0) {
          this.state = 'COMBAT';
          break;
        }
        const distToMid = Math.hypot(this.position.x, this.position.z);
        if (distToMid > 5.0) {
          this.navigateAndBridge(0, 0, true);
        } else {
          // Reached Center Mega Island!
          if (this.weaponTier !== 'diamond') {
            this.weaponTier = 'diamond';
            this.armorTier = 'diamond';
            this.goldenApples += 1;
            this.hasGapple += 1;
            this.updateEquipmentVisuals();
            if (window.soundManager && typeof window.soundManager.playChestOpen === 'function') {
              window.soundManager.playChestOpen();
            }
            if (window.game) {
              window.game.addChatMessage(`${myTeam.prefix}${this.name} 夺取了中岛豪华神箱（获得全套钻石装备）！`);
            }
          }
          if (target) {
            this.state = 'COMBAT';
            this.stateTimer = 0;
          } else {
            this.chooseNextObjective();
          }
        }
        break;
      }

      case 'GATHER': {
        if (!myTeam || !myTeam.gen) {
          this.chooseNextObjective(false);
          break;
        }
        // Return to base generator to accumulate iron & gold
        const distToGen = Math.hypot(myTeam.gen.x - this.position.x, myTeam.gen.z - this.position.z);
        if (distToGen > 5.0) {
          this.navigateAndBridge(myTeam.gen.x, myTeam.gen.z, false);
        } else if (distToGen > 0.6) {
          this.moveTo(myTeam.gen.x, myTeam.gen.z, this.speed * 0.88);
        } else {
          // Standing calmly at generator to collect iron & gold, no micro-vibration
          this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, 0, 0.4);
          this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, 0, 0.4);
        }

        // Stay at generator to collect iron & gold; head to shop ONLY if something affordable is ready!
        const canAfford = this.hasAffordableShopItem();
        const timedOutAtGen = (distToGen < 2.5 && this.stateTimer > 7.5);

        if (canAfford) {
          this.state = 'SHOP';
          this.stateTimer = 0;
        } else if (timedOutAtGen) {
          if (this.woolCount < 12 && this.resources.iron < 4) {
            this.stateTimer = 3.0; // Continue gathering if severely depleted
          } else {
            this.chooseNextObjective(false);
          }
        }
        break;
      }

      case 'SHOP': {
        if (!myTeam || !myTeam.shop) {
          this.chooseNextObjective(true);
          break;
        }
        // Walk or bridge back to own Villager shopkeeper
        const distToShop = Math.hypot(myTeam.shop.x - this.position.x, myTeam.shop.z - this.position.z);
        if (distToShop > 4.5) {
          this.navigateAndBridge(myTeam.shop.x, myTeam.shop.z, false);
        } else if (distToShop > 1.8) {
          this.moveTo(myTeam.shop.x, myTeam.shop.z, this.speed * 0.9);
        } else {
          // Standing calmly at shopkeeper, no jitter
          this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, 0, 0.4);
          this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, 0, 0.4);
        }

        // Arrived at shopkeeper OR timed out near shop
        if (distToShop < 3.2 || (distToShop < 5.0 && this.stateTimer > 2.0) || this.stateTimer > 5.0) {
          this.buyShopItems();
          this.stateTimer = 0;
          this.activeBridgeAxis = null;
          this.chooseNextObjective(true); // Flag fromShop=true so it NEVER loops back into SHOP!
        }
        break;
      }

      case 'DEFEND_BED': {
        if (!myTeam || !myTeam.bed) {
          this.chooseNextObjective(false);
          break;
        }
        // Walk towards own bed
        const distToBed = Math.hypot(myTeam.bed.x - this.position.x, myTeam.bed.z - this.position.z);
        if (distToBed > 6.0) {
          this.navigateAndBridge(myTeam.bed.x, myTeam.bed.z, false);
        } else {
          this.moveTo(myTeam.bed.x, myTeam.bed.z, this.speed * 0.85);
        }

        if (this.position.distanceTo(myTeam.bed) < 4.0 || (distToBed < 5.0 && this.stateTimer > 3.0)) {
          const bx = myTeam.bed.x;
          const bz = myTeam.bed.z;
          const isXAxis = Math.abs(bx) > 20;

          // Compute Bed blocks and surrounding defense coordinates
          const bx2 = isXAxis ? (bx > 0 ? bx + 1 : bx - 1) : bx;
          const bz2 = isXAxis ? bz : (bz > 0 ? bz + 1 : bz - 1);

          // Inner Core Points (directly wrapping both bed blocks at y=1 and y=2)
          const innerPoints = isXAxis ? [
            { x: bx, y: 2, z: bz },
            { x: bx2, y: 2, z: bz },
            { x: bx, y: 1, z: bz + 1 },
            { x: bx, y: 1, z: bz - 1 },
            { x: bx2, y: 1, z: bz + 1 },
            { x: bx2, y: 1, z: bz - 1 },
            { x: Math.min(bx, bx2) - 1, y: 1, z: bz },
            { x: Math.max(bx, bx2) + 1, y: 1, z: bz }
          ] : [
            { x: bx, y: 2, z: bz },
            { x: bx, y: 2, z: bz2 },
            { x: bx + 1, y: 1, z: bz },
            { x: bx - 1, y: 1, z: bz },
            { x: bx + 1, y: 1, z: bz2 },
            { x: bx - 1, y: 1, z: bz2 },
            { x: bx, y: 1, z: Math.min(bz, bz2) - 1 },
            { x: bx, y: 1, z: Math.max(bz, bz2) + 1 }
          ];

          // Outer Shell Points (layer 2: y=3 roof, y=2 outer rim, y=1 outer ring)
          const outerPoints = isXAxis ? [
            { x: bx, y: 3, z: bz },
            { x: bx2, y: 3, z: bz },
            { x: bx, y: 2, z: bz + 1 },
            { x: bx, y: 2, z: bz - 1 },
            { x: bx2, y: 2, z: bz + 1 },
            { x: bx2, y: 2, z: bz - 1 },
            { x: Math.min(bx, bx2) - 1, y: 2, z: bz },
            { x: Math.max(bx, bx2) + 1, y: 2, z: bz },
            { x: bx, y: 1, z: bz + 2 },
            { x: bx, y: 1, z: bz - 2 },
            { x: bx2, y: 1, z: bz + 2 },
            { x: bx2, y: 1, z: bz - 2 }
          ] : [
            { x: bx, y: 3, z: bz },
            { x: bx, y: 3, z: bz2 },
            { x: bx + 1, y: 2, z: bz },
            { x: bx - 1, y: 2, z: bz },
            { x: bx + 1, y: 2, z: bz2 },
            { x: bx - 1, y: 2, z: bz2 },
            { x: bx, y: 2, z: Math.min(bz, bz2) - 1 },
            { x: bx, y: 2, z: Math.max(bz, bz2) + 1 },
            { x: bx + 2, y: 1, z: bz },
            { x: bx - 2, y: 1, z: bz },
            { x: bx + 2, y: 1, z: bz2 },
            { x: bx - 2, y: 1, z: bz2 }
          ];

          let placedCount = 0;
          let upgradedMaterial = null;

          const tryPlaceOrUpgrade = (pt, allowedReplace = []) => {
            const curBlock = this.world.getBlock(pt.x, pt.y, pt.z);
            const canPlace = !curBlock || (curBlock.canBreak && allowedReplace.includes(curBlock.type));
            if (!canPlace) return false;

            let matToPlace = null;
            if (this.bedDefenseMaterials.obsidian > 0) {
              matToPlace = 'OBSIDIAN';
              this.bedDefenseMaterials.obsidian--;
              this.bedDefenseTier = Math.max(this.bedDefenseTier, 4);
              upgradedMaterial = '黑曜石';
            } else if (this.bedDefenseMaterials.end_stone > 0) {
              matToPlace = 'END_STONE';
              this.bedDefenseMaterials.end_stone--;
              this.bedDefenseTier = Math.max(this.bedDefenseTier, 3);
              upgradedMaterial = upgradedMaterial || '防爆末地石';
            } else if (this.bedDefenseMaterials.wood > 0) {
              matToPlace = 'OAK_PLANKS';
              this.bedDefenseMaterials.wood--;
              this.bedDefenseTier = Math.max(this.bedDefenseTier, 2);
              upgradedMaterial = upgradedMaterial || '橡木木板';
            } else if (this.woolCount > 0 && !curBlock) {
              matToPlace = myTeam.wool;
              this.woolCount--;
              this.bedDefenseTier = Math.max(this.bedDefenseTier, 1);
              upgradedMaterial = upgradedMaterial || '防守羊毛';
            }

            if (matToPlace) {
              this.world.setBlock(pt.x, pt.y, pt.z, matToPlace, true, this.team);
              placedCount++;
              return true;
            }
            return false;
          };

          const woolTypes = ['RED_WOOL', 'BLUE_WOOL', 'GREEN_WOOL', 'YELLOW_WOOL'];

          // 1. Core layer upgrade (Obsidian > End Stone / Wood > Wool)
          for (const pt of innerPoints) {
            if (this.bedDefenseMaterials.obsidian > 0) {
              tryPlaceOrUpgrade(pt, [...woolTypes, 'OAK_PLANKS', 'END_STONE']);
            } else if (this.bedDefenseMaterials.wood > 0 || this.bedDefenseMaterials.end_stone > 0) {
              tryPlaceOrUpgrade(pt, woolTypes);
            } else {
              tryPlaceOrUpgrade(pt, []);
            }
          }

          // 2. Outer layer reinforcement (End Stone or remaining Wood/Wool)
          for (const pt of outerPoints) {
            if (this.bedDefenseMaterials.end_stone > 0 || this.bedDefenseMaterials.wood > 0 || this.woolCount >= 4) {
              tryPlaceOrUpgrade(pt, []);
            }
          }

          if (placedCount > 0) {
            if (window.soundManager && typeof window.soundManager.playPlace === 'function') {
              window.soundManager.playPlace();
            }
            if (upgradedMaterial && upgradedMaterial !== '防守羊毛' && window.game) {
              window.game.addChatMessage(`${myTeam.prefix}[${this.name}] 成功升级了床位防御！部署了 【${upgradedMaterial}】 坚固防线！`);
            }
          }

          this.hasDefendedBed = true;
          this.needsBedUpgrade = false;
          this.stateTimer = 0;
          this.activeBridgeAxis = null;
          this.chooseNextObjective(false);
        }
        break;
      }

      case 'PATROL_BASE': {
        // 1. Intercept any intruder within 16 blocks of red island (bed or generator)
        const intruder = this.findIntruderNearBase(16.0, allBots, player);
        if (intruder) {
          this.state = 'COMBAT';
          this.currentTarget = intruder;
          if (Math.random() < 0.35) {
            window.game.addChatMessage(`${myTeam.prefix}[${this.name}] 发现敌军逼近基地，正在全力守床迎敌！`);
          }
          break;
        }

        // 2. If bed is destroyed, switch back to dynamic objectives
        if (!this.world.bedStatus[this.team]) {
          this.chooseNextObjective();
          break;
        }

        // 3. If holding enough resources to afford gear, do a quick shopping run
        if (this.hasAffordableShopItem() && this.stateTimer > 6.0) {
          this.state = 'SHOP';
          this.stateTimer = 0;
          break;
        }

        // 4. Alternate patrol point between bed and generator
        if (this.patrolTimer <= 0) {
          this.patrolTarget = (this.patrolTarget === 'bed') ? 'gen' : 'bed';
          this.patrolTimer = 4.0 + Math.random() * 3.0;
        }

        const targetPos = (this.patrolTarget === 'bed') ? myTeam.bed : myTeam.gen;
        const dToTarget = Math.hypot(targetPos.x - this.position.x, targetPos.z - this.position.z);
        if (dToTarget > 2.2) {
          this.moveTo(targetPos.x, targetPos.z, this.speed * 0.85);
        } else {
          // Standing alertly at patrol post
          this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, 0, 0.4);
          this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, 0, 0.4);
        }
        break;
      }

      case 'FOLLOW_PLAYER': {
        if (!player || player.isDead) {
          this.chooseNextObjective();
          break;
        }

        // 1. Engage any enemies near player or bot
        const { target: nearbyTarget, dist: targetDist } = this.findTarget(player, allBots);
        if (nearbyTarget && targetDist < 10.0) {
          this.state = 'COMBAT';
          this.currentTarget = nearbyTarget;
          break;
        }

        // 2. Move towards player position
        const dToPlayer = this.position.distanceTo(player.position);
        if (dToPlayer > 5.5) {
          this.navigateAndBridge(player.position.x, player.position.z, false);
        } else if (dToPlayer > 2.8) {
          this.moveTo(player.position.x, player.position.z, this.sprintSpeed);
        } else {
          // Keep close position without bumping or vibrating
          this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, 0, 0.4);
          this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, 0, 0.4);
        }
        break;
      }

      case 'GATHER_DIAMOND': {
        const diaSpawner = this.findNearestDiamondSpawner();
        if (!diaSpawner) {
          this.chooseNextObjective();
          break;
        }

        // Opportunistic scavenging if a dropped diamond or emerald is nearby
        const nearbyDrop = this.findNearbyValuableDrop(6.5);
        if (nearbyDrop) {
          this.moveTo(nearbyDrop.mesh.position.x, nearbyDrop.mesh.position.z, this.speed);
        } else {
          if (this.woolCount <= 0 && Math.hypot(diaSpawner.x - this.position.x, diaSpawner.z - this.position.z) > 3.0) {
            this.state = (this.resources.iron >= 4) ? 'SHOP' : 'GATHER';
            this.stateTimer = 0;
            this.activeBridgeAxis = null;
            break;
          }
          const navRes = this.navigateAndBridge(diaSpawner.x, diaSpawner.z, false);
          if (navRes === 'NO_WOOL') {
            this.state = (this.resources.iron >= 4) ? 'SHOP' : 'GATHER';
            this.stateTimer = 0;
            this.activeBridgeAxis = null;
            break;
          }
        }

        const distToDia = Math.hypot(diaSpawner.x - this.position.x, diaSpawner.z - this.position.z);
        if (distToDia < 2.5) {
          this.moveTo(diaSpawner.x, diaSpawner.z, this.speed * 0.65);
          if (!this.islandStayTimer) this.islandStayTimer = 0;
          this.islandStayTimer += dt;

          // Return to shop when holding enough diamonds to actually afford a team upgrade!
          if (this.resources.diamond >= 2 && this.hasAffordableShopItem()) {
            window.game.addChatMessage(`${myTeam.prefix}[${this.name}] 成功收集了 ${this.resources.diamond} 颗钻石！准备回城升级全队科技！`);
            this.state = 'SHOP';
            this.stateTimer = 0;
            this.islandStayTimer = 0;
            this.activeBridgeAxis = null;
            break;
          }

          // Stay on diamond island for up to 13s (at least 1 full spawn cycle) before re-evaluating
          if (this.islandStayTimer > 13.0) {
            this.islandStayTimer = 0;
            this.activeBridgeAxis = null;
            this.chooseNextObjective(false);
            break;
          }
        }
        break;
      }

      case 'GATHER_EMERALD': {
        const emeSpawner = this.findNearestEmeraldSpawner();
        if (!emeSpawner) {
          this.chooseNextObjective();
          break;
        }

        // Opportunistic scavenging if an emerald drop is nearby
        const nearbyDrop = this.findNearbyValuableDrop(7.5);
        if (nearbyDrop) {
          this.moveTo(nearbyDrop.mesh.position.x, nearbyDrop.mesh.position.z, this.speed);
        } else {
          if (this.woolCount <= 0 && Math.hypot(emeSpawner.x - this.position.x, emeSpawner.z - this.position.z) > 3.0) {
            this.state = (this.resources.iron >= 4) ? 'SHOP' : 'GATHER';
            this.stateTimer = 0;
            this.activeBridgeAxis = null;
            break;
          }
          const navRes = this.navigateAndBridge(emeSpawner.x, emeSpawner.z, false);
          if (navRes === 'NO_WOOL') {
            this.state = (this.resources.iron >= 4) ? 'SHOP' : 'GATHER';
            this.stateTimer = 0;
            this.activeBridgeAxis = null;
            break;
          }
        }

        const distToEme = Math.hypot(emeSpawner.x - this.position.x, emeSpawner.z - this.position.z);
        if (distToEme < 2.8) {
          this.moveTo(emeSpawner.x, emeSpawner.z, this.speed * 0.65);
          if (!this.islandStayTimer) this.islandStayTimer = 0;
          this.islandStayTimer += dt;

          // If gathered enough emeralds for diamond gear, return to shop!
          const canBuyDiaArmor = (this.resources.emerald >= 6 && this.armorTier !== 'diamond');
          const canBuyDiaSword = (this.resources.emerald >= 4 && this.weaponTier !== 'diamond');
          if (canBuyDiaArmor || canBuyDiaSword) {
            window.game.addChatMessage(`${myTeam.prefix}[${this.name}] 在中路成功抢夺了 ${this.resources.emerald} 颗绿宝石！正在返程购买钻石神装！`);
            this.state = 'SHOP';
            this.stateTimer = 0;
            this.islandStayTimer = 0;
            this.activeBridgeAxis = null;
            break;
          }

          if (this.islandStayTimer > 15.0) {
            this.islandStayTimer = 0;
            this.activeBridgeAxis = null;
            this.chooseNextObjective(false);
            break;
          }
        }
        break;
      }

      case 'BRIDGE': {
        const targetBed = this.findTargetBed();
        if (!targetBed) {
          this.chooseNextObjective();
          break;
        }

        // Opportunistic scavenging along bridge
        const nearbyDrop = this.findNearbyValuableDrop(5.0);
        if (nearbyDrop) {
          this.moveTo(nearbyDrop.mesh.position.x, nearbyDrop.mesh.position.z, this.speed);
        } else {
          if (this.woolCount <= 0 && this.position.distanceTo(targetBed.pos) > 4.0) {
            this.state = (this.resources.iron >= 4) ? 'SHOP' : 'GATHER';
            this.stateTimer = 0;
            this.activeBridgeAxis = null;
            break;
          }
          const navRes = this.navigateAndBridge(targetBed.pos.x, targetBed.pos.z, true);
          if (navRes === 'NO_WOOL') {
            this.state = (this.resources.iron >= 4) ? 'SHOP' : 'GATHER';
            this.stateTimer = 0;
            this.activeBridgeAxis = null;
            break;
          }
        }

        // Check if reached destination bed
        if (this.position.distanceTo(targetBed.pos) < 5.0) {
          this.state = 'ATTACK_BED';
          this.mineBedTimer = 0;
          this.stateTimer = 0;
        }
        break;
      }

      case 'ATTACK_BED': {
        const targetBed = this.findTargetBed();
        if (!targetBed || this.stateTimer > 25.0) {
          this.miningBlock = null;
          this.chooseNextObjective();
          break;
        }

        const distToBed = this.position.distanceTo(targetBed.pos);
        if (distToBed > 3.2) {
          this.moveTo(targetBed.pos.x, targetBed.pos.z, this.sprintSpeed);
          this.miningBlock = null;
        } else {
          // In range to mine defense / bed! Decelerate to steady position
          this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, 0, 0.4);
          this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, 0, 0.4);

          const bx = targetBed.pos.x;
          const bz = targetBed.pos.z;

          // 1. Locate bed blocks
          const bedBlocks = [];
          for (let ox = -2; ox <= 2; ox++) {
            for (let oy = 0; oy <= 2; oy++) {
              for (let oz = -2; oz <= 2; oz++) {
                const b = this.world.getBlock(bx + ox, oy, bz + oz);
                if (b && b.type && b.type.includes('BED') && b.team === targetBed.team) {
                  bedBlocks.push({ x: bx + ox, y: oy, z: bz + oz, type: b.type });
                }
              }
            }
          }

          if (bedBlocks.length === 0) {
            // Bed already destroyed
            this.miningBlock = null;
            this.chooseNextObjective();
            break;
          }

          // 2. Check if bed itself is exposed (has an adjacent face that is air)
          let exposedBed = null;
          for (const bb of bedBlocks) {
            const hasOpenFace = !this.world.getBlock(bb.x, bb.y + 1, bb.z) ||
                                !this.world.getBlock(bb.x + 1, bb.y, bb.z) ||
                                !this.world.getBlock(bb.x - 1, bb.y, bb.z) ||
                                !this.world.getBlock(bb.x, bb.y, bb.z + 1) ||
                                !this.world.getBlock(bb.x, bb.y, bb.z - 1);
            if (hasOpenFace) {
              exposedBed = bb;
              break;
            }
          }

          let blockToMine = null;

          if (exposedBed) {
            // Bed is exposed! Bot directly mines the bed!
            blockToMine = exposedBed;
          } else {
            // Bed is covered by defensive blocks. Find all breakable defensive blocks surrounding bed
            const candidateDefenses = [];
            for (let ox = -3; ox <= 3; ox++) {
              for (let oy = 1; oy <= 4; oy++) {
                for (let oz = -3; oz <= 3; oz++) {
                  const cb = this.world.getBlock(bx + ox, oy, bz + oz);
                  if (cb && cb.canBreak && !cb.type.includes('BED')) {
                    const d = Math.hypot(bx + ox + 0.5 - this.position.x, bz + oz + 0.5 - this.position.z, oy - this.position.y);
                    candidateDefenses.push({ x: bx + ox, y: oy, z: bz + oz, type: cb.type, dist: d });
                  }
                }
              }
            }

            if (candidateDefenses.length > 0) {
              // Mine the closest defensive block to break through
              candidateDefenses.sort((a, b) => a.dist - b.dist);
              blockToMine = candidateDefenses[0];
            } else {
              // Fallback to bed block
              blockToMine = bedBlocks[0];
            }
          }

          if (!blockToMine) {
            this.miningBlock = null;
            this.chooseNextObjective();
            break;
          }

          // 3. Realistic Mining Process with Timer & Audio (NO INSTANT BREAKING)
          if (!this.miningBlock || this.miningBlock.x !== blockToMine.x || this.miningBlock.y !== blockToMine.y || this.miningBlock.z !== blockToMine.z) {
            const reqTime = this.getRequiredBreakTime(blockToMine.type);
            this.miningBlock = {
              x: blockToMine.x,
              y: blockToMine.y,
              z: blockToMine.z,
              type: blockToMine.type,
              timer: 0,
              requiredTime: reqTime,
              lastSoundTime: performance.now()
            };
          }

          // Turn bot head towards the mining block
          const targetAngle = Math.atan2(blockToMine.x + 0.5 - this.position.x, blockToMine.z + 0.5 - this.position.z);
          this.yaw = targetAngle;
          this.targetYaw = targetAngle;

          // Swing arm continuously
          this.rightArm.rotation.x = -Math.PI / 2 + Math.sin(performance.now() * 0.02) * 0.6;

          // Play hit sound periodically during mining (every 260ms)
          const now = performance.now();
          if (now - this.miningBlock.lastSoundTime > 260) {
            if (window.soundManager && typeof window.soundManager.playHit === 'function') {
              window.soundManager.playHit();
            }
            this.miningBlock.lastSoundTime = now;
          }

          // Accumulate mining timer
          this.miningBlock.timer += dt;

          // Check if mining time reached required duration
          if (this.miningBlock.timer >= this.miningBlock.requiredTime) {
            if (this.miningBlock.type.includes('BED')) {
              this.world.destroyBed(targetBed.team);
              this.miningBlock = null;
              this.chooseNextObjective();
            } else {
              this.world.removeBlock(this.miningBlock.x, this.miningBlock.y, this.miningBlock.z);
              if (window.soundManager && typeof window.soundManager.playBreak === 'function') {
                window.soundManager.playBreak();
              }
              this.miningBlock = null;
            }
          }
        }
        break;
      }

      case 'COMBAT': {
        this.miningBlock = null;
        if (!target || !target.entity || target.entity.isDead) {
          // Target eliminated -> choose next objective dynamically
          this.chooseNextObjective();
          break;
        }

        if (target.type === 'player' && !this.canDetectPlayer(player)) {
          // Player is invisible and not holding a weapon -> Bot loses sight of player!
          this.currentTarget = null;
          this.chooseNextObjective();
          break;
        }

        const targetPos = target.pos;
        const curDist = this.position.distanceTo(targetPos);

        // Target moved behind solid wall / obstacle: bot loses line of sight and re-evaluates objective
        if (curDist > 2.2 && !this.hasLineOfSight(targetPos)) {
          this.currentTarget = null;
          this.chooseNextObjective();
          break;
        }

        // 1. Emergency Golden Apple (Heal when below 13 HP)
        if (this.health <= 13 && this.goldenApples > 0 && this.healCooldown <= 0) {
          this.eatGoldenApple();
        }

        // If target escaped too far, do not get stuck staring across the void: re-evaluate!
        const isPvPDuel = !!(window.game && window.game.currentMode === 'pvp_1v1');
        const isSkyWars = !!(window.game && window.game.currentMode && window.game.currentMode.startsWith('skywars'));

        if (curDist > 12.0) {
          if (isPvPDuel) {
            // In PvP mode, never exit COMBAT! Approach target aggressively
            this.moveTo(targetPos.x, targetPos.z, this.sprintSpeed);
            if (this.hasBow && this.arrowCount > 0 && this.bowCooldown <= 0) {
              this.shootArrow(targetPos);
            }
            break;
          } else if (isSkyWars) {
            // In SkyWars mode, use bow or bridge/navigate towards enemy island!
            if (this.hasBow && this.arrowCount > 0 && this.bowCooldown <= 0 && curDist < 26.0) {
              this.shootArrow(targetPos);
            }
            const navRes = this.navigateAndBridge(targetPos.x, targetPos.z, true);
            if (navRes === 'NO_WOOL' || navRes === 'ARRIVED') {
              this.moveTo(targetPos.x, targetPos.z, this.sprintSpeed);
            }
            break;
          } else {
            this.chooseNextObjective();
            break;
          }
        }

        // 2. Ranged Fireball Attack (at 8 - 22 blocks distance)
        if (curDist > 8.0 && curDist < 22.0 && this.fireballs > 0 && this.fireballCooldown <= 0) {
          this.shootFireball(targetPos);
        }
        if (curDist > 7.0 && curDist < 26.0 && this.hasBow && this.arrowCount > 0 && this.bowCooldown <= 0) {
          this.shootArrow(targetPos);
        }

        // 3. Pro PVP Circling & Dynamic Strafing (环绕走位)
        const dx = targetPos.x - this.position.x;
        const dz = targetPos.z - this.position.z;
        const distXZ = Math.hypot(dx, dz);

        if (distXZ > 0.1) {
          const dirX = dx / distXZ;
          const dirZ = dz / distXZ;

          // Perpendicular vector for strafe circling
          const perpX = -dirZ;
          const perpZ = dirX;

          this.strafeTimer += dt;
          if (this.strafeTimer >= this.strafeChangeInterval) {
            this.strafeTimer = 0;
            this.strafeDir = (Math.random() < 0.65) ? -this.strafeDir : this.strafeDir;
          }

          // Approach forward + Strafe sideways (back off slightly if too close so bots don't collide & jump in place)
          const forwardWeight = curDist > 2.6 ? 0.85 : (curDist < 1.7 ? -0.25 : 0.15);
          const strafeWeight = 0.65;
          const moveVx = (dirX * forwardWeight + perpX * this.strafeDir * strafeWeight) * this.sprintSpeed;
          const moveVz = (dirZ * forwardWeight + perpZ * this.strafeDir * strafeWeight) * this.sprintSpeed;

          this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, moveVx, dt * 10.0);
          this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, moveVz, dt * 10.0);
          this.targetYaw = Math.atan2(dx, dz);
        }

        // 4. Pro Jump-Crit System (跳劈暴击) — only while actively closing distance, never jump in place
        const hSpd = Math.hypot(this.velocity.x, this.velocity.z);
        if (curDist < 3.4 && curDist > 2.1 && hSpd > 2.5 && this.onGround && this.jumpCooldown <= 0) {
          if (Math.random() < this.critChance * 0.05) {
            this.velocity.y = this.jumpForce * 0.82;
            this.jumpCooldown = this.difficulty === 'nightmare' ? 1.8 : 2.6;
          }
        }

        // 5. Melee Sword Attack
        if (curDist < 3.2 && this.attackCooldown <= 0) {
          this.attackCooldown = this.baseAttackInterval;

          // Swing arm animation
          this.rightArm.rotation.x = -Math.PI / 2;
          setTimeout(() => { this.rightArm.rotation.x = 0; }, 110);

          // Check if landing a Critical Hit or Mace Smash
          const isCrit = (this.velocity.y < -0.2);
          let finalDmg = this.damage;
          const teamSharp = (window.game && window.game.teamUpgrades && window.game.teamUpgrades[this.team]) ? window.game.teamUpgrades[this.team].sharpness : 0;
          finalDmg += teamSharp;

          const isMace = (this.weaponTier === 'mace' || this.hasMace);
          if (isMace) {
            const heightAdv = Math.max(0, this.position.y - targetPos.y);
            const maceBonus = Math.floor(heightAdv) * 6;
            finalDmg = 6 + maceBonus + teamSharp;
            if (heightAdv >= 1.0) {
              if (window.soundManager && typeof window.soundManager.playHeavySmash === 'function') {
                window.soundManager.playHeavySmash();
              } else {
                window.soundManager.playDing();
              }
              if (window.WeaponModelBuilder && typeof window.WeaponModelBuilder.spawnSmashShockwave === 'function') {
                window.WeaponModelBuilder.spawnSmashShockwave(this.world, targetPos);
              }
            } else {
              window.soundManager.playHit();
            }
          } else if (isCrit) {
            finalDmg = Math.round(finalDmg * 2.0);
            window.soundManager.playDing();
            if (this.world.spawnCritParticles) {
              this.world.spawnCritParticles(targetPos);
            }
          } else {
            window.soundManager.playHit();
          }

          const hitDir = new THREE.Vector3(dx, 0, dz).normalize();

          if (target.type === 'player') {
            window.player.takeDamage(finalDmg, hitDir);
          } else if (target.type === 'bot') {
            target.entity.takeDamage(finalDmg, hitDir, this.name);
          }

          // W-Tap Sprint Reset Boost: Brief sprint push for massive knockback
          this.wTapTimer = 0.08;
          this.velocity.x += hitDir.x * 2.5;
          this.velocity.z += hitDir.z * 2.5;
        }
        break;
      }
    }
  }

  moveTo(targetX, targetZ, moveSpeed) {
    const dx = targetX - this.position.x;
    const dz = targetZ - this.position.z;
    const dist = Math.hypot(dx, dz);

    if (dist > 0.25) {
      this.targetYaw = Math.atan2(dx, dz);
      const targetVx = (dx / dist) * moveSpeed;
      const targetVz = (dz / dist) * moveSpeed;
      this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, targetVx, 0.25);
      this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, targetVz, 0.25);
    } else {
      this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, 0, 0.3);
      this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, 0, 0.3);
    }
  }

  lookAt(x, y, z) {
    const dx = x - this.position.x;
    const dz = z - this.position.z;
    this.yaw = Math.atan2(dx, dz);
    this.targetYaw = this.yaw;
    if (y !== undefined) {
      const distXZ = Math.hypot(dx, dz);
      const dy = y - (this.position.y + 1.5);
      this.pitch = Math.atan2(dy, distXZ);
    }
  }

  hasGroundBelow(posX, posZ) {
    const isSchoolBR = (window.game && window.game.currentMode === 'school_br');
    const isPVP = (window.game && window.game.currentMode === 'pvp_1v1');
    if (isSchoolBR || isPVP) return true; // Full arena maps without floating islands/void

    const footBx = Math.floor(posX + 0.5);
    const footBz = Math.floor(posZ + 0.5);
    const curFootBy = Math.floor(this.position.y - 0.5 + 0.5);

    for (let dy = 0; dy <= 3; dy++) {
      if (this.world.getBlock(footBx, curFootBy - dy, footBz)) {
        return true;
      }
    }
    if (this.state === 'BRIDGE' || this.state === 'BRIDGE_MID') {
      return true;
    }
    return false;
  }

  applyPhysics(dt) {
    const halfW = 0.26;
    const height = this.height || 1.8;

    // 1. Gravity & Floor / Ceiling Collision
    const prevY = this.position.y;
    this.velocity.y -= this.gravity * dt;
    this.position.y += this.velocity.y * dt;
    this.onGround = false;

    const minBx = Math.floor(this.position.x - halfW + 0.5);
    const maxBx = Math.floor(this.position.x + halfW + 0.5);
    const minBz = Math.floor(this.position.z - halfW + 0.5);
    const maxBz = Math.floor(this.position.z + halfW + 0.5);

    if (this.velocity.y <= 0) {
      const scanStartY = Math.floor(prevY + 0.3);
      const scanEndY = Math.floor(this.position.y - 0.4);

      for (let by = scanStartY; by >= scanEndY; by--) {
        for (let bx = minBx; bx <= maxBx; bx++) {
          for (let bz = minBz; bz <= maxBz; bz++) {
            const block = this.world.getBlock(bx, by, bz);
            if (block) {
              const topY = (block.type && block.type.startsWith('BED_')) ? (block.y + 0.06) : (block.y + 0.5);
              if (this.position.y <= topY && prevY >= topY - 0.35) {
                this.position.y = topY;
                this.velocity.y = 0;
                this.onGround = true;
                break;
              }
            }
          }
          if (this.onGround) break;
        }
        if (this.onGround) break;
      }
    } else {
      // Jumping up: check ceiling collision to prevent jumping through ceilings/floors
      const headY = this.position.y + height;
      const prevHeadY = prevY + height;
      const scanStartY = Math.floor(prevHeadY - 0.5);
      const scanEndY = Math.floor(headY + 0.5);

      for (let by = scanStartY; by <= scanEndY; by++) {
        for (let bx = minBx; bx <= maxBx; bx++) {
          for (let bz = minBz; bz <= maxBz; bz++) {
            const block = this.world.getBlock(bx, by, bz);
            if (block) {
              const bottomY = block.y - 0.5;
              if (headY >= bottomY && prevHeadY <= bottomY + 0.8) {
                this.position.y = bottomY - height;
                this.velocity.y = 0;
                break;
              }
            }
          }
          if (this.velocity.y === 0) break;
        }
        if (this.velocity.y === 0) break;
      }
    }

    // 2. Horizontal Movement (Wall Collision & Auto Step-Up)
    // Applies at ALL TIMES (Grounded OR Airborne), strictly preventing wall clipping!
    const bodyMinBy = Math.floor(this.position.y + 0.15 + 0.5);
    const bodyMaxBy = Math.floor(this.position.y + height - 0.1 + 0.5);

    // --- X Axis ---
    const dx = this.velocity.x * dt;
    if (Math.abs(dx) > 0.0001) {
      let canMoveX = true;
      if (this.onGround && !this.hasGroundBelow(this.position.x + dx, this.position.z)) {
        canMoveX = false;
        this.velocity.x = 0;
      }

      if (canMoveX) {
        const targetX = this.position.x + dx;
        const targetMinBx = Math.floor(targetX - halfW + 0.5);
        const targetMaxBx = Math.floor(targetX + halfW + 0.5);
        const curMinBz = Math.floor(this.position.z - halfW + 0.5);
        const curMaxBz = Math.floor(this.position.z + halfW + 0.5);

        let hitWall = false;
        for (let bx = targetMinBx; bx <= targetMaxBx; bx++) {
          for (let by = bodyMinBy; by <= bodyMaxBy; by++) {
            for (let bz = curMinBz; bz <= curMaxBz; bz++) {
              if (this.world.getBlock(bx, by, bz)) {
                hitWall = true;
                break;
              }
            }
            if (hitWall) break;
          }
          if (hitWall) break;
        }

        // Auto Step-Up: If grounded and hitting an obstacle (e.g. 1-block stair), step up if space above is clear
        if (hitWall && this.onGround) {
          const stepUpY = this.position.y + 1.0;
          const stepMinBy = Math.floor(stepUpY + 0.15 + 0.5);
          const stepMaxBy = Math.floor(stepUpY + height - 0.1 + 0.5);
          let clearAbove = true;
          for (let bx = targetMinBx; bx <= targetMaxBx; bx++) {
            for (let by = stepMinBy; by <= stepMaxBy; by++) {
              for (let bz = curMinBz; bz <= curMaxBz; bz++) {
                if (this.world.getBlock(bx, by, bz)) {
                  clearAbove = false;
                  break;
                }
              }
              if (!clearAbove) break;
            }
            if (!clearAbove) break;
          }
          if (clearAbove) {
            this.position.y += 1.0;
            this.position.x = targetX;
            this.onGround = true;
            hitWall = false;
          }
        }

        if (!hitWall) {
          this.position.x = targetX;
        } else {
          this.velocity.x = 0;
          // Only jump over low obstacles (< 2 blocks tall), never jump in place against tall arena walls
          const wallTopClear = !this.world.isSolid(Math.floor(targetX + 0.5), Math.floor(this.position.y) + 2, Math.floor(this.position.z + 0.5));
          if (wallTopClear && this.onGround && this.jumpCooldown <= 0) {
            this.velocity.y = this.jumpForce;
            this.jumpCooldown = 0.8;
          }
        }
      }
    }

    // --- Z Axis ---
    const dz = this.velocity.z * dt;
    if (Math.abs(dz) > 0.0001) {
      let canMoveZ = true;
      if (this.onGround && !this.hasGroundBelow(this.position.x, this.position.z + dz)) {
        canMoveZ = false;
        this.velocity.z = 0;
      }

      if (canMoveZ) {
        const targetZ = this.position.z + dz;
        const curMinBx = Math.floor(this.position.x - halfW + 0.5);
        const curMaxBx = Math.floor(this.position.x + halfW + 0.5);
        const targetMinBz = Math.floor(targetZ - halfW + 0.5);
        const targetMaxBz = Math.floor(targetZ + halfW + 0.5);

        let hitWall = false;
        for (let bx = curMinBx; bx <= curMaxBx; bx++) {
          for (let by = bodyMinBy; by <= bodyMaxBy; by++) {
            for (let bz = targetMinBz; bz <= targetMaxBz; bz++) {
              if (this.world.getBlock(bx, by, bz)) {
                hitWall = true;
                break;
              }
            }
            if (hitWall) break;
          }
          if (hitWall) break;
        }

        // Auto Step-Up: If grounded and hitting an obstacle (e.g. 1-block stair), step up if space above is clear
        if (hitWall && this.onGround) {
          const stepUpY = this.position.y + 1.0;
          const stepMinBy = Math.floor(stepUpY + 0.15 + 0.5);
          const stepMaxBy = Math.floor(stepUpY + height - 0.1 + 0.5);
          let clearAbove = true;
          for (let bz = targetMinBz; bz <= targetMaxBz; bz++) {
            for (let by = stepMinBy; by <= stepMaxBy; by++) {
              for (let bx = curMinBx; bx <= curMaxBx; bx++) {
                if (this.world.getBlock(bx, by, bz)) {
                  clearAbove = false;
                  break;
                }
              }
              if (!clearAbove) break;
            }
            if (!clearAbove) break;
          }
          if (clearAbove) {
            this.position.y += 1.0;
            this.position.z = targetZ;
            this.onGround = true;
            hitWall = false;
          }
        }

        if (!hitWall) {
          this.position.z = targetZ;
        } else {
          this.velocity.z = 0;
          const wallTopClearZ = !this.world.isSolid(Math.floor(this.position.x + 0.5), Math.floor(this.position.y) + 2, Math.floor(targetZ + 0.5));
          if (wallTopClearZ && this.onGround && this.jumpCooldown <= 0) {
            this.velocity.y = this.jumpForce;
            this.jumpCooldown = 0.8;
          }
        }
      }
    }

    // Survival War circular boundary & Duel Arena safety
    if (window.game && window.game.currentMode === 'survival_war') {
      const distXZ = Math.hypot(this.position.x, this.position.z);
      if (!window.game.survivalDuelStarted) {
        if (distXZ > 298.0) {
          const scale = 298.0 / distXZ;
          this.position.x *= scale;
          this.position.z *= scale;
        }
      } else {
        if (distXZ > 24.0) {
          const scale = 24.0 / distXZ;
          this.position.x *= scale;
          this.position.z *= scale;
        }
        if (this.position.y < 47.0) {
          this.position.set(0, 50, 0);
          this.velocity.set(0, 0, 0);
        }
      }
    }
  }
}

window.Bot = Bot;
