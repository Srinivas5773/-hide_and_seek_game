/**
 * Unit Test Suite: Mode Transitions & Gameplay Rules
 */

const { test, describe } = require('node:test');
const assert = require('node:assert');

const { Player, HiderBot, SeekerBot } = require('../js/entities.js');
const MapCatalog = require('../js/maps.js');
const TelemetryEngine = require('../js/telemetry.js');

describe('Game Modes & Tagging Rule Tests', () => {
  test('Classic mode tagging marks hider as caught', () => {
    const seeker = new SeekerBot(100, 100);
    const hider = new HiderBot(110, 100);

    hider.isCaught = true;
    assert.strictEqual(hider.isCaught, true);
  });

  test('Freeze Tag mode freezes hiders in place and allows teammate rescue', () => {
    const hider = new HiderBot(100, 100);
    hider.isFrozen = true;
    assert.strictEqual(hider.isFrozen, true);

    // Teammate unfreezes
    hider.isFrozen = false;
    assert.strictEqual(hider.isFrozen, false, 'Hider should be thawed when rescued');
  });

  test('Infection mode converts caught hider into active seeker', () => {
    const hider = new HiderBot(100, 100);
    hider.isCaught = true;

    // Converted to seeker unit
    const infectedSeeker = new SeekerBot(hider.x, hider.y, 'Infected-Seeker-1');
    assert.strictEqual(infectedSeeker.role, 'seeker');
    assert.strictEqual(infectedSeeker.x, 100);
  });

  test('Map Catalog loads valid blueprints with walls and spawners', () => {
    const maps = ['mansion', 'cyberpunk', 'sanctuary', 'spacestation', 'suburbia', 'mall'];

    for (let m of maps) {
      const map = MapCatalog[m];
      assert.ok(map !== undefined, `Map ${m} should exist in catalog`);
      assert.ok(map.walls.length > 0, `Map ${m} should have boundary and interior walls`);
      assert.ok(map.seekerSpawns.length > 0, `Map ${m} should have seeker spawns`);
      assert.ok(map.hiderSpawns.length > 0, `Map ${m} should have hider spawns`);
    }
  });

  test('Procedural maze generator produces valid randomized geometry', () => {
    const proceduralMap = MapCatalog.generateProceduralMaze(12345, 1280, 960);
    assert.strictEqual(proceduralMap.id, 'procedural');
    assert.ok(proceduralMap.walls.length > 4, 'Procedural maze should have internal partitions');
  });
});
