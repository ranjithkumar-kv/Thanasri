/* ==========================================================================
   Thanu's WorkSpace - Celebration Effects & Answers Viewer Engine
   Confetti bursts for game wins/achievements, and saved responses viewer
   ========================================================================== */

class BirthdayCelebration {
  constructor() {
    this.canvas = document.getElementById('confetti-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.particles = [];
    this.isAnimRunning = false;

    this.colors = [
      '#a855f7', '#c084fc', '#9333ea', '#7e22ce',
      '#e9d5ff', '#ffffff', '#fde047', '#f472b6'
    ];

    this.initCanvas();
  }

  initCanvas() {
    if (!this.canvas) return;
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  /* Confetti Particle System for Game Wins & Milestones */
  startCelebration() {
    if (!this.canvas) return;
    this.resizeCanvas();
    this.triggerBurstConfetti(120);

    if (!this.isAnimRunning) {
      this.isAnimRunning = true;
      this.animateConfetti();
    }
  }

  stopCelebration() {
    this.isAnimRunning = false;
    this.particles = [];
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  triggerBurstConfetti(count = 90) {
    if (!this.canvas) {
      this.canvas = document.getElementById('confetti-canvas');
      if (this.canvas) {
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
      }
    }
    if (!this.canvas) return;

    this.resizeCanvas();
    const originX = window.innerWidth / 2;
    const originY = window.innerHeight * 0.45;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = 4 + Math.random() * 9;
      this.particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 2,
        size: 6 + Math.random() * 8,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 12,
        gravity: 0.18,
        drag: 0.985,
        alpha: 1,
        shape: Math.random() > 0.4 ? 'rect' : 'heart'
      });
    }

    if (!this.isAnimRunning) {
      this.isAnimRunning = true;
      this.animateConfetti();
    }
  }

  animateConfetti() {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.vRot;
      p.alpha -= 0.005;

      if (p.alpha <= 0 || p.y > this.canvas.height + 20) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.fillStyle = p.color;

      if (p.shape === 'rect') {
        this.ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        // Heart shape
        this.ctx.beginPath();
        const s = p.size * 0.5;
        this.ctx.moveTo(0, s * 0.3);
        this.ctx.bezierCurveTo(-s, -s * 0.6, -s * 1.4, s * 0.4, 0, s * 1.3);
        this.ctx.bezierCurveTo(s * 1.4, s * 0.4, s, -s * 0.6, 0, s * 0.3);
        this.ctx.fill();
      }

      this.ctx.restore();
    }

    if (this.particles.length > 0 || this.isAnimRunning) {
      requestAnimationFrame(() => this.animateConfetti());
    }
  }
}

/* ==========================================================================
   Thanu's WorkSpace - Questionnaire & Answers Viewer Engine
   Handles saved responses from Thanu, sync between RK & Thanu, and Answers Modal
   ========================================================================== */

class BirthdayQuiz {
  constructor() {
    this.storageKey = 'thanu_bday_quiz_answers';
    this.latestKey = 'thanu_bday_quiz_answers_latest';
    this.sessionKey = 'thanu_active_session_answers';
    this.answers = this.loadSavedAnswers();
    this.allAnsweredUnlocked = true;

    this.initAnswersModal();
    this.updateHeaderBadge();
  }

  loadSavedAnswers() {
    try {
      const saved = sessionStorage.getItem(this.sessionKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    try {
      const l = localStorage.getItem(this.latestKey) || localStorage.getItem(this.storageKey);
      if (l) return JSON.parse(l);
    } catch (e) {}

    return {
      q1: '',
      q2: '',
      q3: '',
      q4: '',
      q5: '',
      q6: '',
      q7: '',
      q8: ''
    };
  }

  resetQuizForNewLogin() {
    // Compatibility stub
  }

  restoreAnswersToUI() {
    // Compatibility stub
  }

  saveAnswers() {
    try {
      sessionStorage.setItem(this.sessionKey, JSON.stringify(this.answers));
      localStorage.setItem(this.latestKey, JSON.stringify(this.answers));
      localStorage.setItem(this.storageKey, JSON.stringify(this.answers));
      localStorage.setItem('thanu_bday_quiz_answers_timestamp', String(Date.now()));
    } catch (e) {}

    const sync = window.workspaceSync || window.wbSyncEngine;
    if (sync && sync.sendQuizAnswers) {
      sync.sendQuizAnswers(this.answers, Date.now());
    } else if (sync && sync.broadcast) {
      sync.broadcast('BDAY_QUIZ_ANSWERS', { answers: this.answers, timestamp: Date.now() }, 1, true);
    }

    this.updateHeaderBadge();
    this.renderAnswersModalContent();
  }

  initEvents() {
    // Questionnaire inputs are not rendered on daily workspace view
  }

  initRunawayButton() {
    // Stub
  }

  triggerSadEmojiRain() {
    // Stub
  }

  updateProgress(autoSave = true) {
    // Compatibility stub for existing caller points
  }

  /* Answers Modal for RK */
  initAnswersModal() {
    const modal = document.getElementById('quiz-answers-modal');
    const closeBtn = document.getElementById('btn-close-quiz-answers');
    const footerCloseBtn = document.getElementById('btn-close-quiz-answers-footer');
    const refreshBtn = document.getElementById('btn-refresh-quiz-sync');
    const copyBtn = document.getElementById('btn-copy-modal-answers');
    const waBtn = document.getElementById('btn-whatsapp-modal-answers');
    const headerPill = document.getElementById('btn-view-quiz-answers');
    const hubLink = document.getElementById('btn-hub-answers-link');

    if (closeBtn) closeBtn.addEventListener('click', () => this.closeAnswersModal());
    if (footerCloseBtn) footerCloseBtn.addEventListener('click', () => this.closeAnswersModal());
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeAnswersModal();
      });
    }

    if (headerPill) headerPill.addEventListener('click', () => this.openAnswersModal());
    if (hubLink) hubLink.addEventListener('click', () => this.openAnswersModal());

    if (copyBtn) copyBtn.addEventListener('click', () => this.copyAnswers());
    if (waBtn) waBtn.addEventListener('click', () => this.sendAnswersToWhatsApp());

    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        const sync = window.workspaceSync || window.wbSyncEngine;
        if (sync && sync.broadcast) {
          sync.broadcast('REQ_BDAY_QUIZ_SYNC', {}, 1);
        }
        if (window.app) window.app.showToast('🔄 Requested latest sync answers...', 2000);
        setTimeout(() => this.renderAnswersModalContent(), 600);
      });
    }

    // Real-time sync listener
    const sync = window.workspaceSync || window.wbSyncEngine;
    if (sync && sync.on) {
      sync.on('BDAY_QUIZ_ANSWERS', (data) => {
        if (data && data.answers) {
          try {
            localStorage.setItem('thanu_bday_quiz_answers_from_partner', JSON.stringify(data.answers));
            if (data.timestamp) {
              localStorage.setItem('thanu_bday_quiz_answers_timestamp', String(data.timestamp));
            }
          } catch (e) {}

          this.updateHeaderBadge();
          const modalEl = document.getElementById('quiz-answers-modal');
          if (modalEl && modalEl.classList.contains('active')) {
            this.renderAnswersModalContent();
          }
        }
      });
    }
  }

  openAnswersModal() {
    const modal = document.getElementById('quiz-answers-modal');
    if (!modal) return;
    this.renderAnswersModalContent();
    modal.classList.add('active');
  }

  closeAnswersModal() {
    const modal = document.getElementById('quiz-answers-modal');
    if (modal) modal.classList.remove('active');
  }

  getAnswersData() {
    let partnerAnswers = null;
    let localAnswers = null;
    let timestamp = null;

    try {
      const p = localStorage.getItem('thanu_bday_quiz_answers_from_partner');
      if (p) partnerAnswers = JSON.parse(p);
    } catch (e) {}

    try {
      const l = localStorage.getItem(this.latestKey) || localStorage.getItem(this.storageKey);
      if (l) localAnswers = JSON.parse(l);
    } catch (e) {}

    try {
      timestamp = localStorage.getItem('thanu_bday_quiz_answers_timestamp');
    } catch (e) {}

    const sync = window.workspaceSync || window.wbSyncEngine;
    const isRK = (window.app && window.app.currentUser === 'rk') || (sync && sync.userRole === 'rk');

    let target = isRK ? (partnerAnswers || localAnswers || {}) : (localAnswers || partnerAnswers || {});
    let source = partnerAnswers ? 'partner' : (localAnswers ? 'local' : 'none');

    let count = 0;
    for (let i = 1; i <= 8; i++) {
      const val = target[`q${i}`];
      if (val && String(val).trim().length > 0) count++;
    }

    return { answers: target, source, count, timestamp, isRK };
  }

  updateHeaderBadge() {
    const data = this.getAnswersData();
    const badge = document.getElementById('quiz-answers-pill-badge');
    const headerBtn = document.getElementById('btn-view-quiz-answers');
    const hubLink = document.getElementById('btn-hub-answers-link');

    // ONLY show Thanu's answered questions for the user who entered "thanu2596" (RK)
    const isRK = (window.app && window.app.currentUser === 'rk') || (window.workspaceSync && window.workspaceSync.userRole === 'rk');

    if (!isRK) {
      if (headerBtn) headerBtn.style.display = 'none';
      if (hubLink) hubLink.style.display = 'none';
      return;
    }

    if (headerBtn) headerBtn.style.display = 'inline-flex';
    if (hubLink) hubLink.style.display = 'inline-flex';

    if (!badge) return;

    if (data.count > 0) {
      badge.style.display = 'inline-block';
      badge.textContent = `${data.count}/8`;
      if (data.count === 8) {
        badge.style.background = '#10b981';
        badge.style.color = '#ffffff';
      } else {
        badge.style.background = '#f59e0b';
        badge.style.color = '#ffffff';
      }
    } else {
      badge.style.display = 'none';
    }
  }

  renderAnswersModalContent() {
    const data = this.getAnswersData();
    const container = document.getElementById('quiz-answers-list-container');
    const statusText = document.getElementById('quiz-modal-status-text');
    const statusDot = document.getElementById('quiz-modal-status-dot');
    const statusTag = document.getElementById('quiz-modal-status-tag');
    const subtitle = document.getElementById('quiz-modal-subtitle');
    const footerTime = document.getElementById('quiz-modal-footer-time');

    if (statusText && statusDot && statusTag) {
      if (data.count === 8) {
        statusText.textContent = 'All 8 questions answered! 🎉';
        statusDot.style.background = '#10b981';
        statusTag.style.borderColor = '#34d399';
        statusTag.style.background = '#ecfdf5';
        statusTag.style.color = '#065f46';
      } else if (data.count > 0) {
        statusText.textContent = `${data.count} of 8 questions answered ⏳`;
        statusDot.style.background = '#f59e0b';
        statusTag.style.borderColor = '#fcd34d';
        statusTag.style.background = '#fffbeb';
        statusTag.style.color = '#92400e';
      } else {
        statusText.textContent = 'Waiting for Thanu to answer... 💭';
        statusDot.style.background = '#94a3b8';
        statusTag.style.borderColor = '#cbd5e1';
        statusTag.style.background = '#f8fafc';
        statusTag.style.color = '#64748b';
      }
    }

    if (subtitle) {
      if (data.source === 'partner') {
        subtitle.textContent = "💌 Live answers received from Thanu's device";
      } else if (data.source === 'local') {
        subtitle.textContent = '💾 Saved responses from questionnaire';
      } else {
        subtitle.textContent = 'Waiting for responses from Thanu';
      }
    }

    if (footerTime) {
      if (data.timestamp) {
        const d = new Date(Number(data.timestamp));
        footerTime.textContent = `Last updated: ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Synced via Real-Time Cloud`;
      } else {
        footerTime.textContent = 'Real-time cloud sync active';
      }
    }

    if (!container) return;

    const questionsMeta = [
      {
        num: 1,
        icon: '🔑',
        title: "1. What's your hotspot password?",
        key: 'q1',
        type: 'text',
        placeholder: 'Not typed yet...'
      },
      {
        num: 2,
        icon: '💖',
        title: "2. Who do you love more—Mom or Dad?",
        key: 'q2',
        type: 'choice',
        renderChoice: (v) => {
          if (!v) return '<span class="empty-ans">Not chosen yet...</span>';
          if (v === 'Mom') return '<span class="choice-tag mom">💖 Mom (Princess bond! 👑)</span>';
          if (v === 'Dad') return "<span class=\"choice-tag dad\">💙 Dad (Daddy's strongest girl! 🌟)</span>";
          return `<span class="choice-tag">${this.escapeHtml(v)}</span>`;
        }
      },
      {
        num: 3,
        icon: '🌟',
        title: "3. Who do you like the most—Gill or Me?",
        key: 'q3',
        type: 'choice',
        renderChoice: (v) => {
          if (!v) return '<span class="empty-ans">Not chosen yet...</span>';
          if (v === 'Me') return '<span class="choice-tag me">🥰 Me! ("Made my day! Best buddy forever 💜")</span>';
          if (v === 'Gill') return '<span class="choice-tag gill">🏏 Gill (Haha batsman over me! 😂)</span>';
          return `<span class="choice-tag">${this.escapeHtml(v)}</span>`;
        }
      },
      {
        num: 4,
        icon: '💜',
        title: "4. What is one thing you like about me?",
        key: 'q4',
        type: 'text',
        placeholder: 'Not typed yet...'
      },
      {
        num: 5,
        icon: '🙈',
        title: "5. What is one thing you don't like about me?",
        key: 'q5',
        type: 'text',
        placeholder: 'Not typed yet...'
      },
      {
        num: 6,
        icon: '💭',
        title: "6. What is the most memorable moment you've had with me?",
        key: 'q6',
        type: 'text',
        placeholder: 'Not typed yet...'
      },
      {
        num: 7,
        icon: '👫',
        title: "7. Who am I to you—a younger brother or a friend?",
        key: 'q7',
        type: 'choice',
        renderChoice: (v) => {
          if (!v) return '<span class="empty-ans">Not chosen yet...</span>';
          if (v === 'A Friend') return '<span class="choice-tag friend">👫 A Friend ✨ (Best friends forever! 💜)</span>';
          if (v === 'Younger Brother') return '<span class="choice-tag brother">👦 A Younger Brother 🥺 (Aiyooo sed life! 💔)</span>';
          return `<span class="choice-tag">${this.escapeHtml(v)}</span>`;
        }
      },
      {
        num: 8,
        icon: '📸',
        title: "8. Will you send me your pic? 📸✨",
        key: 'q8',
        type: 'choice',
        renderChoice: (v) => {
          if (!v) return '<span class="empty-ans">Not chosen yet...</span>';
          if (v === 'Yes') return '<span class="choice-tag yes">📸 Yes, Of Course! 🥰✨</span>';
          if (v === 'No') return '<span class="choice-tag no">🙅‍♀️ No</span>';
          return `<span class="choice-tag">${this.escapeHtml(v)}</span>`;
        }
      }
    ];

    let html = '';
    questionsMeta.forEach(q => {
      const val = (data.answers && data.answers[q.key]) ? String(data.answers[q.key]).trim() : '';
      const hasVal = val.length > 0;

      html += `
        <div class="modal-answer-card ${hasVal ? 'answered' : ''}">
          <div class="modal-answer-q-header">
            <span class="modal-answer-icon">${q.icon}</span>
            <span class="modal-answer-q-title">${q.title}</span>
            <span class="modal-answer-status-pill ${hasVal ? 'done' : 'pending'}">${hasVal ? 'Answered ✓' : 'Pending'}</span>
          </div>
          <div class="modal-answer-val-box ${!hasVal ? 'empty' : ''}">
      `;

      if (q.type === 'choice' && q.renderChoice) {
        html += q.renderChoice(val);
      } else {
        html += hasVal ? this.escapeHtml(val) : `<span class="empty-ans">${q.placeholder}</span>`;
      }

      html += `
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  sendAnswersToWhatsApp() {
    const data = this.getAnswersData();
    const a = data.answers || {};

    const text = `💖 *Thanu's Questionnaire Answers!* 💖\n\n` +
      `1️⃣ *Hotspot Password:*\n👉 ${a.q1 || '(Not answered yet)'}\n\n` +
      `2️⃣ *Who do you love more—Mom or Dad?*\n👉 ${a.q2 || '(Not chosen yet)'}\n\n` +
      `3️⃣ *Who do you like the most—Gill or Me?*\n👉 ${a.q3 || '(Not chosen yet)'} ${a.q3 === 'Me' ? '🥰💜' : '🏏'}\n\n` +
      `4️⃣ *One thing you like about me:*\n👉 ${a.q4 || '(Not answered yet)'}\n\n` +
      `5️⃣ *One thing you don't like about me:*\n👉 ${a.q5 || '(Not answered yet)'}\n\n` +
      `6️⃣ *Most memorable moment with me:*\n👉 ${a.q6 || '(Not answered yet)'}\n\n` +
      `7️⃣ *Who am I to you—Younger brother or Friend?*\n👉 ${a.q7 || '(Not chosen yet)'} ${a.q7 === 'A Friend' ? '👫✨' : '🥺'}\n\n` +
      `8️⃣ *Will you send me your pic?*\n👉 ${a.q8 || '(Not chosen yet)'} 📸✨\n\n` +
      `✨ Thanu's Workspace 💜`;

    const encoded = encodeURIComponent(text);
    const url = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  }

  copyAnswers() {
    const data = this.getAnswersData();
    const a = data.answers || {};

    const text = `💖 Thanu's Questionnaire Answers! 💖\n\n` +
      `1. What's your hotspot password?\n   -> ${a.q1 || '(Not answered)'}\n\n` +
      `2. Who do you love more—Mom or Dad?\n   -> ${a.q2 || '(Not answered)'}\n\n` +
      `3. Who do you like the most—Gill or Me?\n   -> ${a.q3 || '(Not answered)'}\n\n` +
      `4. What is one thing you like about me?\n   -> ${a.q4 || '(Not answered)'}\n\n` +
      `5. What is one thing you don't like about me?\n   -> ${a.q5 || '(Not answered)'}\n\n` +
      `6. Most memorable moment you've had with me?\n   -> ${a.q6 || '(Not answered)'}\n\n` +
      `7. Who am I to you—a younger brother or a friend?\n   -> ${a.q7 || '(Not answered)'}\n\n` +
      `8. Will you send me your pic?\n   -> ${a.q8 || '(Not answered)'}\n\n` +
      `✨ Thanu's Workspace 💜`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        if (window.app) window.app.showToast('📋 Answers copied to clipboard! ✨', 2500);
      }).catch(() => {
        this.fallbackCopyText(text);
      });
    } else {
      this.fallbackCopyText(text);
    }
  }

  fallbackCopyText(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      if (window.app) window.app.showToast('📋 Answers copied to clipboard! ✨', 2500);
    } catch (e) {
      if (window.app) window.app.showToast('⚠️ Could not copy to clipboard', 2500);
    }
    document.body.removeChild(ta);
  }
}

window.BirthdayCelebration = BirthdayCelebration;
window.BirthdayQuiz = BirthdayQuiz;
