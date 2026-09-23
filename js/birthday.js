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

  /* 2. Floating Purple Hearts & Emojis Background Generator */
  initFloatingHearts() {
    const container = document.getElementById('floating-hearts-container');
    if (!container) return;

    const heartSymbols = ['💜', '✨', '🌸', '💜', '💖', '🎂', '💜', '👑', '🧁', '🎉'];

    const spawnHeart = (staggered = false) => {
      const heart = document.createElement('div');
      heart.className = 'floating-heart';
      heart.textContent = heartSymbols[Math.floor(Math.random() * heartSymbols.length)];
      heart.style.left = `${Math.random() * 95}%`;
      const duration = 6 + Math.random() * 6;
      heart.style.animationDuration = `${duration}s`;
      heart.style.fontSize = `${1.2 + Math.random() * 1.6}rem`;

      if (staggered) {
        // Disperse across the full viewport on initial load
        heart.style.animationDelay = `-${(Math.random() * duration).toFixed(2)}s`;
      }

      container.appendChild(heart);

      setTimeout(() => {
        if (heart.parentNode) heart.parentNode.removeChild(heart);
      }, duration * 1000 + 1000);
    };

    // Pre-populate 25 floating emojis spread across the screen immediately
    for (let i = 0; i < 25; i++) {
      spawnHeart(true);
    }

    // Continuously generate new floating hearts everywhere
    setInterval(() => {
      spawnHeart(false);
    }, 600);
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
    this.initAnswersModal();
    this.updateHeaderBadge();
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
      localStorage.setItem('thanu_bday_quiz_answers_timestamp', String(Date.now()));
    } catch (e) {}

    // Broadcast over sync so RK can see her answers in real time with retain!
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

        // Sad emoji reaction requirements: "if she select brother provide any sad emoji dont provide points"
        this.triggerSadEmojiRain();

        const reactEl = document.getElementById('quiz-q7-reaction');
        if (reactEl) {
          reactEl.style.display = 'block';
          reactEl.className = 'quiz-reaction-msg sad';
          reactEl.innerHTML = '🥺💔 <b>Aiyooo... Younger brother-ah?! Seddd life 😭💔</b> Dil toot gaya! 🥺<br><span style="color:#fecaca;font-weight:700;">🚫 No points for brother! Only "A Friend" earns points to unlock your workspace! 😜</span>';
        }

        if (window.app) {
          window.app.showToast('🥺💔 Younger brother?! No points for this! Sed life 😭', 2800);
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
          reactEl.innerHTML = '🥰✨ <b>Yesss! Best friends forever and ever!</b> 👫💜 Point earned! ✨';
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
          if (data && data.answers) {
            try {
              localStorage.setItem('thanu_bday_quiz_answers_from_partner', JSON.stringify(data.answers));
              if (data.timestamp) {
                localStorage.setItem('thanu_bday_quiz_answers_timestamp', String(data.timestamp));
              }
            } catch (e) {}

            this.updateHeaderBadge();
            this.renderAnswersModalContent();

            if (sync.userRole !== 'thanu') {
              if (window.app) {
                window.app.showToast('💌 Thanu just updated her birthday answers! ✨', 3500);
              }
            }
          }
        });

        // Request answers from partner if RK joins
        if (sync.requestQuizAnswers && sync.userRole !== 'thanu') {
          setTimeout(() => sync.requestQuizAnswers(), 1200);
        }
      }
    }, 600);
  }

  /* Runaway Button Mechanics for Question 8: Cursor Proximity Repulsion */
  initRunawayButton() {
    const noBtn = document.getElementById('quiz-q8-no-btn');
    const arena = document.getElementById('quiz-runaway-arena');
    const card = document.getElementById('quiz-item-8') || arena;
    if (!noBtn || !arena) return;

    let currentX = 0;
    let currentY = 0;
    let dodgeCount = 0;
    let lastDodgeTime = 0;

    const fleeFrom = (cursorX, cursorY, force = false) => {
      const now = Date.now();
      if (!force && now - lastDodgeTime < 50) return; // Ultra-responsive throttle

      const btnRect = noBtn.getBoundingClientRect();
      const btnCenterX = btnRect.left + btnRect.width / 2;
      const btnCenterY = btnRect.top + btnRect.height / 2;

      const diffX = cursorX - btnCenterX;
      const diffY = cursorY - btnCenterY;
      const dist = Math.hypot(diffX, diffY);

      // Detection radius: 150px! She cannot even bring the cursor near to it!
      const triggerRadius = 150;

      if (force || dist < triggerRadius) {
        lastDodgeTime = now;
        dodgeCount++;

        const contRect = (card || arena).getBoundingClientRect();
        const maxJumpX = Math.min(220, Math.max(60, (contRect.width / 2) - 40));
        const maxJumpY = 50;

        let moveX, moveY;
        if (dist === 0 || force) {
          moveX = (dodgeCount % 2 === 0 ? 1 : -1) * (90 + Math.random() * (maxJumpX - 90));
          moveY = (Math.random() - 0.5) * maxJumpY * 2;
        } else {
          // Push away in the opposite direction of the incoming cursor
          const factorX = -(diffX / dist);
          const factorY = -(diffY / dist);
          moveX = factorX * (110 + Math.random() * 40);
          moveY = factorY * (40 + Math.random() * 25);
        }

        currentX += moveX;
        currentY += moveY;

        // Wrap around if it goes beyond boundaries
        if (Math.abs(currentX) > maxJumpX) {
          currentX = -Math.sign(currentX) * (maxJumpX * 0.7);
        }
        if (Math.abs(currentY) > maxJumpY) {
          currentY = -Math.sign(currentY) * (maxJumpY * 0.7);
        }

        noBtn.style.transform = `translate(${currentX}px, ${currentY}px)`;
        noBtn.style.transition = 'transform 0.16s cubic-bezier(0.2, 0.9, 0.3, 1.2)';

        const playfulToasts = [
          "Nope, you can't click No! 😜 Only Yes! 📸",
          "Haha nice try! Only Yes is allowed! 🥰",
          "Dodged! You gotta send the birthday pic! 📸✨",
          "Can't bring cursor near No! Click Yes! 💜"
        ];

        if (window.app && Math.random() > 0.6) {
          window.app.showToast(playfulToasts[dodgeCount % playfulToasts.length], 1200);
        }
      }
    };

    // Track cursor proximity across the entire document
    window.addEventListener('mousemove', (e) => {
      fleeFrom(e.clientX, e.clientY);
    });

    window.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) {
        fleeFrom(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches[0]) {
        fleeFrom(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    noBtn.addEventListener('mouseenter', (e) => {
      fleeFrom(e.clientX, e.clientY, true);
    });

    noBtn.addEventListener('mouseover', (e) => {
      fleeFrom(e.clientX, e.clientY, true);
    });

    noBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      fleeFrom(e.clientX, e.clientY, true);
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
      q7: Boolean(this.answers.q7 === 'A Friend'), // "if she choose brother provide only sad emoji dont provide points"
      q8: Boolean(this.answers.q8 === 'Yes')
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

  /* --------------------------------------------------------------------------
     Answers Viewer Modal Controller & UI Renderer for RK
     -------------------------------------------------------------------------- */
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
    if (headerPill) headerPill.addEventListener('click', () => this.openAnswersModal());
    if (hubLink) hubLink.addEventListener('click', () => this.openAnswersModal());

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeAnswersModal();
      });
    }

    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        const sync = window.workspaceSync || window.wbSyncEngine;
        if (sync && sync.requestQuizAnswers) {
          sync.requestQuizAnswers();
        }
        this.renderAnswersModalContent();
        if (window.app) {
          window.app.showToast('🔄 Refreshed answers from Cloud! ✨', 2000);
        }
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', () => this.copyAnswers());
    }

    if (waBtn) {
      waBtn.addEventListener('click', () => this.sendAnswersToWhatsApp());
    }
  }

  openAnswersModal() {
    const modal = document.getElementById('quiz-answers-modal');
    if (!modal) return;
    this.renderAnswersModalContent();
    modal.classList.add('active');

    // Request fresh state from partner over sync if available
    const sync = window.workspaceSync || window.wbSyncEngine;
    if (sync && sync.requestQuizAnswers) {
      sync.requestQuizAnswers();
    }
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
      const l = localStorage.getItem(this.storageKey);
      if (l) localAnswers = JSON.parse(l);
    } catch (e) {}

    try {
      timestamp = localStorage.getItem('thanu_bday_quiz_answers_timestamp');
    } catch (e) {}

    const sync = window.workspaceSync || window.wbSyncEngine;
    const isRK = !sync || sync.userRole !== 'thanu';

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
    if (!badge || !headerBtn) return;

    if (data.count > 0) {
      badge.style.display = 'inline-block';
      badge.textContent = `${data.count}/8`;
      if (data.count === 8) {
        badge.style.background = '#10b981';
        badge.style.color = '#ffffff';
      } else {
        badge.style.background = '#8b5cf6';
        badge.style.color = '#ffffff';
      }
    } else {
      badge.style.display = 'none';
    }
  }

  renderAnswersModalContent() {
    const container = document.getElementById('quiz-answers-list-container');
    const statusText = document.getElementById('quiz-modal-status-text');
    const statusDot = document.getElementById('quiz-modal-status-dot');
    const statusTag = document.getElementById('quiz-modal-status-tag');
    const subtitle = document.getElementById('quiz-modal-subtitle');
    const footerTime = document.getElementById('quiz-modal-footer-time');

    const data = this.getAnswersData();
    const a = data.answers || {};

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
        subtitle.textContent = '💌 Live answers received from Thanu\'s device';
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
          if (v === 'Dad') return '<span class="choice-tag dad">💙 Dad (Daddy\'s strongest girl! 🌟)</span>';
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
        title: "8. Will you send me your birthday pic?",
        key: 'q8',
        type: 'choice',
        renderChoice: (v) => {
          if (!v) return '<span class="empty-ans">Not chosen yet...</span>';
          return '<span class="choice-tag yes">📸 Yes, Of Course! 🥰 (Pinky Promise!)</span>';
        }
      }
    ];

    let html = '';
    questionsMeta.forEach(q => {
      const val = a[q.key] ? String(a[q.key]).trim() : '';
      const hasVal = Boolean(val.length > 0);

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

    const text = `🎂💖 *Thanu's Birthday Questionnaire Answers!* 💖🎂\n\n` +
      `1️⃣ *Hotspot Password:*\n👉 ${a.q1 || '(Not answered yet)'}\n\n` +
      `2️⃣ *Who do you love more—Mom or Dad?*\n👉 ${a.q2 || '(Not chosen yet)'}\n\n` +
      `3️⃣ *Who do you like the most—Gill or Me?*\n👉 ${a.q3 || '(Not chosen yet)'} ${a.q3 === 'Me' ? '🥰💜' : '🏏'}\n\n` +
      `4️⃣ *One thing you like about me:*\n👉 ${a.q4 || '(Not answered yet)'}\n\n` +
      `5️⃣ *One thing you don't like about me:*\n👉 ${a.q5 || '(Not answered yet)'}\n\n` +
      `6️⃣ *Most memorable moment with me:*\n👉 ${a.q6 || '(Not answered yet)'}\n\n` +
      `7️⃣ *Who am I to you—Younger brother or Friend?*\n👉 ${a.q7 || '(Not chosen yet)'} ${a.q7 === 'A Friend' ? '👫✨' : '🥺'}\n\n` +
      `8️⃣ *Will you send me your birthday pic?*\n👉 ${a.q8 || '(Not chosen yet)'} 📸✨\n\n` +
      `✨ _Thanu's Birthday Workspace_ 💜`;

    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  }

  copyAnswers() {
    const data = this.getAnswersData();
    const a = data.answers || {};

    const text = `🎂💖 Thanu's Birthday Questionnaire Answers! 💖🎂\n\n` +
      `1. What's your hotspot password?\n   -> ${a.q1 || '(Not answered)'}\n\n` +
      `2. Who do you love more—Mom or Dad?\n   -> ${a.q2 || '(Not answered)'}\n\n` +
      `3. Who do you like the most—Gill or Me?\n   -> ${a.q3 || '(Not answered)'}\n\n` +
      `4. What is one thing you like about me?\n   -> ${a.q4 || '(Not answered)'}\n\n` +
      `5. What is one thing you don't like about me?\n   -> ${a.q5 || '(Not answered)'}\n\n` +
      `6. Most memorable moment you've had with me?\n   -> ${a.q6 || '(Not answered)'}\n\n` +
      `7. Who am I to you—a younger brother or a friend?\n   -> ${a.q7 || '(Not answered)'}\n\n` +
      `8. Will you send me your birthday pic?\n   -> ${a.q8 || '(Not answered)'}\n\n` +
      `✨ Thanu's Birthday Workspace 💜`;

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
