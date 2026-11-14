// Teammate Tactical Communication & Cooperative Management System
class TeammateManager {
  constructor() {
    this.isOpen = false;
    this.justClosed = false;
    this.modalEl = null;
    this.chatInput = null;
    this.statusContainer = null;
    this.rolesContainer = null;
    this.lastActionTime = 0;

    this.roleDescriptions = {
      DEFEND_BED: {
        title: '你去守床 (人在床在)',
        tag: '推荐配合',
        icon: '🛡️',
        desc: '队友死守红队床位、封箱防守、在基地巡逻并收集资源，拦截一切来犯之敌。队长放心外出搜集物资！'
      },
      GATHER_RESOURCES: {
        title: '你去外岛捡物资 (我来守床)',
        tag: '推荐配合',
        icon: '💎',
        desc: '队长留在基地守床，队友直奔钻石岛与中路抢绿宝石，回城带回全队科技升级，并在相遇时共享物资！'
      },
      ATTACK_BED: {
        title: '你去突袭敌方床 (我来守床)',
        tag: '主动突击',
        icon: '⚔️',
        desc: '队长负责家园防守，队友携带羊毛强渡虚空搭路，直扑敌方岛屿强拆敌床！'
      },
      FOLLOW: {
        title: '跟我来 (随行掩护)',
        tag: '双人抱团',
        icon: '👥',
        desc: '队友形影不离跟随在队长身后 3 格范围内，协同集火攻击敌人，并提供远程弓箭支援掩护！'
      },
      AUTO: {
        title: '自由战术 (自主决断)',
        tag: '智能AI',
        icon: '🤖',
        desc: '队友根据战场敌我态势、床位存活情况及全队资源，自主智能评估并随时切换守家、收集或突袭！'
      }
    };
  }

  init() {
    this.modalEl = document.getElementById('team-modal');
    this.chatInput = document.getElementById('team-chat-input');
    this.statusContainer = document.getElementById('team-modal-status-card');

    // Bind Close Button
    const closeBtn = document.getElementById('team-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeModal();
      });
    }

    // Bind HUD Button
    const hudBtn = document.getElementById('hud-team-btn');
    if (hudBtn) {
      hudBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleModal();
      });
    }

    // Bind Global Keyboard shortcut: T and Escape
    window.addEventListener('keydown', (e) => {
      // Do not process global hotkeys if activeElement is an input (unless it's Escape)
      const isInputActive = document.activeElement && (
        document.activeElement.tagName === 'INPUT' ||
        document.activeElement.tagName === 'TEXTAREA' ||
        document.activeElement.isContentEditable
      );

      if (e.code === 'Escape') {
        if (this.isOpen) {
          e.preventDefault();
          this.closeModal();
        }
      } else if (e.code === 'KeyT' || e.key === 't' || e.key === 'T') {
        if (!isInputActive) {
          if (window.game && window.game.isGameRunning) {
            e.preventDefault();
            this.toggleModal();
          }
        }
      }
    });

    // Bind Chat Input Send Button and Enter key
    const sendBtn = document.getElementById('team-chat-send-btn');
    if (sendBtn) {
      sendBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleSendInput();
      });
    }

    if (this.chatInput) {
      this.chatInput.addEventListener('keydown', (e) => {
        e.stopPropagation(); // Stop WASD or other game keys
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleSendInput();
        }
      });
    }

    // Delegate Role selection clicks
    const rolesGrid = document.querySelector('.team-roles-grid');
    if (rolesGrid) {
      rolesGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.role-card');
        if (card && card.dataset.role) {
          this.setRole(card.dataset.role);
        }
      });
    }

    // Delegate Resource Give & Request clicks
    const exchangeBox = document.querySelector('.team-exchange-box');
    if (exchangeBox) {
      exchangeBox.addEventListener('click', (e) => {
        const giveBtn = e.target.closest('.give-btn');
        if (giveBtn) {
          const type = giveBtn.dataset.type;
          const amount = parseInt(giveBtn.dataset.amount, 10) || 1;
          this.giveResource(type, amount);
          return;
        }

        const reqBtn = e.target.closest('.req-btn');
        if (reqBtn) {
          const type = reqBtn.dataset.type;
          const amount = parseInt(reqBtn.dataset.amount, 10) || 1;
          this.requestResource(type, amount);
          return;
        }
      });
    }

    // Delegate Quick Chat Pills
    const quickChat = document.querySelector('.team-quick-chat');
    if (quickChat) {
      quickChat.addEventListener('click', (e) => {
        const pill = e.target.closest('.quick-pill');
        if (pill && pill.dataset.text) {
          this.sendPlayerChat(pill.dataset.text);
        }
      });
    }
  }

  getTeammate() {
    if (!window.game || !window.game.bots) return null;
    return window.game.bots.find(b => b && b.team === 'red' && (b.isTeammate || b.id === 'red_mate'));
  }

  summonTeammate() {
    if (!window.game) return;
    const existing = this.getTeammate();
    if (existing) {
      if (existing.isDead) {
        existing.health = 20;
        existing.isDead = false;
        existing.position.copy(existing.spawnPoint);
        if (existing.group) existing.group.visible = true;
      }
      this.renderModal();
      return;
    }

    const mate = new Bot(window.game.scene, window.game.world, {
      id: 'red_mate',
      name: '红队队友',
      team: 'red',
      difficulty: window.game.selectedDifficulty || 'hard',
      spawnPos: { x: 2, y: 0.6, z: 56 }
    });

    window.game.bots.push(mate);

    if (window.SkinManager && typeof window.SkinManager.refreshAllBots === 'function') {
      window.SkinManager.refreshAllBots();
    }

    window.game.addChatMessage('§a[红队] 你的红队队友已成功加入战斗！按 T 键可分配战术或互相给东西！');
    if (window.soundManager && typeof window.soundManager.playDing === 'function') {
      window.soundManager.playDing(700);
    }

    this.renderModal();
  }

  openModal() {
    if (!this.modalEl) {
      this.modalEl = document.getElementById('team-modal');
    }
    if (!this.modalEl) return;
    this.isOpen = true;
    this.modalEl.style.display = 'block';

    if (document.exitPointerLock) {
      try {
        document.exitPointerLock();
      } catch (err) {}
    }

    try {
      this.renderModal();
    } catch (err) {
      console.warn('Error in renderModal:', err);
    }

    setTimeout(() => {
      if (!this.chatInput) {
        this.chatInput = document.getElementById('team-chat-input');
      }
      if (this.chatInput) {
        this.chatInput.focus();
      }
    }, 60);
  }

  closeModal() {
    if (!this.modalEl) {
      this.modalEl = document.getElementById('team-modal');
    }
    if (!this.modalEl) return;
    this.isOpen = false;
    this.justClosed = true;
    setTimeout(() => { this.justClosed = false; }, 800);

    this.modalEl.style.display = 'none';

    // Resume pointer lock if game is actively running
    if (window.game && window.game.isGameRunning) {
      const startScreen = document.getElementById('start-screen');
      const gameoverModal = document.getElementById('gameover-modal');
      const isStartVisible = startScreen && startScreen.style.display !== 'none';
      const isGameoverVisible = gameoverModal && gameoverModal.style.display === 'block';

      if (!isStartVisible && !isGameoverVisible && window.game.canvas) {
        try {
          const promise = window.game.canvas.requestPointerLock();
          if (promise && typeof promise.catch === 'function') {
            promise.catch(() => {});
          }
        } catch (e) {}
      }
    }
  }

  toggleModal() {
    if (this.isOpen) {
      this.closeModal();
    } else {
      this.openModal();
    }
  }

  renderModal() {
    const statusCard = document.getElementById('team-modal-status-card');
    const mate = this.getTeammate();

    if (!mate) {
      if (statusCard) {
        statusCard.innerHTML = `
          <div class="no-mate-box">
            <div class="no-mate-title">⚠️ 当前对局中暂无红队队友 (当前为单人模式)</div>
            <div class="no-mate-desc">你可以随时点击下方按钮，现场召唤一名高智商【红队队友】与你并肩作战，体验双人分工守床、搜集外岛与物资互换！</div>
            <button id="summon-mate-btn" class="summon-btn">➕ 立即召唤红队队友加入战斗 (2v2配合)</button>
          </div>
        `;
        const btn = document.getElementById('summon-mate-btn');
        if (btn) {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.summonTeammate();
          });
        }
      }
      return;
    }

    // Teammate is present: Render Detailed Live Status
    const curHp = Math.max(0, Math.round(mate.health || 0));
    const maxHp = mate.maxHealth || 20;
    const hpPct = Math.max(0, Math.min(100, (curHp / maxHp) * 100));

    const swordName = mate.weaponTier === 'diamond' ? '钻剑' : (mate.weaponTier === 'iron' ? '铁剑' : (mate.weaponTier === 'stone' ? '石剑' : '木剑'));
    const armorName = mate.armorTier === 'diamond' ? '钻甲' : (mate.armorTier === 'iron' ? '铁甲' : (mate.armorTier === 'chain' ? '链甲' : '皮甲'));

    const roleInfo = (this.roleDescriptions && this.roleDescriptions[mate.tacticalRole]) ? this.roleDescriptions[mate.tacticalRole] : ((this.roleDescriptions && this.roleDescriptions.AUTO) || { icon: '🤖', title: '自由战术' });
    const isDead = !!mate.isDead;
    const roleTitleShort = (roleInfo.title && roleInfo.title.split(' ')[0]) || '战术';

    const ironCount = (mate.resources && mate.resources.iron) || 0;
    const goldCount = (mate.resources && mate.resources.gold) || 0;
    const diamondCount = (mate.resources && mate.resources.diamond) || 0;
    const emeraldCount = (mate.resources && mate.resources.emerald) || 0;
    const woolCount = mate.woolCount || 0;
    const gappleCount = mate.goldenApples || 0;

    if (statusCard) {
      statusCard.innerHTML = `
        <div class="mate-profile-row">
          <div class="mate-avatar-badge">
            <span class="mate-avatar-icon">${roleInfo.icon || '🤖'}</span>
          </div>
          <div class="mate-meta">
            <div class="mate-name-line">
              <span class="mate-name">${mate.name || '队友'}</span>
              <span class="mate-status-tag ${isDead ? 'status-dead' : 'status-alive'}">
                ${isDead ? '❤️ 复活中...' : '🟢 战斗中'}
              </span>
              <span class="mate-role-badge">${roleInfo.icon || '🤖'} ${roleTitleShort}</span>
            </div>
            <div class="mate-hp-container">
              <div class="mate-hp-bar" style="width: ${hpPct}%; background: ${hpPct > 50 ? '#44ff44' : (hpPct > 25 ? '#ffbb33' : '#ff3333')};"></div>
              <span class="mate-hp-text">生命值: ${curHp} / ${maxHp}</span>
            </div>
            <div class="mate-gear-line">
              <span>🗡️ 武器: <b>${swordName}</b></span>
              <span>🛡️ 护甲: <b>${armorName}</b></span>
              <span>🏹 弓箭: <b>${mate.hasBow ? '已持有' : '无'}</b></span>
            </div>
          </div>
        </div>
        <div class="mate-res-row">
          <div class="mate-res-item"><span class="res-icon res-iron"></span> 铁锭: <b>${ironCount}</b></div>
          <div class="mate-res-item"><span class="res-icon res-gold"></span> 金锭: <b>${goldCount}</b></div>
          <div class="mate-res-item"><span class="res-icon res-diamond"></span> 钻石: <b>${diamondCount}</b></div>
          <div class="mate-res-item"><span class="res-icon res-emerald"></span> 绿宝石: <b>${emeraldCount}</b></div>
          <div class="mate-res-item">🧱 羊毛: <b>${woolCount}</b></div>
          <div class="mate-res-item">🍏 金苹果: <b>${gappleCount}</b></div>
        </div>
      `;
    }

    // Highlight current active role card
    const roleCards = document.querySelectorAll('.role-card');
    roleCards.forEach(card => {
      if (card.dataset.role === mate.tacticalRole) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
  }

  setRole(role) {
    const mate = this.getTeammate();
    if (!mate) {
      this.summonTeammate();
      return;
    }

    mate.tacticalRole = role;
    mate.chooseNextObjective(false);
    if (typeof mate.updateNametag === 'function') {
      mate.updateNametag(true);
    }

    const responses = {
      DEFEND_BED: '收到！红队的床交给我，人在床在！队长你放心去外岛捡物资！',
      GATHER_RESOURCES: '收到！你守好床，我现在就去外岛抢夺钻石和绿宝石，全队科技神装包在我身上！',
      ATTACK_BED: '收到！我带上羊毛这就去偷家，看我拆了敌方的床！',
      FOLLOW: '收到！队长，我紧跟在你身后，随时为你架弓掩护！',
      AUTO: '了解！我将根据战场局势灵活应变！'
    };

    const reply = responses[role] || '收到战术指令！';
    window.game.addChatMessage(`§c[红队队友] ${reply}`);

    if (window.soundManager && typeof window.soundManager.playDing === 'function') {
      window.soundManager.playDing(680);
    }

    this.renderModal();
  }

  giveResource(type, amount) {
    const mate = this.getTeammate();
    if (!mate) {
      if (window.game && typeof window.game.addChatMessage === 'function') {
        window.game.addChatMessage('§c[提示] 当前没有队友！请先点击召唤队友。');
      }
      return;
    }

    const player = window.player;
    if (!player) return;

    const resNames = {
      iron: '铁锭',
      gold: '金锭',
      diamond: '钻石',
      emerald: '绿宝石',
      wool: '羊毛',
      gapple: '金苹果'
    };

    if (type === 'wool') {
      const currentWool = (typeof player.countItem === 'function') ? player.countItem('wool') : (player.hotbar.find(s => s && s.id === 'red_wool')?.count || 0);
      if (currentWool < amount) {
        window.game.addChatMessage('§c[提示] 你身上的羊毛不足！');
        return;
      }
      if (typeof player.consumeItem === 'function') {
        player.consumeItem('wool', amount);
      } else {
        const woolSlot = player.hotbar.find(s => s && s.type === 'block' && s.id === 'red_wool');
        woolSlot.count -= amount;
        if (woolSlot.count <= 0) {
          const idx = player.hotbar.indexOf(woolSlot);
          player.hotbar[idx] = null;
        }
      }
      mate.woolCount += amount;
      player.updateHUD();
      player.updateHeldItemVisual();
    } else if (type === 'gapple') {
      const currentGapple = (typeof player.countItem === 'function') ? player.countItem('golden_apple') : (player.hotbar.find(s => s && s.id === 'golden_apple')?.count || 0);
      if (currentGapple < amount) {
        window.game.addChatMessage('§c[提示] 你身上的金苹果不足！');
        return;
      }
      if (typeof player.consumeItem === 'function') {
        player.consumeItem('golden_apple', amount);
      } else {
        const gappleSlot = player.hotbar.find(s => s && s.id === 'golden_apple');
        gappleSlot.count -= amount;
        if (gappleSlot.count <= 0) {
          const idx = player.hotbar.indexOf(gappleSlot);
          player.hotbar[idx] = null;
        }
      }
      mate.goldenApples = (mate.goldenApples || 0) + amount;
      player.updateHUD();
      player.updateHeldItemVisual();
    } else {
      // Iron, Gold, Diamond, Emerald
      if ((player.resources[type] || 0) < amount) {
        window.game.addChatMessage(`§c[提示] 你身上的${resNames[type]}不足！`);
        return;
      }
      player.resources[type] -= amount;
      mate.resources[type] = (mate.resources[type] || 0) + amount;
      player.updateHUD();
    }

    // If teammate is at base near shopkeeper, it can immediately purchase upgrades
    const myTeam = mate.teamData && (mate.teamData[mate.team] || mate.teamData.red);
    const distToShop = myTeam && myTeam.shop ? mate.position.distanceTo(myTeam.shop) : 999;
    if (distToShop < 5.0 && typeof mate.buyShopItems === 'function') {
      mate.buyShopItems();
    }

    if (window.soundManager && typeof window.soundManager.playDing === 'function') {
      window.soundManager.playDing(880);
    }

    window.game.addChatMessage(`§c[红队队友] 多谢队长！收到你给的 ${amount} 个${resNames[type]}，我这就去升级神装！`);
    this.renderModal();
  }

  requestResource(type, amount) {
    const mate = this.getTeammate();
    if (!mate) {
      if (window.game && typeof window.game.addChatMessage === 'function') {
        window.game.addChatMessage('§c[提示] 当前没有队友！请先点击召唤队友。');
      }
      return;
    }

    const player = window.player;
    if (!player) return;

    const resNames = {
      iron: '铁锭',
      gold: '金锭',
      diamond: '钻石',
      emerald: '绿宝石',
      wool: '羊毛'
    };

    let available = 0;
    if (type === 'wool') {
      available = mate.woolCount;
    } else {
      available = mate.resources[type] || 0;
    }

    if (available <= 0) {
      window.game.addChatMessage(`§c[红队队友] 队长，我现在身上没有${resNames[type]}，我马上去外岛/资源点捡！`);
      if (window.soundManager && typeof window.soundManager.playDing === 'function') {
        window.soundManager.playDing(450);
      }
      // If mate has gather role or auto, push to gather
      if (mate.tacticalRole !== 'DEFEND_BED') {
        if (type === 'diamond') mate.state = 'GATHER_DIAMOND';
        else if (type === 'emerald') mate.state = 'GATHER_EMERALD';
        else mate.state = 'GATHER';
      }
      return;
    }

    const transferred = Math.min(available, amount);
    if (type === 'wool') {
      mate.woolCount -= transferred;
      player.addResource('wool', Math.ceil(transferred / 16));
    } else {
      mate.resources[type] -= transferred;
      player.addResource(type, transferred);
    }

    if (window.soundManager && typeof window.soundManager.playDing === 'function') {
      window.soundManager.playDing(840);
    }

    window.game.addChatMessage(`§c[红队队友] 没问题！分给你 ${transferred} 个${resNames[type]}，拿去升级装备！咱们一起赢！`);
    this.renderModal();
  }

  handleSendInput() {
    if (!this.chatInput) return;
    const text = this.chatInput.value.trim();
    if (!text) return;
    this.chatInput.value = '';
    this.sendPlayerChat(text);
  }

  sendPlayerChat(text) {
    if (!window.game) return;

    // Output Player Chat Message
    window.game.addChatMessage(`§f[我] §e${text}`);

    const mate = this.getTeammate();
    if (!mate) {
      window.game.addChatMessage('§7[系统] 当前暂无红队队友在场，点击左上角 [💬 队友战术] 可一键召唤队友！');
      return;
    }

    const t = text.toLowerCase();

    // Natural Language Tactical Intent Matching:
    // 1. Defend Bed (守床/守家/防守)
    if ((t.includes('守') && (t.includes('床') || t.includes('家'))) || t.includes('防守') || t.includes('看家') || t.includes('人在床在')) {
      this.setRole('DEFEND_BED');
      return;
    }

    // 2. Attack Bed (偷家/偷床/突袭/拆床/偷敌方的床/进攻)
    if ((t.includes('偷') && (t.includes('床') || t.includes('家') || t.includes('敌'))) || t.includes('突袭') || t.includes('拆床') || t.includes('破床') || t.includes('进攻') || t.includes('突击') || t.includes('打蓝') || t.includes('打绿') || t.includes('打黄')) {
      this.setRole('ATTACK_BED');
      return;
    }

    // 3. Gather Resources (捡物资/搜集/抢资源/钻石/绿宝石/外岛)
    if (t.includes('捡物资') || t.includes('捡资源') || t.includes('搜集') || t.includes('抢资源') || t.includes('外岛') || t.includes('采矿') || t.includes('抢钻石') || t.includes('抢绿宝石')) {
      this.setRole('GATHER_RESOURCES');
      return;
    }

    // 4. Follow Player (跟我来/跟上/掩护/过来)
    if (t.includes('跟我') || t.includes('跟上') || t.includes('过来') || t.includes('掩护') || t.includes('来我这') || t.includes('抱团')) {
      this.setRole('FOLLOW');
      return;
    }

    // 5. Auto / Free Tactics
    if (t.includes('自由') || t.includes('随便') || t.includes('自主')) {
      this.setRole('AUTO');
      return;
    }

    // 6. Requesting Resources from Teammate
    if (t.includes('要铁') || t.includes('给我铁') || t.includes('给点铁') || t.includes('分点铁')) {
      this.requestResource('iron', 5);
      return;
    }
    if (t.includes('要金') || t.includes('给我金') || t.includes('给点金') || t.includes('分点金')) {
      this.requestResource('gold', 2);
      return;
    }
    if (t.includes('要钻') || t.includes('给我钻') || t.includes('给点钻') || t.includes('分点钻')) {
      this.requestResource('diamond', 2);
      return;
    }
    if (t.includes('要绿') || t.includes('给我绿') || t.includes('给点绿') || t.includes('分点绿')) {
      this.requestResource('emerald', 1);
      return;
    }
    if (t.includes('要羊毛') || t.includes('给我羊毛') || t.includes('给点羊毛') || t.includes('分点羊毛')) {
      this.requestResource('wool', 16);
      return;
    }

    // 7. Retreat / Run
    if (t.includes('撤退') || t.includes('快跑') || t.includes('回家') || t.includes('回来')) {
      mate.state = 'GATHER';
      mate.stateTimer = 0;
      window.game.addChatMessage('§c[红队队友] 收到指令，我正在全速撤回红队基地！');
      if (window.soundManager && typeof window.soundManager.playDing === 'function') {
        window.soundManager.playDing(600);
      }
      return;
    }

    // 8. Encouragement / Compliments
    if (t.includes('牛逼') || t.includes('厉害') || t.includes('666') || t.includes('强') || t.includes('加油') || t.includes('漂亮')) {
      const compliments = [
        '哈哈！有队长神级指挥，这局我们必胜！',
        '队长过奖啦！随时准备为你掩护！',
        '冲冲冲，为了红队的胜利！'
      ];
      const reply = compliments[Math.floor(Math.random() * compliments.length)];
      window.game.addChatMessage(`§c[红队队友] ${reply}`);
      if (window.soundManager && typeof window.soundManager.playDing === 'function') {
        window.soundManager.playDing(750);
      }
      return;
    }

    // Default conversational response
    const roleInfo = this.roleDescriptions[mate.tacticalRole] || this.roleDescriptions.AUTO;
    window.game.addChatMessage(`§c[红队队友] 收到！我目前正在执行【${roleInfo.title.split(' ')[0]}】战术，队长有需要随时吩咐！`);
    if (window.soundManager && typeof window.soundManager.playDing === 'function') {
      window.soundManager.playDing(640);
    }
  }
}

window.TeammateManager = new TeammateManager();
