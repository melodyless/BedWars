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

  // SkyWars Chest Registration & Procedural Loot Generators
  registerChest(x, y, z, isCenter = false) {
    const key = this.getKey(x, y, z);
    const items = isCenter ? this.generateCenterChestLoot() : this.generateSpawnChestLoot();
    this.chests.set(key, {
      x, y, z,
      isCenter,
      opened: false,
      items: items
    });
  }

  generateSpawnChestLoot() {
    const loot = [
      { id: 'sword_iron', name: '铁剑', type: 'weapon', count: 1, damage: 6 },
      { id: 'armor_iron', name: '铁盔甲', type: 'armor', tier: 'iron', count: 1 },
      { id: 'wood_planks', name: '橡木木板', type: 'block', blockType: 'OAK_PLANKS', count: 32 },
      { id: 'golden_apple', name: '金苹果', type: 'utility', count: 2 },
      { id: 'pickaxe_iron', name: '铁镐', type: 'tool', count: 1 },
      { id: 'bow_normal', name: '木弓', type: 'bow', bowType: 'normal', count: 1 },
      { id: 'arrow_16', name: '箭矢', type: 'arrow', count: 16 },
      { id: 'potion_speed', name: '迅捷药水 II (45秒)', type: 'potion', potionType: 'speed', duration: 45, count: 1 }
    ];

    const slots = new Array(27).fill(null);
    const usedIndices = new Set();
    loot.forEach(item => {
      let slotIdx;
      do {
        slotIdx = Math.floor(Math.random() * 27);
      } while (usedIndices.has(slotIdx));
      usedIndices.add(slotIdx);
      slots[slotIdx] = { ...item };
    });
    return slots;
  }

  generateCenterChestLoot() {
    const loot = [
      { id: 'sword_diamond', name: '钻石剑', type: 'weapon', count: 1, damage: 7 },
      { id: 'armor_diamond', name: '钻石盔甲', type: 'armor', tier: 'diamond', count: 1 },
      { id: 'enchanted_golden_apple', name: '附魔金苹果', type: 'utility', count: 1 },
      { id: 'ender_pearl', name: '末影珍珠', type: 'utility', count: 2 },
      { id: 'bow_power', name: '力量弓 (增伤)', type: 'bow', bowType: 'power', count: 1 },
      { id: 'arrow_16', name: '箭矢', type: 'arrow', count: 32 },
      { id: 'fireball', name: '火焰弹', type: 'utility', count: 2 },
      { id: 'potion_regen', name: '恢复药水 (30秒)', type: 'potion', potionType: 'regen', duration: 30, count: 1 }
    ];

    const slots = new Array(27).fill(null);
    const usedIndices = new Set();
    loot.forEach(item => {
      let slotIdx;
      do {
        slotIdx = Math.floor(Math.random() * 27);
      } while (usedIndices.has(slotIdx));
      usedIndices.add(slotIdx);
      slots[slotIdx] = { ...item };
    });
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
    // Small oak tree
    const tx = cx + 2, tz = cz;
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
    this.bedStatus = { red: false, blue: false, green: false, yellow: false };

    if (mode === 'skywars_4p') {
      const islandPositions = [
        { team: 'red', x: 0, z: 36, chestPos: { x: 0, y: 1, z: 39 } },
        { team: 'blue', x: 0, z: -36, chestPos: { x: 0, y: 1, z: -39 } },
        { team: 'green', x: 36, z: 0, chestPos: { x: 39, y: 1, z: 0 } },
        { team: 'yellow', x: -36, z: 0, chestPos: { x: -39, y: 1, z: 0 } }
      ];

      for (const pos of islandPositions) {
        this.createSkyWarsIsland(pos.x, 0, pos.z, 6);
        this.setBlock(pos.chestPos.x, pos.chestPos.y, pos.chestPos.z, 'CHEST', false);
        this.registerChest(pos.chestPos.x, pos.chestPos.y, pos.chestPos.z, false);
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
      this.createSkyWarsIsland(0, 0, 32, 6);
      this.setBlock(0, 1, 35, 'CHEST', false);
      this.registerChest(0, 1, 35, false);

      this.createSkyWarsIsland(0, 0, -32, 6);
      this.setBlock(0, 1, -35, 'CHEST', false);
      this.registerChest(0, 1, -35, false);

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

    if (mode === 'pvp_1v1' || mapType === 'arena') {
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
