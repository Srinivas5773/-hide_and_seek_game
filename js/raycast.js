/**
 * ============================================================================
 * SHADOW SEEKERS // 2D RAYCASTING & DYNAMIC SHADOW ENGINE
 * Line-of-sight calculation, dynamic shadow polygons, vision cones,
 * and fog-of-war darkness masking.
 * ============================================================================
 */

class RaycastEngine {
  constructor() {
    this.rayCount = 180; // Default rays for vision cone
  }

  setQuality(quality) {
    if (quality === 'high') this.rayCount = 360;
    else if (quality === 'medium') this.rayCount = 180;
    else if (quality === 'low') this.rayCount = 90;
  }

  // Intersect ray (p1 -> p2) with line segment (p3 -> p4)
  getIntersection(p1, p2, p3, p4) {
    const x1 = p1.x, y1 = p1.y;
    const x2 = p2.x, y2 = p2.y;
    const x3 = p3.x, y3 = p3.y;
    const x4 = p4.x, y4 = p4.y;

    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (denom === 0) return null; // Parallel lines

    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
      return {
        x: x1 + ua * (x2 - x1),
        y: y1 + ua * (y2 - y1),
        dist: ua
      };
    }
    return null;
  }

  // Fast direct raycast check between two points without obstacles
  hasLineOfSight(x1, y1, x2, y2, walls) {
    const p1 = { x: x1, y: y1 };
    const p2 = { x: x2, y: y2 };

    for (let i = 0; i < walls.length; i++) {
      const w = walls[i];
      const p3 = { x: w.x1, y: w.y1 };
      const p4 = { x: w.x2, y: w.y2 };

      const hit = this.getIntersection(p1, p2, p3, p4);
      if (hit && hit.dist > 0.001 && hit.dist < 0.999) {
        return false; // Obstructed by wall
      }
    }
    return true; // Clear line of sight
  }

  // Test if target is within observer's vision cone and unblocked by walls
  isInVisionCone(targetX, targetY, observerX, observerY, observerAngle, fovRadians, maxRange, walls) {
    const dx = targetX - observerX;
    const dy = targetY - observerY;
    const distSq = dx * dx + dy * dy;

    if (distSq > maxRange * maxRange) return false;

    // Angle test
    const angleToTarget = Math.atan2(dy, dx);
    let angleDiff = angleToTarget - observerAngle;

    // Normalize angle to -PI..PI
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

    if (Math.abs(angleDiff) > fovRadians / 2) return false;

    // Obstruction raycast test
    return this.hasLineOfSight(observerX, observerY, targetX, targetY, walls);
  }

  // Compute vision polygon for flashlight or ambient sight
  computeVisionPolygon(originX, originY, baseAngle, fovRadians, maxRange, walls, is360 = false) {
    const points = [];
    const numRays = is360 ? 360 : this.rayCount;
    const startAngle = is360 ? 0 : baseAngle - fovRadians / 2;
    const endAngle = is360 ? Math.PI * 2 : baseAngle + fovRadians / 2;
    const step = (endAngle - startAngle) / numRays;

    for (let i = 0; i <= numRays; i++) {
      const angle = startAngle + i * step;
      const rayEnd = {
        x: originX + Math.cos(angle) * maxRange,
        y: originY + Math.sin(angle) * maxRange
      };

      let closestHit = {
        x: rayEnd.x,
        y: rayEnd.y,
        dist: 1.0
      };

      const origin = { x: originX, y: originY };

      for (let j = 0; j < walls.length; j++) {
        const w = walls[j];
        const p3 = { x: w.x1, y: w.y1 };
        const p4 = { x: w.x2, y: w.y2 };

        const hit = this.getIntersection(origin, rayEnd, p3, p4);
        if (hit && hit.dist < closestHit.dist) {
          closestHit = hit;
        }
      }

      points.push({ x: closestHit.x, y: closestHit.y, angle: angle });
    }

    return points;
  }

  // Render flashlight cone / vision mask onto canvas
  renderVisionCone(ctx, originX, originY, baseAngle, fovRadians, maxRange, walls, color = 'rgba(255, 245, 180, 0.25)') {
    const polygon = this.computeVisionPolygon(originX, originY, baseAngle, fovRadians, maxRange, walls, false);
    if (polygon.length === 0) return;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    for (let i = 0; i < polygon.length; i++) {
      ctx.lineTo(polygon[i].x, polygon[i].y);
    }
    ctx.closePath();

    // Radial gradient for flashlight beam
    const gradient = ctx.createRadialGradient(originX, originY, 10, originX, originY, maxRange);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.7, color);
    gradient.addColorStop(1, 'rgba(255, 245, 180, 0.0)');

    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.restore();
  }

  // Render dynamic darkness / Fog-of-War mask revealing only player vision
  renderDarknessOverlay(ctx, width, height, playerX, playerY, playerAngle, playerFov, playerRange, walls, ambientRadius = 60) {
    ctx.save();

    // Fill entire screen with darkness
    ctx.fillStyle = 'rgba(3, 7, 18, 0.92)';
    ctx.fillRect(0, 0, width, height);

    // Carve out player's vision cone using destination-out composite
    ctx.globalCompositeOperation = 'destination-out';

    // 1. Omnidirectional small ambient ring around player
    const ambientPoly = this.computeVisionPolygon(playerX, playerY, 0, Math.PI * 2, ambientRadius, walls, true);
    if (ambientPoly.length > 0) {
      ctx.beginPath();
      ctx.moveTo(playerX, playerY);
      for (let p of ambientPoly) ctx.lineTo(p.x, p.y);
      ctx.closePath();
      ctx.fill();
    }

    // 2. Focused Flashlight Cone
    const conePoly = this.computeVisionPolygon(playerX, playerY, playerAngle, playerFov, playerRange, walls, false);
    if (conePoly.length > 0) {
      ctx.beginPath();
      ctx.moveTo(playerX, playerY);
      for (let p of conePoly) ctx.lineTo(p.x, p.y);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RaycastEngine;
} else {
  window.RaycastEngine = RaycastEngine;
}
