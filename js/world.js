// Minecraft Bedwars Voxel World Engine
class VoxelWorld {
  constructor(scene) {
    this.scene = scene;
    this.voxelMap = new Map(); // key -> { type, mesh, canBreak, team, hidden, instancedMesh, instanceIndex }
    this.chests = new Map(); // key -> { x, y, z, isCenter, opened, items: [] }
    this.instancedMeshes = [];
    this.isGenerating = false;
    this.materials = {};
    this.sharedBoxGeo = new THREE.BoxGeometry(1, 1, 1);
    this.sharedBedGeo = new THREE.BoxGeometry(1, 0.56, 1); // Bed is half-block height

    this.bedStatus = {
      red: true,
      blue: true,
      green: true,
      yellow: true
    };

    // Shared particle system
    this.particles = [];
    this.sharedParticleGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    this.sharedCritMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });

    this.initMaterials();
  }

  initMaterials() {
    // 6-sided materials for grass
    const grassTop = TextureGenerator.getGrassTop();
    const grassSide = TextureGenerator.getGrassSide();
    const dirt = TextureGenerator.getDirt();
    const stone = TextureGenerator.getStone();
    const planks = TextureGenerator.getOakPlanks();
    const endStone = TextureGenerator.getEndStone();
    const obsidian = TextureGenerator.getObsidian();
    const redWool = TextureGenerator.getWool('#d32f2f', '#9a1a1a');
    const blueWool = TextureGenerator.getWool('#1e56a0', '#10316b');
    const greenWool = TextureGenerator.getWool('#2e9e2e', '#1b6e1b');
    const yellowWool = TextureGenerator.getWool('#d4be17', '#96850c');

    const grassMatSide = new THREE.MeshLambertMaterial({ map: grassSide });
    const grassMatTop = new THREE.MeshLambertMaterial({ map: grassTop });
    const grassMatBottom = new THREE.MeshLambertMaterial({ map: dirt });

    this.materials['GRASS'] = [
      grassMatSide, grassMatSide, grassMatTop, grassMatBottom, grassMatSide, grassMatSide
    ];

    this.materials['DIRT'] = new THREE.MeshLambertMaterial({ map: dirt });
    this.materials['STONE'] = new THREE.MeshLambertMaterial({ map: stone });
    this.materials['OAK_PLANKS'] = new THREE.MeshLambertMaterial({ map: planks });
    this.materials['RED_WOOL'] = new THREE.MeshLambertMaterial({ map: redWool });
    this.materials['BLUE_WOOL'] = new THREE.MeshLambertMaterial({ map: blueWool });
    this.materials['GREEN_WOOL'] = new THREE.MeshLambertMaterial({ map: greenWool });
    this.materials['YELLOW_WOOL'] = new THREE.MeshLambertMaterial({ map: yellowWool });
    this.materials['END_STONE'] = new THREE.MeshLambertMaterial({ map: endStone });
    this.materials['OBSIDIAN'] = new THREE.MeshLambertMaterial({ map: obsidian });

    // New Thematic Map Blocks
    const stoneBricks = TextureGenerator.getStoneBricks();
    const mossyStoneBricks = TextureGenerator.getMossyStoneBricks();
    const netherrack = TextureGenerator.getNetherrack();
    const netherBricks = TextureGenerator.getNetherBricks();
    const purpur = TextureGenerator.getPurpur();
    const glowstone = TextureGenerator.getGlowstone();

    this.materials['STONE_BRICK'] = new THREE.MeshLambertMaterial({ map: stoneBricks });
    this.materials['MOSSY_STONE_BRICK'] = new THREE.MeshLambertMaterial({ map: mossyStoneBricks });
    this.materials['NETHERRACK'] = new THREE.MeshLambertMaterial({ map: netherrack });
    this.materials['NETHER_BRICK'] = new THREE.MeshLambertMaterial({ map: netherBricks });
    this.materials['PURPUR'] = new THREE.MeshLambertMaterial({ map: purpur });
    this.materials['GLOWSTONE'] = new THREE.MeshLambertMaterial({ map: glowstone });

    // School Map & Decorative Materials
    this.materials['WHITE_WOOL'] = new THREE.MeshLambertMaterial({ map: TextureGenerator.getWool('#eaeded', '#cfd8dc') });
    this.materials['BLACK_WOOL'] = new THREE.MeshLambertMaterial({ map: TextureGenerator.getWool('#202020', '#111111') });
    this.materials['ORANGE_WOOL'] = new THREE.MeshLambertMaterial({ map: TextureGenerator.getWool('#e67e22', '#d35400') });
    this.materials['PURPLE_WOOL'] = new THREE.MeshLambertMaterial({ map: TextureGenerator.getWool('#8e44ad', '#6c3483') });
    this.materials['CYAN_WOOL'] = new THREE.MeshLambertMaterial({ map: TextureGenerator.getWool('#16a085', '#117a65') });
    this.materials['GLASS'] = new THREE.MeshLambertMaterial({ color: 0x90caf9, transparent: true, opacity: 0.65 });
    this.materials['QUARTZ'] = new THREE.MeshLambertMaterial({ map: TextureGenerator.getMineralBlock('#f5f5f5', '#ffffff', '#e2e2e2') });
    this.materials['OAK_WOOD'] = new THREE.MeshLambertMaterial({ map: planks });

    // Beds
    const redBedTex = TextureGenerator.getBedTexture('red');
    const blueBedTex = TextureGenerator.getBedTexture('blue');
    const greenBedTex = TextureGenerator.getBedTexture('green');
    const yellowBedTex = TextureGenerator.getBedTexture('yellow');
    this.materials['BED_RED'] = new THREE.MeshLambertMaterial({ map: redBedTex });
    this.materials['BED_BLUE'] = new THREE.MeshLambertMaterial({ map: blueBedTex });
    this.materials['BED_GREEN'] = new THREE.MeshLambertMaterial({ map: greenBedTex });
    this.materials['BED_YELLOW'] = new THREE.MeshLambertMaterial({ map: yellowBedTex });

    // Mineral blocks for generators
    this.materials['IRON_BLOCK'] = new THREE.MeshLambertMaterial({
      map: TextureGenerator.getMineralBlock('#dedede', '#ffffff', '#a0a0a0')
    });
    this.materials['GOLD_BLOCK'] = new THREE.MeshLambertMaterial({
      map: TextureGenerator.getMineralBlock('#f5bc18', '#fff382', '#a67705')
    });
    this.materials['DIAMOND_BLOCK'] = new THREE.MeshLambertMaterial({
      map: TextureGenerator.getMineralBlock('#3bdbe5', '#9bfbff', '#128b94')
    });
    this.materials['EMERALD_BLOCK'] = new THREE.MeshLambertMaterial({
      map: TextureGenerator.getMineralBlock('#17dd62', '#72fca5', '#097532')
    });

    // 6-sided materials for CHEST (SkyWars)
    const chestSide = new THREE.MeshLambertMaterial({ map: TextureGenerator.getChestSide() });
    const chestTop = new THREE.MeshLambertMaterial({ map: TextureGenerator.getChestTop() });
    const chestBottom = new THREE.MeshLambertMaterial({ map: TextureGenerator.getChestBottom() });
    const chestFront = new THREE.MeshLambertMaterial({ map: TextureGenerator.getChestFront() });
    this.materials['CHEST'] = [
      chestSide, chestSide, chestTop, chestBottom, chestFront, chestSide
    ];
  }

  getKey(x, y, z) {
    return `${Math.round(x)},${Math.round(y)},${Math.round(z)}`;
  }

  clear() {
    if (this.instancedMeshes) {
      for (const im of this.instancedMeshes) {
        this.scene.remove(im);
      }
      this.instancedMeshes = [];
    }
    if (this.voxelMap) {
      for (const b of this.voxelMap.values()) {
        if (b.mesh) this.scene.remove(b.mesh);
      }
      this.voxelMap.clear();
    }
    if (this.chests) {
      this.chests.clear();
    }
  }

  setBlock(x, y, z, type, canBreak = false, team = null) {
    const key = this.getKey(x, y, z);
    const existing = this.voxelMap.get(key);
    if (existing) {
      if (existing.mesh) this.scene.remove(existing.mesh);
      if (existing.instancedMesh && existing.instanceIndex !== undefined) {
        const dummy = new THREE.Object3D();
        dummy.position.set(0, -9999, 0);
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        existing.instancedMesh.setMatrixAt(existing.instanceIndex, dummy.matrix);
        existing.instancedMesh.instanceMatrix.needsUpdate = true;
      }
      this.voxelMap.delete(key);
    }

    if (!type || type === 'AIR') return;

    if (this.isGenerating) {
      // Record during map generation; visual meshes will be batched into InstancedMesh in buildBatchedMeshes()
      this.voxelMap.set(key, { x, y, z, type, mesh: null, canBreak, team, hidden: false });
      return;
    }

    // Dynamic block placement during gameplay (player or bot placing wool, defense, etc.)
    let mat = this.materials[type] || this.materials['RED_WOOL'];
    let geo = (type.startsWith('BED_')) ? this.sharedBedGeo : this.sharedBoxGeo;
    let yOffset = (type.startsWith('BED_')) ? -0.22 : 0;

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + yOffset, z);
    mesh.castShadow = false;
    mesh.receiveShadow = false;

    this.scene.add(mesh);
    this.voxelMap.set(key, { x, y, z, type, mesh, canBreak, team, hidden: false });
  }

  buildBatchedMeshes() {
    // 1. Remove previous instanced meshes
    if (this.instancedMeshes) {
      for (const im of this.instancedMeshes) {
        this.scene.remove(im);
      }
    }
    this.instancedMeshes = [];

    // 2. Classify blocks into visible vs hidden
    // A block is hidden if all 6 neighbors (+X, -X, +Y, -Y, +Z, -Z) exist in voxelMap and are solid non-bed blocks
    const dummy = new THREE.Object3D();
    const typeGroups = {};

    for (const b of this.voxelMap.values()) {
      // Beds, chests and interactable special blocks are always visible
      if (b.type.startsWith('BED_') || b.type === 'CHEST') {
        b.hidden = false;
        if (!typeGroups[b.type]) typeGroups[b.type] = [];
        typeGroups[b.type].push(b);
        continue;
      }

      const isHidden = (
        this.isSolid(b.x + 1, b.y, b.z) &&
        this.isSolid(b.x - 1, b.y, b.z) &&
        this.isSolid(b.x, b.y + 1, b.z) &&
        this.isSolid(b.x, b.y - 1, b.z) &&
        this.isSolid(b.x, b.y, b.z + 1) &&
        this.isSolid(b.x, b.y, b.z - 1)
      );

      b.hidden = isHidden;
      if (!isHidden) {
        if (!typeGroups[b.type]) typeGroups[b.type] = [];
        typeGroups[b.type].push(b);
      }
    }

    // 3. Create InstancedMesh for each block type
    for (const type in typeGroups) {
      const list = typeGroups[type];
      let mat = this.materials[type];
      let geo = (type.startsWith('BED_')) ? this.sharedBedGeo : this.sharedBoxGeo;
      let yOffset = (type.startsWith('BED_')) ? -0.22 : 0;

      const imesh = new THREE.InstancedMesh(geo, mat, list.length);
      imesh.castShadow = false;
      imesh.receiveShadow = false;

      for (let i = 0; i < list.length; i++) {
        const b = list[i];
        b.instancedMesh = imesh;
        b.instanceIndex = i;
        dummy.position.set(b.x, b.y + yOffset, b.z);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        imesh.setMatrixAt(i, dummy.matrix);
      }

      imesh.instanceMatrix.needsUpdate = true;
      this.scene.add(imesh);
      this.instancedMeshes.push(imesh);
    }
  }

  getBlock(x, y, z) {
    return this.voxelMap.get(this.getKey(x, y, z));
  }

  isSolid(x, y, z) {
    const b = this.getBlock(x, y, z);
    return !!b;
  }

  // Remove block and spawn debris particles
  removeBlock(x, y, z) {
    const key = this.getKey(x, y, z);
    const b = this.voxelMap.get(key);
    if (!b) return null;

    if (b.mesh) {
      this.scene.remove(b.mesh);
    }
    if (b.instancedMesh && b.instanceIndex !== undefined) {
      const dummy = new THREE.Object3D();
      dummy.position.set(0, -9999, 0);
      dummy.scale.set(0, 0, 0);
      dummy.updateMatrix();
      b.instancedMesh.setMatrixAt(b.instanceIndex, dummy.matrix);
      b.instancedMesh.instanceMatrix.needsUpdate = true;
    }
    this.voxelMap.delete(key);

    // Reveal any adjacent neighbor blocks that were previously hidden
    const neighbors = [
      { x: b.x + 1, y: b.y, z: b.z }, { x: b.x - 1, y: b.y, z: b.z },
      { x: b.x, y: b.y + 1, z: b.z }, { x: b.x, y: b.y - 1, z: b.z },
      { x: b.x, y: b.y, z: b.z + 1 }, { x: b.x, y: b.y, z: b.z - 1 }
    ];
    for (const n of neighbors) {
      const nb = this.getBlock(n.x, n.y, n.z);
      if (nb && nb.hidden && !nb.mesh) {
        nb.hidden = false;
        let mat = this.materials[nb.type] || this.materials['STONE'];
        let geo = (nb.type.startsWith('BED_')) ? this.sharedBedGeo : this.sharedBoxGeo;
        let yOffset = (nb.type.startsWith('BED_')) ? -0.22 : 0;
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(nb.x, nb.y + yOffset, nb.z);
        this.scene.add(mesh);
        nb.mesh = mesh;
      }
    }

    this.spawnBreakParticles(x, y, z, b.type);
    window.soundManager.playBreak();

    // Check if it's a bed
    if (b.type === 'BED_RED') {
      this.destroyBed('red');
    } else if (b.type === 'BED_BLUE') {
      this.destroyBed('blue');
    } else if (b.type === 'BED_GREEN') {
      this.destroyBed('green');
    } else if (b.type === 'BED_YELLOW') {
      this.destroyBed('yellow');
    }

    return b;
  }

  destroyBed(team) {
    if (!this.bedStatus[team]) return;
    this.bedStatus[team] = false;

    // Remove any remaining part of the bed on adjacent blocks
    const targetType = `BED_${team.toUpperCase()}`;
    const keys = Array.from(this.voxelMap.keys());
    for (const k of keys) {
      const block = this.voxelMap.get(k);
      if (block && block.type === targetType) {
        if (block.mesh) this.scene.remove(block.mesh);
        if (block.instancedMesh && block.instanceIndex !== undefined) {
          const dummy = new THREE.Object3D();
          dummy.position.set(0, -9999, 0);
          dummy.scale.set(0, 0, 0);
          dummy.updateMatrix();
          block.instancedMesh.setMatrixAt(block.instanceIndex, dummy.matrix);
          block.instancedMesh.instanceMatrix.needsUpdate = true;
        }
        this.voxelMap.delete(k);
      }
    }

    window.soundManager.playBedBreak();
    if (window.game) {
      window.game.onBedDestroyed(team);
    }
  }

  // Particle debris effect when mining blocks
  spawnBreakParticles(x, y, z, type) {
    let mat = this.materials[type] || this.materials['STONE'];
    if (Array.isArray(mat)) mat = mat[0];

    for (let i = 0; i < 6; i++) {
      const p = new THREE.Mesh(this.sharedParticleGeo, mat);
      p.position.set(
        x + (Math.random() - 0.5) * 0.6,
        y + (Math.random() - 0.5) * 0.6,
        z + (Math.random() - 0.5) * 0.6
      );
      this.scene.add(p);
      this.particles.push({
        mesh: p,
        vx: (Math.random() - 0.5) * 3.5,
        vy: Math.random() * 2.5 + 1.0,
        vz: (Math.random() - 0.5) * 3.5,
        life: 0,
        maxLife: 0.35
      });
    }
  }

  // Critical hit particles (Golden sparkle burst)
  spawnCritParticles(pos) {
    for (let i = 0; i < 8; i++) {
      const p = new THREE.Mesh(this.sharedParticleGeo, this.sharedCritMat);
      p.position.set(
        pos.x + (Math.random() - 0.5) * 0.4,
        pos.y + 1.1 + (Math.random() - 0.5) * 0.4,
        pos.z + (Math.random() - 0.5) * 0.4
      );
      this.scene.add(p);
      this.particles.push({
        mesh: p,
        vx: (Math.random() - 0.5) * 3.8,
        vy: Math.random() * 2.8 + 1.0,
        vz: (Math.random() - 0.5) * 3.8,
        life: 0,
        maxLife: 0.3
      });
    }
  }

  // Centralized particle update called once per frame
  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.vy -= 12.0 * dt;
      p.mesh.scale.multiplyScalar(0.92);
    }
  }

  // Chest Registration & Procedural Loot Generators
  registerChest(x, y, z, isCenter = false, isSchool = false) {
    const key = this.getKey(x, y, z);
    const items = isSchool ? this.generateSchoolRandomLoot() : (isCenter ? this.generateCenterChestLoot() : this.generateSpawnChestLoot());
    this.chests.set(key, {
      x, y, z,
      isCenter,
      isSchool,
      opened: false,
      items: items
    });
  }

  generateSchoolRandomLoot() {
    // Pure procedural random loot for School Battle Royale chests
    const slots = new Array(27).fill(null);
    const usedIndices = new Set();
    const getRandomSlot = () => {
      let slotIdx;
      do {
        slotIdx = Math.floor(Math.random() * 27);
      } while (usedIndices.has(slotIdx));
      usedIndices.add(slotIdx);
      return slotIdx;
    };

    const weapons = [
      { id: 'sword_wooden', name: '战术木剑', type: 'weapon', count: 1, damage: 4 },
      { id: 'sword_stone', name: '锋利石剑', type: 'weapon', count: 1, damage: 5 },
      { id: 'sword_iron', name: '精炼铁剑', type: 'weapon', count: 1, damage: 6 },
      { id: 'sword_diamond', name: '锋利钻石神剑', type: 'weapon', count: 1, damage: 7 },
      { id: 'mace', name: '重锤 (高空砸下每格+6伤)', type: 'weapon', weaponType: 'mace', count: 1, damage: 6 }
    ];

    const armors = [
      { id: 'armor_chain', name: '锁链胸甲', type: 'armor', tier: 'chain', count: 1 },
      { id: 'armor_iron', name: '重装铁甲', type: 'armor', tier: 'iron', count: 1 },
      { id: 'armor_diamond', name: '坚韧钻石神甲', type: 'armor', tier: 'diamond', count: 1 }
    ];

    const ranged = [
      { id: 'bow_normal', name: '战术木弓', type: 'bow', bowType: 'normal', count: 1 },
      { id: 'bow_power', name: '力量强弓 (增伤)', type: 'bow', bowType: 'power', count: 1 },
      { id: 'arrow_stack', name: '箭矢 x16', type: 'arrow', count: 16 },
      { id: 'arrow_stack_large', name: '箭矢 x32', type: 'arrow', count: 32 }
    ];

    const heals = [
      { id: 'golden_apple', name: '金苹果 x2', type: 'utility', count: 2 },
      { id: 'golden_apple_3', name: '金苹果 x3', type: 'utility', count: 3 },
      { id: 'enchanted_golden_apple', name: '附魔金苹果', type: 'utility', count: 1 },
      { id: 'potion_regen', name: '恢复药水 (30秒)', type: 'potion', potionType: 'regen', duration: 30, count: 1 }
    ];

    const buffPotions = [
      { id: 'potion_speed', name: '迅捷药水 II (45秒)', type: 'potion', potionType: 'speed', duration: 45, count: 1 },
      { id: 'potion_jump', name: '跳跃药水 V (45秒)', type: 'potion', potionType: 'jump', duration: 45, count: 1 },
      { id: 'potion_invis', name: '隐形药水 (30秒)', type: 'potion', potionType: 'invis', duration: 30, count: 1 }
    ];

    const throwables = [
      { id: 'fireball', name: '烈焰弹', type: 'utility', count: 1 + Math.floor(Math.random() * 2) },
      { id: 'ender_pearl', name: '末影珍珠', type: 'utility', count: 1 + (Math.random() < 0.4 ? 1 : 0) },
      { id: 'wind_charge', name: '风弹 x8', type: 'utility', projectileType: 'wind_charge', count: 8 }
    ];

    const blocks = [
      { id: 'wool_stack_white', name: '白色羊毛 x32', type: 'block', blockType: 'WHITE_WOOL', count: 32 },
      { id: 'wool_stack_red', name: '红色羊毛 x32', type: 'block', blockType: 'RED_WOOL', count: 32 },
      { id: 'wool_stack_blue', name: '蓝色羊毛 x32', type: 'block', blockType: 'BLUE_WOOL', count: 32 },
      { id: 'wood_planks', name: '橡木木板 x32', type: 'block', blockType: 'OAK_PLANKS', count: 32 }
    ];

    const tools = [
      { id: 'pickaxe_iron', name: '铁镐', type: 'tool', count: 1 },
      { id: 'pickaxe_diamond', name: '钻石镐', type: 'tool', count: 1 },
      { id: 'shears', name: '剪刀', type: 'tool', count: 1 }
    ];

    const combinedPool = [
      ...weapons,
      ...armors,
      ...ranged,
      ...heals,
      ...buffPotions,
      ...throwables,
      ...blocks,
      ...tools
    ];

    // Pick 4 to 8 completely random items
    const numItems = 4 + Math.floor(Math.random() * 5);
    const shuffled = [...combinedPool].sort(() => Math.random() - 0.5);

    for (let i = 0; i < numItems && i < shuffled.length; i++) {
      const item = { ...shuffled[i] };
      if (item.type === 'block') item.count = 16 + Math.floor(Math.random() * 32);
      if (item.type === 'arrow') item.count = 12 + Math.floor(Math.random() * 24);
      if (item.id === 'golden_apple') item.count = 1 + Math.floor(Math.random() * 3);
      slots[getRandomSlot()] = item;
    }

    return slots;
  }

  generateSpawnChestLoot() {
    // Generates abundant building wool (32-64 count stacks) and diverse randomized gear
    const slots = new Array(27).fill(null);
    const usedIndices = new Set();
    const getRandomSlot = () => {
      let slotIdx;
      do {
        slotIdx = Math.floor(Math.random() * 27);
      } while (usedIndices.has(slotIdx));
      usedIndices.add(slotIdx);
      return slotIdx;
    };

    // 1. Abundant building wool / blocks (at least 2 large stacks: 64 to 128 total wool)
    const woolColors = ['WHITE_WOOL', 'RED_WOOL', 'BLUE_WOOL', 'GREEN_WOOL', 'YELLOW_WOOL'];
    const randomWool = woolColors[Math.floor(Math.random() * woolColors.length)];
    slots[getRandomSlot()] = { id: 'wool_stack_1', name: '羊毛 x64', type: 'block', blockType: randomWool, count: 64 };
    slots[getRandomSlot()] = { id: 'wool_stack_2', name: '羊毛 x48', type: 'block', blockType: randomWool, count: 48 };

    // 2. Weapon & Armor pool
    const weapons = [
      { id: 'sword_iron', name: '铁剑', type: 'weapon', count: 1, damage: 6 },
      { id: 'sword_stone', name: '锋利石剑', type: 'weapon', count: 1, damage: 5 },
      { id: 'sword_diamond', name: '精良钻石剑', type: 'weapon', count: 1, damage: 7 }
    ];
    slots[getRandomSlot()] = { ...weapons[Math.floor(Math.random() * weapons.length)] };

    const armors = [
      { id: 'armor_iron', name: '铁盔甲', type: 'armor', tier: 'iron', count: 1 },
      { id: 'armor_chain', name: '锁链甲', type: 'armor', tier: 'chain', count: 1 }
    ];
    slots[getRandomSlot()] = { ...armors[Math.floor(Math.random() * armors.length)] };

    // 3. Guaranteed tools & utilities
    slots[getRandomSlot()] = { id: 'pickaxe_iron', name: '铁镐', type: 'tool', count: 1 };
    slots[getRandomSlot()] = { id: 'golden_apple', name: '金苹果 x3', type: 'utility', count: 2 + Math.floor(Math.random() * 2) };

    // 4. Ranged Combat
    if (Math.random() < 0.85) {
      slots[getRandomSlot()] = { id: 'bow_normal', name: '木弓', type: 'bow', bowType: 'normal', count: 1 };
      slots[getRandomSlot()] = { id: 'arrow_16', name: '箭矢 x24', type: 'arrow', count: 16 + Math.floor(Math.random() * 16) };
    }

    // 5. Tactical / Potion random roll (2-3 random tactical items)
    const tacticalPool = [
      { id: 'potion_speed', name: '迅捷药水 II (45秒)', type: 'potion', potionType: 'speed', duration: 45, count: 1 },
      { id: 'potion_regen', name: '恢复药水 (30秒)', type: 'potion', potionType: 'regen', duration: 30, count: 1 },
      { id: 'potion_jump', name: '跳跃药水 V (45秒)', type: 'potion', potionType: 'jump', duration: 45, count: 1 },
      { id: 'fireball', name: '火焰弹', type: 'utility', count: 1 + Math.floor(Math.random() * 2) },
      { id: 'ender_pearl', name: '末影珍珠', type: 'utility', count: 1 },
      { id: 'wood_planks', name: '橡木木板 x32', type: 'block', blockType: 'OAK_PLANKS', count: 32 },
      { id: 'shears', name: '剪刀', type: 'tool', count: 1 }
    ];

    // Pick 2-3 distinct tactical items
    const shuffledTactical = [...tacticalPool].sort(() => Math.random() - 0.5);
    const tacticalCount = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < tacticalCount && i < shuffledTactical.length; i++) {
      slots[getRandomSlot()] = { ...shuffledTactical[i] };
    }

    return slots;
  }

  generateCenterChestLoot() {
    // Generates high-tier random loot for Center mega chests
    const slots = new Array(27).fill(null);
    const usedIndices = new Set();
    const getRandomSlot = () => {
      let slotIdx;
      do {
        slotIdx = Math.floor(Math.random() * 27);
      } while (usedIndices.has(slotIdx));
      usedIndices.add(slotIdx);
      return slotIdx;
    };

    // Center Mega Loot Pool
    slots[getRandomSlot()] = { id: 'wool_stack_mid', name: '羊毛 x64', type: 'block', blockType: 'PURPLE_WOOL', count: 64 };
    slots[getRandomSlot()] = { id: 'sword_diamond', name: '锋利钻石神剑', type: 'weapon', count: 1, damage: 7 };
    slots[getRandomSlot()] = { id: 'armor_diamond', name: '钻石盔甲', type: 'armor', tier: 'diamond', count: 1 };
    slots[getRandomSlot()] = { id: 'enchanted_golden_apple', name: '附魔金苹果', type: 'utility', count: 1 + (Math.random() < 0.4 ? 1 : 0) };
    slots[getRandomSlot()] = { id: 'ender_pearl', name: '末影珍珠 x2', type: 'utility', count: 2 + (Math.random() < 0.5 ? 2 : 0) };
    slots[getRandomSlot()] = { id: 'bow_power', name: '力量弓 (增伤)', type: 'bow', bowType: 'power', count: 1 };
    slots[getRandomSlot()] = { id: 'arrow_32', name: '箭矢 x32', type: 'arrow', count: 32 };

    const bonusPool = [
      { id: 'fireball', name: '火焰弹 x2', type: 'utility', count: 2 },
      { id: 'potion_regen', name: '神圣恢复药水 (30秒)', type: 'potion', potionType: 'regen', duration: 30, count: 1 },
      { id: 'potion_invis', name: '隐形药水 (30秒)', type: 'potion', potionType: 'invis', duration: 30, count: 1 },
      { id: 'pickaxe_diamond', name: '钻石镐', type: 'tool', count: 1 },
      { id: 'golden_apple', name: '金苹果 x4', type: 'utility', count: 4 },
      { id: 'mace', name: '重锤 (高空砸下每格+6伤)', type: 'weapon', weaponType: 'mace', count: 1, damage: 6 },
      { id: 'wind_charge', name: '风弹 x8', type: 'utility', projectileType: 'wind_charge', count: 8 }
    ];

    const shuffledBonus = [...bonusPool].sort(() => Math.random() - 0.5);
    const bonusCount = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < bonusCount && i < shuffledBonus.length; i++) {
      slots[getRandomSlot()] = { ...shuffledBonus[i] };
    }

    return slots;
  }

  createSkyWarsIsland(cx, cy, cz, radius = 6) {
    for (let x = -radius; x <= radius; x++) {
      for (let z = -radius; z <= radius; z++) {
        const distSq = x * x + z * z;
        if (distSq <= radius * radius) {
          this.setBlock(cx + x, cy, cz + z, 'GRASS', false);
          this.setBlock(cx + x, cy - 1, cz + z, 'DIRT', false);
          const depth = Math.floor((1.0 - Math.sqrt(distSq) / radius) * 5);
          for (let d = 2; d <= 2 + depth; d++) {
            this.setBlock(cx + x, cy - d, cz + z, 'STONE', false);
          }
        }
      }
    }
    // Small oak tree placed at island corner (cx + 3, cz + 3) so island center is wide open
    const tx = cx + 3, tz = cz + 3;
    for (let h = 1; h <= 3; h++) {
      this.setBlock(tx, cy + h, tz, 'OAK_WOOD', false);
    }
    for (let lx = -1; lx <= 1; lx++) {
      for (let lz = -1; lz <= 1; lz++) {
        this.setBlock(tx + lx, cy + 4, tz + lz, 'GREEN_WOOL', false);
        if (Math.abs(lx) + Math.abs(lz) <= 1) {
          this.setBlock(tx + lx, cy + 5, tz + lz, 'GREEN_WOOL', false);
        }
      }
    }
  }

  generateSkyWarsMap(mode) {
    if (mode === 'skywars_4p') {
      this.bedStatus = { red: true, blue: true, green: true, yellow: true };
      const islandPositions = [
        { team: 'red', x: 0, z: 36, chestPos: { x: 0, y: 1, z: 39 }, bedPos: { x: 0, y: 1, z: 33 }, bedType: 'BED_RED' },
        { team: 'blue', x: 0, z: -36, chestPos: { x: 0, y: 1, z: -39 }, bedPos: { x: 0, y: 1, z: -33 }, bedType: 'BED_BLUE' },
        { team: 'green', x: 36, z: 0, chestPos: { x: 39, y: 1, z: 0 }, bedPos: { x: 33, y: 1, z: 0 }, bedType: 'BED_GREEN' },
        { team: 'yellow', x: -36, z: 0, chestPos: { x: -39, y: 1, z: 0 }, bedPos: { x: -33, y: 1, z: 0 }, bedType: 'BED_YELLOW' }
      ];

      for (const pos of islandPositions) {
        this.createSkyWarsIsland(pos.x, 0, pos.z, 6);
        // Clear space around island center to ensure player and bot never spawn inside blocks
        for (let ox = -1; ox <= 1; ox++) {
          for (let oz = -1; oz <= 1; oz++) {
            for (let oy = 1; oy <= 3; oy++) {
              if (this.getBlock(pos.x + ox, oy, pos.z + oz)) {
                this.removeBlock(pos.x + ox, oy, pos.z + oz);
              }
            }
          }
        }
        this.setBlock(pos.chestPos.x, pos.chestPos.y, pos.chestPos.z, 'CHEST', false);
        this.registerChest(pos.chestPos.x, pos.chestPos.y, pos.chestPos.z, false);

        // Place Team Bed
        this.setBlock(pos.bedPos.x, pos.bedPos.y, pos.bedPos.z, pos.bedType, true, pos.team);
      }

      this.createThemedMiddleIsland(0, 0, 0, 11, {}, 'boogie');
      const midChests = [
        { x: 0, y: 1, z: 4 },
        { x: 0, y: 1, z: -4 },
        { x: 4, y: 1, z: 0 },
        { x: -4, y: 1, z: 0 }
      ];
      for (const mc of midChests) {
        this.setBlock(mc.x, mc.y, mc.z, 'CHEST', false);
        this.registerChest(mc.x, mc.y, mc.z, true);
      }
    } else {
      // 1v1 SkyWars
      this.bedStatus = { red: true, blue: true, green: false, yellow: false };

      // Red Island (South)
      this.createSkyWarsIsland(0, 0, 32, 6);
      for (let ox = -1; ox <= 1; ox++) {
        for (let oz = -1; oz <= 1; oz++) {
          for (let oy = 1; oy <= 3; oy++) {
            if (this.getBlock(ox, oy, 32 + oz)) this.removeBlock(ox, oy, 32 + oz);
            if (this.getBlock(ox, oy, -32 + oz)) this.removeBlock(ox, oy, -32 + oz);
          }
        }
      }
      this.setBlock(0, 1, 35, 'CHEST', false);
      this.registerChest(0, 1, 35, false);
      this.setBlock(0, 1, 29, 'BED_RED', true, 'red');

      // Blue Island (North)
      this.createSkyWarsIsland(0, 0, -32, 6);
      this.setBlock(0, 1, -35, 'CHEST', false);
      this.registerChest(0, 1, -35, false);
      this.setBlock(0, 1, -29, 'BED_BLUE', true, 'blue');

      this.createThemedMiddleIsland(0, 0, 0, 10, {}, 'boogie');
      const midChests = [
        { x: 0, y: 1, z: 3 },
        { x: 0, y: 1, z: -3 },
        { x: 3, y: 1, z: 0 },
        { x: -3, y: 1, z: 0 }
      ];
      for (const mc of midChests) {
        this.setBlock(mc.x, mc.y, mc.z, 'CHEST', false);
        this.registerChest(mc.x, mc.y, mc.z, true);
      }
    }
  }

  generatePvPArena() {
    this.bedStatus = { red: false, blue: false, green: false, yellow: false };
    const r = 11;
    for (let x = -r; x <= r; x++) {
      for (let z = -r; z <= r; z++) {
        const isBorder = (Math.abs(x) === r || Math.abs(z) === r);
        const dist = Math.hypot(x, z);

        if (dist < 4) {
          this.setBlock(x, 0, z, (x + z) % 2 === 0 ? 'PURPUR' : 'STONE_BRICK', false);
        } else {
          this.setBlock(x, 0, z, 'STONE_BRICK', false);
        }
        this.setBlock(x, -1, z, 'STONE', false);

        if (isBorder) {
          this.setBlock(x, 1, z, 'STONE_BRICK', false);
          this.setBlock(x, 2, z, 'MOSSY_STONE_BRICK', false);
          if (Math.abs(x) === r && Math.abs(z) === r) {
            this.setBlock(x, 3, z, 'STONE_BRICK', false);
            this.setBlock(x, 4, z, 'GLOWSTONE', false);
          }
        }
      }
    }
    // Midfield spectator / tactical pillars
    const pillars = [
      { x: -6, z: 0 },
      { x: 6, z: 0 }
    ];
    for (const p of pillars) {
      this.setBlock(p.x, 1, p.z, 'STONE_BRICK', false);
      this.setBlock(p.x, 2, p.z, 'GLOWSTONE', false);
    }
  }

  // Generate Multi-Theme Bedwars Floating Island World with Distinct Layouts
  generateWorld(mode = '2teams', mapType = 'boogie') {
    this.mode = mode;
    this.mapType = mapType;

    this.isGenerating = true;

    if (mode === 'school_br' || mapType === 'school') {
      this.generateSchoolMap();
    } else if (mode === 'pvp_1v1' || mapType === 'arena') {
      this.generatePvPArena();
    } else if (mode.startsWith('skywars') || mapType === 'skywars') {
      this.generateSkyWarsMap(mode);
    } else if (mapType === 'castle') {
      this.generateCastleMap(mode);
    } else if (mapType === 'nether') {
      this.generateNetherMap(mode);
    } else if (mapType === 'end') {
      this.generateEndMap(mode);
    } else {
      this.generateBoogieMap(mode);
    }

    this.isGenerating = false;
    this.buildBatchedMeshes();
  }

  // 0. School Battle Royale: Campus Sports Ground & 3-Story Teaching Building
  generateSchoolMap() {
    this.bedStatus = { red: false, blue: false, green: false, yellow: false };

    const minX = -42, maxX = 38;
    const minZ = -36, maxZ = 36;

    // 1. Campus Ground Foundation (Stone base, grass surface, paved paths)
    for (let x = minX; x <= maxX; x++) {
      for (let z = minZ; z <= maxZ; z++) {
        this.setBlock(x, -1, z, 'STONE', false);
        this.setBlock(x, -2, z, 'STONE', false);

        // Ground top block
        const isCentralRoad = (x >= -6 && x <= 6);
        const isPlaza = (x >= 4 && x <= 16 && z >= -8 && z <= 8);
        const isBuildingFootprint = (x >= 6 && x <= 36 && z >= -24 && z <= 24);

        if (isBuildingFootprint) {
          // Inside 1F building floor: polished stone brick
          this.setBlock(x, 0, z, 'STONE_BRICK', false);
        } else if (isCentralRoad || isPlaza) {
          this.setBlock(x, 0, z, (x + z) % 2 === 0 ? 'STONE_BRICK' : 'QUARTZ', false);
        } else {
          this.setBlock(x, 0, z, 'GRASS', false);
        }

        // Surrounding Security Boundary Wall with Lanterns
        const isBorder = (x === minX || x === maxX || z === minZ || z === maxZ);
        if (isBorder) {
          this.setBlock(x, 1, z, 'STONE_BRICK', false);
          this.setBlock(x, 2, z, 'MOSSY_STONE_BRICK', false);
          if ((x % 6 === 0 || z % 6 === 0) || (Math.abs(x) === maxX && Math.abs(z) === maxZ)) {
            this.setBlock(x, 3, z, 'STONE_BRICK', false);
            this.setBlock(x, 4, z, 'GLOWSTONE', false);
          }
        }
      }
    }

    // 2. Playground (West Zone)
    // 2.1 Running Track (Red track with white lane divider)
    const trackMinX = -36, trackMaxX = -10;
    const trackMinZ = -28, trackMaxZ = 28;
    for (let x = trackMinX; x <= trackMaxX; x++) {
      for (let z = trackMinZ; z <= trackMaxZ; z++) {
        const isTrackX = (x <= -32 || x >= -14);
        const isTrackZ = (z <= -24 || z >= 24);
        if (isTrackX || isTrackZ) {
          // Lane divider at x = -34 and x = -12, or z = -26 and z = 26
          const isLaneDivider = (x === -34 || x === -12 || z === -26 || z === 26);
          if (z === 0 && x >= -14 && x <= -10) {
            // Finish line checkerboard
            this.setBlock(x, 0, z, (x % 2 === 0) ? 'WHITE_WOOL' : 'RED_WOOL', false);
          } else if (isLaneDivider) {
            this.setBlock(x, 0, z, 'WHITE_WOOL', false);
          } else {
            this.setBlock(x, 0, z, 'RED_WOOL', false);
          }
        }
      }
    }

    // 2.2 Football Field (Inside running track: X from -32 to -14, Z from -24 to 24)
    const pitchMinX = -32, pitchMaxX = -14;
    const pitchMinZ = -24, pitchMaxZ = 24;
    const midX = -23;
    for (let x = pitchMinX; x <= pitchMaxX; x++) {
      for (let z = pitchMinZ; z <= pitchMaxZ; z++) {
        // Striped grass pattern
        const stripe = Math.floor((z + 24) / 4) % 2 === 0;
        this.setBlock(x, 0, z, stripe ? 'GRASS' : 'GREEN_WOOL', false);

        // Boundary white lines
        const isPitchBorder = (x === pitchMinX || x === pitchMaxX || z === pitchMinZ || z === pitchMaxZ);
        const isCenterLine = (z === 0);
        const dCenter = Math.hypot(x - midX, z - 0);
        const isCenterCircle = (dCenter >= 2.5 && dCenter <= 3.6);
        const isCenterSpot = (x === midX && z === 0);

        // Penalty boxes
        const isNorthBox = (z >= 18 && z <= 24 && (x === -27 || x === -19 || z === 18));
        const isSouthBox = (z <= -18 && z >= -24 && (x === -27 || x === -19 || z === -18));

        if (isPitchBorder || isCenterLine || isCenterCircle || isCenterSpot || isNorthBox || isSouthBox) {
          this.setBlock(x, 0, z, 'WHITE_WOOL', false);
        }
      }
    }

    // 2.3 Football Goals (North and South)
    const goalXMin = -26, goalXMax = -20;
    for (const gz of [24, -24]) {
      const netZ = gz > 0 ? gz + 1 : gz - 1;
      // Posts
      for (let y = 1; y <= 3; y++) {
        this.setBlock(goalXMin, y, gz, 'WHITE_WOOL', false);
        this.setBlock(goalXMax, y, gz, 'WHITE_WOOL', false);
      }
      // Crossbar
      for (let x = goalXMin; x <= goalXMax; x++) {
        this.setBlock(x, 3, gz, 'WHITE_WOOL', false);
      }
      // Net behind
      for (let x = goalXMin; x <= goalXMax; x++) {
        for (let y = 1; y <= 3; y++) {
          this.setBlock(x, y, netZ, 'WHITE_WOOL', false);
        }
      }
    }

    // 2.4 Spectator Grandstand (West wall: X from -41 to -37, Z from -18 to 18)
    for (let z = -18; z <= 18; z++) {
      // Tier 1
      this.setBlock(-37, 1, z, 'QUARTZ', false);
      this.setBlock(-37, 2, z, 'OAK_PLANKS', false);
      // Tier 2
      this.setBlock(-38, 1, z, 'QUARTZ', false);
      this.setBlock(-38, 2, z, 'QUARTZ', false);
      this.setBlock(-38, 3, z, 'OAK_PLANKS', false);
      // Tier 3
      this.setBlock(-39, 1, z, 'QUARTZ', false);
      this.setBlock(-39, 2, z, 'QUARTZ', false);
      this.setBlock(-39, 3, z, 'QUARTZ', false);
      this.setBlock(-39, 4, z, 'OAK_PLANKS', false);
      // Tier 4 aisle
      this.setBlock(-40, 1, z, 'QUARTZ', false);
      this.setBlock(-40, 2, z, 'QUARTZ', false);
      this.setBlock(-40, 3, z, 'QUARTZ', false);
      this.setBlock(-40, 4, z, 'QUARTZ', false);
    }
    // Canopy Support Pillars & Overhead Sunshade
    for (const pz of [-18, -9, 0, 9, 18]) {
      for (let y = 1; y <= 7; y++) {
        this.setBlock(-41, y, pz, 'STONE_BRICK', false);
        this.setBlock(-36, y, pz, 'STONE_BRICK', false);
      }
      this.setBlock(-36, 6, pz, 'GLOWSTONE', false);
    }
    for (let x = -41; x <= -36; x++) {
      for (let z = -18; z <= 18; z++) {
        const stripe = Math.abs(z) % 4 < 2;
        this.setBlock(x, 7, z, stripe ? 'BLUE_WOOL' : 'WHITE_WOOL', false);
      }
    }

    // 2.5 Basketball Half-Court (North corner: X from -36 to -24, Z from 26 to 34)
    for (let x = -36; x <= -24; x++) {
      for (let z = 26; z <= 34; z++) {
        this.setBlock(x, 0, z, 'OAK_PLANKS', false);
      }
    }
    // Basketball Hoop
    for (let y = 1; y <= 4; y++) this.setBlock(-30, y, 34, 'IRON_BLOCK', false);
    for (let hx = -31; hx <= -29; hx++) {
      this.setBlock(hx, 4, 34, 'WHITE_WOOL', false);
      this.setBlock(hx, 5, 34, 'WHITE_WOOL', false);
    }
    this.setBlock(-30, 4, 33, 'ORANGE_WOOL', false);

    // 3. Central Courtyard & School Gate
    // Gate archway at z = -34, x from -3 to 3
    for (let y = 1; y <= 5; y++) {
      this.setBlock(-3, y, -34, 'STONE_BRICK', false);
      this.setBlock(3, y, -34, 'STONE_BRICK', false);
    }
    for (let x = -3; x <= 3; x++) {
      this.setBlock(x, 5, -34, 'STONE_BRICK', false);
    }
    this.setBlock(0, 5, -34, 'GOLD_BLOCK', false);

    // Central Monument / Fountain at (0, 0)
    for (let x = -2; x <= 2; x++) {
      for (let z = -2; z <= 2; z++) {
        const isEdge = (Math.abs(x) === 2 || Math.abs(z) === 2);
        if (isEdge) {
          this.setBlock(x, 1, z, 'STONE_BRICK', false);
        } else {
          this.setBlock(x, 1, z, 'PURPUR', false);
        }
      }
    }
    this.setBlock(0, 2, 0, 'GLOWSTONE', false);

    // Green hedges and lamp posts along courtyard paths
    for (const lz of [-24, -14, 14, 24]) {
      this.setBlock(-5, 1, lz, 'GREEN_WOOL', false);
      this.setBlock(5, 1, lz, 'GREEN_WOOL', false);
      this.setBlock(-5, 2, lz, 'GLOWSTONE', false);
      this.setBlock(5, 2, lz, 'GLOWSTONE', false);
    }

    // 4. Three-Story Teaching Building (East Zone: X: 6 to 36, Z: -24 to 24)
    const bMinX = 6, bMaxX = 36;
    const bMinZ = -24, bMaxZ = 24;

    // 4.1 Floors and Ceilings
    for (let x = bMinX; x <= bMaxX; x++) {
      for (let z = bMinZ; z <= bMaxZ; z++) {
        // Cutout for South stairwell (1F->2F stair and 3F->Rooftop stair): X: 15 to 17, Z: -7 to -3
        const isSouthStairHole = (x >= 15 && x <= 17 && z >= -7 && z <= -3);
        // Cutout for North stairwell (2F->3F stair): X: 15 to 17, Z: 2 to 6
        const isNorthStairHole = (x >= 15 && x <= 17 && z >= 2 && z <= 6);

        // 2F Floor at y = 5: leave South stairwell open for 1F->2F stair
        if (!isSouthStairHole) {
          this.setBlock(x, 5, z, 'STONE_BRICK', false);
        }
        // 3F Floor at y = 10: leave North stairwell open for 2F->3F stair
        if (!isNorthStairHole) {
          this.setBlock(x, 10, z, 'STONE_BRICK', false);
        }
        // Rooftop Floor at y = 15: leave South stairwell open for 3F->Rooftop stair
        if (!isSouthStairHole) {
          this.setBlock(x, 15, z, 'STONE_BRICK', false);
        }
      }
    }

    // 4.2 Exterior Walls with Windows for all 3 stories
    for (let y = 1; y <= 15; y++) {
      const isWindowLevel = (y === 2 || y === 3 || y === 7 || y === 8 || y === 12 || y === 13);
      for (let z = bMinZ; z <= bMaxZ; z++) {
        // West Wall (X = bMinX = 6) - facing courtyard
        const isMainDoor = (z >= -3 && z <= 3 && y <= 3);
        if (!isMainDoor) {
          const isWindow = isWindowLevel && (Math.abs(z) >= 6 && Math.abs(z) <= 22);
          this.setBlock(bMinX, y, z, isWindow ? 'GLASS' : 'STONE_BRICK', false);
        }

        // East Wall (X = bMaxX = 36) - classroom exterior daylight
        const isWindowEast = isWindowLevel && (Math.abs(z) >= 4 && Math.abs(z) <= 21);
        this.setBlock(bMaxX, y, z, isWindowEast ? 'GLASS' : 'QUARTZ', false);
      }

      for (let x = bMinX; x <= bMaxX; x++) {
        // North Wall (Z = bMaxZ = 24)
        const isNorthWindow = isWindowLevel && (x >= 22 && x <= 32);
        this.setBlock(x, y, bMaxZ, isNorthWindow ? 'GLASS' : 'STONE_BRICK', false);

        // South Wall (Z = bMinZ = -24)
        const isSouthWindow = isWindowLevel && (x >= 22 && x <= 32);
        this.setBlock(x, y, bMinZ, isSouthWindow ? 'GLASS' : 'STONE_BRICK', false);
      }
    }

    // Entrance canopy on West side (y = 4, X: 4 to 6, Z: -4 to 4)
    for (let x = 4; x <= 6; x++) {
      for (let z = -4; z <= 4; z++) {
        this.setBlock(x, 4, z, 'QUARTZ', false);
      }
    }

    // 4.3 Interior Partition Walls and Corridor
    // Corridor: X: 14 to 18 (width 5 blocks)
    for (const floorBaseY of [1, 6, 11]) {
      for (let h = 0; h < 4; h++) {
        const y = floorBaseY + h;

        // West corridor wall (X = 13)
        for (let z = bMinZ + 1; z <= bMaxZ - 1; z++) {
          const isDoor = (z >= 10 && z <= 12 && h < 3) || (z >= -12 && z <= -10 && h < 3) || (z >= -2 && z <= 2 && h < 3);
          if (!isDoor) {
            this.setBlock(13, y, z, 'QUARTZ', false);
          }
        }

        // East corridor wall (X = 19)
        for (let z = bMinZ + 1; z <= bMaxZ - 1; z++) {
          const isDoor = (z >= 6 && z <= 8 && h < 3) || (z >= -8 && z <= -6 && h < 3);
          if (!isDoor) {
            this.setBlock(19, y, z, 'QUARTZ', false);
          }
        }

        // Classroom divider wall (Z = 0, X from 20 to 35)
        for (let x = 20; x <= 35; x++) {
          this.setBlock(x, y, 0, 'STONE_BRICK', false);
        }
      }

      // Ceiling glowstone lighting in corridors
      for (const gz of [-18, -9, 9, 18]) {
        this.setBlock(16, floorBaseY + 3, gz, 'GLOWSTONE', false);
      }
    }

    // 4.4 Furnish Classrooms for all 3 floors
    for (const floorBaseY of [1, 6, 11]) {
      // Blackboards on front dividing wall
      for (let x = 23; x <= 31; x++) {
        this.setBlock(x, floorBaseY + 1, 1, 'BLACK_WOOL', false);
        this.setBlock(x, floorBaseY + 2, 1, 'BLACK_WOOL', false);
        this.setBlock(x, floorBaseY + 1, -1, 'BLACK_WOOL', false);
        this.setBlock(x, floorBaseY + 2, -1, 'BLACK_WOOL', false);
      }

      // Teacher's Podiums
      for (let x = 22; x <= 24; x++) {
        this.setBlock(x, floorBaseY, 3, 'OAK_PLANKS', false);
        this.setBlock(x, floorBaseY, -3, 'OAK_PLANKS', false);
      }

      // Student Desks & Chairs
      for (const dz of [7, 12, 17]) {
        for (const dx of [23, 27, 31]) {
          this.setBlock(dx, floorBaseY, dz, 'OAK_PLANKS', false);
          this.setBlock(dx, floorBaseY, -dz, 'OAK_PLANKS', false);
        }
      }

      // Additional room specific props:
      if (floorBaseY === 6) {
        // 2F Science & Computer Labs: Bookshelves and tables
        for (let x = 22; x <= 33; x += 2) {
          this.setBlock(x, floorBaseY, 21, 'PURPUR', false);
          this.setBlock(x, floorBaseY, -21, 'PURPUR', false);
        }
      } else if (floorBaseY === 11) {
        // 3F Art & Music: Color easels
        this.setBlock(25, floorBaseY, 15, 'RED_WOOL', false);
        this.setBlock(29, floorBaseY, 15, 'YELLOW_WOOL', false);
        this.setBlock(25, floorBaseY, -15, 'BLUE_WOOL', false);
        this.setBlock(29, floorBaseY, -15, 'PURPLE_WOOL', false);
      }
    }

    // 4.5 Smooth Walkable Staircases Connecting 1F -> 2F -> 3F -> Rooftop
    // 1F to 2F Stair (South Wing): X = 15 to 17, climbing from Z = -7 to Z = -3
    for (let x = 15; x <= 17; x++) {
      this.setBlock(x, 1, -7, 'STONE_BRICK', false);
      this.setBlock(x, 2, -6, 'STONE_BRICK', false);
      this.setBlock(x, 3, -5, 'STONE_BRICK', false);
      this.setBlock(x, 4, -4, 'STONE_BRICK', false);
      this.setBlock(x, 5, -3, 'STONE_BRICK', false);
    }
    // 2F to 3F Stair (North Wing - completely separate): X = 15 to 17, climbing from Z = 2 to Z = 6
    for (let x = 15; x <= 17; x++) {
      this.setBlock(x, 6, 2, 'STONE_BRICK', false);
      this.setBlock(x, 7, 3, 'STONE_BRICK', false);
      this.setBlock(x, 8, 4, 'STONE_BRICK', false);
      this.setBlock(x, 9, 5, 'STONE_BRICK', false);
      this.setBlock(x, 10, 6, 'STONE_BRICK', false);
    }
    // 3F to Rooftop Stair (South Wing): X = 15 to 17, climbing from Z = -7 to Z = -3
    for (let x = 15; x <= 17; x++) {
      this.setBlock(x, 11, -7, 'STONE_BRICK', false);
      this.setBlock(x, 12, -6, 'STONE_BRICK', false);
      this.setBlock(x, 13, -5, 'STONE_BRICK', false);
      this.setBlock(x, 14, -4, 'STONE_BRICK', false);
      this.setBlock(x, 15, -3, 'STONE_BRICK', false);
    }

    // 4.6 Rooftop (天台: y = 15, Parapet Wall, Penthouse, Water Tank, HVAC)
    // Parapet Wall around the rooftop perimeter (height y = 16 and 17)
    for (let z = bMinZ; z <= bMaxZ; z++) {
      this.setBlock(bMinX, 16, z, 'STONE_BRICK', false);
      this.setBlock(bMinX, 17, z, 'IRON_BLOCK', false);
      this.setBlock(bMaxX, 16, z, 'STONE_BRICK', false);
      this.setBlock(bMaxX, 17, z, 'IRON_BLOCK', false);
    }
    for (let x = bMinX; x <= bMaxX; x++) {
      this.setBlock(x, 16, bMinZ, 'STONE_BRICK', false);
      this.setBlock(x, 17, bMinZ, 'IRON_BLOCK', false);
      this.setBlock(x, 16, bMaxZ, 'STONE_BRICK', false);
      this.setBlock(x, 17, bMaxZ, 'IRON_BLOCK', false);
    }

    // Staircase Penthouse Exit Shelter (X: 14 to 18, Z: -8 to 0, y: 16 to 18, roof y = 19)
    for (let x = 14; x <= 18; x++) {
      for (let z = -8; z <= 0; z++) {
        const isWall = (x === 14 || x === 18 || z === -8 || z === 0);
        // Wide 3-block door at Z = 0 (X = 15, 16, 17)
        const isDoor = (z === 0 && x >= 15 && x <= 17);
        if (isWall && !isDoor) {
          for (let y = 16; y <= 18; y++) {
            this.setBlock(x, y, z, 'STONE_BRICK', false);
          }
        }
        this.setBlock(x, 19, z, 'QUARTZ', false);
      }
    }
    this.setBlock(16, 18, -4, 'GLOWSTONE', false);

    // Water Tower (X = 30, Z = 16, y: 16 to 19)
    for (let x = 28; x <= 32; x++) {
      for (let z = 14; z <= 18; z++) {
        for (let y = 16; y <= 19; y++) {
          this.setBlock(x, y, z, 'IRON_BLOCK', false);
        }
      }
    }
    this.setBlock(30, 20, 16, 'RED_WOOL', false);

    // HVAC Units (X = 10, Z = -16, y = 16)
    for (let x = 9; x <= 11; x++) {
      for (let z = -17; z <= -15; z++) {
        this.setBlock(x, 16, z, 'IRON_BLOCK', false);
      }
    }

    // Solar panels (X: 25 to 33, Z: -20 to -14)
    for (let x = 25; x <= 33; x++) {
      for (let z = -20; z <= -14; z++) {
        this.setBlock(x, 16, z, 'OBSIDIAN', false);
      }
    }

    // 5. Probabilistic Chest Placement Across Campus (~25 locations, ~85% spawn chance)
    const candidateChests = [
      { x: -23, y: 1, z: 0 },    // Playground Center
      { x: -23, y: 1, z: 23 },   // North Goal
      { x: -23, y: 1, z: -23 },  // South Goal
      { x: -38, y: 3, z: 6 },    // Bleachers Tier 2 North
      { x: -38, y: 3, z: -6 },   // Bleachers Tier 2 South
      { x: -30, y: 1, z: 28 },   // Basketball Court
      { x: -4, y: 1, z: -28 },   // Campus Gate House
      { x: 0, y: 1, z: 4 },      // Courtyard Fountain
      { x: -2, y: 1, z: 20 },    // Courtyard North Garden
      { x: 10, y: 1, z: 0 },     // 1F Main Entrance Lobby
      { x: 22, y: 1, z: 5 },     // 1F Classroom 101 Podium
      { x: 33, y: 1, z: 20 },    // 1F Classroom 101 Back Shelf
      { x: 22, y: 1, z: -5 },    // 1F Classroom 102 Podium
      { x: 33, y: 1, z: -20 },   // 1F Classroom 102 Back Shelf
      { x: 9, y: 1, z: -12 },    // 1F Infirmary
      { x: 28, y: 6, z: 16 },    // 2F Science Lab 201
      { x: 28, y: 6, z: -16 },   // 2F Computer Lab 202
      { x: 9, y: 6, z: 14 },     // 2F Library Bookshelf
      { x: 16, y: 6, z: 18 },    // 2F Corridor Corner
      { x: 28, y: 11, z: 16 },   // 3F Art Room 301
      { x: 28, y: 11, z: -16 },  // 3F Senior Classroom 302
      { x: 16, y: 11, z: -18 },  // 3F Corridor Locker
      { x: 27, y: 16, z: 14 },   // Rooftop Water Tower base
      { x: 10, y: 16, z: -14 },  // Rooftop HVAC Corner
      { x: 24, y: 16, z: -10 }   // Rooftop Observation Deck
    ];

    let chestCount = 0;
    for (const c of candidateChests) {
      if (Math.random() < 0.85 || chestCount < 18) {
        this.setBlock(c.x, c.y, c.z, 'CHEST', false);
        this.registerChest(c.x, c.y, c.z, false, true);
        chestCount++;
      }
    }
  }

  // 1. Boogie Islands: Spacious Floating Circular Islands (Scaled Up Authentic Bedwars Map)
  generateBoogieMap(mode) {
    // 1. Red Base around (0, 0, 56), Radius 12
    this.createThemedIsland(0, 0, 56, 12, 'GRASS', 'DIRT', 'STONE');
    this.setBlock(0, 1, 63, 'BED_RED', true, 'red');
    this.setBlock(0, 1, 62, 'BED_RED', true, 'red');
    this.setBlock(0, 0, 47, 'IRON_BLOCK', false);

    // 2. Blue Base around (0, 0, -56), Radius 12
    this.createThemedIsland(0, 0, -56, 12, 'GRASS', 'DIRT', 'STONE');
    this.setBlock(0, 1, -63, 'BED_BLUE', true, 'blue');
    this.setBlock(0, 1, -62, 'BED_BLUE', true, 'blue');
    this.setBlock(0, 0, -47, 'IRON_BLOCK', false);

    // 3. Middle Emerald Grand Arena around (0, 0, 0), Radius 14
    this.createThemedMiddleIsland(0, 0, 0, 14, {}, 'boogie');

    if (mode === '4teams') {
      this.createThemedIsland(56, 0, 0, 12, 'GRASS', 'DIRT', 'STONE');
      this.setBlock(63, 1, 0, 'BED_GREEN', true, 'green');
      this.setBlock(62, 1, 0, 'BED_GREEN', true, 'green');
      this.setBlock(47, 0, 0, 'IRON_BLOCK', false);

      this.createThemedIsland(-56, 0, 0, 12, 'GRASS', 'DIRT', 'STONE');
      this.setBlock(-63, 1, 0, 'BED_YELLOW', true, 'yellow');
      this.setBlock(-62, 1, 0, 'BED_YELLOW', true, 'yellow');
      this.setBlock(-47, 0, 0, 'IRON_BLOCK', false);

      // 4 Diamond Islands (Radius 7)
      this.createThemedDiamondIsland(38, 0, 38, 7, {}, 'boogie');
      this.createThemedDiamondIsland(38, 0, -38, 7, {}, 'boogie');
      this.createThemedDiamondIsland(-38, 0, 38, 7, {}, 'boogie');
      this.createThemedDiamondIsland(-38, 0, -38, 7, {}, 'boogie');
      this.bedStatus = { red: true, blue: true, green: true, yellow: true };
    } else {
      // 2-Team Diamond Islands (Radius 7)
      this.createThemedDiamondIsland(42, 0, 0, 7, {}, 'boogie');
      this.createThemedDiamondIsland(-42, 0, 0, 7, {}, 'boogie');
      this.bedStatus = { red: true, blue: true, green: false, yellow: false };
    }
  }

  // 2. Castle Siege: Fortified Square Citadels, High Walls, Corner Towers & 2-Tier Keep
  generateCastleMap(mode) {
    const theme = {
      baseTop: 'STONE_BRICK', baseSub: 'STONE_BRICK', baseBottom: 'STONE',
      midTop: 'STONE_BRICK', midSub: 'MOSSY_STONE_BRICK', midBottom: 'STONE',
      diaTop: 'STONE_BRICK', diaSub: 'STONE_BRICK', diaBottom: 'STONE'
    };

    // Red Base: 25x25 Stone Castle Keep at (0, 0, 56)
    this.createSquareCastleBase(0, 0, 56, 'red');
    // Blue Base: 25x25 Stone Castle Keep at (0, 0, -56)
    this.createSquareCastleBase(0, 0, -56, 'blue');

    // Middle Castle Citadel: 29x29 Grand Fortress Keep at (0, 0, 0)
    this.createCastleCitadelKeep(0, 0, 0);

    if (mode === '4teams') {
      this.createSquareCastleBase(56, 0, 0, 'green');
      this.createSquareCastleBase(-56, 0, 0, 'yellow');
      this.createThemedDiamondIsland(38, 0, 38, 7, theme, 'castle');
      this.createThemedDiamondIsland(38, 0, -38, 7, theme, 'castle');
      this.createThemedDiamondIsland(-38, 0, 38, 7, theme, 'castle');
      this.createThemedDiamondIsland(-38, 0, -38, 7, theme, 'castle');
      this.bedStatus = { red: true, blue: true, green: true, yellow: true };
    } else {
      this.createThemedDiamondIsland(42, 0, 0, 7, theme, 'castle');
      this.createThemedDiamondIsland(-42, 0, 0, 7, theme, 'castle');
      this.bedStatus = { red: true, blue: true, green: false, yellow: false };
    }
  }

  // 3. Nether Fortress: Thrusting Spiked Peninsulas, Short Rapid Bridging & Altar
  generateNetherMap(mode) {
    const theme = {
      baseTop: 'NETHERRACK', baseSub: 'NETHERRACK', baseBottom: 'NETHER_BRICK',
      midTop: 'NETHER_BRICK', midSub: 'NETHERRACK', midBottom: 'OBSIDIAN',
      diaTop: 'NETHERRACK', diaSub: 'NETHER_BRICK', diaBottom: 'OBSIDIAN'
    };

    // Thrusting Spiked Bases at (0, 0, 56) and (0, 0, -56)
    this.createThrustingNetherBase(0, 0, 56, 'red');
    this.createThrustingNetherBase(0, 0, -56, 'blue');

    // Central Nether Sacrificial Altar with Obsidian Towers (Radius 14)
    this.createNetherAltarKeep(0, 0, 0);

    if (mode === '4teams') {
      this.createThrustingNetherBase(56, 0, 0, 'green');
      this.createThrustingNetherBase(-56, 0, 0, 'yellow');
      this.createThemedDiamondIsland(38, 0, 38, 7, theme, 'nether');
      this.createThemedDiamondIsland(38, 0, -38, 7, theme, 'nether');
      this.createThemedDiamondIsland(-38, 0, 38, 7, theme, 'nether');
      this.createThemedDiamondIsland(-38, 0, -38, 7, theme, 'nether');
      this.bedStatus = { red: true, blue: true, green: true, yellow: true };
    } else {
      this.createThemedDiamondIsland(42, 0, 0, 7, theme, 'nether');
      this.createThemedDiamondIsland(-42, 0, 0, 7, theme, 'nether');
      this.bedStatus = { red: true, blue: true, green: false, yellow: false };
    }
  }

  // 4. End Realm: Triple-Shard Asteroid Clusters & Grand End City Spire
  generateEndMap(mode) {
    const theme = {
      baseTop: 'END_STONE', baseSub: 'END_STONE', baseBottom: 'OBSIDIAN',
      midTop: 'END_STONE', midSub: 'PURPUR', midBottom: 'OBSIDIAN',
      diaTop: 'END_STONE', diaSub: 'PURPUR', diaBottom: 'OBSIDIAN'
    };

    // Triple-Shard Asteroid Clusters at (0, 0, 56) and (0, 0, -56)
    this.createAsteroidClusterEndBase(0, 0, 56, 'red');
    this.createAsteroidClusterEndBase(0, 0, -56, 'blue');

    // Central Floating End City with y+8 Obsidian Monolith (Radius 14)
    this.createEndCitySpireKeep(0, 0, 0);

    if (mode === '4teams') {
      this.createAsteroidClusterEndBase(56, 0, 0, 'green');
      this.createAsteroidClusterEndBase(-56, 0, 0, 'yellow');
      this.createThemedDiamondIsland(38, 0, 38, 7, theme, 'end');
      this.createThemedDiamondIsland(38, 0, -38, 7, theme, 'end');
      this.createThemedDiamondIsland(-38, 0, 38, 7, theme, 'end');
      this.createThemedDiamondIsland(-38, 0, -38, 7, theme, 'end');
      this.bedStatus = { red: true, blue: true, green: true, yellow: true };
    } else {
      this.createThemedDiamondIsland(42, 0, 0, 7, theme, 'end');
      this.createThemedDiamondIsland(-42, 0, 0, 7, theme, 'end');
      this.bedStatus = { red: true, blue: true, green: false, yellow: false };
    }
  }

  // --- Specialized Map Architecture Generators ---

  // Castle Square Fortress Keep (17x17)
  createSquareCastleBase(cx, cy, cz, team) {
    const half = 10;
    for (let x = -half; x <= half; x++) {
      for (let z = -half; z <= half; z++) {
        const wx = cx + x;
        const wz = cz + z;
        this.setBlock(wx, cy, wz, 'STONE_BRICK', false);
        // Foundation
        for (let d = 1; d <= 4; d++) {
          this.setBlock(wx, cy - d, wz, 'STONE', false);
        }
      }
    }

    // Standard Team Bed and Generator
    if (team === 'red') {
      this.setBlock(0, 1, 63, 'BED_RED', true, 'red');
      this.setBlock(0, 1, 62, 'BED_RED', true, 'red');
      this.setBlock(0, 0, 47, 'IRON_BLOCK', false);
    } else if (team === 'blue') {
      this.setBlock(0, 1, -63, 'BED_BLUE', true, 'blue');
      this.setBlock(0, 1, -62, 'BED_BLUE', true, 'blue');
      this.setBlock(0, 0, -47, 'IRON_BLOCK', false);
    } else if (team === 'green') {
      this.setBlock(63, 1, 0, 'BED_GREEN', true, 'green');
      this.setBlock(62, 1, 0, 'BED_GREEN', true, 'green');
      this.setBlock(47, 0, 0, 'IRON_BLOCK', false);
    } else if (team === 'yellow') {
      this.setBlock(-63, 1, 0, 'BED_YELLOW', true, 'yellow');
      this.setBlock(-62, 1, 0, 'BED_YELLOW', true, 'yellow');
      this.setBlock(-47, 0, 0, 'IRON_BLOCK', false);
    }

    // 4 Corner Towers (y+4 high)
    const corners = [[cx - 9, cz - 9], [cx + 9, cz - 9], [cx - 9, cz + 9], [cx + 9, cz + 9]];
    corners.forEach(([tx, tz]) => {
      for (let y = 1; y <= 4; y++) {
        this.setBlock(tx, cy + y, tz, 'STONE_BRICK', false);
      }
      this.setBlock(tx, cy + 5, tz, 'MOSSY_STONE_BRICK', false);
    });

    // Crenellated Outer Defense Walls (y+2)
    for (let i = -6; i <= 6; i += 2) {
      if (Math.abs(cz) > 20) {
        // Back wall
        this.setBlock(cx + i, cy + 1, cz + (cz > 0 ? 8 : -8), 'STONE_BRICK', false);
        this.setBlock(cx + i, cy + 2, cz + (cz > 0 ? 8 : -8), 'STONE_BRICK', false);
        // Side walls
        this.setBlock(cx - 8, cy + 1, cz + i, 'STONE_BRICK', false);
        this.setBlock(cx + 8, cy + 1, cz + i, 'STONE_BRICK', false);
      } else {
        this.setBlock(cx + (cx > 0 ? 8 : -8), cy + 1, cz + i, 'STONE_BRICK', false);
      }
    }

    // Back Archery Watchtower Platform (y+3)
    const backZ = cz + (cz > 0 ? 5 : -5);
    for (let x = -2; x <= 2; x++) {
      for (let y = 1; y <= 3; y++) {
        this.setBlock(cx + x, cy + y, backZ, 'STONE_BRICK', false);
      }
    }
  }

  // Castle Citadel Keep (Middle 18x18 with 4 massive y+7 towers and walkable ramparts)
  createCastleCitadelKeep(cx, cy, cz) {
    const half = 9;
    for (let x = -half; x <= half; x++) {
      for (let z = -half; z <= half; z++) {
        const dist = Math.hypot(x, z);
        if (dist <= 9.2) {
          this.setBlock(cx + x, cy, cz + z, 'STONE_BRICK', false);
          for (let d = 1; d <= 3; d++) {
            this.setBlock(cx + x, cy - d, cz + z, 'STONE', false);
          }
        }
      }
    }

    // Emerald generators inside keep courtyard
    this.setBlock(cx, cy + 1, cz + 4, 'EMERALD_BLOCK', false);
    this.setBlock(cx, cy + 1, cz - 4, 'EMERALD_BLOCK', false);

    // 4 Giant Corner Watchtowers (y+7 high)
    const towers = [[-5, -5], [5, -5], [-5, 5], [5, 5]];
    towers.forEach(([tx, tz]) => {
      for (let y = 1; y <= 6; y++) {
        this.setBlock(cx + tx, cy + y, cz + tz, 'STONE_BRICK', false);
        this.setBlock(cx + tx + 1, cy + y, cz + tz, 'STONE_BRICK', false);
      }
      this.setBlock(cx + tx, cy + 7, cz + tz, 'MOSSY_STONE_BRICK', false);
      this.setBlock(cx + tx + 1, cy + 7, cz + tz, 'MOSSY_STONE_BRICK', false);
    });

    // Walkable High-Ground Rampart Bridges (y+5) connecting towers
    for (let i = -4; i <= 4; i++) {
      this.setBlock(cx + i, cy + 5, cz - 5, 'OAK_PLANKS', false);
      this.setBlock(cx + i, cy + 5, cz + 5, 'OAK_PLANKS', false);
      this.setBlock(cx - 5, cy + 5, cz + i, 'OAK_PLANKS', false);
      this.setBlock(cx + 5, cy + 5, cz + i, 'OAK_PLANKS', false);
    }
  }

  // Nether Thrusting Spiked Peninsula Base (extends forward to z=24, shortening bridge gap)
  createThrustingNetherBase(cx, cy, cz, team) {
    const isZAxis = Math.abs(cz) > 20;

    if (isZAxis) {
      const zDir = cz > 0 ? 1 : -1;
      const startZ = cz + zDir * 7;
      const endZ = cz - zDir * 14; // extends 14 blocks forward towards mid!

      for (let z = Math.min(startZ, endZ); z <= Math.max(startZ, endZ); z++) {
        // Tapering width towards front
        const forwardProgress = (cz - z) * zDir;
        const width = forwardProgress > 6 ? 4 : 7;
        for (let x = -width; x <= width; x++) {
          this.setBlock(cx + x, cy, z, 'NETHERRACK', false);
          this.setBlock(cx + x, cy - 1, z, 'NETHER_BRICK', false);
          if (Math.abs(x) >= width - 1) {
            this.setBlock(cx + x, cy - 2, z, 'OBSIDIAN', false);
          }
        }
      }
    } else {
      // 4-team Green/Yellow X-axis
      const xDir = cx > 0 ? 1 : -1;
      const startX = cx + xDir * 7;
      const endX = cx - xDir * 14;
      for (let x = Math.min(startX, endX); x <= Math.max(startX, endX); x++) {
        const forwardProgress = (cx - x) * xDir;
        const width = forwardProgress > 6 ? 4 : 7;
        for (let z = -width; z <= width; z++) {
          this.setBlock(x, cy, cz + z, 'NETHERRACK', false);
          this.setBlock(x, cy - 1, cz + z, 'NETHER_BRICK', false);
        }
      }
    }

    // Standard Team Bed and Generator
    if (team === 'red') {
      this.setBlock(0, 1, 63, 'BED_RED', true, 'red');
      this.setBlock(0, 1, 62, 'BED_RED', true, 'red');
      this.setBlock(0, 0, 47, 'IRON_BLOCK', false);
    } else if (team === 'blue') {
      this.setBlock(0, 1, -63, 'BED_BLUE', true, 'blue');
      this.setBlock(0, 1, -62, 'BED_BLUE', true, 'blue');
      this.setBlock(0, 0, -47, 'IRON_BLOCK', false);
    } else if (team === 'green') {
      this.setBlock(63, 1, 0, 'BED_GREEN', true, 'green');
      this.setBlock(62, 1, 0, 'BED_GREEN', true, 'green');
      this.setBlock(47, 0, 0, 'IRON_BLOCK', false);
    } else if (team === 'yellow') {
      this.setBlock(-63, 1, 0, 'BED_YELLOW', true, 'yellow');
      this.setBlock(-62, 1, 0, 'BED_YELLOW', true, 'yellow');
      this.setBlock(-47, 0, 0, 'IRON_BLOCK', false);
    }

    // Nether Glowstone Lantern Pillars
    const pillars = [[cx - 4, cz - 4], [cx + 4, cz - 4], [cx - 4, cz + 4], [cx + 4, cz + 4]];
    pillars.forEach(([px, pz]) => {
      this.setBlock(px, cy + 1, pz, 'NETHER_BRICK', false);
      this.setBlock(px, cy + 2, pz, 'GLOWSTONE', false);
    });
  }

  // Nether Sacrificial Altar (Stepped 4-tier Pyramid with Obsidian Spires)
  createNetherAltarKeep(cx, cy, cz) {
    // 4-tier Stepped Pyramid
    for (let r = 8; r >= 2; r -= 2) {
      const stepY = (8 - r) / 2;
      for (let x = -r; x <= r; x++) {
        for (let z = -r; z <= r; z++) {
          this.setBlock(cx + x, cy + stepY, cz + z, 'NETHER_BRICK', false);
        }
      }
    }

    // Emerald generators on the Altar
    this.setBlock(cx, cy + 3, cz + 2, 'EMERALD_BLOCK', false);
    this.setBlock(cx, cy + 3, cz - 2, 'EMERALD_BLOCK', false);

    // 4 Obsidian Spires with Glowstone Beacons (y+6)
    const spires = [[-5, -5], [5, -5], [-5, 5], [5, 5]];
    spires.forEach(([sx, sz]) => {
      for (let y = 1; y <= 5; y++) {
        this.setBlock(cx + sx, cy + y, cz + sz, 'OBSIDIAN', false);
      }
      this.setBlock(cx + sx, cy + 6, cz + sz, 'GLOWSTONE', false);
    });
  }

  // End Realm: Triple-Shard Asteroid Cluster Base
  createAsteroidClusterEndBase(cx, cy, cz, team) {
    // 1. Central Oval Asteroid (housing Bed & Villager)
    for (let x = -7; x <= 7; x++) {
      for (let z = -7; z <= 7; z++) {
        const d = (x * x) / 49 + (z * z) / 49;
        if (d <= 1.0) {
          this.setBlock(cx + x, cy, cz + z, 'END_STONE', false);
          this.setBlock(cx + x, cy - 1, cz + z, 'OBSIDIAN', false);
        }
      }
    }

    // 2. Generator Shard Satellite (housing Iron/Gold Gen)
    const isZAxis = Math.abs(cz) > 20;
    const genOffsetX = !isZAxis ? (cx > 0 ? -9 : 9) : 0;
    const genOffsetZ = isZAxis ? (cz > 0 ? -9 : 9) : 0;
    for (let x = -4; x <= 4; x++) {
      for (let z = -4; z <= 4; z++) {
        if (x * x + z * z <= 16) {
          this.setBlock(cx + genOffsetX + x, cy, cz + genOffsetZ + z, 'END_STONE', false);
          this.setBlock(cx + genOffsetX + x, cy - 1, cz + genOffsetZ + z, 'PURPUR', false);
        }
      }
    }

    // Stepping stones connecting shards
    if (isZAxis) {
      this.setBlock(cx, cy, cz + (genOffsetZ > 0 ? 5 : -5), 'PURPUR', false);
    } else {
      this.setBlock(cx + (genOffsetX > 0 ? 5 : -5), cy, cz, 'PURPUR', false);
    }

    // Standard Team Bed and Generator
    if (team === 'red') {
      this.setBlock(0, 1, 63, 'BED_RED', true, 'red');
      this.setBlock(0, 1, 62, 'BED_RED', true, 'red');
      this.setBlock(0, 0, 47, 'IRON_BLOCK', false);
    } else if (team === 'blue') {
      this.setBlock(0, 1, -63, 'BED_BLUE', true, 'blue');
      this.setBlock(0, 1, -62, 'BED_BLUE', true, 'blue');
      this.setBlock(0, 0, -47, 'IRON_BLOCK', false);
    } else if (team === 'green') {
      this.setBlock(63, 1, 0, 'BED_GREEN', true, 'green');
      this.setBlock(62, 1, 0, 'BED_GREEN', true, 'green');
      this.setBlock(47, 0, 0, 'IRON_BLOCK', false);
    } else if (team === 'yellow') {
      this.setBlock(-63, 1, 0, 'BED_YELLOW', true, 'yellow');
      this.setBlock(-62, 1, 0, 'BED_YELLOW', true, 'yellow');
      this.setBlock(-47, 0, 0, 'IRON_BLOCK', false);
    }

    // Purpur & Obsidian Obelisks on perimeter
    this.setBlock(cx - 5, cy + 1, cz - 4, 'PURPUR', false);
    this.setBlock(cx - 5, cy + 2, cz - 4, 'OBSIDIAN', false);
    this.setBlock(cx + 5, cy + 1, cz - 4, 'PURPUR', false);
    this.setBlock(cx + 5, cy + 2, cz - 4, 'OBSIDIAN', false);
  }

  // End City Spire Keep with y+8 Obsidian Monolith
  createEndCitySpireKeep(cx, cy, cz) {
    for (let x = -8; x <= 8; x++) {
      for (let z = -8; z <= 8; z++) {
        const dist = Math.hypot(x, z);
        if (dist <= 8.5) {
          this.setBlock(cx + x, cy, cz + z, 'END_STONE', false);
          this.setBlock(cx + x, cy - 1, cz + z, 'PURPUR', false);
          this.setBlock(cx + x, cy - 2, cz + z, 'OBSIDIAN', false);
        }
      }
    }

    // Emerald generators on Floating Star Platforms
    this.setBlock(cx, cy + 2, cz + 4, 'EMERALD_BLOCK', false);
    this.setBlock(cx, cy + 2, cz - 4, 'EMERALD_BLOCK', false);

    // Colossal Central Obsidian Monolith (y+8 high!)
    for (let y = 1; y <= 8; y++) {
      this.setBlock(cx, cy + y, cz, 'OBSIDIAN', false);
      this.setBlock(cx + 1, cy + y, cz, 'OBSIDIAN', false);
      this.setBlock(cx, cy + y, cz + 1, 'OBSIDIAN', false);
      this.setBlock(cx + 1, cy + y, cz + 1, 'OBSIDIAN', false);
    }

    // 4 Floating Purpur Corner Spires
    const corners = [[-5, -5], [5, -5], [-5, 5], [5, 5]];
    corners.forEach(([tx, tz]) => {
      for (let y = 1; y <= 5; y++) {
        this.setBlock(cx + tx, cy + y, cz + tz, 'PURPUR', false);
      }
      this.setBlock(cx + tx, cy + 6, cz + tz, 'OBSIDIAN', false);
    });
  }

  // Floating circular island generator with customized theme blocks & stalactite base
  createThemedIsland(cx, cy, cz, radius, topBlock = 'GRASS', subBlock = 'DIRT', bottomBlock = 'STONE') {
    topBlock = topBlock || 'GRASS';
    subBlock = subBlock || 'DIRT';
    bottomBlock = bottomBlock || 'STONE';

    // 1. Solid surface layer at cy
    for (let x = -radius; x <= radius; x++) {
      for (let z = -radius; z <= radius; z++) {
        if (x * x + z * z <= radius * radius) {
          this.setBlock(cx + x, cy, cz + z, topBlock, false);
        }
      }
    }

    // 2. Solid sub-surface layer at cy - 1 to cy - 2
    for (let y = 1; y <= 2; y++) {
      const r = radius - 0.5;
      for (let x = -radius; x <= radius; x++) {
        for (let z = -radius; z <= radius; z++) {
          if (x * x + z * z <= r * r) {
            this.setBlock(cx + x, cy - y, cz + z, subBlock, false);
          }
        }
      }
    }

    // 3. Inverted cone stalactite base down to bottom (optimized outer crust)
    const depth = Math.max(3, Math.min(6, Math.floor(radius * 0.6)));
    for (let y = 3; y <= depth; y++) {
      const r = Math.max(1.0, radius * (1.0 - (y - 2) / (depth - 1)));
      const innerR = Math.max(0, r - 1.4);
      for (let x = -radius; x <= radius; x++) {
        for (let z = -radius; z <= radius; z++) {
          const d2 = x * x + z * z;
          if (d2 <= r * r && (d2 >= innerR * innerR || y === depth || y === 3)) {
            this.setBlock(cx + x, cy - y, cz + z, bottomBlock, false);
          }
        }
      }
    }
  }

  // Floating middle emerald island with theme support and grand center pavilion
  createThemedMiddleIsland(cx, cy, cz, radius = 14, theme = {}, mapType = 'boogie') {
    const top = theme.midTop || 'GRASS';
    const sub = theme.midSub || 'DIRT';
    const bottom = theme.midBottom || 'STONE';

    this.createThemedIsland(cx, cy, cz, radius, top, sub, bottom);

    // 4 Emerald Generator pedestals (7 blocks away in 4 cardinal directions)
    this.setBlock(cx, cy + 1, cz + 7, 'EMERALD_BLOCK', false);
    this.setBlock(cx, cy + 1, cz - 7, 'EMERALD_BLOCK', false);
    this.setBlock(cx + 7, cy + 1, cz, 'EMERALD_BLOCK', false);
    this.setBlock(cx - 7, cy + 1, cz, 'EMERALD_BLOCK', false);

    // Grand Gazebo Pavilion structure
    const pillars = [[-5, -5], [5, -5], [-5, 5], [5, 5]];
    pillars.forEach(([px, pz]) => {
      for (let y = 1; y <= 4; y++) {
        this.setBlock(cx + px, cy + y, cz + pz, 'OAK_WOOD', false);
      }
    });

    // 7x7 Wooden Roof
    for (let rx = -3; rx <= 3; rx++) {
      for (let rz = -3; rz <= 3; rz++) {
        this.setBlock(cx + rx, cy + 5, cz + rz, 'OAK_PLANKS', false);
      }
    }

    // Center Gold trophy monument
    this.setBlock(cx, cy + 1, cz, 'GOLD_BLOCK', false);
    this.setBlock(cx, cy + 2, cz, 'GLOWSTONE', false);
  }

  createThemedDiamondIsland(cx, cy, cz, radius = 7, theme = {}, mapType = 'boogie') {
    const top = theme.diaTop || 'GRASS';
    const sub = theme.diaSub || 'DIRT';
    const bottom = theme.diaBottom || 'STONE';
    this.createThemedIsland(cx, cy, cz, radius, top, sub, bottom);

    // Elevated Central Diamond Generator pedestal
    this.setBlock(cx, cy + 1, cz, 'DIAMOND_BLOCK', false);

    // 4 Corner Decorative Watchposts
    const posts = [[-4, -4], [4, -4], [-4, 4], [4, 4]];
    posts.forEach(([px, pz]) => {
      let bType = 'OAK_WOOD';
      if (mapType === 'castle') bType = 'STONE_BRICK';
      else if (mapType === 'nether') bType = 'NETHER_BRICK';
      else if (mapType === 'end') bType = 'PURPUR';
      this.setBlock(cx + px, cy + 1, cz + pz, bType, false);
      this.setBlock(cx + px, cy + 2, cz + pz, bType, false);
    });
  }

  createIsland(cx, cy, cz, radius, team) {
    this.createThemedIsland(cx, cy, cz, radius, 'GRASS', 'DIRT', 'STONE');
  }

  createMiddleIsland(cx, cy, cz, radius) {
    this.createThemedMiddleIsland(cx, cy, cz, radius, {}, 'boogie');
  }

  createDiamondIsland(cx, cy, cz, radius) {
    this.createThemedDiamondIsland(cx, cy, cz, radius, {}, 'boogie');
  }

  // Raycast from camera origin to find targeted block and exact face normal
  raycast(origin, direction, maxDistance = 5) {
    let px = origin.x;
    let py = origin.y;
    let pz = origin.z;

    const step = 0.04;
    let dist = 0;

    let prevBx = Math.floor(px + 0.5);
    let prevBy = Math.floor(py + 0.5);
    let prevBz = Math.floor(pz + 0.5);

    while (dist < maxDistance) {
      px += direction.x * step;
      py += direction.y * step;
      pz += direction.z * step;
      dist += step;

      const bx = Math.floor(px + 0.5);
      const by = Math.floor(py + 0.5);
      const bz = Math.floor(pz + 0.5);

      const block = this.getBlock(bx, by, bz);
      if (block) {
        // Face normal is difference from previous air voxel
        let nx = prevBx - bx;
        let ny = prevBy - by;
        let nz = prevBz - bz;

        // If step crossed diagonally, pick primary entry axis
        if (Math.abs(nx) + Math.abs(ny) + Math.abs(nz) > 1) {
          const adx = Math.abs(direction.x);
          const ady = Math.abs(direction.y);
          const adz = Math.abs(direction.z);
          if (ady >= adx && ady >= adz) {
            nx = 0; nz = 0; ny = -Math.sign(direction.y);
          } else if (adx >= adz) {
            ny = 0; nz = 0; nx = -Math.sign(direction.x);
          } else {
            nx = 0; ny = 0; nz = -Math.sign(direction.z);
          }
        }

        if (nx === 0 && ny === 0 && nz === 0) {
          ny = 1;
        }

        return {
          hit: true,
          block: block,
          distance: dist,
          normal: { x: nx, y: ny, z: nz },
          placePos: { x: bx + nx, y: by + ny, z: bz + nz }
        };
      }

      prevBx = bx;
      prevBy = by;
      prevBz = bz;
    }

    return { hit: false };
  }
}

window.VoxelWorld = VoxelWorld;
