/**
 * ============================================================================
 * SHADOW SEEKERS // A* GRID PATHFINDING & STEALTH EVALUATION ENGINE
 * Real-time navigation for AI Seekers and Hiders, cover score analysis,
 * and Dijkstra distance flow fields.
 * ============================================================================
 */

class PathfindingEngine {
  constructor(tileSize = 32) {
    this.tileSize = tileSize;
    this.gridWidth = 0;
    this.gridHeight = 0;
    this.grid = []; // 0 = walkable, 1 = solid wall, 2 = bush/cover
  }

  initGrid(worldWidth, worldHeight, walls, bushes = []) {
    this.gridWidth = Math.ceil(worldWidth / this.tileSize);
    this.gridHeight = Math.ceil(worldHeight / this.tileSize);
    this.grid = new Array(this.gridHeight);

    for (let y = 0; y < this.gridHeight; y++) {
      this.grid[y] = new Uint8Array(this.gridWidth);
    }

    // Rasterize wall segments into grid
    for (let w of walls) {
      this.rasterizeLine(w.x1, w.y1, w.x2, w.y2, 1);
    }

    // Rasterize bushes/cover
    for (let b of bushes) {
      const gx = Math.floor(b.x / this.tileSize);
      const gy = Math.floor(b.y / this.tileSize);
      if (this.isValidCell(gx, gy) && this.grid[gy][gx] === 0) {
        this.grid[gy][gx] = 2; // Cover tile
      }
    }
  }

  rasterizeLine(x1, y1, x2, y2, val) {
    const gx1 = Math.floor(x1 / this.tileSize);
    const gy1 = Math.floor(y1 / this.tileSize);
    const gx2 = Math.floor(x2 / this.tileSize);
    const gy2 = Math.floor(y2 / this.tileSize);

    const dx = Math.abs(gx2 - gx1);
    const dy = Math.abs(gy2 - gy1);
    const sx = gx1 < gx2 ? 1 : -1;
    const sy = gy1 < gy2 ? 1 : -1;
    let err = dx - dy;

    let cx = gx1;
    let cy = gy1;

    while (true) {
      if (this.isValidCell(cx, cy)) {
        this.grid[cy][cx] = val;
      }
      if (cx === gx2 && cy === gy2) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        cx += sx;
      }
      if (e2 < dx) {
        err += dx;
        cy += sy;
      }
    }
  }

  isValidCell(gx, gy) {
    return gx >= 0 && gx < this.gridWidth && gy >= 0 && gy < this.gridHeight;
  }

  isWalkable(gx, gy) {
    if (!this.isValidCell(gx, gy)) return false;
    return this.grid[gy][gx] !== 1; // 0 and 2 are walkable
  }

  worldToGrid(x, y) {
    return {
      gx: Math.max(0, Math.min(this.gridWidth - 1, Math.floor(x / this.tileSize))),
      gy: Math.max(0, Math.min(this.gridHeight - 1, Math.floor(y / this.tileSize)))
    };
  }

  gridToWorld(gx, gy) {
    return {
      x: gx * this.tileSize + this.tileSize / 2,
      y: gy * this.tileSize + this.tileSize / 2
    };
  }

  // ==========================================================================
  // A* PATHFINDING ALGORITHM
  // ==========================================================================
  findPath(startX, startY, endX, endY) {
    const start = this.worldToGrid(startX, startY);
    const goal = this.worldToGrid(endX, endY);

    if (!this.isWalkable(goal.gx, goal.gy)) {
      // Find nearest walkable cell to goal
      const nearest = this.findNearestWalkable(goal.gx, goal.gy);
      if (nearest) {
        goal.gx = nearest.gx;
        goal.gy = nearest.gy;
      } else {
        return [];
      }
    }

    if (start.gx === goal.gx && start.gy === goal.gy) {
      return [{ x: endX, y: endY }];
    }

    const openSet = [];
    const openSetMap = new Map();
    const closedSet = new Set();
    const cameFrom = new Map();

    const gScore = new Map();
    const fScore = new Map();

    const startKey = `${start.gx},${start.gy}`;
    const goalKey = `${goal.gx},${goal.gy}`;

    gScore.set(startKey, 0);
    const startH = this.heuristic(start.gx, start.gy, goal.gx, goal.gy);
    fScore.set(startKey, startH);

    openSet.push({ gx: start.gx, gy: start.gy, f: startH });
    openSetMap.set(startKey, true);

    const neighbors = [
      { dx: 0, dy: -1, cost: 1 },
      { dx: 0, dy: 1, cost: 1 },
      { dx: -1, dy: 0, cost: 1 },
      { dx: 1, dy: 0, cost: 1 },
      { dx: -1, dy: -1, cost: 1.414 },
      { dx: 1, dy: -1, cost: 1.414 },
      { dx: -1, dy: 1, cost: 1.414 },
      { dx: 1, dy: 1, cost: 1.414 }
    ];

    let steps = 0;
    const maxSteps = 1500; // Prevent freeze on unreachable

    while (openSet.length > 0 && steps++ < maxSteps) {
      // Get lowest fScore node
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift();
      const currentKey = `${current.gx},${current.gy}`;
      openSetMap.delete(currentKey);

      if (current.gx === goal.gx && current.gy === goal.gy) {
        return this.reconstructPath(cameFrom, current, endX, endY);
      }

      closedSet.add(currentKey);

      for (let n of neighbors) {
        const nx = current.gx + n.dx;
        const ny = current.gy + n.dy;
        const neighborKey = `${nx},${ny}`;

        if (!this.isWalkable(nx, ny) || closedSet.has(neighborKey)) {
          continue;
        }

        // Prevent cutting corners through diagonal solid walls
        if (n.dx !== 0 && n.dy !== 0) {
          if (!this.isWalkable(current.gx + n.dx, current.gy) || !this.isWalkable(current.gx, current.gy + n.dy)) {
            continue;
          }
        }

        const currentG = gScore.get(currentKey) || 0;
        const tentativeG = currentG + n.cost;

        const existingG = gScore.has(neighborKey) ? gScore.get(neighborKey) : Infinity;

        if (tentativeG < existingG) {
          cameFrom.set(neighborKey, current);
          gScore.set(neighborKey, tentativeG);
          const h = this.heuristic(nx, ny, goal.gx, goal.gy);
          const f = tentativeG + h;
          fScore.set(neighborKey, f);

          if (!openSetMap.has(neighborKey)) {
            openSet.push({ gx: nx, gy: ny, f: f });
            openSetMap.set(neighborKey, true);
          }
        }
      }
    }

    return []; // No path found
  }

  heuristic(x1, y1, x2, y2) {
    const dx = Math.abs(x1 - x2);
    const dy = Math.abs(y1 - y2);
    return Math.sqrt(dx * dx + dy * dy);
  }

  findNearestWalkable(gx, gy) {
    for (let r = 1; r <= 5; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const nx = gx + dx;
          const ny = gy + dy;
          if (this.isWalkable(nx, ny)) {
            return { gx: nx, gy: ny };
          }
        }
      }
    }
    return null;
  }

  reconstructPath(cameFrom, current, targetWorldX, targetWorldY) {
    const path = [];
    let curr = current;

    while (curr) {
      const worldPos = this.gridToWorld(curr.gx, curr.gy);
      path.unshift(worldPos);
      const key = `${curr.gx},${curr.gy}`;
      curr = cameFrom.get(key);
    }

    // Set precise final destination
    if (path.length > 0) {
      path[path.length - 1] = { x: targetWorldX, y: targetWorldY };
    }

    return path;
  }

  // ==========================================================================
  // STEALTH COVER EVALUATION (Find optimal hiding spots away from seekers)
  // ==========================================================================
  findBestHidingSpot(hiderX, hiderY, seekers, walls, raycastEngine) {
    let bestScore = -Infinity;
    let bestSpot = { x: hiderX, y: hiderY };

    const sampleStep = 3; // Sample grid cells every 3 tiles
    for (let gy = 2; gy < this.gridHeight - 2; gy += sampleStep) {
      for (let gx = 2; gx < this.gridWidth - 2; gx += sampleStep) {
        if (!this.isWalkable(gx, gy)) continue;

        const world = this.gridToWorld(gx, gy);
        let score = 0;

        // Cover tile bonus (bushes / furniture)
        if (this.grid[gy][gx] === 2) {
          score += 150;
        }

        // Evaluate line of sight to all seekers
        let visibleToAnySeeker = false;
        let minSeekerDist = Infinity;

        for (let s of seekers) {
          const dx = world.x - s.x;
          const dy = world.y - s.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minSeekerDist) minSeekerDist = dist;

          if (raycastEngine && raycastEngine.hasLineOfSight(s.x, s.y, world.x, world.y, walls)) {
            visibleToAnySeeker = true;
          }
        }

        if (visibleToAnySeeker) {
          score -= 500; // Heavily penalize visible spots
        } else {
          score += 300; // Large reward for unbroken cover
        }

        // Reward distance from nearest seeker
        score += Math.min(minSeekerDist, 600) * 0.5;

        // Proximity to current hider position (avoid running across entire map if covered)
        const travelDist = Math.sqrt((world.x - hiderX) ** 2 + (world.y - hiderY) ** 2);
        score -= travelDist * 0.2;

        if (score > bestScore) {
          bestScore = score;
          bestSpot = world;
        }
      }
    }

    return bestSpot;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PathfindingEngine;
} else {
  window.PathfindingEngine = PathfindingEngine;
}
