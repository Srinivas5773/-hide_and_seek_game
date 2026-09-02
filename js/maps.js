/**
 * ============================================================================
 * SHADOW SEEKERS // MAP CATALOG & PROCEDURAL LABYRINTH GENERATOR
 * Handcrafted architectural layouts, wall segments, hiding cover,
 * props, and procedural maze generator.
 * ============================================================================
 */

const MapCatalog = {
  // 1. HAUNTED VICTORIAN MANSION
  mansion: {
    id: 'mansion',
    name: 'Haunted Victorian Mansion',
    width: 1280,
    height: 960,
    theme: 'gothic',
    ambientDarkness: 0.85,
    walls: [
      // Outer Perimeter
      { x1: 40, y1: 40, x2: 1240, y2: 40 },
      { x1: 1240, y1: 40, x2: 1240, y2: 920 },
      { x1: 1240, y1: 920, x2: 40, y2: 920 },
      { x1: 40, y1: 920, x2: 40, y2: 40 },

      // Grand Foyer Walls & Doorways
      { x1: 440, y1: 40, x2: 440, y2: 340 },
      { x1: 840, y1: 40, x2: 840, y2: 340 },
      { x1: 440, y1: 460, x2: 440, y2: 920 },
      { x1: 840, y1: 460, x2: 840, y2: 920 },

      // Library (West Wing) Bookshelves & Partitions
      { x1: 120, y1: 200, x2: 340, y2: 200 },
      { x1: 120, y1: 380, x2: 340, y2: 380 },
      { x1: 120, y1: 560, x2: 340, y2: 560 },
      { x1: 120, y1: 740, x2: 340, y2: 740 },

      // Dining Hall (East Wing)
      { x1: 940, y1: 240, x2: 1160, y2: 240 },
      { x1: 940, y1: 480, x2: 1160, y2: 480 },
      { x1: 940, y1: 720, x2: 1160, y2: 720 },

      // Central Statues & Pillars
      { x1: 600, y1: 300, x2: 680, y2: 300 },
      { x1: 680, y1: 300, x2: 680, y2: 380 },
      { x1: 680, y1: 380, x2: 600, y2: 380 },
      { x1: 600, y1: 380, x2: 600, y2: 300 },

      { x1: 600, y1: 580, x2: 680, y2: 580 },
      { x1: 680, y1: 580, x2: 680, y2: 660 },
      { x1: 680, y1: 660, x2: 600, y2: 660 },
      { x1: 600, y1: 660, x2: 600, y2: 580 }
    ],
    bushes: [
      { x: 100, y: 100, radius: 24 },
      { x: 1180, y: 100, radius: 24 },
      { x: 100, y: 860, radius: 24 },
      { x: 1180, y: 860, radius: 24 },
      { x: 500, y: 200, radius: 20 },
      { x: 780, y: 200, radius: 20 },
      { x: 500, y: 760, radius: 20 },
      { x: 780, y: 760, radius: 20 }
    ],
    props: [
      { x: 220, y: 140, type: 'crate', width: 32, height: 32 },
      { x: 220, y: 300, type: 'barrel', width: 28, height: 28 },
      { x: 220, y: 480, type: 'statue', width: 36, height: 36 },
      { x: 1050, y: 140, type: 'couch', width: 44, height: 26 },
      { x: 1050, y: 360, type: 'crate', width: 32, height: 32 },
      { x: 1050, y: 600, type: 'vending_machine', width: 34, height: 34 },
      { x: 640, y: 480, type: 'statue', width: 40, height: 40 }
    ],
    seekerSpawns: [
      { x: 640, y: 120 },
      { x: 640, y: 840 }
    ],
    hiderSpawns: [
      { x: 140, y: 140 },
      { x: 140, y: 820 },
      { x: 1140, y: 140 },
      { x: 1140, y: 820 },
      { x: 280, y: 480 },
      { x: 1000, y: 480 }
    ],
    patrolWaypoints: [
      { x: 640, y: 200 },
      { x: 200, y: 200 },
      { x: 200, y: 750 },
      { x: 640, y: 750 },
      { x: 1050, y: 750 },
      { x: 1050, y: 200 }
    ]
  },

  // 2. NEON CYBERPUNK ALLEYWAYS
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Neon Cyberpunk Alleyways',
    width: 1280,
    height: 960,
    theme: 'cyberpunk',
    ambientDarkness: 0.8,
    walls: [
      { x1: 40, y1: 40, x2: 1240, y2: 40 },
      { x1: 1240, y1: 40, x2: 1240, y2: 920 },
      { x1: 1240, y1: 920, x2: 40, y2: 920 },
      { x1: 40, y1: 920, x2: 40, y2: 40 },

      // Building Blocks
      { x1: 200, y1: 160, x2: 480, y2: 160 },
      { x1: 480, y1: 160, x2: 480, y2: 400 },
      { x1: 480, y1: 400, x2: 200, y2: 400 },
      { x1: 200, y1: 400, x2: 200, y2: 160 },

      { x1: 780, y1: 160, x2: 1060, y2: 160 },
      { x1: 1060, y1: 160, x2: 1060, y2: 400 },
      { x1: 1060, y1: 400, x2: 780, y2: 400 },
      { x1: 780, y1: 400, x2: 780, y2: 160 },

      { x1: 200, y1: 560, x2: 480, y2: 560 },
      { x1: 480, y1: 560, x2: 480, y2: 800 },
      { x1: 480, y1: 800, x2: 200, y2: 800 },
      { x1: 200, y1: 800, x2: 200, y2: 560 },

      { x1: 780, y1: 560, x2: 1060, y2: 560 },
      { x1: 1060, y1: 560, x2: 1060, y2: 800 },
      { x1: 1060, y1: 800, x2: 780, y2: 800 },
      { x1: 780, y1: 800, x2: 780, y2: 560 },

      // Central Cyber Barricade
      { x1: 580, y1: 420, x2: 700, y2: 420 },
      { x1: 580, y1: 540, x2: 700, y2: 540 }
    ],
    bushes: [
      { x: 100, y: 480, radius: 26 },
      { x: 1180, y: 480, radius: 26 },
      { x: 640, y: 100, radius: 22 },
      { x: 640, y: 860, radius: 22 }
    ],
    props: [
      { x: 120, y: 220, type: 'vending_machine', width: 34, height: 34 },
      { x: 640, y: 480, type: 'barrel', width: 30, height: 30 },
      { x: 1150, y: 220, type: 'crate', width: 32, height: 32 },
      { x: 120, y: 720, type: 'barrel', width: 28, height: 28 },
      { x: 1150, y: 720, type: 'vending_machine', width: 34, height: 34 }
    ],
    seekerSpawns: [
      { x: 640, y: 280 }
    ],
    hiderSpawns: [
      { x: 100, y: 100 },
      { x: 1180, y: 100 },
      { x: 100, y: 860 },
      { x: 1180, y: 860 }
    ],
    patrolWaypoints: [
      { x: 640, y: 100 },
      { x: 1180, y: 480 },
      { x: 640, y: 860 },
      { x: 100, y: 480 }
    ]
  },

  // 3. OVERGROWN FOREST SANCTUARY
  sanctuary: {
    id: 'sanctuary',
    name: 'Overgrown Forest Sanctuary',
    width: 1280,
    height: 960,
    theme: 'nature',
    ambientDarkness: 0.75,
    walls: [
      { x1: 40, y1: 40, x2: 1240, y2: 40 },
      { x1: 1240, y1: 40, x2: 1240, y2: 920 },
      { x1: 1240, y1: 920, x2: 40, y2: 920 },
      { x1: 40, y1: 920, x2: 40, y2: 40 },

      // Ancient Ruin Pillars & Broken Columns
      { x1: 300, y1: 200, x2: 420, y2: 200 },
      { x1: 300, y1: 200, x2: 300, y2: 320 },
      { x1: 860, y1: 200, x2: 980, y2: 200 },
      { x1: 980, y1: 200, x2: 980, y2: 320 },

      { x1: 300, y1: 760, x2: 420, y2: 760 },
      { x1: 300, y1: 640, x2: 300, y2: 760 },
      { x1: 860, y1: 760, x2: 980, y2: 760 },
      { x1: 980, y1: 640, x2: 980, y2: 760 },

      // Central Altar Enclosure
      { x1: 520, y1: 400, x2: 760, y2: 400 },
      { x1: 520, y1: 560, x2: 760, y2: 560 }
    ],
    bushes: [
      { x: 160, y: 160, radius: 35 },
      { x: 260, y: 180, radius: 30 },
      { x: 1120, y: 160, radius: 35 },
      { x: 160, y: 800, radius: 35 },
      { x: 1120, y: 800, radius: 35 },
      { x: 640, y: 220, radius: 32 },
      { x: 640, y: 740, radius: 32 },
      { x: 380, y: 480, radius: 28 },
      { x: 900, y: 480, radius: 28 }
    ],
    props: [
      { x: 640, y: 480, type: 'statue', width: 44, height: 44 },
      { x: 240, y: 340, type: 'barrel', width: 28, height: 28 },
      { x: 1040, y: 340, type: 'barrel', width: 28, height: 28 },
      { x: 240, y: 620, type: 'crate', width: 32, height: 32 },
      { x: 1040, y: 620, type: 'crate', width: 32, height: 32 }
    ],
    seekerSpawns: [{ x: 640, y: 100 }],
    hiderSpawns: [
      { x: 120, y: 840 },
      { x: 1160, y: 840 },
      { x: 120, y: 120 },
      { x: 1160, y: 120 }
    ],
    patrolWaypoints: [
      { x: 640, y: 200 },
      { x: 1050, y: 480 },
      { x: 640, y: 760 },
      { x: 230, y: 480 }
    ]
  },

  // 4. ORBITAL STATION OMEGA
  spacestation: {
    id: 'spacestation',
    name: 'Orbital Station Omega',
    width: 1280,
    height: 960,
    theme: 'scifi',
    ambientDarkness: 0.88,
    walls: [
      { x1: 40, y1: 40, x2: 1240, y2: 40 },
      { x1: 1240, y1: 40, x2: 1240, y2: 920 },
      { x1: 1240, y1: 920, x2: 40, y2: 920 },
      { x1: 40, y1: 920, x2: 40, y2: 40 },

      // Circular Reactor Core Partitions
      { x1: 540, y1: 380, x2: 740, y2: 380 },
      { x1: 740, y1: 380, x2: 740, y2: 580 },
      { x1: 740, y1: 580, x2: 540, y2: 580 },
      { x1: 540, y1: 580, x2: 540, y2: 380 },

      // Air Lock & Server Corridors
      { x1: 240, y1: 40, x2: 240, y2: 360 },
      { x1: 240, y1: 600, x2: 240, y2: 920 },
      { x1: 1040, y1: 40, x2: 1040, y2: 360 },
      { x1: 1040, y1: 600, x2: 1040, y2: 920 },

      { x1: 360, y1: 260, x2: 500, y2: 260 },
      { x1: 780, y1: 260, x2: 920, y2: 260 },
      { x1: 360, y1: 700, x2: 500, y2: 700 },
      { x1: 780, y1: 700, x2: 920, y2: 700 }
    ],
    bushes: [
      { x: 120, y: 480, radius: 24 },
      { x: 1160, y: 480, radius: 24 }
    ],
    props: [
      { x: 640, y: 480, type: 'vending_machine', width: 36, height: 36 },
      { x: 120, y: 140, type: 'crate', width: 32, height: 32 },
      { x: 1160, y: 140, type: 'crate', width: 32, height: 32 },
      { x: 120, y: 820, type: 'barrel', width: 30, height: 30 },
      { x: 1160, y: 820, type: 'barrel', width: 30, height: 30 }
    ],
    seekerSpawns: [{ x: 640, y: 140 }],
    hiderSpawns: [
      { x: 120, y: 200 },
      { x: 1160, y: 200 },
      { x: 120, y: 760 },
      { x: 1160, y: 760 }
    ],
    patrolWaypoints: [
      { x: 640, y: 200 },
      { x: 920, y: 480 },
      { x: 640, y: 760 },
      { x: 360, y: 480 }
    ]
  },

  // 5. SUBURBIA PLAYGROUND & HOUSES
  suburbia: {
    id: 'suburbia',
    name: 'Suburbia Playground',
    width: 1280,
    height: 960,
    theme: 'suburban',
    ambientDarkness: 0.7,
    walls: [
      { x1: 40, y1: 40, x2: 1240, y2: 40 },
      { x1: 1240, y1: 40, x2: 1240, y2: 920 },
      { x1: 1240, y1: 920, x2: 40, y2: 920 },
      { x1: 40, y1: 920, x2: 40, y2: 40 },

      // House 1 (North West)
      { x1: 160, y1: 120, x2: 440, y2: 120 },
      { x1: 440, y1: 120, x2: 440, y2: 340 },
      { x1: 440, y1: 340, x2: 160, y2: 340 },
      { x1: 160, y1: 340, x2: 160, y2: 120 },

      // House 2 (North East)
      { x1: 840, y1: 120, x2: 1120, y2: 120 },
      { x1: 1120, y1: 120, x2: 1120, y2: 340 },
      { x1: 1120, y1: 340, x2: 840, y2: 340 },
      { x1: 840, y1: 340, x2: 840, y2: 120 },

      // Playground Center Sandbox fence
      { x1: 520, y1: 460, x2: 760, y2: 460 },
      { x1: 520, y1: 600, x2: 760, y2: 600 }
    ],
    bushes: [
      { x: 100, y: 480, radius: 28 },
      { x: 1180, y: 480, radius: 28 },
      { x: 640, y: 180, radius: 28 },
      { x: 640, y: 840, radius: 28 },
      { x: 300, y: 640, radius: 32 },
      { x: 980, y: 640, radius: 32 }
    ],
    props: [
      { x: 640, y: 530, type: 'statue', width: 36, height: 36 },
      { x: 500, y: 220, type: 'barrel', width: 28, height: 28 },
      { x: 780, y: 220, type: 'couch', width: 40, height: 24 },
      { x: 300, y: 800, type: 'crate', width: 32, height: 32 },
      { x: 980, y: 800, type: 'vending_machine', width: 34, height: 34 }
    ],
    seekerSpawns: [{ x: 640, y: 320 }],
    hiderSpawns: [
      { x: 100, y: 840 },
      { x: 1180, y: 840 },
      { x: 280, y: 220 },
      { x: 1000, y: 220 }
    ],
    patrolWaypoints: [
      { x: 640, y: 160 },
      { x: 1100, y: 480 },
      { x: 640, y: 800 },
      { x: 180, y: 480 }
    ]
  },

  // 6. MEGA SHOPPING MALL
  mall: {
    id: 'mall',
    name: 'Mega Shopping Mall',
    width: 1280,
    height: 960,
    theme: 'commercial',
    ambientDarkness: 0.78,
    walls: [
      { x1: 40, y1: 40, x2: 1240, y2: 40 },
      { x1: 1240, y1: 40, x2: 1240, y2: 920 },
      { x1: 1240, y1: 920, x2: 40, y2: 920 },
      { x1: 40, y1: 920, x2: 40, y2: 40 },

      // Department Store Aisle Racks
      { x1: 160, y1: 180, x2: 400, y2: 180 },
      { x1: 160, y1: 340, x2: 400, y2: 340 },
      { x1: 160, y1: 500, x2: 400, y2: 500 },
      { x1: 160, y1: 660, x2: 400, y2: 660 },

      { x1: 880, y1: 180, x2: 1120, y2: 180 },
      { x1: 880, y1: 340, x2: 1120, y2: 340 },
      { x1: 880, y1: 500, x2: 1120, y2: 500 },
      { x1: 880, y1: 660, x2: 1120, y2: 660 },

      // Central Information Kiosk
      { x1: 580, y1: 420, x2: 700, y2: 420 },
      { x1: 700, y1: 420, x2: 700, y2: 540 },
      { x1: 700, y1: 540, x2: 580, y2: 540 },
      { x1: 580, y1: 540, x2: 580, y2: 420 }
    ],
    bushes: [
      { x: 500, y: 260, radius: 22 },
      { x: 780, y: 260, radius: 22 },
      { x: 500, y: 700, radius: 22 },
      { x: 780, y: 700, radius: 22 }
    ],
    props: [
      { x: 500, y: 480, type: 'vending_machine', width: 36, height: 36 },
      { x: 780, y: 480, type: 'couch', width: 44, height: 26 },
      { x: 280, y: 260, type: 'crate', width: 32, height: 32 },
      { x: 1000, y: 260, type: 'crate', width: 32, height: 32 },
      { x: 280, y: 580, type: 'barrel', width: 28, height: 28 },
      { x: 1000, y: 580, type: 'statue', width: 36, height: 36 }
    ],
    seekerSpawns: [{ x: 640, y: 160 }],
    hiderSpawns: [
      { x: 100, y: 100 },
      { x: 1180, y: 100 },
      { x: 100, y: 860 },
      { x: 1180, y: 860 }
    ],
    patrolWaypoints: [
      { x: 640, y: 260 },
      { x: 1050, y: 480 },
      { x: 640, y: 700 },
      { x: 230, y: 480 }
    ]
  },

  // 7. PROCEDURAL LABYRINTH GENERATOR
  generateProceduralMaze(seed = Date.now(), width = 1280, height = 960) {
    const walls = [
      { x1: 40, y1: 40, x2: width - 40, y2: 40 },
      { x1: width - 40, y1: 40, x2: width - 40, y2: height - 40 },
      { x1: width - 40, y1: height - 40, x2: 40, y2: height - 40 },
      { x1: 40, y1: height - 40, x2: 40, y2: 40 }
    ];

    const bushes = [];
    const props = [];

    // Simple deterministic pseudo-random generator from seed
    let s = seed % 2147483647;
    const random = () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };

    const cols = 5;
    const rows = 4;
    const cellW = (width - 160) / cols;
    const cellH = (height - 160) / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = 80 + c * cellW;
        const y = 80 + r * cellH;

        if (random() > 0.35) {
          // Horizontal partition with door gap
          walls.push({ x1: x, y1: y + cellH, x2: x + cellW * 0.7, y2: y + cellH });
        }
        if (random() > 0.35) {
          // Vertical partition with door gap
          walls.push({ x1: x + cellW, y1: y, x2: x + cellW, y2: y + cellH * 0.7 });
        }

        if (random() > 0.6) {
          bushes.push({ x: x + cellW / 2, y: y + cellH / 2, radius: 22 });
        } else if (random() > 0.6) {
          const propTypes = ['crate', 'barrel', 'statue', 'vending_machine', 'couch'];
          const type = propTypes[Math.floor(random() * propTypes.length)];
          props.push({ x: x + cellW / 2, y: y + cellH / 2, type: type, width: 32, height: 32 });
        }
      }
    }

    return {
      id: 'procedural',
      name: `Procedural Labyrinth (Seed: ${seed})`,
      width: width,
      height: height,
      theme: 'labyrinth',
      ambientDarkness: 0.85,
      walls: walls,
      bushes: bushes,
      props: props,
      seekerSpawns: [{ x: width / 2, y: 120 }],
      hiderSpawns: [
        { x: 120, y: 120 },
        { x: width - 120, y: 120 },
        { x: 120, y: height - 120 },
        { x: width - 120, y: height - 120 }
      ],
      patrolWaypoints: [
        { x: 200, y: 200 },
        { x: width - 200, y: 200 },
        { x: width - 200, y: height - 200 },
        { x: 200, y: height - 200 }
      ]
    };
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MapCatalog;
} else {
  window.MapCatalog = MapCatalog;
}
