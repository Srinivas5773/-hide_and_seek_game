/**
 * ============================================================================
 * SHADOW SEEKERS // MATCH REPLAY & HEATMAP VISUALIZATION ENGINE
 * Frame telemetry recorder, timeline scrubber, multi-speed playback,
 * and tactical movement heatmap generator.
 * ============================================================================
 */

class ReplayEngine {
  constructor() {
    this.frames = [];
    this.maxFrames = 7200; // ~6 minutes at 20fps
    this.isRecording = false;
    this.isPlaying = false;
    this.currentFrameIdx = 0;
    this.playbackSpeed = 1.0;
    this.showHeatmap = false;
    this.playbackInterval = null;

    this.canvas = document.getElementById('replayCanvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.recordSampleRate = 0.05; // Record every 50ms
    this.lastRecordTime = 0;

    this.initUI();
  }

  initUI() {
    if (typeof document === 'undefined') return;

    const btnPlay = document.getElementById('btn-replay-play');
    const slider = document.getElementById('replay-timeline-slider');
    const btnSpeed = document.getElementById('btn-replay-speed');
    const btnHeatmap = document.getElementById('btn-replay-heatmap');

    if (btnPlay) {
      btnPlay.addEventListener('click', () => {
        if (this.isPlaying) this.pause();
        else this.play();
      });
    }

    if (slider) {
      slider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.seekToPercent(val);
      });
    }

    if (btnSpeed) {
      btnSpeed.addEventListener('click', () => {
        if (this.playbackSpeed === 1.0) this.playbackSpeed = 2.0;
        else if (this.playbackSpeed === 2.0) this.playbackSpeed = 4.0;
        else this.playbackSpeed = 1.0;
        btnSpeed.textContent = `${this.playbackSpeed}x Speed`;
      });
    }

    if (btnHeatmap) {
      btnHeatmap.addEventListener('click', () => {
        this.showHeatmap = !this.showHeatmap;
        btnHeatmap.textContent = `Heatmap: ${this.showHeatmap ? 'ON' : 'OFF'}`;
        this.renderCurrentFrame();
      });
    }
  }

  startRecording() {
    this.frames = [];
    this.isRecording = true;
    this.lastRecordTime = 0;
  }

  stopRecording() {
    this.isRecording = false;
  }

  recordFrame(currentTime, player, seekers, hiders, mapId) {
    if (!this.isRecording || this.frames.length >= this.maxFrames) return;

    this.frames.push({
      time: currentTime,
      mapId: mapId,
      player: {
        x: Math.round(player.x),
        y: Math.round(player.y),
        angle: player.angle,
        role: player.role,
        isDisguised: player.isDisguised,
        isFrozen: player.isFrozen,
        isInvisible: player.isInvisible
      },
      seekers: seekers.map(s => ({
        x: Math.round(s.x),
        y: Math.round(s.y),
        angle: s.angle,
        state: s.state
      })),
      hiders: hiders.map(h => ({
        x: Math.round(h.x),
        y: Math.round(h.y),
        angle: h.angle,
        isCaught: h.isCaught,
        isFrozen: h.isFrozen,
        isDisguised: h.isDisguised
      }))
    });
  }

  play() {
    if (this.frames.length === 0) return;
    this.isPlaying = true;
    const btnPlay = document.getElementById('btn-replay-play');
    if (btnPlay) btnPlay.textContent = '⏸️ Pause';

    if (this.playbackInterval) clearInterval(this.playbackInterval);
    this.playbackInterval = setInterval(() => {
      if (!this.isPlaying) return;
      this.currentFrameIdx += Math.round(this.playbackSpeed);
      if (this.currentFrameIdx >= this.frames.length) {
        this.currentFrameIdx = this.frames.length - 1;
        this.pause();
      }
      this.renderCurrentFrame();
      this.updateSliderUI();
    }, 50);
  }

  pause() {
    this.isPlaying = false;
    const btnPlay = document.getElementById('btn-replay-play');
    if (btnPlay) btnPlay.textContent = '▶️ Play';
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
    }
  }

  seekToPercent(pct) {
    if (this.frames.length === 0) return;
    this.currentFrameIdx = Math.floor((pct / 100) * (this.frames.length - 1));
    this.renderCurrentFrame();
  }

  updateSliderUI() {
    const slider = document.getElementById('replay-timeline-slider');
    const timeDisplay = document.getElementById('replay-time-display');
    if (slider && this.frames.length > 0) {
      slider.value = (this.currentFrameIdx / (this.frames.length - 1)) * 100;
    }
    if (timeDisplay && this.frames.length > 0) {
      const currentSec = Math.floor(this.frames[this.currentFrameIdx].time);
      const totalSec = Math.floor(this.frames[this.frames.length - 1].time);
      timeDisplay.textContent = `${this.formatTime(currentSec)} / ${this.formatTime(totalSec)}`;
    }
  }

  formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  renderCurrentFrame() {
    if (!this.ctx || this.frames.length === 0) return;
    const ctx = this.ctx;
    const frame = this.frames[this.currentFrameIdx];
    if (!frame) return;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Scale 1280x960 down to 600x400
    const scaleX = this.canvas.width / 1280;
    const scaleY = this.canvas.height / 960;

    // Draw Heatmap Trail if enabled
    if (this.showHeatmap) {
      ctx.fillStyle = 'rgba(255, 51, 102, 0.08)';
      for (let i = 0; i <= this.currentFrameIdx; i += 2) {
        const f = this.frames[i];
        for (let s of f.seekers) {
          ctx.beginPath();
          ctx.arc(s.x * scaleX, s.y * scaleY, 14, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.fillStyle = 'rgba(0, 229, 255, 0.08)';
      for (let i = 0; i <= this.currentFrameIdx; i += 2) {
        const f = this.frames[i];
        ctx.beginPath();
        ctx.arc(f.player.x * scaleX, f.player.y * scaleY, 14, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw Hiders
    for (let h of frame.hiders) {
      if (h.isCaught) continue;
      ctx.fillStyle = h.isFrozen ? '#70d6ff' : (h.isDisguised ? '#ffb703' : '#00e5ff');
      ctx.beginPath();
      ctx.arc(h.x * scaleX, h.y * scaleY, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Seekers
    for (let s of frame.seekers) {
      ctx.fillStyle = s.state === 'chase' ? '#ff0033' : '#ff3366';
      ctx.beginPath();
      ctx.arc(s.x * scaleX, s.y * scaleY, 8, 0, Math.PI * 2);
      ctx.fill();

      // Vision direction indicator
      ctx.strokeStyle = 'rgba(255, 51, 102, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(s.x * scaleX, s.y * scaleY);
      ctx.lineTo((s.x + Math.cos(s.angle) * 35) * scaleX, (s.y + Math.sin(s.angle) * 35) * scaleY);
      ctx.stroke();
    }

    // Draw Player
    ctx.fillStyle = frame.player.role === 'seeker' ? '#ff3366' : '#06d6a0';
    ctx.beginPath();
    ctx.arc(frame.player.x * scaleX, frame.player.y * scaleY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ReplayEngine;
} else {
  window.ReplayEngine = ReplayEngine;
}
