/* ==========================================================================
   Thanu's WorkSpace - Birthday Celebration Effects Engine
   Confetti bursts, floating purple hearts, synthesized birthday melody
   ========================================================================== */

class BirthdayCelebration {
  constructor() {
    this.canvas = document.getElementById('confetti-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.particles = [];
    this.isAnimRunning = false;
    this.audioPlaying = false;
    this.audioCtx = null;

    this.colors = [
      '#a855f7', '#c084fc', '#9333ea', '#7e22ce',
      '#e9d5ff', '#ffffff', '#fde047', '#f472b6'
    ];

    this.initCanvas();
    this.initFloatingHearts();
    this.initSurpriseGifts();
    this.initSoundChime();
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

  /* 1. Confetti Particle System */
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
  }

  animateConfetti() {
    if (!this.ctx) return;
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
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
      } else {
        // Draw miniature heart
        this.ctx.font = `${Math.round(p.size * 1.3)}px serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('💜', 0, 0);
      }

      this.ctx.restore();
    }

    if (this.particles.length > 0 || this.isAnimRunning) {
      requestAnimationFrame(() => this.animateConfetti());
    }
  }

  /* 2. Floating Purple Hearts Generator */
  initFloatingHearts() {
    const container = document.getElementById('floating-hearts-container');
    if (!container) return;

    const heartSymbols = ['💜', '✨', '🌸', '💜', '💖', '💜'];

    setInterval(() => {
      const heart = document.createElement('div');
      heart.className = 'floating-heart';
      heart.textContent = heartSymbols[Math.floor(Math.random() * heartSymbols.length)];
      heart.style.left = `${Math.random() * 96}%`;
      heart.style.animationDuration = `${5 + Math.random() * 5}s`;
      heart.style.fontSize = `${1.2 + Math.random() * 1.5}rem`;

      container.appendChild(heart);

      setTimeout(() => {
        if (heart.parentNode) heart.parentNode.removeChild(heart);
      }, 10000);
    }, 850);
  }

  /* 3. Interactive Surprise Gift Boxes */
  initSurpriseGifts() {
    const presents = document.querySelectorAll('.present-box');
    const messages = [
      "🎁 Surprise 1: Unlimited smiles and endless happiness!",
      "🎁 Surprise 2: May all your learning goals come to life!",
      "🎁 Surprise 3: You are truly one of a kind Cuteuhhh 💜"
    ];

    presents.forEach((box, index) => {
      box.addEventListener('click', () => {
        this.triggerBurstConfetti(50);
        if (window.app) {
          window.app.showToast(messages[index] || "Happy Birthday! 💜");
        }
      });
    });
  }

  /* 4. Synthesized Birthday Melody Chime (Web Audio API) */
  initSoundChime() {
    const toggleBtn = document.getElementById('music-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.playBirthdayMelody();
      });
    }
  }

  playBirthdayMelody() {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      // Notes frequencies for "Happy Birthday to You"
      // G4, G4, A4, G4, C5, B4
      // G4, G4, A4, G4, D5, C5
      const melody = [
        { f: 392.00, d: 0.3 }, // G4
        { f: 392.00, d: 0.3 }, // G4
        { f: 440.00, d: 0.6 }, // A4
        { f: 392.00, d: 0.6 }, // G4
        { f: 523.25, d: 0.6 }, // C5
        { f: 493.88, d: 1.0 }, // B4

        { f: 392.00, d: 0.3 }, // G4
        { f: 392.00, d: 0.3 }, // G4
        { f: 440.00, d: 0.6 }, // A4
        { f: 392.00, d: 0.6 }, // G4
        { f: 587.33, d: 0.6 }, // D5
        { f: 523.25, d: 1.2 }  // C5
      ];

      let startTime = this.audioCtx.currentTime + 0.1;

      melody.forEach(note => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        // Warm music-box bell tone (sine + harmonic overtone)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.f, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.2, startTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + note.d);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(startTime);
        osc.stop(startTime + note.d + 0.05);

        startTime += note.d + 0.08;
      });
    } catch (e) {
      console.log('Audio autoplay note:', e);
    }
  }
}

/* ==========================================================================
   Thanu's WorkSpace - Interactive Birthday Questionnaire Engine
   Handles questions 1-8, sad emoji reaction, runaway "No" button,
   progress tracking, answer saving, and unlocking the workspace!
   ========================================================================== */

class BirthdayQuiz {
  constructor() {
    this.storageKey = 'thanu_bday_quiz_answers';
    this.answers = this.loadSavedAnswers();
    this.allAnsweredUnlocked = false;

    this.initEvents();
    this.initRunawayButton();
    this.restoreAnswersToUI();
    this.updateProgress(false);
  }

  loadSavedAnswers() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) return JSON.parse(saved);
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

  saveAnswers() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.answers));
    } catch (e) {}

    // Broadcast over sync so RK can see her answers in real time!
    const sync = window.workspaceSync || window.wbSyncEngine;
    if (sync && sync.broadcast) {
      sync.broadcast('BDAY_QUIZ_ANSWERS', { answers: this.answers });
    }
  }

  initEvents() {
    // Text Inputs: Q1, Q4, Q5, Q6
    const q1Input = document.getElementById('quiz-q1-input');
    if (q1Input) {
      q1Input.addEventListener('input', (e) => {
        this.answers.q1 = e.target.value.trim();
        this.saveAnswers();
        this.updateProgress();
      });
    }

    const q4Input = document.getElementById('quiz-q4-input');
    if (q4Input) {
      q4Input.addEventListener('input', (e) => {
        this.answers.q4 = e.target.value.trim();
        this.saveAnswers();
        this.updateProgress();
      });
    }

    const q5Input = document.getElementById('quiz-q5-input');
    if (q5Input) {
      q5Input.addEventListener('input', (e) => {
        this.answers.q5 = e.target.value.trim();
        this.saveAnswers();
        this.updateProgress();
      });
    }

    const q6Input = document.getElementById('quiz-q6-input');
    if (q6Input) {
      q6Input.addEventListener('input', (e) => {
        this.answers.q6 = e.target.value.trim();
        this.saveAnswers();
        this.updateProgress();
      });
    }

    // Choice Buttons: Q2 (Mom or Dad)
    const q2Btns = document.querySelectorAll('.quiz-choice-btn[data-q="2"]');
    q2Btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.val;
        this.answers.q2 = val;
        q2Btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const reactEl = document.getElementById('quiz-q2-reaction');
        if (reactEl) {
          reactEl.style.display = 'block';
          reactEl.className = 'quiz-reaction-msg happy';
          reactEl.textContent = val === 'Mom' ? "Mom's precious princess! 👑💖 Sweetest bond ever!" : "Daddy's strongest girl! 🌟💙 Cherished forever!";
        }

        this.saveAnswers();
        this.updateProgress();
      });
    });

    // Choice Buttons: Q3 (Gill or Me)
    const q3Btns = document.querySelectorAll('.quiz-choice-btn[data-q="3"]');
    q3Btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.val;
        this.answers.q3 = val;
        q3Btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const reactEl = document.getElementById('quiz-q3-reaction');
        if (reactEl) {
          reactEl.style.display = 'block';
          if (val === 'Me') {
            reactEl.className = 'quiz-reaction-msg happy';
            reactEl.textContent = "Awwww! You just made my entire day! 🥰💜 You're the best!";
            if (window.birthdayApp) window.birthdayApp.triggerBurstConfetti(40);
          } else {
            reactEl.className = 'quiz-reaction-msg playful';
            reactEl.textContent = "Wait, Gill over me?! 😂🏏 Haha! He's a star batsman, but I'm your best buddy!";
          }
        }

        this.saveAnswers();
        this.updateProgress();
      });
    });

    // Choice Buttons: Q7 (Younger Brother or A Friend)
    const q7BrotherBtn = document.getElementById('quiz-q7-brother-btn');
    const q7FriendBtn = document.getElementById('quiz-q7-friend-btn');
    const q7Btns = [q7BrotherBtn, q7FriendBtn].filter(Boolean);

    if (q7BrotherBtn) {
      q7BrotherBtn.addEventListener('click', () => {
        this.answers.q7 = 'Younger Brother';
        q7Btns.forEach(b => b.classList.remove('active'));
        q7BrotherBtn.classList.add('active');

        // Sad emoji reaction requirements: "if she select brother provide any sad emoji"
        this.triggerSadEmojiRain();

        const reactEl = document.getElementById('quiz-q7-reaction');
        if (reactEl) {
          reactEl.style.display = 'block';
          reactEl.className = 'quiz-reaction-msg sad';
          reactEl.innerHTML = '🥺💔 <b>Aiyooo... Younger brother-ah?! Sed life 😭💔</b> Dil toot gaya! 🥺 (Are you sure? Try picking <b>A Friend</b> instead! 😜)';
        }

        if (window.app) {
          window.app.showToast('🥺💔 Younger brother?! My heart is weeping 😭', 2500);
        }

        this.saveAnswers();
        this.updateProgress();
      });
    }

    if (q7FriendBtn) {
      q7FriendBtn.addEventListener('click', () => {
        this.answers.q7 = 'A Friend';
        q7Btns.forEach(b => b.classList.remove('active'));
        q7FriendBtn.classList.add('active');

        const reactEl = document.getElementById('quiz-q7-reaction');
        if (reactEl) {
          reactEl.style.display = 'block';
          reactEl.className = 'quiz-reaction-msg happy';
          reactEl.innerHTML = '🥰✨ <b>Yesss! Best friends forever and ever!</b> 👫💜 That feels so right!';
        }

        if (window.birthdayApp) {
          window.birthdayApp.triggerBurstConfetti(50);
        }

        this.saveAnswers();
        this.updateProgress();
      });
    }

    // Choice Buttons: Q8 (Yes or No)
    const q8YesBtn = document.getElementById('quiz-q8-yes-btn');
    if (q8YesBtn) {
      q8YesBtn.addEventListener('click', () => {
        this.answers.q8 = 'Yes';
        q8YesBtn.classList.add('active');

        const reactEl = document.getElementById('quiz-q8-reaction');
        if (reactEl) {
          reactEl.style.display = 'block';
          reactEl.className = 'quiz-reaction-msg happy';
          reactEl.innerHTML = '📸 Yayyy! <b>Pinky promise!</b> Can\'t wait to see your pretty birthday pic! 🥰✨💜';
        }

        if (window.birthdayApp) {
          window.birthdayApp.triggerBurstConfetti(80);
        }

        this.saveAnswers();
        this.updateProgress();
      });
    }

    // Sync listener for partner updates
    setTimeout(() => {
      const sync = window.workspaceSync || window.wbSyncEngine;
      if (sync && sync.on) {
        sync.on('BDAY_QUIZ_ANSWERS', (data) => {
          if (data && data.answers && sync.userRole !== 'thanu') {
            try {
              localStorage.setItem('thanu_bday_quiz_answers_from_partner', JSON.stringify(data.answers));
            } catch (e) {}
            if (window.app) {
              window.app.showToast('💌 Thanu just submitted her birthday answers! ✨', 3500);
            }
          }
        });
      }
    }, 500);
  }

  /* Runaway Button Mechanics for Question 8 */
  initRunawayButton() {
    const noBtn = document.getElementById('quiz-q8-no-btn');
    const arena = document.getElementById('quiz-runaway-arena');
    if (!noBtn || !arena) return;

    let dodgeCount = 0;
    const dodge = (e) => {
      if (e) {
        if (e.type === 'touchstart') e.preventDefault();
        e.stopPropagation();
      }

      dodgeCount++;
      const arenaRect = arena.getBoundingClientRect();
      const btnRect = noBtn.getBoundingClientRect();

      // Safe bounds within the arena / card
      const maxDistX = Math.min(180, Math.max(50, (arenaRect.width / 2) - 40));
      const maxDistY = 35;

      // Flip side each dodge so it leaps dynamically
      const dirX = (dodgeCount % 2 === 0) ? 1 : -1;
      const offsetX = dirX * (55 + Math.random() * (maxDistX - 50));
      const offsetY = (Math.random() - 0.5) * maxDistY * 2;

      noBtn.style.transform = `translate(${offsetX}px, ${offsetY}px)`;

      const playfulToasts = [
        "Nope, you can't click No! 😜 Only Yes! 📸",
        "Haha nice try! Only Yes is allowed! 🥰",
        "Dodged! You gotta send the birthday pic! 📸✨",
        "Can't say No to RK! Click Yes! 💜"
      ];

      if (window.app && Math.random() > 0.4) {
        window.app.showToast(playfulToasts[dodgeCount % playfulToasts.length], 1400);
      }
    };

    noBtn.addEventListener('mouseenter', dodge);
    noBtn.addEventListener('mouseover', dodge);
    noBtn.addEventListener('touchstart', dodge, { passive: false });
    noBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dodge(e);
    });
  }

  /* Sad Emoji Particle Rain for Question 7 */
  triggerSadEmojiRain() {
    const emojis = ['🥺', '😭', '💔', '🥀', '🥺', '😿'];
    const count = 20;

    for (let i = 0; i < count; i++) {
      const span = document.createElement('span');
      span.className = 'sad-emoji-particle';
      span.textContent = emojis[Math.floor(Math.random() * emojis.length)];

      const x = Math.random() * (window.innerWidth - 60) + 30;
      const y = Math.random() * (window.innerHeight * 0.4) + 80;
      span.style.left = `${x}px`;
      span.style.top = `${y}px`;
      span.style.animationDelay = `${Math.random() * 0.4}s`;
      span.style.animationDuration = `${1.8 + Math.random() * 1.2}s`;

      document.body.appendChild(span);

      setTimeout(() => {
        if (span.parentNode) span.parentNode.removeChild(span);
      }, 3000);
    }
  }

  restoreAnswersToUI() {
    // Restore text inputs
    const q1Input = document.getElementById('quiz-q1-input');
    if (q1Input && this.answers.q1) q1Input.value = this.answers.q1;

    const q4Input = document.getElementById('quiz-q4-input');
    if (q4Input && this.answers.q4) q4Input.value = this.answers.q4;

    const q5Input = document.getElementById('quiz-q5-input');
    if (q5Input && this.answers.q5) q5Input.value = this.answers.q5;

    const q6Input = document.getElementById('quiz-q6-input');
    if (q6Input && this.answers.q6) q6Input.value = this.answers.q6;

    // Restore Q2
    if (this.answers.q2) {
      const btn = document.querySelector(`.quiz-choice-btn[data-q="2"][data-val="${this.answers.q2}"]`);
      if (btn) btn.classList.add('active');
    }

    // Restore Q3
    if (this.answers.q3) {
      const btn = document.querySelector(`.quiz-choice-btn[data-q="3"][data-val="${this.answers.q3}"]`);
      if (btn) btn.classList.add('active');
    }

    // Restore Q7
    if (this.answers.q7) {
      const btn = this.answers.q7 === 'Younger Brother' ? document.getElementById('quiz-q7-brother-btn') : document.getElementById('quiz-q7-friend-btn');
      if (btn) btn.classList.add('active');
    }

    // Restore Q8
    if (this.answers.q8 === 'Yes') {
      const btn = document.getElementById('quiz-q8-yes-btn');
      if (btn) btn.classList.add('active');
    }
  }

  updateProgress(celebrateIfNew = true) {
    const checks = {
      q1: Boolean(this.answers.q1 && this.answers.q1.length > 0),
      q2: Boolean(this.answers.q2),
      q3: Boolean(this.answers.q3),
      q4: Boolean(this.answers.q4 && this.answers.q4.length > 0),
      q5: Boolean(this.answers.q5 && this.answers.q5.length > 0),
      q6: Boolean(this.answers.q6 && this.answers.q6.length > 0),
      q7: Boolean(this.answers.q7),
      q8: Boolean(this.answers.q8)
    };

    let answered = 0;
    for (let i = 1; i <= 8; i++) {
      const key = `q${i}`;
      const itemEl = document.getElementById(`quiz-item-${i}`);
      if (checks[key]) {
        answered++;
        if (itemEl) itemEl.classList.add('answered');
      } else {
        if (itemEl) itemEl.classList.remove('answered');
      }
    }

    // Update Progress Bar & Counter
    const barEl = document.getElementById('quiz-progress-bar');
    const countEl = document.getElementById('quiz-progress-count');
    const badgeEl = document.getElementById('quiz-progress-badge');

    const pct = Math.round((answered / 8) * 100);
    if (barEl) barEl.style.width = `${pct}%`;
    if (countEl) countEl.textContent = `${answered} of 8 answered`;

    const lockIcon = document.getElementById('quiz-lock-icon');
    const unlockMsg = document.getElementById('quiz-unlock-msg');
    const welcomeBtn = document.getElementById('btn-welcome-workspace');

    if (answered === 8) {
      if (badgeEl) {
        badgeEl.textContent = 'Completed 🎉';
        badgeEl.className = 'quiz-progress-badge ready';
      }
      if (lockIcon) lockIcon.textContent = '🎉';
      if (unlockMsg) {
        unlockMsg.innerHTML = '✨ <b>Woohoo! All 8 questions completed!</b> Your workspace is now unlocked! 💜';
      }
      if (welcomeBtn) {
        welcomeBtn.style.display = 'inline-flex';
        welcomeBtn.classList.add('pulse-glow');
      }

      if (!this.allAnsweredUnlocked && celebrateIfNew) {
        this.allAnsweredUnlocked = true;
        if (window.birthdayApp) {
          window.birthdayApp.triggerBurstConfetti(120);
        }
        if (window.app) {
          window.app.showToast('🎉 All questions answered! Workspace unlocked! 🚀💜', 3500);
        }
      }
    } else {
      if (badgeEl) {
        badgeEl.textContent = 'In Progress ⏳';
        badgeEl.className = 'quiz-progress-badge';
      }
      if (lockIcon) lockIcon.textContent = '🔒';
      if (unlockMsg) {
        unlockMsg.textContent = `Answer all 8 questions above to unlock your workspace! (${answered}/8 completed)`;
      }
      if (welcomeBtn) {
        welcomeBtn.style.display = 'none';
      }
      this.allAnsweredUnlocked = false;
    }
  }

  enterWorkspace() {
    if (window.app) {
      window.app.enterWorkspace();
    }
  }
}

window.BirthdayCelebration = BirthdayCelebration;
window.BirthdayQuiz = BirthdayQuiz;
