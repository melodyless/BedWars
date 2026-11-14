// First-Person Minecraft Player Controller & Inventory
class Player {
  constructor(camera, scene, world) {
    this.camera = camera;
    this.scene = scene;
    this.world = world;

    // Position & Physics
    this.position = new THREE.Vector3(0, 0.6, 56); // Red team spawn point
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.yaw = 0; // Horizontal rotation
    this.pitch = 0; // Vertical rotation
    this.onGround = false;
    this.isDead = false;
    this.respawnTimer = 0;

    // Movement speeds
    this.walkSpeed = 5.2;
    this.sneakSpeed = 1.8;
    this.jumpForce = 8.6;
    this.gravity = 26.0;

    // Bounding Box (AABB)
    this.width = 0.6;
    this.height = 1.8;
    this.eyeHeight = 1.62;

    // Stats
    this.maxHealth = 20;
    this.health = 20;
    this.armorTier = 'none'; // 'none', 'chain', 'iron', 'diamond'

    // Resources
    this.resources = {
      iron: 0,
      gold: 0,
      diamond: 0,
      emerald: 0
    };

    // Hotbar (9 slots)
    this.selectedSlot = 0;
    this.hotbar = [
      { id: 'sword_wooden', name: '木剑', type: 'weapon', count: 1, damage: 4 },
      { id: 'red_wool', name: '红色羊毛', type: 'block', blockType: 'RED_WOOL', count: 32 },
      { id: 'shears', name: '剪刀', type: 'tool', count: 1 },
      null, null, null, null, null, null
    ];

    // Main Backpack Storage (27 slots: 3 rows x 9 columns)
    this.backpack = Array(27).fill(null);
    this.backpackIsOpen = false;
    this.selectedBackpackSlot = null; // { location: 'hotbar' | 'backpack', index: number }

    // Active Potion Effects (remaining time in seconds)
    this.effects = {
      speed: 0,
      jump: 0,
      invisibility: 0,
      regen: 0
    };
    this.isInvisible = false;
    this.regenIntervalTimer = 0;
    this.lastAttackTime = 0;

    // Input States
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      sneak: false
    };
    this.touchMoveVector = { x: 0, z: 0 };

    // First Person Hand & Held Item Model
    this.handMesh = null;
    this.itemMesh = null;
    this.handGroup = new THREE.Group();
    this.camera.add(this.handGroup);
    this.isSwinging = false;
    this.swingProgress = 0;
    this.bobbingTimer = 0;

    // Mining / Block Breaking & Placing
    this.isMining = false;
    this.miningBlock = null;
    this.miningTimer = 0;
    this.requiredMineTime = 1.0;
    this.isRightMouseDown = false;
    this.placeCooldown = 0;

    // Bow & Arrow Combat System
    this.isDrawingBow = false;
    this.bowDrawTime = 0;

    this.initHandModel();
    this.bindEvents();
    this.initBackpackUI();
    this.updateHUD();
  }

  initHandModel() {
    this.handGroup.position.set(0.35, -0.32, -0.55);
    this.handGroup.rotation.set(0.1, -0.2, 0);

    // Player arm
    const armGeo = new THREE.BoxGeometry(0.14, 0.45, 0.14);
    let armMat = new THREE.MeshLambertMaterial({
      map: TextureGenerator.getPlayerSkin()
    });
    if (window.SkinManager && typeof window.SkinManager.getBotMaterials === 'function') {
      const pMats = window.SkinManager.getBotMaterials('player', 'red');
      if (pMats && pMats.rightArm) {
        armMat = pMats.rightArm;
      }
    }
    this.handMesh = new THREE.Mesh(armGeo, armMat);
    this.handMesh.position.set(0, 0, 0);
    this.handGroup.add(this.handMesh);

    // Held item container
    this.itemHolder = new THREE.Group();
    this.itemHolder.position.set(-0.05, 0.18, -0.15);
    this.handGroup.add(this.itemHolder);

    this.updateHeldItemVisual();
  }

  updateHeldItemVisual() {
    // Clear previous item mesh
    while (this.itemHolder.children.length > 0) {
      this.itemHolder.remove(this.itemHolder.children[0]);
    }

    const currentItem = this.hotbar[this.selectedSlot];
    if (!currentItem) return;

    if (currentItem.type === 'weapon') {
      const isEnchanted = !!(window.game && window.game.teamUpgrades && window.game.teamUpgrades.red && window.game.teamUpgrades.red.sharpness > 0);
      const sword = window.WeaponModelBuilder ?
        window.WeaponModelBuilder.createSword(currentItem.id, { enchanted: isEnchanted }) :
        null;
      if (sword) {
        this.itemHolder.add(sword);
      }
    } else if (currentItem.id === 'shears' || currentItem.type === 'shears') {
      const shears = window.WeaponModelBuilder ?
        window.WeaponModelBuilder.createShears() :
        null;
      if (shears) {
        this.itemHolder.add(shears);
      }
    } else if (currentItem.type === 'tool' || (currentItem.id && currentItem.id.startsWith('pickaxe_'))) {
      const pick = window.WeaponModelBuilder ?
        window.WeaponModelBuilder.createPickaxe(currentItem.id) :
        null;
      if (pick) {
        this.itemHolder.add(pick);
      }
    } else if (currentItem.type === 'block') {
      // Mini block model
      const blockGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      let mat = this.world.materials[currentItem.blockType] || this.world.materials['RED_WOOL'];
      if (Array.isArray(mat)) mat = mat[2]; // Use top texture
      const miniBlock = new THREE.Mesh(blockGeo, mat);
      miniBlock.position.set(0, 0, 0);
      this.itemHolder.add(miniBlock);
    } else if (currentItem.id === 'golden_apple') {
      const gapple = window.WeaponModelBuilder ?
        window.WeaponModelBuilder.createGoldenApple() :
        new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshLambertMaterial({ color: 0xffd700 }));
      this.itemHolder.add(gapple);
    } else if (currentItem.id === 'enchanted_golden_apple') {
      const egapple = window.WeaponModelBuilder ?
        window.WeaponModelBuilder.createEnchantedGoldenApple() :
        new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), new THREE.MeshLambertMaterial({ color: 0xff33bb }));
      this.itemHolder.add(egapple);
    } else if (currentItem.id === 'fireball') {
      const fb = window.WeaponModelBuilder ?
        window.WeaponModelBuilder.createFireball() :
        new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshLambertMaterial({ color: 0xff5722 }));
      this.itemHolder.add(fb);
    } else if (currentItem.id === 'ender_pearl') {
      const pearl = window.WeaponModelBuilder ?
        window.WeaponModelBuilder.createEnderPearl() :
        new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), new THREE.MeshLambertMaterial({ color: 0x145a43 }));
      this.itemHolder.add(pearl);
    } else if (currentItem.type === 'bow') {
      const bow = window.WeaponModelBuilder ?
        window.WeaponModelBuilder.createBow(currentItem.bowType || 'normal', {
          isDrawing: this.isDrawingBow,
          drawProgress: this.bowDrawTime / 1.0
        }) :
        null;
      if (bow) {
        this.itemHolder.add(bow);
      }
    } else if (currentItem.type === 'arrow' || (currentItem.id && currentItem.id.startsWith('arrow'))) {
      const arrow = window.WeaponModelBuilder ?
        window.WeaponModelBuilder.createArrow() :
        null;
      if (arrow) {
        arrow.rotation.x = Math.PI / 4;
        this.itemHolder.add(arrow);
      }
    } else if (currentItem.type === 'potion' || (currentItem.id && currentItem.id.startsWith('potion_'))) {
      const potion = window.WeaponModelBuilder ?
        window.WeaponModelBuilder.createPotion(currentItem.id) :
        null;
      if (potion) {
        this.itemHolder.add(potion);
      }
    }
  }

  bindEvents() {
    this._onKeyDown = e => {
      // Do not handle player controls or game shortcuts when typing in chat/input
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
        return;
      }
      if (this.isDead) return;

      if (e.code === 'KeyQ') {
        this.dropItem();
        return;
      }

      if (e.code === 'KeyB') {
        this.toggleBackpack();
        return;
      }

      if (e.code === 'KeyE') {
        if (window.shopManager && window.shopManager.isOpen) {
          window.shopManager.closeShop();
        } else if (window.teammateManager && window.teammateManager.isOpen) {
          window.teammateManager.closeModal();
        } else if (this.backpackIsOpen) {
          this.closeBackpack();
        } else {
          this.openBackpack();
        }
        return;
      }

      if (e.code === 'Escape') {
        if (this.backpackIsOpen) {
          this.closeBackpack();
          return;
        }
      }

      switch (e.code) {
        case 'KeyW': this.keys.forward = true; break;
        case 'KeyS': this.keys.backward = true; break;
        case 'KeyA': this.keys.left = true; break;
        case 'KeyD': this.keys.right = true; break;
        case 'Space': this.keys.jump = true; break;
        case 'ShiftLeft':
        case 'ShiftRight': this.keys.sneak = true; break;
        case 'Digit1': this.selectSlot(0); break;
        case 'Digit2': this.selectSlot(1); break;
        case 'Digit3': this.selectSlot(2); break;
        case 'Digit4': this.selectSlot(3); break;
        case 'Digit5': this.selectSlot(4); break;
        case 'Digit6': this.selectSlot(5); break;
        case 'Digit7': this.selectSlot(6); break;
        case 'Digit8': this.selectSlot(7); break;
        case 'Digit9': this.selectSlot(8); break;
      }
    };

    this._onKeyUp = e => {
      switch (e.code) {
        case 'KeyW': this.keys.forward = false; break;
        case 'KeyS': this.keys.backward = false; break;
        case 'KeyA': this.keys.left = false; break;
        case 'KeyD': this.keys.right = false; break;
        case 'Space': this.keys.jump = false; break;
        case 'ShiftLeft':
        case 'ShiftRight': this.keys.sneak = false; break;
      }
    };

    // Mouse Wheel to cycle slots (Prevent browser zoom on scroll / Ctrl + wheel)
    this._onWheel = e => {
      if (e.cancelable) e.preventDefault();
      if (e.deltaY > 0) {
        this.selectSlot((this.selectedSlot + 1) % 9);
      } else {
        this.selectSlot((this.selectedSlot + 8) % 9);
      }
    };

    // Mouse Look (Pointer Lock with smooth fallback)
    this._lastMouseX = undefined;
    this._lastMouseY = undefined;
    this._onMouseMove = e => {
      const canvas = document.getElementById('render-canvas');
      const isLocked = (document.pointerLockElement === canvas);

      let dx = 0;
      let dy = 0;

      const isTouchActive = !!(window.game && window.game.touchControls && window.game.touchControls.enabled);
      if (isLocked) {
        dx = e.movementX;
        dy = e.movementY;
      } else if (!isTouchActive && window.game && window.game.isGameRunning && (!window.shopManager || !window.shopManager.isOpen)) {
        // Fallback when pointer is temporarily unlocked (PC only): track delta if mouse is inside canvas
        if (this._lastMouseX !== undefined) {
          dx = e.clientX - this._lastMouseX;
          dy = e.clientY - this._lastMouseY;
        }
      }
      this._lastMouseX = e.clientX;
      this._lastMouseY = e.clientY;

      if (!isLocked && isTouchActive) return; // In touch mode without physical pointer lock, look is handled by touchmove

      if (Math.abs(dx) > 120 || Math.abs(dy) > 120) return; // Ignore window focus warp jumps

      const sensitivity = 0.0022;
      this.yaw -= dx * sensitivity;
      this.pitch -= dy * sensitivity;

      // Clamp vertical pitch to [-89deg, 89deg]
      const maxPitch = Math.PI / 2 - 0.02;
      this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
    };

    this._onMouseDown = e => {
      if (this.isDead) return;
      if (window.shopManager && window.shopManager.isOpen) return;

      const canvas = document.getElementById('render-canvas');
      const isTouchActive = !!(window.game && window.game.touchControls && window.game.touchControls.enabled);
      if (document.pointerLockElement !== canvas && !isTouchActive) {
        // Any click on game area (except modals) attempts to lock pointer immediately
        if (!e.target.closest('#shop-modal') && !e.target.closest('#team-modal') && !e.target.closest('#start-screen') && !e.target.closest('#gameover-modal')) {
          try {
            if (canvas) {
              const p = canvas.requestPointerLock();
              if (p && typeof p.catch === 'function') p.catch(() => {});
            }
          } catch (err) {}
        }
      }

      if (e.button === 0) {
        // Left click
        this.startAttackOrMine();
      } else if (e.button === 2) {
        // Right click
        e.preventDefault();
        this.isRightMouseDown = true;
        this.placeCooldown = 0.22;

        const currentItem = this.hotbar[this.selectedSlot];
        if (currentItem && currentItem.type === 'bow') {
          const arrowIdx = this.hotbar.findIndex(s => s && (s.type === 'arrow' || (s.id && s.id.startsWith('arrow'))) && s.count > 0);
          if (arrowIdx === -1) {
            window.game.addChatMessage('§c[提示] 快捷栏中没有箭矢！请先在村民商店购买箭矢。');
            if (window.soundManager && typeof window.soundManager.playBeep === 'function') {
              window.soundManager.playBeep(false);
            }
            return;
          }
          this.isDrawingBow = true;
          this.bowDrawTime = 0;
          if (window.soundManager && typeof window.soundManager.playBowDraw === 'function') {
            window.soundManager.playBowDraw();
          }
          this.updateHeldItemVisual();
          return;
        }

        this.handleRightClick();
      }
    };

    this._onMouseUp = e => {
      if (e.button === 0) {
        this.stopMining();
      } else if (e.button === 2) {
        e.preventDefault();
        this.isRightMouseDown = false;

        if (this.isDrawingBow) {
          const drawTime = this.bowDrawTime;
          this.isDrawingBow = false;
          this.bowDrawTime = 0;
          this.camera.fov = 75;
          this.camera.updateProjectionMatrix();

          const currentItem = this.hotbar[this.selectedSlot];
          if (currentItem && currentItem.type === 'bow') {
            if (drawTime >= 0.12) {
              const arrowIdx = this.hotbar.findIndex(s => s && (s.type === 'arrow' || (s.id && s.id.startsWith('arrow'))) && s.count > 0);
              if (arrowIdx !== -1) {
                this.hotbar[arrowIdx].count--;
                if (this.hotbar[arrowIdx].count <= 0) {
                  this.hotbar[arrowIdx] = null;
                }
                this.updateHUD();

                const charge = Math.min(1.0, drawTime / 0.85);
                const origin = new THREE.Vector3(
                  this.position.x,
                  this.position.y + this.eyeHeight,
                  this.position.z
                );
                const dir = new THREE.Vector3(
                  -Math.sin(this.yaw) * Math.cos(this.pitch),
                  Math.sin(this.pitch),
                  -Math.cos(this.yaw) * Math.cos(this.pitch)
                ).normalize();

                this.shootArrow(origin, dir, currentItem, charge);
                if (window.soundManager && typeof window.soundManager.playBowShoot === 'function') {
                  window.soundManager.playBowShoot();
                }
              }
            }
          }
          this.updateHeldItemVisual();
        }
      }
    };

    this._onContextMenu = e => {
      e.preventDefault();
      return false;
    };

    this._onPointerLockChange = () => {
      this.isRightMouseDown = false;
      this.stopMining();
    };

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('wheel', this._onWheel, { passive: false });
    window.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('mouseup', this._onMouseUp);
    window.addEventListener('contextmenu', this._onContextMenu);
    document.addEventListener('pointerlockchange', this._onPointerLockChange);
  }

  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('wheel', this._onWheel);
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('mousedown', this._onMouseDown);
    window.removeEventListener('mouseup', this._onMouseUp);
    window.removeEventListener('contextmenu', this._onContextMenu);
    document.removeEventListener('pointerlockchange', this._onPointerLockChange);

    if (this.handGroup && this.camera) {
      this.camera.remove(this.handGroup);
    }
  }

  selectSlot(index) {
    if (index >= 0 && index < 9) {
      const prev = this.selectedSlot;
      this.selectedSlot = index;
      if (prev !== index && window.soundManager && typeof window.soundManager.playSlotChange === 'function') {
        window.soundManager.playSlotChange();
      }
      this.updateHeldItemVisual();
      this.updateHUD();
    }
  }

  triggerSwing() {
    if (this.isSwinging) return;
    this.isSwinging = true;
    this.swingProgress = 0;
    window.soundManager.playSwing();

    // Spawn dynamic blade slash arc VFX for held weapon
    const currentItem = this.hotbar[this.selectedSlot];
    if (currentItem && currentItem.type === 'weapon' && window.WeaponModelBuilder) {
      if (this.activeSlashArc && this.activeSlashArc.parent) {
        this.activeSlashArc.parent.remove(this.activeSlashArc);
      }
      this.activeSlashArc = window.WeaponModelBuilder.createSlashArcMesh(currentItem.id);
      this.camera.add(this.activeSlashArc);
    }
  }

  startAttackOrMine() {
    this.triggerSwing();

    // Check entity attack first (Bot)
    const dir = new THREE.Vector3(
      -Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * Math.cos(this.pitch)
    ).normalize();

    const origin = new THREE.Vector3(
      this.position.x,
      this.position.y + this.eyeHeight,
      this.position.z
    );

    // Check hit on enemy Bots
    const botList = (window.game && window.game.bots && window.game.bots.length > 0) ?
      window.game.bots : (window.bot ? [window.bot] : []);

    let closestBot = null;
    let closestDist = 3.8;

    for (const b of botList) {
      if (!b || b.isDead || b.team === 'red') continue; // Do not attack friendly teammates!
      const toBot = new THREE.Vector3().subVectors(b.position, origin);
      const dist = toBot.length();
      if (dist < closestDist) {
        toBot.normalize();
        const dot = dir.dot(toBot);
        if (dot > 0.82) {
          closestDist = dist;
          closestBot = b;
        }
      }
    }

    if (closestBot) {
      let dmg = 2;
      const held = this.hotbar[this.selectedSlot];
      if (held && held.type === 'weapon') {
        dmg = held.damage;
      }
      const sharpnessBonus = (window.game && window.game.teamUpgrades && window.game.teamUpgrades.red) ? window.game.teamUpgrades.red.sharpness : 0;
      dmg += sharpnessBonus;

      // Jump-Crit: attacking while falling downward deals 1.5x damage!
      const isCrit = (this.velocity.y < -0.3 && !this.onGround);
      if (isCrit) {
        dmg = Math.round(dmg * 1.5);
        window.soundManager.playDing();
        if (this.world.spawnCritParticles) {
          this.world.spawnCritParticles(closestBot.position);
        }
      } else {
        window.soundManager.playHit();
      }

      // Spawn sharp metallic hit sparks
      if (window.WeaponModelBuilder && typeof window.WeaponModelBuilder.spawnHitSparks === 'function') {
        const sparkColor = (held && held.id === 'sword_diamond') ? 0x00f5ff :
                           (held && held.id === 'sword_iron') ? 0xffffff :
                           (held && held.id === 'sword_stone') ? 0xcbd5e1 : 0xfde68a;
        window.WeaponModelBuilder.spawnHitSparks(this.world, closestBot.position, sparkColor);
      }

      this.lastAttackTime = performance.now();
      closestBot.takeDamage(dmg, dir, '玩家');
      return;
    }

    // Check block mining
    const ray = this.world.raycast(origin, dir, 4.5);
    if (ray.hit) {
      const block = ray.block;
      // Friendly bed protection check
      if (block.type === 'BED_RED') {
        window.game.addChatMessage('§c你不能破坏自己队伍的床！');
        return;
      }

      if (!block.canBreak) {
        window.game.addChatMessage('§7该地图方块无法破坏！');
        return;
      }

      this.isMining = true;
      this.miningBlock = block;
      this.miningTimer = 0;

      // Determine mining time based on block and tool
      const held = this.hotbar[this.selectedSlot];
      if (block.type.startsWith('BED_')) {
        this.requiredMineTime = 0.8;
      } else if (block.type.includes('WOOL')) {
        this.requiredMineTime = (held && held.id === 'shears') ? 0.1 : 0.35;
      } else if (block.type === 'OAK_PLANKS') {
        this.requiredMineTime = 0.9;
      } else if (block.type === 'END_STONE') {
        this.requiredMineTime = 1.3;
      } else if (block.type === 'OBSIDIAN') {
        this.requiredMineTime = 3.5;
      } else {
        this.requiredMineTime = 0.5;
      }

      const bar = document.getElementById('break-progress');
      if (bar) bar.style.display = 'block';
    }
  }

  stopMining() {
    this.isMining = false;
    this.miningBlock = null;
    this.miningTimer = 0;
    const bar = document.getElementById('break-progress');
    if (bar) bar.style.display = 'none';
  }

  handleRightClick() {
    const origin = new THREE.Vector3(
      this.position.x,
      this.position.y + this.eyeHeight,
      this.position.z
    );

    const dir = new THREE.Vector3(
      -Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * Math.cos(this.pitch)
    ).normalize();

    // 1. Check Villager shopkeeper interaction
    if (window.shopManager && window.shopManager.checkVillagerInteract(origin, dir)) {
      window.shopManager.openShop();
      return;
    }

    const currentItem = this.hotbar[this.selectedSlot];
    if (!currentItem) return;

    // 2. Usable Items (Golden Apple, Fireball, Ender Pearl, Enchanted Apple, Potions)
    if (currentItem.type === 'potion' || (currentItem.id && currentItem.id.startsWith('potion_'))) {
      this.drinkPotion(currentItem, 'hotbar', this.selectedSlot);
      return;
    } else if (currentItem.id === 'golden_apple') {
      if (this.health < this.maxHealth) {
        this.health = Math.min(this.maxHealth, this.health + 6);
        this.consumeHeldItem();
        window.soundManager.playPickup();
        window.game.addChatMessage('§a你吃下了金苹果，生命值已恢复！');
        this.updateHUD();
        return;
      }
    } else if (currentItem.id === 'enchanted_golden_apple') {
      this.health = 20;
      this.consumeHeldItem();
      if (window.soundManager && typeof window.soundManager.playDing === 'function') {
        window.soundManager.playDing();
      }
      window.game.addChatMessage('§d★ 你吃下了附魔金苹果！生命值已完全恢复并获得神圣祝福！');
      this.updateHUD();
      return;
    } else if (currentItem.id === 'fireball') {
      this.consumeHeldItem();
      this.shootFireball(origin, dir);
      return;
    } else if (currentItem.id === 'ender_pearl') {
      this.consumeHeldItem();
      this.throwEnderPearl(origin, dir);
      return;
    }

    // 3. Block placement
    if (currentItem.type === 'block') {
      let placeTarget = null;
      const standingBx = Math.floor(this.position.x + 0.5);
      const standingBz = Math.floor(this.position.z + 0.5);
      const standingBy = Math.floor(this.position.y - 0.5 + 0.5);

      // Attempt A: Raycast to existing block face
      const ray = this.world.raycast(origin, dir, 5.0);
      if (ray.hit && ray.placePos) {
        const isStandingOnHit = (ray.block.x === standingBx && ray.block.z === standingBz && ray.block.y === standingBy);

        if (isStandingOnHit && ray.normal && ray.normal.y > 0) {
          // Player is looking down towards edge of own floor block - bridge horizontally
          const edgePos = this.getBridgingTarget(standingBx, standingBy, standingBz, dir);
          if (edgePos && !this.world.getBlock(edgePos.x, edgePos.y, edgePos.z)) {
            placeTarget = edgePos;
          } else {
            placeTarget = ray.placePos;
          }
        } else {
          placeTarget = ray.placePos;
        }
      } else {
        // Attempt B: Edge / Scaffold bridging when looking down towards void
        const groundBlock = this.world.getBlock(standingBx, standingBy, standingBz);
        if (groundBlock && dir.y < -0.1) {
          const edgePos = this.getBridgingTarget(standingBx, standingBy, standingBz, dir);
          if (edgePos && !this.world.getBlock(edgePos.x, edgePos.y, edgePos.z)) {
            placeTarget = edgePos;
          }
        }
      }

      if (placeTarget) {
        const { x, y, z } = placeTarget;

        // Player torso/head collision check: only block if placing inside body
        const halfW = 0.28;
        const pMinX = this.position.x - halfW;
        const pMaxX = this.position.x + halfW;
        const pMinZ = this.position.z - halfW;
        const pMaxZ = this.position.z + halfW;

        const bMinX = x - 0.5, bMaxX = x + 0.5;
        const bMinY = y - 0.5, bMaxY = y + 0.5;
        const bMinZ = z - 0.5, bMaxZ = z + 0.5;

        // Torso/head vertical range: above feet!
        const pBodyMinY = this.position.y + 0.18;
        const pBodyMaxY = this.position.y + this.height - 0.05;

        const overlapsBody = (pMinX < bMaxX && pMaxX > bMinX) &&
                             (pBodyMinY < bMaxY && pBodyMaxY > bMinY) &&
                             (pMinZ < bMaxZ && pMaxZ > bMinZ);

        if (!overlapsBody && !this.world.getBlock(x, y, z)) {
          this.world.setBlock(x, y, z, currentItem.blockType, true, 'red');
          window.soundManager.playPlace();
          this.consumeHeldItem();
          this.triggerSwing();
        }
      }
    }
  }

  getBridgingTarget(standingBx, standingBy, standingBz, dir) {
    let stepX = 0;
    let stepZ = 0;

    // 1. If player is moving horizontally, bridge in movement direction
    if (Math.hypot(this.velocity.x, this.velocity.z) > 0.3) {
      if (Math.abs(this.velocity.x) > 0.35) stepX = Math.sign(this.velocity.x);
      if (Math.abs(this.velocity.z) > 0.35) stepZ = Math.sign(this.velocity.z);
    }

    // 2. If standing still or diagonal move, look at horizontal facing direction
    if (stepX === 0 && stepZ === 0) {
      const absDirX = Math.abs(dir.x);
      const absDirZ = Math.abs(dir.z);

      if (absDirX > 0.38) stepX = Math.sign(dir.x);
      if (absDirZ > 0.38) stepZ = Math.sign(dir.z);

      if (stepX === 0 && stepZ === 0) {
        if (absDirX >= absDirZ) {
          stepX = Math.sign(dir.x) || 1;
        } else {
          stepZ = Math.sign(dir.z) || 1;
        }
      }
    }

    return {
      x: standingBx + stepX,
      y: standingBy,
      z: standingBz + stepZ
    };
  }

  shootFireball(origin, dir) {
    this.lastAttackTime = performance.now();
    window.soundManager.playSwing();
    const fbMesh = (window.WeaponModelBuilder && typeof window.WeaponModelBuilder.createFireball === 'function') ?
      window.WeaponModelBuilder.createFireball({ isProjectile: true }) :
      new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff4500 }));
    fbMesh.position.copy(origin).addScaledVector(dir, 0.5);
    this.scene.add(fbMesh);

    const speed = 20.0;
    const velocity = dir.clone().multiplyScalar(speed);
    const spawnTime = performance.now();

    const animateFireball = () => {
      const dt = 0.016;
      fbMesh.position.addScaledVector(velocity, dt);
      fbMesh.rotation.x += 8.0 * dt;
      fbMesh.rotation.y += 12.0 * dt;

      // Check collision with blocks or Bot
      const bx = Math.round(fbMesh.position.x);
      const by = Math.round(fbMesh.position.y);
      const bz = Math.round(fbMesh.position.z);

      const block = this.world.getBlock(bx, by, bz);
      let hitBot = false;
      const botList = (window.game && window.game.bots) ? window.game.bots : (window.bot ? [window.bot] : []);
      for (const b of botList) {
        if (!b || b.isDead || b.team === 'red') continue;
        if (fbMesh.position.distanceTo(b.position) < 1.6) {
          hitBot = true;
          b.takeDamage(10, dir, '玩家的火焰弹');
          break;
        }
      }

      if (block || hitBot || (performance.now() - spawnTime > 4000)) {
        // Explode
        window.soundManager.playExplosion();
        if (window.WeaponModelBuilder && typeof window.WeaponModelBuilder.spawnHitSparks === 'function') {
          window.WeaponModelBuilder.spawnHitSparks(this.world, fbMesh.position, 0xff4500);
        }
        if (this.world && typeof this.world.spawnCritParticles === 'function') {
          this.world.spawnCritParticles(fbMesh.position);
        }
        this.scene.remove(fbMesh);

        // Break nearby wool blocks
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
      requestAnimationFrame(animateFireball);
    };
    requestAnimationFrame(animateFireball);
  }

  throwEnderPearl(origin, dir) {
    if (window.soundManager && typeof window.soundManager.playSwing === 'function') {
      window.soundManager.playSwing();
    }

    const pearlMesh = (window.WeaponModelBuilder && typeof window.WeaponModelBuilder.createEnderPearl === 'function') ?
      window.WeaponModelBuilder.createEnderPearl({ isProjectile: true }) :
      new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), new THREE.MeshBasicMaterial({ color: 0x145a43 }));

    // Spawn slightly ahead in look direction
    pearlMesh.position.copy(origin).addScaledVector(dir, 0.6);
    this.scene.add(pearlMesh);

    // Initial velocity: speed 26 blocks/s, with upward arc boost of 2.2 blocks/s
    const speed = 26.0;
    const velocity = dir.clone().multiplyScalar(speed);
    velocity.y += 2.2;

    const gravity = 15.0; // Realistic ballistic arc gravity
    let lifetime = 0;
    const maxLife = 6.0;
    let prevPos = pearlMesh.position.clone();

    // Particle trail pool
    const trailParticles = [];
    const trailGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    const trailMat = new THREE.MeshBasicMaterial({ color: 0x9b59b6 });

    const animatePearl = () => {
      if (this.isDead) {
        this.scene.remove(pearlMesh);
        trailParticles.forEach(p => this.scene.remove(p.mesh));
        return;
      }

      const dt = 0.016;
      lifetime += dt;

      // Gravity acceleration
      velocity.y -= gravity * dt;

      // Track previous position for continuous swept segment collision
      prevPos.copy(pearlMesh.position);
      pearlMesh.position.addScaledVector(velocity, dt);

      // Spin pearl
      pearlMesh.rotation.x += 8.0 * dt;
      pearlMesh.rotation.y += 12.0 * dt;

      // Emit trail sparkle particles
      if (Math.random() < 0.85) {
        const p = new THREE.Mesh(trailGeo, trailMat);
        p.position.copy(pearlMesh.position).add(
          new THREE.Vector3((Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2)
        );
        this.scene.add(p);
        trailParticles.push({ mesh: p, life: 0, maxLife: 0.3 });
      }

      // Update trail particles
      for (let i = trailParticles.length - 1; i >= 0; i--) {
        const tp = trailParticles[i];
        tp.life += dt;
        tp.mesh.scale.multiplyScalar(0.92);
        if (tp.life >= tp.maxLife) {
          this.scene.remove(tp.mesh);
          trailParticles.splice(i, 1);
        }
      }

      // Swept line segment collision check against world voxel blocks
      const stepVec = pearlMesh.position.clone().sub(prevPos);
      const stepLen = stepVec.length();
      const numSteps = Math.max(3, Math.ceil(stepLen / 0.2));
      const subStep = stepVec.clone().divideScalar(numSteps);

      let hitBlock = null;
      let hitCoord = null;
      let hitNormal = new THREE.Vector3(0, 1, 0);

      const checkPoint = prevPos.clone();
      for (let s = 1; s <= numSteps; s++) {
        checkPoint.add(subStep);
        const bx = Math.floor(checkPoint.x + 0.5);
        const by = Math.floor(checkPoint.y + 0.5);
        const bz = Math.floor(checkPoint.z + 0.5);
        const b = this.world.getBlock(bx, by, bz);
        if (b) {
          hitBlock = b;
          hitCoord = { x: bx, y: by, z: bz };
          const airPrev = checkPoint.clone().sub(subStep);
          const pbx = Math.floor(airPrev.x + 0.5);
          const pby = Math.floor(airPrev.y + 0.5);
          const pbz = Math.floor(airPrev.z + 0.5);
          hitNormal.set(pbx - bx, pby - by, pbz - bz);
          if (hitNormal.lengthSq() === 0) hitNormal.set(0, 1, 0);
          break;
        }
      }

      if (hitBlock) {
        // Impact with terrain or island block
        this.scene.remove(pearlMesh);
        trailParticles.forEach(p => this.scene.remove(p.mesh));

        // Determine destination:
        // When landing on a surface or cliff
        let targetX = hitCoord.x;
        let targetY = hitCoord.y + 0.55;
        let targetZ = hitCoord.z;

        if (hitNormal.y < 0) {
          // Bottom face hit
          targetY = hitCoord.y - 1.8;
          targetX = hitCoord.x + hitNormal.x * 0.8;
          targetZ = hitCoord.z + hitNormal.z * 0.8;
        } else if (hitNormal.y === 0) {
          // Side face hit - land at adjacent air block column
          targetX = hitCoord.x + hitNormal.x * 0.75;
          targetZ = hitCoord.z + hitNormal.z * 0.75;
          targetY = hitCoord.y + 0.55;
        }

        // Teleport the player!
        this.position.set(targetX, targetY, targetZ);
        this.velocity.set(0, 0, 0);
        this.onGround = true;

        // Ender recoil damage (4 damage = 2 hearts in Minecraft)
        this.health = Math.max(1, this.health - 4);
        this.updateHUD();

        // Audio
        if (window.soundManager) {
          if (typeof window.soundManager.playTeleport === 'function') {
            window.soundManager.playTeleport();
          } else if (typeof window.soundManager.playDing === 'function') {
            window.soundManager.playDing();
          }
        }

        // Particle burst
        this.spawnEnderTeleportParticles(this.position);
        window.game.addChatMessage('§5[末影珍珠] 空间折跃成功！');
        return;
      }

      // Void / Lifetime check
      if (pearlMesh.position.y < -22 || lifetime > maxLife) {
        this.scene.remove(pearlMesh);
        trailParticles.forEach(p => this.scene.remove(p.mesh));
        window.game.addChatMessage('§7[末影珍珠] 珍珠坠入虚空，未命中目标。');
        return;
      }

      requestAnimationFrame(animatePearl);
    };

    requestAnimationFrame(animatePearl);
  }

  spawnEnderTeleportParticles(pos) {
    const pGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    const pMat = new THREE.MeshBasicMaterial({ color: 0x9b59b6 });
    for (let i = 0; i < 18; i++) {
      const p = new THREE.Mesh(pGeo, pMat);
      p.position.set(
        pos.x + (Math.random() - 0.5) * 0.8,
        pos.y + 0.8 + (Math.random() - 0.5) * 1.2,
        pos.z + (Math.random() - 0.5) * 0.8
      );
      this.scene.add(p);
      const vx = (Math.random() - 0.5) * 4.2;
      const vy = Math.random() * 3.2 + 1.2;
      const vz = (Math.random() - 0.5) * 4.2;
      let life = 0;
      const maxLife = 0.45;

      const anim = () => {
        life += 0.016;
        p.position.x += vx * 0.016;
        p.position.y += vy * 0.016;
        p.position.z += vz * 0.016;
        p.scale.multiplyScalar(0.92);
        if (life < maxLife) {
          requestAnimationFrame(anim);
        } else {
          this.scene.remove(p);
        }
      };
      requestAnimationFrame(anim);
    }
  }

  shootArrow(origin, dir, bowItem, charge) {
    this.lastAttackTime = performance.now();
    // 3D Arrow Model
    const arrowGroup = new THREE.Group();

    // Wooden shaft
    const shaftGeo = new THREE.BoxGeometry(0.04, 0.04, 0.70);
    const shaftMat = new THREE.MeshLambertMaterial({ color: 0xc19a6b });
    const shaft = new THREE.Mesh(shaftGeo, shaftMat);
    arrowGroup.add(shaft);

    // Arrowhead (steel tip)
    const tipGeo = new THREE.ConeGeometry(0.065, 0.15, 4);
    const tipMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
    const tip = new THREE.Mesh(tipGeo, tipMat);
    tip.rotation.x = -Math.PI / 2;
    tip.position.set(0, 0, -0.42);
    arrowGroup.add(tip);

    // Feather fletching (crossed white fins)
    const fletchMat = new THREE.MeshBasicMaterial({ color: 0xf3f4f6 });
    const fletch1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.015, 0.15), fletchMat);
    fletch1.position.set(0, 0, 0.25);
    arrowGroup.add(fletch1);
    const fletch2 = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.12, 0.15), fletchMat);
    fletch2.position.set(0, 0, 0.25);
    arrowGroup.add(fletch2);

    // Initial position & orientation
    arrowGroup.position.copy(origin).addScaledVector(dir, 0.6);
    this.scene.add(arrowGroup);

    // Ballistic velocity
    const speed = 20.0 + charge * 28.0; // 20 m/s ~ 48 m/s
    const velocity = dir.clone().multiplyScalar(speed);
    velocity.y += 0.7 * charge; // Subtle loft

    const forwardAxis = new THREE.Vector3(0, 0, -1);
    arrowGroup.quaternion.setFromUnitVectors(forwardAxis, velocity.clone().normalize());

    const gravity = 11.5;
    let lifetime = 0;
    const maxLife = 5.5;
    let prevPos = arrowGroup.position.clone();
    let isStuck = false;

    const animateArrow = () => {
      if (this.isDead || isStuck) return;

      const dt = 0.016;
      lifetime += dt;

      // Gravity acceleration
      velocity.y -= gravity * dt;

      prevPos.copy(arrowGroup.position);
      arrowGroup.position.addScaledVector(velocity, dt);

      // Align arrow heading along current velocity tangent
      const curDir = velocity.clone().normalize();
      if (curDir.lengthSq() > 0.001) {
        arrowGroup.quaternion.setFromUnitVectors(forwardAxis, curDir);
      }

      // Crit trail if charged >= 0.8
      if (charge >= 0.8 && Math.random() < 0.6) {
        if (this.world && typeof this.world.spawnCritParticles === 'function') {
          this.world.spawnCritParticles(arrowGroup.position);
        }
      }

      // Check Bot Hit
      const botList = (window.game && window.game.bots) ? window.game.bots : (window.bot ? [window.bot] : []);
      for (const bot of botList) {
        if (!bot || bot.isDead || bot.team === 'red') continue;
        const botChest = bot.position.clone().add(new THREE.Vector3(0, 1.0, 0));
        if (arrowGroup.position.distanceTo(botChest) < 1.25) {
          // Hit Bot!
          isStuck = true;
          this.scene.remove(arrowGroup);

          // Calculate Damage
          let dmg = Math.round(4 + charge * 6); // Default 4 to 10
          if (bowItem.bowType === 'power') {
            dmg = Math.round(6 + charge * 8); // Power I: 6 to 14
          }

          // Knockback
          const knockbackDir = dir.clone().normalize();
          if (bowItem.bowType === 'punch') {
            // Punch I: Massive knockback to knock enemies off bridges!
            knockbackDir.multiplyScalar(2.6);
            bot.velocity.add(dir.clone().multiplyScalar(9.5));
            bot.velocity.y = 3.6;
          }

          bot.takeDamage(dmg, knockbackDir, '玩家的弓箭');

          // Confirmation sounds & message
          if (window.soundManager) {
            if (typeof window.soundManager.playArrowDing === 'function') {
              window.soundManager.playArrowDing();
            } else if (typeof window.soundManager.playDing === 'function') {
              window.soundManager.playDing();
            }
          }

          window.game.addChatMessage(`§6[弓箭命中] §f精准射中 §e${bot.name}§f！造成 §c${dmg} §f点伤害！`);

          if (this.world && typeof this.world.spawnCritParticles === 'function') {
            this.world.spawnCritParticles(arrowGroup.position);
          }
          return;
        }
      }

      // Check Voxel World Block Collision
      const stepVec = arrowGroup.position.clone().sub(prevPos);
      const stepLen = stepVec.length();
      const numSteps = Math.max(2, Math.ceil(stepLen / 0.25));
      const subStep = stepVec.clone().divideScalar(numSteps);

      let hitBlock = false;
      const testPoint = prevPos.clone();
      for (let s = 1; s <= numSteps; s++) {
        testPoint.add(subStep);
        const bx = Math.floor(testPoint.x + 0.5);
        const by = Math.floor(testPoint.y + 0.5);
        const bz = Math.floor(testPoint.z + 0.5);
        if (this.world.getBlock(bx, by, bz)) {
          hitBlock = true;
          arrowGroup.position.copy(testPoint);
          break;
        }
      }

      if (hitBlock) {
        // Arrow sticks into the block
        isStuck = true;
        if (window.soundManager && typeof window.soundManager.playArrowHit === 'function') {
          window.soundManager.playArrowHit();
        }
        // Fade out and remove stuck arrow after 3.5s
        setTimeout(() => {
          this.scene.remove(arrowGroup);
        }, 3500);
        return;
      }

      // Void or lifetime timeout
      if (arrowGroup.position.y < -22 || lifetime > maxLife) {
        this.scene.remove(arrowGroup);
        return;
      }

      requestAnimationFrame(animateArrow);
    };

    requestAnimationFrame(animateArrow);
  }

  consumeHeldItem() {
    const item = this.hotbar[this.selectedSlot];
    if (!item) return;
    item.count--;
    if (item.count <= 0) {
      this.hotbar[this.selectedSlot] = null;
    }
    this.updateHeldItemVisual();
    this.updateHUD();
  }

  dropItem() {
    if (this.isDead) return;
    if (this.backpackIsOpen && this.selectedBackpackSlot) {
      this.dropSelectedItem();
      return;
    }
    const currentItem = this.hotbar[this.selectedSlot];
    let dropType = null;

    if (currentItem) {
      if (currentItem.id === 'red_wool') {
        dropType = 'wool';
      } else if (currentItem.id === 'golden_apple') {
        dropType = 'gapple';
      } else if (currentItem.type === 'potion' || (currentItem.id && currentItem.id.startsWith('potion_'))) {
        dropType = currentItem.id;
      }
      if (dropType) {
        currentItem.count = (currentItem.count || 1) - 1;
        if (currentItem.count <= 0) {
          this.hotbar[this.selectedSlot] = null;
        }
        this.updateHeldItemVisual();
        this.updateHUD();
      }
    }

    if (!dropType) {
      // If no droppable hotbar item, drop minerals if player has any (emerald -> diamond -> gold -> iron)
      if (this.resources.emerald > 0) {
        this.resources.emerald--;
        dropType = 'emerald';
      } else if (this.resources.diamond > 0) {
        this.resources.diamond--;
        dropType = 'diamond';
      } else if (this.resources.gold > 0) {
        this.resources.gold--;
        dropType = 'gold';
      } else if (this.resources.iron > 0) {
        this.resources.iron--;
        dropType = 'iron';
      }
      this.updateHUD();
    }

    if (dropType && window.game && window.game.generatorManager) {
      const forward = new THREE.Vector3(
        -Math.sin(this.yaw) * Math.cos(this.pitch),
        Math.sin(this.pitch),
        -Math.cos(this.yaw) * Math.cos(this.pitch)
      ).normalize();
      const dropPos = this.position.clone().add(forward.multiplyScalar(1.2));
      window.game.generatorManager.spawnItem(dropType, dropPos.x, dropPos.y + 0.5, dropPos.z);
      if (window.soundManager && typeof window.soundManager.playPlace === 'function') {
        window.soundManager.playPlace();
      }
    }
  }

  addResource(type, amount) {
    if (this.resources[type] !== undefined) {
      this.resources[type] += amount;
      this.updateHUD();
      if (this.backpackIsOpen) this.renderBackpack();
    } else if (type === 'wool') {
      this.addItem({ id: 'red_wool', name: '红色羊毛', type: 'block', blockType: 'RED_WOOL', count: 16 * amount });
    } else if (type === 'gapple') {
      this.addItem({ id: 'golden_apple', name: '金苹果', type: 'utility', count: amount });
    } else if (type.startsWith('potion')) {
      const potionNames = {
        potion_speed: '迅捷药水 II (45秒)',
        potion_jump: '跳跃药水 V (45秒)',
        potion_invisibility: '隐形药水 (30秒)',
        potion_regen: '恢复药水 (30秒)'
      };
      this.addItem({
        id: type,
        name: potionNames[type] || '魔法药水',
        type: 'potion',
        potionType: type.replace('potion_', ''),
        count: amount
      });
    }
  }

  addItem(newItem) {
    // 1. If weapon and slot 0 is empty or weaker weapon, place/upgrade in slot 0
    if (newItem.type === 'weapon') {
      if (!this.hotbar[0] || (this.hotbar[0].damage || 0) < (newItem.damage || 0)) {
        this.hotbar[0] = newItem;
        this.updateHeldItemVisual();
        this.updateHUD();
        if (this.backpackIsOpen) this.renderBackpack();
        return true;
      }
    }

    // 2. Try to stack with existing
    const isStackable = (newItem.type === 'block' || newItem.type === 'arrow' || (newItem.id && newItem.id.startsWith('arrow')) || newItem.type === 'potion' || newItem.id === 'golden_apple');
    if (isStackable) {
      for (let i = 0; i < 9; i++) {
        const slot = this.hotbar[i];
        if (slot && (slot.id === newItem.id || (newItem.type === 'arrow' && slot.type === 'arrow'))) {
          slot.count = (slot.count || 1) + (newItem.count || 1);
          this.updateHUD();
          if (this.backpackIsOpen) this.renderBackpack();
          return true;
        }
      }
      for (let i = 0; i < 27; i++) {
        const slot = this.backpack[i];
        if (slot && (slot.id === newItem.id || (newItem.type === 'arrow' && slot.type === 'arrow'))) {
          slot.count = (slot.count || 1) + (newItem.count || 1);
          this.updateHUD();
          if (this.backpackIsOpen) this.renderBackpack();
          return true;
        }
      }
    }

    // 3. Find first empty slot in hotbar (0..8)
    for (let i = 0; i < 9; i++) {
      if (!this.hotbar[i]) {
        this.hotbar[i] = newItem;
        this.updateHeldItemVisual();
        this.updateHUD();
        if (this.backpackIsOpen) this.renderBackpack();
        return true;
      }
    }

    // 4. Find first empty slot in backpack (0..26)
    for (let i = 0; i < 27; i++) {
      if (!this.backpack[i]) {
        this.backpack[i] = newItem;
        this.updateHUD();
        if (this.backpackIsOpen) this.renderBackpack();
        return true;
      }
    }

    // 5. Total 36 slots full: drop on ground
    if (window.game && window.game.generatorManager) {
      const dropPos = this.position.clone().add(new THREE.Vector3(0, 0.5, 0));
      window.game.generatorManager.spawnItem(newItem.id, dropPos.x, dropPos.y, dropPos.z);
    }
    return false;
  }

  takeDamage(amount, knockbackDir = null) {
    if (this.isDead) return;

    // Apply armor reduction
    let reduction = 0;
    if (this.armorTier === 'chain') reduction = 0.3;
    else if (this.armorTier === 'iron') reduction = 0.5;
    else if (this.armorTier === 'diamond') reduction = 0.65;

    const protLevel = (window.game && window.game.teamUpgrades && window.game.teamUpgrades.red) ? window.game.teamUpgrades.red.protection : 0;
    reduction = Math.min(0.85, reduction + protLevel * 0.15);

    const actualDamage = Math.max(1, Math.round(amount * (1 - reduction)));
    this.health -= actualDamage;
    window.soundManager.playHit();

    // Red screen flash
    const overlay = document.getElementById('game-container');
    if (overlay) {
      overlay.style.boxShadow = 'inset 0 0 80px rgba(255, 0, 0, 0.7)';
      setTimeout(() => overlay.style.boxShadow = 'none', 180);
    }

    // Apply knockback
    if (knockbackDir) {
      this.velocity.x += knockbackDir.x * 4.5;
      this.velocity.y = 3.2;
      this.velocity.z += knockbackDir.z * 4.5;
    }

    this.updateHUD();

    if (this.health <= 0) {
      this.die('killed');
    }
  }

  die(cause = 'void') {
    if (this.isDead) return;
    this.isDead = true;
    this.health = 0;
    this.stopMining();
    if (this.backpackIsOpen) this.closeBackpack();
    this.effects = { speed: 0, jump: 0, invisibility: 0, regen: 0 };
    this.isInvisible = false;
    if (this.handMesh && this.handMesh.material) {
      this.handMesh.material.transparent = false;
      this.handMesh.material.opacity = 1.0;
    }
    this.updateEffectsHUD();

    if (cause === 'void') {
      window.game.addChatMessage('§c玩家 掉进了虚空！');
    } else {
      window.game.addChatMessage('§c玩家 被 蓝队人机 击杀了！');
    }

    // Check if Red Bed is alive
    if (this.world.bedStatus.red) {
      // Show respawn countdown
      this.respawnTimer = 5;
      const respawnEl = document.getElementById('respawn-overlay');
      const timerEl = document.getElementById('respawn-timer');
      if (respawnEl) respawnEl.style.display = 'flex';
      if (timerEl) timerEl.innerText = `将在 ${this.respawnTimer} 秒后复活...`;

      const countdownInt = setInterval(() => {
        this.respawnTimer--;
        window.soundManager.playBeep();
        if (timerEl) timerEl.innerText = `将在 ${this.respawnTimer} 秒后复活...`;

        if (this.respawnTimer <= 0) {
          clearInterval(countdownInt);
          this.respawn();
        }
      }, 1000);
    } else {
      // Final kill! Red eliminated
      window.game.onFinalKill('red');
    }
  }

  respawn() {
    this.isDead = false;
    this.health = this.maxHealth;
    this.position.set(0, 0.6, 56);
    this.velocity.set(0, 0, 0);

    const respawnEl = document.getElementById('respawn-overlay');
    if (respawnEl) respawnEl.style.display = 'none';

    this.updateHUD();
    window.game.addChatMessage('§a你已复活！准备战斗！');
  }

  update(dt) {
    if (this.isDead) return;

    // Bow charge FOV zoom & holding animation
    if (this.isDrawingBow) {
      this.bowDrawTime += dt;
      const charge = Math.min(1.0, this.bowDrawTime / 0.85);
      this.camera.fov = 75 - charge * 11;
      this.camera.updateProjectionMatrix();
    }

    // 1. Potion Effects & Mining Progress Update
    this.updateEffects(dt);

    if (this.isMining && this.miningBlock) {
      this.miningTimer += dt;
      const pct = Math.min(100, Math.floor((this.miningTimer / this.requiredMineTime) * 100));
      const fill = document.getElementById('break-progress-fill');
      if (fill) fill.style.width = `${pct}%`;

      if (this.miningTimer >= this.requiredMineTime) {
        // Complete break
        this.world.removeBlock(this.miningBlock.x, this.miningBlock.y, this.miningBlock.z);
        this.stopMining();
      }
    }

    // Continuous block placing when holding right click
    if (this.isRightMouseDown) {
      this.placeCooldown -= dt;
      if (this.placeCooldown <= 0) {
        this.placeCooldown = 0.22;
        this.handleRightClick();
      }
    } else {
      this.placeCooldown = 0;
    }

    // 2. Hand Animations (Dynamic 3D Slash & Walking Bobbing)
    if (this.isSwinging) {
      this.swingProgress += dt * 8.0;
      if (this.swingProgress >= Math.PI) {
        this.isSwinging = false;
        this.swingProgress = 0;
        this.handGroup.rotation.set(0.1, -0.2, 0);
        this.handGroup.position.set(0.35, -0.32, -0.55);
        if (this.activeSlashArc && this.activeSlashArc.parent) {
          this.activeSlashArc.parent.remove(this.activeSlashArc);
          this.activeSlashArc = null;
        }
      } else {
        const sin = Math.sin(this.swingProgress);
        // Multi-axis 3D dynamic slash trajectory
        this.handGroup.rotation.x = 0.1 + sin * 0.85;
        this.handGroup.rotation.y = -0.2 - sin * 0.45;
        this.handGroup.rotation.z = -sin * 0.35;
        this.handGroup.position.x = 0.35 - sin * 0.08;
        this.handGroup.position.y = -0.32 - sin * 0.06;
        this.handGroup.position.z = -0.55 - sin * 0.10;

        // Animate slash arc fade in & out
        if (this.activeSlashArc && this.activeSlashArc.children) {
          const arcOpacity = Math.max(0, Math.sin(this.swingProgress) * 0.85);
          for (let i = 0; i < this.activeSlashArc.children.length; i++) {
            const c = this.activeSlashArc.children[i];
            if (c.material) c.material.opacity = arcOpacity;
          }
        }
      }
    }

    // 3. Movement Calculations
    const forwardX = -Math.sin(this.yaw);
    const forwardZ = -Math.cos(this.yaw);
    const rightX = Math.cos(this.yaw);
    const rightZ = -Math.sin(this.yaw);

    let moveX = 0;
    let moveZ = 0;

    if (this.keys.forward) { moveX += forwardX; moveZ += forwardZ; }
    if (this.keys.backward) { moveX -= forwardX; moveZ -= forwardZ; }
    if (this.keys.left) { moveX -= rightX; moveZ -= rightZ; }
    if (this.keys.right) { moveX += rightX; moveZ += rightZ; }

    // Support smooth 360-degree analog touch joystick input
    if (this.touchMoveVector && (this.touchMoveVector.x !== 0 || this.touchMoveVector.z !== 0)) {
      moveX += forwardX * this.touchMoveVector.z + rightX * this.touchMoveVector.x;
      moveZ += forwardZ * this.touchMoveVector.z + rightZ * this.touchMoveVector.x;
    }

    const moveLen = Math.hypot(moveX, moveZ);
    let moveSpeed = this.keys.sneak ? this.sneakSpeed : this.walkSpeed;
    if (this.effects.speed > 0) {
      moveSpeed *= (this.keys.sneak ? 1.25 : 1.40);
    }
    const speed = moveSpeed;

    if (moveLen > 0.001) {
      moveX = (moveX / moveLen) * speed;
      moveZ = (moveZ / moveLen) * speed;

      // Bobbing
      this.bobbingTimer += dt * 10.0;
      this.handGroup.position.y = -0.32 + Math.sin(this.bobbingTimer) * 0.02;
    } else {
      this.handGroup.position.y = -0.32;
    }

    // Apply horizontal acceleration smoothly
    this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, moveX, dt * 12.0);
    this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, moveZ, dt * 12.0);

    // Dynamic Speed FOV when not drawing bow
    if (!this.isDrawingBow) {
      const targetFov = (this.effects.speed > 0) ? 82 : 75;
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, dt * 6.0);
      this.camera.updateProjectionMatrix();
    }

    // Jump
    if (this.keys.jump && this.onGround) {
      let jf = this.jumpForce;
      if (this.effects.jump > 0) {
        jf *= 1.32;
      }
      this.velocity.y = jf;
      this.onGround = false;
    }

    // Gravity
    this.velocity.y -= this.gravity * dt;

    // 4. Collision Detection & Resolution with Voxel World
    this.moveWithCollision(dt);

    // 5. Void threshold check
    if (this.position.y < -18) {
      this.die('void');
    }

    // 6. Villager Look-at Hint
    const hintEl = document.getElementById('npc-hint');
    if (hintEl && window.shopManager) {
      const origin = new THREE.Vector3(this.position.x, this.position.y + this.eyeHeight, this.position.z);
      const dir = new THREE.Vector3(
        -Math.sin(this.yaw) * Math.cos(this.pitch),
        Math.sin(this.pitch),
        -Math.cos(this.yaw) * Math.cos(this.pitch)
      ).normalize();
      hintEl.style.display = window.shopManager.checkVillagerInteract(origin, dir) ? 'block' : 'none';
    }

    // 7. Update Camera position & rotation
    this.camera.position.set(
      this.position.x,
      this.position.y + this.eyeHeight,
      this.position.z
    );

    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  moveWithCollision(dt) {
    const halfW = 0.25; // Compact AABB for agile movement without getting stuck on corners
    const height = this.height; // 1.8m

    // 1. Vertical Movement & Floor/Ceiling Collision
    const prevY = this.position.y;
    this.position.y += this.velocity.y * dt;
    this.onGround = false;

    const minBx = Math.floor(this.position.x - halfW + 0.5);
    const maxBx = Math.floor(this.position.x + halfW + 0.5);
    const minBz = Math.floor(this.position.z - halfW + 0.5);
    const maxBz = Math.floor(this.position.z + halfW + 0.5);

    if (this.velocity.y <= 0) {
      // Falling down or standing: scan from prevY down to current position.y
      const scanStartY = Math.floor(prevY + 0.3);
      const scanEndY = Math.floor(this.position.y - 0.4);

      for (let by = scanStartY; by >= scanEndY; by--) {
        for (let bx = minBx; bx <= maxBx; bx++) {
          for (let bz = minBz; bz <= maxBz; bz++) {
            const block = this.world.getBlock(bx, by, bz);
            if (block) {
              const topY = (block.type && block.type.startsWith('BED_')) ? (block.y + 0.06) : (block.y + 0.5);
              if (this.position.y <= topY && prevY >= topY - 0.4) {
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
      // Jumping up: check ceiling
      const headY = this.position.y + height;
      const prevHeadY = prevY + height;
      const scanStartY = Math.floor(prevHeadY - 0.2);
      const scanEndY = Math.floor(headY + 0.2);

      for (let by = scanStartY; by <= scanEndY; by++) {
        for (let bx = minBx; bx <= maxBx; bx++) {
          for (let bz = minBz; bz <= maxBz; bz++) {
            const block = this.world.getBlock(bx, by, bz);
            if (block) {
              const bottomY = block.y - 0.5;
              if (headY >= bottomY && prevHeadY <= bottomY + 0.3) {
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

    // 2. Horizontal Movement (Wall Collision, Auto Step-Up & Sneak Edge Guard)
    const bodyMinBy = Math.floor(this.position.y + 0.15 + 0.5);
    const bodyMaxBy = Math.floor(this.position.y + height - 0.1 + 0.5);

    // --- X Axis ---
    const dx = this.velocity.x * dt;
    if (Math.abs(dx) > 0.0001) {
      let canMoveX = true;

      // Sneak edge protection: don't step into empty air when crouching
      if (this.keys.sneak && this.onGround) {
        const nextFootBx = Math.floor(this.position.x + dx + 0.5);
        const curFootBz = Math.floor(this.position.z + 0.5);
        const groundBy = Math.floor(this.position.y - 0.5 + 0.5);
        if (!this.world.getBlock(nextFootBx, groundBy, curFootBz)) {
          canMoveX = false;
          this.velocity.x = 0;
        }
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

        // Auto Step-Up: If grounded and hitting an obstacle, step up if space above is clear
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
            hitWall = false;
          }
        }

        if (!hitWall) {
          this.position.x = targetX;
        } else {
          this.velocity.x = 0;
        }
      }
    }

    // --- Z Axis ---
    const dz = this.velocity.z * dt;
    if (Math.abs(dz) > 0.0001) {
      let canMoveZ = true;

      // Sneak edge protection: don't step into empty air when crouching
      if (this.keys.sneak && this.onGround) {
        const curFootBx = Math.floor(this.position.x + 0.5);
        const nextFootBz = Math.floor(this.position.z + dz + 0.5);
        const groundBy = Math.floor(this.position.y - 0.5 + 0.5);
        if (!this.world.getBlock(curFootBx, groundBy, nextFootBz)) {
          canMoveZ = false;
          this.velocity.z = 0;
        }
      }

      if (canMoveZ) {
        const targetZ = this.position.z + dz;
        const curMinBx = Math.floor(this.position.x - halfW + 0.5);
        const curMaxBx = Math.floor(this.position.x + halfW + 0.5);
        const targetMinBz = Math.floor(targetZ - halfW + 0.5);
        const targetMaxBz = Math.floor(targetZ + halfW + 0.5);

        let hitWall = false;
        for (let bz = targetMinBz; bz <= targetMaxBz; bz++) {
          for (let by = bodyMinBy; by <= bodyMaxBy; by++) {
            for (let bx = curMinBx; bx <= curMaxBx; bx++) {
              if (this.world.getBlock(bx, by, bz)) {
                hitWall = true;
                break;
              }
            }
            if (hitWall) break;
          }
          if (hitWall) break;
        }

        // Auto Step-Up: If grounded and hitting an obstacle, step up if space above is clear
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
            hitWall = false;
          }
        }

        if (!hitWall) {
          this.position.z = targetZ;
        } else {
          this.velocity.z = 0;
        }
      }
    }
  }

  updateHUD() {
    // 1. Health Bar (Hearts)
    const healthEl = document.getElementById('health-container');
    if (healthEl) {
      let heartsHtml = '';
      const totalHearts = 10;
      const currentHearts = Math.ceil(this.health / 2);
      for (let i = 1; i <= totalHearts; i++) {
        if (i <= currentHearts) {
          heartsHtml += '<span class="heart heart-full">❤</span>';
        } else {
          heartsHtml += '<span class="heart heart-empty">❤</span>';
        }
      }
      healthEl.innerHTML = heartsHtml;
    }

    // 2. Armor Bar
    const armorEl = document.getElementById('armor-container');
    if (armorEl) {
      let armorHtml = '';
      const totalIcons = 10;
      let filled = 0;
      if (this.armorTier === 'chain') filled = 3;
      else if (this.armorTier === 'iron') filled = 6;
      else if (this.armorTier === 'diamond') filled = 10;

      for (let i = 1; i <= totalIcons; i++) {
        if (i <= filled) {
          armorHtml += '<span class="armor-icon armor-full">🛡</span>';
        } else {
          armorHtml += '<span class="armor-icon armor-empty">🛡</span>';
        }
      }
      armorEl.innerHTML = armorHtml;
    }

    // 3. Resources Display
    const ironEl = document.getElementById('res-iron-count');
    const goldEl = document.getElementById('res-gold-count');
    const diamondEl = document.getElementById('res-diamond-count');
    const emeraldEl = document.getElementById('res-emerald-count');
    if (ironEl) ironEl.innerText = this.resources.iron;
    if (goldEl) goldEl.innerText = this.resources.gold;
    if (diamondEl) diamondEl.innerText = this.resources.diamond;
    if (emeraldEl) emeraldEl.innerText = this.resources.emerald;

    // 4. Hotbar Slots
    const hotbarEl = document.getElementById('hotbar');
    if (hotbarEl) {
      hotbarEl.innerHTML = '';
      for (let i = 0; i < 9; i++) {
        const item = this.hotbar[i];
        const slotDiv = document.createElement('div');
        slotDiv.className = `hotbar-slot ${i === this.selectedSlot ? 'active' : ''}`;
        slotDiv.dataset.index = i;
        slotDiv.setAttribute('data-index', i);
        slotDiv.setAttribute('data-slot', i);

        const keyDiv = document.createElement('span');
        keyDiv.className = 'slot-key';
        keyDiv.innerText = i + 1;
        slotDiv.appendChild(keyDiv);

        if (item) {
          const img = document.createElement('img');
          img.className = 'slot-icon';
          img.src = TextureGenerator.generateItemDataURL(item.id);
          slotDiv.appendChild(img);

          if (item.count > 1) {
            const countDiv = document.createElement('span');
            countDiv.className = 'slot-count';
            countDiv.innerText = item.count;
            slotDiv.appendChild(countDiv);
          }
        }

        const handleSlotPick = (e) => {
          if (e) {
            e.stopPropagation();
          }
          this.selectSlot(i);
        };
        slotDiv.onclick = handleSlotPick;
        slotDiv.onpointerdown = handleSlotPick;
        hotbarEl.appendChild(slotDiv);
      }
    }

    if (this.backpackIsOpen) {
      this.renderBackpack();
    }
    this.updateEffectsHUD();
  }

  // =========================================================
  // Potion System Methods
  // =========================================================
  hasEffect(name) {
    return this.effects && this.effects[name] > 0;
  }

  isHoldingWeapon() {
    const item = this.hotbar[this.selectedSlot];
    if (!item) return false;
    return item.type === 'weapon' || item.type === 'bow' || (item.id && (item.id.startsWith('sword_') || item.id.startsWith('bow_')));
  }

  drinkPotion(potionItem, location = 'hotbar', slotIndex = this.selectedSlot) {
    if (!potionItem) return;

    const potId = potionItem.id || 'potion_speed';
    const potType = potionItem.potionType || potId.replace('potion_', '');

    if (potType === 'speed') {
      this.effects.speed = 45;
      if (window.soundManager) {
        window.soundManager.playDrink();
        window.soundManager.playPotionSplash();
      }
      if (window.game) window.game.addChatMessage('§b⚡ 你喝下了迅捷药水 II！移速大幅提升 40% (45秒)！');
    } else if (potType === 'jump') {
      this.effects.jump = 45;
      if (window.soundManager) {
        window.soundManager.playDrink();
        window.soundManager.playPotionSplash();
      }
      if (window.game) window.game.addChatMessage('§a🦘 你喝下了跳跃药水 V！跳跃力大幅增强，可跳过2.5格高台 (45秒)！');
    } else if (potType === 'invisibility') {
      this.effects.invisibility = 30;
      this.isInvisible = true;
      if (this.handMesh && this.handMesh.material) {
        this.handMesh.material.transparent = true;
        this.handMesh.material.opacity = 0.35;
      }
      if (window.soundManager) {
        window.soundManager.playDrink();
        window.soundManager.playPotionSplash();
      }
      if (window.game) window.game.addChatMessage('§d👻 你喝下了隐形药水！人机已难以察觉你的踪迹 (30秒)！');
    } else if (potType === 'regen') {
      this.effects.regen = 30;
      this.health = Math.min(this.maxHealth, this.health + 6);
      if (window.soundManager) {
        window.soundManager.playDrink();
        window.soundManager.playPotionSplash();
      }
      if (window.game) window.game.addChatMessage('§c💖 你喝下了恢复药水！生命值立即恢复，并获得持续再生 (30秒)！');
    }

    // Consume 1 from location
    if (location === 'hotbar') {
      this.consumeHeldItem();
    } else if (location === 'backpack') {
      const item = this.backpack[slotIndex];
      if (item) {
        item.count = (item.count || 1) - 1;
        if (item.count <= 0) {
          this.backpack[slotIndex] = null;
        }
      }
    }

    this.updateHUD();
    this.updateEffectsHUD();
    if (this.backpackIsOpen) {
      this.renderBackpack();
    }
  }

  updateEffects(dt) {
    let changed = false;
    for (const key of ['speed', 'jump', 'invisibility', 'regen']) {
      if (this.effects[key] > 0) {
        this.effects[key] = Math.max(0, this.effects[key] - dt);
        if (this.effects[key] === 0) {
          changed = true;
          const nameMap = { speed: '迅捷药水 II', jump: '跳跃药水 V', invisibility: '隐形药水', regen: '恢复药水' };
          if (window.game) window.game.addChatMessage(`§7[状态] 你的 ${nameMap[key]} 效果已结束。`);
          if (key === 'invisibility') {
            this.isInvisible = false;
            if (this.handMesh && this.handMesh.material) {
              this.handMesh.material.transparent = false;
              this.handMesh.material.opacity = 1.0;
            }
          }
        }
      }
    }

    // Regeneration tick every 1.5 seconds
    if (this.effects.regen > 0 && !this.isDead) {
      this.regenIntervalTimer += dt;
      if (this.regenIntervalTimer >= 1.5) {
        this.regenIntervalTimer = 0;
        if (this.health < this.maxHealth) {
          this.health = Math.min(this.maxHealth, this.health + 1);
          this.updateHUD();
        }
      }
    }

    // Hand transparency while invisible
    if (this.effects.invisibility > 0) {
      this.isInvisible = true;
      if (this.handMesh && this.handMesh.material) {
        this.handMesh.material.transparent = true;
        this.handMesh.material.opacity = 0.35;
      }
    }

    this.updateEffectsHUD();
  }

  updateEffectsHUD() {
    const container = document.getElementById('potion-effects-hud');
    if (!container) return;

    const effectConfigs = [
      { key: 'speed', name: '迅捷 II', icon: '⚡', color: '#00d0f0', border: '#0284c7' },
      { key: 'jump', name: '跳跃 V', icon: '🦘', color: '#22c55e', border: '#15803d' },
      { key: 'invisibility', name: '隐形', icon: '👻', color: '#cbd5e1', border: '#7c3aed' },
      { key: 'regen', name: '恢复', icon: '💖', color: '#f43f5e', border: '#be123c' }
    ];

    let html = '';
    for (const cfg of effectConfigs) {
      const remaining = Math.ceil(this.effects[cfg.key]);
      if (remaining > 0) {
        const mins = Math.floor(remaining / 60);
        const secs = (remaining % 60).toString().padStart(2, '0');
        const timeStr = mins > 0 ? `${mins}:${secs}` : `${secs}s`;
        html += `<div class="potion-pill" style="border-color:${cfg.border}; color:${cfg.color};">
          <span class="pill-icon">${cfg.icon}</span>
          <span class="pill-name">${cfg.name}</span>
          <span class="pill-timer">${timeStr}</span>
        </div>`;
      }
    }

    container.innerHTML = html;
  }

  // =========================================================
  // Backpack & Inventory Methods
  // =========================================================
  initBackpackUI() {
    const bpBtn = document.getElementById('hud-backpack-btn');
    if (bpBtn) {
      bpBtn.addEventListener('click', () => this.toggleBackpack());
    }

    const closeBtn = document.getElementById('backpack-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeBackpack());
    }

    const sortBtn = document.getElementById('bp-btn-sort');
    if (sortBtn) {
      sortBtn.addEventListener('click', () => this.sortInventory());
    }

    const dropBtn = document.getElementById('bp-btn-drop');
    if (dropBtn) {
      dropBtn.addEventListener('click', () => this.dropSelectedItem());
    }

    const modal = document.getElementById('backpack-modal');
    if (modal) {
      modal.addEventListener('click', e => {
        if (e.target === modal) {
          this.closeBackpack();
        }
      });
    }
  }

  openBackpack() {
    if (this.isDead) return;
    if (window.shopManager && window.shopManager.isOpen) window.shopManager.closeShop();
    if (window.teammateManager && window.teammateManager.isOpen) window.teammateManager.closeModal();

    this.backpackIsOpen = true;
    this.selectedBackpackSlot = null;

    const modal = document.getElementById('backpack-modal');
    if (modal) modal.style.display = 'flex';

    if (document.exitPointerLock) document.exitPointerLock();
    if (window.soundManager && typeof window.soundManager.playInventoryOpen === 'function') {
      window.soundManager.playInventoryOpen();
    }

    this.renderBackpack();
  }

  closeBackpack() {
    this.backpackIsOpen = false;
    this.selectedBackpackSlot = null;

    const modal = document.getElementById('backpack-modal');
    if (modal) modal.style.display = 'none';

    if (window.soundManager && typeof window.soundManager.playInventoryClose === 'function') {
      window.soundManager.playInventoryClose();
    }

    const canvas = document.getElementById('render-canvas');
    if (canvas && canvas.requestPointerLock && window.game && window.game.isGameRunning) {
      try {
        const p = canvas.requestPointerLock();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch (err) {}
    }
  }

  toggleBackpack() {
    if (this.backpackIsOpen) {
      this.closeBackpack();
    } else {
      this.openBackpack();
    }
  }

  renderBackpack() {
    const modal = document.getElementById('backpack-modal');
    if (!modal || modal.style.display === 'none') return;

    // 1. Status Bar
    const armorStat = document.getElementById('bp-armor-stat');
    if (armorStat) {
      const tierNames = { none: '无护甲 (0%减伤)', chain: '锁链甲 (30%减伤)', iron: '铁盔甲 (50%减伤)', diamond: '钻石甲 (65%减伤)' };
      armorStat.innerHTML = `🛡️ 盔甲等级: <span>${tierNames[this.armorTier] || this.armorTier}</span>`;
    }
    const healthStat = document.getElementById('bp-health-stat');
    if (healthStat) {
      healthStat.innerHTML = `💖 生命值: <span>${this.health} / ${this.maxHealth}</span>`;
    }
    const effectsStat = document.getElementById('bp-effects-stat');
    if (effectsStat) {
      const activeList = [];
      if (this.effects.speed > 0) activeList.push(`⚡ 迅捷 II (${Math.ceil(this.effects.speed)}s)`);
      if (this.effects.jump > 0) activeList.push(`🦘 跳跃 V (${Math.ceil(this.effects.jump)}s)`);
      if (this.effects.invisibility > 0) activeList.push(`👻 隐形 (${Math.ceil(this.effects.invisibility)}s)`);
      if (this.effects.regen > 0) activeList.push(`💖 恢复 (${Math.ceil(this.effects.regen)}s)`);
      effectsStat.innerHTML = `✨ 药水增益: <span>${activeList.length > 0 ? activeList.join(' | ') : '无'}</span>`;
    }

    const bpIron = document.getElementById('bp-iron');
    const bpGold = document.getElementById('bp-gold');
    const bpDiamond = document.getElementById('bp-diamond');
    const bpEmerald = document.getElementById('bp-emerald');
    if (bpIron) bpIron.innerText = this.resources.iron;
    if (bpGold) bpGold.innerText = this.resources.gold;
    if (bpDiamond) bpDiamond.innerText = this.resources.diamond;
    if (bpEmerald) bpEmerald.innerText = this.resources.emerald;

    // 2. Render Main Backpack Grid (27 slots)
    const bpGrid = document.getElementById('backpack-grid');
    if (bpGrid) {
      bpGrid.innerHTML = '';
      for (let i = 0; i < 27; i++) {
        const item = this.backpack[i];
        const isSelected = this.selectedBackpackSlot &&
          this.selectedBackpackSlot.location === 'backpack' &&
          this.selectedBackpackSlot.index === i;
        const slotEl = this.createBackpackSlotElement('backpack', i, item, isSelected);
        bpGrid.appendChild(slotEl);
      }
    }

    // 3. Render Hotbar Mirror Grid (9 slots)
    const hotbarGrid = document.getElementById('backpack-hotbar-grid');
    if (hotbarGrid) {
      hotbarGrid.innerHTML = '';
      for (let i = 0; i < 9; i++) {
        const item = this.hotbar[i];
        const isSelected = this.selectedBackpackSlot &&
          this.selectedBackpackSlot.location === 'hotbar' &&
          this.selectedBackpackSlot.index === i;
        const slotEl = this.createBackpackSlotElement('hotbar', i, item, isSelected, i === this.selectedSlot);
        hotbarGrid.appendChild(slotEl);
      }
    }
  }

  createBackpackSlotElement(location, index, item, isSelected = false, isActiveHotbar = false) {
    const slot = document.createElement('div');
    slot.className = `bp-slot ${isSelected ? 'selected' : ''} ${isActiveHotbar ? 'active-hotbar' : ''}`;
    slot.dataset.location = location;
    slot.dataset.index = index;

    if (location === 'hotbar') {
      const keySpan = document.createElement('span');
      keySpan.className = 'bp-slot-key';
      keySpan.innerText = index + 1;
      slot.appendChild(keySpan);
    }

    if (item) {
      const icon = document.createElement('img');
      icon.className = 'bp-icon';
      icon.src = window.TextureGenerator.generateItemDataURL(item.id);
      slot.appendChild(icon);

      if (item.count > 1) {
        const countSpan = document.createElement('span');
        countSpan.className = 'bp-count';
        countSpan.innerText = item.count;
        slot.appendChild(countSpan);
      }

      let tooltipDesc = '';
      if (item.type === 'weapon') tooltipDesc = `近战武器 (攻击力: ${item.damage})`;
      else if (item.type === 'bow') tooltipDesc = `远程弓箭 (右键蓄力射箭)`;
      else if (item.type === 'tool') tooltipDesc = `快速采集/剪除工具`;
      else if (item.type === 'block') tooltipDesc = `建筑搭路方块 (右键铺设)`;
      else if (item.id === 'golden_apple') tooltipDesc = `食用回复6点生命 (右键食用)`;
      else if (item.id === 'enchanted_golden_apple') tooltipDesc = `神级附魔金苹果 (全满血并加祝福)`;
      else if (item.type === 'potion' || (item.id && item.id.startsWith('potion_'))) {
        const mapDesc = {
          potion_speed: '+40% 移动速度 (45秒)',
          potion_jump: '跳跃力超强提升 (45秒)',
          potion_invisibility: '自身完全隐身避开人机 (30秒)',
          potion_regen: '立回6血并持续再生 (30秒)'
        };
        tooltipDesc = mapDesc[item.id] || '增益魔法药水 (右键直接饮用)';
      }
      slot.title = `${item.name || item.id}\n${tooltipDesc}\n[左键] 选中/互换 | [Shift+左键] 快速转移 | [右键] 快捷使用`;
    }

    slot.addEventListener('click', e => {
      this.handleSlotClick(location, index, e.shiftKey);
    });

    slot.addEventListener('contextmenu', e => {
      e.preventDefault();
      this.handleSlotRightClick(location, index, e);
    });

    return slot;
  }

  handleSlotClick(location, index, isShift) {
    const list = (location === 'hotbar') ? this.hotbar : this.backpack;
    const currentItem = list[index];

    // Shift + Click: Quick move to the other container
    if (isShift) {
      if (!currentItem) return;
      const targetList = (location === 'hotbar') ? this.backpack : this.hotbar;
      const targetLen = (location === 'hotbar') ? 27 : 9;

      let moved = false;
      const isStackable = (currentItem.type === 'block' || currentItem.type === 'arrow' || (currentItem.id && currentItem.id.startsWith('arrow')) || currentItem.type === 'potion' || currentItem.id === 'golden_apple');
      if (isStackable) {
        for (let j = 0; j < targetLen; j++) {
          const dest = targetList[j];
          if (dest && dest.id === currentItem.id) {
            dest.count = (dest.count || 1) + (currentItem.count || 1);
            list[index] = null;
            moved = true;
            break;
          }
        }
      }

      if (!moved) {
        for (let j = 0; j < targetLen; j++) {
          if (!targetList[j]) {
            targetList[j] = currentItem;
            list[index] = null;
            moved = true;
            break;
          }
        }
      }

      if (moved) {
        if (window.soundManager && typeof window.soundManager.playPickup === 'function') {
          window.soundManager.playPickup();
        }
        this.selectedBackpackSlot = null;
        this.updateHeldItemVisual();
        this.updateHUD();
        this.renderBackpack();
      }
      return;
    }

    // Normal Click: Selection & Swap / Move
    if (!this.selectedBackpackSlot) {
      if (currentItem) {
        this.selectedBackpackSlot = { location, index };
        if (window.soundManager && typeof window.soundManager.playPickup === 'function') {
          window.soundManager.playPickup();
        }
        this.renderBackpack();
      }
    } else {
      const selLoc = this.selectedBackpackSlot.location;
      const selIdx = this.selectedBackpackSlot.index;

      if (selLoc === location && selIdx === index) {
        this.selectedBackpackSlot = null;
        this.renderBackpack();
        return;
      }

      const sourceList = (selLoc === 'hotbar') ? this.hotbar : this.backpack;
      const sourceItem = sourceList[selIdx];

      const isStackable = (sourceItem && currentItem && sourceItem.id === currentItem.id &&
        (sourceItem.type === 'block' || sourceItem.type === 'arrow' || (sourceItem.id && sourceItem.id.startsWith('arrow')) || sourceItem.type === 'potion' || sourceItem.id === 'golden_apple'));

      if (isStackable) {
        currentItem.count = (currentItem.count || 1) + (sourceItem.count || 1);
        sourceList[selIdx] = null;
      } else {
        sourceList[selIdx] = currentItem;
        list[index] = sourceItem;
      }

      if (window.soundManager && typeof window.soundManager.playPickup === 'function') {
        window.soundManager.playPickup();
      }
      this.selectedBackpackSlot = null;
      this.updateHeldItemVisual();
      this.updateHUD();
      this.renderBackpack();
    }
  }

  handleSlotRightClick(location, index, e) {
    if (e) e.preventDefault();
    const list = (location === 'hotbar') ? this.hotbar : this.backpack;
    const item = list[index];
    if (!item) return;

    if (item.type === 'potion' || (item.id && item.id.startsWith('potion_'))) {
      this.drinkPotion(item, location, index);
      return;
    }

    if (item.id === 'golden_apple') {
      if (this.health < this.maxHealth) {
        this.health = Math.min(this.maxHealth, this.health + 6);
        item.count = (item.count || 1) - 1;
        if (item.count <= 0) list[index] = null;
        window.soundManager.playPickup();
        if (window.game) window.game.addChatMessage('§a你吃下了金苹果，生命值已恢复！');
        this.updateHUD();
        this.renderBackpack();
      }
      return;
    }

    if (item.id === 'enchanted_golden_apple') {
      this.health = 20;
      item.count = (item.count || 1) - 1;
      if (item.count <= 0) list[index] = null;
      if (window.soundManager && typeof window.soundManager.playDing === 'function') {
        window.soundManager.playDing();
      }
      if (window.game) window.game.addChatMessage('§d★ 你吃下了附魔金苹果！生命值已完全恢复并获得神圣祝福！');
      this.updateHUD();
      this.renderBackpack();
      return;
    }
  }

  sortInventory() {
    const allItems = [];
    for (let i = 0; i < 9; i++) {
      if (this.hotbar[i]) {
        allItems.push(this.hotbar[i]);
        this.hotbar[i] = null;
      }
    }
    for (let i = 0; i < 27; i++) {
      if (this.backpack[i]) {
        allItems.push(this.backpack[i]);
        this.backpack[i] = null;
      }
    }

    const merged = [];
    for (const item of allItems) {
      const isStackable = (item.type === 'block' || item.type === 'arrow' || (item.id && item.id.startsWith('arrow')) || item.type === 'potion' || item.id === 'golden_apple');
      if (isStackable) {
        const existing = merged.find(m => m.id === item.id);
        if (existing) {
          existing.count = (existing.count || 1) + (item.count || 1);
          continue;
        }
      }
      merged.push(item);
    }

    const getOrder = it => {
      if (it.type === 'weapon') return 10 - (it.damage || 0);
      if (it.id === 'shears') return 20;
      if (it.type === 'tool') return 25;
      if (it.type === 'bow') return 30;
      if (it.type === 'arrow' || (it.id && it.id.startsWith('arrow'))) return 35;
      if (it.type === 'block') return 40;
      if (it.type === 'potion' || (it.id && it.id.startsWith('potion_'))) return 50;
      if (it.id === 'golden_apple' || it.id === 'enchanted_golden_apple') return 60;
      if (it.id === 'fireball') return 70;
      if (it.id === 'ender_pearl') return 80;
      return 100;
    };
    merged.sort((a, b) => getOrder(a) - getOrder(b));

    for (let i = 0; i < merged.length; i++) {
      if (i < 9) {
        this.hotbar[i] = merged[i];
      } else if (i - 9 < 27) {
        this.backpack[i - 9] = merged[i];
      }
    }

    this.selectedBackpackSlot = null;
    if (window.soundManager && typeof window.soundManager.playDing === 'function') {
      window.soundManager.playDing();
    }
    this.updateHeldItemVisual();
    this.updateHUD();
    this.renderBackpack();
  }

  dropSelectedItem() {
    if (!this.selectedBackpackSlot) {
      if (window.game) window.game.addChatMessage('§e[提示] 请先点击选中背包或快捷栏中的一件物品！');
      return;
    }
    const { location, index } = this.selectedBackpackSlot;
    const list = (location === 'hotbar') ? this.hotbar : this.backpack;
    const item = list[index];
    if (!item) {
      this.selectedBackpackSlot = null;
      return;
    }

    let dropType = item.id;
    if (dropType === 'red_wool') dropType = 'wool';
    else if (dropType === 'golden_apple') dropType = 'gapple';

    item.count = (item.count || 1) - 1;
    if (item.count <= 0) {
      list[index] = null;
      this.selectedBackpackSlot = null;
    }

    if (window.game && window.game.generatorManager) {
      const forward = new THREE.Vector3(
        -Math.sin(this.yaw) * Math.cos(this.pitch),
        Math.sin(this.pitch),
        -Math.cos(this.yaw) * Math.cos(this.pitch)
      ).normalize();
      const dropPos = this.position.clone().add(forward.multiplyScalar(1.2));
      window.game.generatorManager.spawnItem(dropType, dropPos.x, dropPos.y + 0.5, dropPos.z);
      if (window.soundManager && typeof window.soundManager.playPlace === 'function') {
        window.soundManager.playPlace();
      }
    }

    this.updateHeldItemVisual();
    this.updateHUD();
    this.renderBackpack();
  }

  countItem(id) {
    let total = 0;
    for (let i = 0; i < 9; i++) {
      const it = this.hotbar[i];
      if (it && (it.id === id || (id === 'wool' && it.type === 'block') || (id === 'arrow' && it.type === 'arrow'))) {
        total += (it.count || 1);
      }
    }
    for (let i = 0; i < 27; i++) {
      const it = this.backpack[i];
      if (it && (it.id === id || (id === 'wool' && it.type === 'block') || (id === 'arrow' && it.type === 'arrow'))) {
        total += (it.count || 1);
      }
    }
    return total;
  }

  consumeItem(id, count = 1) {
    let remaining = count;
    for (let i = 0; i < 9; i++) {
      const it = this.hotbar[i];
      if (it && (it.id === id || (id === 'wool' && it.type === 'block') || (id === 'arrow' && it.type === 'arrow'))) {
        const take = Math.min(remaining, it.count || 1);
        it.count -= take;
        remaining -= take;
        if (it.count <= 0) this.hotbar[i] = null;
        if (remaining <= 0) break;
      }
    }
    if (remaining > 0) {
      for (let i = 0; i < 27; i++) {
        const it = this.backpack[i];
        if (it && (it.id === id || (id === 'wool' && it.type === 'block') || (id === 'arrow' && it.type === 'arrow'))) {
          const take = Math.min(remaining, it.count || 1);
          it.count -= take;
          remaining -= take;
          if (it.count <= 0) this.backpack[i] = null;
          if (remaining <= 0) break;
        }
      }
    }
    this.updateHeldItemVisual();
    this.updateHUD();
    if (this.backpackIsOpen) this.renderBackpack();
    return remaining <= 0;
  }
}

window.Player = Player;
