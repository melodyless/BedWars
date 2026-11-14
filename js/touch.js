// Touch Controls System for Mobile & Tablet (Minecraft Bedrock / NetEase PE Style)
class TouchControls {
  constructor(game) {
    this.game = game;
    this.player = null;

    // Detection & State
    this.hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 960);
    // User preference stored in localStorage
    const savedTouchPref = localStorage.getItem('bedwars_touch_enabled');
    this.enabled = savedTouchPref !== null ? (savedTouchPref === 'true') : this.hasTouch;

    const savedMode = localStorage.getItem('bedwars_touch_mode');
    this.controlMode = savedMode || 'dpad'; // 'dpad' or 'joystick'

    const savedSens = localStorage.getItem('bedwars_touch_sens');
    this.lookSensitivity = savedSens ? parseFloat(savedSens) : 1.0;

    const savedOpacity = localStorage.getItem('bedwars_touch_opacity');
    this.btnOpacity = savedOpacity ? parseFloat(savedOpacity) : 0.85;

    // State tracking
    this.sneakLocked = false;
    this.dpadTouchId = null;
    this.joystickTouchId = null;
    this.lookTouchId = null;
    this.lastLookX = 0;
    this.lastLookY = 0;

    // Tap / Long Press on Screen
    this.screenTapTouchId = null;
    this.screenTapStartTime = 0;
    this.screenTapStartX = 0;
    this.screenTapStartY = 0;
    this.longPressTimer = null;
    this.isScreenMining = false;

    // Continuous block place timer
    this.continuousPlaceTimer = null;
    this.isPlacingDown = false;

    // DOM Elements Cache
    this.dom = {};

    this.createUI();
    this.bindEvents();
    this.applyVisibility();
  }

  setPlayer(player) {
    this.player = player;
  }

  createUI() {
    // Remove if already existing
    const old = document.getElementById('touch-controls-container');
    if (old) old.remove();

    const container = document.createElement('div');
    container.id = 'touch-controls-container';
    container.className = 'touch-container';
    container.innerHTML = `
      <!-- Top Quick Touch Bar -->
      <div id="touch-top-bar" class="touch-top-bar">
        <button id="touch-btn-pause" class="touch-top-btn" type="button" title="暂停游戏">⏸️</button>
        <button id="touch-btn-settings" class="touch-top-btn" type="button" title="触控设置">⚙️ 触控</button>
        <button id="touch-btn-switch-mode" class="touch-top-btn" type="button" title="切换十字键/摇杆">🎮 <span id="touch-mode-label">十字键</span></button>
      </div>

      <!-- Left Zone: D-Pad & Joystick -->
      <div id="touch-left-zone" class="touch-left-zone">
        <!-- D-Pad (Classic Minecraft PE Cross Pad) -->
        <div id="touch-dpad" class="touch-dpad ${this.controlMode === 'dpad' ? 'active' : 'hidden'}">
          <div class="dpad-row dpad-row-top">
            <div id="dpad-up" class="dpad-btn dpad-up" data-dir="forward">▲</div>
          </div>
          <div class="dpad-row dpad-row-mid">
            <div id="dpad-left" class="dpad-btn dpad-left" data-dir="left">◀</div>
            <div id="dpad-center" class="dpad-btn dpad-center" title="点击锁定/解锁下蹲(防掉虚空)">
              <div class="dpad-sneak-icon">❖</div>
            </div>
            <div id="dpad-right" class="dpad-btn dpad-right" data-dir="right">▶</div>
          </div>
          <div class="dpad-row dpad-row-bottom">
            <div id="dpad-down" class="dpad-btn dpad-down" data-dir="backward">▼</div>
          </div>
        </div>

        <!-- Virtual Joystick -->
        <div id="touch-joystick" class="touch-joystick ${this.controlMode === 'joystick' ? 'active' : 'hidden'}">
          <div id="touch-joystick-base" class="joystick-base">
            <div id="touch-joystick-thumb" class="joystick-thumb"></div>
          </div>
          <div id="touch-joystick-sneak" class="joystick-sneak-btn" title="点击锁定/解锁下蹲">❖</div>
        </div>
      </div>

      <!-- Right Zone: Action Buttons (NetEase Bedrock Style) -->
      <div id="touch-right-zone" class="touch-right-zone">
        <!-- Sneak Toggle Button (Secondary) -->
        <div id="touch-btn-sneak" class="touch-action-btn btn-sneak" title="下蹲/防掉虚空">
          <span class="touch-btn-icon">❖</span>
          <span class="touch-btn-tag">潜行</span>
        </div>

        <!-- Drop Item Button -->
        <div id="touch-btn-drop" class="touch-action-btn btn-drop" title="丢弃手持物品给队友 (Q)">
          <span class="touch-btn-icon">📤</span>
          <span class="touch-btn-tag">丢弃</span>
        </div>

        <!-- Attack / Break Block Button -->
        <div id="touch-btn-attack" class="touch-action-btn btn-attack" title="攻击敌人 / 长按破坏方块">
          <span class="touch-btn-icon">⚔️</span>
          <span class="touch-btn-tag">破坏/攻击</span>
        </div>

        <!-- Use Item / Place Block / Shoot Bow Button -->
        <div id="touch-btn-use" class="touch-action-btn btn-use" title="长按搭桥 / 蓄力射箭 / 使用道具">
          <span class="touch-btn-icon">🧱</span>
          <span class="touch-btn-tag">放置/使用</span>
        </div>

        <!-- Big Jump Button -->
        <div id="touch-btn-jump" class="touch-action-btn btn-jump" title="跳跃 (下落暴击)">
          <span class="touch-btn-icon">▲</span>
          <span class="touch-btn-tag">跳跃</span>
        </div>
      </div>

      <!-- Interactive NPC Villager Floating Button -->
      <div id="touch-interact-btn" class="touch-interact-btn hidden">
        <span class="interact-icon">💬</span>
        <span class="interact-text">打开村民商店</span>
      </div>

      <!-- Touch Settings Modal -->
      <div id="touch-settings-modal" class="touch-settings-modal hidden">
        <div class="touch-settings-box">
          <div class="touch-settings-header">
            <span>⚙️ 触控操作设置</span>
            <button id="touch-settings-close" class="touch-settings-close-btn" type="button">✖</button>
          </div>
          <div class="touch-settings-body">
            <div class="touch-setting-item">
              <label>触控虚拟按键：</label>
              <div class="setting-toggle-group">
                <button id="touch-opt-enable" class="setting-opt-btn active" type="button">开启</button>
                <button id="touch-opt-disable" class="setting-opt-btn" type="button">关闭</button>
              </div>
            </div>

            <div class="touch-setting-item">
              <label>左手移动控制模式：</label>
              <div class="setting-toggle-group">
                <button id="touch-opt-dpad" class="setting-opt-btn active" type="button">经典十字键 (网易原版)</button>
                <button id="touch-opt-joystick" class="setting-opt-btn" type="button">全向虚拟摇杆</button>
              </div>
            </div>

            <div class="touch-setting-item">
              <label>滑动视角灵敏度：<span id="touch-sens-val">1.0x</span></label>
              <input type="range" id="touch-sens-slider" min="0.4" max="2.6" step="0.1" value="1.0" />
            </div>

            <div class="touch-setting-item">
              <label>按键透明度：<span id="touch-opacity-val">85%</span></label>
              <input type="range" id="touch-opacity-slider" min="0.3" max="1.0" step="0.05" value="0.85" />
            </div>

            <div class="touch-setting-tip">
              💡 <b>网易原版手感提示：</b><br>
              • <b>快速搭路</b>：按住右侧【放置/使用】按钮并向前走，即可自动连续快速搭桥！<br>
              • <b>防掉虚空</b>：点击十字键中心【❖】或潜行按钮锁定潜行，搭桥绝不失误掉虚空！<br>
              • <b>蓄力射箭</b>：手持弓箭时长按【放置/使用】按钮拉弓蓄力，松开即可射击！<br>
              • <b>视角转动</b>：在屏幕右半边空白区域任意滑动即可丝滑转动第一视角。
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('game-container').appendChild(container);

    // Cache elements
    this.dom.container = container;
    this.dom.topBar = container.querySelector('#touch-top-bar');
    this.dom.dpad = container.querySelector('#touch-dpad');
    this.dom.dpadCenter = container.querySelector('#dpad-center');
    this.dom.joystick = container.querySelector('#touch-joystick');
    this.dom.joystickBase = container.querySelector('#touch-joystick-base');
    this.dom.joystickThumb = container.querySelector('#touch-joystick-thumb');
    this.dom.joystickSneak = container.querySelector('#touch-joystick-sneak');
    this.dom.btnSneak = container.querySelector('#touch-btn-sneak');
    this.dom.btnJump = container.querySelector('#touch-btn-jump');
    this.dom.btnAttack = container.querySelector('#touch-btn-attack');
    this.dom.btnUse = container.querySelector('#touch-btn-use');
    this.dom.btnDrop = container.querySelector('#touch-btn-drop');
    this.dom.btnPause = container.querySelector('#touch-btn-pause');
    this.dom.btnSettings = container.querySelector('#touch-btn-settings');
    this.dom.btnSwitchMode = container.querySelector('#touch-btn-switch-mode');
    this.dom.modeLabel = container.querySelector('#touch-mode-label');
    this.dom.interactBtn = container.querySelector('#touch-interact-btn');
    this.dom.settingsModal = container.querySelector('#touch-settings-modal');

    this.applyOpacity();
    this.updateModeUI();
  }

  applyVisibility() {
    if (!this.dom.container) return;
    if (this.enabled) {
      this.dom.container.classList.remove('touch-disabled');
      document.body.classList.add('touch-mode-active');
    } else {
      this.dom.container.classList.add('touch-disabled');
      document.body.classList.remove('touch-mode-active');
    }
  }

  applyOpacity() {
    if (!this.dom.container) return;
    this.dom.container.style.setProperty('--touch-opacity', this.btnOpacity);
  }

  updateModeUI() {
    if (!this.dom.dpad || !this.dom.joystick) return;
    if (this.controlMode === 'dpad') {
      this.dom.dpad.classList.remove('hidden');
      this.dom.dpad.classList.add('active');
      this.dom.joystick.classList.add('hidden');
      this.dom.joystick.classList.remove('active');
      if (this.dom.modeLabel) this.dom.modeLabel.innerText = '十字键';
    } else {
      this.dom.dpad.classList.add('hidden');
      this.dom.dpad.classList.remove('active');
      this.dom.joystick.classList.remove('hidden');
      this.dom.joystick.classList.add('active');
      if (this.dom.modeLabel) this.dom.modeLabel.innerText = '摇杆';
    }
  }

  bindEvents() {
    const self = this;

    // --- 1. Mode Switch & Settings Button ---
    this.dom.btnSwitchMode.addEventListener('click', (e) => {
      e.stopPropagation();
      self.controlMode = (self.controlMode === 'dpad') ? 'joystick' : 'dpad';
      localStorage.setItem('bedwars_touch_mode', self.controlMode);
      self.resetMovement();
      self.updateModeUI();
    });

    this.dom.btnSettings.addEventListener('click', (e) => {
      e.stopPropagation();
      self.openSettings();
    });

    this.dom.btnPause.addEventListener('click', (e) => {
      e.stopPropagation();
      const resumeOverlay = document.getElementById('resume-overlay');
      if (resumeOverlay) {
        resumeOverlay.style.display = 'flex';
      }
    });

    // --- 2. D-Pad Touch Handling ---
    const dpad = this.dom.dpad;
    const dpadCenter = this.dom.dpadCenter;

    const updateDpadDirection = (touch) => {
      if (!self.player) return;
      const rect = dpad.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = touch.clientX - centerX;
      const dy = touch.clientY - centerY;
      const dist = Math.hypot(dx, dy);

      // Center deadzone: if close to center, check sneak toggle
      if (dist < rect.width * 0.18) {
        self.player.keys.forward = false;
        self.player.keys.backward = false;
        self.player.keys.left = false;
        self.player.keys.right = false;
        return;
      }

      // 8-Way / 4-Way D-pad calculation based on angle
      const angle = Math.atan2(dy, dx); // radians, 0 is right, PI/2 is down
      const deg = (angle * 180 / Math.PI + 360) % 360; // 0 to 360 deg

      // Reset
      self.player.keys.forward = false;
      self.player.keys.backward = false;
      self.player.keys.left = false;
      self.player.keys.right = false;

      // 45 degree sector bands for fluid diagonal support
      // Up: 247.5 to 292.5
      // Up-Right: 292.5 to 337.5
      // Right: 337.5 to 22.5
      // Down-Right: 22.5 to 67.5
      // Down: 67.5 to 112.5
      // Down-Left: 112.5 to 157.5
      // Left: 157.5 to 202.5
      // Up-Left: 202.5 to 247.5

      if (deg >= 202.5 && deg < 337.5) {
        self.player.keys.forward = true;
      }
      if (deg >= 22.5 && deg < 157.5) {
        self.player.keys.backward = true;
      }
      if (deg >= 112.5 && deg < 247.5) {
        self.player.keys.left = true;
      }
      if (deg >= 292.5 || deg < 67.5) {
        self.player.keys.right = true;
      }

      // Visual active feedback on dpad buttons
      self.updateDpadVisuals();
    };

    dpad.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const touch = e.changedTouches[0];
      self.dpadTouchId = touch.identifier;

      // If clicked exactly on center sneak button
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      if (target && target.closest('#dpad-center')) {
        self.toggleSneak();
        return;
      }

      updateDpadDirection(touch);
    }, { passive: false });

    dpad.addEventListener('touchmove', (e) => {
      e.preventDefault();
      e.stopPropagation();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === self.dpadTouchId) {
          updateDpadDirection(touch);
          break;
        }
      }
    }, { passive: false });

    const endDpadTouch = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === self.dpadTouchId) {
          self.dpadTouchId = null;
          if (self.player) {
            self.player.keys.forward = false;
            self.player.keys.backward = false;
            self.player.keys.left = false;
            self.player.keys.right = false;
          }
          self.clearDpadVisuals();
          break;
        }
      }
    };
    dpad.addEventListener('touchend', endDpadTouch, { passive: false });
    dpad.addEventListener('touchcancel', endDpadTouch, { passive: false });

    // --- 3. Virtual Joystick Touch Handling ---
    const joystick = this.dom.joystick;
    const base = this.dom.joystickBase;
    const thumb = this.dom.joystickThumb;
    const maxRadius = 45; // pixels max displacement

    const updateJoystick = (touch) => {
      if (!self.player) return;
      const rect = base.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      let dx = touch.clientX - centerX;
      let dy = touch.clientY - centerY;
      const dist = Math.hypot(dx, dy);

      if (dist > maxRadius) {
        dx = (dx / dist) * maxRadius;
        dy = (dy / dist) * maxRadius;
      }

      thumb.style.transform = `translate(${dx}px, ${dy}px)`;

      // Normalize [-1, 1]
      const nx = dx / maxRadius;
      const ny = dy / maxRadius;

      // Update touch move vector on player
      self.player.touchMoveVector = {
        x: nx,
        z: -ny // dy > 0 is backwards, so -ny is forward
      };

      // Also set boolean keys for backward compatibility
      self.player.keys.forward = (ny < -0.28);
      self.player.keys.backward = (ny > 0.28);
      self.player.keys.left = (nx < -0.28);
      self.player.keys.right = (nx > 0.28);
    };

    base.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const touch = e.changedTouches[0];
      self.joystickTouchId = touch.identifier;
      updateJoystick(touch);
    }, { passive: false });

    base.addEventListener('touchmove', (e) => {
      e.preventDefault();
      e.stopPropagation();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === self.joystickTouchId) {
          updateJoystick(touch);
          break;
        }
      }
    }, { passive: false });

    const endJoystick = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === self.joystickTouchId) {
          self.joystickTouchId = null;
          thumb.style.transform = 'translate(0px, 0px)';
          if (self.player) {
            self.player.touchMoveVector = { x: 0, z: 0 };
            self.player.keys.forward = false;
            self.player.keys.backward = false;
            self.player.keys.left = false;
            self.player.keys.right = false;
          }
          break;
        }
      }
    };
    base.addEventListener('touchend', endJoystick, { passive: false });
    base.addEventListener('touchcancel', endJoystick, { passive: false });

    // Sneak buttons
    this.dom.joystickSneak.addEventListener('click', (e) => {
      e.stopPropagation();
      self.toggleSneak();
    });

    this.dom.btnSneak.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      self.toggleSneak();
    }, { passive: false });

    // --- 4. Right Action Buttons Handling ---

    // A. Jump Button
    this.dom.btnJump.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (self.player) {
        self.player.keys.jump = true;
      }
      self.dom.btnJump.classList.add('pressed');
    }, { passive: false });

    const endJump = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (self.player) {
        self.player.keys.jump = false;
      }
      self.dom.btnJump.classList.remove('pressed');
    };
    this.dom.btnJump.addEventListener('touchend', endJump, { passive: false });
    this.dom.btnJump.addEventListener('touchcancel', endJump, { passive: false });

    // B. Attack / Mine Button
    this.dom.btnAttack.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      self.dom.btnAttack.classList.add('pressed');
      if (self.player) {
        self.player.startAttackOrMine();
      }
    }, { passive: false });

    const endAttack = (e) => {
      e.preventDefault();
      e.stopPropagation();
      self.dom.btnAttack.classList.remove('pressed');
      if (self.player) {
        self.player.stopMining();
      }
    };
    this.dom.btnAttack.addEventListener('touchend', endAttack, { passive: false });
    this.dom.btnAttack.addEventListener('touchcancel', endAttack, { passive: false });

    // C. Use / Place / Bow Button (Support touch, pointer and click)
    const startUse = (e) => {
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
      self.dom.btnUse.classList.add('pressed');
      self.handleUseStart();
    };

    const endUse = (e) => {
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
      self.dom.btnUse.classList.remove('pressed');
      self.handleUseEnd();
    };

    this.dom.btnUse.addEventListener('touchstart', startUse, { passive: false });
    this.dom.btnUse.addEventListener('touchend', endUse, { passive: false });
    this.dom.btnUse.addEventListener('touchcancel', endUse, { passive: false });
    this.dom.btnUse.addEventListener('pointerdown', startUse);
    this.dom.btnUse.addEventListener('pointerup', endUse);

    // D. Drop Item Button
    this.dom.btnDrop.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (self.player) {
        self.player.dropItem();
      }
      self.dom.btnDrop.classList.add('pressed');
      setTimeout(() => self.dom.btnDrop.classList.remove('pressed'), 180);
    }, { passive: false });

    // E. Villager Interact Button
    this.dom.interactBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (window.shopManager) {
        window.shopManager.openShop();
      }
    }, { passive: false });

    // --- 5. Screen View Look Touch & Tap Mining/Attacking ---
    const canvas = document.getElementById('render-canvas');
    const touchArea = document.getElementById('game-container');

    const isElementInteractive = (el) => {
      if (!el) return false;
      return !!el.closest('.touch-left-zone, .touch-right-zone, .touch-top-bar, #hotbar, #bottom-hud, #status-bars, #resources-display, #hud-top-actions, #shop-modal, #team-modal, #backpack-modal, #start-screen, #gameover-modal, #resume-overlay, .touch-settings-modal');
    };

    touchArea.addEventListener('touchstart', (e) => {
      if (!self.enabled || !self.player || self.player.isDead) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);

        if (isElementInteractive(target)) continue;

        // If touch is on right half or middle screen, allocate as Look touch
        if (self.lookTouchId === null) {
          self.lookTouchId = touch.identifier;
          self.lastLookX = touch.clientX;
          self.lastLookY = touch.clientY;

          // Also prepare for tap / long-press mining
          self.screenTapTouchId = touch.identifier;
          self.screenTapStartX = touch.clientX;
          self.screenTapStartY = touch.clientY;
          self.screenTapStartTime = performance.now();
          self.isScreenMining = false;

          if (self.longPressTimer) clearTimeout(self.longPressTimer);
          self.longPressTimer = setTimeout(() => {
            if (self.screenTapTouchId === touch.identifier && self.player) {
              const currentItem = self.player.hotbar[self.player.selectedSlot];
              const isUsable = currentItem && (
                currentItem.type === 'potion' ||
                currentItem.type === 'utility' ||
                (currentItem.id && (
                  currentItem.id.startsWith('potion_') ||
                  currentItem.id === 'golden_apple' ||
                  currentItem.id === 'enchanted_golden_apple' ||
                  currentItem.id === 'fireball' ||
                  currentItem.id === 'ender_pearl'
                ))
              );

              if (isUsable) {
                // Long press on screen directly uses potion/golden apple/pearl!
                self.player.handleRightClick();
              } else if (currentItem && currentItem.type === 'bow') {
                self.handleUseStart();
              } else {
                self.isScreenMining = true;
                self.player.startAttackOrMine();
              }
            }
          }, 240); // 240ms long-press triggers item use / block mining
        }
      }
    }, { passive: true });

    touchArea.addEventListener('touchmove', (e) => {
      if (!self.enabled || !self.player || self.player.isDead) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];

        if (touch.identifier === self.lookTouchId) {
          const dx = touch.clientX - self.lastLookX;
          const dy = touch.clientY - self.lastLookY;
          self.lastLookX = touch.clientX;
          self.lastLookY = touch.clientY;

          // Check if moved too far to cancel tap
          if (self.longPressTimer && Math.hypot(touch.clientX - self.screenTapStartX, touch.clientY - self.screenTapStartY) > 12) {
            clearTimeout(self.longPressTimer);
            self.longPressTimer = null;
          }

          // Smooth Look Rotation
          const sensitivity = 0.0036 * self.lookSensitivity;
          self.player.yaw -= dx * sensitivity;
          self.player.pitch -= dy * sensitivity;

          const maxPitch = Math.PI / 2 - 0.02;
          self.player.pitch = Math.max(-maxPitch, Math.min(maxPitch, self.player.pitch));
        }
      }
    }, { passive: true });

    const endLookTouch = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];

        if (touch.identifier === self.lookTouchId) {
          self.lookTouchId = null;

          if (self.longPressTimer) {
            clearTimeout(self.longPressTimer);
            self.longPressTimer = null;
          }

          if (self.isScreenMining) {
            self.isScreenMining = false;
            if (self.player) self.player.stopMining();
          } else {
            // Check tap on screen
            const elapsed = performance.now() - self.screenTapStartTime;
            const dist = Math.hypot(touch.clientX - self.screenTapStartX, touch.clientY - self.screenTapStartY);
            if (elapsed < 240 && dist < 15 && self.player) {
              const currentItem = self.player.hotbar[self.player.selectedSlot];
              const isUsable = currentItem && (
                currentItem.type === 'potion' ||
                currentItem.type === 'utility' ||
                (currentItem.id && (
                  currentItem.id.startsWith('potion_') ||
                  currentItem.id === 'golden_apple' ||
                  currentItem.id === 'enchanted_golden_apple' ||
                  currentItem.id === 'fireball' ||
                  currentItem.id === 'ender_pearl'
                ))
              );

              if (isUsable) {
                // Tapping screen directly uses/drinks held item
                self.player.handleRightClick();
              } else {
                // Quick tap in screen: attack / interact
                self.player.startAttackOrMine();
                setTimeout(() => {
                  if (self.player) self.player.stopMining();
                }, 60);
              }
            }
          }
        }
      }
    };

    touchArea.addEventListener('touchend', endLookTouch, { passive: true });
    touchArea.addEventListener('touchcancel', endLookTouch, { passive: true });

    // --- 6. Hotbar Direct Touch Selection & Double Tap Use ---
    const hotbarEl = document.getElementById('hotbar');
    if (hotbarEl) {
      let lastTapSlot = -1;
      let lastTapTime = 0;

      const handleHotbarTouch = (e) => {
        const slotEl = e.target.closest('.hotbar-slot');
        if (!slotEl || !self.player) return;
        e.stopPropagation();

        let slotIndex = parseInt(slotEl.dataset.index, 10);
        if (isNaN(slotIndex)) {
          slotIndex = Array.from(slotEl.parentElement.children).indexOf(slotEl);
        }

        if (slotIndex >= 0 && slotIndex < 9) {
          if (self.player.selectedSlot === slotIndex) {
            // Already holding this item: tapping active slot uses/drinks/eats immediately!
            const held = self.player.hotbar[slotIndex];
            const isUsable = held && (
              held.type === 'potion' ||
              held.type === 'utility' ||
              (held.id && (
                held.id.startsWith('potion_') ||
                held.id === 'golden_apple' ||
                held.id === 'enchanted_golden_apple' ||
                held.id === 'fireball' ||
                held.id === 'ender_pearl'
              ))
            );
            if (isUsable) {
              self.player.handleRightClick();
              return;
            }
          }
          self.player.selectSlot(slotIndex);
          lastTapSlot = slotIndex;
          lastTapTime = performance.now();
        }
      };

      hotbarEl.addEventListener('touchstart', handleHotbarTouch, { passive: true });
      hotbarEl.addEventListener('pointerdown', handleHotbarTouch);
    }

    // --- 7. Settings Modal Event Listeners ---
    this.initSettingsModalEvents();

    // Loop check for villager proximity to show Interact button
    setInterval(() => {
      self.checkVillagerPrompt();
    }, 200);
  }

  handleUseStart() {
    if (!this.player || this.player.isDead) return;
    this.isPlacingDown = true;

    const currentItem = this.player.hotbar[this.player.selectedSlot];

    // 1. Bow: draw tension
    if (currentItem && currentItem.type === 'bow') {
      const arrowIdx = this.player.hotbar.findIndex(s => s && (s.type === 'arrow' || (s.id && s.id.startsWith('arrow'))) && s.count > 0);
      if (arrowIdx === -1) {
        if (window.game) window.game.addChatMessage('§c[提示] 快捷栏中没有箭矢！请先在村民商店购买箭矢。');
        if (window.soundManager) window.soundManager.playBeep(false);
        return;
      }
      this.player.isDrawingBow = true;
      this.player.bowDrawTime = 0;
      if (window.soundManager) window.soundManager.playBowDraw();
      this.player.updateHeldItemVisual();
      return;
    }

    // 2. Usable items (potions, golden apples, fireballs, ender pearls, utilities)
    const isUsableItem = currentItem && (
      currentItem.type === 'potion' ||
      currentItem.type === 'utility' ||
      (currentItem.id && (
        currentItem.id.startsWith('potion_') ||
        currentItem.id === 'golden_apple' ||
        currentItem.id === 'enchanted_golden_apple' ||
        currentItem.id === 'fireball' ||
        currentItem.id === 'ender_pearl'
      ))
    );

    if (isUsableItem) {
      this.player.handleRightClick();
      return;
    }

    // 3. Block placement (continuous bridging when holding down)
    this.player.handleRightClick();
    if (currentItem && currentItem.type === 'block') {
      if (this.continuousPlaceTimer) clearInterval(this.continuousPlaceTimer);
      this.continuousPlaceTimer = setInterval(() => {
        if (this.isPlacingDown && this.player && !this.player.isDead) {
          this.player.handleRightClick();
        }
      }, 180);
    }
  }

  handleUseEnd() {
    this.isPlacingDown = false;
    if (this.continuousPlaceTimer) {
      clearInterval(this.continuousPlaceTimer);
      this.continuousPlaceTimer = null;
    }

    if (!this.player) return;

    // Bow release
    if (this.player.isDrawingBow) {
      const drawTime = this.player.bowDrawTime;
      this.player.isDrawingBow = false;
      this.player.bowDrawTime = 0;
      this.player.camera.fov = 75;
      this.player.camera.updateProjectionMatrix();

      const currentItem = this.player.hotbar[this.player.selectedSlot];
      if (currentItem && currentItem.type === 'bow' && drawTime >= 0.12) {
        const arrowIdx = this.player.hotbar.findIndex(s => s && (s.type === 'arrow' || (s.id && s.id.startsWith('arrow'))) && s.count > 0);
        if (arrowIdx !== -1) {
          this.player.hotbar[arrowIdx].count--;
          if (this.player.hotbar[arrowIdx].count <= 0) {
            this.player.hotbar[arrowIdx] = null;
          }
          this.player.updateHUD();

          const charge = Math.min(1.0, drawTime / 0.85);
          const origin = new THREE.Vector3(
            this.player.position.x,
            this.player.position.y + this.player.eyeHeight,
            this.player.position.z
          );
          const dir = new THREE.Vector3(
            -Math.sin(this.player.yaw) * Math.cos(this.player.pitch),
            Math.sin(this.player.pitch),
            -Math.cos(this.player.yaw) * Math.cos(this.player.pitch)
          ).normalize();

          this.player.shootArrow(origin, dir, currentItem, charge);
          if (window.soundManager) window.soundManager.playBowShoot();
        }
      }
      this.player.updateHeldItemVisual();
    }
  }

  toggleSneak() {
    this.sneakLocked = !this.sneakLocked;
    if (this.player) {
      this.player.keys.sneak = this.sneakLocked;
    }

    // Visual active states
    if (this.dom.dpadCenter) {
      this.dom.dpadCenter.classList.toggle('locked', this.sneakLocked);
    }
    if (this.dom.joystickSneak) {
      this.dom.joystickSneak.classList.toggle('locked', this.sneakLocked);
    }
    if (this.dom.btnSneak) {
      this.dom.btnSneak.classList.toggle('locked', this.sneakLocked);
    }

    if (window.game && window.game.addChatMessage) {
      window.game.addChatMessage(this.sneakLocked ? '§e[触控] 潜行已锁定 (下蹲防掉落虚空)' : '§7[触控] 潜行已解除');
    }
  }

  updateDpadVisuals() {
    if (!this.player || !this.dom.dpad) return;
    const up = this.dom.dpad.querySelector('#dpad-up');
    const down = this.dom.dpad.querySelector('#dpad-down');
    const left = this.dom.dpad.querySelector('#dpad-left');
    const right = this.dom.dpad.querySelector('#dpad-right');

    if (up) up.classList.toggle('active', this.player.keys.forward);
    if (down) down.classList.toggle('active', this.player.keys.backward);
    if (left) left.classList.toggle('active', this.player.keys.left);
    if (right) right.classList.toggle('active', this.player.keys.right);
  }

  clearDpadVisuals() {
    if (!this.dom.dpad) return;
    const btns = this.dom.dpad.querySelectorAll('.dpad-btn');
    btns.forEach(b => {
      if (b.id !== 'dpad-center') b.classList.remove('active');
    });
  }

  resetMovement() {
    if (this.player) {
      this.player.keys.forward = false;
      this.player.keys.backward = false;
      this.player.keys.left = false;
      this.player.keys.right = false;
      if (this.player.touchMoveVector) {
        this.player.touchMoveVector = { x: 0, z: 0 };
      }
    }
    if (this.dom.joystickThumb) {
      this.dom.joystickThumb.style.transform = 'translate(0px, 0px)';
    }
    this.clearDpadVisuals();
  }

  checkVillagerPrompt() {
    if (!this.enabled || !this.player || this.player.isDead) {
      if (this.dom.interactBtn) this.dom.interactBtn.classList.add('hidden');
      return;
    }

    let isNear = false;
    if (window.shopManager && window.shopManager.villagers) {
      for (const v of window.shopManager.villagers) {
        if (!v || !v.group) continue;
        const dist = this.player.position.distanceTo(v.group.position);
        if (dist <= 4.2) {
          isNear = true;
          break;
        }
      }
    }

    if (this.dom.interactBtn) {
      if (isNear && (!window.shopManager || !window.shopManager.isOpen)) {
        this.dom.interactBtn.classList.remove('hidden');
      } else {
        this.dom.interactBtn.classList.add('hidden');
      }
    }
  }

  openSettings() {
    if (!this.dom.settingsModal) return;
    this.dom.settingsModal.classList.remove('hidden');

    // Update settings values
    const sensSlider = this.dom.settingsModal.querySelector('#touch-sens-slider');
    const sensVal = this.dom.settingsModal.querySelector('#touch-sens-val');
    if (sensSlider && sensVal) {
      sensSlider.value = this.lookSensitivity;
      sensVal.innerText = `${this.lookSensitivity.toFixed(1)}x`;
    }

    const opSlider = this.dom.settingsModal.querySelector('#touch-opacity-slider');
    const opVal = this.dom.settingsModal.querySelector('#touch-opacity-val');
    if (opSlider && opVal) {
      opSlider.value = this.btnOpacity;
      opVal.innerText = `${Math.round(this.btnOpacity * 100)}%`;
    }

    this.updateSettingButtons();
  }

  closeSettings() {
    if (!this.dom.settingsModal) return;
    this.dom.settingsModal.classList.add('hidden');
  }

  initSettingsModalEvents() {
    const modal = this.dom.settingsModal;
    if (!modal) return;

    modal.querySelector('#touch-settings-close').addEventListener('click', () => {
      this.closeSettings();
    });

    // Enable/Disable
    const btnEn = modal.querySelector('#touch-opt-enable');
    const btnDis = modal.querySelector('#touch-opt-disable');
    btnEn.addEventListener('click', () => {
      this.enabled = true;
      localStorage.setItem('bedwars_touch_enabled', 'true');
      this.applyVisibility();
      this.updateSettingButtons();
    });
    btnDis.addEventListener('click', () => {
      this.enabled = false;
      localStorage.setItem('bedwars_touch_enabled', 'false');
      this.applyVisibility();
      this.updateSettingButtons();
    });

    // D-Pad / Joystick
    const btnDpad = modal.querySelector('#touch-opt-dpad');
    const btnJoy = modal.querySelector('#touch-opt-joystick');
    btnDpad.addEventListener('click', () => {
      this.controlMode = 'dpad';
      localStorage.setItem('bedwars_touch_mode', 'dpad');
      this.resetMovement();
      this.updateModeUI();
      this.updateSettingButtons();
    });
    btnJoy.addEventListener('click', () => {
      this.controlMode = 'joystick';
      localStorage.setItem('bedwars_touch_mode', 'joystick');
      this.resetMovement();
      this.updateModeUI();
      this.updateSettingButtons();
    });

    // Sensitivity Slider
    const sensSlider = modal.querySelector('#touch-sens-slider');
    const sensVal = modal.querySelector('#touch-sens-val');
    sensSlider.addEventListener('input', (e) => {
      this.lookSensitivity = parseFloat(e.target.value);
      sensVal.innerText = `${this.lookSensitivity.toFixed(1)}x`;
      localStorage.setItem('bedwars_touch_sens', this.lookSensitivity);
    });

    // Opacity Slider
    const opSlider = modal.querySelector('#touch-opacity-slider');
    const opVal = modal.querySelector('#touch-opacity-val');
    opSlider.addEventListener('input', (e) => {
      this.btnOpacity = parseFloat(e.target.value);
      opVal.innerText = `${Math.round(this.btnOpacity * 100)}%`;
      localStorage.setItem('bedwars_touch_opacity', this.btnOpacity);
      this.applyOpacity();
    });
  }

  updateSettingButtons() {
    const modal = this.dom.settingsModal;
    if (!modal) return;

    const btnEn = modal.querySelector('#touch-opt-enable');
    const btnDis = modal.querySelector('#touch-opt-disable');
    btnEn.classList.toggle('active', this.enabled);
    btnDis.classList.toggle('active', !this.enabled);

    const btnDpad = modal.querySelector('#touch-opt-dpad');
    const btnJoy = modal.querySelector('#touch-opt-joystick');
    btnDpad.classList.toggle('active', this.controlMode === 'dpad');
    btnJoy.classList.toggle('active', this.controlMode === 'joystick');
  }
}

window.TouchControls = TouchControls;
