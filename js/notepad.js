/* ==========================================================================
   Thanu's WorkSpace - Quick Floating Notepad Widget
   Module: Wish to Know & Global Companion
   ========================================================================== */

class QuickNotepad {
  constructor() {
    this.widgetEl = document.getElementById('notepad-widget');
    this.textareaEl = document.getElementById('notepad-textarea');
    this.statsEl = document.getElementById('notepad-stats');
    this.statusEl = document.getElementById('notepad-saved-status');
    this.isOpen = false;
    this.storageKey = 'thanu_workspace_notepad_content';

    this.initEvents();
    this.initDrag();
    this.loadNotes();
  }

  initEvents() {
    // All toggle buttons with class .notepad-toggle-btn
    const toggleBtns = document.querySelectorAll('.notepad-toggle-btn');
    toggleBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggle();
      });
    });

    const closeBtn = document.getElementById('notepad-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.hide();
      });
    }

    if (this.textareaEl) {
      this.textareaEl.addEventListener('input', () => {
        this.saveNotes();
        this.updateStats();
      });
    }

    // Toolbar buttons: Copy, Clear, Download
    const copyBtn = document.getElementById('notepad-copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => this.copyNotes());
    }

    const clearBtn = document.getElementById('notepad-clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearNotes());
    }

    const downloadBtn = document.getElementById('notepad-download-btn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => this.downloadNotes());
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
    if (this.textareaEl) {
      setTimeout(() => this.textareaEl.focus(), 80);
    }
  }

  hide() {
    if (!this.widgetEl) return;
    this.widgetEl.classList.remove('active');
    this.isOpen = false;
  }

  loadNotes() {
    if (!this.textareaEl) return;
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved !== null) {
        this.textareaEl.value = saved;
      }
    } catch (e) {}
    this.updateStats();
  }

  saveNotes() {
    if (!this.textareaEl) return;
    try {
      localStorage.setItem(this.storageKey, this.textareaEl.value);
      if (this.statusEl) {
        this.statusEl.textContent = '✨ Saved';
        this.statusEl.style.opacity = '1';
      }
    } catch (e) {}
  }

  updateStats() {
    if (!this.textareaEl || !this.statsEl) return;
    const text = this.textareaEl.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const chars = this.textareaEl.value.length;
    this.statsEl.textContent = `${words} word${words === 1 ? '' : 's'} • ${chars} char${chars === 1 ? '' : 's'}`;
  }

  copyNotes() {
    if (!this.textareaEl) return;
    const text = this.textareaEl.value;
    if (!text.trim()) {
      if (window.app) window.app.showToast('Notepad is empty! Nothing to copy 😊');
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        if (window.app) window.app.showToast('Notes copied to clipboard! 📋');
      }).catch(() => {
        this.fallbackCopy();
      });
    } else {
      this.fallbackCopy();
    }
  }

  fallbackCopy() {
    this.textareaEl.select();
    document.execCommand('copy');
    if (window.app) window.app.showToast('Notes copied to clipboard! 📋');
  }

  clearNotes() {
    if (!this.textareaEl) return;
    if (!this.textareaEl.value.trim()) return;
    if (confirm('Clear all text from your notepad?')) {
      this.textareaEl.value = '';
      this.saveNotes();
      this.updateStats();
      if (window.app) window.app.showToast('Notepad cleared! 🗑️');
    }
  }

  downloadNotes() {
    if (!this.textareaEl) return;
    const content = this.textareaEl.value;
    if (!content.trim()) {
      if (window.app) window.app.showToast('Notepad is empty! Type something first 📝');
      return;
    }
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `thanu_workspace_notes_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (window.app) window.app.showToast('Notes downloaded as .txt! 💾');
  }

  initDrag() {
    const titlebar = document.getElementById('notepad-titlebar');
    if (!titlebar || !this.widgetEl) return;

    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    const startDrag = (clientX, clientY) => {
      isDragging = true;
      startX = clientX;
      startY = clientY;
      const rect = this.widgetEl.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;

      this.widgetEl.style.bottom = 'auto';
      this.widgetEl.style.right = 'auto';
      this.widgetEl.style.left = `${initialLeft}px`;
      this.widgetEl.style.top = `${initialTop}px`;

      document.body.style.userSelect = 'none';
    };

    const moveDrag = (clientX, clientY) => {
      if (!isDragging) return;
      const dx = clientX - startX;
      const dy = clientY - startY;
      const newLeft = Math.max(10, Math.min(window.innerWidth - 340, initialLeft + dx));
      const newTop = Math.max(10, Math.min(window.innerHeight - 440, initialTop + dy));

      this.widgetEl.style.left = `${newLeft}px`;
      this.widgetEl.style.top = `${newTop}px`;
    };

    const endDrag = () => {
      isDragging = false;
      document.body.style.userSelect = '';
    };

    titlebar.addEventListener('mousedown', (e) => {
      if (e.target.closest('button')) return;
      startDrag(e.clientX, e.clientY);
    });

    window.addEventListener('mousemove', (e) => moveDrag(e.clientX, e.clientY));
    window.addEventListener('mouseup', endDrag);

    // Touch support for tablets/phones
    titlebar.addEventListener('touchstart', (e) => {
      if (e.target.closest('button')) return;
      const touch = e.touches[0];
      startDrag(touch.clientX, touch.clientY);
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      moveDrag(touch.clientX, touch.clientY);
    }, { passive: true });

    window.addEventListener('touchend', endDrag);
  }
}

window.QuickNotepad = QuickNotepad;
