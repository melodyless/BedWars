// Autonomous Minecraft Bedwars - Bot & Player Skin Management System
// Full support for custom Minecraft skin import (64x64 / 64x32 PNG) and HD presets
(function() {
  class SkinManager {
    constructor() {
      this.STORAGE_KEY = 'bedwars_custom_skins_v1';
      this.configs = {};
      this.canvasCache = {};
      this.matCache = {};
      this.isModalOpen = false;

      // Built-in authentic presets
      this.presets = {
        steve: {
          id: 'steve',
          name: '史蒂夫 (Steve)',
          desc: '经典蓝衫牛仔裤 · 传奇矿工',
          color: '#008b8b'
        },
        alex: {
          id: 'alex',
          name: '爱丽克丝 (Alex)',
          desc: '绿衣棕裤红发 · 探险家',
          color: '#526839'
        },
        zombie: {
          id: 'zombie',
          name: '僵尸 (Zombie)',
          desc: '青苔绿皮破衫 · 经典怪物',
          color: '#4b6a38'
        },
        skeleton: {
          id: 'skeleton',
          name: '骷髅 (Skeleton)',
          desc: '白骨亡灵神射手 · 幽暗骨架',
          color: '#c5c5c5'
        },
        enderman: {
          id: 'enderman',
          name: '末影人 (Enderman)',
          desc: '深渊幽黑紫瞳 · 空间瞬移者',
          color: '#1a1024'
        },
        creeper: {
          id: 'creeper',
          name: '苦力怕 (Creeper)',
          desc: '迷彩爆炸狂魔 · 经典苦脸',
          color: '#289234'
        },
        knight: {
          id: 'knight',
          name: '黑曜石骑士 (Knight)',
          desc: '重装黑曜石钢甲 · 猩红目镜',
          color: '#1c1f26'
        },
        cyber: {
          id: 'cyber',
          name: '赛博机甲 (Cyber)',
          desc: '钛合金战术外骨骼 · 霓虹青光',
          color: '#00e5ff'
        },
        demon: {
          id: 'demon',
          name: '熔岩恶魔 (Demon)',
          desc: '地狱烈焰熔岩裂纹 · 炽热金瞳',
          color: '#b71c1c'
        },
        team: {
          id: 'team',
          name: '阵营专属卫兵 (Team)',
          desc: '随队伍红/蓝/绿/黄颜色自动变换战术迷彩',
          color: '#2196f3'
        }
      };

      // Default skin allocation per bot
      this.defaultAllocations = {
        player: 'steve',
        red_mate: 'alex',
        blue_1: 'zombie',
        blue_2: 'skeleton',
        green_1: 'creeper',
        green_2: 'enderman',
        yellow_1: 'cyber',
        yellow_2: 'knight'
      };

      this.loadSavedConfigs();
    }

    loadSavedConfigs() {
      try {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        if (raw) {
          this.configs = JSON.parse(raw);
        }
      } catch (e) {
        console.warn('Failed to load saved skin configs:', e);
        this.configs = {};
      }
    }

    saveConfigs() {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.configs));
      } catch (e) {
        console.warn('Failed to save skin configs (quota exceeded?):', e);
      }
    }

    getRandomSkinConfig() {
      const presetKeys = ['steve', 'alex', 'zombie', 'skeleton', 'enderman', 'creeper', 'knight', 'cyber', 'demon'];
      const pKey = presetKeys[Math.floor(Math.random() * presetKeys.length)];
      return { type: 'preset', id: pKey };
    }

    getBotSkinConfig(botId, team = 'blue') {
      if (this.configs[botId]) {
        return this.configs[botId];
      }
      // End Realm Boss custom skin
      if (botId === 'end_boss') {
        return { type: 'custom', name: 'end_boss.png', data: window.BOSS_SKIN_DATAURL };
      }
      // If school battle royale bot, randomly assign distinct presets
      if (botId && (botId.startsWith('bot_br_') || botId.startsWith('bot_school_'))) {
        const presetKeys = ['steve', 'alex', 'zombie', 'skeleton', 'enderman', 'creeper', 'knight', 'cyber', 'demon'];
        const hash = botId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const pKey = presetKeys[hash % presetKeys.length];
        this.configs[botId] = { type: 'preset', id: pKey };
        return this.configs[botId];
      }
      // Fallback to default allocation or team preset
      const defPreset = this.defaultAllocations[botId] || 'team';
      return { type: 'preset', id: defPreset };
    }

    setBotSkin(botId, config) {
      this.configs[botId] = config;
      this.saveConfigs();
      this.clearBotCache(botId);

      // Live update if bot is currently in scene
      this.refreshBot(botId);
    }

    clearBotCache(botId) {
      Object.keys(this.canvasCache).forEach(k => {
        if (k.includes(botId)) delete this.canvasCache[k];
      });
      Object.keys(this.matCache).forEach(k => {
        if (k.includes(botId)) delete this.matCache[k];
      });
    }

    // Helper: Create a 2D canvas with disabled smoothing
    createCanvas(w, h) {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      return { canvas, ctx };
    }

    // Generate full authentic 64x64 Minecraft skin canvas for built-in presets
    getPresetSkinCanvas(presetId, team = 'blue') {
      const cacheKey = `preset_${presetId}_${team}`;
      if (this.canvasCache[cacheKey]) return this.canvasCache[cacheKey];

      const { canvas, ctx } = this.createCanvas(64, 64);

      // Background transparent
      ctx.clearRect(0, 0, 64, 64);

      switch (presetId) {
        case 'alex': {
          // Alex (Ginger hair, green tunic, brown pants)
          // Head Base
          ctx.fillStyle = '#e8b58f';
          ctx.fillRect(8, 8, 8, 8); // face
          ctx.fillRect(0, 8, 8, 8); // right
          ctx.fillRect(16, 8, 8, 8); // left
          ctx.fillRect(24, 8, 8, 8); // back
          ctx.fillStyle = '#a84c1e'; // ginger hair
          ctx.fillRect(8, 0, 8, 8); // top
          ctx.fillRect(8, 8, 8, 2); // fringe
          ctx.fillRect(0, 8, 8, 4);
          ctx.fillRect(16, 8, 8, 4);
          ctx.fillRect(24, 8, 8, 8);
          // Eyes
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(10, 12, 1, 1);
          ctx.fillRect(13, 12, 1, 1);
          ctx.fillStyle = '#3a6838'; // Green eyes
          ctx.fillRect(11, 12, 1, 1);
          ctx.fillRect(14, 12, 1, 1);
          // Torso
          ctx.fillStyle = '#54693a'; // Olive tunic
          ctx.fillRect(20, 20, 8, 12);
          ctx.fillRect(32, 20, 8, 12);
          ctx.fillRect(16, 20, 4, 12);
          ctx.fillRect(28, 20, 4, 12);
          ctx.fillStyle = '#3a271b'; // Belt
          ctx.fillRect(20, 28, 8, 2);
          // Arms
          ctx.fillStyle = '#54693a';
          ctx.fillRect(44, 20, 4, 4);
          ctx.fillRect(36, 52, 4, 4);
          ctx.fillStyle = '#e8b58f';
          ctx.fillRect(44, 24, 4, 8);
          ctx.fillRect(36, 56, 4, 8);
          // Legs
          ctx.fillStyle = '#3c2c1e'; // Brown pants
          ctx.fillRect(4, 20, 4, 10);
          ctx.fillRect(20, 52, 4, 10);
          ctx.fillStyle = '#221810'; // Shoes
          ctx.fillRect(4, 30, 4, 2);
          ctx.fillRect(20, 62, 4, 2);
          break;
        }

        case 'zombie': {
          // Zombie (Rotting green skin, blue shirt, purple pants)
          const gSkin = '#4a6b38';
          const gDark = '#3a542b';
          // Head
          ctx.fillStyle = gSkin;
          ctx.fillRect(0, 0, 32, 16);
          ctx.fillStyle = gDark;
          ctx.fillRect(8, 0, 8, 4);
          // Face features
          ctx.fillStyle = '#1e2d16'; // Dark hollow eyes
          ctx.fillRect(10, 11, 2, 2);
          ctx.fillRect(14, 11, 2, 2);
          ctx.fillRect(11, 14, 4, 1); // Mouth
          // Torso (Tattered teal shirt)
          ctx.fillStyle = '#2c6b6b';
          ctx.fillRect(16, 16, 24, 16);
          // Arms (Rotting green bare arms)
          ctx.fillStyle = gSkin;
          ctx.fillRect(40, 16, 16, 16);
          ctx.fillRect(32, 48, 16, 16);
          // Legs (Dark purple pants)
          ctx.fillStyle = '#33234a';
          ctx.fillRect(0, 16, 16, 16);
          ctx.fillRect(16, 48, 16, 16);
          break;
        }

        case 'skeleton': {
          // Skeleton (Bone grey skull, ribcage, skeleton limbs)
          const bone = '#c8c8c8';
          const darkBone = '#a0a0a0';
          // Skull
          ctx.fillStyle = bone;
          ctx.fillRect(0, 0, 32, 16);
          ctx.fillStyle = darkBone;
          ctx.fillRect(8, 0, 8, 2);
          // Hollow eye sockets & nose & teeth
          ctx.fillStyle = '#151515';
          ctx.fillRect(10, 10, 2, 2);
          ctx.fillRect(14, 10, 2, 2);
          ctx.fillRect(12, 13, 2, 1);
          ctx.fillStyle = '#e5e5e5';
          ctx.fillRect(10, 14, 6, 1);
          // Torso (Ribcage over hollow darkness)
          ctx.fillStyle = '#151515';
          ctx.fillRect(16, 16, 24, 16);
          ctx.fillStyle = bone;
          ctx.fillRect(23, 20, 2, 12); // Spine
          ctx.fillRect(20, 22, 8, 1);  // Rib 1
          ctx.fillRect(20, 25, 8, 1);  // Rib 2
          ctx.fillRect(20, 28, 8, 1);  // Rib 3
          // Limbs
          ctx.fillStyle = darkBone;
          ctx.fillRect(40, 16, 16, 16);
          ctx.fillRect(32, 48, 16, 16);
          ctx.fillRect(0, 16, 16, 16);
          ctx.fillRect(16, 48, 16, 16);
          break;
        }

        case 'enderman': {
          // Enderman (Jet pitch black, glowing purple eyes)
          ctx.fillStyle = '#0f0f12';
          ctx.fillRect(0, 0, 64, 64);
          // Subtle purple dust
          ctx.fillStyle = '#1a1024';
          ctx.fillRect(8, 0, 8, 8);
          ctx.fillRect(20, 20, 8, 12);
          // Glowing violet eyes
          ctx.fillStyle = '#d544ff';
          ctx.fillRect(9, 11, 3, 1);
          ctx.fillRect(14, 11, 3, 1);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(10, 11, 1, 1);
          ctx.fillRect(15, 11, 1, 1);
          break;
        }

        case 'creeper': {
          // Creeper (Pixelated camouflage green with iconic frowning face)
          const greens = ['#20882e', '#2bb33c', '#176921', '#3cd151'];
          for (let y = 0; y < 64; y += 2) {
            for (let x = 0; x < 64; x += 2) {
              const c = greens[((x * 7 + y * 13) % greens.length)];
              ctx.fillStyle = c;
              ctx.fillRect(x, y, 2, 2);
            }
          }
          // Iconic Creeper Face on front of head (x=8..16, y=8..16)
          ctx.fillStyle = '#0a0a0a';
          ctx.fillRect(10, 10, 2, 2); // Left eye
          ctx.fillRect(14, 10, 2, 2); // Right eye
          ctx.fillRect(11, 12, 4, 2); // Nose bridge
          ctx.fillRect(10, 13, 2, 3); // Left mouth corner
          ctx.fillRect(14, 13, 2, 3); // Right mouth corner
          ctx.fillRect(11, 13, 4, 1);
          break;
        }

        case 'knight': {
          // Obsidian Knight (Dark heavy steel armor, crimson glowing visor)
          ctx.fillStyle = '#1a1c23';
          ctx.fillRect(0, 0, 64, 64);
          ctx.fillStyle = '#2d3340';
          ctx.fillRect(8, 0, 8, 4);
          ctx.fillRect(20, 20, 8, 12);
          // Glowing crimson visor
          ctx.fillStyle = '#ff1e42';
          ctx.fillRect(9, 11, 6, 2);
          ctx.fillStyle = '#ff8ca0';
          ctx.fillRect(11, 11, 2, 1);
          // Core soul gem on torso
          ctx.fillStyle = '#ff1e42';
          ctx.fillRect(23, 24, 2, 2);
          break;
        }

        case 'cyber': {
          // Cyber Cyborg (Titanium grey, electric cyan visor & circuits)
          ctx.fillStyle = '#222831';
          ctx.fillRect(0, 0, 64, 64);
          ctx.fillStyle = '#393e46';
          ctx.fillRect(20, 20, 8, 12);
          // Cyan Visor
          ctx.fillStyle = '#00e5ff';
          ctx.fillRect(9, 11, 6, 2);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(10, 11, 2, 1);
          // Neon circuitry on chest
          ctx.fillStyle = '#00e5ff';
          ctx.fillRect(22, 23, 4, 1);
          ctx.fillRect(23, 24, 2, 4);
          ctx.fillRect(21, 27, 6, 1);
          break;
        }

        case 'demon': {
          // Lava Demon (Charred magma black, burning yellow eyes, fiery cracks)
          ctx.fillStyle = '#180a0a';
          ctx.fillRect(0, 0, 64, 64);
          // Magma cracks on torso
          ctx.fillStyle = '#ff4500';
          ctx.fillRect(21, 22, 6, 1);
          ctx.fillRect(24, 23, 1, 5);
          ctx.fillRect(22, 27, 4, 1);
          ctx.fillStyle = '#ffaa00';
          ctx.fillRect(23, 24, 2, 2);
          // Flaming eyes
          ctx.fillStyle = '#ffea00';
          ctx.fillRect(10, 11, 2, 2);
          ctx.fillRect(14, 11, 2, 2);
          ctx.fillStyle = '#ff3300';
          ctx.fillRect(9, 10, 1, 1);
          ctx.fillRect(16, 10, 1, 1);
          break;
        }

        case 'team': {
          // Team Specialized Soldier (Uses Team Color)
          let cMain = '#1e56a0';
          let cDark = '#12396d';
          let cLight = '#4d8ae0';
          if (team === 'red') {
            cMain = '#c42020'; cDark = '#8c1212'; cLight = '#ea5050';
          } else if (team === 'green') {
            cMain = '#209030'; cDark = '#135c1d'; cLight = '#4ac95c';
          } else if (team === 'yellow') {
            cMain = '#c4b020'; cDark = '#877810'; cLight = '#edd845';
          }

          // Tactical Armor base
          ctx.fillStyle = cMain;
          ctx.fillRect(0, 0, 64, 64);
          // Face opening
          ctx.fillStyle = '#e0b28e';
          ctx.fillRect(9, 9, 6, 6);
          // Helmet Visor / Goggles
          ctx.fillStyle = cDark;
          ctx.fillRect(8, 7, 8, 3);
          ctx.fillStyle = '#333333';
          ctx.fillRect(10, 11, 1, 1);
          ctx.fillRect(14, 11, 1, 1);
          // Torso emblem
          ctx.fillStyle = cLight;
          ctx.fillRect(22, 23, 4, 4);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(23, 24, 2, 2);
          break;
        }

        case 'steve':
        default: {
          // Steve (Classic blue shirt, jeans, dark hair)
          // Head Base
          ctx.fillStyle = '#c68642'; // Skin
          ctx.fillRect(8, 8, 8, 8); // face
          ctx.fillRect(0, 8, 8, 8); // right
          ctx.fillRect(16, 8, 8, 8); // left
          ctx.fillRect(24, 8, 8, 8); // back
          ctx.fillStyle = '#321d15'; // Dark hair
          ctx.fillRect(8, 0, 8, 8); // top
          ctx.fillRect(8, 8, 8, 2); // fringe
          ctx.fillRect(0, 8, 8, 4);
          ctx.fillRect(16, 8, 8, 4);
          ctx.fillRect(24, 8, 8, 8);
          // Eyes
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(10, 12, 1, 1);
          ctx.fillRect(14, 12, 1, 1);
          ctx.fillStyle = '#2b4b8a'; // Blue eyes
          ctx.fillRect(11, 12, 1, 1);
          ctx.fillRect(13, 12, 1, 1);
          // Goatee / Mouth
          ctx.fillStyle = '#522919';
          ctx.fillRect(11, 14, 2, 1);
          // Torso
          ctx.fillStyle = '#008b8b'; // Cyan shirt
          ctx.fillRect(20, 20, 8, 12);
          ctx.fillRect(32, 20, 8, 12);
          ctx.fillRect(16, 20, 4, 12);
          ctx.fillRect(28, 20, 4, 12);
          ctx.fillStyle = '#c68642'; // Collar skin opening
          ctx.fillRect(23, 20, 2, 2);
          // Arms
          ctx.fillStyle = '#008b8b'; // Sleeves
          ctx.fillRect(44, 20, 4, 4);
          ctx.fillRect(36, 52, 4, 4);
          ctx.fillStyle = '#c68642'; // Bare arms
          ctx.fillRect(44, 24, 4, 8);
          ctx.fillRect(36, 56, 4, 8);
          // Legs
          ctx.fillStyle = '#223568'; // Blue jeans
          ctx.fillRect(4, 20, 4, 10);
          ctx.fillRect(20, 52, 4, 10);
          ctx.fillStyle = '#464646'; // Shoes
          ctx.fillRect(4, 30, 4, 2);
          ctx.fillRect(20, 62, 4, 2);
          break;
        }
      }

      this.canvasCache[cacheKey] = canvas;
      return canvas;
    }

    // Convert any image source (custom image or preset) to a 64x64 skin canvas
    getSkinCanvas(config, team = 'blue', onReady = null) {
      if (config.type === 'custom' && config.data) {
        const cacheKey = `custom_${config.name || 'image'}_${config.data.slice(-20)}`;
        if (this.canvasCache[cacheKey]) {
          return this.canvasCache[cacheKey];
        }

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const { canvas, ctx } = this.createCanvas(64, 64);

          // If standard Minecraft skin (64x64 or 64x32)
          if ((img.width === 64 && (img.height === 64 || img.height === 32)) ||
              (img.width === 128 && (img.height === 128 || img.height === 64))) {
            ctx.drawImage(img, 0, 0, 64, img.height >= 64 ? 64 : 32);
            // If 64x32 classic skin, synthesize 64x64 lower body
            if (img.height < 64) {
              // Copy right arm to left arm
              ctx.drawImage(canvas, 40, 16, 16, 16, 32, 48, 16, 16);
              // Copy right leg to left leg
              ctx.drawImage(canvas, 0, 16, 16, 16, 16, 48, 16, 16);
            }
          } else {
            // Arbitrary image/photo uploaded: intelligently map to head and torso!
            // Head face: draw centered crop
            ctx.drawImage(img, 0, 0, img.width, img.height, 8, 8, 8, 8);
            // Head sides and top
            ctx.fillStyle = '#2b303c';
            ctx.fillRect(0, 8, 8, 8);
            ctx.fillRect(16, 8, 8, 8);
            ctx.fillRect(24, 8, 8, 8);
            ctx.fillRect(8, 0, 8, 8);
            // Torso front
            ctx.drawImage(img, 0, 0, img.width, img.height, 20, 20, 8, 12);
            // Torso back & sides
            ctx.fillStyle = '#1c212b';
            ctx.fillRect(16, 20, 4, 12);
            ctx.fillRect(28, 20, 4, 12);
            ctx.fillRect(32, 20, 8, 12);
            // Limbs
            ctx.fillStyle = '#262d3a';
            ctx.fillRect(40, 16, 16, 16);
            ctx.fillRect(32, 48, 16, 16);
            ctx.fillRect(0, 16, 16, 16);
            ctx.fillRect(16, 48, 16, 16);
          }

          this.canvasCache[cacheKey] = canvas;
          if (onReady) onReady(canvas);
        };
        img.src = config.data;
        // Return temporary placeholder while loading
        return this.getPresetSkinCanvas('steve', team);
      }

      // Built-in preset
      const presetId = config.id || 'steve';
      const canvas = this.getPresetSkinCanvas(presetId, team);
      return canvas;
    }

    // Render an authentic Minecraft Avatar 2.5D preview onto a target canvas (64x80)
    renderAvatarPreview(skinCanvas, targetCanvas) {
      if (!skinCanvas || !targetCanvas) return;
      const ctx = targetCanvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);

      const tw = targetCanvas.width;
      const th = targetCanvas.height;

      // Scale factors: 1 skin pixel = 4 preview pixels
      const scale = 4;
      const headW = 8 * scale; // 32
      const headH = 8 * scale; // 32
      const headX = Math.round((tw - headW) / 2);
      const headY = 4;

      // 1. Head Base Face (8, 8, 8, 8)
      ctx.drawImage(skinCanvas, 8, 8, 8, 8, headX, headY, headW, headH);

      // 2. Hat / Hair Overlay (40, 8, 8, 8) if present
      ctx.drawImage(skinCanvas, 40, 8, 8, 8, headX, headY, headW, headH);

      // 3. Torso Front (20, 20, 8, 12)
      const torsoW = 8 * scale; // 32
      const torsoH = 10 * scale; // 40
      const torsoX = headX;
      const torsoY = headY + headH;
      ctx.drawImage(skinCanvas, 20, 20, 8, 10, torsoX, torsoY, torsoW, torsoH);

      // 4. Arms flanking torso
      const armW = 4 * scale; // 16
      const armH = 10 * scale; // 40
      // Right arm (44, 20, 4, 10)
      ctx.drawImage(skinCanvas, 44, 20, 4, 10, torsoX - armW + 2, torsoY, armW, armH);
      // Left arm (36, 52, 4, 10)
      ctx.drawImage(skinCanvas, 36, 52, 4, 10, torsoX + torsoW - 2, torsoY, armW, armH);
    }

    // Slice 64x64 skin canvas into 6 THREE.MeshLambertMaterials with NearestFilter for BoxGeometry
    createBoxMaterials(skinCanvas, sx, sy, sw, sh, flipH = false) {
      const c = document.createElement('canvas');
      c.width = sw;
      c.height = sh;
      const cx = c.getContext('2d');
      cx.imageSmoothingEnabled = false;

      if (flipH) {
        cx.translate(sw, 0);
        cx.scale(-1, 1);
      }
      cx.drawImage(skinCanvas, sx, sy, sw, sh, 0, 0, sw, sh);

      const tex = new THREE.CanvasTexture(c);
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      return new THREE.MeshLambertMaterial({ map: tex });
    }

    // Extract complete 3D material sets for Head, Torso, Arms and Legs
    getBotMaterials(botId, team = 'blue') {
      const config = this.getBotSkinConfig(botId, team);
      const cacheKey = `mats_${botId}_${config.type}_${config.id || ''}_${(config.data || '').slice(-15)}`;
      if (this.matCache[cacheKey]) return this.matCache[cacheKey];

      const skinCanvas = this.getSkinCanvas(config, team, (freshCanvas) => {
        // If loaded asynchronously from DataURL, rebuild and re-apply
        if (config.type === 'custom') {
          delete this.matCache[cacheKey];
          this.refreshBot(botId);
        }
      });

      // 1. Head (6 faces: Right, Left, Top, Bottom, Front, Back)
      // Front is Group 4 (+Z). Back is Group 5 (-Z).
      const headFront = document.createElement('canvas');
      headFront.width = 8;
      headFront.height = 8;
      const hfCtx = headFront.getContext('2d');
      hfCtx.imageSmoothingEnabled = false;
      // Base Face
      hfCtx.drawImage(skinCanvas, 8, 8, 8, 8, 0, 0, 8, 8);
      // Composite Hat / Hair layer
      hfCtx.drawImage(skinCanvas, 40, 8, 8, 8, 0, 0, 8, 8);

      const hfTex = new THREE.CanvasTexture(headFront);
      hfTex.magFilter = THREE.NearestFilter;
      hfTex.minFilter = THREE.NearestFilter;
      const headFrontMat = new THREE.MeshLambertMaterial({ map: hfTex });

      const headMats = [
        this.createBoxMaterials(skinCanvas, 0, 8, 8, 8, true),   // +X Right
        this.createBoxMaterials(skinCanvas, 16, 8, 8, 8, true),  // -X Left
        this.createBoxMaterials(skinCanvas, 8, 0, 8, 8),         // +Y Top
        this.createBoxMaterials(skinCanvas, 16, 0, 8, 8),        // -Y Bottom
        headFrontMat,                                            // +Z Front (Face)
        this.createBoxMaterials(skinCanvas, 24, 8, 8, 8)         // -Z Back
      ];

      // 2. Torso (20, 20, 8, 12)
      const torsoMats = [
        this.createBoxMaterials(skinCanvas, 16, 20, 4, 12),      // +X Right
        this.createBoxMaterials(skinCanvas, 28, 20, 4, 12),      // -X Left
        this.createBoxMaterials(skinCanvas, 20, 16, 8, 4),       // +Y Top
        this.createBoxMaterials(skinCanvas, 28, 16, 8, 4),       // -Y Bottom
        this.createBoxMaterials(skinCanvas, 20, 20, 8, 12),      // +Z Front
        this.createBoxMaterials(skinCanvas, 32, 20, 8, 12)       // -Z Back
      ];

      // 3. Arms & Legs
      const rightArmMat = this.createBoxMaterials(skinCanvas, 44, 20, 4, 12);
      const leftArmMat = this.createBoxMaterials(skinCanvas, 36, 52, 4, 12);
      const rightLegMat = this.createBoxMaterials(skinCanvas, 4, 20, 4, 12);
      const leftLegMat = this.createBoxMaterials(skinCanvas, 20, 52, 4, 12);

      const mats = {
        head: headMats,
        torso: torsoMats,
        rightArm: rightArmMat,
        leftArm: leftArmMat,
        rightLeg: rightLegMat,
        leftLeg: leftLegMat
      };

      this.matCache[cacheKey] = mats;
      return mats;
    }

    // Apply skin materials to a live Bot instance
    applySkinToBot(bot) {
      if (!bot || !bot.headMesh) return;
      const mats = this.getBotMaterials(bot.id, bot.team);

      // Head always uses skin face materials
      bot.headMesh.material = mats.head;

      // Keep reference for armor updates
      bot.customSkinMats = mats;

      // Refresh equipment visibility (hides helmet on leather armor so skin hair/hat is visible!)
      if (typeof bot.updateEquipmentVisuals === 'function') {
        bot.updateEquipmentVisuals();
      }
    }

    // Live update specific bot in scene
    refreshBot(botId) {
      if (botId === 'player') {
        this.refreshPlayer();
        return;
      }
      if (!window.game || !window.game.bots) return;
      for (const b of window.game.bots) {
        if (b.id === botId) {
          this.applySkinToBot(b);
          break;
        }
      }
    }

    refreshPlayer() {
      if (window.player && window.player.handMesh) {
        const mats = this.getBotMaterials('player', 'red');
        if (mats && mats.rightArm) {
          window.player.handMesh.material = mats.rightArm;
        }
      }
    }

    // Live update all bots in scene
    refreshAllBots() {
      this.refreshPlayer();
      if (!window.game || !window.game.bots) return;
      for (const b of window.game.bots) {
        this.applySkinToBot(b);
      }
    }

    // Randomize all bots with diverse presets with 1 click
    randomizeAllBots() {
      const presetKeys = ['steve', 'alex', 'zombie', 'skeleton', 'enderman', 'creeper', 'knight', 'cyber', 'demon'];
      const botIds = ['player', 'red_mate', 'blue_1', 'blue_2', 'green_1', 'green_2', 'yellow_1', 'yellow_2'];

      // Shuffle keys
      const shuffled = [...presetKeys].sort(() => Math.random() - 0.5);

      botIds.forEach((id, idx) => {
        const pKey = shuffled[idx % shuffled.length];
        this.configs[id] = { type: 'preset', id: pKey };
        this.clearBotCache(id);
      });

      this.saveConfigs();
      this.refreshAllBots();
    }

    // Reset all skins to original default
    resetAllToDefault() {
      this.configs = {};
      this.canvasCache = {};
      this.matCache = {};
      this.saveConfigs();
      this.refreshAllBots();
    }

    // Build & Initialize the Skin Manager Modal
    initUI() {
      // Check if modal already exists
      let modal = document.getElementById('skin-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'skin-modal';
        modal.className = 'skin-modal-backdrop';
        modal.style.display = 'none';
        modal.innerHTML = `
          <div class="skin-modal-dialog">
            <div class="skin-modal-header">
              <div class="skin-modal-title">
                <span style="font-size: 24px;">🎭</span> 人机与角色皮肤管理中心
              </div>
              <button id="skin-modal-close-btn" class="skin-modal-close" title="关闭">&times;</button>
            </div>
            
            <div class="skin-modal-desc">
              支持导入本地任意 Minecraft 皮肤文件 (<b>64x64 / 64x32 PNG</b>) 或自定义图片，也可自由选择官方经典预设！修改后实时生效并自动保存。
            </div>

            <div class="skin-quick-bar">
              <button id="skin-random-btn" class="skin-tool-btn" style="background: #2e7d32; border-color: #1b5e20;">🎲 随机分配全员预设</button>
              <button id="skin-reset-btn" class="skin-tool-btn" style="background: #c62828; border-color: #b71c1c;">🔄 恢复全部默认</button>
              <div style="flex: 1;"></div>
              <span style="color: #90caf9; font-size: 13px;">点击各个卡片的【📁 导入皮肤】上传本地图片</span>
            </div>

            <div id="skin-cards-container" class="skin-cards-container">
              <!-- Dynamically populated bot cards -->
            </div>

            <div class="skin-modal-footer">
              <div style="color: #aaa; font-size: 12px;">★ 阵营识别：战斗中无论穿戴何种盔甲，均会通过战术臂章、护肩与名字清晰标识所属战队。</div>
              <button id="skin-modal-ok-btn" class="skin-confirm-btn">✓ 完成并应用</button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);

        // Bind events
        document.getElementById('skin-modal-close-btn').addEventListener('click', () => this.closeModal());
        document.getElementById('skin-modal-ok-btn').addEventListener('click', () => this.closeModal());
        document.getElementById('skin-random-btn').addEventListener('click', () => {
          this.randomizeAllBots();
          this.renderBotCards();
        });
        document.getElementById('skin-reset-btn').addEventListener('click', () => {
          if (confirm('确定要恢复所有人机的默认皮肤吗？')) {
            this.resetAllToDefault();
            this.renderBotCards();
          }
        });
      }

      // Bind Start Screen button
      const openBtn = document.getElementById('open-skin-modal-btn');
      if (openBtn) {
        openBtn.addEventListener('click', () => this.openModal());
      }

      // Bind In-game HUD button
      const hudBtn = document.getElementById('hud-skin-btn');
      if (hudBtn) {
        hudBtn.addEventListener('click', () => this.openModal());
      }

      // Keyboard shortcut: 'K' toggles skin manager
      window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
        if (e.code === 'KeyK') {
          if (this.isModalOpen) {
            this.closeModal();
          } else {
            this.openModal();
          }
        }
      });
    }

    openModal() {
      // Release pointer lock if game is active
      if (document.exitPointerLock) {
        document.exitPointerLock();
      }
      this.isModalOpen = true;
      const modal = document.getElementById('skin-modal');
      if (modal) {
        modal.style.display = 'flex';
        this.renderBotCards();
      }
    }

    closeModal() {
      this.isModalOpen = false;
      const modal = document.getElementById('skin-modal');
      if (modal) {
        modal.style.display = 'none';
      }
    }

    // Render list of bot skin cards
    renderBotCards() {
      const container = document.getElementById('skin-cards-container');
      if (!container) return;

      const botList = [
        { id: 'player', name: '👑 我的玩家 (红队领袖)', team: 'red', isPlayer: true },
        { id: 'red_mate', name: '🔴 红队队友', team: 'red' },
        { id: 'blue_1', name: '🔵 蓝队 1号 (蓝队人机)', team: 'blue' },
        { id: 'blue_2', name: '🔵 蓝队 2号', team: 'blue' },
        { id: 'green_1', name: '🟢 绿队 1号 (绿队人机)', team: 'green' },
        { id: 'green_2', name: '🟢 绿队 2号', team: 'green' },
        { id: 'yellow_1', name: '🟡 黄队 1号 (黄队人机)', team: 'yellow' },
        { id: 'yellow_2', name: '🟡 黄队 2号', team: 'yellow' }
      ];

      container.innerHTML = '';

      botList.forEach(bot => {
        const config = this.getBotSkinConfig(bot.id, bot.team);
        const card = document.createElement('div');
        card.className = `skin-card team-border-${bot.team}`;

        const isCustom = (config.type === 'custom');
        const customName = isCustom ? (config.name || '本地皮肤') : '';

        // Options for preset select
        let optionsHtml = '';
        Object.values(this.presets).forEach(p => {
          const selected = (!isCustom && config.id === p.id) ? 'selected' : '';
          optionsHtml += `<option value="${p.id}" ${selected}>${p.name}</option>`;
        });
        if (isCustom) {
          optionsHtml += `<option value="custom" selected>📁 自定义: ${customName}</option>`;
        }

        card.innerHTML = `
          <div class="skin-card-left">
            <canvas id="preview-${bot.id}" class="skin-avatar-canvas" width="64" height="80"></canvas>
          </div>
          <div class="skin-card-right">
            <div class="skin-bot-title">
              <span class="skin-bot-name">${bot.name}</span>
              ${isCustom ? '<span class="skin-badge-custom">自定义</span>' : ''}
            </div>

            <div class="skin-control-row">
              <span class="skin-row-label">预设选择:</span>
              <select class="skin-select" data-botid="${bot.id}">
                ${optionsHtml}
              </select>
            </div>

            <div class="skin-btn-row">
              <label class="skin-upload-btn">
                📁 导入皮肤 PNG
                <input type="file" accept="image/png,image/jpeg,image/webp" class="skin-file-input" data-botid="${bot.id}" style="display:none;">
              </label>
              ${isCustom ? `<button class="skin-clear-btn" data-botid="${bot.id}" title="清除自定义皮肤，恢复预设">✕ 清除</button>` : ''}
              ${!bot.isPlayer ? `<button class="skin-sync-team-btn" data-botid="${bot.id}" data-team="${bot.team}" title="将此皮肤应用至${bot.name.slice(0, 4)}全队">👥 同步全队</button>` : ''}
            </div>
          </div>
        `;

        container.appendChild(card);

        // Render preview canvas
        const previewCanvas = card.querySelector(`#preview-${bot.id}`);
        const c = this.getSkinCanvas(config, bot.team, (asyncCanvas) => {
          this.renderAvatarPreview(asyncCanvas, previewCanvas);
        });
        if (c) {
          this.renderAvatarPreview(c, previewCanvas);
        }

        // Event: Preset Select change
        const sel = card.querySelector('.skin-select');
        sel.addEventListener('change', (e) => {
          const val = e.target.value;
          if (val !== 'custom') {
            this.setBotSkin(bot.id, { type: 'preset', id: val });
            this.renderBotCards();
          }
        });

        // Event: File Upload
        const fileInput = card.querySelector('.skin-file-input');
        fileInput.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = (re) => {
            const rawDataUrl = re.target.result;
            // Downsample to max 128x128 to ensure super fast loading and zero localStorage quota overflow
            const tempImg = new Image();
            tempImg.onload = () => {
              let targetW = tempImg.width;
              let targetH = tempImg.height;
              if (targetW > 128 || targetH > 128) {
                const ratio = Math.min(128 / targetW, 128 / targetH);
                targetW = Math.max(16, Math.round(targetW * ratio));
                targetH = Math.max(16, Math.round(targetH * ratio));
              }
              const downCanvas = document.createElement('canvas');
              downCanvas.width = targetW;
              downCanvas.height = targetH;
              const dCtx = downCanvas.getContext('2d');
              dCtx.imageSmoothingEnabled = false;
              dCtx.drawImage(tempImg, 0, 0, targetW, targetH);
              const optimizedDataUrl = downCanvas.toDataURL('image/png');

              this.setBotSkin(bot.id, {
                type: 'custom',
                name: file.name,
                data: optimizedDataUrl
              });
              this.renderBotCards();
            };
            tempImg.onerror = () => {
              alert('图片读取失败，请检查文件是否为有效图片！');
            };
            tempImg.src = rawDataUrl;
          };
          reader.readAsDataURL(file);
        });

        // Event: Clear custom skin
        const clearBtn = card.querySelector('.skin-clear-btn');
        if (clearBtn) {
          clearBtn.addEventListener('click', () => {
            const defPreset = this.defaultAllocations[bot.id] || 'team';
            this.setBotSkin(bot.id, { type: 'preset', id: defPreset });
            this.renderBotCards();
          });
        }

        // Event: Sync to Team
        const syncBtn = card.querySelector('.skin-sync-team-btn');
        if (syncBtn) {
          syncBtn.addEventListener('click', () => {
            const team = syncBtn.getAttribute('data-team');
            const curCfg = this.getBotSkinConfig(bot.id, team);
            botList.filter(b => b.team === team && !b.isPlayer).forEach(tb => {
              this.configs[tb.id] = JSON.parse(JSON.stringify(curCfg));
              this.clearBotCache(tb.id);
            });
            this.saveConfigs();
            this.refreshAllBots();
            this.renderBotCards();
          });
        }
      });
    }
  }

  window.SkinManager = new SkinManager();
})();
