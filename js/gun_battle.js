/**
 * 方块枪战 (Block Gun Battle) - 8v8 5枪械与ABCDE 2x2占领区系统
 */
(function () {
  const GUN_CATALOG = [
    {
      id: 'gun_rifle', name: 'AK-47 突击步枪', short: '步枪',
      damage: 4, fireRate: 0.14, pellets: 1, spread: 0.015, range: 75, speedMult: 1.0,
      color: 0xf59e0b, tracerColor: 0xfef08a,
      desc: '全自动高精准步枪 · 伤害4 · 射速0.14s · 中远距离全能'
    },
    {
      id: 'gun_sniper', name: 'AWP 狙击步枪', short: '狙击枪',
      damage: 14, fireRate: 1.0, pellets: 1, spread: 0.001, range: 110, speedMult: 0.92, scopeFov: 32,
      color: 0x22c55e, tracerColor: 0x4ade80,
      desc: '超高伤害远距狙杀 · 伤害14 · 右键开启高倍狙击镜'
    },
    {
      id: 'gun_shotgun', name: 'M870 霰弹枪', short: '霰弹枪',
      damage: 3, fireRate: 0.65, pellets: 6, spread: 0.09, range: 24, speedMult: 0.98,
      color: 0xef4444, tracerColor: 0xfca5a5,
      desc: '一次发射6颗弹丸(最高18伤) · 近战掩体伏击神器'
    },
    {
      id: 'gun_smg', name: 'MP5 冲锋枪', short: '冲锋枪',
      damage: 3, fireRate: 0.085, pellets: 1, spread: 0.03, range: 52, speedMult: 1.15,
      color: 0x38bdf8, tracerColor: 0x7dd3fc,
      desc: '极快射速 +15%移动速度 · 高机动抢区游走首选'
    },
    {
      id: 'gun_rpg', name: 'RPG 火箭筒', short: '火箭筒',
      damage: 11, fireRate: 1.35, pellets: 1, spread: 0.006, range: 75, speedMult: 0.90, explosiveRadius: 4.2,
      color: 0xa855f7, tracerColor: 0xe879f9,
      desc: '范围爆炸伤害11+击退 · 专克占领区抱团敌人'
    }
  ];

  const GUN_MAP = {};
  GUN_CATALOG.forEach(g => { GUN_MAP[g.id] = g; });

  function createGunModel(gunId) {
    const g = new THREE.Group();
    const metal = new THREE.MeshLambertMaterial({ color: 0x334155 });
    const dark = new THREE.MeshLambertMaterial({ color: 0x0f172a });
    const wood = new THREE.MeshLambertMaterial({ color: 0x92400e });
    const accent = new THREE.MeshLambertMaterial({ color: (GUN_MAP[gunId] && GUN_MAP[gunId].color) || 0xf59e0b });

    if (gunId === 'gun_sniper') {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.14, 0.72), accent);
      const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.55), dark);
      barrel.position.set(0, 0.02, -0.55);
      const scope = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.07, 0.28), dark);
      scope.position.set(0, 0.12, -0.08);
      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.18, 0.09), dark);
      grip.position.set(0, -0.14, 0.18);
      g.add(body, barrel, scope, grip);
    } else if (gunId === 'gun_shotgun') {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.13, 0.58), dark);
      const pump = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 0.24), wood);
      pump.position.set(0, -0.02, -0.25);
      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.14, 0.24), wood);
      stock.position.set(0, -0.04, 0.34);
      g.add(body, pump, stock);
    } else if (gunId === 'gun_smg') {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.13, 0.42), dark);
      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.07), accent);
      mag.position.set(0, -0.15, -0.06);
      const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.18), metal);
      barrel.position.set(0, 0.02, -0.28);
      g.add(body, mag, barrel);
    } else if (gunId === 'gun_rpg') {
      const tube = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.92), new THREE.MeshLambertMaterial({ color: 0x3f6212 }));
      const cone = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.20, 0.18), accent);
      cone.position.set(0, 0, -0.48);
      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.18, 0.09), dark);
      grip.position.set(0, -0.14, 0.12);
      g.add(tube, cone, grip);
    } else {
      // AK-47 Rifle
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.13, 0.58), metal);
      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.13, 0.22), wood);
      stock.position.set(0, -0.03, 0.36);
      const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.30), dark);
      barrel.position.set(0, 0.02, -0.40);
      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.20, 0.09), accent);
      mag.position.set(0, -0.14, -0.05);
      g.add(body, stock, barrel, mag);
    }
    return g;
  }

  function spawnTracer(scene, start, end, colorHex) {
    if (!scene) return;
    const dist = start.distanceTo(end);
    if (dist < 0.2) return;
    const geo = new THREE.BoxGeometry(0.05, 0.05, dist);
    const mat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.85 });
    const beam = new THREE.Mesh(geo, mat);
    beam.position.copy(start).lerp(end, 0.5);
    beam.lookAt(end);
    scene.add(beam);
    setTimeout(() => {
      if (beam.parent) beam.parent.remove(beam);
      geo.dispose();
      mat.dispose();
    }, 85);
  }

  function rayHitsBox(origin, dir, maxDist, targetPos) {
    const center = new THREE.Vector3(targetPos.x, targetPos.y + 0.95, targetPos.z);
    const toC = center.clone().sub(origin);
    const proj = toC.dot(dir);
    if (proj < 0 || proj > maxDist) return null;
    const closest = origin.clone().addScaledVector(dir, proj);
    const dx = Math.abs(closest.x - center.x);
    const dy = Math.abs(closest.y - center.y);
    const dz = Math.abs(closest.z - center.z);
    if (dx <= 0.45 && dy <= 0.95 && dz <= 0.45) {
      return proj;
    }
    return null;
  }

  function fireGun(shooter, origin, baseDir, gunId, isPlayer = false) {
    const world = window.game && window.game.world;
    const scene = window.game && window.game.scene;
    const gun = GUN_MAP[gunId] || GUN_MAP.gun_rifle;
    if (!world || !scene) return;

    if (window.soundManager) {
      if (gun.explosiveRadius && typeof window.soundManager.playExplosion === 'function') {
        window.soundManager.playDing(240);
      } else if (typeof window.soundManager.playHit === 'function') {
        window.soundManager.playHit();
      }
    }

    const shooterTeam = isPlayer ? 'red' : shooter.team;
    const shooterName = isPlayer ? '玩家' : shooter.name;
    const bots = (window.game && window.game.bots) || [];
    const player = window.game && window.game.player;

    for (let p = 0; p < gun.pellets; p++) {
      const dir = baseDir.clone();
      if (gun.spread > 0) {
        dir.x += (Math.random() - 0.5) * gun.spread * 2;
        dir.y += (Math.random() - 0.5) * gun.spread * 2;
        dir.z += (Math.random() - 0.5) * gun.spread * 2;
        dir.normalize();
      }

      const wallRay = world.raycast(origin, dir, gun.range);
      let maxDist = wallRay.hit ? wallRay.distance : gun.range;
      let hitEntity = null;
      let hitIsPlayer = false;

      // Check enemy bots
      for (const b of bots) {
        if (b === shooter || b.isDead || b.team === shooterTeam) continue;
        const d = rayHitsBox(origin, dir, maxDist, b.position);
        if (d !== null && d < maxDist) {
          maxDist = d;
          hitEntity = b;
          hitIsPlayer = false;
        }
      }
      // Check human player if shooter is blue bot
      if (!isPlayer && shooterTeam !== 'red' && player && !player.isDead) {
        const d = rayHitsBox(origin, dir, maxDist, player.position);
        if (d !== null && d < maxDist) {
          maxDist = d;
          hitEntity = player;
          hitIsPlayer = true;
        }
      }

      const endPoint = origin.clone().addScaledVector(dir, maxDist);
      spawnTracer(scene, origin.clone().addScaledVector(dir, 0.6), endPoint, gun.tracerColor);

      if (gun.explosiveRadius) {
        // RPG splash damage & shockwave
        if (window.WeaponModelBuilder && typeof window.WeaponModelBuilder.spawnSmashShockwave === 'function') {
          window.WeaponModelBuilder.spawnSmashShockwave(world, endPoint);
        }
        if (window.soundManager && typeof window.soundManager.playExplosion === 'function') {
          window.soundManager.playExplosion();
        }
        for (const b of bots) {
          if (b.isDead || b.team === shooterTeam) continue;
          const dist = b.position.distanceTo(endPoint);
          if (dist <= gun.explosiveRadius) {
            const kb = b.position.clone().sub(endPoint).setY(0.3).normalize();
            b.takeDamage(Math.max(4, Math.round(gun.damage * (1 - dist / (gun.explosiveRadius * 1.4)))), kb, shooterName);
          }
        }
        if (!isPlayer && shooterTeam !== 'red' && player && !player.isDead) {
          const dist = player.position.distanceTo(endPoint);
          if (dist <= gun.explosiveRadius) {
            const kb = player.position.clone().sub(endPoint).setY(0.3).normalize();
            player.takeDamage(Math.max(4, Math.round(gun.damage * (1 - dist / (gun.explosiveRadius * 1.4)))), kb);
          }
        }
      } else if (hitEntity) {
        const kb = dir.clone().setY(0.1).normalize().multiplyScalar(0.35);
        if (hitIsPlayer) {
          hitEntity.takeDamage(gun.damage, kb);
        } else {
          hitEntity.takeDamage(gun.damage, kb, shooterName);
          if (isPlayer && window.game && hitEntity.isDead) {
            window.game.kills++;
          }
        }
      }
    }
  }

  class GunBattleManager {
    constructor() {
      this.isModalOpen = false;
      this.ensureModal();
    }

    ensureModal() {
      if (document.getElementById('gun-select-modal')) return;
      const modal = document.createElement('div');
      modal.id = 'gun-select-modal';
      modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.72);z-index:2700;display:none;align-items:center;justify-content:center;font-family:"Segoe UI",sans-serif;';
      modal.innerHTML = `
        <div style="background:#1e293b;border:3px solid #38bdf8;border-radius:14px;padding:20px;width:680px;max-width:95vw;color:#f8fafc;box-shadow:0 20px 50px rgba(0,0,0,0.8);">
          <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #334155;padding-bottom:10px;margin-bottom:14px;">
            <h3 style="margin:0;color:#38bdf8;">🔫 方块枪战 · 选择你的主战枪械 (按 G 随时更换)</h3>
            <button id="gun-modal-close" style="background:#ef4444;color:#fff;border:none;border-radius:6px;padding:5px 12px;cursor:pointer;font-weight:bold;">关闭</button>
          </div>
          <div id="gun-cards-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px;"></div>
        </div>
      `;
      document.body.appendChild(modal);
      modal.addEventListener('mousedown', e => e.stopPropagation());
      document.getElementById('gun-modal-close').onclick = () => this.closeModal();
    }

    openModal() {
      this.ensureModal();
      const grid = document.getElementById('gun-cards-grid');
      grid.innerHTML = '';
      for (const g of GUN_CATALOG) {
        const card = document.createElement('div');
        card.style.cssText = 'background:#0f172a;border:2px solid #334155;border-radius:10px;padding:12px;cursor:pointer;display:flex;flex-direction:column;gap:6px;';
        card.innerHTML = `
          <div style="font-weight:bold;font-size:15px;color:#fbbf24;">${g.name}</div>
          <div style="font-size:12px;color:#cbd5e1;line-height:1.4;">${g.desc}</div>
          <div style="margin-top:auto;font-size:12px;color:#38bdf8;font-weight:bold;">点击装备 ➔</div>
        `;
        card.onmouseenter = () => { card.style.borderColor = '#38bdf8'; };
        card.onmouseleave = () => { card.style.borderColor = '#334155'; };
        card.onclick = () => {
          this.equipPlayerGun(g.id);
          this.closeModal();
        };
        grid.appendChild(card);
      }
      this.isModalOpen = true;
      document.getElementById('gun-select-modal').style.display = 'flex';
      if (document.exitPointerLock) { try { document.exitPointerLock(); } catch (e) {} }
    }

    closeModal() {
      this.isModalOpen = false;
      const modal = document.getElementById('gun-select-modal');
      if (modal) modal.style.display = 'none';
      const canvas = document.getElementById('render-canvas');
      if (canvas && canvas.requestPointerLock && window.game && window.game.isGameRunning) {
        try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
      }
    }

    equipPlayerGun(gunId) {
      const p = window.player;
      const gun = GUN_MAP[gunId] || GUN_MAP.gun_rifle;
      if (!p) return;
      p.hotbar[0] = {
        id: gun.id,
        name: gun.name,
        type: 'gun',
        gunId: gun.id,
        damage: gun.damage,
        count: 1
      };
      p.selectedSlot = 0;
      p.updateHUD();
      p.updateHeldItemVisual();
      if (window.game) window.game.addChatMessage(`§b已切换武器：§e${gun.name}`);
    }

    updateZones(dt) {
      const game = window.game;
      const world = game && game.world;
      if (!game || !world || !world.gunZones || !game.isGameRunning) return;

      const player = game.player;
      const bots = game.bots || [];
      let redOwned = 0;
      let blueOwned = 0;

      for (const zone of world.gunZones) {
        let redCount = 0;
        let blueCount = 0;
        const inZone = (pos) =>
          pos.x >= zone.x0 - 0.6 && pos.x <= zone.x0 + 1.6 &&
          pos.z >= zone.z0 - 0.6 && pos.z <= zone.z0 + 1.6 &&
          pos.y <= 3.0;

        if (player && !player.isDead && inZone(player.position)) redCount++;
        for (const b of bots) {
          if (b.isDead) continue;
          if (inZone(b.position)) {
            if (b.team === 'red') redCount++;
            else if (b.team === 'blue') blueCount++;
          }
        }

        if (redCount > 0 && blueCount === 0) {
          if (zone.owner !== 'red') {
            if (zone.capturingTeam !== 'red') {
              zone.capturingTeam = 'red';
              zone.progress = 0;
            }
            zone.progress += dt;
            if (zone.progress >= 5.0) {
              zone.owner = 'red';
              zone.progress = 5.0;
              world.updateGunZoneVisual(zone, true);
              game.addChatMessage(`§c★ 红队占领了 [${zone.id}] 区！`);
              if (window.soundManager) window.soundManager.playDing(900);
            } else {
              world.updateGunZoneVisual(zone, false);
            }
          }
        } else if (blueCount > 0 && redCount === 0) {
          if (zone.owner !== 'blue') {
            if (zone.capturingTeam !== 'blue') {
              zone.capturingTeam = 'blue';
              zone.progress = 0;
            }
            zone.progress += dt;
            if (zone.progress >= 5.0) {
              zone.owner = 'blue';
              zone.progress = 5.0;
              world.updateGunZoneVisual(zone, true);
              game.addChatMessage(`§9★ 蓝队占领了 [${zone.id}] 区！`);
              if (window.soundManager) window.soundManager.playDing(450);
            } else {
              world.updateGunZoneVisual(zone, false);
            }
          }
        } else if (redCount === 0 && blueCount === 0 && zone.owner !== zone.capturingTeam && zone.progress > 0) {
          zone.progress = Math.max(0, zone.progress - dt * 0.5);
          if (zone.progress === 0) zone.capturingTeam = null;
          world.updateGunZoneVisual(zone, false);
        }

        if (zone.owner === 'red') redOwned++;
        else if (zone.owner === 'blue') blueOwned++;
      }

      // First team to capture all 5 zones (ABCDE) wins!
      if (redOwned >= 5) {
        game.victory();
      } else if (blueOwned >= 5) {
        game.defeat();
      }
    }
  }

  window.GUN_CATALOG = GUN_CATALOG;
  window.GUN_MAP = GUN_MAP;
  window.createGunModel = createGunModel;
  window.fireGun = fireGun;
  window.gunBattle = new GunBattleManager();
})();
