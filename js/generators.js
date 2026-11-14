// Bedwars Resource Spawners (Iron, Gold, Diamond, Emerald)
class GeneratorManager {
  constructor(scene) {
    this.scene = scene;
    this.items = []; // Array of active dropped item objects

    this.spawners = [];
    this.initSpawners('2teams');

    // Shared Item 3D Geometries & Materials
    this.itemGeos = {
      iron: new THREE.BoxGeometry(0.3, 0.12, 0.4),
      gold: new THREE.BoxGeometry(0.3, 0.12, 0.4),
      diamond: new THREE.OctahedronGeometry(0.24, 0),
      emerald: new THREE.OctahedronGeometry(0.24, 0),
      wool: new THREE.BoxGeometry(0.35, 0.35, 0.35),
      gapple: new THREE.SphereGeometry(0.2, 8, 8)
    };

    this.itemMats = {
      iron: new THREE.MeshLambertMaterial({ color: 0xd8d8d8 }),
      gold: new THREE.MeshLambertMaterial({ color: 0xffd700 }),
      diamond: new THREE.MeshLambertMaterial({ color: 0x4cedf3 }),
      emerald: new THREE.MeshLambertMaterial({ color: 0x17dd62 }),
      wool: new THREE.MeshLambertMaterial({ color: 0xcc2222 }),
      gapple: new THREE.MeshLambertMaterial({ color: 0xffaa00 })
    };
  }

  initSpawners(mode = '2teams') {
    this.clearAll();
    this.spawners = [
      // Red Base (Iron & Gold)
      { type: 'iron', team: 'red', x: 0, y: 1.2, z: 47, interval: 1.2, timer: 0, max: 48 },
      { type: 'gold', team: 'red', x: 0, y: 1.2, z: 47, interval: 4.5, timer: 0, max: 16 },

      // Blue Base (Iron & Gold)
      { type: 'iron', team: 'blue', x: 0, y: 1.2, z: -47, interval: 1.2, timer: 0, max: 48 },
      { type: 'gold', team: 'blue', x: 0, y: 1.2, z: -47, interval: 4.5, timer: 0, max: 16 }
    ];

    if (mode === '4teams') {
      // Green Base (Iron & Gold)
      this.spawners.push(
        { type: 'iron', team: 'green', x: 47, y: 1.2, z: 0, interval: 1.2, timer: 0, max: 48 },
        { type: 'gold', team: 'green', x: 47, y: 1.2, z: 0, interval: 4.5, timer: 0, max: 16 }
      );
      // Yellow Base (Iron & Gold)
      this.spawners.push(
        { type: 'iron', team: 'yellow', x: -47, y: 1.2, z: 0, interval: 1.2, timer: 0, max: 48 },
        { type: 'gold', team: 'yellow', x: -47, y: 1.2, z: 0, interval: 4.5, timer: 0, max: 16 }
      );
      // 4 Diamond spawners (38, 38)
      this.spawners.push(
        { type: 'diamond', x: 38, y: 2.0, z: 38, interval: 12.0, timer: 0, max: 10 },
        { type: 'diamond', x: 38, y: 2.0, z: -38, interval: 12.0, timer: 0, max: 10 },
        { type: 'diamond', x: -38, y: 2.0, z: 38, interval: 12.0, timer: 0, max: 10 },
        { type: 'diamond', x: -38, y: 2.0, z: -38, interval: 12.0, timer: 0, max: 10 }
      );
      // Emeralds in Center (4 cardinal directions at distance 7)
      this.spawners.push(
        { type: 'emerald', x: 0, y: 2.0, z: 7, interval: 15.0, timer: 0, max: 8 },
        { type: 'emerald', x: 0, y: 2.0, z: -7, interval: 15.0, timer: 0, max: 8 },
        { type: 'emerald', x: 7, y: 2.0, z: 0, interval: 15.0, timer: 0, max: 8 },
        { type: 'emerald', x: -7, y: 2.0, z: 0, interval: 15.0, timer: 0, max: 8 }
      );
    } else {
      // 2-team mode diamond & emerald spawners
      this.spawners.push(
        { type: 'diamond', x: 42, y: 2.0, z: 0, interval: 12.0, timer: 0, max: 10 },
        { type: 'diamond', x: -42, y: 2.0, z: 0, interval: 12.0, timer: 0, max: 10 },
        { type: 'emerald', x: 0, y: 2.0, z: 7, interval: 15.0, timer: 0, max: 8 },
        { type: 'emerald', x: 0, y: 2.0, z: -7, interval: 15.0, timer: 0, max: 8 },
        { type: 'emerald', x: 7, y: 2.0, z: 0, interval: 15.0, timer: 0, max: 8 },
        { type: 'emerald', x: -7, y: 2.0, z: 0, interval: 15.0, timer: 0, max: 8 }
      );
    }
  }

  update(dt, player, bots) {
    const botList = Array.isArray(bots) ? bots : (bots ? [bots] : []);

    // 1. Spawner intervals
    this.spawners.forEach(s => {
      let speedMult = 1.0;
      if (s.team && window.game && window.game.teamUpgrades && window.game.teamUpgrades[s.team]) {
        if (window.game.teamUpgrades[s.team].forge) {
          speedMult = window.game.teamUpgrades[s.team].forge;
        }
      }

      s.timer += dt * speedMult;
      if (s.timer >= s.interval) {
        s.timer = 0;

        // Check if there are too many items already near this spawner
        let nearbyCount = 0;
        for (let i = 0; i < this.items.length; i++) {
          const it = this.items[i];
          if (it.type === s.type) {
            const ddx = it.mesh.position.x - s.x;
            const ddz = it.mesh.position.z - s.z;
            if (ddx * ddx + ddz * ddz < 4) nearbyCount++;
          }
        }

        if (nearbyCount < s.max) {
          this.spawnItem(s.type, s.x, s.y, s.z);
        }
      }
    });

    // 2. Animate items & check pickup collisions
    const now = performance.now() * 0.003;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.mesh.rotation.y += 2.5 * dt;
      it.mesh.position.y = it.baseY + Math.sin(now + it.seed) * 0.15;

      // Check Player pickup
      if (player && !player.isDead) {
        const dPlayer = Math.hypot(
          it.mesh.position.x - player.position.x,
          it.mesh.position.y - player.position.y,
          it.mesh.position.z - player.position.z
        );
        if (dPlayer < 1.7) {
          player.addResource(it.type, 1);
          window.soundManager.playPickup();
          this.removeItem(i);
          continue;
        }
      }

      // Check Bots pickup
      let pickedByBot = false;
      for (const bot of botList) {
        if (bot && !bot.isDead) {
          const dBot = Math.hypot(
            it.mesh.position.x - bot.position.x,
            it.mesh.position.y - bot.position.y,
            it.mesh.position.z - bot.position.z
          );
          if (dBot < 1.7) {
            bot.addResource(it.type, 1);
            if (bot.isTeammate && player && !player.isDead) {
              const dToP = Math.hypot(bot.position.x - player.position.x, bot.position.z - player.position.z);
              if (dToP < 7.0 && Math.random() < 0.35) {
                const nameMap = { iron: '铁锭', gold: '金锭', diamond: '钻石', emerald: '绿宝石', wool: '羊毛', gapple: '金苹果' };
                window.game.addChatMessage(`§c[红队队友] 捡到了掉落的 ${nameMap[it.type] || it.type}！`);
              }
            }
            this.removeItem(i);
            pickedByBot = true;
            break;
          }
        }
      }
      if (pickedByBot) continue;
    }
  }

  spawnItem(type, x, y, z) {
    let mesh;
    if (window.WeaponModelBuilder && typeof window.WeaponModelBuilder.createDroppedItem === 'function') {
      mesh = window.WeaponModelBuilder.createDroppedItem(type);
    } else {
      const geo = this.itemGeos[type] || this.itemGeos.iron;
      const mat = this.itemMats[type] || this.itemMats.iron;
      mesh = new THREE.Mesh(geo, mat);
    }

    // Slight random offset
    const ox = (Math.random() - 0.5) * 0.4;
    const oz = (Math.random() - 0.5) * 0.4;
    mesh.position.set(x + ox, y, z + oz);
    mesh.castShadow = false;

    this.scene.add(mesh);

    this.items.push({
      type,
      mesh,
      baseY: y,
      seed: Math.random() * 10
    });
  }

  removeItem(index) {
    const it = this.items[index];
    this.scene.remove(it.mesh);
    this.items.splice(index, 1);
  }

  clearAll() {
    this.items.forEach(it => this.scene.remove(it.mesh));
    this.items = [];
  }
}

window.GeneratorManager = GeneratorManager;
