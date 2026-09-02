/**
 * ============================================================================
 * SHADOW SEEKERS // PROCEDURAL WEB AUDIO API SYNTHESIZER
 * Zero external audio files required. Real-time procedural sound synthesis,
 * proximity heartbeats, ambient suspense drones, detection alarms & SFX.
 * ============================================================================
 */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.enabled = true;
    this.volume = 0.8;
    this.heartbeatTimer = null;
    this.heartbeatInterval = 1000;
    this.droneGain = null;
    this.droneOsc = null;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.isInitialized = true;
      this.startAmbientDrone();
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  ensureContext() {
    if (!this.isInitialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.enabled ? this.volume : 0, this.ctx.currentTime);
    }
  }

  toggleSound() {
    this.enabled = !this.enabled;
    this.setVolume(this.volume);
    return this.enabled;
  }

  // ==========================================================================
  // AMBIENT SUSPENSE DRONE
  // ==========================================================================
  startAmbientDrone() {
    if (!this.ctx || !this.enabled) return;
    try {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      this.droneGain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(55, this.ctx.currentTime); // A1 note
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(58.27, this.ctx.currentTime); // Bb1 subtle dissonance

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(160, this.ctx.currentTime);

      this.droneGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(this.droneGain);
      this.droneGain.connect(this.masterGain);

      osc1.start();
      osc2.start();
    } catch (e) {
      // Ignored
    }
  }

  // ==========================================================================
  // PROXIMITY HEARTBEAT (Increases frequency with danger)
  // ==========================================================================
  updateHeartbeat(proximityFactor) {
    if (!this.enabled || !this.ctx || proximityFactor <= 0) {
      this.stopHeartbeat();
      return;
    }
    this.ensureContext();
    // proximityFactor ranges from 0.0 (far) to 1.0 (touching)
    const minInterval = 280; // ms at max danger
    const maxInterval = 1200; // ms at edge of detection
    const targetInterval = maxInterval - (proximityFactor * (maxInterval - minInterval));
    this.heartbeatInterval = targetInterval;

    if (!this.heartbeatTimer) {
      this.playHeartbeatThump();
      this.heartbeatTimer = setInterval(() => {
        this.playHeartbeatThump();
      }, this.heartbeatInterval);
    }
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  playHeartbeatThump() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // Lub (First thump - lower frequency)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(65, now);
      osc1.frequency.exponentialRampToValueAtTime(30, now + 0.12);
      gain1.gain.setValueAtTime(0.4, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc1.connect(gain1);
      gain1.connect(this.masterGain);
      osc1.start(now);
      osc1.stop(now + 0.12);

      // Dub (Second thump - slightly higher, after 0.14s)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(75, now + 0.14);
      osc2.frequency.exponentialRampToValueAtTime(35, now + 0.26);
      gain2.gain.setValueAtTime(0.3, now + 0.14);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.26);
      osc2.connect(gain2);
      gain2.connect(this.masterGain);
      osc2.start(now + 0.14);
      osc2.stop(now + 0.26);
    } catch (e) {}
  }

  // ==========================================================================
  // FOOTSTEP SOUND
  // ==========================================================================
  playFootstep(isSprinting = false) {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = isSprinting ? 'square' : 'triangle';
      osc.frequency.setValueAtTime(isSprinting ? 90 : 70, now);
      osc.frequency.exponentialRampToValueAtTime(20, now + 0.05);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, now);

      gain.gain.setValueAtTime(isSprinting ? 0.25 : 0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {}
  }

  // ==========================================================================
  // DETECTION ALERT / ALARM
  // ==========================================================================
  playDetectionAlert() {
    if (!this.enabled || !this.ctx) return;
    this.ensureContext();
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.linearRampToValueAtTime(950, now + 0.08);
      osc.frequency.linearRampToValueAtTime(600, now + 0.16);
      osc.frequency.linearRampToValueAtTime(950, now + 0.24);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  }

  // ==========================================================================
  // WHISTLE TAUNT
  // ==========================================================================
  playWhistleTaunt() {
    if (!this.enabled || !this.ctx) return;
    this.ensureContext();
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.linearRampToValueAtTime(1800, now + 0.15);
      osc.frequency.linearRampToValueAtTime(1400, now + 0.25);
      osc.frequency.linearRampToValueAtTime(2200, now + 0.45);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {}
  }

  // ==========================================================================
  // SMOKE BOMB / WHOOSH
  // ==========================================================================
  playSmokeBomb() {
    if (!this.enabled || !this.ctx) return;
    this.ensureContext();
    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(150, now + 0.4);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      whiteNoise.start(now);
    } catch (e) {}
  }

  // ==========================================================================
  // SONAR PING / SCAN
  // ==========================================================================
  playSonarPing() {
    if (!this.enabled || !this.ctx) return;
    this.ensureContext();
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.6);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.6);
    } catch (e) {}
  }

  // ==========================================================================
  // TAG / CATCH / FREEZE SFX
  // ==========================================================================
  playCatchSound(isFreeze = false) {
    if (!this.enabled || !this.ctx) return;
    this.ensureContext();
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = isFreeze ? 'sine' : 'square';
      osc.frequency.setValueAtTime(isFreeze ? 1400 : 350, now);
      osc.frequency.exponentialRampToValueAtTime(isFreeze ? 700 : 120, now + 0.3);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  }

  // ==========================================================================
  // VICTORY FANFARE
  // ==========================================================================
  playVictoryFanfare() {
    if (!this.enabled || !this.ctx) return;
    this.ensureContext();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const now = this.ctx.currentTime;
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + idx * 0.12;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  }

  // ==========================================================================
  // DEFEAT / CAUGHT STINGER
  // ==========================================================================
  playDefeatStinger() {
    if (!this.enabled || !this.ctx) return;
    this.ensureContext();
    const notes = [440, 392, 349.23, 293.66]; // A4, G4, F4, D4
    const now = this.ctx.currentTime;
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + idx * 0.15;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  }
}

// Export for browser and node testing environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AudioEngine;
} else {
  window.AudioEngine = AudioEngine;
}
