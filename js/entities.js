/**
 * ============================================================================
 * SHADOW SEEKERS // ENTITY & ACTOR ARCHITECTURE
 * Player, Seeker Bots, Hider Bots, Camouflaged Props, Decoys, Traps,
 * Footprint Trails, and Particle Effects.
 * ============================================================================
 */

class Entity {
  constructor(x, y, radius = 16) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = radius;
    this.angle = 0;
    this.speed = 180; // px/sec
    this.isAlive = true;
  }

  distanceTo(other) {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  collidesWith(other) {
    const minDistance = this.radius + other.radius;
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return dx * dx + dy * dy <= minDistance * minDistance;
  }

  checkWallCollisionAt(testX, testY, walls) {
    if (!walls || walls.length === 0) return false;
    for (let w of walls) {
      const l2 = (w.x2 - w.x1) ** 2 + (w.y2 - w.y1) ** 2;
      if (l2 === 0) continue;
      let t = ((testX - w.x1) * (w.x2 - w.x1) + (testY - w.y1) * (w.y2 - w.y1)) / l2;
      t = Math.max(0, Math.min(1, t));
      const projX = w.x1 + t * (w.x2 - w.x1);
      const projY = w.y1 + t * (w.y2 - w.y1);

      const distSq = (testX - projX) ** 2 + (testY - projY) ** 2;
      if (distSq < this.radius * this.radius) {
        return true;
      }
    }
    return false;
  }

  moveWithWallCollisions(targetX, targetY, walls) {
    if (!this.checkWallCollisionAt(targetX, this.y, walls)) {
      this.x = targetX;
    }
    if (!this.checkWallCollisionAt(this.x, targetY, walls)) {
      this.y = targetY;
    }
  }
}

// ============================================================================
// PLAYER CHARACTER
// ============================================================================
class Player extends Entity {
  constructor(x, y, role = 'hider') {
    super(x, y, 16);
    this.role = role; // 'hider', 'seeker', 'prop'
    this.baseSpeed = 190;
    this.sprintSpeed = 290;
    this.speed = this.baseSpeed;

    this.stamina = 100;
    this.maxStamina = 100;
    this.isSprinting = false;

    this.stealthMeter = 100; // 0 (loud/spotted) to 100 (silent ghost)
    this.isInvisible = false;
    this.invisibilityTimer = 0;

    this.isFrozen = false;
    this.freezeTimer = 0;

    this.isDisguised = false;
    this.propType = 'crate'; // 'crate', 'barrel', 'bush', 'statue', 'vending_machine'

    this.flashlightFov = Math.PI / 3; // 60 deg
    this.flashlightRange = 360;

    this.score = 0;
    this.catches = 0;
    this.taunts = 0;
    this.rescues = 0;

    this.inventory = {
      invisibility: 2,
      decoy: 2,
      smoke: 3,
      sonar: 999
    };
  }

  update(dt, inputVector, walls) {
    if (this.isFrozen) {
      this.vx = 0;
      this.vy = 0;
      return;
    }

    // Handle invisibility timer
    if (this.isInvisible) {
      this.invisibilityTimer -= dt;
      if (this.invisibilityTimer <= 0) {
        this.isInvisible = false;
      }
    }

    // Handle Stamina & Sprint
    if (inputVector.isMoving && inputVector.isSprinting && this.stamina > 5) {
      this.isSprinting = true;
      this.speed = this.sprintSpeed;
      this.stamina = Math.max(0, this.stamina - dt * 25);
      this.stealthMeter = Math.max(10, this.stealthMeter - dt * 40); // Sprinting makes noise
    } else {
      this.isSprinting = false;
      this.speed = this.baseSpeed;
      this.stamina = Math.min(this.maxStamina, this.stamina + dt * 18);
      this.stealthMeter = Math.min(100, this.stealthMeter + dt * 20);
    }

    // Apply Velocity
    this.vx = inputVector.x * this.speed;
    this.vy = inputVector.y * this.speed;

    const nextX = this.x + this.vx * dt;
    const nextY = this.y + this.vy * dt;

    // Resolve wall collisions with sliding physics
    this.moveWithWallCollisions(nextX, nextY, walls);

    // Update aim angle if moving
    if (inputVector.isMoving) {
      this.angle = Math.atan2(inputVector.y, inputVector.x);
    }
  }
}

// ============================================================================
// AI SEEKER BOT
// ============================================================================
class SeekerBot extends Entity {
  constructor(x, y, id = 'Seeker-AI') {
    super(x, y, 16);
    this.id = id;
    this.role = 'seeker';
    this.speed = 175;
    this.chaseSpeed = 245;
    this.state = 'patrol'; // 'patrol', 'investigate', 'search', 'chase'

    this.flashlightFov = Math.PI / 3;
    this.flashlightRange = 340;

    this.patrolWaypoints = [];
    this.currentWaypointIndex = 0;
    this.path = [];

    this.target = null;
    this.lastKnownTargetPos = null;
    this.searchTimer = 0;
    this.investigatePos = null;

    this.sonarCooldown = 15.0;
    this.sonarTimer = 5.0;
  }

  update(dt, walls) {
    if (this.sonarTimer > 0) this.sonarTimer -= dt;
  }
}

// ============================================================================
// AI HIDERS BOT
// ============================================================================
class HiderBot extends Entity {
  constructor(x, y, id = 'Hider-AI') {
    super(x, y, 16);
    this.id = id;
    this.role = 'hider';
    this.speed = 180;
    this.panicSpeed = 270;
    this.state = 'hide'; // 'hide', 'flee', 'juke', 'morph', 'frozen', 'rescued'

    this.isFrozen = false;
    this.isCaught = false;
    this.isDisguised = false;
    this.propType = 'crate';

    this.hidingSpot = { x: x, y: y };
    this.path = [];
    this.panicTimer = 0;
    this.smokeCooldown = 25.0;
    this.smokeTimer = 5.0;
  }

  update(dt, walls) {
    if (this.smokeTimer > 0) this.smokeTimer -= dt;
  }
}

// ============================================================================
// INTERACTIVE PROPS & COVER
// ============================================================================
class Prop {
  constructor(x, y, type = 'crate', width = 32, height = 32) {
    this.x = x;
    this.y = y;
    this.type = type; // 'crate', 'barrel', 'bush', 'vending_machine', 'statue', 'couch'
    this.width = width;
    this.height = height;
    this.radius = Math.max(width, height) / 2;
    this.isDisguisedPlayer = false;
    this.disguisedEntity = null;
    this.durability = 100;
  }
}

// ============================================================================
// DECOY HOLOGRAM
// ============================================================================
class Decoy {
  constructor(x, y, angle, speed = 200, lifeTime = 6.0) {
    this.x = x;
    this.y = y;
    this.radius = 16;
    this.angle = angle;
    this.speed = speed;
    this.life = lifeTime;
    this.maxLife = lifeTime;
    this.isAlive = true;
  }

  update(dt, walls) {
    this.life -= dt;
    if (this.life <= 0) {
      this.isAlive = false;
      return;
    }

    const nextX = this.x + Math.cos(this.angle) * this.speed * dt;
    const nextY = this.y + Math.sin(this.angle) * this.speed * dt;
    this.x = nextX;
    this.y = nextY;
  }
}

// ============================================================================
// TRAPS (Glue Puddles / Alarm Tripwires)
// ============================================================================
class Trap {
  constructor(x, y, type = 'glue', duration = 12.0) {
    this.x = x;
    this.y = y;
    this.radius = 24;
    this.type = type; // 'glue', 'alarm'
    this.life = duration;
    this.triggered = false;
    this.isAlive = true;
  }

  update(dt) {
    this.life -= dt;
    if (this.life <= 0) this.isAlive = false;
  }
}

// ============================================================================
// FOOTPRINT TRAILS
// ============================================================================
class Footprint {
  constructor(x, y, angle, isSeeker = false, isGlowing = false) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.isSeeker = isSeeker;
    this.isGlowing = isGlowing;
    this.alpha = 0.8;
    this.fadeRate = isGlowing ? 0.08 : 0.15;
    this.isAlive = true;
  }

  update(dt) {
    this.alpha -= this.fadeRate * dt;
    if (this.alpha <= 0) {
      this.isAlive = false;
    }
  }
}

// ============================================================================
// PARTICLE VFX
// ============================================================================
class Particle {
  constructor(x, y, vx, vy, color = '#00e5ff', size = 4, life = 1.0) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.life = life;
    this.maxLife = life;
    this.isAlive = true;
  }

  update(dt) {
    this.life -= dt;
    if (this.life <= 0) {
      this.isAlive = false;
      return;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= 0.96;
    this.vy *= 0.96;
  }
}

// ============================================================================
// FLOATING TEXT
// ============================================================================
class FloatingText {
  constructor(x, y, text, color = '#ffffff', duration = 1.2) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.life = duration;
    this.maxLife = duration;
    this.vy = -35;
    this.isAlive = true;
  }

  update(dt) {
    this.life -= dt;
    if (this.life <= 0) {
      this.isAlive = false;
      return;
    }
    this.y += this.vy * dt;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Entity, Player, SeekerBot, HiderBot, Prop, Decoy, Trap, Footprint, Particle, FloatingText };
} else {
  window.Entity = Entity;
  window.Player = Player;
  window.SeekerBot = SeekerBot;
  window.HiderBot = HiderBot;
  window.Prop = Prop;
  window.Decoy = Decoy;
  window.Trap = Trap;
  window.Footprint = Footprint;
  window.Particle = Particle;
  window.FloatingText = FloatingText;
}
