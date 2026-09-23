/* ==========================================================================
   Thanu's WorkSpace - Mini Floating Calculator
   ========================================================================== */

class MiniCalculator {
  constructor() {
    this.widgetEl = document.getElementById('mini-calc-widget');
    this.screenHistoryEl = document.getElementById('calc-history');
    this.screenOutputEl = document.getElementById('calc-output');
    this.currentVal = '0';
    this.prevVal = null;
    this.operator = null;
    this.resetScreen = false;
    this.isOpen = false;

    this.initEvents();
    this.initDrag();
  }

  initEvents() {
    // Calculator open/close toggle
    const toggleBtns = document.querySelectorAll('.calc-toggle-btn');
    toggleBtns.forEach(btn => {
      btn.addEventListener('click', () => this.toggle());
    });

    const closeBtn = document.getElementById('calc-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    // Key buttons
    const keysGrid = document.querySelector('.calc-keys-grid');
    if (keysGrid) {
      keysGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        const action = btn.dataset.action;
        const key = btn.dataset.key;

        if (key !== undefined) {
          this.appendDigit(key);
        } else if (action) {
          this.handleAction(action);
        }
      });
    }
  }

  toggle() {
    if (this.isOpen) {
      this.hide();
    } else {
      this.show();
    }
  }

  show() {
    if (!this.widgetEl) return;
    this.widgetEl.classList.add('active');
    this.isOpen = true;
  }

  hide() {
    if (!this.widgetEl) return;
    this.widgetEl.classList.remove('active');
    this.isOpen = false;
  }

  appendDigit(digit) {
    if (this.currentVal === '0' || this.resetScreen) {
      this.currentVal = digit;
      this.resetScreen = false;
    } else {
      if (digit === '.' && this.currentVal.includes('.')) return;
      if (this.currentVal.length < 12) {
        this.currentVal += digit;
      }
    }
    this.updateScreen();
  }

  handleAction(action) {
    switch (action) {
      case 'clear':
        this.currentVal = '0';
        this.prevVal = null;
        this.operator = null;
        this.screenHistoryEl.textContent = '';
        break;

      case 'backspace':
        if (this.currentVal.length > 1) {
          this.currentVal = this.currentVal.slice(0, -1);
        } else {
          this.currentVal = '0';
        }
        break;

      case 'percent':
        this.currentVal = (parseFloat(this.currentVal) / 100).toString();
        break;

      case 'sqrt':
        const num = parseFloat(this.currentVal);
        if (num >= 0) {
          this.currentVal = Math.sqrt(num).toFixed(4).replace(/\.?0+$/, '');
        } else {
          this.currentVal = 'Error';
        }
        break;

      case 'plus-minus':
        this.currentVal = (parseFloat(this.currentVal) * -1).toString();
        break;

      case 'add':
      case 'subtract':
      case 'multiply':
      case 'divide':
        this.setOperator(action);
        break;

      case 'equals':
        this.calculate();
        break;
    }
    this.updateScreen();
  }

  getOperatorSymbol(action) {
    switch (action) {
      case 'add': return '+';
      case 'subtract': return '-';
      case 'multiply': return '×';
      case 'divide': return '÷';
      default: return '';
    }
  }

  setOperator(op) {
    if (this.operator && !this.resetScreen) {
      this.calculate();
    }
    this.prevVal = parseFloat(this.currentVal);
    this.operator = op;
    this.resetScreen = true;
    this.screenHistoryEl.textContent = `${this.prevVal} ${this.getOperatorSymbol(op)}`;
  }

  calculate() {
    if (!this.operator || this.prevVal === null) return;
    const current = parseFloat(this.currentVal);
    let result = 0;

    switch (this.operator) {
      case 'add':
        result = this.prevVal + current;
        break;
      case 'subtract':
        result = this.prevVal - current;
        break;
      case 'multiply':
        result = this.prevVal * current;
        break;
      case 'divide':
        if (current === 0) {
          this.currentVal = 'Error';
          this.operator = null;
          this.prevVal = null;
          this.updateScreen();
          return;
        }
        result = this.prevVal / current;
        break;
    }

    // Clean floating precision
    result = Math.round(result * 100000000) / 100000000;
    this.screenHistoryEl.textContent = `${this.prevVal} ${this.getOperatorSymbol(this.operator)} ${current} =`;
    this.currentVal = result.toString();
    this.operator = null;
    this.prevVal = null;
    this.resetScreen = true;
    this.updateScreen();
  }

  updateScreen() {
    if (this.screenOutputEl) {
      this.screenOutputEl.textContent = this.currentVal;
    }
  }

  /* Draggable titlebar logic */
  initDrag() {
    const titlebar = document.getElementById('calc-titlebar');
    if (!titlebar || !this.widgetEl) return;

    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    titlebar.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = this.widgetEl.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;

      this.widgetEl.style.bottom = 'auto';
      this.widgetEl.style.right = 'auto';
      this.widgetEl.style.left = `${initialLeft}px`;
      this.widgetEl.style.top = `${initialTop}px`;

      document.body.style.userSelect = 'none';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const newLeft = Math.max(10, Math.min(window.innerWidth - 300, initialLeft + dx));
      const newTop = Math.max(10, Math.min(window.innerHeight - 380, initialTop + dy));

      this.widgetEl.style.left = `${newLeft}px`;
      this.widgetEl.style.top = `${newTop}px`;
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
      document.body.style.userSelect = '';
    });
  }
}

window.MiniCalculator = MiniCalculator;
