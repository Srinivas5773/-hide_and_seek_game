/**
 * ============================================================================
 * SHADOW SEEKERS // TELEMETRY & ACHIEVEMENT ENGINE
 * Match analytics, stealth ratings, detection indices, high scores,
 * and persistent local storage achievement system.
 * ============================================================================
 */

class TelemetryEngine {
  constructor() {
    this.currentMatch = {
      startTime: 0,
      duration: 0,
      mode: 'classic_hider',
      mapId: 'mansion',
      role: 'hider',
      distanceTraveled: 0,
      detectionCount: 0,
      tauntCount: 0,
      catchCount: 0,
      rescueCount: 0,
      score: 0,
      survived: false
    };

    this.career = this.loadCareerStats();
    this.achievements = this.loadAchievements();
  }

  loadCareerStats() {
    try {
      const saved = localStorage.getItem('shadow_seekers_career');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      matchesPlayed: 0,
      matchesWon: 0,
      totalCatches: 0,
      totalRescues: 0,
      totalTaunts: 0,
      highestScore: 0,
      totalDistance: 0
    };
  }

  saveCareerStats() {
    try {
      localStorage.setItem('shadow_seekers_career', JSON.stringify(this.career));
    } catch (e) {}
  }

  loadAchievements() {
    const defaultList = [
      { id: 'first_blood', name: 'First Apprehension', desc: 'Tag your very first hider as Seeker.', icon: '🎯', unlocked: false },
      { id: 'ghost_operative', name: 'Ghost Operative', desc: 'Win a full match as Hider without being spotted once.', icon: '👻', unlocked: false },
      { id: 'taunt_master', name: 'Audacious Whistle', desc: 'Use whistle taunt 5 times in a single match.', icon: '📢', unlocked: false },
      { id: 'prop_master', name: 'Master of Disguise', desc: 'Survive 60 seconds disguised as a prop in Prop Hunt.', icon: '📦', unlocked: false },
      { id: 'medic_savior', name: 'Sub-Zero Defroster', desc: 'Rescue 3 frozen allies in Freeze Tag mode.', icon: '🧊', unlocked: false },
      { id: 'apex_hunter', name: 'Apex Predator', desc: 'Catch 5 hiders in under 60 seconds.', icon: '⚡', unlocked: false },
      { id: 'smoke_escape', name: 'Ninja Vanish', desc: 'Escape a chasing seeker using a Smoke Grenade.', icon: '💨', unlocked: false },
      { id: 'infection_survivor', name: 'Patient Zero Survivor', desc: 'Be the last surviving hider in Infection mode.', icon: '☣️', unlocked: false }
    ];

    try {
      const saved = localStorage.getItem('shadow_seekers_achievements');
      if (saved) {
        const parsed = JSON.parse(saved);
        return defaultList.map(item => {
          const found = parsed.find(p => p.id === item.id);
          return found ? { ...item, unlocked: found.unlocked } : item;
        });
      }
    } catch (e) {}

    return defaultList;
  }

  saveAchievements() {
    try {
      localStorage.setItem('shadow_seekers_achievements', JSON.stringify(this.achievements));
    } catch (e) {}
  }

  startMatch(mode, mapId, role) {
    this.currentMatch = {
      startTime: Date.now(),
      duration: 0,
      mode: mode,
      mapId: mapId,
      role: role,
      distanceTraveled: 0,
      detectionCount: 0,
      tauntCount: 0,
      catchCount: 0,
      rescueCount: 0,
      score: 0,
      survived: false
    };
    this.career.matchesPlayed++;
    this.saveCareerStats();
  }

  logDistance(dist) {
    this.currentMatch.distanceTraveled += dist;
    this.career.totalDistance += dist;
  }

  logDetection() {
    this.currentMatch.detectionCount++;
  }

  logTaunt() {
    this.currentMatch.tauntCount++;
    this.career.totalTaunts++;
    if (this.currentMatch.tauntCount >= 5) {
      this.unlockAchievement('taunt_master');
    }
  }

  logCatch() {
    this.currentMatch.catchCount++;
    this.career.totalCatches++;
    this.unlockAchievement('first_blood');
    if (this.currentMatch.catchCount >= 5) {
      this.unlockAchievement('apex_hunter');
    }
  }

  logRescue() {
    this.currentMatch.rescueCount++;
    this.career.totalRescues++;
    if (this.currentMatch.rescueCount >= 3) {
      this.unlockAchievement('medic_savior');
    }
  }

  endMatch(survived, finalScore) {
    this.currentMatch.duration = (Date.now() - this.currentMatch.startTime) / 1000;
    this.currentMatch.survived = survived;
    this.currentMatch.score = finalScore;

    if (survived) {
      this.career.matchesWon++;
      if (this.currentMatch.detectionCount === 0 && this.currentMatch.role === 'hider') {
        this.unlockAchievement('ghost_operative');
      }
      if (this.currentMatch.mode === 'infection') {
        this.unlockAchievement('infection_survivor');
      }
    }

    if (finalScore > this.career.highestScore) {
      this.career.highestScore = finalScore;
    }

    this.saveCareerStats();
    this.saveAchievements();
  }

  unlockAchievement(id) {
    const ach = this.achievements.find(a => a.id === id);
    if (ach && !ach.unlocked) {
      ach.unlocked = true;
      this.saveAchievements();
      this.showAchievementToast(ach);
    }
  }

  showAchievementToast(ach) {
    if (typeof document === 'undefined') return;
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      background: rgba(16, 24, 38, 0.95);
      border: 1px solid #ffb703;
      border-radius: 12px;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 8px 32px rgba(255, 183, 3, 0.4);
      z-index: 200;
      color: #f1f5f9;
      animation: modal-enter 0.3s ease;
    `;
    toast.innerHTML = `
      <span style="font-size: 28px;">${ach.icon}</span>
      <div>
        <div style="font-size: 11px; color: #ffb703; font-weight: 700; text-transform: uppercase;">Achievement Unlocked!</div>
        <div style="font-size: 15px; font-weight: 700;">${ach.name}</div>
        <div style="font-size: 12px; color: #94a3b8;">${ach.desc}</div>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.5s';
      setTimeout(() => toast.remove(), 500);
    }, 4000);
  }

  populateAchievementsUI() {
    const grid = document.getElementById('achievements-grid');
    if (!grid) return;
    grid.innerHTML = '';

    for (let ach of this.achievements) {
      const card = document.createElement('div');
      card.style.cssText = `
        background: ${ach.unlocked ? 'rgba(255, 183, 3, 0.1)' : 'rgba(26, 38, 59, 0.5)'};
        border: 1px solid ${ach.unlocked ? '#ffb703' : 'rgba(64, 93, 138, 0.4)'};
        border-radius: 12px;
        padding: 12px;
        display: flex;
        align-items: center;
        gap: 12px;
        opacity: ${ach.unlocked ? '1' : '0.6'};
      `;
      card.innerHTML = `
        <span style="font-size: 28px;">${ach.icon}</span>
        <div>
          <div style="font-size: 14px; font-weight: 700; color: ${ach.unlocked ? '#ffb703' : '#f1f5f9'};">${ach.name}</div>
          <div style="font-size: 12px; color: #94a3b8;">${ach.desc}</div>
          <div style="font-size: 10px; font-weight: 700; margin-top: 4px; color: ${ach.unlocked ? '#06d6a0' : '#64748b'};">
            ${ach.unlocked ? '✓ UNLOCKED' : '🔒 LOCKED'}
          </div>
        </div>
      `;
      grid.appendChild(card);
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TelemetryEngine;
} else {
  window.TelemetryEngine = TelemetryEngine;
}
