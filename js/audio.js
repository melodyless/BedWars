// Professional Minecraft-Style Procedural Sound Synthesizer
// Clean, Warm, Dynamic Compressed & Ear-Pleasing Audio
class SoundManager {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.masterGain = null;
    this.compressor = null;
    this.lastSoundTimes = {};
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Dynamics Compressor prevents any clipping / harsh distortion
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(12, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(6, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.15, this.ctx.currentTime);

      // Master Gain for pleasant comfortable volume
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.65, this.ctx.currentTime);

      this.compressor.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.initialized = true;
    } catch (e) {
      console.warn("AudioContext initialization error:", e);
    }
  }

  resume() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  getDest() {
    if (!this.initialized) this.init();
    return this.compressor || (this.ctx ? this.ctx.destination : null);
  }

  // Throttle helper to avoid sound spam cacophony
  throttle(key, intervalMs) {
    const now = performance.now();
    if (this.lastSoundTimes[key] && (now - this.lastSoundTimes[key] < intervalMs)) {
      return true;
    }
    this.lastSoundTimes[key] = now;
    return false;
  }

  // 1. Hotbar slot change clean organic click (Minecraft PE item switch)
  playSlotChange() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const dest = this.getDest();
    if (!dest) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(750, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.035);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, t);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(t);
    osc.stop(t + 0.04);
  }

  // 2. Item pickup ding: Pure, soothing water-drop bell (Minecraft XP / Item ding)
  playPickup() {
    if (!this.ctx) return;
    this.resume();
    if (this.throttle('pickup', 60)) return; // prevent deafening multi-pickup
    const t = this.ctx.currentTime;
    const dest = this.getDest();
    if (!dest) return;

    // Harmonic bell pair (Pure sine with soft decay)
    const baseFreq = 880 * Math.pow(1.05946, Math.floor(Math.random() * 5)); // Pentatonic pitch

    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.35, t + 0.08);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(baseFreq * 2.0, t);
    osc2.frequency.exponentialRampToValueAtTime(baseFreq * 2.7, t + 0.08);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(dest);

    osc.start(t);
    osc2.start(t);
    osc.stop(t + 0.13);
    osc2.stop(t + 0.13);
  }

  // 3. Attack swing: Soft, crisp air whoosh (no harsh radio static)
  playSwing() {
    if (!this.ctx) return;
    this.resume();
    if (this.throttle('swing', 90)) return;
    const t = this.ctx.currentTime;
    const dest = this.getDest();
    if (!dest) return;

    const bufferSize = Math.floor(this.ctx.sampleRate * 0.09);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Filtered pink noise for organic whoosh
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      data[i] = (b0 + b1 + b2) * 0.35;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(2.2, t);
    filter.frequency.setValueAtTime(1100, t);
    filter.frequency.exponentialRampToValueAtTime(350, t + 0.085);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.16, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    noise.start(t);
  }

  // 4. Damage hit: Warm punchy organic thud (no harsh saw buzzer!)
  playHit() {
    if (!this.ctx) return;
    this.resume();
    if (this.throttle('hit', 70)) return;
    const t = this.ctx.currentTime;
    const dest = this.getDest();
    if (!dest) return;

    // Body punch sub-oscillator
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(150, t);
    subOsc.frequency.exponentialRampToValueAtTime(45, t + 0.14);

    subGain.gain.setValueAtTime(0.35, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    subOsc.connect(subGain);
    subGain.connect(dest);
    subOsc.start(t);
    subOsc.stop(t + 0.15);

    // Warm impact noise
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.08);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, t);
    filter.frequency.exponentialRampToValueAtTime(180, t + 0.08);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.22, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(dest);
    noise.start(t);
  }

  // 5. Block place: Satisfying organic thud (gentle wood/wool tap)
  playPlace() {
    if (!this.ctx) return;
    this.resume();
    if (this.throttle('place', 80)) return;
    const t = this.ctx.currentTime;
    const dest = this.getDest();
    if (!dest) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260 + Math.random() * 40, t);
    osc.frequency.exponentialRampToValueAtTime(65, t + 0.06);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(t);
    osc.stop(t + 0.065);
  }

  // 6. Block break: Crisp crunchy crumble
  playBreak() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const dest = this.getDest();
    if (!dest) return;

    const bufferSize = Math.floor(this.ctx.sampleRate * 0.11);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.5);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(1.5, t);
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(300, t + 0.1);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    noise.start(t);
  }

  // 7. Critical hit / Ding: Pure high crystal bell
  playDing(customFreq = null) {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const dest = this.getDest();
    if (!dest) return;

    const f = customFreq || 1250;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, t);
    osc.frequency.exponentialRampToValueAtTime(f * 1.25, t + 0.06);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  // 8. Arrow hit entity ding (Minecraft PvP bow ding!)
  playArrowDing() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const dest = this.getDest();
    if (!dest) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1320, t);
    osc.frequency.exponentialRampToValueAtTime(1760, t + 0.06);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(t);
    osc.stop(t + 0.17);
  }

  // 9. Arrow shoot twang
  playBowShoot() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const dest = this.getDest();
    if (!dest) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(360, t);
    osc.frequency.exponentialRampToValueAtTime(95, t + 0.12);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + 0.13);
  }

  // 10. Bow draw tension
  playBowDraw() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const dest = this.getDest();
    if (!dest) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.linearRampToValueAtTime(220, t + 0.22);

    gain.gain.setValueAtTime(0.07, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + 0.23);
  }

  // 11. Arrow hitting solid block
  playArrowHit() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const dest = this.getDest();
    if (!dest) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.06);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + 0.07);
  }

  // 12. Bed broken: Cinematic deep thunder & dark brass chord (no screeching saw!)
  playBedBreak() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const dest = this.getDest();
    if (!dest) return;

    // Cinematic deep minor chord (C2, Eb2, G2)
    [65.41, 77.78, 98.00].forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.75, t + 1.2);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, t);

      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);
      osc.start(t);
      osc.stop(t + 1.25);
    });

    // Sub-bass impact boom
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(90, t);
    subOsc.frequency.exponentialRampToValueAtTime(25, t + 0.8);

    subGain.gain.setValueAtTime(0.45, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);

    subOsc.connect(subGain);
    subGain.connect(dest);
    subOsc.start(t);
    subOsc.stop(t + 0.9);
  }

  // 13. Purchase ding / Transaction chime (Pleasant upward harp arpeggio)
  playBuy() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const dest = this.getDest();
    if (!dest) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const noteTime = t + idx * 0.05;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.14, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.18);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(noteTime);
      osc.stop(noteTime + 0.19);
    });
  }

  // 14. Explosion (Sub rumble & cinema boom)
  playExplosion() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const dest = this.getDest();
    if (!dest) return;

    // Sub rumble
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(80, t);
    sub.frequency.exponentialRampToValueAtTime(25, t + 0.65);

    subGain.gain.setValueAtTime(0.5, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

    sub.connect(subGain);
    subGain.connect(dest);
    sub.start(t);
    sub.stop(t + 0.7);

    // Warm blast noise
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.6);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, t);
    filter.frequency.exponentialRampToValueAtTime(40, t + 0.6);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    noise.start(t);
  }

  // 14b. Wind Charge Burst: Breezy airy pop & shockwave gust
  playWindBurst() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const dest = this.getDest();
    if (!dest) return;

    // Airy resonant swoosh
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(360, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.32);

    oscGain.gain.setValueAtTime(0.38, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

    osc.connect(oscGain);
    oscGain.connect(dest);
    osc.start(t);
    osc.stop(t + 0.35);

    // Wind puff noise
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.35);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.8);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(220, t + 0.32);
    filter.Q.value = 1.2;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.42, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    noise.start(t);
  }

  // 14c. Heavy Mace Smash Attack: Deep crushing anvil hammer thud
  playHeavySmash() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const dest = this.getDest();
    if (!dest) return;

    // Deep sub drop
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(160, t);
    sub.frequency.exponentialRampToValueAtTime(32, t + 0.45);

    subGain.gain.setValueAtTime(0.65, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    sub.connect(subGain);
    subGain.connect(dest);
    sub.start(t);
    sub.stop(t + 0.5);

    // Metallic heavy anvil strike clang
    const bell = this.ctx.createOscillator();
    const bellGain = this.ctx.createGain();
    bell.type = 'sawtooth';
    bell.frequency.setValueAtTime(420, t);
    bell.frequency.exponentialRampToValueAtTime(180, t + 0.35);

    bellGain.gain.setValueAtTime(0.35, t);
    bellGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    bell.connect(bellGain);
    bellGain.connect(dest);
    bell.start(t);
    bell.stop(t + 0.4);

    // Stone shatter crunch noise
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.4);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, t);
    filter.frequency.exponentialRampToValueAtTime(60, t + 0.38);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.48, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    noise.start(t);
  }

  // 15. Victory fanfare: Beautiful triumphant chord
  playVictory() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const dest = this.getDest();
    if (!dest) return;

    const notes = [
      { f: 523.25, d: 0.16, offset: 0 },      // C5
      { f: 659.25, d: 0.16, offset: 0.14 },   // E5
      { f: 783.99, d: 0.16, offset: 0.28 },   // G5
      { f: 1046.50, d: 0.6, offset: 0.42 }    // C6
    ];
    notes.forEach(n => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, t + n.offset);

      gain.gain.setValueAtTime(0.2, t + n.offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + n.offset + n.d);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(t + n.offset);
      osc.stop(t + n.offset + n.d + 0.05);
    });
  }

  // 16. Teleport whoosh
  playTeleport() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const dest = this.getDest();
    if (!dest) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(620, t + 0.1);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.22);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, t);

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  // 17. Countdown beep
  playBeep(isHigh = false) {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const dest = this.getDest();
    if (!dest) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isHigh ? 880 : 440, t);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  // 18. Potion drinking
  playDrink() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const dest = this.getDest();
    if (!dest) return;

    for (let i = 0; i < 3; i++) {
      const sipTime = t + i * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const baseFreq = 380 + Math.random() * 60;
      osc.frequency.setValueAtTime(baseFreq, sipTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, sipTime + 0.055);

      gain.gain.setValueAtTime(0.15, sipTime);
      gain.gain.exponentialRampToValueAtTime(0.001, sipTime + 0.06);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(sipTime);
      osc.stop(sipTime + 0.065);
    }
  }

  // 19. Potion magic shimmer
  playPotionSplash() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const dest = this.getDest();
    if (!dest) return;

    const notes = [587.33, 739.99, 880.00, 1174.66]; // D5, F#5, A5, D6
    notes.forEach((freq, idx) => {
      const noteTime = t + idx * 0.04;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.12, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.16);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(noteTime);
      osc.stop(noteTime + 0.17);
    });
  }

  // 20. Inventory open / close
  playInventoryOpen() {
    this.playSlotChange();
  }

  playInventoryClose() {
    this.playSlotChange();
  }

  // 21. SkyWars Chest Open & Close
  playChestOpen() {
    if (!this.ctx) return;
    this.resume();
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      // Classic Minecraft creaking wooden chest hinge sound: 160Hz -> 420Hz
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(430, now + 0.18);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.22);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.23);
    } catch (e) {}
  }

  playChestClose() {
    if (!this.ctx) return;
    this.resume();
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      // Chest lid closing thud: 400Hz -> 140Hz
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.16);
      gain.gain.setValueAtTime(0.20, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.19);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.20);
    } catch (e) {}
  }
}

window.soundManager = new SoundManager();
