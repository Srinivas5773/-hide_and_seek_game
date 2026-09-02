/**
 * ============================================================================
 * SHADOW SEEKERS // MASTER GAME CONTROLLER & 60FPS RENDERING ENGINE
 * Game loop, camera tracking, radar updates, round state manager,
 * 6 game modes, and particle/shadow composite pipeline.
 * ============================================================================
 */

class GameEngine {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    this.minimapCanvas = document.getElementById('minimapCanvas');
    this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;

    // Subsystems
    this.audio = new AudioEngine();
    this.input = new InputHandler();
    this.raycast = new RaycastEngine();
    this.pathfinding = new PathfindingEngine(32);
    this.ai = new AIEngine(this.pathfinding, this.raycast, this.audio);
    this.items = new ItemManager(this.audio, this.ai);
    this.replay = new ReplayEngine();
    this.telemetry = new TelemetryEngine();
    this.editor = new LevelEditor(this);

    // World & Camera
    this.worldWidth = 1280;
    this.worldHeight = 960;
    this.camera = { x: 0, y: 0, zoom: 1.0 };

    // Game Configuration
    this.mode = 'classic_hider'; // 'classic_hider', 'classic_seeker', 'prop_hunt', 'freeze_tag', 'infection', 'horror_darkness'
    this.currentMapId = 'mansion';
    this.currentMap = MapCatalog.mansion;

    this.roundDuration = 120; // seconds
    this.timeRemaining = 120;
    this.isPaused = false;
    this.isGameOver = false;

    // Entities
    this.player = null;
    this.seekers = [];
    this.hiders = [];
    this.props = [];
    this.bushes = [];
    this.walls = [];
    this.decoys = [];
    this.traps = [];
    this.footprints = [];
    this.particles = [];
    this.floatingTexts = [];

    this.footprintTimer = 0;
    this.lastTime = 0;

    this.initUI();
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  initUI() {
    // Mode Card Selection in Main Menu
    const modeCards = document.querySelectorAll('.mode-card');
    modeCards.forEach(card => {
      card.addEventListener('click', () => {
        modeCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.mode = card.getAttribute('data-mode');
      });
    });

    // Start Game Button
    const btnPlay = document.getElementById('btn-play-game');
    if (btnPlay) {
      btnPlay.addEventListener('click', () => {
        const menu = document.getElementById('main-menu-overlay');
        if (menu) menu.style.display = 'none';
        this.audio.init();
        this.startRound();
      });
    }

    // Sound Toggle Button
    const btnSound = document.getElementById('btn-sound');
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        const active = this.audio.toggleSound();
        btnSound.classList.toggle('active', active);
        btnSound.textContent = active ? '🔊' : '🔇';
      });
    }

    // Modal Triggers
    this.bindModal('btn-settings', 'modal-settings');
    this.bindModal('btn-sandbox-setup', 'modal-settings');
    this.bindModal('btn-editor-open', 'modal-editor', () => this.editor.render());
    this.bindModal('btn-lore-open', 'modal-lore', () => this.populateLoreUI());
    this.bindModal('btn-achievements-open', 'modal-achievements', () => this.telemetry.populateAchievementsUI());
    this.bindModal('btn-replay-open', 'modal-replay', () => this.replay.renderCurrentFrame());

    // Modal Close Buttons
    document.querySelectorAll('.modal-close, [data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-close') || btn.closest('.modal-backdrop').id;
        const modal = document.getElementById(targetId);
        if (modal) modal.classList.remove('open');
      });
    });

    // Settings Tab Switching
    document.querySelectorAll('.tab-btn[data-tab]').forEach(tab => {
      tab.addEventListener('click', () => {
        const parent = tab.closest('.modal-window');
        parent.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
        parent.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');

        tab.classList.add('active');
        const targetContent = document.getElementById(tab.getAttribute('data-tab'));
        if (targetContent) targetContent.style.display = 'block';
      });
    });

    // Settings Sliders
    this.bindSlider('setting-hiders-count', 'val-hiders-count');
    this.bindSlider('setting-seekers-count', 'val-seekers-count');
    this.bindSlider('setting-volume', 'val-volume', '%');

    // Apply Settings
    const btnSaveSettings = document.getElementById('btn-save-settings');
    if (btnSaveSettings) {
      btnSaveSettings.addEventListener('click', () => {
        const mapSelect = document.getElementById('setting-map-select');
        if (mapSelect) this.currentMapId = mapSelect.value;

        const timeSelect = document.getElementById('setting-round-time');
        if (timeSelect) this.roundDuration = parseInt(timeSelect.value, 10);

        const volSlider = document.getElementById('setting-volume');
        if (volSlider) this.audio.setVolume(parseInt(volSlider.value, 10) / 100);

        const qualitySelect = document.getElementById('setting-raycast-quality');
        if (qualitySelect) this.raycast.setQuality(qualitySelect.value);

        const modal = document.getElementById('modal-settings');
        if (modal) modal.classList.remove('open');
      });
    }

    // Hotbar Clicks
    document.getElementById('slot-1')?.addEventListener('click', () => this.useAbility(1));
    document.getElementById('slot-2')?.addEventListener('click', () => this.useAbility(2));
    document.getElementById('slot-3')?.addEventListener('click', () => this.useAbility(3));
    document.getElementById('slot-4')?.addEventListener('click', () => this.useAbility(4));
    document.getElementById('slot-5')?.addEventListener('click', () => this.useAbility(5));
    document.getElementById('slot-taunt')?.addEventListener('click', () => this.useAbility('taunt'));
  }

  bindModal(btnId, modalId, onOpen = null) {
    const btn = document.getElementById(btnId);
    const modal = document.getElementById(modalId);
    if (btn && modal) {
      btn.addEventListener('click', () => {
        modal.classList.add('open');
        if (onOpen) onOpen();
      });
    }
  }

  bindSlider(sliderId, valId, suffix = '') {
    const slider = document.getElementById(sliderId);
    const val = document.getElementById(valId);
    if (slider && val) {
      slider.addEventListener('input', (e) => {
        val.textContent = e.target.value + suffix;
      });
    }
  }

  loadCustomMap(customMapData) {
    this.currentMap = customMapData;
    this.currentMapId = 'custom';
  }

  // ==========================================================================
  // START ROUND & SPAWN ENTITIES
  // ==========================================================================
  startRound() {
    if (this.currentMapId === 'procedural') {
      this.currentMap = MapCatalog.generateProceduralMaze();
    } else if (this.currentMapId !== 'custom') {
      this.currentMap = MapCatalog[this.currentMapId] || MapCatalog.mansion;
    }

    this.worldWidth = this.currentMap.width;
    this.worldHeight = this.currentMap.height;
    this.walls = [...this.currentMap.walls];
    this.bushes = [...this.currentMap.bushes];
    this.props = this.currentMap.props.map(p => new Prop(p.x, p.y, p.type, p.width, p.height));

    // Initialize Pathfinding NavGrid
    this.pathfinding.initGrid(this.worldWidth, this.worldHeight, this.walls, this.bushes);

    this.timeRemaining = this.roundDuration;
    this.isGameOver = false;
    this.isPaused = false;
    this.decoys = [];
    this.traps = [];
    this.footprints = [];
    this.particles = [];
    this.floatingTexts = [];

    // Determine Player Role
    const isPlayerSeeker = this.mode === 'classic_seeker';
    const isPropMode = this.mode === 'prop_hunt';

    const playerRole = isPlayerSeeker ? 'seeker' : (isPropMode ? 'prop' : 'hider');
    const playerSpawn = isPlayerSeeker ? this.currentMap.seekerSpawns[0] : this.currentMap.hiderSpawns[0];
    this.player = new Player(playerSpawn.x, playerSpawn.y, playerRole);

    if (isPropMode) {
      this.player.isDisguised = true;
      this.player.propType = 'crate';
    }

    // Spawn AI Seekers
    this.seekers = [];
    const seekerCount = parseInt(document.getElementById('setting-seekers-count')?.value || 1, 10);
    const numSeekers = isPlayerSeeker ? seekerCount - 1 : seekerCount;

    for (let i = 0; i < Math.max(1, numSeekers); i++) {
      const spawn = this.currentMap.seekerSpawns[i % this.currentMap.seekerSpawns.length];
      const bot = new SeekerBot(spawn.x + (i * 20), spawn.y, `Hunter-Unit-${i + 1}`);
      bot.patrolWaypoints = [...this.currentMap.patrolWaypoints];
      this.seekers.push(bot);
    }

    // Spawn AI Hiders
    this.hiders = [];
    const hiderCount = parseInt(document.getElementById('setting-hiders-count')?.value || 4, 10);
    const numHiders = isPlayerSeeker ? hiderCount : hiderCount - 1;

    for (let i = 0; i < numHiders; i++) {
      const spawn = this.currentMap.hiderSpawns[(i + 1) % this.currentMap.hiderSpawns.length];
      const bot = new HiderBot(spawn.x + (Math.random() * 40 - 20), spawn.y + (Math.random() * 40 - 20), `Operative-${i + 1}`);
      if (isPropMode) {
        bot.isDisguised = true;
        const types = ['crate', 'barrel', 'statue', 'vending_machine'];
        bot.propType = types[i % types.length];
      }
      this.hiders.push(bot);
    }

    // Start Telemetry & Replay
    this.telemetry.startMatch(this.mode, this.currentMapId, playerRole);
    this.replay.startRecording();

    this.showMessageBanner('OPERATION INITIATED - HIDE & SURVIVE', 'msg-alert');
    this.updateHUD();

    // Launch RAF loop if not running
    if (!this.loopRunning) {
      this.loopRunning = true;
      requestAnimationFrame((t) => this.gameLoop(t));
    }
  }

  // ==========================================================================
  // MASTER GAME LOOP (60 FPS)
  // ==========================================================================
  gameLoop(currentTime) {
    if (!this.lastTime) this.lastTime = currentTime;
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    if (!this.isPaused && !this.isGameOver) {
      this.update(dt);
    }

    this.render();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  // ==========================================================================
  // UPDATE SIMULATION STATE
  // ==========================================================================
  update(dt) {
    // 1. Countdown timer
    this.timeRemaining -= dt;
    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.handleRoundTimeout();
    }

    // 2. Process Player Movement & Input
    const moveVec = this.input.getMovementVector();
    this.player.update(dt, moveVec, this.walls);

    // Check actions triggered via keyboard/touch
    if (this.input.consumeAction('ability1')) this.useAbility(1);
    if (this.input.consumeAction('ability2')) this.useAbility(2);
    if (this.input.consumeAction('ability3')) this.useAbility(3);
    if (this.input.consumeAction('ability4')) this.useAbility(4);
    if (this.input.consumeAction('interact')) this.useAbility(5);
    if (this.input.consumeAction('taunt')) this.useAbility('taunt');

    // 3. Mouse Aim Tracking
    if (this.player.role === 'seeker') {
      const mouseWorldX = this.input.mouse.x + this.camera.x;
      const mouseWorldY = this.input.mouse.y + this.camera.y;
      this.player.angle = Math.atan2(mouseWorldY - this.player.y, mouseWorldX - this.player.x);
    }

    // 4. Footstep & Trail generation
    if (moveVec.isMoving) {
      this.telemetry.logDistance(this.player.speed * dt);
      this.footprintTimer += dt;
      if (this.footprintTimer > (moveVec.isSprinting ? 0.18 : 0.35)) {
        this.footprintTimer = 0;
        this.footprints.push(new Footprint(this.player.x, this.player.y, this.player.angle, this.player.role === 'seeker', this.mode === 'horror_darkness'));
        this.audio.playFootstep(moveVec.isSprinting);
      }
    }

    // 5. Update Items & Cooldowns
    this.items.update(dt);

    // 6. Update AI Seekers
    const allHidersList = this.player.role === 'seeker' ? this.hiders : [this.player, ...this.hiders];
    for (let s of this.seekers) {
      s.update(dt, this.walls);
      this.ai.updateSeeker(s, dt, allHidersList, this.walls, this.props, this.mode, (seeker, caughtHider) => {
        this.handleTagEvent(seeker, caughtHider);
      });
    }

    // Seeker Player Catch Check (If playing as seeker)
    if (this.player.role === 'seeker') {
      for (let h of this.hiders) {
        if (h.isAlive && !h.isCaught && !h.isInvisible && (!h.isFrozen || this.mode !== 'freeze_tag')) {
          if (this.player.collidesWith(h)) {
            this.handleTagEvent(this.player, h);
          }
        }
      }
    }

    // 7. Update AI Hiders
    const allSeekersList = this.player.role === 'seeker' ? [this.player, ...this.seekers] : this.seekers;
    for (let h of this.hiders) {
      h.update(dt, this.walls);
      this.ai.updateHider(h, dt, allSeekersList, this.walls, this.hiders, this.mode);
    }

    // 8. Update Decoys, Traps, Particles, Footprints, Floating Text
    for (let d of this.decoys) d.update(dt, this.walls);
    this.decoys = this.decoys.filter(d => d.isAlive);

    for (let t of this.traps) t.update(dt);
    this.traps = this.traps.filter(t => t.isAlive);

    for (let fp of this.footprints) fp.update(dt);
    this.footprints = this.footprints.filter(fp => fp.isAlive);

    for (let p of this.particles) p.update(dt);
    this.particles = this.particles.filter(p => p.isAlive);

    for (let ft of this.floatingTexts) ft.update(dt);
    this.floatingTexts = this.floatingTexts.filter(ft => ft.isAlive);

    // 9. Proximity Heartbeat Audio Calculation
    if (this.player.role !== 'seeker' && !this.player.isFrozen) {
      let minDistance = Infinity;
      for (let s of this.seekers) {
        const dist = this.player.distanceTo(s);
        if (dist < minDistance) minDistance = dist;
      }
      const dangerRadius = 380;
      if (minDistance < dangerRadius) {
        const proximityFactor = 1.0 - (minDistance / dangerRadius);
        this.audio.updateHeartbeat(proximityFactor);
        const indicator = document.getElementById('heartbeat-indicator');
        if (indicator) indicator.style.display = 'flex';
      } else {
        this.audio.stopHeartbeat();
        const indicator = document.getElementById('heartbeat-indicator');
        if (indicator) indicator.style.display = 'none';
      }
    } else {
      this.audio.stopHeartbeat();
    }

    // 10. Update Camera Smooth Follow
    const targetCamX = this.player.x - this.canvas.width / 2;
    const targetCamY = this.player.y - this.canvas.height / 2;
    this.camera.x += (targetCamX - this.camera.x) * 0.1;
    this.camera.y += (targetCamY - this.camera.y) * 0.1;

    // 11. Record Replay Frame
    this.replay.recordFrame(this.roundDuration - this.timeRemaining, this.player, this.seekers, this.hiders, this.currentMapId);

    // 12. Check Victory / Defeat Conditions
    this.checkWinConditions();

    // 13. Update HUD
    this.updateHUD();
  }

  // ==========================================================================
  // TAG & CATCH EVENT HANDLER
  // ==========================================================================
  handleTagEvent(seeker, hider) {
    this.audio.playCatchSound(this.mode === 'freeze_tag');

    // Spawn catch particles
    for (let i = 0; i < 25; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 120;
      this.particles.push(new Particle(hider.x, hider.y, Math.cos(angle) * spd, Math.sin(angle) * spd, '#ff3366', 6, 0.8));
    }

    if (seeker === this.player) {
      this.player.score += 250;
      this.player.catches++;
      this.telemetry.logCatch();
      this.floatingTexts.push(new FloatingText(hider.x, hider.y - 25, 'CAUGHT! +250 PTS', '#ff3366', 1.5));
    }

    if (this.mode === 'freeze_tag') {
      hider.isFrozen = true;
      this.floatingTexts.push(new FloatingText(hider.x, hider.y - 25, 'FROZEN IN ICE', '#70d6ff', 1.8));
    } else if (this.mode === 'infection') {
      hider.isCaught = true;
      // Convert hider to seeker!
      const newSeeker = new SeekerBot(hider.x, hider.y, `Infected-Seeker-${this.seekers.length + 1}`);
      newSeeker.patrolWaypoints = [...this.currentMap.patrolWaypoints];
      this.seekers.push(newSeeker);
      this.floatingTexts.push(new FloatingText(hider.x, hider.y - 25, 'INFECTED!', '#ff0033', 2.0));
    } else {
      hider.isCaught = true;
      this.floatingTexts.push(new FloatingText(hider.x, hider.y - 25, 'ELIMINATED', '#ff3366', 1.8));
    }

    if (hider === this.player) {
      if (this.mode === 'infection') {
        this.player.role = 'seeker';
        this.showMessageBanner('YOU HAVE BEEN INFECTED! HUNT THE SURVIVORS!', 'msg-caught');
      } else if (this.mode === 'freeze_tag') {
        this.showMessageBanner('YOU ARE FROZEN! AWAIT TEAMMATE RESCUE!', 'msg-alert');
      } else {
        this.player.isAlive = false;
        this.showMessageBanner('YOU WERE CAUGHT!', 'msg-caught');
        this.audio.playDefeatStinger();
        this.endGame(false, 'APPREHENDED BY SEEKERS');
      }
    }
  }

  // ==========================================================================
  // CHECK WIN CONDITIONS
  // ==========================================================================
  checkWinConditions() {
    if (this.isGameOver) return;

    const remainingHiders = this.hiders.filter(h => h.isAlive && !h.isCaught && (!h.isFrozen || this.mode !== 'freeze_tag'));
    const isPlayerAliveHider = this.player.role !== 'seeker' && this.player.isAlive && (!this.player.isFrozen || this.mode !== 'freeze_tag');

    const totalActiveHiders = remainingHiders.length + (isPlayerAliveHider ? 1 : 0);

    if (totalActiveHiders === 0) {
      // Seekers Win!
      if (this.player.role === 'seeker') {
        this.audio.playVictoryFanfare();
        this.endGame(true, 'ALL HIDERS APPREHENDED - VICTORY!');
      } else {
        this.audio.playDefeatStinger();
        this.endGame(false, 'ALL HIDERS ELIMINATED - DEFEAT');
      }
    }
  }

  handleRoundTimeout() {
    if (this.isGameOver) return;

    if (this.player.role === 'seeker') {
      this.audio.playDefeatStinger();
      this.endGame(false, 'TIME EXPIRED - HIDERS ESCAPED!');
    } else {
      this.audio.playVictoryFanfare();
      this.player.score += 500;
      this.endGame(true, 'TIME EXPIRED - SURVIVAL VICTORY (+500 PTS)!');
    }
  }

  endGame(won, message) {
    this.isGameOver = true;
    this.audio.stopHeartbeat();
    this.replay.stopRecording();
    this.telemetry.endMatch(won, this.player.score);
    this.showMessageBanner(message, won ? 'msg-victory' : 'msg-caught');

    setTimeout(() => {
      const menu = document.getElementById('main-menu-overlay');
      if (menu) menu.style.display = 'flex';
    }, 4000);
  }

  showMessageBanner(text, className = 'msg-alert') {
    const banner = document.getElementById('game-message-overlay');
    const msgText = document.getElementById('game-message-text');
    if (banner && msgText) {
      msgText.textContent = text;
      banner.className = `show ${className}`;
      setTimeout(() => {
        banner.className = '';
      }, 3000);
    }
  }

  useAbility(slot) {
    if (!this.player || !this.player.isAlive) return;

    if (slot === 1) this.items.useInvisibility(this.player, this.particles, this.floatingTexts);
    if (slot === 2) this.items.useDecoy(this.player, this.decoys, this.floatingTexts);
    if (slot === 3) this.items.useSmokeBomb(this.player, this.particles, this.seekers, this.floatingTexts);
    if (slot === 4) this.items.useSonarPulse(this.player, this.hiders, this.particles, this.floatingTexts);
    if (slot === 5) this.items.usePropMorph(this.player, this.floatingTexts);
    if (slot === 'taunt') this.items.useWhistleTaunt(this.player, this.seekers, this.floatingTexts, this.telemetry);
  }

  // ==========================================================================
  // RENDER PIPELINE (CANVAS)
  // ==========================================================================
  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;

    ctx.save();
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply Camera Translation
    ctx.translate(-this.camera.x, -this.camera.y);

    // 1. Draw World Background & Floor Tiles
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < this.worldWidth; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.worldHeight);
      ctx.stroke();
    }
    for (let y = 0; y < this.worldHeight; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.worldWidth, y);
      ctx.stroke();
    }

    // 2. Draw Footprint Trails
    for (let fp of this.footprints) {
      ctx.fillStyle = fp.isGlowing ? `rgba(0, 229, 255, ${fp.alpha})` : `rgba(255, 255, 255, ${fp.alpha * 0.4})`;
      ctx.beginPath();
      ctx.arc(fp.x, fp.y, fp.isGlowing ? 4 : 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Draw Bushes & Foliage Cover
    for (let b of this.bushes) {
      ctx.fillStyle = 'rgba(6, 214, 160, 0.35)';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#06d6a0';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // 4. Draw Props
    for (let p of this.props) {
      ctx.fillStyle = p.type === 'crate' ? '#b45309' : (p.type === 'barrel' ? '#0284c7' : '#9333ea');
      ctx.fillRect(p.x - p.width / 2, p.y - p.height / 2, p.width, p.height);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(p.x - p.width / 2, p.y - p.height / 2, p.width, p.height);
    }

    // 5. Draw Decoys
    for (let d of this.decoys) {
      ctx.fillStyle = 'rgba(0, 229, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. Draw AI Hiders
    for (let h of this.hiders) {
      if (h.isCaught) continue;
      if (h.isDisguised && this.mode === 'prop_hunt') {
        // Render as prop
        ctx.fillStyle = '#ffb703';
        ctx.fillRect(h.x - 14, h.y - 14, 28, 28);
      } else {
        ctx.fillStyle = h.isFrozen ? '#70d6ff' : '#00e5ff';
        ctx.beginPath();
        ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 7. Draw AI Seekers & Flashlight Vision Cones
    for (let s of this.seekers) {
      if (!s.isAlive) continue;

      // Draw Flashlight Beam
      this.raycast.renderVisionCone(
        ctx, s.x, s.y, s.angle,
        s.flashlightFov, s.flashlightRange,
        this.walls,
        s.state === 'chase' ? 'rgba(255, 51, 102, 0.35)' : 'rgba(255, 245, 180, 0.25)'
      );

      // Draw Seeker Body
      ctx.fillStyle = s.state === 'chase' ? '#ff0033' : '#ff3366';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 8. Draw Player
    if (this.player && this.player.isAlive) {
      if (this.player.role === 'seeker') {
        // Player Flashlight Cone
        this.raycast.renderVisionCone(
          ctx, this.player.x, this.player.y, this.player.angle,
          this.player.flashlightFov, this.player.flashlightRange,
          this.walls,
          'rgba(255, 245, 180, 0.35)'
        );
      }

      if (this.player.isDisguised && this.player.role === 'prop') {
        ctx.fillStyle = '#ffb703';
        ctx.fillRect(this.player.x - 16, this.player.y - 16, 32, 32);
      } else {
        ctx.fillStyle = this.player.role === 'seeker' ? '#ff3366' : (this.player.isInvisible ? 'rgba(167, 139, 250, 0.4)' : '#06d6a0');
        ctx.beginPath();
        ctx.arc(this.player.x, this.player.y, this.player.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Direction pointer
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.player.x, this.player.y);
      ctx.lineTo(this.player.x + Math.cos(this.player.angle) * 24, this.player.y + Math.sin(this.player.angle) * 24);
      ctx.stroke();
    }

    // 9. Draw Walls
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    for (let w of this.walls) {
      ctx.beginPath();
      ctx.moveTo(w.x1, w.y1);
      ctx.lineTo(w.x2, w.y2);
      ctx.stroke();
    }

    // 10. Draw Particles
    for (let p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // 11. Draw Floating Texts
    for (let ft of this.floatingTexts) {
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
    }

    ctx.restore();

    // 12. Render Dynamic Darkness in Horror Mode
    if (this.mode === 'horror_darkness' && this.player) {
      this.raycast.renderDarknessOverlay(
        ctx, this.canvas.width, this.canvas.height,
        this.player.x - this.camera.x,
        this.player.y - this.camera.y,
        this.player.angle,
        this.player.flashlightFov,
        this.player.flashlightRange,
        this.walls.map(w => ({
          x1: w.x1 - this.camera.x,
          y1: w.y1 - this.camera.y,
          x2: w.x2 - this.camera.x,
          y2: w.y2 - this.camera.y
        })),
        70
      );
    }

    // 13. Render Minimap Radar
    this.renderMinimap();
  }

  renderMinimap() {
    if (!this.minimapCtx) return;
    const mctx = this.minimapCtx;
    mctx.clearRect(0, 0, this.minimapCanvas.width, this.minimapCanvas.height);

    const scaleX = this.minimapCanvas.width / this.worldWidth;
    const scaleY = this.minimapCanvas.height / this.worldHeight;

    // Walls
    mctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
    mctx.lineWidth = 1;
    for (let w of this.walls) {
      mctx.beginPath();
      mctx.moveTo(w.x1 * scaleX, w.y1 * scaleY);
      mctx.lineTo(w.x2 * scaleX, w.y2 * scaleY);
      mctx.stroke();
    }

    // Seekers (Red dots)
    for (let s of this.seekers) {
      if (!s.isAlive) continue;
      mctx.fillStyle = '#ff3366';
      mctx.beginPath();
      mctx.arc(s.x * scaleX, s.y * scaleY, 3, 0, Math.PI * 2);
      mctx.fill();
    }

    // Hiders (Cyan dots)
    for (let h of this.hiders) {
      if (h.isCaught) continue;
      mctx.fillStyle = h.isFrozen ? '#70d6ff' : '#00e5ff';
      mctx.beginPath();
      mctx.arc(h.x * scaleX, h.y * scaleY, 2.5, 0, Math.PI * 2);
      mctx.fill();
    }

    // Player (Green dot with pulse ring)
    if (this.player && this.player.isAlive) {
      mctx.fillStyle = '#06d6a0';
      mctx.beginPath();
      mctx.arc(this.player.x * scaleX, this.player.y * scaleY, 3.5, 0, Math.PI * 2);
      mctx.fill();
    }
  }

  updateHUD() {
    const timerElem = document.getElementById('hud-timer');
    if (timerElem) {
      const mins = Math.floor(this.timeRemaining / 60);
      const secs = Math.floor(this.timeRemaining % 60);
      timerElem.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    const hidersElem = document.getElementById('hud-hiders-left');
    if (hidersElem) {
      const activeHiders = this.hiders.filter(h => h.isAlive && !h.isCaught).length + (this.player?.role !== 'seeker' && this.player?.isAlive ? 1 : 0);
      const totalHiders = this.hiders.length + (this.player?.role !== 'seeker' ? 1 : 0);
      hidersElem.textContent = `${activeHiders} / ${totalHiders}`;
    }

    const roleBadge = document.getElementById('hud-role-badge');
    if (roleBadge && this.player) {
      roleBadge.textContent = this.player.role.toUpperCase();
      roleBadge.className = `role-badge role-${this.player.role}`;
    }

    const stealthBar = document.getElementById('stealth-bar');
    if (stealthBar && this.player) {
      stealthBar.style.width = `${this.player.stealthMeter}%`;
    }

    const scoreElem = document.getElementById('hud-score');
    if (scoreElem && this.player) {
      scoreElem.textContent = this.player.score;
    }

    // Hotbar Cooldown Overlays
    this.updateCooldownOverlay('cd-1', this.items.cooldowns.invisibility, 12.0);
    this.updateCooldownOverlay('cd-2', this.items.cooldowns.decoy, 10.0);
    this.updateCooldownOverlay('cd-3', this.items.cooldowns.smoke, 8.0);
    this.updateCooldownOverlay('cd-4', this.items.cooldowns.sonar, 8.0);
    this.updateCooldownOverlay('cd-taunt', this.items.cooldowns.taunt, 5.0);
  }

  updateCooldownOverlay(elemId, currentCd, maxCd) {
    const el = document.getElementById(elemId);
    if (el) {
      const pct = (currentCd / maxCd) * 100;
      el.style.height = `${pct}%`;
    }
  }

  populateLoreUI() {
    const container = document.getElementById('lore-content-container');
    if (!container) return;
    container.innerHTML = '';

    if (window.HideAndSeekLoreDB) {
      for (let dossier of window.HideAndSeekLoreDB.operatives.slice(0, 15)) {
        const item = document.createElement('div');
        item.style.cssText = 'background: rgba(26, 38, 59, 0.6); border: 1px solid rgba(64, 93, 138, 0.4); border-radius: 10px; padding: 12px;';
        item.innerHTML = `
          <div style="font-size: 15px; font-weight: 700; color: #00e5ff;">${dossier.callsign} (${dossier.name})</div>
          <div style="font-size: 12px; color: #ffb703; margin-bottom: 4px;">Role: ${dossier.role} | Rank: ${dossier.rank} | Clearance: ${dossier.clearance}</div>
          <div style="font-size: 13px; color: #cbd5e1; line-height: 1.4;">${dossier.bio}</div>
        `;
        container.appendChild(item);
      }
    }
  }
}

// Auto instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.Game = new GameEngine();
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameEngine;
}
