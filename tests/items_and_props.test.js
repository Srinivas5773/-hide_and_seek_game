/**
 * Unit Test Suite: Items, Gadgets & Prop Camouflage
 */

const { test, describe } = require('node:test');
const assert = require('node:assert');

const ItemManager = require('../js/items.js');
const { Player, Decoy, Particle, FloatingText } = require('../js/entities.js');

describe('Items & Gadgets Tests', () => {
  const items = new ItemManager(null, null);

  test('Invisibility cloak activates and consumes inventory', () => {
    const player = new Player(100, 100, 'hider');
    player.inventory.invisibility = 2;

    const particles = [];
    const floatingTexts = [];

    const used = items.useInvisibility(player, particles, floatingTexts);
    assert.strictEqual(used, true);
    assert.strictEqual(player.isInvisible, true);
    assert.strictEqual(player.inventory.invisibility, 1);
    assert.ok(items.cooldowns.invisibility > 0, 'Invisibility should enter cooldown');
  });

  test('Holographic decoy spawns and travels in aim direction', () => {
    const player = new Player(100, 100, 'hider');
    player.angle = 0; // East
    player.inventory.decoy = 2;

    const decoys = [];
    const used = items.useDecoy(player, decoys, []);
    assert.strictEqual(used, true);
    assert.strictEqual(decoys.length, 1);

    const d = decoys[0];
    d.update(0.1, []);
    assert.ok(d.x > 100, 'Decoy should move eastward');
  });

  test('Prop morph changes camouflage model', () => {
    const player = new Player(100, 100, 'prop');
    player.propType = 'crate';

    const used = items.usePropMorph(player, []);
    assert.strictEqual(used, true);
    assert.strictEqual(player.isDisguised, true);
    assert.notStrictEqual(player.propType, 'crate', 'Prop type should cycle');
  });

  test('Whistle taunt rewards score and triggers seeker alert', () => {
    const player = new Player(100, 100, 'hider');
    player.score = 0;

    const used = items.useWhistleTaunt(player, [], [], null);
    assert.strictEqual(used, true);
    assert.strictEqual(player.score, 150, 'Score should increase by 150');
    assert.strictEqual(player.taunts, 1);
  });
});
