/**
 * Unit Test Suite: Core Engine, Physics & 2D Raycasting
 */

const { test, describe } = require('node:test');
const assert = require('node:assert');

const RaycastEngine = require('../js/raycast.js');
const { Entity, Player, Footprint } = require('../js/entities.js');

describe('Raycast & Geometry Engine Tests', () => {
  const raycast = new RaycastEngine();

  test('Intersection test on crossing segments returns valid point', () => {
    const p1 = { x: 0, y: 50 };
    const p2 = { x: 100, y: 50 };
    const p3 = { x: 50, y: 0 };
    const p4 = { x: 50, y: 100 };

    const hit = raycast.getIntersection(p1, p2, p3, p4);
    assert.ok(hit !== null, 'Hit should not be null');
    assert.strictEqual(Math.round(hit.x), 50);
    assert.strictEqual(Math.round(hit.y), 50);
  });

  test('Line of sight detection detects obstructing walls', () => {
    const walls = [
      { x1: 50, y1: 0, x2: 50, y2: 100 }
    ];

    const clearSight = raycast.hasLineOfSight(10, 50, 40, 50, walls);
    assert.strictEqual(clearSight, true, 'Sight should be clear without obstruction');

    const blockedSight = raycast.hasLineOfSight(10, 50, 90, 50, walls);
    assert.strictEqual(blockedSight, false, 'Sight should be blocked by wall');
  });

  test('Vision cone detects targets in front and rejects targets behind', () => {
    const walls = [];
    const observerX = 100;
    const observerY = 100;
    const observerAngle = 0; // Facing right (East)
    const fov = Math.PI / 3; // 60 degrees
    const maxRange = 200;

    // Target in front (East)
    const inFront = raycast.isInVisionCone(200, 100, observerX, observerY, observerAngle, fov, maxRange, walls);
    assert.strictEqual(inFront, true, 'Target directly in front should be in vision cone');

    // Target behind (West)
    const behind = raycast.isInVisionCone(0, 100, observerX, observerY, observerAngle, fov, maxRange, walls);
    assert.strictEqual(behind, false, 'Target behind should NOT be in vision cone');

    // Target out of range
    const outOfRange = raycast.isInVisionCone(400, 100, observerX, observerY, observerAngle, fov, maxRange, walls);
    assert.strictEqual(outOfRange, false, 'Target out of range should NOT be in vision cone');
  });
});

describe('Entity & Movement Physics Tests', () => {
  test('Entity distance and circle collision calculation', () => {
    const e1 = new Entity(100, 100, 16);
    const e2 = new Entity(120, 100, 16);
    const e3 = new Entity(300, 300, 16);

    assert.strictEqual(e1.distanceTo(e2), 20);
    assert.strictEqual(e1.collidesWith(e2), true, 'e1 and e2 should collide (dist 20 < 32)');
    assert.strictEqual(e1.collidesWith(e3), false, 'e1 and e3 should not collide');
  });

  test('Player stamina depletion and sprint handling', () => {
    const player = new Player(100, 100, 'hider');
    const inputSprinting = { x: 1, y: 0, isMoving: true, isSprinting: true };

    player.update(0.1, inputSprinting, []);
    assert.strictEqual(player.isSprinting, true);
    assert.ok(player.stamina < 100, 'Stamina should decrease while sprinting');
    assert.strictEqual(player.speed, player.sprintSpeed);
  });
});
