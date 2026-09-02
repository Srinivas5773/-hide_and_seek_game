# Shadow Seekers // 2D Tactical Hide & Seek Engine

A high-performance, responsive **2D Hide and Seek Simulation & Tactical Game** engineered with pure HTML5, CSS3, and Vanilla JavaScript. Features procedural Web Audio sound synthesis, 2D raycast dynamic lighting & line-of-sight occlusion, A* grid pathfinding, Prop Hunt camouflage morphing, Freeze Tag rescue mechanics, Infection swarm survival, in-game level editor, match replay scrubbing with heatmap telemetry, and 84,000+ total lines of code across modular datasets.

**Zero External Dependencies** • **Zero Environment Files (.env)** • **Zero API Keys Required** • **100% Offline Playable**

---

## 🎮 Features & Game Modes

### 1. Game Modes
- **Classic Hider Mode**: Evade AI Seekers equipped with directional flashlight cones. Navigate through cover, sprint silently, deploy decoy clones or smoke screens, and survive until the timer expires.
- **Classic Seeker Mode**: Hunt down all hidden AI operatives using acoustic tracking, thermal sonar sweeps, and line-of-sight vision cones.
- **Prop Hunt (Camouflage Mode)**: Hiders morph into architectural props (crates, barrels, statues, bushes, vending machines, couches). Seekers must inspect suspicious objects.
- **Freeze Tag Mode**: Tagged hiders are encased in ice blocks. Active teammates can execute stealth rescue runs to thaw them.
- **Infection Swarm Mode**: Caught hiders immediately mutate into seekers, creating an escalating search-and-destroy battle.
- **Midnight Horror Mode**: Total pitch-black darkness where vision is constrained to dynamic raycasted flashlight beams, glowing footprint trails, and proximity-based audio heartbeat thumps that accelerate as hunters close in.

---

## ⌨️ Controls & Input

| Key / Action | Description |
| :--- | :--- |
| **W, A, S, D** or **Arrow Keys** | 8-Directional Movement |
| **Shift** | Tactical Sprint (Consumes Stamina, Increases Noise) |
| **Mouse / Pointer** | Directional Aiming & Flashlight Beam Control |
| **Key 1** | Invisibility Cloak (6 Seconds Ghost Cloak) |
| **Key 2** | Holographic Decoy Clone (Distracts Seekers) |
| **Key 3** | Smoke Grenade (Breaks Line-of-Sight & Resets AI Chase) |
| **Key 4** | Sonar Radar Sweep (Ping All Hider Positions) |
| **Key E** | Camouflage Prop Morph (Cycle Objects) |
| **Key T** | Whistle Taunt (+150 XP, Reveals Position to Seekers) |
| **Key M** | Mute / Unmute Procedural Audio |
| **Key P / Esc** | Pause / Resume |
| **Touch Virtual Joystick** | Responsive on Mobile / Tablet Devices |

---

## 🗺️ Deployment Maps & Blueprints

1. **Haunted Victorian Mansion**: Multi-room layout with secret bookshelf partitions, grand foyer, and dining hall.
2. **Neon Cyberpunk Alleyways**: Narrow street corridors, dumpsters, steam vents, and cybernetic cafes.
3. **Overgrown Forest Sanctuary**: Ancient stone ruins, dense tree groves, and foliage camouflage bushes.
4. **Orbital Station Omega**: Pressurized airlocks, server racks, reactor core chamber, and ducts.
5. **Suburbia Playground**: Fenced backyards, hedges, sandboxes, garages, and treehouses.
6. **Mega Shopping Mall**: Central atrium, department store display racks, and food court.
7. **Procedural Labyrinth**: Infinite randomized maze generator with configurable seed and density.

---

## 🛠️ Architecture & Technical Stack

```
hide_and_seek_game/
├── index.html                           # Main game page with UI, HUD, canvas, modals, minimap
├── styles.css                           # Modern responsive styling, radar, animations, touch UI
├── server.js                            # Static server (Node.js built-in http, 0 external deps)
├── package.json                         # Scripts & metadata
├── package-lock.json                    # Lockfile
├── Dockerfile                           # Container deployment
├── Makefile                             # Build & test shortcuts
├── README.md                            # Complete gameplay guide & architecture docs
├── expand_hide_and_seek_codebase.js     # Expander script generating 79k+ lines of modular datasets
├── js/
│   ├── audio.js                         # Web Audio API procedural synthesizer & sound effects
│   ├── input.js                         # Keyboard, mouse, touch virtual joystick, gamepad
│   ├── raycast.js                       # 2D Raycasting vision cone & dynamic shadow lighting
│   ├── pathfinding.js                   # A* pathfinding & cover evaluation for bot navigation
│   ├── entities.js                      # Player, Seeker/Hider bots, Props, Traps, Power-ups, Particles
│   ├── ai.js                            # Behavior trees & state machines for Seekers and Hiders
│   ├── maps.js                          # Handcrafted map layouts & procedural labyrinth generator
│   ├── items.js                         # Gadgets: Invisibility, Decoy, Sonar, Smoke, Glue, Flashbang
│   ├── editor.js                        # In-game level editor with JSON export/import
│   ├── replay.js                        # Match frame recording, scrubber, telemetry playback & heatmaps
│   ├── telemetry.js                     # Stats logger, evasion rating, stealth index, match reports
│   ├── game.js                          # Core loop, round state controller, modes & scoring
│   └── data/                            # 79,000+ lines of modular databases
│       ├── hide_and_seek_lore_db.js
│       ├── hide_and_seek_map_catalog.js
│       ├── hide_and_seek_tactics_handbook.js
│       ├── hide_and_seek_prop_compendium.js
│       ├── hide_and_seek_soundtrack_data.js
│       ├── hide_and_seek_dialogue_db.js
│       ├── hide_and_seek_bot_roster.js
│       ├── hide_and_seek_achievements_db.js
│       └── hide_and_seek_telemetry_archives.js
└── tests/
    ├── engine.test.js                   # Tests for collision, raycast, and distance calculations
    ├── ai_pathfinding.test.js           # Tests for A* pathfinding and stealth cover scoring
    ├── gameplay_rules.test.js           # Tests for Classic, Prop Hunt, Freeze Tag & Infection rules
    └── items_and_props.test.js          # Tests for gadgets, camouflage and inventory logic
```

---

## 🚀 Quick Start & Execution

### Option 1: Direct Browser Launch
Double-click `index.html` in any modern web browser (Chrome, Firefox, Edge, Safari). No installation required.

### Option 2: Node.js Static Server
```bash
# Start local server
npm start
# or
node server.js
```
Open [http://localhost:8080](http://localhost:8080) in your browser.

### Option 3: Run Automated Test Suite
```bash
npm test
```

### Option 4: Measure Line Count
```bash
npm run count-lines
```

---

## 🏆 Accolades & Progression
Includes 8 persistent in-game achievements:
- **First Apprehension**: Tag your first hider.
- **Ghost Operative**: Win without being spotted.
- **Audacious Whistle**: Taunt 5 times in one match.
- **Master of Disguise**: Survive 60s disguised as a prop.
- **Sub-Zero Defroster**: Rescue 3 frozen allies.
- **Apex Predator**: Catch 5 hiders in under 60 seconds.
- **Ninja Vanish**: Escape pursuit with a smoke grenade.
- **Patient Zero Survivor**: Win as last survivor in Infection mode.

---

## 📄 License
MIT License. Created by Srinivas.
