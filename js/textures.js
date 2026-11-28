// Procedural 16x16 Minecraft Pixel Texture Generator
const TextureGenerator = {
  cache: {},

  createCanvas(width = 16, height = 16) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    return { canvas, ctx };
  },

  toThreeTexture(canvas) {
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    return tex;
  },

  // Grass Top
  getGrassTop() {
    if (this.cache['grass_top']) return this.cache['grass_top'];
    const { canvas, ctx } = this.createCanvas();
    const colors = ['#5ca734', '#559c2f', '#64b439', '#4c8e27'];
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const c = colors[Math.floor(Math.random() * colors.length)];
        ctx.fillStyle = c;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    const tex = this.toThreeTexture(canvas);
    this.cache['grass_top'] = tex;
    return tex;
  },

  // Dirt
  getDirt() {
    if (this.cache['dirt']) return this.cache['dirt'];
    const { canvas, ctx } = this.createCanvas();
    const colors = ['#866043', '#795438', '#68482f', '#573d28'];
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const c = colors[Math.floor(Math.random() * colors.length)];
        ctx.fillStyle = c;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    const tex = this.toThreeTexture(canvas);
    this.cache['dirt'] = tex;
    return tex;
  },

  // Grass Side (Dirt with green overhang)
  getGrassSide() {
    if (this.cache['grass_side']) return this.cache['grass_side'];
    const { canvas, ctx } = this.createCanvas();
    const dirtColors = ['#866043', '#795438', '#68482f'];
    const grassColors = ['#5ca734', '#559c2f', '#64b439'];

    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        ctx.fillStyle = dirtColors[Math.floor(Math.random() * dirtColors.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // Grass overhang on top 3-5 pixels
    for (let x = 0; x < 16; x++) {
      const drop = Math.floor(Math.random() * 3) + 2;
      for (let y = 0; y <= drop; y++) {
        ctx.fillStyle = grassColors[Math.floor(Math.random() * grassColors.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }
    const tex = this.toThreeTexture(canvas);
    this.cache['grass_side'] = tex;
    return tex;
  },

  // Stone
  getStone() {
    if (this.cache['stone']) return this.cache['stone'];
    const { canvas, ctx } = this.createCanvas();
    const colors = ['#7c7c7c', '#6d6d6d', '#8c8c8c', '#5e5e5e'];
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }
    const tex = this.toThreeTexture(canvas);
    this.cache['stone'] = tex;
    return tex;
  },

  // Oak Planks
  getOakPlanks() {
    if (this.cache['oak_planks']) return this.cache['oak_planks'];
    const { canvas, ctx } = this.createCanvas();
    const woodColors = ['#b8945f', '#a98451', '#9a7543', '#c6a26d'];
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        ctx.fillStyle = woodColors[Math.floor(Math.random() * woodColors.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // Horizontal grooves every 4 pixels
    ctx.fillStyle = '#5c4627';
    [0, 4, 8, 12].forEach(y => {
      ctx.fillRect(0, y, 16, 1);
    });
    // Vertical seams
    ctx.fillRect(7, 1, 1, 3);
    ctx.fillRect(12, 5, 1, 3);
    ctx.fillRect(4, 9, 1, 3);
    ctx.fillRect(11, 13, 1, 3);

    const tex = this.toThreeTexture(canvas);
    this.cache['oak_planks'] = tex;
    return tex;
  },

  // Wool (Colored)
  getWool(baseColorHex, darkColorHex) {
    const key = `wool_${baseColorHex}`;
    if (this.cache[key]) return this.cache[key];
    const { canvas, ctx } = this.createCanvas();
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const isDark = (x + y) % 2 === 0 || Math.random() < 0.25;
        ctx.fillStyle = isDark ? darkColorHex : baseColorHex;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    const tex = this.toThreeTexture(canvas);
    this.cache[key] = tex;
    return tex;
  },

  // End Stone
  getEndStone() {
    if (this.cache['end_stone']) return this.cache['end_stone'];
    const { canvas, ctx } = this.createCanvas();
    const colors = ['#dfdf9e', '#dedeb4', '#cfcfa0', '#bebe8b'];
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }
    const tex = this.toThreeTexture(canvas);
    this.cache['end_stone'] = tex;
    return tex;
  },

  // Obsidian
  getObsidian() {
    if (this.cache['obsidian']) return this.cache['obsidian'];
    const { canvas, ctx } = this.createCanvas();
    const colors = ['#1a1027', '#100c1e', '#2c1842', '#3b2059', '#150f22'];
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }
    const tex = this.toThreeTexture(canvas);
    this.cache['obsidian'] = tex;
    return tex;
  },

  // Stone Bricks (Castle Theme)
  getStoneBricks() {
    if (this.cache['stone_bricks']) return this.cache['stone_bricks'];
    const { canvas, ctx } = this.createCanvas();
    const grays = ['#757575', '#6b6b6b', '#808080', '#636363'];
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        ctx.fillStyle = grays[Math.floor(Math.random() * grays.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // Mortar lines: horizontal
    ctx.fillStyle = '#3c3c3c';
    ctx.fillRect(0, 0, 16, 1);
    ctx.fillRect(0, 8, 16, 1);
    // Vertical mortar lines: staggered
    ctx.fillRect(0, 0, 1, 8);
    ctx.fillRect(8, 0, 1, 8);
    ctx.fillRect(4, 8, 1, 8);
    ctx.fillRect(12, 8, 1, 8);
    // Highlights
    ctx.fillStyle = '#9e9e9e';
    ctx.fillRect(1, 1, 7, 1);
    ctx.fillRect(9, 1, 7, 1);
    ctx.fillRect(5, 9, 7, 1);
    ctx.fillRect(13, 9, 3, 1);
    ctx.fillRect(0, 9, 4, 1);

    const tex = this.toThreeTexture(canvas);
    this.cache['stone_bricks'] = tex;
    return tex;
  },

  // Mossy Stone Bricks
  getMossyStoneBricks() {
    if (this.cache['mossy_stone_bricks']) return this.cache['mossy_stone_bricks'];
    const { canvas, ctx } = this.createCanvas();
    const grays = ['#707070', '#666666', '#7a7a7a'];
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        ctx.fillStyle = grays[Math.floor(Math.random() * grays.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(0, 0, 16, 1);
    ctx.fillRect(0, 8, 16, 1);
    ctx.fillRect(0, 0, 1, 8);
    ctx.fillRect(8, 0, 1, 8);
    ctx.fillRect(4, 8, 1, 8);
    ctx.fillRect(12, 8, 1, 8);
    // Moss patches
    const mossColors = ['#466e2c', '#33581c', '#5b8a3b'];
    const mossCoords = [[2, 2], [3, 2], [2, 3], [3, 3], [9, 5], [10, 5], [10, 6], [5, 10], [6, 10], [6, 11], [13, 12], [14, 12]];
    mossCoords.forEach(([mx, my]) => {
      ctx.fillStyle = mossColors[Math.floor(Math.random() * mossColors.length)];
      ctx.fillRect(mx, my, 1, 1);
    });

    const tex = this.toThreeTexture(canvas);
    this.cache['mossy_stone_bricks'] = tex;
    return tex;
  },

  // Netherrack (Nether Theme)
  getNetherrack() {
    if (this.cache['netherrack']) return this.cache['netherrack'];
    const { canvas, ctx } = this.createCanvas();
    const reds = ['#651717', '#501010', '#741e1e', '#852424', '#3d0a0a'];
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        ctx.fillStyle = reds[Math.floor(Math.random() * reds.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }
    const tex = this.toThreeTexture(canvas);
    this.cache['netherrack'] = tex;
    return tex;
  },

  // Nether Bricks
  getNetherBricks() {
    if (this.cache['nether_bricks']) return this.cache['nether_bricks'];
    const { canvas, ctx } = this.createCanvas();
    const browns = ['#2c151a', '#30181e', '#231014', '#381c23'];
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        ctx.fillStyle = browns[Math.floor(Math.random() * browns.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // Mortar lines
    ctx.fillStyle = '#14080b';
    ctx.fillRect(0, 0, 16, 1);
    ctx.fillRect(0, 8, 16, 1);
    ctx.fillRect(0, 0, 1, 8);
    ctx.fillRect(8, 0, 1, 8);
    ctx.fillRect(4, 8, 1, 8);
    ctx.fillRect(12, 8, 1, 8);

    const tex = this.toThreeTexture(canvas);
    this.cache['nether_bricks'] = tex;
    return tex;
  },

  // Purpur Block (End Theme)
  getPurpur() {
    if (this.cache['purpur']) return this.cache['purpur'];
    const { canvas, ctx } = this.createCanvas();
    const purples = ['#a97da9', '#9b6c9b', '#b38bb3', '#8f5f8f'];
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        ctx.fillStyle = purples[Math.floor(Math.random() * purples.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // Purpur engraved pattern
    ctx.fillStyle = '#6b436b';
    ctx.strokeRect(1, 1, 14, 14);
    ctx.strokeRect(3, 3, 10, 10);

    const tex = this.toThreeTexture(canvas);
    this.cache['purpur'] = tex;
    return tex;
  },

  // Glowstone
  getGlowstone() {
    if (this.cache['glowstone']) return this.cache['glowstone'];
    const { canvas, ctx } = this.createCanvas();
    const yellows = ['#ffd060', '#ffb935', '#e59920', '#fff0a0', '#cca040'];
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        ctx.fillStyle = yellows[Math.floor(Math.random() * yellows.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }
    const tex = this.toThreeTexture(canvas);
    this.cache['glowstone'] = tex;
    return tex;
  },

  // Mineral Blocks
  getMineralBlock(baseColor, lightColor, darkColor) {
    const { canvas, ctx } = this.createCanvas();
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 16, 16);
    // Outer border
    ctx.fillStyle = lightColor;
    ctx.fillRect(0, 0, 16, 1);
    ctx.fillRect(0, 0, 1, 16);
    ctx.fillStyle = darkColor;
    ctx.fillRect(0, 15, 16, 1);
    ctx.fillRect(15, 0, 1, 16);
    // Inner bevel
    ctx.fillStyle = lightColor;
    ctx.fillRect(2, 2, 12, 1);
    ctx.fillRect(2, 2, 1, 12);
    ctx.fillStyle = darkColor;
    ctx.fillRect(2, 13, 12, 1);
    ctx.fillRect(13, 2, 1, 12);

    return this.toThreeTexture(canvas);
  },

  // 16x16 Minecraft SkyWars Chest Textures
  getChestTop() {
    if (this.cache['chest_top']) return this.cache['chest_top'];
    const { canvas, ctx } = this.createCanvas();
    // Base wood
    ctx.fillStyle = '#8e5b2b';
    ctx.fillRect(0, 0, 16, 16);
    // Wood grain noise
    const woodColors = ['#835326', '#94612f', '#7d4e23', '#8e5b2b'];
    for (let x = 1; x < 15; x++) {
      for (let y = 1; y < 15; y++) {
        if (Math.random() < 0.35) {
          ctx.fillStyle = woodColors[Math.floor(Math.random() * woodColors.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    // Outer border
    ctx.fillStyle = '#3c2510';
    ctx.fillRect(0, 0, 16, 1);
    ctx.fillRect(0, 15, 16, 1);
    ctx.fillRect(0, 0, 1, 16);
    ctx.fillRect(15, 0, 1, 16);
    // Corner reinforced brackets
    ctx.fillStyle = '#261709';
    ctx.fillRect(0, 0, 3, 2);
    ctx.fillRect(0, 0, 2, 3);
    ctx.fillRect(13, 0, 3, 2);
    ctx.fillRect(14, 0, 2, 3);
    ctx.fillRect(0, 14, 3, 2);
    ctx.fillRect(0, 13, 2, 3);
    ctx.fillRect(13, 14, 3, 2);
    ctx.fillRect(14, 13, 2, 3);

    const tex = this.toThreeTexture(canvas);
    this.cache['chest_top'] = tex;
    return tex;
  },

  getChestSide() {
    if (this.cache['chest_side']) return this.cache['chest_side'];
    const { canvas, ctx } = this.createCanvas();
    // Base wood
    ctx.fillStyle = '#8e5b2b';
    ctx.fillRect(0, 0, 16, 16);
    const woodColors = ['#835326', '#94612f', '#7d4e23'];
    for (let x = 1; x < 15; x++) {
      for (let y = 1; y < 15; y++) {
        if (Math.random() < 0.35) {
          ctx.fillStyle = woodColors[Math.floor(Math.random() * woodColors.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    // Border
    ctx.fillStyle = '#3c2510';
    ctx.fillRect(0, 0, 16, 1);
    ctx.fillRect(0, 15, 16, 1);
    ctx.fillRect(0, 0, 1, 16);
    ctx.fillRect(15, 0, 1, 16);
    // Lid horizontal seam at y=5
    ctx.fillStyle = '#2a190a';
    ctx.fillRect(0, 5, 16, 1);
    // Metal corner rivets
    ctx.fillStyle = '#261709';
    ctx.fillRect(1, 1, 2, 2);
    ctx.fillRect(13, 1, 2, 2);
    ctx.fillRect(1, 13, 2, 2);
    ctx.fillRect(13, 13, 2, 2);

    const tex = this.toThreeTexture(canvas);
    this.cache['chest_side'] = tex;
    return tex;
  },

  getChestBottom() {
    if (this.cache['chest_bottom']) return this.cache['chest_bottom'];
    const { canvas, ctx } = this.createCanvas();
    ctx.fillStyle = '#6a431d';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#3c2510';
    ctx.fillRect(0, 0, 16, 1);
    ctx.fillRect(0, 15, 16, 1);
    ctx.fillRect(0, 0, 1, 16);
    ctx.fillRect(15, 0, 1, 16);
    const tex = this.toThreeTexture(canvas);
    this.cache['chest_bottom'] = tex;
    return tex;
  },

  getChestFront() {
    if (this.cache['chest_front']) return this.cache['chest_front'];
    const { canvas, ctx } = this.createCanvas();
    // Same as side
    ctx.fillStyle = '#8e5b2b';
    ctx.fillRect(0, 0, 16, 16);
    const woodColors = ['#835326', '#94612f', '#7d4e23'];
    for (let x = 1; x < 15; x++) {
      for (let y = 1; y < 15; y++) {
        if (Math.random() < 0.35) {
          ctx.fillStyle = woodColors[Math.floor(Math.random() * woodColors.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    // Border
    ctx.fillStyle = '#3c2510';
    ctx.fillRect(0, 0, 16, 1);
    ctx.fillRect(0, 15, 16, 1);
    ctx.fillRect(0, 0, 1, 16);
    ctx.fillRect(15, 0, 1, 16);
    // Lid seam
    ctx.fillStyle = '#2a190a';
    ctx.fillRect(0, 5, 16, 1);

    // Silver Lock Latch at x=7..8, y=4..7
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(6, 3, 4, 6);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(7, 4, 2, 4);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(8, 4, 1, 4);
    // Keyhole
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(7, 6, 2, 1);

    const tex = this.toThreeTexture(canvas);
    this.cache['chest_front'] = tex;
    return tex;
  },

  // Bed textures
  getBedTexture(teamColor = 'red') {
    const key = `bed_${teamColor}`;
    if (this.cache[key]) return this.cache[key];
    const { canvas, ctx } = this.createCanvas(16, 16);

    let mainCol = '#c42020';
    let darkCol = '#911515';
    if (teamColor === 'blue') {
      mainCol = '#2255c4';
      darkCol = '#143787';
    } else if (teamColor === 'green') {
      mainCol = '#2e9e2e';
      darkCol = '#1b6e1b';
    } else if (teamColor === 'yellow') {
      mainCol = '#d4be17';
      darkCol = '#96850c';
    }

    ctx.fillStyle = mainCol;
    ctx.fillRect(0, 0, 16, 16);

    // Pillow at top half
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(2, 2, 12, 6);
    ctx.fillStyle = '#dddddd';
    ctx.fillRect(3, 3, 10, 4);

    // Blanket folds
    ctx.fillStyle = darkCol;
    ctx.fillRect(0, 9, 16, 1);
    ctx.fillRect(0, 15, 16, 1);

    const tex = this.toThreeTexture(canvas);
    this.cache[key] = tex;
    return tex;
  },

  // Villager Skin Texture
  getVillagerSkin() {
    if (this.cache['villager_skin']) return this.cache['villager_skin'];
    const { canvas, ctx } = this.createCanvas(32, 32);
    // Brown robes
    ctx.fillStyle = '#653a20';
    ctx.fillRect(0, 0, 32, 32);
    // Face skin
    ctx.fillStyle = '#bc8b68';
    ctx.fillRect(8, 4, 16, 16);
    // Unibrow
    ctx.fillStyle = '#3a2010';
    ctx.fillRect(10, 8, 12, 2);
    // Emerald green eyes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(10, 11, 4, 2);
    ctx.fillRect(18, 11, 4, 2);
    ctx.fillStyle = '#17dd62';
    ctx.fillRect(11, 11, 2, 2);
    ctx.fillRect(19, 11, 2, 2);
    // Big nose
    ctx.fillStyle = '#a67252';
    ctx.fillRect(14, 12, 4, 7);

    const tex = this.toThreeTexture(canvas);
    this.cache['villager_skin'] = tex;
    return tex;
  },

  // Bot (Enemy) Skin Texture
  getBotSkin(teamColor = 'blue') {
    const key = `bot_skin_${teamColor}`;
    if (this.cache[key]) return this.cache[key];
    const { canvas, ctx } = this.createCanvas(32, 32);

    let armorColor = '#204090';
    let helmetColor = '#153075';
    if (teamColor === 'red') {
      armorColor = '#c42020';
      helmetColor = '#911515';
    } else if (teamColor === 'green') {
      armorColor = '#209030';
      helmetColor = '#156520';
    } else if (teamColor === 'yellow') {
      armorColor = '#c4b020';
      helmetColor = '#8c7c10';
    }

    // Team armor
    ctx.fillStyle = armorColor;
    ctx.fillRect(0, 0, 32, 32);
    // Head / Face
    ctx.fillStyle = '#dcb088';
    ctx.fillRect(8, 4, 16, 14);
    // Helmet
    ctx.fillStyle = helmetColor;
    ctx.fillRect(7, 2, 18, 6);
    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(10, 10, 3, 2);
    ctx.fillRect(19, 10, 3, 2);
    ctx.fillStyle = '#333333';
    ctx.fillRect(11, 10, 2, 2);
    ctx.fillRect(20, 10, 2, 2);
    // Mouth
    ctx.fillStyle = '#9c6f55';
    ctx.fillRect(13, 14, 6, 2);

    const tex = this.toThreeTexture(canvas);
    this.cache[key] = tex;
    return tex;
  },

  // Player Steve Skin Texture
  getPlayerSkin() {
    if (this.cache['player_skin']) return this.cache['player_skin'];
    const { canvas, ctx } = this.createCanvas(32, 32);
    // Red team shirt
    ctx.fillStyle = '#c42020';
    ctx.fillRect(0, 0, 32, 32);
    // Skin arms
    ctx.fillStyle = '#dcb088';
    ctx.fillRect(0, 20, 32, 12);

    const tex = this.toThreeTexture(canvas);
    this.cache['player_skin'] = tex;
    return tex;
  },

  // Generates data URL icons for Hotbar and Shop UI
  generateItemDataURL(type) {
    const { canvas, ctx } = this.createCanvas(32, 32);

    switch (type) {
      case 'red_wool':
        ctx.fillStyle = '#d32f2f';
        ctx.fillRect(4, 4, 24, 24);
        ctx.fillStyle = '#b71c1c';
        ctx.fillRect(4, 26, 24, 2);
        ctx.fillRect(26, 4, 2, 24);
        break;
      case 'blue_wool':
        ctx.fillStyle = '#2196f3';
        ctx.fillRect(4, 4, 24, 24);
        ctx.fillStyle = '#1565c0';
        ctx.fillRect(4, 26, 24, 2);
        ctx.fillRect(26, 4, 2, 24);
        break;
      case 'green_wool':
        ctx.fillStyle = '#4caf50';
        ctx.fillRect(4, 4, 24, 24);
        ctx.fillStyle = '#2e7d32';
        ctx.fillRect(4, 26, 24, 2);
        ctx.fillRect(26, 4, 2, 24);
        break;
      case 'yellow_wool':
        ctx.fillStyle = '#fbc02d';
        ctx.fillRect(4, 4, 24, 24);
        ctx.fillStyle = '#f57f17';
        ctx.fillRect(4, 26, 24, 2);
        ctx.fillRect(26, 4, 2, 24);
        break;
      case 'wood_planks':
        ctx.fillStyle = '#b8945f';
        ctx.fillRect(4, 4, 24, 24);
        ctx.fillStyle = '#5c4627';
        ctx.fillRect(4, 10, 24, 2);
        ctx.fillRect(4, 18, 24, 2);
        break;
      case 'end_stone':
        ctx.fillStyle = '#dfdf9e';
        ctx.fillRect(4, 4, 24, 24);
        ctx.fillStyle = '#bebe8b';
        ctx.fillRect(8, 8, 4, 4);
        ctx.fillRect(16, 16, 6, 6);
        break;
      case 'obsidian':
        ctx.fillStyle = '#1a1027';
        ctx.fillRect(4, 4, 24, 24);
        ctx.fillStyle = '#3b2059';
        ctx.fillRect(6, 6, 6, 6);
        ctx.fillRect(16, 14, 8, 8);
        break;
      case 'sword_wooden':
      case 'sword_stone':
      case 'sword_iron':
      case 'sword_diamond':
        this.drawPixelSword(ctx, type);
        break;
      case 'armor_chain':
        ctx.fillStyle = '#9e9e9e';
        ctx.fillRect(6, 6, 20, 20);
        ctx.clearRect(12, 6, 8, 6);
        break;
      case 'armor_iron':
        ctx.fillStyle = '#dcdcdc';
        ctx.fillRect(6, 6, 20, 20);
        ctx.clearRect(12, 6, 8, 6);
        break;
      case 'armor_diamond':
        ctx.fillStyle = '#4cedf3';
        ctx.fillRect(6, 6, 20, 20);
        ctx.clearRect(12, 6, 8, 6);
        break;
      case 'shears':
        this.drawPixelShears(ctx);
        break;
      case 'pickaxe_wood':
      case 'pickaxe_iron':
      case 'pickaxe_diamond':
        this.drawPixelPickaxe(ctx, type);
        break;
      case 'golden_apple':
        this.drawPixelGoldenApple(ctx, false);
        break;
      case 'enchanted_golden_apple':
        this.drawPixelGoldenApple(ctx, true);
        break;
      case 'fireball_pack':
      case 'fireball':
        this.drawPixelFireball(ctx);
        break;
      case 'upgrade_sharpness':
        ctx.fillStyle = '#4cedf3';
        for (let i = 0; i < 16; i++) {
          ctx.fillRect(10 + i, 5 + (15 - i), 3, 3);
        }
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(8, 20, 8, 3);
        ctx.fillRect(12, 23, 3, 6);
        break;
      case 'upgrade_protection':
      case 'upgrade_protection2':
        ctx.fillStyle = '#4cedf3';
        ctx.beginPath();
        ctx.moveTo(8, 6);
        ctx.lineTo(24, 6);
        ctx.lineTo(24, 18);
        ctx.lineTo(16, 26);
        ctx.lineTo(8, 18);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        break;
      case 'upgrade_forge':
        ctx.fillStyle = '#555555';
        ctx.fillRect(6, 10, 20, 16);
        ctx.fillStyle = '#ff5722';
        ctx.fillRect(11, 16, 10, 7);
        ctx.fillStyle = '#ffeb3b';
        ctx.fillRect(13, 18, 6, 4);
        break;
      case 'upgrade_heal_pool':
        ctx.fillStyle = '#2e7d32';
        ctx.beginPath();
        ctx.arc(16, 16, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff1744';
        ctx.fillRect(13, 7, 6, 18);
        ctx.fillRect(7, 13, 18, 6);
        break;
      case 'upgrade_trap':
        ctx.fillStyle = '#d32f2f';
        ctx.beginPath();
        ctx.arc(16, 16, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', 16, 22);
        break;
      case 'ender_pearl':
        this.drawPixelEnderPearl(ctx);
        break;
      case 'tnt':
        ctx.fillStyle = '#d32f2f';
        ctx.fillRect(4, 4, 24, 24);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(4, 12, 24, 8);
        ctx.fillStyle = '#000000';
        ctx.font = '8px monospace';
        ctx.fillText('TNT', 7, 18);
        break;
      case 'iron':
        this.drawPixelIngot(ctx, false);
        break;
      case 'gold':
        this.drawPixelIngot(ctx, true);
        break;
      case 'diamond':
        this.drawPixelDiamond(ctx);
        break;
      case 'emerald':
        this.drawPixelEmerald(ctx);
        break;
      case 'potion_speed':
      case 'potion_jump':
      case 'potion_invisibility':
      case 'potion_regen':
      case 'potion':
        this.drawPixelPotion(ctx, type);
        break;
      case 'bow':
      case 'bow_normal':
      case 'bow_power':
      case 'bow_punch':
        this.drawPixelBow(ctx, type);
        break;
      case 'arrow':
      case 'arrow_8':
      case 'arrow_16':
        // Wooden shaft
        ctx.strokeStyle = '#926338';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(8, 24);
        ctx.lineTo(22, 10);
        ctx.stroke();
        // Arrowhead
        ctx.fillStyle = '#6b7280';
        ctx.beginPath();
        ctx.moveTo(22, 10);
        ctx.lineTo(25, 6);
        ctx.lineTo(21, 7);
        ctx.closePath();
        ctx.fill();
        // Feather fletching
        ctx.fillStyle = '#f9fafb';
        ctx.fillRect(6, 22, 4, 3);
        ctx.fillRect(9, 25, 3, 4);
        break;
      case 'emerald':
        ctx.fillStyle = '#17dd62';
        ctx.beginPath();
        ctx.moveTo(16, 6);
        ctx.lineTo(24, 12);
        ctx.lineTo(24, 20);
        ctx.lineTo(16, 26);
        ctx.lineTo(8, 20);
        ctx.lineTo(8, 12);
        ctx.closePath();
        ctx.fill();
        break;
      case 'mace':
        this.drawPixelMace(ctx);
        break;
      case 'wind_charge':
        this.drawPixelWindCharge(ctx);
        break;
      case 'crafting_table':
        ctx.fillStyle = '#9a7543';
        ctx.fillRect(4, 4, 24, 24);
        ctx.fillStyle = '#5c4627';
        ctx.fillRect(4, 4, 24, 2);
        ctx.fillRect(4, 12, 24, 2);
        ctx.fillRect(4, 20, 24, 2);
        ctx.fillRect(12, 4, 2, 24);
        ctx.fillRect(20, 4, 2, 24);
        break;
      case 'furnace':
        ctx.fillStyle = '#7c7c7c';
        ctx.fillRect(4, 4, 24, 24);
        ctx.fillStyle = '#1f1f1f';
        ctx.fillRect(10, 8, 12, 6);
        ctx.fillRect(10, 18, 12, 8);
        ctx.fillStyle = '#f97316';
        ctx.fillRect(12, 20, 8, 4);
        break;
      case 'pickaxe_stone':
        this.drawPixelPickaxe(ctx, '#94a3b8');
        break;
      case 'cobble_blocks':
        ctx.fillStyle = '#7c7c7c';
        ctx.fillRect(4, 4, 24, 24);
        ctx.fillStyle = '#555555';
        ctx.fillRect(4, 14, 24, 2);
        ctx.fillRect(15, 4, 2, 24);
        break;
      case 'dirt_block':
        ctx.fillStyle = '#795438';
        ctx.fillRect(4, 4, 24, 24);
        break;
      case 'sand_block':
        ctx.fillStyle = '#e2d49a';
        ctx.fillRect(4, 4, 24, 24);
        break;
      case 'heal_apple':
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(16, 17, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(16, 6, 4, 3);
        break;
      case 'smelt_iron':
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(7, 11, 18, 10);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(7, 19, 18, 3);
        break;
      case 'smelt_gold':
        ctx.fillStyle = '#facc15';
        ctx.fillRect(7, 11, 18, 10);
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(7, 19, 18, 3);
        break;
      case 'gun_rifle':
      case 'gun_sniper':
      case 'gun_shotgun':
      case 'gun_smg':
      case 'gun_rpg': {
        const gunColors = {
          gun_rifle: '#f59e0b',
          gun_sniper: '#22c55e',
          gun_shotgun: '#ef4444',
          gun_smg: '#38bdf8',
          gun_rpg: '#a855f7'
        };
        ctx.fillStyle = '#334155';
        ctx.fillRect(4, 12, 22, 6);
        ctx.fillStyle = gunColors[type];
        ctx.fillRect(10, 18, 5, 8);
        ctx.fillRect(22, 13, 6, 4);
        break;
      }
      default:
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(6, 6, 20, 20);
    }
    return canvas.toDataURL();
  },

  getItemIcon(type) {
    return this.generateItemDataURL(type);
  },

  drawPixelMace(ctx) {
    // Authentic Minecraft 1.21 Heavy Mace Icon
    // Breeze rod handle (diagonal from bottom-left)
    const handleCoords = [
      [5, 27], [6, 26], [7, 25],
      [8, 24], [9, 23], [10, 22],
      [11, 21], [12, 20], [13, 19]
    ];
    ctx.fillStyle = '#1e293b';
    handleCoords.forEach(([x, y]) => {
      ctx.fillRect(x - 1, y, 3, 1);
      ctx.fillRect(x, y - 1, 1, 3);
    });
    ctx.fillStyle = '#d97706'; // Breeze rod golden-orange core
    handleCoords.forEach(([x, y]) => {
      ctx.fillRect(x, y, 1, 1);
    });
    // Breeze rod swirls
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(7, 25, 1, 1);
    ctx.fillRect(11, 21, 1, 1);

    // Massive Heavy Mace Head (Top-right)
    // Dark outline
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(13, 6, 14, 14);

    // Heavy slate / dark metal head
    ctx.fillStyle = '#334155';
    ctx.fillRect(14, 7, 12, 12);

    // Stone / metal highlights
    ctx.fillStyle = '#475569';
    ctx.fillRect(15, 8, 10, 10);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(15, 8, 9, 2);
    ctx.fillRect(15, 8, 2, 9);

    // Heavy flange corners
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(13, 6, 2, 2);
    ctx.fillRect(25, 6, 2, 2);
    ctx.fillRect(13, 18, 2, 2);
    ctx.fillRect(25, 18, 2, 2);

    // Glowing Breeze Core in center of mace
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(18, 11, 4, 4);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(19, 12, 2, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(19, 12, 1, 1);
  },

  drawPixelWindCharge(ctx) {
    // Swirling Wind Charge Cyclone Orb
    // Outer glow
    ctx.fillStyle = 'rgba(186, 230, 253, 0.4)';
    ctx.beginPath();
    ctx.arc(16, 16, 12, 0, Math.PI * 2);
    ctx.fill();

    // Wind burst vortex rings
    ctx.fillStyle = '#bae6fd';
    ctx.beginPath();
    ctx.arc(16, 16, 9, 0, Math.PI * 2);
    ctx.fill();

    // Swirling spiral arms
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(16, 16, 6, 0.4, 2.5);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(16, 16, 6, 3.5, 5.7);
    ctx.stroke();

    // Dense glowing cyan core
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(16, 16, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(15, 15, 1.8, 0, Math.PI * 2);
    ctx.fill();
  },

  drawPixelSword(ctx, type) {
    const isDiamond = (type === 'sword_diamond');
    const isIron = (type === 'sword_iron');
    const isStone = (type === 'sword_stone');

    const pal = isDiamond ? {
      out: '#082f49',
      bladeDark: '#0284c7',
      bladeMid: '#00d8f6',
      bladeLight: '#7cf8ff',
      shine: '#ffffff',
      guard: '#0f172a',
      gem: '#00f5ff',
      grip: '#1e1e38',
      pommel: '#00d8f6'
    } : isIron ? {
      out: '#1e293b',
      bladeDark: '#94a3b8',
      bladeMid: '#e2e8f0',
      bladeLight: '#f8fafc',
      shine: '#ffffff',
      guard: '#475569',
      gem: '#f59e0b',
      grip: '#3e2723',
      pommel: '#94a3b8'
    } : isStone ? {
      out: '#1e1e24',
      bladeDark: '#475569',
      bladeMid: '#64748b',
      bladeLight: '#94a3b8',
      shine: '#cbd5e1',
      guard: '#334155',
      gem: '#475569',
      grip: '#44403c',
      pommel: '#475569'
    } : { // wood
      out: '#291204',
      bladeDark: '#78350f',
      bladeMid: '#b45309',
      bladeLight: '#d97706',
      shine: '#fde68a',
      guard: '#451a03',
      gem: '#92400e',
      grip: '#451a03',
      pommel: '#78350f'
    };

    // 1. Pommel
    ctx.fillStyle = pal.out;
    ctx.fillRect(4, 25, 4, 4);
    ctx.fillStyle = pal.pommel;
    ctx.fillRect(5, 26, 2, 2);

    // 2. Leather Grip
    ctx.fillStyle = pal.out;
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(6 + i - 1, 24 - i, 4, 3);
    }
    ctx.fillStyle = pal.grip;
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(6 + i, 24 - i, 2, 2);
    }

    // 3. Crossguard & Wings
    ctx.fillStyle = pal.out;
    ctx.fillRect(8, 19, 3, 3);
    ctx.fillRect(13, 24, 3, 3);
    ctx.fillRect(9, 18, 6, 6);

    ctx.fillStyle = pal.guard;
    ctx.fillRect(9, 20, 2, 2);
    ctx.fillRect(11, 22, 2, 2);
    ctx.fillRect(10, 21, 2, 2);
    ctx.fillRect(8, 20, 2, 2);
    ctx.fillRect(12, 24, 2, 2);

    // Guard Gem / Boss
    ctx.fillStyle = pal.gem;
    ctx.fillRect(10, 21, 2, 2);

    // 4. Blade Body & Bevel
    for (let step = 0; step < 13; step++) {
      const bx = 12 + step;
      const by = 19 - step;

      // Dark Border Outlines
      ctx.fillStyle = pal.out;
      ctx.fillRect(bx - 1, by + 1, 4, 4);

      // Shadow Flank
      ctx.fillStyle = pal.bladeDark;
      ctx.fillRect(bx + 1, by + 1, 1, 1);
      ctx.fillRect(bx, by + 1, 1, 1);

      // Center Ridge
      ctx.fillStyle = pal.bladeMid;
      ctx.fillRect(bx, by, 1, 1);

      // Highlight Edge Flank
      ctx.fillStyle = pal.bladeLight;
      ctx.fillRect(bx - 1, by, 1, 1);
      ctx.fillRect(bx, by - 1, 1, 1);
    }

    // 5. Blade Tip Apex & Highlights
    ctx.fillStyle = pal.out;
    ctx.fillRect(25, 5, 3, 3);
    ctx.fillRect(26, 4, 2, 2);

    ctx.fillStyle = pal.shine;
    ctx.fillRect(24, 6, 2, 2);
    ctx.fillRect(25, 5, 2, 2);
    ctx.fillRect(26, 4, 1, 1);

    // Diamond Sparkles
    if (isDiamond) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(24, 3, 1, 2);
      ctx.fillRect(23, 4, 3, 1);
      ctx.fillRect(28, 7, 1, 2);
      ctx.fillRect(27, 8, 3, 1);
    }
  },

  drawPixelPickaxe(ctx, type) {
    const isDia = (type === 'pickaxe_diamond');
    const isIron = (type === 'pickaxe_iron');

    const headLight = isDia ? '#7cf8ff' : isIron ? '#f8fafc' : '#d97706';
    const headMid   = isDia ? '#00d8f6' : isIron ? '#e2e8f0' : '#b45309';
    const headDark  = isDia ? '#0284c7' : isIron ? '#94a3b8' : '#78350f';
    const out       = isDia ? '#082f49' : isIron ? '#1e293b' : '#291204';

    // 1. Wood Handle along diagonal from (6, 25) to (19, 12)
    ctx.fillStyle = '#291204';
    for (let i = 0; i < 14; i++) {
      ctx.fillRect(6 + i - 1, 25 - i, 4, 3);
    }
    ctx.fillStyle = '#8b5a2b';
    for (let i = 0; i < 14; i++) {
      ctx.fillRect(6 + i, 25 - i, 2, 2);
    }
    // Leather grip on bottom
    ctx.fillStyle = '#3d2716';
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(6 + i, 25 - i, 2, 2);
    }

    // 2. Head Socket Collar
    ctx.fillStyle = out;
    ctx.fillRect(18, 11, 4, 4);

    // 3. Double-Curved Pickaxe Head
    const pts = [
      { x: 9, y: 7 }, { x: 10, y: 6 }, { x: 12, y: 6 }, { x: 14, y: 7 },
      { x: 16, y: 8 }, { x: 18, y: 10 }, { x: 19, y: 11 }, { x: 20, y: 13 },
      { x: 21, y: 15 }, { x: 22, y: 17 }, { x: 23, y: 19 }, { x: 24, y: 21 }
    ];

    // Outlines
    ctx.fillStyle = out;
    pts.forEach(p => {
      ctx.fillRect(p.x - 1, p.y - 1, 4, 4);
    });

    // Dark base
    ctx.fillStyle = headDark;
    pts.forEach(p => {
      ctx.fillRect(p.x + 1, p.y + 1, 2, 2);
    });

    // Mid body
    ctx.fillStyle = headMid;
    pts.forEach(p => {
      ctx.fillRect(p.x, p.y, 2, 2);
    });

    // Highlight ridge
    ctx.fillStyle = headLight;
    pts.forEach(p => {
      ctx.fillRect(p.x, p.y - 1, 1, 1);
    });

    // Chisel Tips
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(9, 7, 1, 1);
    ctx.fillRect(24, 21, 1, 1);

    if (isDia) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(8, 5, 1, 2);
      ctx.fillRect(7, 6, 3, 1);
    }
  },

  drawPixelBow(ctx, type) {
    const isPower = (type === 'bow_power');
    const isPunch = (type === 'bow_punch');

    const staveColor = isPower ? '#7e22ce' : isPunch ? '#047857' : '#8b5a2b';
    const runeColor = isPower ? '#c084fc' : isPunch ? '#34d399' : '#d4a373';
    const stringColor = isPower ? '#f3e8ff' : isPunch ? '#67e8f9' : '#f8fafc';
    const outColor = isPower ? '#3b0764' : isPunch ? '#064e3b' : '#3d2716';

    // Recurve Bow Stave Path
    const stavePts = [
      { x: 22, y: 5 }, { x: 24, y: 7 }, { x: 25, y: 10 },
      { x: 26, y: 13 }, { x: 26, y: 18 }, { x: 25, y: 21 },
      { x: 24, y: 24 }, { x: 22, y: 26 }
    ];

    // Outlines
    ctx.fillStyle = outColor;
    stavePts.forEach(p => {
      ctx.fillRect(p.x - 1, p.y - 1, 4, 4);
    });

    // Stave body
    ctx.fillStyle = staveColor;
    stavePts.forEach(p => {
      ctx.fillRect(p.x, p.y, 2, 2);
    });

    // Grip Handle wrap
    ctx.fillStyle = '#3d2716';
    ctx.fillRect(25, 14, 3, 4);

    // Highlight / Runes
    ctx.fillStyle = runeColor;
    ctx.fillRect(24, 9, 2, 2);
    ctx.fillRect(24, 20, 2, 2);

    // Horn Tips
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(21, 4, 2, 2);
    ctx.fillRect(21, 27, 2, 2);

    // Fine Drawn Bowstring
    ctx.strokeStyle = stringColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(21.5, 5);
    ctx.lineTo(13.5, 16);
    ctx.lineTo(21.5, 27);
    ctx.stroke();

    // Magic Shimmer Particles for enchanted bows
    if (isPower || isPunch) {
      ctx.fillStyle = runeColor;
      ctx.fillRect(10, 11, 2, 2);
      ctx.fillRect(8, 20, 2, 2);
      ctx.fillRect(15, 6, 2, 2);
    }
  },

  drawPixelShears(ctx) {
    // 1. Pivot bolt
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(14, 14, 4, 4);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(15, 15, 2, 2);

    // 2. Blade 1
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(7, 5, 8, 10);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(8, 6, 6, 8);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(12, 6, 2, 8);

    // 3. Blade 2
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(17, 5, 8, 10);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(18, 6, 6, 8);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(18, 6, 2, 8);

    // 4. Red Spring Loop Handles
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(9, 18, 4, 9);
    ctx.fillRect(19, 18, 4, 9);
    ctx.fillRect(9, 25, 14, 3);
    ctx.clearRect(12, 20, 8, 6);
  },

  drawPixelGoldenApple(ctx, isEnchanted = false) {
    const outColor = isEnchanted ? '#4a044e' : '#451a03';
    const bodyDark = isEnchanted ? '#c026d3' : '#b45309';
    const bodyMid = isEnchanted ? '#e879f9' : '#f59e0b';
    const bodyLight = isEnchanted ? '#fdf4ff' : '#fef08a';
    const stemColor = isEnchanted ? '#3b0764' : '#542605';
    const leafColor = isEnchanted ? '#34d399' : '#10b981';

    // 1. Stem & Leaf
    ctx.fillStyle = stemColor;
    ctx.fillRect(15, 4, 3, 5);
    ctx.fillStyle = leafColor;
    ctx.fillRect(18, 5, 4, 3);
    ctx.fillRect(19, 4, 2, 1);

    // 2. Apple Outline
    ctx.fillStyle = outColor;
    ctx.fillRect(10, 8, 12, 18);
    ctx.fillRect(8, 10, 16, 14);
    ctx.fillRect(7, 12, 18, 10);

    // 3. Apple Body Dark Base
    ctx.fillStyle = bodyDark;
    ctx.fillRect(10, 9, 12, 16);
    ctx.fillRect(8, 11, 16, 12);

    // 4. Apple Mid Tones
    ctx.fillStyle = bodyMid;
    ctx.fillRect(11, 10, 10, 14);
    ctx.fillRect(9, 12, 14, 10);

    // 5. Apple Highlights & Specular Reflection
    ctx.fillStyle = bodyLight;
    ctx.fillRect(11, 11, 4, 4);
    ctx.fillRect(12, 10, 3, 2);
    ctx.fillRect(10, 12, 2, 3);

    // Bottom Dimple
    ctx.fillStyle = outColor;
    ctx.fillRect(15, 24, 2, 2);

    // Enchanted Shimmer Sparkles
    if (isEnchanted) {
      ctx.fillStyle = '#fdf4ff';
      ctx.fillRect(6, 8, 2, 2);
      ctx.fillRect(24, 18, 2, 2);
      ctx.fillRect(8, 22, 2, 2);
      ctx.fillRect(23, 8, 2, 2);
    }
  },

  drawPixelFireball(ctx) {
    // 1. Charcoal Obsidian Crust Outline
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(10, 7, 12, 18);
    ctx.fillRect(7, 10, 18, 12);
    ctx.fillRect(8, 8, 16, 16);

    // 2. Fiery Outer Crust
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(9, 9, 14, 14);

    // 3. Molten Lava Body
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(10, 10, 12, 12);
    ctx.fillRect(11, 9, 10, 14);

    // 4. White-Hot Radiant Core
    ctx.fillStyle = '#facc15';
    ctx.fillRect(12, 12, 8, 8);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(13, 13, 6, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(14, 14, 3, 3);

    // 5. Flying Flaming Embers
    ctx.fillStyle = '#f97316';
    ctx.fillRect(5, 12, 2, 2);
    ctx.fillRect(25, 9, 2, 2);
    ctx.fillRect(8, 23, 2, 2);
    ctx.fillRect(23, 21, 2, 2);
  },

  drawPixelEnderPearl(ctx) {
    // 1. Void Outline
    ctx.fillStyle = '#022c22';
    ctx.fillRect(10, 7, 12, 18);
    ctx.fillRect(7, 10, 18, 12);
    ctx.fillRect(8, 8, 16, 16);

    // 2. Cosmic Abyss Teal Body
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(9, 9, 14, 14);

    // 3. Turquoise Swirl Iris
    ctx.fillStyle = '#0d9488';
    ctx.fillRect(10, 10, 12, 12);
    ctx.fillStyle = '#14b8a6';
    ctx.fillRect(12, 11, 8, 9);

    // 4. Radiant Galactic Eye Core
    ctx.fillStyle = '#2dd4bf';
    ctx.fillRect(13, 12, 6, 6);
    ctx.fillStyle = '#a7f3d0';
    ctx.fillRect(14, 13, 3, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(15, 13, 2, 2);

    // 5. Orbiting Void Star Dust
    ctx.fillStyle = '#c084fc';
    ctx.fillRect(6, 10, 2, 2);
    ctx.fillRect(24, 11, 2, 2);
    ctx.fillRect(22, 22, 2, 2);
    ctx.fillRect(8, 21, 2, 2);
  },

  drawPixelIngot(ctx, isGold = false) {
    const out = isGold ? '#451a03' : '#0f172a';
    const dark = isGold ? '#b45309' : '#64748b';
    const mid = isGold ? '#f59e0b' : '#cbd5e1';
    const light = isGold ? '#fef08a' : '#f8fafc';
    const shine = '#ffffff';

    // 3D Perspective Ingot Bar
    ctx.fillStyle = out;
    ctx.fillRect(6, 11, 20, 12);
    ctx.fillRect(8, 9, 16, 14);

    ctx.fillStyle = dark;
    ctx.fillRect(7, 14, 18, 8);

    ctx.fillStyle = mid;
    ctx.fillRect(8, 11, 16, 9);

    ctx.fillStyle = light;
    ctx.fillRect(9, 10, 14, 5);

    ctx.fillStyle = shine;
    ctx.fillRect(10, 10, 10, 2);
    ctx.fillRect(9, 11, 2, 3);
  },

  drawPixelDiamond(ctx) {
    // 1. Dark Outline
    ctx.fillStyle = '#082f49';
    ctx.beginPath();
    ctx.moveTo(10, 7);
    ctx.lineTo(21, 7);
    ctx.lineTo(27, 13);
    ctx.lineTo(16, 27);
    ctx.lineTo(5, 13);
    ctx.closePath();
    ctx.fill();

    // 2. Deep Facet Shadows
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.moveTo(16, 13);
    ctx.lineTo(25, 13);
    ctx.lineTo(16, 25);
    ctx.closePath();
    ctx.fill();

    // 3. Mid Crystal Tone
    ctx.fillStyle = '#00d8f6';
    ctx.beginPath();
    ctx.moveTo(16, 13);
    ctx.lineTo(7, 13);
    ctx.lineTo(16, 25);
    ctx.closePath();
    ctx.fill();

    // 4. Crown Upper Facets
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(10, 8);
    ctx.lineTo(21, 8);
    ctx.lineTo(25, 12);
    ctx.lineTo(7, 12);
    ctx.closePath();
    ctx.fill();

    // 5. Crown Top Table & Specular Glint
    ctx.fillStyle = '#7cf8ff';
    ctx.fillRect(12, 9, 8, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(13, 9, 4, 2);
    ctx.fillRect(7, 13, 2, 2);

    // Floating Sparkles
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(24, 6, 2, 2);
    ctx.fillRect(4, 18, 2, 2);
  },

  drawPixelEmerald(ctx) {
    // 1. Dark Outline
    ctx.fillStyle = '#022c22';
    ctx.beginPath();
    ctx.moveTo(11, 6);
    ctx.lineTo(20, 6);
    ctx.lineTo(25, 11);
    ctx.lineTo(25, 20);
    ctx.lineTo(20, 25);
    ctx.lineTo(11, 25);
    ctx.lineTo(6, 20);
    ctx.lineTo(6, 11);
    ctx.closePath();
    ctx.fill();

    // 2. Dark Green Lower Facets
    ctx.fillStyle = '#047857';
    ctx.fillRect(8, 13, 16, 10);

    // 3. Mid Emerald Tone
    ctx.fillStyle = '#10b981';
    ctx.fillRect(8, 8, 16, 12);

    // 4. Inner Table Facet
    ctx.fillStyle = '#34d399';
    ctx.fillRect(10, 10, 12, 11);

    // 5. Bright Bevel Highlight
    ctx.fillStyle = '#a7f3d0';
    ctx.fillRect(11, 8, 9, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(12, 9, 5, 2);
    ctx.fillRect(8, 11, 2, 4);

    // Sparkles
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(24, 7, 2, 2);
    ctx.fillRect(5, 18, 2, 2);
  },

  /**
   * Draws an authentic 32x32 Minecraft Potion bottle
   */
  drawPixelPotion(ctx, type) {
    let base = '#00d0f0';
    let light = '#7dd3fc';
    let dark = '#0284c7';

    if (type === 'potion_jump' || type === 'jump') {
      base = '#22c55e';
      light = '#86efac';
      dark = '#15803d';
    } else if (type === 'potion_invisibility' || type === 'invisibility') {
      base = '#94a3b8';
      light = '#e2e8f0';
      dark = '#475569';
    } else if (type === 'potion_regen' || type === 'regen') {
      base = '#f43f5e';
      light = '#fda4af';
      dark = '#be123c';
    }

    // 1. Cork Stopper
    ctx.fillStyle = '#78350f';
    ctx.fillRect(13, 3, 6, 4);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(14, 3, 3, 2);

    // 2. Glass Neck Collar & Lip
    ctx.fillStyle = '#64748b';
    ctx.fillRect(11, 7, 10, 2);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(12, 7, 6, 1);

    // 3. Glass Neck
    ctx.fillStyle = '#64748b';
    ctx.fillRect(12, 9, 8, 4);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(13, 9, 6, 4);

    // 4. Bottle Body Outline (Dark Glass Rim)
    ctx.fillStyle = '#475569';
    // Shoulders
    ctx.fillRect(9, 13, 14, 2);
    ctx.fillRect(7, 15, 18, 2);
    // Main Body
    ctx.fillRect(6, 17, 20, 9);
    // Base curves
    ctx.fillRect(8, 26, 16, 2);
    ctx.fillRect(10, 28, 12, 1);

    // 5. Potion Liquid Fill
    ctx.fillStyle = dark;
    ctx.fillRect(8, 17, 16, 9);
    ctx.fillRect(10, 26, 12, 2);

    ctx.fillStyle = base;
    ctx.fillRect(8, 16, 15, 8);
    ctx.fillRect(10, 14, 11, 2);
    ctx.fillRect(13, 11, 5, 3);

    // 6. Liquid Highlights & Glass Reflections
    ctx.fillStyle = light;
    ctx.fillRect(8, 17, 4, 7);
    ctx.fillRect(10, 15, 3, 2);

    // Glass sheen stripe (White)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.fillRect(8, 18, 2, 6);
    ctx.fillRect(10, 15, 2, 1);
    ctx.fillRect(12, 8, 2, 1);

    // Sparkle Bubbles inside liquid
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(18, 19, 2, 2);
    ctx.fillRect(13, 22, 1, 1);
    ctx.fillRect(16, 24, 2, 2);
  },

  // --- Survival War Vanilla Textures ---
  getOakLogSide() {
    if (this.cache['oak_log_side']) return this.cache['oak_log_side'];
    const { canvas, ctx } = this.createCanvas();
    const barkColors = ['#6b5130', '#5a4224', '#4d371d', '#785c38'];
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        ctx.fillStyle = barkColors[(x * 3 + y * 5 + Math.floor(Math.random() * 4)) % barkColors.length];
        ctx.fillRect(x, y, 1, 1);
      }
    }
    ctx.fillStyle = '#3b2914';
    [2, 6, 10, 14].forEach(x => {
      ctx.fillRect(x, 0, 1, 16);
    });
    return (this.cache['oak_log_side'] = this.toThreeTexture(canvas));
  },

  getOakLogTop() {
    if (this.cache['oak_log_top']) return this.cache['oak_log_top'];
    const { canvas, ctx } = this.createCanvas();
    ctx.fillStyle = '#5a4224';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#b8945f';
    ctx.fillRect(2, 2, 12, 12);
    ctx.fillStyle = '#9a7543';
    ctx.fillRect(4, 4, 8, 8);
    ctx.fillStyle = '#b8945f';
    ctx.fillRect(6, 6, 4, 4);
    ctx.fillStyle = '#785c38';
    ctx.fillRect(7, 7, 2, 2);
    return (this.cache['oak_log_top'] = this.toThreeTexture(canvas));
  },

  getOakLeaves() {
    if (this.cache['oak_leaves']) return this.cache['oak_leaves'];
    const { canvas, ctx } = this.createCanvas();
    const leafColors = ['#3d7a22', '#4c942c', '#2e6118', '#5aa637'];
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        ctx.fillStyle = leafColors[Math.floor(Math.random() * leafColors.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return (this.cache['oak_leaves'] = this.toThreeTexture(canvas));
  },

  getOreTexture(key, speckColors) {
    if (this.cache[key]) return this.cache[key];
    const { canvas, ctx } = this.createCanvas();
    const stoneColors = ['#7c7c7c', '#6d6d6d', '#8c8c8c', '#5e5e5e'];
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        ctx.fillStyle = stoneColors[Math.floor(Math.random() * stoneColors.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }
    const spots = [[3, 3], [10, 4], [6, 8], [11, 10], [3, 12], [8, 13]];
    spots.forEach(([sx, sy], idx) => {
      ctx.fillStyle = speckColors[idx % speckColors.length];
      ctx.fillRect(sx, sy, 2, 2);
      ctx.fillStyle = speckColors[(idx + 1) % speckColors.length];
      ctx.fillRect(sx + 1, sy, 1, 1);
    });
    return (this.cache[key] = this.toThreeTexture(canvas));
  },

  getSand() {
    if (this.cache['sand']) return this.cache['sand'];
    const { canvas, ctx } = this.createCanvas();
    const colors = ['#e2d49a', '#d8c888', '#ede1ae', '#cbb979'];
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return (this.cache['sand'] = this.toThreeTexture(canvas));
  },

  getBedrock() {
    if (this.cache['bedrock']) return this.cache['bedrock'];
    const { canvas, ctx } = this.createCanvas();
    const colors = ['#2b2b2b', '#444444', '#1a1a1a', '#555555'];
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return (this.cache['bedrock'] = this.toThreeTexture(canvas));
  },

  getCraftingTableTop() {
    if (this.cache['ct_top']) return this.cache['ct_top'];
    const { canvas, ctx } = this.createCanvas();
    ctx.fillStyle = '#b8945f';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#5c4627';
    ctx.fillRect(0, 0, 16, 1);
    ctx.fillRect(0, 15, 16, 1);
    ctx.fillRect(0, 0, 1, 16);
    ctx.fillRect(15, 0, 1, 16);
    ctx.fillRect(5, 1, 1, 14);
    ctx.fillRect(10, 1, 1, 14);
    ctx.fillRect(1, 5, 14, 1);
    ctx.fillRect(1, 10, 14, 1);
    return (this.cache['ct_top'] = this.toThreeTexture(canvas));
  },

  getCraftingTableSide() {
    if (this.cache['ct_side']) return this.cache['ct_side'];
    const { canvas, ctx } = this.createCanvas();
    ctx.fillStyle = '#a98451';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#5c4627';
    ctx.fillRect(0, 0, 16, 2);
    ctx.fillRect(0, 14, 16, 2);
    ctx.fillRect(3, 4, 3, 7);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(9, 4, 4, 3);
    ctx.fillStyle = '#5c4627';
    ctx.fillRect(10, 7, 2, 5);
    return (this.cache['ct_side'] = this.toThreeTexture(canvas));
  },

  getFurnaceFront(lit = false) {
    const k = lit ? 'furnace_front_lit' : 'furnace_front';
    if (this.cache[k]) return this.cache[k];
    const { canvas, ctx } = this.createCanvas();
    const stoneColors = ['#7c7c7c', '#6d6d6d', '#8c8c8c', '#5e5e5e'];
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        ctx.fillStyle = stoneColors[(x * 3 + y * 7) % stoneColors.length];
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // Top fuel/ore opening
    ctx.fillStyle = '#1f1f1f';
    ctx.fillRect(3, 3, 10, 4);
    // Bottom fire chamber
    ctx.fillRect(3, 9, 10, 5);
    if (lit) {
      ctx.fillStyle = '#f97316';
      ctx.fillRect(4, 10, 8, 3);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(6, 11, 4, 2);
    }
    return (this.cache[k] = this.toThreeTexture(canvas));
  }
};

window.TextureGenerator = TextureGenerator;
