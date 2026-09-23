/* ==========================================================================
   Thanu's WorkSpace - Interactive Multi-Slide Whiteboard
   Module: "Wish to Know" (Develop your knowledge)
   Live collaboration (Zoom-like), tools, slide management
   ========================================================================== */

class InteractiveWhiteboard {
  constructor(syncEngine) {
    this.syncEngine = syncEngine;
    this.canvas = document.getElementById('whiteboard-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d', { willReadFrequently: true }) : null;
    this.viewport = document.querySelector('.canvas-viewport');

    // Drawing state
    this.isDrawing = false;
    this.currentTool = 'pen'; // 'pen' or 'eraser'
    this.currentColor = '#6d28d9'; // Default regal purple
    this.currentSize = 4;
    this.currentStroke = null;

    // Multi-slides state
    this.slides = [
      { id: 1, name: 'Slide 1', strokes: [], redoStack: [] }
    ];
    this.activeSlideIndex = 0;

    // Remote peer cursor container
    this.remoteCursorEl = null;

    this.initCanvasSize();
    this.initEventListeners();
    this.initSyncHandlers();
    this.renderSlideChips();
    this.redrawActiveSlide();
  }

  initCanvasSize() {
    if (!this.canvas || !this.viewport) return;
    const rect = this.viewport.getBoundingClientRect();
    
    // Set actual canvas resolution (support Retina/high-DPI)
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.scale(dpr, dpr);
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }

  handleResize() {
    if (!this.canvas || !this.viewport) return;
    const rect = this.viewport.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.scale(dpr, dpr);
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.redrawActiveSlide();
  }

  initEventListeners() {
    if (!this.canvas) return;

    // Drawing events (Mouse & Touch via PointerEvents)
    this.canvas.addEventListener('pointerdown', (e) => this.startDrawing(e));
    this.canvas.addEventListener('pointermove', (e) => this.draw(e));
    this.canvas.addEventListener('pointerup', () => this.stopDrawing());
    this.canvas.addEventListener('pointerleave', () => this.stopDrawing());
    this.canvas.addEventListener('pointercancel', () => this.stopDrawing());

    // Tools Buttons
    const penBtn = document.getElementById('tool-pen-btn');
    const eraserBtn = document.getElementById('tool-eraser-btn');
    const clearBtn = document.getElementById('tool-clear-btn');
    const undoBtn = document.getElementById('tool-undo-btn');
    const redoBtn = document.getElementById('tool-redo-btn');
    const saveSlideBtn = document.getElementById('btn-save-slide');
    const sizeRange = document.getElementById('stroke-size-range');
    const colorPickerInput = document.getElementById('custom-color-picker');

    if (penBtn) {
      penBtn.addEventListener('click', () => {
        this.setTool('pen');
        penBtn.classList.add('active');
        if (eraserBtn) eraserBtn.classList.remove('active');
      });
    }

    if (eraserBtn) {
      eraserBtn.addEventListener('click', () => {
        this.setTool('eraser');
        eraserBtn.classList.add('active');
        if (penBtn) penBtn.classList.remove('active');
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearCurrentSlide());
    }

    if (undoBtn) {
      undoBtn.addEventListener('click', () => this.undo());
    }

    if (redoBtn) {
      redoBtn.addEventListener('click', () => this.redo());
    }

    if (saveSlideBtn) {
      saveSlideBtn.addEventListener('click', () => this.saveToSavedModules());
    }

    if (sizeRange) {
      sizeRange.addEventListener('input', (e) => {
        this.currentSize = parseInt(e.target.value, 10);
      });
    }

    if (colorPickerInput) {
      colorPickerInput.addEventListener('input', (e) => {
        this.setColor(e.target.value);
        this.setTool('pen');
        if (penBtn) penBtn.classList.add('active');
        if (eraserBtn) eraserBtn.classList.remove('active');
      });
    }

    // Palette swatches
    const swatches = document.querySelectorAll('.color-swatch');
    swatches.forEach(swatch => {
      swatch.addEventListener('click', () => {
        swatches.forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        const color = swatch.dataset.color;
        this.setColor(color);
        this.setTool('pen');
        if (penBtn) penBtn.classList.add('active');
        if (eraserBtn) eraserBtn.classList.remove('active');
      });
    });

    // Multi-slides buttons
    const addSlideBtn = document.getElementById('btn-add-slide');
    if (addSlideBtn) {
      addSlideBtn.addEventListener('click', () => this.addNewSlide());
    }

    const prevSlideBtn = document.getElementById('btn-prev-slide');
    if (prevSlideBtn) {
      prevSlideBtn.addEventListener('click', () => this.prevSlide());
    }

    const nextSlideBtn = document.getElementById('btn-next-slide');
    if (nextSlideBtn) {
      nextSlideBtn.addEventListener('click', () => this.nextSlide());
    }
  }

  initSyncHandlers() {
    if (!this.syncEngine) return;

    // Incoming remote stroke from other participant/tab
    this.syncEngine.onRemoteStroke = (strokeData) => {
      this.handleRemoteStroke(strokeData);
    };

    // Remote clear board
    this.syncEngine.onRemoteClear = (data) => {
      const slide = this.slides[this.activeSlideIndex];
      if (slide) {
        slide.strokes = [];
        slide.redoStack = [];
        this.redrawActiveSlide();
      }
    };

    // Remote slide change
    this.syncEngine.onRemoteSlideChange = (data) => {
      if (data && data.slideIndex !== undefined && this.slides[data.slideIndex]) {
        this.activeSlideIndex = data.slideIndex;
        this.renderSlideChips();
        this.redrawActiveSlide();
      }
    };

    // Remote peer cursor
    this.syncEngine.onRemoteCursor = (pos) => {
      const nx = pos.nx !== undefined ? pos.nx : pos.x;
      const ny = pos.ny !== undefined ? pos.ny : pos.y;
      this.renderRemoteCursor(nx, ny);
    };

    // Sync peer indicator
    this.syncEngine.onPeerCountChange = (count) => {
      const peerCountEl = document.getElementById('wb-peer-count');
      if (peerCountEl) {
        const partnerName = this.syncEngine.partnerName || 'Partner';
        peerCountEl.textContent = count > 1 ? `Live with ${partnerName}` : 'Live Sync Ready';
      }
    };

    // Catch-up State Synchronization
    if (this.syncEngine.on) {
      this.syncEngine.on('WB_REQ_STATE', () => {
        const hasStrokes = this.slides.some(s => s.strokes && s.strokes.length > 0);
        if (hasStrokes) {
          this.syncEngine.sendWhiteboardState(this.slides, this.activeSlideIndex);
        }
      });

      this.syncEngine.on('WB_RES_STATE', (payload) => {
        if (payload && payload.slides && payload.slides.length > 0) {
          this.slides = payload.slides;
          this.activeSlideIndex = Math.min(payload.activeSlideIndex || 0, this.slides.length - 1);
          this.renderSlideChips();
          this.redrawActiveSlide();
          if (window.app) window.app.showToast('Synced whiteboard with partner! 🎨💜');
        }
      });
    }

    // When connection is established, request board state from partner
    setTimeout(() => {
      if (this.syncEngine && this.syncEngine.requestWhiteboardState) {
        this.syncEngine.requestWhiteboardState();
      }
    }, 1500);
  }

  setTool(tool) {
    this.currentTool = tool;
  }

  setColor(color) {
    this.currentColor = color;
  }

  getPointerPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const w = this.width || rect.width || 1;
    const h = this.height || rect.height || 1;
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      // Normalized coordinates (0.0 - 1.0) for resolution-independent sync
      nx: (e.clientX - rect.left) / w,
      ny: (e.clientY - rect.top) / h
    };
  }

  startDrawing(e) {
    if (!this.width || this.width === 0) {
      this.handleResize();
    }
    this.isDrawing = true;
    const pos = this.getPointerPos(e);

    this.currentStroke = {
      tool: this.currentTool,
      color: this.currentColor,
      size: this.currentSize,
      points: [pos]
    };

    // Setup canvas styles for this stroke
    this.applyToolStyles(this.currentTool, this.currentColor, this.currentSize);
    this.ctx.beginPath();
    this.ctx.moveTo(pos.x, pos.y);

    // Broadcast cursor position
    if (this.syncEngine) {
      this.syncEngine.sendCursor(pos.nx, pos.ny);
    }
  }

  draw(e) {
    if (!this.isDrawing || !this.currentStroke) {
      // Send cursor update even when hovering
      const pos = this.getPointerPos(e);
      if (this.syncEngine) {
        this.syncEngine.sendCursor(pos.nx, pos.ny);
      }
      return;
    }

    const pos = this.getPointerPos(e);
    this.currentStroke.points.push(pos);

    // Draw line to current position
    this.ctx.lineTo(pos.x, pos.y);
    this.ctx.stroke();

    // Stream stroke point to connected peers in real time!
    if (this.syncEngine) {
      this.syncEngine.sendCursor(pos.nx, pos.ny);
    }
  }

  stopDrawing() {
    if (!this.isDrawing) return;
    this.isDrawing = false;

    if (this.currentStroke && this.currentStroke.points.length > 0) {
      const activeSlide = this.slides[this.activeSlideIndex];
      activeSlide.strokes.push(this.currentStroke);
      activeSlide.redoStack = []; // Clear redo stack on new action

      // Broadcast completed stroke to all peers / tabs
      if (this.syncEngine) {
        this.syncEngine.sendStroke({
          slideIndex: this.activeSlideIndex,
          stroke: this.currentStroke
        });
      }
    }
    this.currentStroke = null;
  }

  applyToolStyles(tool, color, size) {
    if (tool === 'eraser') {
      this.ctx.globalCompositeOperation = 'destination-out';
      this.ctx.lineWidth = size * 2.5;
    } else {
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = size;
    }
  }

  redrawActiveSlide() {
    if (!this.ctx) return;

    // Clear canvas
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();

    const dpr = window.devicePixelRatio || 1;
    this.ctx.save();
    this.ctx.scale(dpr, dpr);

    const activeSlide = this.slides[this.activeSlideIndex];
    if (activeSlide && activeSlide.strokes) {
      activeSlide.strokes.forEach(stroke => {
        this.renderStroke(stroke);
      });
    }

    this.ctx.restore();
  }

  renderStroke(stroke) {
    if (!stroke || !stroke.points || stroke.points.length === 0) return;

    this.applyToolStyles(stroke.tool, stroke.color, stroke.size);
    this.ctx.beginPath();

    const firstPt = stroke.points[0];
    const startX = firstPt.nx !== undefined ? firstPt.nx * this.width : firstPt.x;
    const startY = firstPt.ny !== undefined ? firstPt.ny * this.height : firstPt.y;
    this.ctx.moveTo(startX, startY);

    for (let i = 1; i < stroke.points.length; i++) {
      const pt = stroke.points[i];
      const x = pt.nx !== undefined ? pt.nx * this.width : pt.x;
      const y = pt.ny !== undefined ? pt.ny * this.height : pt.y;
      this.ctx.lineTo(x, y);
    }
    this.ctx.stroke();
  }

  /* Remote Collaboration Handlers */
  handleRemoteStroke(data) {
    if (!data || !data.stroke) return;
    const targetSlide = this.slides[data.slideIndex];
    if (targetSlide) {
      targetSlide.strokes.push(data.stroke);
      if (data.slideIndex === this.activeSlideIndex) {
        this.renderStroke(data.stroke);
      }
    }
  }

  renderRemoteCursor(nx, ny) {
    if (!this.viewport) return;

    const partnerName = this.syncEngine?.partnerName || 'Partner 💜';

    if (!this.remoteCursorEl) {
      this.remoteCursorEl = document.createElement('div');
      this.remoteCursorEl.className = 'peer-cursor';
      this.remoteCursorEl.innerHTML = `
        <div class="peer-cursor-pointer"></div>
        <span class="peer-cursor-label">${partnerName}</span>
      `;
      this.viewport.appendChild(this.remoteCursorEl);
    } else {
      const lbl = this.remoteCursorEl.querySelector('.peer-cursor-label');
      if (lbl) lbl.textContent = partnerName;
    }

    const x = nx * this.width;
    const y = ny * this.height;
    this.remoteCursorEl.style.transform = `translate(${x}px, ${y}px)`;
    this.remoteCursorEl.style.display = 'flex';

    clearTimeout(this.cursorHideTimeout);
    this.cursorHideTimeout = setTimeout(() => {
      if (this.remoteCursorEl) {
        this.remoteCursorEl.style.display = 'none';
      }
    }, 3000);
  }

  /* Undo & Redo */
  undo() {
    const slide = this.slides[this.activeSlideIndex];
    if (slide && slide.strokes.length > 0) {
      const popped = slide.strokes.pop();
      slide.redoStack.push(popped);
      this.redrawActiveSlide();
    }
  }

  redo() {
    const slide = this.slides[this.activeSlideIndex];
    if (slide && slide.redoStack && slide.redoStack.length > 0) {
      const restored = slide.redoStack.pop();
      slide.strokes.push(restored);
      this.redrawActiveSlide();
    }
  }

  clearCurrentSlide() {
    if (confirm('Are you sure you want to clear this slide?')) {
      const slide = this.slides[this.activeSlideIndex];
      slide.strokes = [];
      slide.redoStack = [];
      this.redrawActiveSlide();

      if (this.syncEngine) {
        this.syncEngine.sendClear(slide.id);
      }
    }
  }

  /* Slide Management */
  addNewSlide() {
    const newId = this.slides.length + 1;
    const newSlide = {
      id: newId,
      name: `Slide ${newId}`,
      strokes: [],
      redoStack: []
    };
    this.slides.push(newSlide);
    this.activeSlideIndex = this.slides.length - 1;
    this.renderSlideChips();
    this.redrawActiveSlide();

    if (this.syncEngine) {
      this.syncEngine.sendSlideChange(this.activeSlideIndex);
    }
    if (window.app) window.app.showToast(`Created Slide ${newId} 📄`);
  }

  switchSlide(index) {
    if (index >= 0 && index < this.slides.length) {
      this.activeSlideIndex = index;
      this.renderSlideChips();
      this.redrawActiveSlide();

      if (this.syncEngine) {
        this.syncEngine.sendSlideChange(this.activeSlideIndex);
      }
    }
  }

  prevSlide() {
    if (this.activeSlideIndex > 0) {
      this.switchSlide(this.activeSlideIndex - 1);
    }
  }

  nextSlide() {
    if (this.activeSlideIndex < this.slides.length - 1) {
      this.switchSlide(this.activeSlideIndex + 1);
    }
  }

  renderSlideChips() {
    const listEl = document.getElementById('slides-list');
    const indicatorEl = document.getElementById('current-slide-indicator');
    if (!listEl) return;

    listEl.innerHTML = '';
    this.slides.forEach((slide, idx) => {
      const chip = document.createElement('button');
      chip.className = `slide-chip ${idx === this.activeSlideIndex ? 'active' : ''}`;
      chip.innerHTML = `📄 ${slide.name}`;
      chip.addEventListener('click', () => this.switchSlide(idx));
      listEl.appendChild(chip);
    });

    if (indicatorEl) {
      indicatorEl.textContent = `${this.activeSlideIndex + 1} / ${this.slides.length}`;
    }
  }

  /* Save Snapshot to Saved Modules */
  saveToSavedModules() {
    if (!this.canvas) return;
    const currentSlide = this.slides[this.activeSlideIndex];
    const dataUrl = this.canvas.toDataURL('image/png');

    if (window.savedModulesManager) {
      const saved = window.savedModulesManager.saveSlide({
        title: `${currentSlide.name} - Knowledge Note`,
        imageData: dataUrl,
        strokesCount: currentSlide.strokes.length
      });

      if (window.app) {
        window.app.showToast('Slide saved to Saved Modules! 💜');
      }
    }
  }
}

window.InteractiveWhiteboard = InteractiveWhiteboard;
