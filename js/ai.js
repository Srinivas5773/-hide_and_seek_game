/**
 * ============================================================================
 * SHADOW SEEKERS // AI BEHAVIOR TREE & STATE MACHINE ENGINE
 * Seeker patrol, acoustic sound investigation, predictive chase interception,
 * Hider stealth cover navigation, prop morph camouflage, and rescue logic.
 * ============================================================================
 */

class AIEngine {
  constructor(pathfindingEngine, raycastEngine, audioEngine) {
    this.pathfinding = pathfindingEngine;
    this.raycast = raycastEngine;
    this.audio = audioEngine;
  }

  // ==========================================================================
  // UPDATE ALL AI SEEKERS
  // ==========================================================================
  updateSeeker(seeker, dt, hiders, walls, props = [], gameMode = 'classic_hider', onCatchCallback = null) {
    if (!seeker.isAlive) return;

    // 1. Scan for visible hiders within vision cone
    let visibleTarget = null;
    let minDistance = Infinity;

    for (let h of hiders) {
      if (!h.isAlive || h.isCaught || h.isInvisible || (gameMode === 'freeze_tag' && h.isFrozen)) {
        continue;
      }

      // Prop camouflage detection test
      if (h.isDisguised && gameMode === 'prop_hunt') {
        // If moving, camouflage is broken!
        const isMoving = Math.abs(h.vx) > 5 || Math.abs(h.vy) > 5;
        if (!isMoving) {
          // If disguised and still, seeker only notices if very close (< 60px)
          const dist = seeker.distanceTo(h);
          if (dist > 70) continue;
        }
      }

      const inCone = this.raycast.isInVisionCone(
        h.x, h.y,
        seeker.x, seeker.y,
        seeker.angle,
        seeker.flashlightFov,
        seeker.flashlightRange,
        walls
      );

      if (inCone) {
        const dist = seeker.distanceTo(h);
        if (dist < minDistance) {
          minDistance = dist;
          visibleTarget = h;
        }
      }
    }

    // 2. State Machine Execution
    if (visibleTarget) {
      // Transition to CHASE
      if (seeker.state !== 'chase') {
        seeker.state = 'chase';
        if (this.audio) this.audio.playDetectionAlert();
      }
      seeker.target = visibleTarget;
      seeker.lastKnownTargetPos = { x: visibleTarget.x, y: visibleTarget.y };
      seeker.searchTimer = 4.0;
    }

    switch (seeker.state) {
      case 'chase':
        this.executeChaseState(seeker, dt, walls, onCatchCallback);
        break;

      case 'investigate':
        this.executeInvestigateState(seeker, dt, walls);
        break;

      case 'search':
        this.executeSearchState(seeker, dt, walls);
        break;

      case 'patrol':
      default:
        this.executePatrolState(seeker, dt, walls);
        break;
    }
  }

  executeChaseState(seeker, dt, walls, onCatchCallback) {
    if (!seeker.target || !seeker.target.isAlive) {
      seeker.state = 'investigate';
      return;
    }

    // Direct chase angle towards target
    const dx = seeker.target.x - seeker.x;
    const dy = seeker.target.y - seeker.y;
    const targetAngle = Math.atan2(dy, dx);

    // Smooth turn towards target
    seeker.angle = this.lerpAngle(seeker.angle, targetAngle, dt * 8);

    const dist = seeker.distanceTo(seeker.target);

    // Check catch range (< 32px)
    if (dist <= seeker.radius + seeker.target.radius + 6) {
      if (onCatchCallback) {
        onCatchCallback(seeker, seeker.target);
      }
      seeker.target = null;
      seeker.state = 'patrol';
      return;
    }

    // Move seeker forward at chase speed
    const moveX = seeker.x + Math.cos(seeker.angle) * seeker.chaseSpeed * dt;
    const moveY = seeker.y + Math.sin(seeker.angle) * seeker.chaseSpeed * dt;

    if (!seeker.checkWallCollisionAt(moveX, seeker.y, walls)) seeker.x = moveX;
    if (!seeker.checkWallCollisionAt(seeker.x, moveY, walls)) seeker.y = moveY;

    // Check line of sight to maintain chase
    const hasSight = this.raycast.hasLineOfSight(seeker.x, seeker.y, seeker.target.x, seeker.target.y, walls);
    if (!hasSight) {
      // Lost sight, investigate last known spot
      seeker.state = 'investigate';
      seeker.path = this.pathfinding.findPath(seeker.x, seeker.y, seeker.lastKnownTargetPos.x, seeker.lastKnownTargetPos.y);
    }
  }

  executeInvestigateState(seeker, dt, walls) {
    if (!seeker.lastKnownTargetPos) {
      seeker.state = 'patrol';
      return;
    }

    const dist = Math.sqrt((seeker.x - seeker.lastKnownTargetPos.x) ** 2 + (seeker.y - seeker.lastKnownTargetPos.y) ** 2);
    if (dist < 40) {
      seeker.state = 'search';
      seeker.searchTimer = 3.5;
      return;
    }

    // Path towards last known position
    if (!seeker.path || seeker.path.length === 0) {
      seeker.path = this.pathfinding.findPath(seeker.x, seeker.y, seeker.lastKnownTargetPos.x, seeker.lastKnownTargetPos.y);
    }

    this.followPath(seeker, dt, seeker.speed * 1.1, walls);
  }

  executeSearchState(seeker, dt, walls) {
    seeker.searchTimer -= dt;
    // Rotate flashlight around in a sweep
    seeker.angle += dt * 3.5;

    if (seeker.searchTimer <= 0) {
      seeker.state = 'patrol';
      seeker.target = null;
      seeker.lastKnownTargetPos = null;
    }
  }

  executePatrolState(seeker, dt, walls) {
    if (!seeker.patrolWaypoints || seeker.patrolWaypoints.length === 0) {
      return;
    }

    const currentWaypoint = seeker.patrolWaypoints[seeker.currentWaypointIndex];
    const distToWaypoint = Math.sqrt((seeker.x - currentWaypoint.x) ** 2 + (seeker.y - currentWaypoint.y) ** 2);

    if (distToWaypoint < 40) {
      seeker.currentWaypointIndex = (seeker.currentWaypointIndex + 1) % seeker.patrolWaypoints.length;
      const nextWaypoint = seeker.patrolWaypoints[seeker.currentWaypointIndex];
      seeker.path = this.pathfinding.findPath(seeker.x, seeker.y, nextWaypoint.x, nextWaypoint.y);
    }

    if (!seeker.path || seeker.path.length === 0) {
      seeker.path = this.pathfinding.findPath(seeker.x, seeker.y, currentWaypoint.x, currentWaypoint.y);
    }

    this.followPath(seeker, dt, seeker.speed, walls);
  }

  // ==========================================================================
  // UPDATE ALL AI HIDERS
  // ==========================================================================
  updateHider(hider, dt, seekers, walls, allHiders = [], gameMode = 'classic_hider') {
    if (!hider.isAlive || hider.isCaught) return;

    if (hider.isFrozen) {
      hider.vx = 0;
      hider.vy = 0;
      return;
    }

    // Check distance to closest seeker
    let closestSeeker = null;
    let minSeekerDist = Infinity;

    for (let s of seekers) {
      if (!s.isAlive) continue;
      const dist = hider.distanceTo(s);
      if (dist < minSeekerDist) {
        minSeekerDist = dist;
        closestSeeker = s;
      }
    }

    // 1. Panic & Flee condition
    if (closestSeeker && minSeekerDist < 180) {
      const seekerCanSeeHider = this.raycast.isInVisionCone(
        hider.x, hider.y,
        closestSeeker.x, closestSeeker.y,
        closestSeeker.angle,
        closestSeeker.flashlightFov,
        closestSeeker.flashlightRange,
        walls
      );

      if (seekerCanSeeHider || minSeekerDist < 100) {
        hider.state = 'flee';
        hider.isDisguised = false; // Breaking disguise when fleeing
        hider.panicTimer = 2.5;
      }
    }

    // 2. Freeze Tag Rescue Logic
    if (gameMode === 'freeze_tag' && hider.state === 'hide' && minSeekerDist > 260) {
      const frozenAlly = allHiders.find(h => h.isAlive && !h.isCaught && h.isFrozen);
      if (frozenAlly) {
        const distToAlly = hider.distanceTo(frozenAlly);
        if (distToAlly < 36) {
          // Unfreeze ally!
          frozenAlly.isFrozen = false;
          if (this.audio) this.audio.playCatchSound(true);
        } else {
          // Path towards frozen ally to rescue
          if (!hider.path || hider.path.length === 0) {
            hider.path = this.pathfinding.findPath(hider.x, hider.y, frozenAlly.x, frozenAlly.y);
          }
          this.followPath(hider, dt, hider.speed, walls);
          return;
        }
      }
    }

    // 3. State execution
    if (hider.state === 'flee') {
      this.executeHiderFleeState(hider, dt, closestSeeker, walls);
    } else {
      this.executeHiderHideState(hider, dt, seekers, walls, gameMode);
    }
  }

  executeHiderFleeState(hider, dt, seeker, walls) {
    hider.panicTimer -= dt;
    if (hider.panicTimer <= 0) {
      hider.state = 'hide';
      hider.path = [];
      return;
    }

    if (seeker) {
      // Run in opposite direction of seeker
      const fleeAngle = Math.atan2(hider.y - seeker.y, hider.x - seeker.x);
      hider.angle = this.lerpAngle(hider.angle, fleeAngle, dt * 10);

      const moveX = hider.x + Math.cos(fleeAngle) * hider.panicSpeed * dt;
      const moveY = hider.y + Math.sin(fleeAngle) * hider.panicSpeed * dt;

      if (!hider.checkWallCollisionAt(moveX, hider.y, walls)) hider.x = moveX;
      if (!hider.checkWallCollisionAt(hider.x, moveY, walls)) hider.y = moveY;
    }
  }

  executeHiderHideState(hider, dt, seekers, walls, gameMode) {
    if (!hider.hidingSpot || (hider.path && hider.path.length === 0)) {
      // Find new stealth hiding spot
      hider.hidingSpot = this.pathfinding.findBestHidingSpot(hider.x, hider.y, seekers, walls, this.raycast);
      hider.path = this.pathfinding.findPath(hider.x, hider.y, hider.hidingSpot.x, hider.hidingSpot.y);
    }

    const distToSpot = Math.sqrt((hider.x - hider.hidingSpot.x) ** 2 + (hider.y - hider.hidingSpot.y) ** 2);
    if (distToSpot > 30) {
      this.followPath(hider, dt, hider.speed, walls);
    } else {
      // Reached cover: Hold position and disguise if in prop hunt mode
      hider.vx = 0;
      hider.vy = 0;
      if (gameMode === 'prop_hunt' && !hider.isDisguised) {
        hider.isDisguised = true;
      }
    }
  }

  // ==========================================================================
  // PATH FOLLOWING HELPER
  // ==========================================================================
  followPath(entity, dt, moveSpeed, walls) {
    if (!entity.path || entity.path.length === 0) return;

    const nextNode = entity.path[0];
    const dx = nextNode.x - entity.x;
    const dy = nextNode.y - entity.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 18) {
      entity.path.shift();
      if (entity.path.length === 0) return;
    }

    const moveAngle = Math.atan2(dy, dx);
    entity.angle = this.lerpAngle(entity.angle, moveAngle, dt * 8);

    const moveX = entity.x + Math.cos(moveAngle) * moveSpeed * dt;
    const moveY = entity.y + Math.sin(moveAngle) * moveSpeed * dt;

    if (!entity.checkWallCollisionAt(moveX, entity.y, walls)) entity.x = moveX;
    if (!entity.checkWallCollisionAt(entity.x, moveY, walls)) entity.y = moveY;
  }

  lerpAngle(a, b, t) {
    let diff = b - a;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    return a + diff * t;
  }

  // Trigger audio noise event (e.g. whistle taunt, alarm trap)
  alertSeekersToNoise(noiseX, noiseY, seekers) {
    for (let s of seekers) {
      if (s.isAlive && s.state !== 'chase') {
        s.state = 'investigate';
        s.lastKnownTargetPos = { x: noiseX, y: noiseY };
        s.path = this.pathfinding.findPath(s.x, s.y, noiseX, noiseY);
      }
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIEngine;
} else {
  window.AIEngine = AIEngine;
}
