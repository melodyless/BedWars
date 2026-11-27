// Vanilla 3x3 Crafting Table & Furnace Smelting System for Survival War
(function () {
  const RES_LABELS = {
    wood: '木材',
    cobble: '圆石',
    coal: '煤炭',
    raw_iron: '粗铁矿',
    raw_gold: '粗金矿',
    iron: '铁锭',
    gold: '金锭',
    diamond: '钻石',
    apple: '苹果'
  };

  const RES_ICONS = {
    wood: '🪵',
    cobble: '🪨',
    coal: '⚫',
    raw_iron: '🪨',
    raw_gold: '🟡',
    iron: '⚙️',
    gold: '🪙',
    diamond: '💎',
    apple: '🍎'
  };

  // 3x3 Crafting Table Recipes (pattern is 9-element array, null = empty)
  const RECIPES = [
    {
      id: 'crafting_table', name: '工作台 x1', type: 'block', blockType: 'CRAFTING_TABLE', count: 1,
      pattern: ['wood', 'wood', null, 'wood', 'wood', null, null, null, null],
      costs: [{ res: 'wood', amount: 4 }]
    },
    {
      id: 'furnace', name: '熔炉 x1', type: 'block', blockType: 'FURNACE', count: 1,
      pattern: ['cobble', 'cobble', 'cobble', 'cobble', null, 'cobble', 'cobble', 'cobble', 'cobble'],
      costs: [{ res: 'cobble', amount: 8 }]
    },
    {
      id: 'wood_planks', name: '橡木木板 x8', type: 'block', blockType: 'OAK_PLANKS', count: 8,
      pattern: ['wood', null, null, null, null, null, null, null, null],
      costs: [{ res: 'wood', amount: 2 }]
    },
    {
      id: 'cobble_blocks', name: '圆石方块 x12', type: 'block', blockType: 'STONE', count: 12,
      pattern: ['cobble', 'cobble', null, 'cobble', 'cobble', null, null, null, null],
      costs: [{ res: 'cobble', amount: 4 }]
    },
    {
      id: 'pickaxe_wood', name: '木镐', type: 'tool', count: 1,
      pattern: ['wood', 'wood', 'wood', null, 'wood', null, null, 'wood', null],
      costs: [{ res: 'wood', amount: 4 }]
    },
    {
      id: 'pickaxe_stone', name: '石镐 (挖铁更快)', type: 'tool', count: 1,
      pattern: ['cobble', 'cobble', 'cobble', null, 'wood', null, null, 'wood', null],
      costs: [{ res: 'cobble', amount: 3 }, { res: 'wood', amount: 2 }]
    },
    {
      id: 'pickaxe_iron', name: '铁镐 (挖金钻)', type: 'tool', count: 1,
      pattern: ['iron', 'iron', 'iron', null, 'wood', null, null, 'wood', null],
      costs: [{ res: 'iron', amount: 3 }, { res: 'wood', amount: 2 }]
    },
    {
      id: 'pickaxe_diamond', name: '钻石镐', type: 'tool', count: 1,
      pattern: ['diamond', 'diamond', 'diamond', null, 'wood', null, null, 'wood', null],
      costs: [{ res: 'diamond', amount: 3 }, { res: 'wood', amount: 2 }]
    },
    {
      id: 'sword_stone', name: '石剑 (伤害5)', type: 'weapon', damage: 5,
      pattern: [null, 'cobble', null, null, 'cobble', null, null, 'wood', null],
      costs: [{ res: 'cobble', amount: 2 }, { res: 'wood', amount: 1 }]
    },
    {
      id: 'sword_iron', name: '铁剑 (伤害6)', type: 'weapon', damage: 6,
      pattern: [null, 'iron', null, null, 'iron', null, null, 'wood', null],
      costs: [{ res: 'iron', amount: 2 }, { res: 'wood', amount: 1 }]
    },
    {
      id: 'sword_diamond', name: '钻石剑 (伤害7)', type: 'weapon', damage: 7,
      pattern: [null, 'diamond', null, null, 'diamond', null, null, 'wood', null],
      costs: [{ res: 'diamond', amount: 2 }, { res: 'wood', amount: 1 }]
    },
    {
      id: 'armor_chain', name: '锁链甲 (30%减伤)', type: 'armor', tier: 'chain',
      pattern: ['iron', null, 'iron', 'iron', 'iron', 'iron', 'iron', 'iron', 'iron'],
      costs: [{ res: 'iron', amount: 5 }]
    },
    {
      id: 'armor_iron', name: '铁盔甲 (50%减伤)', type: 'armor', tier: 'iron',
      pattern: ['iron', null, 'iron', 'iron', 'iron', 'iron', 'iron', 'iron', 'iron'],
      costs: [{ res: 'iron', amount: 8 }]
    },
    {
      id: 'armor_diamond', name: '钻石盔甲 (65%减伤)', type: 'armor', tier: 'diamond',
      pattern: ['diamond', null, 'diamond', 'diamond', 'diamond', 'diamond', 'diamond', 'diamond', 'diamond'],
      costs: [{ res: 'diamond', amount: 8 }]
    },
    {
      id: 'mace', name: '重锤 (高空砸击)', type: 'weapon', weaponType: 'mace', damage: 6,
      pattern: [null, 'diamond', null, null, 'iron', null, null, 'wood', null],
      costs: [{ res: 'diamond', amount: 4 }, { res: 'iron', amount: 4 }, { res: 'wood', amount: 1 }]
    },
    {
      id: 'bow_normal', name: '猎弓', type: 'bow', bowType: 'normal',
      pattern: [null, 'wood', 'iron', 'wood', null, 'iron', null, 'wood', 'iron'],
      costs: [{ res: 'wood', amount: 3 }, { res: 'iron', amount: 2 }]
    },
    {
      id: 'arrow_16', name: '箭矢 x16', type: 'arrow', count: 16,
      pattern: [null, 'iron', null, null, 'wood', null, null, 'wood', null],
      costs: [{ res: 'iron', amount: 1 }, { res: 'wood', amount: 2 }]
    },
    {
      id: 'golden_apple', name: '金苹果', type: 'utility', count: 1,
      pattern: ['gold', 'gold', 'gold', 'gold', 'apple', 'gold', 'gold', 'gold', 'gold'],
      costs: [{ res: 'apple', amount: 1 }, { res: 'gold', amount: 4 }]
    },
    {
      id: 'enchanted_golden_apple', name: '附魔金苹果', type: 'utility', count: 1,
      pattern: ['diamond', 'gold', 'diamond', 'gold', 'apple', 'gold', 'diamond', 'gold', 'diamond'],
      costs: [{ res: 'apple', amount: 1 }, { res: 'gold', amount: 4 }, { res: 'diamond', amount: 3 }]
    }
  ];

  class SurvivalUI {
    constructor() {
      this.isCraftingOpen = false;
      this.isFurnaceOpen = false;
      this.activeFurnaceKey = null;
      this.grid = new Array(9).fill(null);
      this.selectedRecipe = null;
      this.selectedResBrush = 'wood';
      this.ensureModals();
    }

    ensureModals() {
      if (document.getElementById('crafting-modal')) return;

      const style = document.createElement('style');
      style.textContent = `
        .surv-modal {
          position: fixed; inset: 0; background: rgba(0,0,0,0.68); z-index: 2600;
          display: none; align-items: center; justify-content: center; font-family: 'Segoe UI', sans-serif;
        }
        .surv-dialog {
          background: #2b2d31; border: 3px solid #5865f2; border-radius: 12px; padding: 18px;
          color: #f8fafc; width: 760px; max-width: 95vw; max-height: 90vh; overflow-y: auto;
          box-shadow: 0 20px 50px rgba(0,0,0,0.75);
        }
        .surv-header {
          display: flex; justify-content: space-between; align-items: center;
          border-bottom: 1px solid #40444b; padding-bottom: 10px; margin-bottom: 12px;
        }
        .surv-close {
          background: #ef4444; color: #fff; border: none; border-radius: 6px;
          padding: 5px 12px; cursor: pointer; font-weight: bold;
        }
        .surv-res-bar {
          display: flex; flex-wrap: wrap; gap: 8px; background: #1e1f22; padding: 8px 12px;
          border-radius: 8px; margin-bottom: 12px; font-size: 13px;
        }
        .surv-res-pill {
          background: #313338; padding: 4px 8px; border-radius: 6px; border: 1px solid #4e5058;
          cursor: pointer; user-select: none;
        }
        .surv-res-pill.active { border-color: #fbbf24; background: #423c28; }
        .ct-layout { display: flex; gap: 16px; flex-wrap: wrap; }
        .ct-left { width: 260px; flex-shrink: 0; background: #1e1f22; padding: 12px; border-radius: 10px; }
        .ct-grid { display: grid; grid-template-columns: repeat(3, 56px); gap: 6px; justify-content: center; margin: 10px 0; }
        .ct-slot, .fur-slot {
          width: 56px; height: 56px; background: #383a40; border: 2px solid #5c6069;
          border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center;
          cursor: pointer; font-size: 11px; text-align: center;
        }
        .ct-slot:hover, .fur-slot:hover { border-color: #fbbf24; }
        .ct-output {
          margin: 10px auto 0; width: 200px; padding: 10px; background: #16a34a; color: #fff;
          border: none; border-radius: 8px; font-weight: bold; cursor: pointer; display: block;
        }
        .ct-output:disabled { background: #4b5563; cursor: not-allowed; opacity: 0.7; }
        .ct-recipes {
          flex: 1; min-width: 280px; max-height: 360px; overflow-y: auto;
          display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px;
        }
        .ct-recipe-card {
          background: #1e1f22; border: 1px solid #40444b; border-radius: 8px; padding: 8px;
          cursor: pointer; display: flex; flex-direction: column; gap: 4px;
        }
        .ct-recipe-card:hover { border-color: #38bdf8; }
        .ct-recipe-card.can-craft { border-color: #22c55e; }
        .fur-body {
          display: flex; align-items: center; justify-content: center; gap: 24px;
          background: #1e1f22; padding: 20px; border-radius: 10px; margin-bottom: 14px;
        }
        .fur-col { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .fur-btn {
          background: #3b82f6; color: #fff; border: none; border-radius: 6px; padding: 5px 10px;
          cursor: pointer; font-size: 12px;
        }
      `;
      document.head.appendChild(style);

      // 1. Crafting Table Modal
      const ctModal = document.createElement('div');
      ctModal.id = 'crafting-modal';
      ctModal.className = 'surv-modal';
      ctModal.innerHTML = `
        <div class="surv-dialog">
          <div class="surv-header">
            <h3 style="margin:0;">🔨 3×3 原版工作台 (Crafting Table)</h3>
            <button class="surv-close" id="ct-close-btn">关闭 (ESC)</button>
          </div>
          <div class="surv-res-bar" id="ct-res-bar"></div>
          <div class="ct-layout">
            <div class="ct-left">
              <div style="font-size:12px; color:#94a3b8; text-align:center;">3×3 合成网格 (点击右侧配方自动摆阵)</div>
              <div class="ct-grid" id="ct-grid"></div>
              <div id="ct-preview-name" style="text-align:center; font-weight:bold; color:#fde047; min-height:20px;"></div>
              <button class="ct-output" id="ct-craft-btn" disabled>🔨 合成成品</button>
              <button style="margin:6px auto 0; display:block; background:transparent; color:#94a3b8; border:none; cursor:pointer; font-size:12px;" id="ct-clear-btn">清空网格</button>
            </div>
            <div class="ct-recipes" id="ct-recipes"></div>
          </div>
        </div>
      `;
      document.body.appendChild(ctModal);

      // 2. Furnace Modal
      const furModal = document.createElement('div');
      furModal.id = 'furnace-modal';
      furModal.className = 'surv-modal';
      furModal.innerHTML = `
        <div class="surv-dialog" style="width: 540px;">
          <div class="surv-header">
            <h3 style="margin:0;">🔥 原版熔炉 (Furnace)</h3>
            <button class="surv-close" id="fur-close-btn">关闭 (ESC)</button>
          </div>
          <div class="surv-res-bar" id="fur-res-bar"></div>
          <div class="fur-body">
            <div class="fur-col">
              <div style="font-size:12px; color:#cbd5e1;">待烧炼矿石</div>
              <div class="fur-slot" id="fur-in-slot">空</div>
              <div style="display:flex; gap:4px;">
                <button class="fur-btn" id="fur-add-iron">+1 粗铁</button>
                <button class="fur-btn" style="background:#ca8a04;" id="fur-add-gold">+1 粗金</button>
              </div>
              <div style="font-size:16px;" id="fur-flame">🔥 熄灭</div>
              <div style="font-size:12px; color:#cbd5e1;">燃料 (煤/木)</div>
              <div class="fur-slot" id="fur-fuel-slot">空</div>
              <div style="display:flex; gap:4px;">
                <button class="fur-btn" style="background:#475569;" id="fur-add-coal">+1 煤炭</button>
                <button class="fur-btn" style="background:#92400e;" id="fur-add-wood">+1 木材</button>
              </div>
            </div>
            <div style="font-size:28px; text-align:center;">
              <div id="fur-arrow">➡️ 0%</div>
            </div>
            <div class="fur-col">
              <div style="font-size:12px; color:#cbd5e1;">烧炼成品</div>
              <div class="fur-slot" id="fur-out-slot" style="border-color:#22c55e;">空</div>
              <button class="fur-btn" style="background:#16a34a;" id="fur-take-btn">取出全部成品</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(furModal);

      // Events
      ctModal.addEventListener('mousedown', e => e.stopPropagation());
      furModal.addEventListener('mousedown', e => e.stopPropagation());
      document.getElementById('ct-close-btn').onclick = () => this.closeAll();
      document.getElementById('fur-close-btn').onclick = () => this.closeAll();
      document.getElementById('ct-clear-btn').onclick = () => {
        this.grid.fill(null);
        this.selectedRecipe = null;
        this.renderCrafting();
      };
      document.getElementById('ct-craft-btn').onclick = () => this.craftSelected();

      document.getElementById('fur-add-iron').onclick = () => this.addFurnaceOre('raw_iron');
      document.getElementById('fur-add-gold').onclick = () => this.addFurnaceOre('raw_gold');
      document.getElementById('fur-add-coal').onclick = () => this.addFurnaceFuel('coal');
      document.getElementById('fur-add-wood').onclick = () => this.addFurnaceFuel('wood');
      document.getElementById('fur-take-btn').onclick = () => this.takeFurnaceOutput();

      window.addEventListener('keydown', (e) => {
        if (e.code === 'Escape' && (this.isCraftingOpen || this.isFurnaceOpen)) {
          this.closeAll();
        }
      });
    }

    openCrafting() {
      if (!window.player || window.player.isDead) return;
      this.closeAll(true);
      this.isCraftingOpen = true;
      window.player.stopMining();
      if (document.exitPointerLock) { try { document.exitPointerLock(); } catch (e) {} }
      document.getElementById('crafting-modal').style.display = 'flex';
      this.renderCrafting();
    }

    openFurnace(x, y, z) {
      if (!window.player || window.player.isDead) return;
      this.closeAll(true);
      this.isFurnaceOpen = true;
      this.activeFurnaceKey = `${Math.round(x)},${Math.round(y)},${Math.round(z)}`;
      this.getOrCreateFurnace(this.activeFurnaceKey);
      window.player.stopMining();
      if (document.exitPointerLock) { try { document.exitPointerLock(); } catch (e) {} }
      document.getElementById('furnace-modal').style.display = 'flex';
      this.renderFurnace();
    }

    closeAll(keepLock = false) {
      this.isCraftingOpen = false;
      this.isFurnaceOpen = false;
      document.getElementById('crafting-modal').style.display = 'none';
      document.getElementById('furnace-modal').style.display = 'none';
      if (!keepLock) {
        const canvas = document.getElementById('render-canvas');
        if (canvas && canvas.requestPointerLock && window.game && window.game.isGameRunning) {
          try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
        }
      }
    }

    canAffordRecipe(r) {
      if (!window.player) return false;
      for (const c of r.costs) {
        if ((window.player.resources[c.res] || 0) < c.amount) return false;
      }
      return true;
    }

    matchGridRecipe() {
      for (const r of RECIPES) {
        let match = true;
        for (let i = 0; i < 9; i++) {
          if (this.grid[i] !== r.pattern[i]) {
            match = false;
            break;
          }
        }
        if (match) return r;
      }
      return null;
    }

    renderCrafting() {
      const p = window.player;
      if (!p) return;

      const resBar = document.getElementById('ct-res-bar');
      resBar.innerHTML = Object.keys(RES_LABELS).map(k => `
        <span class="surv-res-pill ${this.selectedResBrush === k ? 'active' : ''}" data-res="${k}">
          ${RES_ICONS[k] || ''} ${RES_LABELS[k]}: <b>${p.resources[k] || 0}</b>
        </span>
      `).join('');
      resBar.querySelectorAll('.surv-res-pill').forEach(el => {
        el.onclick = () => {
          this.selectedResBrush = el.dataset.res;
          this.renderCrafting();
        };
      });

      const gridEl = document.getElementById('ct-grid');
      gridEl.innerHTML = '';
      for (let i = 0; i < 9; i++) {
        const val = this.grid[i];
        const slot = document.createElement('div');
        slot.className = 'ct-slot';
        slot.innerHTML = val ? `<div style="font-size:18px;">${RES_ICONS[val] || '📦'}</div><div>${RES_LABELS[val]}</div>` : '';
        slot.onclick = () => {
          this.grid[i] = this.grid[i] ? null : this.selectedResBrush;
          this.selectedRecipe = this.matchGridRecipe();
          this.renderCrafting();
        };
        gridEl.appendChild(slot);
      }

      const matched = this.selectedRecipe || this.matchGridRecipe();
      const preview = document.getElementById('ct-preview-name');
      const btn = document.getElementById('ct-craft-btn');
      if (matched) {
        const ok = this.canAffordRecipe(matched);
        preview.textContent = matched.name;
        btn.disabled = !ok;
        btn.textContent = ok ? `🔨 合成 ${matched.name}` : '材料不足';
      } else {
        preview.textContent = '请选择右侧配方或摆放材料';
        btn.disabled = true;
        btn.textContent = '🔨 合成成品';
      }

      const recEl = document.getElementById('ct-recipes');
      recEl.innerHTML = '';
      for (const r of RECIPES) {
        const ok = this.canAffordRecipe(r);
        const card = document.createElement('div');
        card.className = `ct-recipe-card ${ok ? 'can-craft' : ''}`;
        const costText = r.costs.map(c => `${c.amount}${RES_LABELS[c.res]}`).join(' + ');
        card.innerHTML = `
          <div style="font-weight:bold; font-size:13px; color:${ok ? '#86efac' : '#cbd5e1'};">${r.name}</div>
          <div style="font-size:11px; color:#94a3b8;">${costText}</div>
        `;
        card.onclick = () => {
          this.grid = [...r.pattern];
          this.selectedRecipe = r;
          this.renderCrafting();
        };
        recEl.appendChild(card);
      }
    }

    craftSelected() {
      const r = this.selectedRecipe || this.matchGridRecipe();
      const p = window.player;
      if (!r || !p || !this.canAffordRecipe(r)) return;

      for (const c of r.costs) {
        p.resources[c.res] -= c.amount;
      }
      if (window.soundManager) window.soundManager.playBuy();

      if (r.type === 'armor') {
        p.armorTier = r.tier;
        window.game.addChatMessage(`§a成功合成并装备 ${r.name}！`);
      } else {
        p.addItem({
          id: r.id,
          name: r.name,
          type: r.type,
          blockType: r.blockType,
          count: r.count || 1,
          damage: r.damage,
          bowType: r.bowType,
          weaponType: r.weaponType
        });
        window.game.addChatMessage(`§a成功合成 ${r.name}！`);
      }
      p.updateHUD();
      this.renderCrafting();
    }

    // --- Furnace Logic ---
    getOrCreateFurnace(key) {
      const world = window.game && window.game.world;
      if (!world) return null;
      if (!world.furnaces) world.furnaces = new Map();
      if (!world.furnaces.has(key)) {
        world.furnaces.set(key, {
          oreType: null, oreCount: 0,
          fuelType: null, fuelCount: 0,
          outputType: null, outputCount: 0,
          burnLeft: 0, smeltProgress: 0
        });
      }
      return world.furnaces.get(key);
    }

    addFurnaceOre(oreType) {
      const p = window.player;
      const f = this.getOrCreateFurnace(this.activeFurnaceKey);
      if (!p || !f || (p.resources[oreType] || 0) < 1) return;
      if (f.oreType && f.oreType !== oreType) return;
      p.resources[oreType] -= 1;
      f.oreType = oreType;
      f.oreCount += 1;
      p.updateHUD();
      this.renderFurnace();
    }

    addFurnaceFuel(fuelType) {
      const p = window.player;
      const f = this.getOrCreateFurnace(this.activeFurnaceKey);
      if (!p || !f || (p.resources[fuelType] || 0) < 1) return;
      if (f.fuelType && f.fuelType !== fuelType) return;
      p.resources[fuelType] -= 1;
      f.fuelType = fuelType;
      f.fuelCount += 1;
      p.updateHUD();
      this.renderFurnace();
    }

    takeFurnaceOutput() {
      const p = window.player;
      const f = this.getOrCreateFurnace(this.activeFurnaceKey);
      if (!p || !f || f.outputCount <= 0) return;
      p.resources[f.outputType] = (p.resources[f.outputType] || 0) + f.outputCount;
      window.game.addChatMessage(`§a从熔炉取出 ${f.outputCount} 个${RES_LABELS[f.outputType]}！`);
      f.outputCount = 0;
      f.outputType = null;
      p.updateHUD();
      this.renderFurnace();
    }

    renderFurnace() {
      const p = window.player;
      const f = this.getOrCreateFurnace(this.activeFurnaceKey);
      if (!p || !f) return;

      document.getElementById('fur-res-bar').innerHTML =
        `<span>🪨 粗铁矿: <b>${p.resources.raw_iron || 0}</b></span>` +
        `<span>🟡 粗金矿: <b>${p.resources.raw_gold || 0}</b></span>` +
        `<span>⚫ 煤炭: <b>${p.resources.coal || 0}</b></span>` +
        `<span>🪵 木材: <b>${p.resources.wood || 0}</b></span>` +
        `<span>⚙️ 铁锭: <b>${p.resources.iron || 0}</b></span>` +
        `<span>🪙 金锭: <b>${p.resources.gold || 0}</b></span>`;

      document.getElementById('fur-in-slot').innerHTML = f.oreCount > 0
        ? `<div>${RES_ICONS[f.oreType]}</div><div>${RES_LABELS[f.oreType]} x${f.oreCount}</div>` : '空';
      document.getElementById('fur-fuel-slot').innerHTML = f.fuelCount > 0
        ? `<div>${RES_ICONS[f.fuelType]}</div><div>${RES_LABELS[f.fuelType]} x${f.fuelCount}</div>` : '空';
      document.getElementById('fur-out-slot').innerHTML = f.outputCount > 0
        ? `<div>${RES_ICONS[f.outputType]}</div><div>${RES_LABELS[f.outputType]} x${f.outputCount}</div>` : '空';

      document.getElementById('fur-flame').textContent = f.burnLeft > 0 ? '🔥 燃烧中' : '🔥 熄灭';
      document.getElementById('fur-arrow').textContent = `➡️ ${Math.floor((f.smeltProgress / 2.0) * 100)}%`;
    }

    updateFurnaces(dt) {
      const world = window.game && window.game.world;
      if (!world || !world.furnaces) return;

      let changed = false;
      for (const f of world.furnaces.values()) {
        if (f.burnLeft > 0) {
          f.burnLeft = Math.max(0, f.burnLeft - dt);
        }
        // Ignite fuel if ore is present and not burning
        if (f.burnLeft <= 0 && f.oreCount > 0 && f.fuelCount > 0) {
          f.fuelCount -= 1;
          f.burnLeft = (f.fuelType === 'coal') ? 16.0 : 3.0; // Coal smelts 8 ores, wood smelts 1.5
          if (f.fuelCount <= 0) f.fuelType = null;
          changed = true;
        }
        // Smelt progress (2.0s per ingot)
        if (f.burnLeft > 0 && f.oreCount > 0) {
          const outRes = (f.oreType === 'raw_iron') ? 'iron' : 'gold';
          if (!f.outputType || f.outputType === outRes) {
            f.smeltProgress += dt;
            if (f.smeltProgress >= 2.0) {
              f.smeltProgress = 0;
              f.oreCount -= 1;
              if (f.oreCount <= 0) f.oreType = null;
              f.outputType = outRes;
              f.outputCount += 1;
              changed = true;
            }
          }
        } else {
          f.smeltProgress = 0;
        }
      }
      if (this.isFurnaceOpen && (changed || Math.random() < 0.25)) {
        this.renderFurnace();
      }
    }
  }

  window.survivalUI = new SurvivalUI();
})();
