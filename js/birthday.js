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

window.BirthdayCelebration = BirthdayCelebration;
