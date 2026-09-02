/**
 * ============================================================================
 * SHADOW SEEKERS // MULTI-MODAL INPUT HANDLER
 * Keyboard, Mouse Directional Aiming, Touch Virtual Joystick, and Gamepad.
 * ============================================================================
 */

class InputHandler {
  constructor() {
    this.keys = {};
    this.mouse = {
      x: 0,
      y: 0,
      worldX: 0,
      worldY: 0,
      isDown: false,
      rightDown: false
    };

    this.joystick = {
      active: false,
      dx: 0,
      dy: 0,
      angle: 0,
      distance: 0
    };

    this.actionTriggered = {
      ability1: false,
      ability2: false,
      ability3: false,
      ability4: false,
      interact: false,
      taunt: false,
      pause: false,
      soundToggle: false
    };

    this.initEventListeners();
  }

  initEventListeners() {
    if (typeof window === 'undefined') return;

    // Keyboard Down
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      this.keys[e.code] = true;

      // Handle direct key triggers
      if (e.key === '1') this.actionTriggered.ability1 = true;
      if (e.key === '2') this.actionTriggered.ability2 = true;
      if (e.key === '3') this.actionTriggered.ability3 = true;
      if (e.key === '4') this.actionTriggered.ability4 = true;
      if (e.key.toLowerCase() === 'e') this.actionTriggered.interact = true;
      if (e.key.toLowerCase() === 't') this.actionTriggered.taunt = true;
      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') this.actionTriggered.pause = true;
      if (e.key.toLowerCase() === 'm') this.actionTriggered.soundToggle = true;

      // Prevent scrolling from arrow keys / space
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    });

    // Keyboard Up
    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
      this.keys[e.code] = false;
    });

    // Mouse Movement & Clicks
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.mouse.isDown = true;
      if (e.button === 2) this.mouse.rightDown = true;
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouse.isDown = false;
      if (e.button === 2) this.mouse.rightDown = false;
    });

    window.addEventListener('contextmenu', (e) => {
      // Allow right clicks without opening default browser menu during gameplay
      const target = e.target;
      if (target && (target.id === 'gameCanvas' || target.closest('#game-container'))) {
        e.preventDefault();
      }
    });

    // Virtual Touch Joystick for Mobile
    this.initTouchControls();
  }

  initTouchControls() {
    const joystickZone = document.getElementById('virtual-joystick-zone');
    const joystickKnob = document.getElementById('virtual-joystick-knob');
    if (!joystickZone || !joystickKnob) return;

    let touchId = null;
    let centerX = 0;
    let centerY = 0;
    const maxRadius = 45;

    const onTouchStart = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const rect = joystickZone.getBoundingClientRect();
        centerX = rect.left + rect.width / 2;
        centerY = rect.top + rect.height / 2;
        touchId = t.identifier;
        this.joystick.active = true;
        updateKnob(t.clientX, t.clientY);
        break;
      }
    };

    const onTouchMove = (e) => {
      if (!this.joystick.active) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === touchId) {
          updateKnob(t.clientX, t.clientY);
          break;
        }
      }
    };

    const onTouchEnd = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === touchId) {
          this.joystick.active = false;
          this.joystick.dx = 0;
          this.joystick.dy = 0;
          this.joystick.distance = 0;
          joystickKnob.style.transform = 'translate(0px, 0px)';
          touchId = null;
          break;
        }
      }
    };

    const updateKnob = (touchX, touchY) => {
      let deltaX = touchX - centerX;
      let deltaY = touchY - centerY;
      const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      this.joystick.angle = Math.atan2(deltaY, deltaX);

      if (dist > maxRadius) {
        deltaX = Math.cos(this.joystick.angle) * maxRadius;
        deltaY = Math.sin(this.joystick.angle) * maxRadius;
      }

      this.joystick.dx = deltaX / maxRadius;
      this.joystick.dy = deltaY / maxRadius;
      this.joystick.distance = Math.min(dist / maxRadius, 1);
      joystickKnob.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    };

    joystickZone.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: false });
    window.addEventListener('touchcancel', onTouchEnd, { passive: false });

    // Mobile Action buttons
    const btnInteract = document.getElementById('btn-mobile-interact');
    const btnAbility = document.getElementById('btn-mobile-ability');
    const btnTaunt = document.getElementById('btn-mobile-taunt');

    if (btnInteract) btnInteract.addEventListener('touchstart', () => { this.actionTriggered.interact = true; });
    if (btnAbility) btnAbility.addEventListener('touchstart', () => { this.actionTriggered.ability3 = true; });
    if (btnTaunt) btnTaunt.addEventListener('touchstart', () => { this.actionTriggered.taunt = true; });
  }

  // Get normalized movement vector (X: -1 to 1, Y: -1 to 1)
  getMovementVector() {
    let moveX = 0;
    let moveY = 0;

    // Keyboard WASD / Arrows
    if (this.keys['w'] || this.keys['arrowup'] || this.keys['KeyW']) moveY -= 1;
    if (this.keys['s'] || this.keys['arrowdown'] || this.keys['KeyS']) moveY += 1;
    if (this.keys['a'] || this.keys['arrowleft'] || this.keys['KeyA']) moveX -= 1;
    if (this.keys['d'] || this.keys['arrowright'] || this.keys['KeyD']) moveX += 1;

    // Normalize diagonal keyboard speed
    if (moveX !== 0 && moveY !== 0) {
      const invLen = 1 / Math.SQRT2;
      moveX *= invLen;
      moveY *= invLen;
    }

    // Touch Virtual Joystick override if active
    if (this.joystick.active) {
      moveX = this.joystick.dx;
      moveY = this.joystick.dy;
    }

    const isSprinting = Boolean(this.keys['shift'] || this.keys['ShiftLeft'] || this.keys['ShiftRight']);

    return {
      x: moveX,
      y: moveY,
      isMoving: moveX !== 0 || moveY !== 0,
      isSprinting: isSprinting
    };
  }

  consumeAction(actionName) {
    if (this.actionTriggered[actionName]) {
      this.actionTriggered[actionName] = false;
      return true;
    }
    return false;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = InputHandler;
} else {
  window.InputHandler = InputHandler;
}
