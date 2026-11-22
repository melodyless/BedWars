/**
 * Bedwars End Realm Boss - End Lord (末地领主)
 * Spawns in the center of the End Map after 5 minutes of game time.
 * Stats: 100 HP, 0 Armor, 10 Attack Damage.
 * Hostile to ALL players and bots, and actively hunts & destroys all team beds!
 * Skin: Authentic custom Minecraft 64x64 Wither Suit Skin.
 */
(function() {
  const BOSS_SKIN_DATAURL = 'data:image/png;base64,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';
  window.BOSS_SKIN_DATAURL = BOSS_SKIN_DATAURL;

  // Pre-load skin image
  const bossImg = new Image();
  bossImg.crossOrigin = 'anonymous';
  bossImg.src = BOSS_SKIN_DATAURL;

  class EndBoss extends Bot {
    constructor(scene, world, config = {}) {
      super(scene, world, {
        ...config,
        id: 'end_boss',
        name: '末地领主',
        team: 'boss',
        difficulty: 'nightmare'
      });

      this.isBoss = true;
      this.maxHealth = 100;
      this.health = 100;
      this.damage = 10;          // 10 attack damage as requested
      this.armorTier = 'none';    // 0 armor (no armor reduction) as requested
      this.weaponTier = 'diamond'; // Diamond blade dealing exactly 10 base damage
      this.critChance = 0;        // Consistent 10 damage without random multipliers
      this.speed = 5.2;
      this.sprintSpeed = 6.4;
      this.jumpForce = 9.2;
      this.woolCount = 64;        // Ample blocks to bridge anywhere
      this.pickaxeTier = 'diamond';
      this.hasShears = true;

      // Imposing Boss presence (Scale up 1.25x)
      this.group.scale.set(1.25, 1.25, 1.25);

      // Team configuration for boss
      this.teamData.boss = {
        name: '末地领主',
        colorStr: '#d946ef',
        colorHex: 0xd946ef,
        prefix: '§5',
        spawn: new THREE.Vector3(0, 9.0, 0),
        bed: new THREE.Vector3(0, 9.0, 0)
      };

      // Hide default armor pieces and trims so suit and red tie are completely clear
      if (this.helmetMesh) this.helmetMesh.visible = false;
      if (this.beltMesh) this.beltMesh.visible = false;
      if (this.shoulderLeft) this.shoulderLeft.visible = false;
      if (this.shoulderRight) this.shoulderRight.visible = false;

      // Apply boss custom skin
      this.applyBossSkin();

      // Nametag & Boss Bar
      this.updateNametag(true);
      this.updateBossBar();
    }

    applyBossSkin() {
      if (!window.SkinManager) return;
      const config = {
        type: 'custom',
        name: 'end_boss.png',
        data: BOSS_SKIN_DATAURL
      };

      const mats = window.SkinManager.getBotMaterials('end_boss', 'boss');
      if (mats) {
        if (mats.head && this.headMesh) this.headMesh.material = mats.head;
        if (mats.torso && this.torsoMesh) this.torsoMesh.material = mats.torso;
        if (mats.leftArm && this.leftArm) this.leftArm.material = mats.leftArm;
        if (mats.rightArm && this.rightArm) this.rightArm.material = mats.rightArm;
        if (mats.leftLeg && this.leftLeg) this.leftLeg.material = mats.leftLeg;
        if (mats.rightLeg && this.rightLeg) this.rightLeg.material = mats.rightLeg;
        this.customSkinMats = mats;
      }
    }

    updateEquipmentVisuals() {
      // Overridden: Boss does NOT wear armor plates, keeping suit & tie 100% visible
      if (this.helmetMesh) this.helmetMesh.visible = false;
      if (this.beltMesh) this.beltMesh.visible = false;
      if (this.shoulderLeft) this.shoulderLeft.visible = false;
      if (this.shoulderRight) this.shoulderRight.visible = false;

      if (this.customSkinMats) {
        if (this.headMesh && this.customSkinMats.head) this.headMesh.material = this.customSkinMats.head;
        if (this.torsoMesh && this.customSkinMats.torso) this.torsoMesh.material = this.customSkinMats.torso;
        if (this.leftArm && this.customSkinMats.leftArm) this.leftArm.material = this.customSkinMats.leftArm;
        if (this.rightArm && this.customSkinMats.rightArm) this.rightArm.material = this.customSkinMats.rightArm;
        if (this.leftLeg && this.customSkinMats.leftLeg) this.leftLeg.material = this.customSkinMats.leftLeg;
        if (this.rightLeg && this.customSkinMats.rightLeg) this.rightLeg.material = this.customSkinMats.rightLeg;
      }
      this.updateNametag();
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

      // Dark purple pill container
      ctx.fillStyle = 'rgba(20, 10, 30, 0.90)';
      this.roundRect(ctx, 8, 8, 496, 112, 16, true, false);

      // Violet glowing border
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#c084fc';
      this.roundRect(ctx, 8, 8, 496, 112, 16, false, true);

      // Line 1: Boss Title
      ctx.font = 'bold 30px "Minecraft", "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      const nameLine = '👑 [BOSS] 末地领主 [无护甲/攻击10]';

      ctx.lineWidth = 4;
      ctx.strokeStyle = '#000000';
      ctx.strokeText(nameLine, 256, 46);

      ctx.fillStyle = '#f0abfc';
      ctx.fillText(nameLine, 256, 46);

      // Line 2: Boss Health Bar
      const curHp = Math.max(0, this.health);
      const maxHp = this.maxHealth;
      const hpPct = Math.max(0, Math.min(1, curHp / maxHp));

      const barX = 40;
      const barY = 66;
      const barW = 260;
      const barH = 28;

      ctx.fillStyle = 'rgba(30, 15, 45, 0.95)';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.strokeRect(barX, barY, barW, barH);

      // Health bar fill (violet gradient)
      const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      grad.addColorStop(0, '#9333ea');
      grad.addColorStop(1, '#ec4899');
      ctx.fillStyle = grad;
      if (hpPct > 0) {
        ctx.fillRect(barX + 2, barY + 2, (barW - 4) * hpPct, barH - 4);
      }

      // HP Text
      const hpText = `${curHp} / ${maxHp} HP`;
      ctx.font = 'bold 26px "Minecraft", "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#000000';
      ctx.strokeText(hpText, barX + barW + 18, barY + 22);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(hpText, barX + barW + 18, barY + 22);

      this.nametag.material.map.needsUpdate = true;
    }

    updateBossBar() {
      const barCont = document.getElementById('boss-bar-container');
      const fill = document.getElementById('boss-hp-fill');
      const text = document.getElementById('boss-hp-text');
      if (!barCont || !fill || !text) return;

      if (this.isDead) {
        barCont.style.display = 'none';
        return;
      }

      barCont.style.display = 'block';
      const pct = Math.max(0, Math.min(100, (this.health / this.maxHealth) * 100));
      fill.style.width = `${pct}%`;
      text.innerText = `${Math.max(0, Math.round(this.health))} / ${this.maxHealth} HP`;
    }

    // Attacks ALL players: human player + all bots of every team!
    findTarget(player, allBots) {
      let closestTarget = null;
      let closestDist = 999;

      // 1. Check human player (regardless of team)
      if (player && !player.isDead) {
        const dPlayer = this.position.distanceTo(player.position);
        // Only target player if within detection range and line of sight (or within 2.5m)
        if (dPlayer < 24.0) {
          if (dPlayer <= 2.5 || this.hasLineOfSight(player.position)) {
            closestDist = dPlayer;
            closestTarget = { type: 'player', entity: player, pos: player.position };
          }
        }
      }

      // 2. Check all bots (attacks red, blue, green, yellow bots alike)
      for (const b of allBots) {
        if (b !== this && !b.isDead && !b.isBoss) {
          const dBot = this.position.distanceTo(b.position);
          if (dBot < closestDist && dBot < 24.0) {
            if (dBot <= 2.5 || this.hasLineOfSight(b.position)) {
              closestDist = dBot;
              closestTarget = { type: 'bot', entity: b, pos: b.position };
            }
          }
        }
      }

      return { target: closestTarget, dist: closestDist };
    }

    // Finds the nearest intact bed of ANY team in the match
    findTargetBed() {
      const teams = ['red', 'blue', 'green', 'yellow'];
      let bestBed = null;
      let bestDist = 999;

      for (const t of teams) {
        if (this.world.bedStatus && this.world.bedStatus[t]) {
          let bedPos = this.teamData[t] ? this.teamData[t].bed : null;
          if (!bedPos) {
            const targetBedType = `BED_${t.toUpperCase()}`;
            for (const b of this.world.voxelMap.values()) {
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

    chooseNextObjective() {
      // 1. If any enemy (player or bot) is nearby, immediately fight them!
      const { target, dist } = this.findTarget(window.player, window.game ? window.game.bots : []);
      if (target && dist < 14.0) {
        this.state = 'COMBAT';
        this.currentTarget = target;
        this.stateTimer = 0;
        return;
      }

      // 2. If any team's bed is still intact, march to destroy it!
      const targetBed = this.findTargetBed();
      if (targetBed) {
        this.state = 'ATTACK_BED';
        this.stateTimer = 0;
        return;
      }

      // 3. All beds destroyed: hunt down surviving players and bots
      if (target) {
        this.state = 'COMBAT';
        this.currentTarget = target;
        this.stateTimer = 0;
      } else {
        this.state = 'PATROL';
        this.stateTimer = 0;
      }
    }

    runAIStateMachine(dt, player, allBots) {
      // Keep wool stocked so boss can always bridge across void
      if (this.woolCount < 32) this.woolCount = 64;

      // Ender Teleport Void Recovery: if boss is knocked into void (y < -10)
      if (this.position.y < -10) {
        this.position.set(0, 9.2, 0);
        this.velocity.set(0, 0, 0);
        if (window.soundManager && typeof window.soundManager.playDing === 'function') {
          window.soundManager.playDing(1200);
        }
        if (window.game) {
          window.game.addChatMessage('§5★ 【末地领主】触发末影折跃，重返中央神殿！');
        }
        return;
      }

      // 1. Target check
      const { target, dist } = this.findTarget(player, allBots);
      this.currentTarget = target;

      // If any enemy is within 12 blocks, immediately fight them!
      if (target && dist < 12.0) {
        this.state = 'COMBAT';
      }

      // 2. Bed Assault Traversal across void
      if (this.state === 'ATTACK_BED') {
        const targetBed = this.findTargetBed();
        if (!targetBed) {
          this.chooseNextObjective();
          return;
        }

        const distToBed = this.position.distanceTo(targetBed.pos);
        if (distToBed > 4.2) {
          // Navigate and bridge across the void directly towards bed
          const navRes = this.navigateAndBridge(targetBed.pos.x, targetBed.pos.z, true);
          if (navRes === 'NO_WOOL' || navRes === 'ARRIVED') {
            this.moveTo(targetBed.pos.x, targetBed.pos.z, this.sprintSpeed);
          }
          return;
        }
      }

      super.runAIStateMachine(dt, player, allBots);
    }

    // Boss takes damage: 0 ARMOR (takes 100% full damage)
    takeDamage(amount, knockbackDir = null, attackerName = '敌人') {
      if (this.isDead) return;

      // 0 Armor: no damage reduction!
      const actual = Math.max(1, Math.round(amount));
      this.health -= actual;
      this.updateNametag(true);
      this.updateBossBar();

      // Damage flash red
      this.flashMeshColor(this.torsoMesh, 0xff2222);
      this.flashMeshColor(this.headMesh, 0xff2222);
      this.flashMeshColor(this.leftArm, 0xff2222);
      this.flashMeshColor(this.rightArm, 0xff2222);
      this.flashMeshColor(this.leftLeg, 0xff2222);
      this.flashMeshColor(this.rightLeg, 0xff2222);
      setTimeout(() => this.updateEquipmentVisuals(), 130);

      // Boss has heavy mass: resists heavy knockback
      if (knockbackDir) {
        this.velocity.x += knockbackDir.x * 2.2;
        this.velocity.y = 1.8;
        this.velocity.z += knockbackDir.z * 2.2;
      }

      // Spawn purple ender hit sparks
      if (window.WeaponModelBuilder && typeof window.WeaponModelBuilder.spawnHitSparks === 'function') {
        window.WeaponModelBuilder.spawnHitSparks(this.world, this.position, 0xc084fc);
      }

      // Immediately counter-attack attacker
      this.state = 'COMBAT';

      if (this.health <= 0) {
        this.die('killed', attackerName);
      }
    }

    die(cause = 'killed', killer = '玩家') {
      if (this.isDead) return;
      this.isDead = true;
      this.health = 0;
      this.group.visible = false;
      this.updateBossBar();

      if (window.game) {
        window.game.addChatMessage(`§d★ 强大的【末地领主】被 §f${killer} §d成功讨伐击杀！掉落了终极宝藏！`);
        // Remove from bots list
        if (window.game.bots) {
          const idx = window.game.bots.indexOf(this);
          if (idx !== -1) window.game.bots.splice(idx, 1);
        }
      }

      // Victory sound & big particle explosion
      if (window.soundManager && typeof window.soundManager.playDing === 'function') {
        window.soundManager.playDing(1600);
      }
      if (window.WeaponModelBuilder && typeof window.WeaponModelBuilder.spawnSmashShockwave === 'function') {
        window.WeaponModelBuilder.spawnSmashShockwave(this.world, this.position);
      }

      // Drop Epic Loot: 10 Emeralds, 8 Wind Charges, 3 Golden Apples!
      if (this.world && typeof this.world.spawnItemDrop === 'function') {
        for (let i = 0; i < 10; i++) {
          this.world.spawnItemDrop(this.position.x + (Math.random() - 0.5) * 1.5, this.position.y + 0.5, this.position.z + (Math.random() - 0.5) * 1.5, 'emerald');
        }
      }
    }

    update(dt, player, allBots) {
      if (this.isDead) return;

      // Periodic End Boss aura: floating violet particles
      if (Math.random() < 0.25 && this.world && this.world.scene && this.world.particles) {
        const auraGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const auraMat = new THREE.MeshBasicMaterial({ color: 0xd946ef, transparent: true, opacity: 0.8 });
        const p = new THREE.Mesh(auraGeo, auraMat);
        p.position.set(
          this.position.x + (Math.random() - 0.5) * 1.2,
          this.position.y + Math.random() * 2.0,
          this.position.z + (Math.random() - 0.5) * 1.2
        );
        this.world.scene.add(p);
        this.world.particles.push({
          mesh: p,
          velocity: new THREE.Vector3((Math.random() - 0.5) * 0.8, Math.random() * 1.5 + 0.8, (Math.random() - 0.5) * 0.8),
          life: 0.4
        });
      }

      super.update(dt, player, allBots);
      this.updateBossBar();
    }
  }

  window.EndBoss = EndBoss;
})();
