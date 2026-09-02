/**
 * ============================================================================
 * SHADOW SEEKERS // BLUEPRINT LEVEL EDITOR
 * Interactive grid designer, wall segment builder, cover/prop placer,
 * and JSON map export/import engine.
 * ============================================================================
 */

class LevelEditor {
  constructor(gameInstance) {
    this.game = gameInstance;
    this.canvas = document.getElementById('editorCanvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.gridSize = 20; // 32x24 grid = 640x480 canvas
    this.activeTool = 'wall';

    this.mapData = {
      id: 'custom_blueprint',
      name: 'User Custom Blueprint',
      width: 1280,
      height: 960,
      theme: 'custom',
      ambientDarkness: 0.8,
      walls: [
        { x1: 40, y1: 40, x2: 1240, y2: 40 },
        { x1: 1240, y1: 40, x2: 1240, y2: 920 },
        { x1: 1240, y1: 920, x2: 40, y2: 920 },
        { x1: 40, y1: 920, x2: 40, y2: 40 }
      ],
      bushes: [],
      props: [],
      seekerSpawns: [{ x: 640, y: 160 }],
      hiderSpawns: [{ x: 200, y: 800 }, { x: 1080, y: 800 }],
      patrolWaypoints: [{ x: 640, y: 200 }, { x: 1000, y: 700 }, { x: 280, y: 700 }]
    };

    this.isDrawing = false;
    this.lineStart = null;
    this.initEditorEvents();
  }

  initEditorEvents() {
    if (!this.canvas) return;

    // Tool Buttons
    const toolButtons = document.querySelectorAll('.tool-btn[data-tool]');
    toolButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        toolButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeTool = btn.getAttribute('data-tool');
      });
    });

    const btnClear = document.getElementById('btn-editor-clear');
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        if (confirm('Clear all custom walls, props and spawns?')) {
          this.mapData.walls = [
            { x1: 40, y1: 40, x2: 1240, y2: 40 },
            { x1: 1240, y1: 40, x2: 1240, y2: 920 },
            { x1: 1240, y1: 920, x2: 40, y2: 920 },
            { x1: 40, y1: 920, x2: 40, y2: 40 }
          ];
          this.mapData.bushes = [];
          this.mapData.props = [];
          this.render();
        }
      });
    }

    const btnExport = document.getElementById('btn-editor-export');
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        const json = JSON.stringify(this.mapData, null, 2);
        navigator.clipboard.writeText(json).then(() => {
          alert('Custom Blueprint JSON copied to clipboard!');
        }).catch(() => {
          prompt('Copy Blueprint JSON:', json);
        });
      });
    }

    const btnImport = document.getElementById('btn-editor-import');
    if (btnImport) {
      btnImport.addEventListener('click', () => {
        const json = prompt('Paste Blueprint JSON:');
        if (json) {
          try {
            const parsed = JSON.parse(json);
            if (parsed.walls) {
              this.mapData = parsed;
              this.render();
              alert('Blueprint successfully loaded!');
            }
          } catch (e) {
            alert('Invalid Blueprint JSON format.');
          }
        }
      });
    }

    const btnPlay = document.getElementById('btn-editor-play');
    if (btnPlay) {
      btnPlay.addEventListener('click', () => {
        const modal = document.getElementById('modal-editor');
        if (modal) modal.classList.remove('open');
        if (this.game) {
          this.game.loadCustomMap(this.mapData);
          this.game.startRound();
        }
      });
    }

    // Canvas Mouse Interaction
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('mouseup', () => this.onMouseUp());
  }

  getCanvasPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    // Snap to grid
    const snapX = Math.round(rawX / this.gridSize) * this.gridSize;
    const snapY = Math.round(rawY / this.gridSize) * this.gridSize;
    return {
      canvasX: snapX,
      canvasY: snapY,
      worldX: snapX * 2, // 640x480 -> 1280x960
      worldY: snapY * 2
    };
  }

  onMouseDown(e) {
    const pos = this.getCanvasPos(e);
    this.isDrawing = true;

    if (this.activeTool === 'wall') {
      this.lineStart = pos;
    } else if (this.activeTool === 'cover') {
      this.mapData.bushes.push({ x: pos.worldX, y: pos.worldY, radius: 24 });
      this.render();
    } else if (this.activeTool === 'prop_crate') {
      this.mapData.props.push({ x: pos.worldX, y: pos.worldY, type: 'crate', width: 32, height: 32 });
      this.render();
    } else if (this.activeTool === 'prop_barrel') {
      this.mapData.props.push({ x: pos.worldX, y: pos.worldY, type: 'barrel', width: 28, height: 28 });
      this.render();
    } else if (this.activeTool === 'spawner_hider') {
      this.mapData.hiderSpawns.push({ x: pos.worldX, y: pos.worldY });
      this.render();
    } else if (this.activeTool === 'spawner_seeker') {
      this.mapData.seekerSpawns = [{ x: pos.worldX, y: pos.worldY }];
      this.render();
    } else if (this.activeTool === 'erase') {
      this.eraseNear(pos.worldX, pos.worldY);
      this.render();
    }
  }

  onMouseMove(e) {
    if (!this.isDrawing) return;
    if (this.activeTool === 'erase') {
      const pos = this.getCanvasPos(e);
      this.eraseNear(pos.worldX, pos.worldY);
      this.render();
    }
  }

  onMouseUp() {
    if (this.isDrawing && this.activeTool === 'wall' && this.lineStart) {
      const pos = this.lastMousePos || this.lineStart;
      if (pos.worldX !== this.lineStart.worldX || pos.worldY !== this.lineStart.worldY) {
        this.mapData.walls.push({
          x1: this.lineStart.worldX,
          y1: this.lineStart.worldY,
          x2: pos.worldX,
          y2: pos.worldY
        });
      }
      this.lineStart = null;
      this.render();
    }
    this.isDrawing = false;
  }

  eraseNear(wx, wy) {
    const eraseRadius = 30;
    this.mapData.walls = this.mapData.walls.filter(w => {
      const midX = (w.x1 + w.x2) / 2;
      const midY = (w.y1 + w.y2) / 2;
      return Math.sqrt((midX - wx) ** 2 + (midY - wy) ** 2) > eraseRadius;
    });
    this.mapData.bushes = this.mapData.bushes.filter(b => Math.sqrt((b.x - wx) ** 2 + (b.y - wy) ** 2) > eraseRadius);
    this.mapData.props = this.mapData.props.filter(p => Math.sqrt((p.x - wx) ** 2 + (p.y - wy) ** 2) > eraseRadius);
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < this.canvas.width; x += this.gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.canvas.height; y += this.gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvas.width, y);
      ctx.stroke();
    }

    // Draw Bushes
    for (let b of this.mapData.bushes) {
      ctx.fillStyle = 'rgba(6, 214, 160, 0.4)';
      ctx.beginPath();
      ctx.arc(b.x / 2, b.y / 2, b.radius / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Props
    for (let p of this.mapData.props) {
      ctx.fillStyle = p.type === 'crate' ? '#b45309' : '#0284c7';
      ctx.fillRect(p.x / 2 - 8, p.y / 2 - 8, 16, 16);
    }

    // Draw Spawners
    for (let h of this.mapData.hiderSpawns) {
      ctx.fillStyle = '#00e5ff';
      ctx.beginPath();
      ctx.arc(h.x / 2, h.y / 2, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let s of this.mapData.seekerSpawns) {
      ctx.fillStyle = '#ff3366';
      ctx.beginPath();
      ctx.arc(s.x / 2, s.y / 2, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Walls
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    for (let w of this.mapData.walls) {
      ctx.beginPath();
      ctx.moveTo(w.x1 / 2, w.y1 / 2);
      ctx.lineTo(w.x2 / 2, w.y2 / 2);
      ctx.stroke();
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LevelEditor;
} else {
  window.LevelEditor = LevelEditor;
}
