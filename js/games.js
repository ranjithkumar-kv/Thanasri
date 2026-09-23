/* ==========================================================================
   Thanu's WorkSpace - Stress Buster Games Engine
   Module: "Pass the Time" (Stress Buster)
   XO Game, Typing Game, Bubble Wrap Popper
   ========================================================================== */

class GamesHub {
  constructor() {
    this.activeGame = 'xo';
    this.initTabs();
    this.initXOGame();
    this.initTypingGame();
    this.initWordBridge();
    this.initSyncListeners();
  }

  initTabs() {
    const tabs = document.querySelectorAll('.game-tab-btn');
    const panels = document.querySelectorAll('.game-panel');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        const targetId = tab.dataset.game;
        this.activeGame = targetId;
        const targetPanel = document.getElementById(`game-${targetId}`);
        if (targetPanel) {
          targetPanel.classList.add('active');
        }
      });
    });
  }

  /* ==========================================================================
     1. XO GAME (Tic-Tac-Toe with Online 2-Device, 2P Local, and AI modes)
     ========================================================================== */
  initXOGame() {
    this.xoBoard = Array(9).fill(null);
    this.xoCurrentPlayer = 'X'; // X: Blue Heart / Classic X, O: Purple Heart / Classic O
    this.xoMode = 'online'; // 'online', 'pvp', or 'ai'
    this.xoGameActive = true;
    this.scores = { x: 0, o: 0, ties: 0 };
    this.xoSymbolTheme = 'hearts'; // 'hearts' (💙 & 💜) or 'classic' (❌ & ⭕)

    this.winningCombos = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];

    const cells = document.querySelectorAll('.xo-cell');
    cells.forEach(cell => {
      cell.addEventListener('click', () => {
        const index = parseInt(cell.dataset.index, 10);
        this.handleXOMove(index);
      });
    });

    const resetBtn = document.getElementById('xo-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetXORound(true));
    }

    // Symbol Theme Toggle Button (Hearts 💙💜 vs Classic ❌⭕)
    const themeBtn = document.getElementById('xo-theme-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        this.toggleXOSymbolTheme(true);
      });
    }

    // Mode toggle buttons
    const modeOnlineBtn = document.getElementById('xo-mode-online');
    const modePvpBtn = document.getElementById('xo-mode-pvp');
    const modeAiBtn = document.getElementById('xo-mode-ai');

    if (modeOnlineBtn) {
      modeOnlineBtn.addEventListener('click', () => {
        this.xoMode = 'online';
        modeOnlineBtn.classList.add('active');
        if (modePvpBtn) modePvpBtn.classList.remove('active');
        if (modeAiBtn) modeAiBtn.classList.remove('active');
        this.resetXORound(true);
        if (window.app) window.app.showToast('Online 2-Device Mode Active 👫💜');
      });
    }

    if (modePvpBtn) {
      modePvpBtn.addEventListener('click', () => {
        this.xoMode = 'pvp';
        modePvpBtn.classList.add('active');
        if (modeOnlineBtn) modeOnlineBtn.classList.remove('active');
        if (modeAiBtn) modeAiBtn.classList.remove('active');
        this.resetXORound(false);
      });
    }

    if (modeAiBtn) {
      modeAiBtn.addEventListener('click', () => {
        this.xoMode = 'ai';
        modeAiBtn.classList.add('active');
        if (modeOnlineBtn) modeOnlineBtn.classList.remove('active');
        if (modePvpBtn) modePvpBtn.classList.remove('active');
        this.resetXORound(false);
      });
    }

    this.setXOSymbolTheme(this.xoSymbolTheme, false);
    this.updateXOTurnIndicator();
  }

  getMyXOPiece() {
    const sync = window.workspaceSync || window.wbSyncEngine;
    if (sync && sync.userRole === 'thanu') {
      return 'O'; // Thanu plays as Purple Heart / Classic O
    }
    return 'X'; // RK plays as Blue Heart / Classic X
  }

  getXOSymbol(player) {
    if (this.xoSymbolTheme === 'classic') {
      return player === 'X' ? '❌' : '⭕';
    }
    return player === 'X' ? '💙' : '💜';
  }

  toggleXOSymbolTheme(broadcast = true) {
    const nextTheme = this.xoSymbolTheme === 'hearts' ? 'classic' : 'hearts';
    this.setXOSymbolTheme(nextTheme, broadcast);
  }

  setXOSymbolTheme(theme, broadcast = true) {
    this.xoSymbolTheme = (theme === 'classic') ? 'classic' : 'hearts';

    // Update Theme Toggle Button UI
    const iconEl = document.getElementById('xo-theme-icon');
    const labelEl = document.getElementById('xo-theme-label');
    if (iconEl && labelEl) {
      if (this.xoSymbolTheme === 'classic') {
        iconEl.textContent = '❌⭕';
        labelEl.textContent = 'Classic XO';
      } else {
        iconEl.textContent = '💙💜';
        labelEl.textContent = 'Hearts';
      }
    }

    // Update Scoreboard player labels
    const scoreLabelX = document.getElementById('xo-score-label-x');
    const scoreLabelO = document.getElementById('xo-score-label-o');
    if (scoreLabelX) {
      scoreLabelX.textContent = this.xoSymbolTheme === 'classic' ? '❌ RK' : '💙 RK';
    }
    if (scoreLabelO) {
      scoreLabelO.textContent = this.xoSymbolTheme === 'classic' ? '⭕ Thanu' : '💜 Thanu';
    }

    // Refresh existing moves on the board
    if (this.xoBoard) {
      this.xoBoard.forEach((player, idx) => {
        if (player) {
          const cell = document.querySelector(`.xo-cell[data-index="${idx}"]`);
          if (cell) {
            const sym = this.getXOSymbol(player);
            const markerClass = player === 'X' ? 'xo-marker-x' : 'xo-marker-o';
            cell.innerHTML = `<span class="${markerClass}">${sym}</span>`;
          }
        }
      });
    }

    // Update turn indicator
    this.updateXOTurnIndicator();

    // Sync theme change across devices in online mode
    if (broadcast && this.xoMode === 'online') {
      const sync = window.workspaceSync || window.wbSyncEngine;
      if (sync && sync.sendXOTheme) {
        sync.sendXOTheme(this.xoSymbolTheme);
      }
    }

    if (window.app && broadcast) {
      const modeName = this.xoSymbolTheme === 'classic' ? 'Classic (❌ & ⭕)' : 'Hearts (💙 & 💜)';
      window.app.showToast(`Switched XO symbols to ${modeName}! ✨`);
    }
  }

  handleXOMove(index) {
    if (!this.xoGameActive || this.xoBoard[index] !== null) return;

    // In Online Mode, verify it's this device's turn
    if (this.xoMode === 'online') {
      const myPiece = this.getMyXOPiece();
      if (this.xoCurrentPlayer !== myPiece) {
        const sync = window.workspaceSync || window.wbSyncEngine;
        const partner = sync ? sync.getPartnerDisplayName() : 'Partner';
        if (window.app) window.app.showToast(`It's ${partner}'s turn right now! ⏳💜`);
        return;
      }
    }

    this.makeMove(index, this.xoCurrentPlayer);

    const winner = this.checkXOWinner();
    if (winner) {
      if (this.xoMode === 'online') {
        const sync = window.workspaceSync || window.wbSyncEngine;
        if (sync) sync.sendXOMove(index, this.xoCurrentPlayer, null);
      }
      this.handleXOWin(winner);
      return;
    }

    if (this.xoBoard.every(cell => cell !== null)) {
      if (this.xoMode === 'online') {
        const sync = window.workspaceSync || window.wbSyncEngine;
        if (sync) sync.sendXOMove(index, this.xoCurrentPlayer, null);
      }
      this.handleXOTie();
      return;
    }

    // Switch player
    const nextPlayer = this.xoCurrentPlayer === 'X' ? 'O' : 'X';
    if (this.xoMode === 'online') {
      const sync = window.workspaceSync || window.wbSyncEngine;
      if (sync) sync.sendXOMove(index, this.xoCurrentPlayer, nextPlayer);
    }

    this.xoCurrentPlayer = nextPlayer;
    this.updateXOTurnIndicator();

    // If AI mode and it's O's turn
    if (this.xoMode === 'ai' && this.xoCurrentPlayer === 'O' && this.xoGameActive) {
      setTimeout(() => this.makeAIMove(), 350);
    }
  }

  handleRemoteXOMove(data) {
    if (!data || data.index === undefined) return;
    if (!this.xoGameActive || this.xoBoard[data.index] !== null) return;

    this.makeMove(data.index, data.player);

    const winner = this.checkXOWinner();
    if (winner) {
      this.handleXOWin(winner);
      return;
    }

    if (this.xoBoard.every(cell => cell !== null)) {
      this.handleXOTie();
      return;
    }

    this.xoCurrentPlayer = data.nextPlayer || (data.player === 'X' ? 'O' : 'X');
    this.updateXOTurnIndicator();
  }

  handleRemoteXOReset(data) {
    this.resetXORound(false);
    if (window.app) window.app.showToast('Partner started a new XO round! 🔄✨');
  }

  makeMove(index, player) {
    this.xoBoard[index] = player;
    const cell = document.querySelector(`.xo-cell[data-index="${index}"]`);
    if (cell) {
      cell.classList.add('taken');
      const symbol = this.getXOSymbol(player);
      const markerClass = player === 'X' ? 'xo-marker-x' : 'xo-marker-o';
      cell.innerHTML = `<span class="${markerClass}">${symbol}</span>`;
    }
  }

  makeAIMove() {
    if (!this.xoGameActive) return;

    // AI logic: check win, then block opponent, else center or random
    let bestMove = this.findBestMove();
    if (bestMove === -1) {
      const emptyIndices = this.xoBoard.map((val, idx) => val === null ? idx : null).filter(val => val !== null);
      if (emptyIndices.length > 0) {
        bestMove = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      }
    }

    if (bestMove !== -1) {
      this.makeMove(bestMove, 'O');

      const winner = this.checkXOWinner();
      if (winner) {
        this.handleXOWin(winner);
        return;
      }

      if (this.xoBoard.every(cell => cell !== null)) {
        this.handleXOTie();
        return;
      }

      this.xoCurrentPlayer = 'X';
      this.updateXOTurnIndicator();
    }
  }

  findBestMove() {
    // 1. Can AI win in 1 move?
    for (const combo of this.winningCombos) {
      const [a, b, c] = combo;
      if (this.xoBoard[a] === 'O' && this.xoBoard[b] === 'O' && this.xoBoard[c] === null) return c;
      if (this.xoBoard[a] === 'O' && this.xoBoard[c] === 'O' && this.xoBoard[b] === null) return b;
      if (this.xoBoard[b] === 'O' && this.xoBoard[c] === 'O' && this.xoBoard[a] === null) return a;
    }

    // 2. Can player win in 1 move? Block them!
    for (const combo of this.winningCombos) {
      const [a, b, c] = combo;
      if (this.xoBoard[a] === 'X' && this.xoBoard[b] === 'X' && this.xoBoard[c] === null) return c;
      if (this.xoBoard[a] === 'X' && this.xoBoard[c] === 'X' && this.xoBoard[b] === null) return b;
      if (this.xoBoard[b] === 'X' && this.xoBoard[c] === 'X' && this.xoBoard[a] === null) return a;
    }

    // 3. Take center if available
    if (this.xoBoard[4] === null) return 4;

    return -1;
  }

  checkXOWinner() {
    for (const combo of this.winningCombos) {
      const [a, b, c] = combo;
      if (this.xoBoard[a] && this.xoBoard[a] === this.xoBoard[b] && this.xoBoard[a] === this.xoBoard[c]) {
        return { winner: this.xoBoard[a], line: combo };
      }
    }
    return null;
  }

  handleXOWin(winData) {
    this.xoGameActive = false;
    winData.line.forEach(index => {
      const cell = document.querySelector(`.xo-cell[data-index="${index}"]`);
      if (cell) cell.classList.add('winner-cell');
    });

    const indicator = document.getElementById('xo-turn-indicator');
    const xSym = this.getXOSymbol('X');
    const oSym = this.getXOSymbol('O');

    if (winData.winner === 'X') {
      this.scores.x++;
      const name = this.xoMode === 'online' ? (window.workspaceSync?.userRole === 'thanu' ? `RK ${xSym}` : `You (RK ${xSym})`) : `RK ${xSym}`;
      if (indicator) indicator.innerHTML = `🎉 <b style="color:#0284c7">${name} Wins!</b>`;
    } else {
      this.scores.o++;
      const name = this.xoMode === 'ai' ? `Bot ${oSym}` : (this.xoMode === 'online' ? (window.workspaceSync?.userRole === 'thanu' ? `You (Thanu ${oSym})` : `Thanu ${oSym}`) : `Thanu ${oSym}`);
      if (indicator) indicator.innerHTML = `🎉 <b style="color:var(--purple-600)">${name} Wins!</b>`;
    }

    this.updateXOScores();

    // Confetti celebration
    if (window.birthdayApp) {
      window.birthdayApp.triggerBurstConfetti();
    }
  }

  handleXOTie() {
    this.xoGameActive = false;
    this.scores.ties++;
    const indicator = document.getElementById('xo-turn-indicator');
    if (indicator) indicator.innerHTML = '🤝 <b>It\'s a Cute Tie! Well played!</b>';
    this.updateXOScores();
  }

  updateXOTurnIndicator() {
    const indicator = document.getElementById('xo-turn-indicator');
    if (!indicator || !this.xoGameActive) return;

    const xSym = this.getXOSymbol('X');
    const oSym = this.getXOSymbol('O');

    if (this.xoMode === 'online') {
      const myPiece = this.getMyXOPiece();
      const isMyTurn = this.xoCurrentPlayer === myPiece;
      const sync = window.workspaceSync || window.wbSyncEngine;
      const partner = sync ? sync.getPartnerDisplayName() : 'Partner';

      if (isMyTurn) {
        const mySym = this.getXOSymbol(myPiece);
        const myName = myPiece === 'X' ? `RK ${mySym}` : `Thanu ${mySym}`;
        indicator.innerHTML = `✨ <b>Your Turn!</b> Play with ${myName}`;
        indicator.style.background = 'var(--purple-100)';
        indicator.style.color = 'var(--purple-900)';
      } else {
        indicator.innerHTML = `⏳ <b>${partner}'s Turn</b> (Waiting for move...)`;
        indicator.style.background = '#fefce8';
        indicator.style.color = '#854d0e';
      }
    } else {
      indicator.style.background = '';
      indicator.style.color = '';
      if (this.xoCurrentPlayer === 'X') {
        indicator.innerHTML = `${xSym} RK's Turn (Player 1)`;
      } else {
        const opp = this.xoMode === 'ai' ? 'Bot thinking...' : `Thanu ${oSym}`;
        indicator.innerHTML = `${oSym} Thanu's Turn (${opp})`;
      }
    }
  }

  updateXOScores() {
    const scoreXEl = document.getElementById('xo-score-x');
    const scoreOEl = document.getElementById('xo-score-o');
    const scoreTiesEl = document.getElementById('xo-score-ties');

    if (scoreXEl) scoreXEl.textContent = this.scores.x;
    if (scoreOEl) scoreOEl.textContent = this.scores.o;
    if (scoreTiesEl) scoreTiesEl.textContent = this.scores.ties;
  }

  resetXORound(broadcast = true) {
    this.xoBoard = Array(9).fill(null);
    this.xoCurrentPlayer = 'X';
    this.xoGameActive = true;

    const cells = document.querySelectorAll('.xo-cell');
    cells.forEach(cell => {
      cell.classList.remove('taken', 'winner-cell');
      cell.innerHTML = '';
    });

    this.updateXOTurnIndicator();

    if (broadcast && this.xoMode === 'online') {
      const sync = window.workspaceSync || window.wbSyncEngine;
      if (sync) sync.sendXOReset('X');
    }
  }

  /* ==========================================================================
     2. TYPING GAME (Speed & Mindful Stress Buster)
     ========================================================================== */
  initTypingGame() {
    this.passages = [
      "Happy Birthday Cuteuhhh! May your year be filled with boundless joy, purple blossoms, and all your sweetest dreams coming true.",
      "Take a deep breath and let all stress melt away. You are resilient, brilliant, and deeply cherished by everyone who knows you.",
      "Learning a new language is opening a magical doorway to a whole new world. Every single day brings new steps of wisdom."
    ];

    this.currentPassageIndex = 0;
    this.currentPassage = this.passages[0];
    this.charIndex = 0;
    this.mistakes = 0;
    this.timer = null;
    this.timeLeft = 60;
    this.isTyping = false;

    this.passageBox = document.getElementById('typing-passage-box');
    this.typingInput = document.getElementById('typing-input-field');
    this.wpmEl = document.getElementById('typing-wpm');
    this.accEl = document.getElementById('typing-acc');
    this.timerEl = document.getElementById('typing-timer');
    this.restartBtn = document.getElementById('typing-restart-btn');

    if (this.typingInput) {
      this.typingInput.addEventListener('input', () => this.handleTypingInput());
    }

    if (this.restartBtn) {
      this.restartBtn.addEventListener('click', () => this.resetTypingGame());
    }

    this.loadPassage();
  }

  loadPassage() {
    if (!this.passageBox) return;
    this.currentPassage = this.passages[this.currentPassageIndex % this.passages.length];
    this.passageBox.innerHTML = '';

    this.currentPassage.split('').forEach((char, idx) => {
      const span = document.createElement('span');
      span.textContent = char;
      if (idx === 0) span.classList.add('current');
      this.passageBox.appendChild(span);
    });

    this.charIndex = 0;
    this.mistakes = 0;
    if (this.typingInput) {
      this.typingInput.value = '';
      this.typingInput.disabled = false;
    }
  }

  handleTypingInput() {
    const characters = this.passageBox.querySelectorAll('span');
    const typedVal = this.typingInput.value;
    const typedChar = typedVal.slice(-1);

    if (!this.isTyping) {
      this.isTyping = true;
      this.startTime = Date.now();
      this.startTimer();
    }

    if (this.charIndex < characters.length) {
      const currentChar = characters[this.charIndex].textContent;

      if (typedChar === currentChar) {
        characters[this.charIndex].classList.add('correct');
        characters[this.charIndex].classList.remove('wrong', 'current');
      } else {
        characters[this.charIndex].classList.add('wrong');
        characters[this.charIndex].classList.remove('current');
        this.mistakes++;
      }

      this.charIndex++;

      if (this.charIndex < characters.length) {
        characters[this.charIndex].classList.add('current');
      } else {
        // Finished passage!
        this.finishTypingGame();
      }

      // Calculate live WPM & Accuracy
      const elapsedMinutes = (Date.now() - this.startTime) / 60000;
      const wpm = Math.round((this.charIndex / 5) / (elapsedMinutes || 0.001));
      const accuracy = Math.max(0, Math.round(((this.charIndex - this.mistakes) / this.charIndex) * 100));

      if (this.wpmEl) this.wpmEl.textContent = isFinite(wpm) ? wpm : 0;
      if (this.accEl) this.accEl.textContent = `${accuracy}%`;
    }
  }

  startTimer() {
    this.timer = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
        if (this.timerEl) this.timerEl.textContent = `${this.timeLeft}s`;
      } else {
        this.finishTypingGame();
      }
    }, 1000);
  }

  finishTypingGame() {
    clearInterval(this.timer);
    if (this.typingInput) this.typingInput.disabled = true;

    if (window.birthdayApp) {
      window.birthdayApp.triggerBurstConfetti();
    }
    if (window.app) {
      window.app.showToast('Superb Typing speed Cuteuhhh! 💜');
    }
  }

  resetTypingGame() {
    clearInterval(this.timer);
    this.timeLeft = 60;
    this.isTyping = false;
    this.currentPassageIndex++;
    if (this.timerEl) this.timerEl.textContent = '60s';
    if (this.wpmEl) this.wpmEl.textContent = '0';
    if (this.accEl) this.accEl.textContent = '100%';
    this.loadPassage();
  }

  /* ==========================================================================
     3. WORD BRIDGE (Start & End Letter Challenge)
     ========================================================================== */
  initWordBridge() {
    this.wbDict = new Set(window.WORD_DICTIONARY || [
      'start', 'smart', 'sweet', 'sunset', 'street', 'secret', 'sport', 'sight', 'shirt', 'suit',
      'purple', 'peace', 'promise', 'phone', 'price', 'please', 'profile', 'praise', 'pride', 'pale',
      'cute', 'cake', 'circle', 'care', 'choice', 'coffee', 'candle', 'change', 'code',
      'birthday', 'baby', 'beauty', 'busy', 'bravery', 'battery', 'body',
      'love', 'life', 'little', 'lake', 'line', 'language', 'large', 'late', 'live',
      'heart', 'hat', 'heat', 'height', 'honest', 'habit', 'hunt',
      'smile', 'style', 'scale', 'scene', 'shore', 'share', 'stone', 'space', 'score',
      'dream', 'diagram', 'drum', 'domain'
    ]);

    this.wbPairs = window.WORD_PAIRS || {
      's-t': ['start', 'smart', 'sweet', 'sunset', 'street', 'secret', 'sport', 'sight', 'shirt', 'suit'],
      'p-e': ['purple', 'peace', 'promise', 'phone', 'price', 'please', 'profile', 'praise', 'pride'],
      'c-e': ['cute', 'cake', 'circle', 'care', 'choice', 'coffee', 'candle', 'change', 'code'],
      'b-y': ['birthday', 'baby', 'beauty', 'busy', 'bravery', 'battery', 'body'],
      'l-e': ['love', 'life', 'little', 'lake', 'line', 'language', 'large', 'late', 'live'],
      'h-t': ['heart', 'hat', 'heat', 'height', 'honest', 'habit', 'hunt'],
      's-e': ['smile', 'style', 'scale', 'scene', 'shore', 'share', 'stone', 'space', 'score'],
      'd-m': ['dream', 'diagram', 'drum', 'domain']
    };

    this.wbPairKeys = Object.keys(this.wbPairs);
    this.wbCurrentKey = '';
    this.wbStartChar = '';
    this.wbEndChar = '';
    this.wbFoundWordsForPair = new Map(); // word -> finder name
    this.wbAllFoundWords = [];
    this.wbScore = 0;
    this.wbStreak = 0;
    this.wbBestStreak = 0;

    this.wbStartEl = document.getElementById('wb-start-letter');
    this.wbEndEl = document.getElementById('wb-end-letter');
    this.wbInputEl = document.getElementById('wb-word-input');
    this.wbSubmitForm = document.getElementById('wb-submit-form');
    this.wbNextBtn = document.getElementById('wb-next-pair-btn');
    this.wbHintBtn = document.getElementById('wb-hint-btn');
    this.wbResetBtn = document.getElementById('wb-reset-btn');
    this.wbFeedbackEl = document.getElementById('wb-feedback');
    this.wbFoundContainer = document.getElementById('wb-found-chips');
    this.wbPairTagEl = document.getElementById('wb-current-pair-tag');
    this.wbPairFoundCountEl = document.getElementById('wb-pair-found-count');
    this.wbWordsCountEl = document.getElementById('wb-words-count');
    this.wbScoreEl = document.getElementById('wb-score');
    this.wbStreakEl = document.getElementById('wb-streak');
    this.wbBestStreakEl = document.getElementById('wb-best-streak');

    if (!this.wbInputEl) return;

    // Form submission
    if (this.wbSubmitForm) {
      this.wbSubmitForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitWordBridgeAnswer();
      });
    }

    if (this.wbNextBtn) {
      this.wbNextBtn.addEventListener('click', () => {
        this.newWordBridgePair(true);
      });
    }

    if (this.wbHintBtn) {
      this.wbHintBtn.addEventListener('click', () => {
        this.giveWordBridgeHint();
      });
    }

    if (this.wbResetBtn) {
      this.wbResetBtn.addEventListener('click', () => {
        this.resetWordBridgeGame(false);
      });
    }

    // Auto-uppercase sanitize
    this.wbInputEl.addEventListener('input', () => {
      this.wbInputEl.value = this.wbInputEl.value.replace(/[^a-zA-Z]/g, '').toUpperCase();
    });

    // Start first round
    this.newWordBridgePair(false);
  }

  newWordBridgePair(userInitiated = false, isRemote = false, remoteData = null) {
    if (isRemote && remoteData) {
      this.wbStartChar = remoteData.startChar.toUpperCase();
      this.wbEndChar = remoteData.endChar.toUpperCase();
      this.wbCurrentKey = remoteData.pairKey;
    } else {
      if (!this.wbPairKeys || this.wbPairKeys.length === 0) return;

      let nextKey = this.wbCurrentKey;
      let attempts = 0;
      while ((nextKey === this.wbCurrentKey || !nextKey) && attempts < 20) {
        nextKey = this.wbPairKeys[Math.floor(Math.random() * this.wbPairKeys.length)];
        attempts++;
      }

      this.wbCurrentKey = nextKey;
      const parts = nextKey.split('-');
      this.wbStartChar = parts[0].toUpperCase();
      this.wbEndChar = parts[1].toUpperCase();

      if (userInitiated) {
        const sync = window.workspaceSync || window.wbSyncEngine;
        if (sync && sync.sendWordPair) {
          sync.sendWordPair(this.wbStartChar, this.wbEndChar, this.wbCurrentKey);
        }
      }
    }

    if (this.wbStartEl) this.wbStartEl.textContent = this.wbStartChar;
    if (this.wbEndEl) this.wbEndEl.textContent = this.wbEndChar;
    if (this.wbPairTagEl) this.wbPairTagEl.textContent = `${this.wbStartChar} ... ${this.wbEndChar}`;

    this.wbFoundWordsForPair.clear();
    this.renderWordBridgeChips();

    if (this.wbInputEl) {
      this.wbInputEl.value = '';
      this.wbInputEl.placeholder = `Word starting with "${this.wbStartChar}" and ending with "${this.wbEndChar}"...`;
      this.wbInputEl.focus();
    }

    if (this.wbFeedbackEl) {
      if (userInitiated) {
        this.setWordBridgeFeedback(`🔀 New letter pair: ${this.wbStartChar} ... ${this.wbEndChar}! What word can you think of?`, 'info');
      } else if (isRemote) {
        const sync = window.workspaceSync || window.wbSyncEngine;
        const partner = sync ? sync.getPartnerDisplayName() : 'Partner';
        this.setWordBridgeFeedback(`🔀 ${partner} loaded a new letter pair: ${this.wbStartChar} ... ${this.wbEndChar}!`, 'info');
      } else {
        this.wbFeedbackEl.className = 'wb-feedback-box';
        this.wbFeedbackEl.textContent = '';
      }
    }
  }

  handleRemoteWordPair(data) {
    if (!data || !data.startChar || !data.endChar) return;
    this.newWordBridgePair(false, true, data);
  }

  async submitWordBridgeAnswer() {
    if (!this.wbInputEl) return;
    const rawVal = this.wbInputEl.value.trim().toLowerCase();

    if (!rawVal) {
      this.setWordBridgeFeedback('Please type a word first! 😊', 'warning');
      this.shakeWordBridgeInput();
      return;
    }

    const startLower = this.wbStartChar.toLowerCase();
    const endLower = this.wbEndChar.toLowerCase();

    // 1. Minimum length
    if (rawVal.length < 3) {
      this.setWordBridgeFeedback('Word must be at least 3 letters long! 📏', 'warning');
      this.shakeWordBridgeInput();
      return;
    }

    // 2. Starts with correct letter
    if (!rawVal.startsWith(startLower)) {
      this.setWordBridgeFeedback(`Word must START with "${this.wbStartChar}"! You typed "${rawVal[0].toUpperCase()}"`, 'warning');
      this.shakeWordBridgeInput();
      return;
    }

    // 3. Ends with correct letter
    if (!rawVal.endsWith(endLower)) {
      this.setWordBridgeFeedback(`Word must END with "${this.wbEndChar}"! You typed "${rawVal[rawVal.length - 1].toUpperCase()}"`, 'warning');
      this.shakeWordBridgeInput();
      return;
    }

    // 4. Duplicate check for this pair
    if (this.wbFoundWordsForPair.has(rawVal)) {
      const finder = this.wbFoundWordsForPair.get(rawVal);
      this.setWordBridgeFeedback(`"${rawVal.toUpperCase()}" was already found by ${finder}! Can you think of another? 💡`, 'info');
      this.wbInputEl.select();
      return;
    }

    // 5. Dictionary validity check
    let isValid = this.wbDict.has(rawVal);

    if (!isValid && this.wbPairs[this.wbCurrentKey] && this.wbPairs[this.wbCurrentKey].includes(rawVal)) {
      isValid = true;
    }

    if (!isValid) {
      try {
        const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(rawVal)}`);
        if (res.status === 200) {
          isValid = true;
          this.wbDict.add(rawVal);
        }
      } catch (err) {
        if (/^[a-z]{3,12}$/.test(rawVal) && /[aeiouy]/.test(rawVal)) {
          isValid = true;
          this.wbDict.add(rawVal);
        }
      }
    }

    if (!isValid) {
      this.setWordBridgeFeedback(`"${rawVal.toUpperCase()}" was not found in our English dictionary. Try another one! 🤔`, 'warning');
      this.shakeWordBridgeInput();
      return;
    }

    this.acceptWordBridgeAnswer(rawVal);
  }

  acceptWordBridgeAnswer(word, isRemote = false, remoteFinder = null, remotePoints = null) {
    const sync = window.workspaceSync || window.wbSyncEngine;
    const finderName = isRemote ? (remoteFinder || 'Partner 💜') : (sync ? sync.getUserDisplayName() : 'RK 💙');

    this.wbFoundWordsForPair.set(word, finderName);
    this.wbAllFoundWords.push(word);

    const lenBonus = Math.max(0, (word.length - 4) * 3);
    this.wbStreak++;
    if (this.wbStreak > this.wbBestStreak) {
      this.wbBestStreak = this.wbStreak;
    }

    const streakBonus = Math.min(this.wbStreak * 2, 20);
    const earned = remotePoints !== null ? remotePoints : (10 + lenBonus + streakBonus);
    this.wbScore += earned;

    if (this.wbScoreEl) this.wbScoreEl.textContent = `${this.wbScore} pts`;
    if (this.wbWordsCountEl) this.wbWordsCountEl.textContent = this.wbAllFoundWords.length;
    if (this.wbStreakEl) this.wbStreakEl.textContent = `🔥 ${this.wbStreak}`;
    if (this.wbBestStreakEl) this.wbBestStreakEl.textContent = `🏆 ${this.wbBestStreak}`;

    if (!isRemote && sync && sync.sendWordFound) {
      sync.sendWordFound(word, earned, finderName);
    }

    if ((this.wbStreak >= 3 || earned >= 18) && window.birthdayApp) {
      window.birthdayApp.triggerBurstConfetti(35);
    }

    let praise = isRemote ? `🎉 ${finderName} found` : '🎉 Excellent! You found';
    if (word.length >= 7) praise = isRemote ? `🌟 ${finderName} found a magnificent long word:` : '🌟 Magnificent long word!';
    else if (this.wbStreak >= 5) praise = isRemote ? `🔥 ${finderName} extended the streak with:` : '🔥 Incredible streak!';

    this.setWordBridgeFeedback(
      `${praise} "${word.toUpperCase()}"! (+${earned} pts, Streak: ${this.wbStreak})`,
      'success'
    );

    this.renderWordBridgeChips();

    if (!isRemote && this.wbInputEl) {
      this.wbInputEl.value = '';
      this.wbInputEl.focus();
    }
  }

  handleRemoteWordFound(data) {
    if (!data || !data.word) return;
    const word = data.word.toLowerCase();
    if (this.wbFoundWordsForPair.has(word)) return;
    this.acceptWordBridgeAnswer(word, true, data.finderName, data.points);
    if (window.app) window.app.showToast(`✨ ${data.finderName || 'Partner'} found "${word.toUpperCase()}"! +${data.points || 15} pts 🔤💜`);
  }

  giveWordBridgeHint() {
    const list = this.wbPairs[this.wbCurrentKey] || [];
    const available = list.filter(w => !this.wbFoundWordsForPair.has(w));

    if (available.length === 0) {
      this.setWordBridgeFeedback('You found all standard words for this pair! Click "Next Letter Pair" for a new challenge! 🏆', 'success');
      return;
    }

    const hintWord = available[Math.floor(Math.random() * available.length)];
    const upper = hintWord.toUpperCase();
    let masked = upper[0] + ' ' + upper.slice(1, -1).split('').map(() => '_').join(' ') + ' ' + upper[upper.length - 1];
    
    this.setWordBridgeFeedback(
      `💡 Clue: A ${hintWord.length}-letter word exists: ${masked} (or try another!)`,
      'info'
    );
  }

  renderWordBridgeChips() {
    if (!this.wbFoundContainer) return;

    if (this.wbPairFoundCountEl) {
      const count = this.wbFoundWordsForPair.size;
      this.wbPairFoundCountEl.textContent = `${count} word${count === 1 ? '' : 's'}`;
    }

    if (this.wbFoundWordsForPair.size === 0) {
      this.wbFoundContainer.innerHTML = '<span class="wb-empty-chip">No words found for this pair yet. Start typing above! 💜</span>';
      return;
    }

    this.wbFoundContainer.innerHTML = '';
    this.wbFoundWordsForPair.forEach((finder, w) => {
      const chip = document.createElement('span');
      chip.className = 'wb-chip animate-pop';
      chip.innerHTML = `<strong>${w.toUpperCase()}</strong> <span class="chip-finder" style="font-size:0.72rem; color:var(--purple-700); font-weight:700; margin:0 4px; background:var(--purple-100); padding:1px 5px; border-radius:4px;">${finder}</span> <span class="chip-len">${w.length}</span>`;
      this.wbFoundContainer.appendChild(chip);
    });
  }

  setWordBridgeFeedback(msg, type = 'info') {
    if (!this.wbFeedbackEl) return;
    this.wbFeedbackEl.textContent = msg;
    this.wbFeedbackEl.className = `wb-feedback-box visible ${type}`;
  }

  shakeWordBridgeInput() {
    if (!this.wbInputEl) return;
    this.wbInputEl.classList.remove('shake');
    void this.wbInputEl.offsetWidth;
    this.wbInputEl.classList.add('shake');
    this.wbInputEl.focus();
  }

  resetWordBridgeGame(isRemote = false) {
    this.wbScore = 0;
    this.wbStreak = 0;
    this.wbFoundWordsForPair.clear();
    this.wbAllFoundWords = [];

    if (this.wbScoreEl) this.wbScoreEl.textContent = '0 pts';
    if (this.wbWordsCountEl) this.wbWordsCountEl.textContent = '0';
    if (this.wbStreakEl) this.wbStreakEl.textContent = '🔥 0';

    if (!isRemote) {
      const sync = window.workspaceSync || window.wbSyncEngine;
      if (sync && sync.sendWordReset) sync.sendWordReset();
    }

    this.newWordBridgePair(false);
    this.setWordBridgeFeedback('🔄 Game reset! New challenge loaded. Have fun! 💜', 'info');
  }

  /* ==========================================================================
     Real-Time Synchronization Listeners
     ========================================================================== */
  initSyncListeners() {
    const attach = () => {
      const sync = window.workspaceSync || window.wbSyncEngine;
      if (!sync || !sync.on) {
        setTimeout(attach, 250);
        return;
      }

      // XO Game Real-Time Listeners
      sync.on('XO_MOVE', (data) => this.handleRemoteXOMove(data));
      sync.on('XO_RESET', (data) => this.handleRemoteXOReset(data));
      sync.on('XO_THEME', (data) => {
        if (data && data.theme) {
          this.setXOSymbolTheme(data.theme, false);
        }
      });

      // Word Bridge Real-Time Listeners
      sync.on('WORD_PAIR', (data) => this.handleRemoteWordPair(data));
      sync.on('WORD_FOUND', (data) => this.handleRemoteWordFound(data));
      sync.on('WORD_RESET', () => this.resetWordBridgeGame(true));
    };

    attach();
  }
}

window.GamesHub = GamesHub;

