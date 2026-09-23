/* ==========================================================================
   Thanu's WorkSpace - Interactive Multi-Slide Whiteboard
   Module: "Wish to Know" (Develop your knowledge)
   Live collaboration (Zoom-like), tools, slide management, high-precision drawing
   ========================================================================== */

class InteractiveWhiteboard {
  constructor(syncEngine) {
    this.syncEngine = syncEngine;
    this.canvas = document.getElementById('whiteboard-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d', { willReadFrequently: true, alpha: true }) : null;
    this.viewport = document.querySelector('.canvas-viewport');

    // Drawing state
    this.isDrawing = false;
    this.activePointerId = null;
    this.currentTool = 'pen'; // 'pen' or 'eraser'
    this.currentColor = '#6d28d9'; // Default regal purple
    this.currentSize = 4;
    this.currentStroke = null;
    this.currentStrokeId = null;
    this.lastPoint = null;
    this.lastMidPoint = null;

    // Live stroke streaming buffer (stream points to peers at ~40 FPS)
    this.liveChunkBuffer = [];
    this.lastLiveChunkTime = 0;

    // Remote active drawing streams from partner
    this.remoteActiveStrokes = {};
    this.handledRemoteStrokeIds = new Set();

    // Viewport dimensions in CSS pixels
    this.width = 0;
    this.height = 0;

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
     Canvas Sizing & High-DPI Resolution
     -------------------------------------------------------------------------- */
  getWidth() {
    if (this.width && this.width > 0) return this.width;
    if (this.canvas) {
      const rect = this.canvas.getBoundingClientRect();
      if (rect.width > 0) {
        this.width = rect.width;
        this.height = rect.height;
        return this.width;
      }
    }
    if (this.viewport) {
      const rect = this.viewport.getBoundingClientRect();
      if (rect.width > 0) {
        this.width = rect.width;
        this.height = rect.height;
        return this.width;
      }
    }
    return window.innerWidth || 1200;
  }

  getHeight() {
    if (this.height && this.height > 0) return this.height;
    if (this.canvas) {
      const rect = this.canvas.getBoundingClientRect();
      if (rect.height > 0) {
        this.width = rect.width;
        this.height = rect.height;
        return this.height;
      }
    }
    if (this.viewport) {
      const rect = this.viewport.getBoundingClientRect();
      if (rect.height > 0) {
        this.width = rect.width;
        this.height = rect.height;
        return this.height;
      }
    }
    return Math.max((window.innerHeight || 800) - 130, 600);
  }

  initCanvasSize() {
    if (!this.canvas || !this.viewport) return;

    // Responsive ResizeObserver to automatically size canvas when view unlocks/resizes
    if (window.ResizeObserver && this.viewport) {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const cr = entry.contentRect;
          if (cr.width > 0 && cr.height > 0) {
            if (Math.abs(cr.width - (this.width || 0)) > 1 || Math.abs(cr.height - (this.height || 0)) > 1) {
              this.handleResize();
            }
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
    const rect = this.viewport.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width;
    this.height = rect.height;

    // Set physical backing buffer resolution (crisp on Retina & high-DPI Windows)
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    // Explicitly set transform matrix (never multiply or accumulate scales!)
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

    // Pointer events with pointer capture for flawless, uninterrupted drawing
    this.canvas.addEventListener('pointerdown', (e) => this.startDrawing(e));
    this.canvas.addEventListener('pointermove', (e) => this.draw(e));
    this.canvas.addEventListener('pointerup', (e) => this.stopDrawing(e));
    this.canvas.addEventListener('pointercancel', (e) => this.stopDrawing(e));

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

    // Real-Time Live Drawing Handlers (Updates simultaneously with cursor!)
    this.syncEngine.onRemoteLiveStart = (data) => {
      this.handleRemoteLiveStart(data);
    };

    this.syncEngine.onRemoteLiveChunk = (data) => {
      this.handleRemoteLiveChunk(data);
    };

    this.syncEngine.onRemoteLiveEnd = (data) => {
      this.handleRemoteLiveEnd(data);
    };

    // Completed remote stroke fallback
    this.syncEngine.onRemoteStroke = (strokeData) => {
      this.handleRemoteStroke(strokeData);
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

  /* --------------------------------------------------------------------------
     Pointer Coordinate Helpers
     -------------------------------------------------------------------------- */
  getPointerPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width || this.getWidth();
    const h = rect.height || this.getHeight();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return {
      x: x,
      y: y,
      nx: Math.round((x / w) * 10000) / 10000,
      ny: Math.round((y / h) * 10000) / 10000
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
     High-Precision, Butter-Smooth Drawing Engine
     -------------------------------------------------------------------------- */
  startDrawing(e) {
    if (!this.canvas || !this.ctx) return;

    if (!this.width || this.width <= 0) {
      this.handleResize();
    }

    this.isDrawing = true;
    this.activePointerId = e.pointerId;

    // Capture pointer events so drawing stays smooth even if moving across toolbars
    try {
      this.canvas.setPointerCapture(e.pointerId);
    } catch (err) {}

    const pos = this.getPointerPos(e);
    this.currentStrokeId = 'stk_' + Math.random().toString(36).substring(2, 8);

    this.currentStroke = {
      id: this.currentStrokeId,
      tool: this.currentTool,
      color: this.currentColor,
      size: this.currentSize,
      points: [pos]
    };

    this.applyToolStyles(this.currentTool, this.currentColor, this.currentSize);

    // Draw immediate crisp circle for single taps/dots
    const dotRadius = (this.currentTool === 'eraser' ? this.currentSize * 2.5 : this.currentSize) / 2;
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

    // Reset live streaming buffer
    this.liveChunkBuffer = [];
    this.lastLiveChunkTime = Date.now();

    // Stream LIVE START event to partner immediately!
    if (this.syncEngine) {
      this.syncEngine.sendCursor(pos.nx, pos.ny);
      if (this.syncEngine.sendLiveStart) {
        this.syncEngine.sendLiveStart({
          strokeId: this.currentStrokeId,
          slideIndex: this.activeSlideIndex,
          tool: this.currentTool,
          color: this.currentColor,
          size: this.currentSize,
          point: { nx: pos.nx, ny: pos.ny }
        });
      }
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

    // High polling rate support (gaming mouse, stylus, touch)
    const events = (e.getCoalescedEvents && typeof e.getCoalescedEvents === 'function') 
      ? e.getCoalescedEvents() 
      : [e];

    this.applyToolStyles(this.currentTool, this.currentColor, this.currentSize);

    for (const ev of events) {
      const pos = this.getPointerPos(ev);

      // Distance filtering to eliminate zero-delta jitter
      const dx = pos.x - this.lastPoint.x;
      const dy = pos.y - this.lastPoint.y;
      if (dx * dx + dy * dy < 0.8) continue;

      this.currentStroke.points.push(pos);
      this.liveChunkBuffer.push([pos.nx, pos.ny]);

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

      // Flush live chunk to partner every ~30ms or every 3+ points
      const now = Date.now();
      if (this.liveChunkBuffer.length >= 3 || (this.liveChunkBuffer.length > 0 && now - this.lastLiveChunkTime >= 25)) {
        if (this.syncEngine.sendLiveChunk) {
          this.syncEngine.sendLiveChunk({
            strokeId: this.currentStrokeId,
            slideIndex: this.activeSlideIndex,
            pts: this.liveChunkBuffer
          });
        }
        this.liveChunkBuffer = [];
        this.lastLiveChunkTime = now;
      }
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
        this.applyToolStyles(this.currentTool, this.currentColor, this.currentSize);
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastMidPoint.x, this.lastMidPoint.y);
        this.ctx.lineTo(this.lastPoint.x, this.lastPoint.y);
        this.ctx.stroke();
      }

      // Flush remaining buffered live points
      if (this.liveChunkBuffer.length > 0 && this.syncEngine && this.syncEngine.sendLiveChunk) {
        this.syncEngine.sendLiveChunk({
          strokeId: this.currentStrokeId,
          slideIndex: this.activeSlideIndex,
          pts: this.liveChunkBuffer
        });
        this.liveChunkBuffer = [];
      }

      // Compact stroke points for fast network payload
      const compactedPoints = this.currentStroke.points.map(p => ({
        nx: p.nx,
        ny: p.ny
      }));

      const finalStroke = {
        id: this.currentStrokeId,
        tool: this.currentStroke.tool,
        color: this.currentStroke.color,
        size: this.currentStroke.size,
        points: compactedPoints
      };

      const activeSlide = this.slides[this.activeSlideIndex];
      if (activeSlide) {
        activeSlide.strokes.push(finalStroke);
        activeSlide.redoStack = []; // Clear redo stack on new action
      }

      // Broadcast completed stroke (both live end & full stroke fallback)
      if (this.syncEngine) {
        if (this.syncEngine.sendLiveEnd) {
          this.syncEngine.sendLiveEnd({
            strokeId: this.currentStrokeId,
            slideIndex: this.activeSlideIndex,
            stroke: finalStroke
          });
        }
        this.syncEngine.sendStroke({
          slideIndex: this.activeSlideIndex,
          stroke: finalStroke
        });
      }
    }

    this.currentStroke = null;
    this.currentStrokeId = null;
    this.lastPoint = null;
    this.lastMidPoint = null;
  }

  /* --------------------------------------------------------------------------
     Real-Time Remote Live Drawing (Simultaneous with Partner's Cursor!)
     -------------------------------------------------------------------------- */
  handleRemoteLiveStart(data) {
    if (!data || !data.strokeId) return;
    if (data.slideIndex !== this.activeSlideIndex) return;

    const w = this.getWidth();
    const h = this.getHeight();
    const dpr = window.devicePixelRatio || 1;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const pt = {
      x: data.point.nx * w,
      y: data.point.ny * h,
      nx: data.point.nx,
      ny: data.point.ny
    };

    this.remoteActiveStrokes[data.strokeId] = {
      id: data.strokeId,
      tool: data.tool,
      color: data.color,
      size: data.size,
      points: [pt],
      lastPoint: pt,
      lastMidPoint: pt
    };

    // Draw initial dot immediately under the cursor
    this.applyToolStyles(data.tool, data.color, data.size);
    const dotRadius = (data.tool === 'eraser' ? data.size * 2.5 : data.size) / 2;
    this.ctx.beginPath();
    this.ctx.arc(pt.x, pt.y, Math.max(dotRadius, 1), 0, Math.PI * 2);
    if (data.tool === 'eraser') {
      this.ctx.fill();
    } else {
      this.ctx.fillStyle = data.color || '#6d28d9';
      this.ctx.fill();
    }
  }

  handleRemoteLiveChunk(data) {
    if (!data || !data.strokeId || !data.pts) return;
    if (data.slideIndex !== this.activeSlideIndex) return;

    let remote = this.remoteActiveStrokes[data.strokeId];
    if (!remote) return;

    const w = this.getWidth();
    const h = this.getHeight();
    const dpr = window.devicePixelRatio || 1;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.applyToolStyles(remote.tool, remote.color, remote.size);

    for (const [nx, ny] of data.pts) {
      const pos = { x: nx * w, y: ny * h, nx, ny };
      remote.points.push(pos);

      const newMidPoint = {
        x: (remote.lastPoint.x + pos.x) / 2,
        y: (remote.lastPoint.y + pos.y) / 2
      };

      this.ctx.beginPath();
      this.ctx.moveTo(remote.lastMidPoint.x, remote.lastMidPoint.y);
      this.ctx.quadraticCurveTo(remote.lastPoint.x, remote.lastPoint.y, newMidPoint.x, newMidPoint.y);
      this.ctx.stroke();

      remote.lastPoint = pos;
      remote.lastMidPoint = newMidPoint;
    }
  }

  handleRemoteLiveEnd(data) {
    if (!data || !data.strokeId) return;
    this.handledRemoteStrokeIds.add(data.strokeId);

    const targetSlide = this.slides[data.slideIndex];
    const remote = this.remoteActiveStrokes[data.strokeId];

    if (remote && remote.points.length > 1 && data.slideIndex === this.activeSlideIndex) {
      this.applyToolStyles(remote.tool, remote.color, remote.size);
      this.ctx.beginPath();
      this.ctx.moveTo(remote.lastMidPoint.x, remote.lastMidPoint.y);
      this.ctx.lineTo(remote.lastPoint.x, remote.lastPoint.y);
      this.ctx.stroke();
    }

    if (targetSlide) {
      const finalStroke = data.stroke || (remote ? {
        id: remote.id,
        tool: remote.tool,
        color: remote.color,
        size: remote.size,
        points: remote.points
      } : null);

      if (finalStroke) {
        // Avoid duplicate insertion
        if (!targetSlide.strokes.some(s => s.id === data.strokeId)) {
          targetSlide.strokes.push(finalStroke);
        }
        targetSlide.redoStack = [];
      }
    }

    delete this.remoteActiveStrokes[data.strokeId];
  }

  /* --------------------------------------------------------------------------
     Stroke Rendering & Redraw
     -------------------------------------------------------------------------- */
  renderStroke(stroke) {
    if (!stroke || !stroke.points || stroke.points.length === 0 || !this.ctx) return;
    const points = stroke.points;

    const w = this.getWidth();
    const h = this.getHeight();
    const dpr = window.devicePixelRatio || 1;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.applyToolStyles(stroke.tool, stroke.color, stroke.size);

    const getPt = (p) => ({
      x: p.nx !== undefined ? p.nx * w : (p.x || 0),
      y: p.ny !== undefined ? p.ny * h : (p.y || 0)
    });

    if (points.length === 1) {
      const pt = getPt(points[0]);
      const dotRadius = (stroke.tool === 'eraser' ? (stroke.size || 4) * 2.5 : (stroke.size || 4)) / 2;
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

  /* --------------------------------------------------------------------------
     Legacy Remote Collaboration Handlers
     -------------------------------------------------------------------------- */
  handleRemoteStroke(data) {
    if (!data || !data.stroke) return;
    const strokeId = data.stroke.id;
    if (strokeId && this.handledRemoteStrokeIds.has(strokeId)) {
      return; // Already processed via live stream!
    }
    if (strokeId) {
      this.handledRemoteStrokeIds.add(strokeId);
    }

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

    const w = this.getWidth();
    const h = this.getHeight();
    const x = nx * w;
    const y = ny * h;
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
