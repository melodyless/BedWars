// Bedwars Villager Shop Keeper & Shop Interface
class ShopManager {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.isOpen = false;
    this.currentCategory = 'blocks';

    // 3D Villagers for Red and Blue bases
    this.villagers = [];
    this.initVillagerNPCs();

    // Catalog data
    this.items = {
      blocks: [
        { id: 'red_wool', name: '羊毛 x16', type: 'block', blockType: 'RED_WOOL', count: 16, currency: 'iron', price: 4 },
        { id: 'wood_planks', name: '橡木木板 x16', type: 'block', blockType: 'OAK_PLANKS', count: 16, currency: 'gold', price: 4 },
        { id: 'end_stone', name: '末地石 x12', type: 'block', blockType: 'END_STONE', count: 12, currency: 'iron', price: 24 },
        { id: 'obsidian', name: '黑曜石 x4', type: 'block', blockType: 'OBSIDIAN', count: 4, currency: 'emerald', price: 4 }
      ],
      weapons: [
        { id: 'sword_stone', name: '石剑', type: 'weapon', damage: 5, currency: 'iron', price: 10 },
        { id: 'sword_iron', name: '铁剑', type: 'weapon', damage: 6, currency: 'gold', price: 7 },
        { id: 'sword_diamond', name: '钻石剑', type: 'weapon', damage: 7, currency: 'emerald', price: 4 },
        { id: 'mace', name: '重锤 (高空砸下每格+3伤)', type: 'weapon', weaponType: 'mace', damage: 6, currency: 'emerald', price: 10, desc: '下落砸击时每高1格额外造成3点粉碎伤害，且下落砸中时完全免疫摔落伤害！' },
        { id: 'bow_normal', name: '木弓', type: 'bow', bowType: 'normal', currency: 'gold', price: 12 },
        { id: 'bow_power', name: '力量弓 (增伤)', type: 'bow', bowType: 'power', currency: 'gold', price: 20 },
        { id: 'bow_punch', name: '击退弓 (强击退)', type: 'bow', bowType: 'punch', currency: 'emerald', price: 6 },
        { id: 'arrow_8', name: '箭矢 x8', type: 'arrow', count: 8, currency: 'gold', price: 2 },
        { id: 'arrow_16', name: '箭矢 x16', type: 'arrow', count: 16, currency: 'gold', price: 4 }
      ],
      armor: [
        { id: 'armor_chain', name: '锁链甲', type: 'armor', tier: 'chain', currency: 'iron', price: 40 },
        { id: 'armor_iron', name: '铁盔甲', type: 'armor', tier: 'iron', currency: 'gold', price: 12 },
        { id: 'armor_diamond', name: '钻石盔甲', type: 'armor', tier: 'diamond', currency: 'emerald', price: 6 }
      ],
      tools: [
        { id: 'shears', name: '剪刀', type: 'tool', count: 1, currency: 'iron', price: 20 },
        { id: 'pickaxe_wood', name: '木镐', type: 'tool', count: 1, currency: 'iron', price: 10 },
        { id: 'pickaxe_iron', name: '铁镐', type: 'tool', count: 1, currency: 'iron', price: 20 },
        { id: 'pickaxe_diamond', name: '钻石镐', type: 'tool', count: 1, currency: 'gold', price: 6 }
      ],
      potions: [
        { id: 'potion_speed', name: '迅捷药水 II (45秒)', type: 'potion', potionType: 'speed', duration: 45, currency: 'emerald', price: 1, desc: '+40% 移动速度与灵动身法' },
        { id: 'potion_jump', name: '跳跃药水 V (45秒)', type: 'potion', potionType: 'jump', duration: 45, currency: 'emerald', price: 1, desc: '跳跃力提升，可跳越 2.5 格高墙' },
        { id: 'potion_invisibility', name: '隐形药水 (30秒)', type: 'potion', potionType: 'invisibility', duration: 30, currency: 'emerald', price: 2, desc: '自身完全隐身，人机大幅失去索敌目标' },
        { id: 'potion_regen', name: '恢复药水 (30秒)', type: 'potion', potionType: 'regen', duration: 30, currency: 'gold', price: 3, desc: '立即回血6点，随后持续回血30秒' }
      ],
      utilities: [
        { id: 'wind_charge', name: '风弹 x8', type: 'utility', projectileType: 'wind_charge', count: 8, currency: 'gold', price: 4, desc: '右键投掷冲飞自己腾空或击退敌人，配合重锤完成从天而降的粉碎重击！' },
        { id: 'golden_apple', name: '金苹果', type: 'utility', count: 1, currency: 'gold', price: 3 },
        { id: 'enchanted_golden_apple', name: '附魔金苹果', type: 'utility', count: 1, currency: 'emerald', price: 3 },
        { id: 'potion_speed', name: '迅捷药水 II', type: 'potion', potionType: 'speed', duration: 45, currency: 'emerald', price: 1 },
        { id: 'potion_jump', name: '跳跃药水 V', type: 'potion', potionType: 'jump', duration: 45, currency: 'emerald', price: 1 },
        { id: 'potion_invisibility', name: '隐形药水', type: 'potion', potionType: 'invisibility', duration: 30, currency: 'emerald', price: 2 },
        { id: 'potion_regen', name: '恢复药水', type: 'potion', potionType: 'regen', duration: 30, currency: 'gold', price: 3 },
        { id: 'fireball', name: '火焰弹', type: 'utility', count: 1, currency: 'iron', price: 40 },
        { id: 'ender_pearl', name: '末影珍珠', type: 'utility', count: 1, currency: 'emerald', price: 4 }
      ],
      upgrades: [
        { id: 'upgrade_sharpness', name: '锋利之刃 (全队近战增伤+1)', type: 'upgrade', upgradeKey: 'sharpness', currency: 'diamond', price: 4 },
        { id: 'upgrade_protection', name: '保护盔甲 I (全队减伤+15%)', type: 'upgrade', upgradeKey: 'protection', currency: 'diamond', price: 2 },
        { id: 'upgrade_protection2', name: '保护盔甲 II (全队减伤+30%)', type: 'upgrade', upgradeKey: 'protection2', currency: 'diamond', price: 4 },
        { id: 'upgrade_forge', name: '急速熔炉 (基地产矿速度翻倍)', type: 'upgrade', upgradeKey: 'forge', currency: 'diamond', price: 4 },
        { id: 'upgrade_heal_pool', name: '治愈光环 (基地内自动回血)', type: 'upgrade', upgradeKey: 'heal_pool', currency: 'diamond', price: 2 },
        { id: 'upgrade_trap', name: '警戒陷阱 (敌方进家减速并报警)', type: 'upgrade', upgradeKey: 'trap', currency: 'diamond', price: 1 }
      ]
    };

    this.bindEvents();
  }

  initVillagerNPCs(mode = '2teams') {
    if (this.villagers) {
      this.villagers.forEach(v => this.scene.remove(v.group));
    }
    this.villagers = [];

    // Red Base Villager at (-6, 0.5, 56)
    this.createVillager(-6, 0.5, 56, '道具商店');
    // Blue Base Villager at (6, 0.5, -56)
    this.createVillager(6, 0.5, -56, '道具商店');

    if (mode === '4teams') {
      this.createVillager(56, 0.5, -6, '道具商店');
      this.createVillager(-56, 0.5, 6, '道具商店');
    }
  }

  createVillager(x, y, z, label) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const skinMat = new THREE.MeshLambertMaterial({
      map: TextureGenerator.getVillagerSkin()
    });

    // Body
    const bodyGeo = new THREE.BoxGeometry(0.5, 0.8, 0.4);
    const body = new THREE.Mesh(bodyGeo, skinMat);
    body.position.set(0, 0.6, 0);
    group.add(body);

    // Head
    const headGeo = new THREE.BoxGeometry(0.45, 0.55, 0.45);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.set(0, 1.25, 0);
    group.add(head);

    // Floating Nametag (High resolution 512x128 with sharp bold font)
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(10, 10, 12, 0.82)';
    ctx.fillRect(8, 8, 496, 112);
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 3;
    ctx.strokeRect(8, 8, 496, 112);

    // Line 1: NPC Title
    ctx.font = 'bold 34px "Minecraft", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#000000';
    ctx.strokeText(`[NPC] ${label}`, 256, 50);
    ctx.fillStyle = '#ffaa00';
    ctx.fillText(`[NPC] ${label}`, 256, 50);

    // Line 2: Hint
    ctx.font = 'bold 24px "Minecraft", "Segoe UI", sans-serif';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000000';
    ctx.strokeText('右键点击打开商店', 256, 92);
    ctx.fillStyle = '#ffff55';
    ctx.fillText('右键点击打开商店', 256, 92);

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;

    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.6, 0.40, 1);
    sprite.position.set(0, 2.0, 0);
    group.add(sprite);

    if (this.scene) {
      this.scene.add(group);
    }
    this.villagers.push({ x, y, z, group, sprite });
  }

  update(camera) {
    if (!camera) return;
    if (!this._camDir) this._camDir = new THREE.Vector3();
    camera.getWorldDirection(this._camDir);

    for (const v of this.villagers) {
      if (v.sprite) {
        const vPos = v.group.position;
        const toVx = vPos.x - camera.position.x;
        const toVy = (vPos.y + 2.0) - camera.position.y;
        const toVz = vPos.z - camera.position.z;
        const dist = Math.hypot(toVx, toVy, toVz);
        const zDepth = toVx * this._camDir.x + toVy * this._camDir.y + toVz * this._camDir.z;

        if (zDepth > 0.15 && dist > 0.15) {
          const cosTheta = Math.max(0.3, Math.min(1.0, zDepth / dist));
          const scaleFactor = Math.min(2.1, Math.max(1.0, 1.0 + Math.max(0, dist - 3.5) * 0.038));
          const finalScale = scaleFactor * cosTheta;
          v.sprite.scale.set(1.6 * finalScale, 0.40 * finalScale, 1);
          v.sprite.position.y = 2.0 + (scaleFactor - 1.0) * 0.12;
        }
      }
    }
  }

  checkVillagerInteract(origin, dir) {
    for (const v of this.villagers) {
      const vPos = new THREE.Vector3(v.x, v.y + 1, v.z);
      const toV = new THREE.Vector3().subVectors(vPos, origin);
      const dist = toV.length();
      if (dist < 4.0) {
        toV.normalize();
        if (dir.dot(toV) > 0.8) {
          return true;
        }
      }
    }
    return false;
  }

  bindEvents() {
    if (ShopManager._eventsBound) return;
    ShopManager._eventsBound = true;

    // Tab switching
    document.querySelectorAll('.shop-tab').forEach(tab => {
      tab.addEventListener('click', e => {
        document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentCategory = tab.dataset.category;
        this.renderCategoryItems();
      });
    });

    // Close button
    const closeBtn = document.getElementById('shop-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeShop());
    }

    // Key 'E' or 'Escape' to toggle/close shop
    window.addEventListener('keydown', e => {
      if (e.code === 'KeyE') {
        if (this.isOpen) {
          this.closeShop();
        }
      } else if (e.code === 'Escape') {
        if (this.isOpen) {
          this.closeShop();
        }
      }
    });
  }

  openShop() {
    this.isOpen = true;
    const modal = document.getElementById('shop-modal');
    if (modal) modal.style.display = 'block';

    // Reset player active inputs
    if (this.player) {
      this.player.isRightMouseDown = false;
      this.player.isMining = false;
      this.player.stopMining();
    }

    // Release pointer lock so player can click shop items
    if (document.exitPointerLock) {
      document.exitPointerLock();
    }

    this.renderCategoryItems();
  }

  closeShop() {
    this.isOpen = false;
    this.justClosed = true;
    setTimeout(() => { this.justClosed = false; }, 1500);

    const modal = document.getElementById('shop-modal');
    if (modal) modal.style.display = 'none';

    // Reset player active inputs
    if (this.player) {
      this.player.isRightMouseDown = false;
      this.player.isMining = false;
      this.player.stopMining();
    }

    // Re-lock pointer
    const canvas = document.getElementById('render-canvas');
    if (canvas) {
      try {
        const p = canvas.requestPointerLock();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch (e) {}
    }
  }

  renderCategoryItems() {
    const grid = document.getElementById('shop-items-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const items = this.items[this.currentCategory] || [];
    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'shop-card';

      // Icon
      const icon = document.createElement('img');
      icon.className = 'card-icon';
      icon.src = TextureGenerator.generateItemDataURL(item.id);
      card.appendChild(icon);

      // Title
      const title = document.createElement('div');
      title.className = 'card-title';
      title.innerText = item.name;
      card.appendChild(title);

      // Price Tag
      const priceTag = document.createElement('div');
      priceTag.className = `card-price price-${item.currency}`;

      const currencyName =
        item.currency === 'iron' ? '铁锭' :
        item.currency === 'gold' ? '金锭' :
        item.currency === 'diamond' ? '钻石' : '绿宝石';

      priceTag.innerText = `${item.price} ${currencyName}`;
      card.appendChild(priceTag);

      // Click to purchase
      card.onclick = () => this.buyItem(item);

      grid.appendChild(card);
    });
  }

  buyItem(item) {
    const userRes = this.player.resources[item.currency];
    const currencyName =
      item.currency === 'iron' ? '铁锭' :
      item.currency === 'gold' ? '金锭' :
      item.currency === 'diamond' ? '钻石' : '绿宝石';

    if (userRes < item.price) {
      window.game.addChatMessage(`§c${currencyName}不足！还需要 ${item.price - userRes} 个${currencyName}。`);
      return;
    }

    // Deduct cost
    this.player.resources[item.currency] -= item.price;
    window.soundManager.playBuy();

    // Grant item or upgrade
    if (item.type === 'upgrade') {
      const team = 'red';
      if (window.game && window.game.teamUpgrades && window.game.teamUpgrades[team]) {
        const tu = window.game.teamUpgrades[team];
        if (item.upgradeKey === 'sharpness') tu.sharpness = 1;
        else if (item.upgradeKey === 'protection') tu.protection = 1;
        else if (item.upgradeKey === 'protection2') tu.protection = 2;
        else if (item.upgradeKey === 'forge') tu.forge = 2;
        else if (item.upgradeKey === 'heal_pool') tu.healPool = true;
        else if (item.upgradeKey === 'trap') tu.trap = true;
      }
      if (window.soundManager && typeof window.soundManager.playDing === 'function') {
        window.soundManager.playDing();
      }
      window.game.addChatMessage(`§b★ 团队升级成功：${item.name}！效果已向全队生效！`);
    } else if (item.type === 'armor') {
      this.player.armorTier = item.tier;
      window.game.addChatMessage(`§a成功装备 ${item.name}！防御力大幅提升！`);
    } else {
      const success = this.player.addItem({
        id: item.id,
        name: item.name,
        type: item.type,
        blockType: item.blockType,
        count: item.count || 1,
        damage: item.damage,
        bowType: item.bowType,
        potionType: item.potionType,
        duration: item.duration
      });

      if (success) {
        window.game.addChatMessage(`§a成功购买 ${item.name}！`);
        if (item.type === 'block') {
          const slotIdx = this.player.hotbar.findIndex(s => s && s.id === item.id);
          if (slotIdx !== -1) {
            window.game.addChatMessage(`§e[搭路提示] 按键盘数字键 ${slotIdx + 1} 切换到羊毛，长按右键朝边缘走即可连续搭路！`);
          }
        }
      } else {
        window.game.addChatMessage('§e快捷栏已满，物品已掉落！');
      }
    }

    this.player.updateHUD();
  }
}

window.ShopManager = ShopManager;
