/* ==========================================================================
   Thanu's WorkSpace - Interactive Multi-Slide Whiteboard
   Module: "Wish to Know" (Develop your knowledge)
   Live collaboration (Zoom-like), tools, slide management, 16:9 uniform projection
   Features explicit "Send Art" to push completed artwork with 100% precision
   ========================================================================== */

class InteractiveWhiteboard {
  constructor(syncEngine) {
    this.syncEngine = syncEngine;
    this.canvas = document.getElementById('whiteboard-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d', { willReadFrequently: true, alpha: true }) : null;
    this.viewport = document.getElementById('canvas-viewport') || document.querySelector('.canvas-viewport');
    this.slideWrapper = document.getElementById('whiteboard-slide-wrapper') || this.viewport;

    // Standard Slide Aspect Ratio (16:9 widescreen presentation slide)
    this.ASPECT_RATIO = 16 / 9;

    // Drawing state
    this.isDrawing = false;
    this.activePointerId = null;
    this.currentTool = 'pen'; // 'pen' or 'eraser'
    this.currentColor = '#6d28d9'; // Default regal purple
    this.currentSize = 4;
    this.currentStroke = null;
    this.lastPoint = null;
    this.lastMidPoint = null;

    // Slide dimensions in CSS pixels (strictly 16:9 across all devices)
    this.width = 1280;
    this.height = 720;

    // Multi-slides state
    this.slides = [
      { id: 1, name: 'Slide 1', strokes: [], redoStack: [] }
    ];
    this.activeSlideIndex = 0;

    // Remote peer cursor container
    this.remoteCursorEl = null;
    this.cursorHideTimeout = null;

    this.initCanvasSize();
    this.initEventListeners();
    this.initSyncHandlers();
    this.renderSlideChips();
    this.redrawActiveSlide();
  }

  /* --------------------------------------------------------------------------
     16:9 Slide Canvas Sizing & High-DPI Resolution
     Guarantees identical aspect ratio, geometry, and coordinates on all screens
     -------------------------------------------------------------------------- */
  initCanvasSize() {
    if (!this.canvas || !this.viewport) return;

    if (window.ResizeObserver && this.viewport) {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const cr = entry.contentRect;
          if (cr.width > 50 && cr.height > 50) {
            this.handleResize();
          }
        }
      });
      this.resizeObserver.observe(this.viewport);
    }

    this.handleResize();

    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }

  handleResize() {
    if (!this.canvas || !this.viewport || !this.ctx) return;
    const vpRect = this.viewport.getBoundingClientRect();
    const availW = Math.max(vpRect.width - 28, 200);
    const availH = Math.max(vpRect.height - 28, 150);

    // Compute dimensions that perfectly preserve the 16:9 slide aspect ratio
    let w = availW;
    let h = w / this.ASPECT_RATIO;

    if (h > availH) {
      h = availH;
      w = h * this.ASPECT_RATIO;
    }

    w = Math.floor(w);
    h = Math.floor(h);

    if (w <= 0 || h <= 0) return;

    this.width = w;
    this.height = h;

    // Apply dimensions to slide frame container
    if (this.slideWrapper) {
      this.slideWrapper.style.width = `${w}px`;
      this.slideWrapper.style.height = `${h}px`;
    }

    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;

    // Absolute DPR transform
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.redrawActiveSlide();
  }

  /* --------------------------------------------------------------------------
     Event Listeners
     -------------------------------------------------------------------------- */
  initEventListeners() {
    if (!this.canvas) return;

    // Pointer events with pointer capture for flawless local drawing
    this.canvas.addEventListener('pointerdown', (e) => this.startDrawing(e));
    this.canvas.addEventListener('pointermove', (e) => this.draw(e));
    this.canvas.addEventListener('pointerup', (e) => this.stopDrawing(e));
    this.canvas.addEventListener('pointercancel', (e) => this.stopDrawing(e));

    // Send Art Buttons (Both Header and Floating Toolbar)
    const sendHeaderBtn = document.getElementById('btn-send-art');
    const sendToolBtn = document.getElementById('tool-send-btn');

    if (sendHeaderBtn) {
      sendHeaderBtn.addEventListener('click', () => this.sendArtToPartner());
    }
    if (sendToolBtn) {
      sendToolBtn.addEventListener('click', () => this.sendArtToPartner());
    }

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

  /* --------------------------------------------------------------------------
     Live Collaboration / Sync Handlers
     -------------------------------------------------------------------------- */
  initSyncHandlers() {
    if (!this.syncEngine) return;

    // "Send Art" event received from partner
    this.syncEngine.onRemoteSendArt = (data) => {
      this.handleRemoteSendArt(data);
    };

    // Remote clear board
    this.syncEngine.onRemoteClear = () => {
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

    // Request initial board state
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

  /* --------------------------------------------------------------------------
     Pointer Coordinate Helpers
     Clamped to 16:9 Slide bounds [0.0 - 1.0] for exact cross-device fidelity
     -------------------------------------------------------------------------- */
  getPointerPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const w = this.width || rect.width || 1;
    const h = this.height || rect.height || 1;

    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;

    // Clamp normalized coordinates strictly within the slide
    const nx = Math.max(0, Math.min(1, rawX / w));
    const ny = Math.max(0, Math.min(1, rawY / h));

    return {
      x: nx * w,
      y: ny * h,
      nx: Math.round(nx * 10000) / 10000,
      ny: Math.round(ny * 10000) / 10000
    };
  }

  applyToolStyles(tool, color, size) {
    if (!this.ctx) return;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    if (tool === 'eraser') {
      this.ctx.globalCompositeOperation = 'destination-out';
      this.ctx.lineWidth = (size || 4) * 2.5;
    } else {
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.strokeStyle = color || '#6d28d9';
      this.ctx.lineWidth = size || 4;
    }
  }

  /* --------------------------------------------------------------------------
     High-Precision, Butter-Smooth Local Drawing Engine
     -------------------------------------------------------------------------- */
  startDrawing(e) {
    if (!this.canvas || !this.ctx) return;

    if (!this.width || this.width <= 0) {
      this.handleResize();
    }

    this.isDrawing = true;
    this.activePointerId = e.pointerId;

    try {
      this.canvas.setPointerCapture(e.pointerId);
    } catch (err) {}

    const pos = this.getPointerPos(e);
    const strokeId = 'stk_' + Math.random().toString(36).substring(2, 8);

    this.currentStroke = {
      id: strokeId,
      tool: this.currentTool,
      color: this.currentColor,
      size: this.currentSize,
      points: [pos]
    };

    const scale = Math.max(0.4, this.width / 1200);
    const scaledSize = Math.max(1.5, this.currentSize * scale);
    this.applyToolStyles(this.currentTool, this.currentColor, scaledSize);

    // Draw immediate crisp circle for single taps/dots
    const dotRadius = (this.currentTool === 'eraser' ? scaledSize * 2.5 : scaledSize) / 2;
    this.ctx.beginPath();
    this.ctx.arc(pos.x, pos.y, Math.max(dotRadius, 1), 0, Math.PI * 2);
    if (this.currentTool === 'eraser') {
      this.ctx.fill();
    } else {
      this.ctx.fillStyle = this.currentColor;
      this.ctx.fill();
    }

    this.lastPoint = pos;
    this.lastMidPoint = pos;

    // Send cursor position to partner
    if (this.syncEngine) {
      this.syncEngine.sendCursor(pos.nx, pos.ny);
    }
  }

  draw(e) {
    if (!this.isDrawing || !this.currentStroke) {
      const pos = this.getPointerPos(e);
      if (this.syncEngine) {
        this.syncEngine.sendCursor(pos.nx, pos.ny);
      }
      return;
    }

    const events = (e.getCoalescedEvents && typeof e.getCoalescedEvents === 'function') 
      ? e.getCoalescedEvents() 
      : [e];

    const scale = Math.max(0.4, this.width / 1200);
    const scaledSize = Math.max(1.5, this.currentSize * scale);
    this.applyToolStyles(this.currentTool, this.currentColor, scaledSize);

    for (const ev of events) {
      const pos = this.getPointerPos(ev);

      // Distance filtering in normalized space
      const dnx = pos.nx - this.lastPoint.nx;
      const dny = pos.ny - this.lastPoint.ny;
      if (dnx * dnx + dny * dny < 0.0000003) continue;

      this.currentStroke.points.push(pos);

      // Quadratic Bézier curve to midpoint for studio-smooth curves
      const newMidPoint = {
        x: (this.lastPoint.x + pos.x) / 2,
        y: (this.lastPoint.y + pos.y) / 2
      };

      this.ctx.beginPath();
      this.ctx.moveTo(this.lastMidPoint.x, this.lastMidPoint.y);
      this.ctx.quadraticCurveTo(this.lastPoint.x, this.lastPoint.y, newMidPoint.x, newMidPoint.y);
      this.ctx.stroke();

      this.lastPoint = pos;
      this.lastMidPoint = newMidPoint;
    }

    const lastPos = this.currentStroke.points[this.currentStroke.points.length - 1];
    if (lastPos && this.syncEngine) {
      this.syncEngine.sendCursor(lastPos.nx, lastPos.ny);
    }
  }

  stopDrawing(e) {
    if (!this.isDrawing) return;
    this.isDrawing = false;

    if (this.activePointerId !== null && this.canvas) {
      try {
        this.canvas.releasePointerCapture(this.activePointerId);
      } catch (err) {}
      this.activePointerId = null;
    }

    if (this.currentStroke && this.currentStroke.points.length > 0) {
      // Connect to final point if multiple points exist
      if (this.currentStroke.points.length > 1 && this.lastPoint && this.lastMidPoint) {
        const scale = Math.max(0.4, this.width / 1200);
        this.applyToolStyles(this.currentTool, this.currentColor, Math.max(1.5, this.currentSize * scale));
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastMidPoint.x, this.lastMidPoint.y);
        this.ctx.lineTo(this.lastPoint.x, this.lastPoint.y);
        this.ctx.stroke();
      }

      // Compact stroke points strictly in normalized coordinates [0, 1]
      const compactedPoints = this.currentStroke.points.map(p => ({
        nx: p.nx,
        ny: p.ny
      }));

      const finalStroke = {
        id: this.currentStroke.id,
        tool: this.currentStroke.tool,
        color: this.currentStroke.color,
        size: this.currentStroke.size,
        points: compactedPoints
      };

      const activeSlide = this.slides[this.activeSlideIndex];
      if (activeSlide) {
        activeSlide.strokes.push(finalStroke);
        activeSlide.redoStack = [];
      }
    }

    this.currentStroke = null;
    this.lastPoint = null;
    this.lastMidPoint = null;
  }

  /* --------------------------------------------------------------------------
     "Send Art to Partner" Action
     Pushes completed artwork to other device with 100% precision
     -------------------------------------------------------------------------- */
  sendArtToPartner() {
    const currentSlide = this.slides[this.activeSlideIndex];
    if (!currentSlide || !currentSlide.strokes || currentSlide.strokes.length === 0) {
      if (window.app) {
        window.app.showToast('Please draw your artwork first before sending! 🎨');
      }
      return;
    }

    const sendBtns = [
      document.getElementById('btn-send-art'),
      document.getElementById('tool-send-btn')
    ].filter(Boolean);

    // Visual button loading state
    sendBtns.forEach(btn => {
      btn.dataset.origHtml = btn.innerHTML;
      btn.innerHTML = '⏳ Sending...';
      btn.disabled = true;
    });

    const partnerName = this.syncEngine?.partnerName || 'Partner';
    const payload = {
      slideIndex: this.activeSlideIndex,
      slideName: currentSlide.name,
      strokes: currentSlide.strokes,
      senderName: this.syncEngine?.getUserDisplayName() || 'Partner'
    };

    if (this.syncEngine) {
      if (this.syncEngine.sendArt) {
        this.syncEngine.sendArt(payload);
      }
      // Also sync full slide state for catch-up persistence
      if (this.syncEngine.sendWhiteboardState) {
        this.syncEngine.sendWhiteboardState(this.slides, this.activeSlideIndex);
      }
    }

    setTimeout(() => {
      sendBtns.forEach(btn => {
        btn.classList.add('sent-success');
        btn.innerHTML = `✨ Sent to ${partnerName}!`;
      });

      if (window.app) {
        window.app.showToast(`Artwork sent to ${partnerName}! 🚀💜✨`);
      }

      setTimeout(() => {
        sendBtns.forEach(btn => {
          btn.classList.remove('sent-success');
          btn.innerHTML = btn.dataset.origHtml || '🚀 Send Art';
          btn.disabled = false;
        });
      }, 2400);
    }, 250);
  }

  /* --------------------------------------------------------------------------
     Receive Art from Partner
     -------------------------------------------------------------------------- */
  handleRemoteSendArt(data) {
    if (!data || !data.strokes) return;
    const targetIndex = data.slideIndex !== undefined ? data.slideIndex : this.activeSlideIndex;

    // Ensure slides array has the target slide
    while (this.slides.length <= targetIndex) {
      const newId = this.slides.length + 1;
      this.slides.push({
        id: newId,
        name: `Slide ${newId}`,
        strokes: [],
        redoStack: []
      });
    }

    this.slides[targetIndex].strokes = data.strokes;
    this.slides[targetIndex].redoStack = [];

    // Switch to the slide containing the new artwork
    this.activeSlideIndex = targetIndex;
    this.renderSlideChips();
    this.redrawActiveSlide();

    const sender = data.senderName || 'Your partner';
    if (window.app) {
      window.app.showToast(`${sender} sent you new artwork! 🎨💜✨`, 4000);
    }
  }

  /* --------------------------------------------------------------------------
     Stroke Rendering & Redraw
     Uses 16:9 proportional coordinates for 100% cross-device matching
     -------------------------------------------------------------------------- */
  renderStroke(stroke) {
    if (!stroke || !stroke.points || stroke.points.length === 0 || !this.ctx) return;
    const points = stroke.points;

    const w = this.width || 1280;
    const h = this.height || 720;
    const dpr = window.devicePixelRatio || 1;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const scale = Math.max(0.4, w / 1200);
    const scaledSize = Math.max(1.5, (stroke.size || 4) * scale);
    this.applyToolStyles(stroke.tool, stroke.color, scaledSize);

    const getPt = (p) => ({
      x: (p.nx !== undefined ? p.nx : (p.x / w)) * w,
      y: (p.ny !== undefined ? p.ny : (p.y / h)) * h
    });

    if (points.length === 1) {
      const pt = getPt(points[0]);
      const dotRadius = (stroke.tool === 'eraser' ? scaledSize * 2.5 : scaledSize) / 2;
      this.ctx.beginPath();
      this.ctx.arc(pt.x, pt.y, Math.max(dotRadius, 1), 0, Math.PI * 2);
      if (stroke.tool === 'eraser') {
        this.ctx.fill();
      } else {
        this.ctx.fillStyle = stroke.color || this.currentColor;
        this.ctx.fill();
      }
      return;
    }

    const p0 = getPt(points[0]);
    const p1 = getPt(points[1]);

    if (points.length === 2) {
      this.ctx.beginPath();
      this.ctx.moveTo(p0.x, p0.y);
      this.ctx.lineTo(p1.x, p1.y);
      this.ctx.stroke();
      return;
    }

    this.ctx.beginPath();
    this.ctx.moveTo(p0.x, p0.y);

    let lastMid = {
      x: (p0.x + p1.x) / 2,
      y: (p0.y + p1.y) / 2
    };
    this.ctx.lineTo(lastMid.x, lastMid.y);

    for (let i = 1; i < points.length - 1; i++) {
      const cur = getPt(points[i]);
      const next = getPt(points[i + 1]);
      const nextMid = {
        x: (cur.x + next.x) / 2,
        y: (cur.y + next.y) / 2
      };
      this.ctx.quadraticCurveTo(cur.x, cur.y, nextMid.x, nextMid.y);
      lastMid = nextMid;
    }

    const pLast = getPt(points[points.length - 1]);
    this.ctx.lineTo(pLast.x, pLast.y);
    this.ctx.stroke();
  }

  redrawActiveSlide() {
    if (!this.ctx || !this.canvas) return;

    const dpr = window.devicePixelRatio || 1;

    // Reset transform to identity and clear physical pixel buffer
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply exact DPR transform
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const activeSlide = this.slides[this.activeSlideIndex];
    if (activeSlide && activeSlide.strokes) {
      for (const stroke of activeSlide.strokes) {
        this.renderStroke(stroke);
      }
    }
  }

  renderRemoteCursor(nx, ny) {
    if (!this.slideWrapper) return;

    const partnerName = this.syncEngine?.partnerName || 'Partner 💜';

    if (!this.remoteCursorEl) {
      this.remoteCursorEl = document.createElement('div');
      this.remoteCursorEl.className = 'peer-cursor';
      this.remoteCursorEl.innerHTML = `
        <div class="peer-cursor-pointer"></div>
        <span class="peer-cursor-label">${partnerName}</span>
      `;
      this.slideWrapper.appendChild(this.remoteCursorEl);
    } else {
      const lbl = this.remoteCursorEl.querySelector('.peer-cursor-label');
      if (lbl) lbl.textContent = partnerName;
    }

    const x = Math.max(0, Math.min(this.width, nx * this.width));
    const y = Math.max(0, Math.min(this.height, ny * this.height));
    this.remoteCursorEl.style.transform = `translate(${x}px, ${y}px)`;
    this.remoteCursorEl.style.display = 'flex';

    clearTimeout(this.cursorHideTimeout);
    this.cursorHideTimeout = setTimeout(() => {
      if (this.remoteCursorEl) {
        this.remoteCursorEl.style.display = 'none';
      }
    }, 3000);
  }

  /* --------------------------------------------------------------------------
     Undo & Redo
     -------------------------------------------------------------------------- */
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
      if (slide) {
        slide.strokes = [];
        slide.redoStack = [];
        this.redrawActiveSlide();

        if (this.syncEngine) {
          this.syncEngine.sendClear(slide.id);
        }
      }
    }
  }

  /* --------------------------------------------------------------------------
     Slide Management
     -------------------------------------------------------------------------- */
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

  /* --------------------------------------------------------------------------
     Save Snapshot to Saved Modules
     -------------------------------------------------------------------------- */
  saveToSavedModules() {
    if (!this.canvas) return;
    const currentSlide = this.slides[this.activeSlideIndex];
    const dataUrl = this.canvas.toDataURL('image/png');

    if (window.savedModulesManager) {
      window.savedModulesManager.saveSlide({
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
