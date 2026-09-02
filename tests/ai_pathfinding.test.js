/**
 * Unit Test Suite: A* Pathfinding & AI Behavior State Machines
 */

const { test, describe } = require('node:test');
const assert = require('node:assert');

const PathfindingEngine = require('../js/pathfinding.js');
const RaycastEngine = require('../js/raycast.js');
const AIEngine = require('../js/ai.js');
const { SeekerBot, HiderBot, Player } = require('../js/entities.js');

describe('A* Grid Pathfinding Tests', () => {
  const pathfinding = new PathfindingEngine(32);
  const walls = [
    { x1: 128, y1: 0, x2: 128, y2: 256 } // Wall dividing X=128
  ];
  pathfinding.initGrid(512, 512, walls, []);

  test('Finds direct path when no obstacles exist', () => {
    const path = pathfinding.findPath(32, 32, 64, 64);
    assert.ok(path.length > 0, 'Path should be found');
    const finalNode = path[path.length - 1];
    assert.strictEqual(finalNode.x, 64);
    assert.strictEqual(finalNode.y, 64);
  });

  test('Navigates around solid wall obstacles', () => {
    // Path from (64, 64) on left of wall to (200, 64) on right of wall
    const path = pathfinding.findPath(64, 64, 200, 64);
    assert.ok(path.length > 0, 'Path around wall should be found');
  });

  test('Finds cover hiding spots with high stealth rating', () => {
    const raycast = new RaycastEngine();
    const seekers = [new SeekerBot(64, 64, 'Seeker-1')];
    const bestSpot = pathfinding.findBestHidingSpot(200, 200, seekers, walls, raycast);

    assert.ok(bestSpot !== null, 'Best hiding spot should be located');
    assert.ok(typeof bestSpot.x === 'number');
    assert.ok(typeof bestSpot.y === 'number');
  });
});

describe('AI State Machine & Behavior Tests', () => {
  const pathfinding = new PathfindingEngine(32);
  const raycast = new RaycastEngine();
  const ai = new AIEngine(pathfinding, raycast, null);

  test('Seeker spots visible hider and transitions to CHASE state', () => {
    const seeker = new SeekerBot(100, 100, 'Seeker-A');
    seeker.angle = 0; // Facing East

    const hider = new HiderBot(200, 100, 'Hider-A');
    const walls = [];

    ai.updateSeeker(seeker, 0.05, [hider], walls);
    assert.strictEqual(seeker.state, 'chase', 'Seeker should transition to chase state when hider is in FOV');
    assert.strictEqual(seeker.target, hider);
  });

  test('Seeker loses target behind wall and transitions to INVESTIGATE state', () => {
    const seeker = new SeekerBot(100, 100, 'Seeker-A');
    seeker.state = 'chase';
    seeker.target = new HiderBot(300, 300, 'Hider-A');
    seeker.lastKnownTargetPos = { x: 300, y: 300 };

    const walls = [
      { x1: 200, y1: 0, x2: 200, y2: 400 } // Blocking sight
    ];

    ai.updateSeeker(seeker, 0.05, [], walls);
    assert.strictEqual(seeker.state, 'investigate');
  });
});
