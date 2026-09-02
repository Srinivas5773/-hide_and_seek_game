/**
 * ============================================================================
 * SHADOW SEEKERS // GADGETS, ABILITIES & INVENTORY ENGINE
 * Invisibility Cloak, Holographic Decoy, Smoke Screen, Sonar Scan,
 * Camouflage Prop Morph, and Whistle Taunt systems.
 * ============================================================================
 */

let EntitiesModule = null;
if (typeof require !== 'undefined') {
  try {
    EntitiesModule = require('./entities.js');
  } catch (e) {}
}

function createFloatingText(x, y, text, color, duration) {
  if (typeof FloatingText !== 'undefined') {
    return new FloatingText(x, y, text, color, duration);
  }
  if (EntitiesModule && EntitiesModule.FloatingText) {
    return new EntitiesModule.FloatingText(x, y, text, color, duration);
  }
  return { x, y, text, color, life: duration, isAlive: true, update: () => {} };
}

function createParticle(x, y, vx, vy, color, size, life) {
  if (typeof Particle !== 'undefined') {
    return new Particle(x, y, vx, vy, color, size, life);
  }
  if (EntitiesModule && EntitiesModule.Particle) {
    return new EntitiesModule.Particle(x, y, vx, vy, color, size, life);
  }
  return { x, y, vx, vy, color, size, life, isAlive: true, update: () => {} };
}

function createDecoy(x, y, angle, speed, life) {
  if (typeof Decoy !== 'undefined') {
    return new Decoy(x, y, angle, speed, life);
  }
  if (EntitiesModule && EntitiesModule.Decoy) {
    return new EntitiesModule.Decoy(x, y, angle, speed, life);
  }
  return { x, y, angle, speed, life, isAlive: true, update: () => {} };
}

class ItemManager {
  constructor(audioEngine, aiEngine) {
    this.audio = audioEngine;
    this.ai = aiEngine;
    this.cooldowns = {
      invisibility: 0,
      decoy: 0,
      smoke: 0,
      sonar: 0,
      taunt: 0
    };
  }

  update(dt) {
    for (let key in this.cooldowns) {
      if (this.cooldowns[key] > 0) {
        this.cooldowns[key] -= dt;
      }
    }
  }

  // 1. INVISIBILITY CLOAK
  useInvisibility(player, particles, floatingTexts) {
    if (this.cooldowns.invisibility > 0 || player.inventory.invisibility <= 0) return false;
    player.inventory.invisibility--;
    this.cooldowns.invisibility = 12.0;

    player.isInvisible = true;
    player.invisibilityTimer = 6.0;

    if (this.audio) this.audio.playCatchSound(true);

    if (floatingTexts) {
      floatingTexts.push(createFloatingText(player.x, player.y - 20, 'GHOST CLOAK ACTIVE (6s)', '#a78bfa', 1.5));
    }

    // Sparkle VFX
    if (particles) {
      for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 40 + Math.random() * 80;
        particles.push(createParticle(player.x, player.y, Math.cos(angle) * speed, Math.sin(angle) * speed, '#a78bfa', 5, 0.8));
      }
    }
    return true;
  }

  // 2. HOLOGRAPHIC DECOY
  useDecoy(player, decoys, floatingTexts) {
    if (this.cooldowns.decoy > 0 || player.inventory.decoy <= 0) return false;
    player.inventory.decoy--;
    this.cooldowns.decoy = 10.0;

    if (decoys) {
      const decoy = createDecoy(player.x, player.y, player.angle, 220, 7.0);
      decoys.push(decoy);
    }

    if (this.audio) this.audio.playSonarPing();

    if (floatingTexts) {
      floatingTexts.push(createFloatingText(player.x, player.y - 20, 'DECOY DEPLOYED', '#00e5ff', 1.2));
    }
    return true;
  }

  // 3. SMOKE GRENADE
  useSmokeBomb(player, particles, seekers, floatingTexts) {
    if (this.cooldowns.smoke > 0 || player.inventory.smoke <= 0) return false;
    player.inventory.smoke--;
    this.cooldowns.smoke = 8.0;

    if (this.audio) this.audio.playSmokeBomb();

    // Reset nearby seekers currently chasing player
    if (seekers) {
      for (let s of seekers) {
        if (s.isAlive && s.distanceTo(player) < 220) {
          s.state = 'search';
          s.searchTimer = 3.0;
          s.target = null;
        }
      }
    }

    if (floatingTexts) {
      floatingTexts.push(createFloatingText(player.x, player.y - 20, 'SMOKE SCREEN', '#94a3b8', 1.2));
    }

    // Smoke cloud particles
    if (particles) {
      for (let i = 0; i < 35; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 20 + Math.random() * 90;
        particles.push(createParticle(player.x, player.y, Math.cos(angle) * speed, Math.sin(angle) * speed, 'rgba(148, 163, 184, 0.7)', 12 + Math.random() * 8, 1.8));
      }
    }
    return true;
  }

  // 4. SONAR SCAN (Seeker Ability)
  useSonarPulse(player, hiders, particles, floatingTexts) {
    if (this.cooldowns.sonar > 0) return false;
    this.cooldowns.sonar = 8.0;

    if (this.audio) this.audio.playSonarPing();

    if (floatingTexts) {
      floatingTexts.push(createFloatingText(player.x, player.y - 20, 'SONAR SWEEP (1000m)', '#ffb703', 1.5));
    }

    // Sonar ring particles
    if (particles) {
      for (let i = 0; i < 60; i++) {
        const angle = (i / 60) * Math.PI * 2;
        particles.push(createParticle(player.x, player.y, Math.cos(angle) * 300, Math.sin(angle) * 300, '#ffb703', 4, 1.2));
      }
    }

    // Ping hider positions with floating markers
    if (hiders && floatingTexts) {
      for (let h of hiders) {
        if (h.isAlive && !h.isCaught) {
          const dist = Math.round(player.distanceTo(h));
          floatingTexts.push(createFloatingText(h.x, h.y - 25, `SIGNAL: ${dist}m`, '#ff3366', 2.5));
        }
      }
    }
    return true;
  }

  // 5. PROP MORPH / CAMOUFLAGE DISGUISE
  usePropMorph(player, floatingTexts) {
    const propTypes = ['crate', 'barrel', 'bush', 'vending_machine', 'statue', 'couch'];
    const currentIdx = propTypes.indexOf(player.propType);
    player.propType = propTypes[(currentIdx + 1) % propTypes.length];
    player.isDisguised = true;

    if (this.audio) this.audio.playCatchSound(true);

    if (floatingTexts) {
      floatingTexts.push(createFloatingText(player.x, player.y - 20, `MORPH: ${player.propType.toUpperCase()}`, '#ffb703', 1.2));
    }
    return true;
  }

  // 6. WHISTLE TAUNT
  useWhistleTaunt(player, seekers, floatingTexts, telemetry) {
    if (this.cooldowns.taunt > 0) return false;
    this.cooldowns.taunt = 5.0;

    if (this.audio) this.audio.playWhistleTaunt();

    player.score += 150;
    player.taunts++;

    if (telemetry) telemetry.logTaunt();

    if (floatingTexts) {
      floatingTexts.push(createFloatingText(player.x, player.y - 25, 'TAUNT! +150 XP', '#06d6a0', 1.5));
    }

    // Alert all seekers to investigate player's sound location!
    if (this.ai && seekers) {
      this.ai.alertSeekersToNoise(player.x, player.y, seekers);
    }
    return true;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ItemManager;
} else {
  window.ItemManager = ItemManager;
}
