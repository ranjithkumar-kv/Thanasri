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
    this.xoRoundNumber = 1;
    this.xoRoundStarter = 'X'; // Tracks starting player: 'X' (RK / Me) or 'O' (Thanu / Her)
    this.xoCurrentPlayer = 'X'; // Active turn
    this.xoMode = 'online'; // 'online', 'pvp', or 'ai'
    this.xoGameActive = true;
    this.scores = { x: 0, o: 0, ties: 0 };
    this.xoSymbolTheme = 'hearts'; // 'hearts' (💙 & 💜) or 'classic' (❌ & ⭕)

    // Restore saved starter & round number from session if available
    try {
      const savedStarter = sessionStorage.getItem('thanu_xo_round_starter');
      if (savedStarter === 'X' || savedStarter === 'O') {
        this.xoRoundStarter = savedStarter;
        this.xoCurrentPlayer = savedStarter;
      }
      const savedRound = parseInt(sessionStorage.getItem('thanu_xo_round_num'), 10);
      if (!isNaN(savedRound) && savedRound > 0) {
        this.xoRoundNumber = savedRound;
      }
    } catch (e) {}

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

    // Starter Toggle Button (Alternates automatically: RK 💙 ⇄ Thanu 💜)
    const starterBtn = document.getElementById('xo-starter-btn');
    if (starterBtn) {
      starterBtn.addEventListener('click', () => {
        this.toggleXOStarter(true);
      });
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
        this.resetXORound(true, this.xoRoundStarter);
        if (window.app) window.app.showToast('Online 2-Device Mode Active 👫💜');
      });
    }

    if (modePvpBtn) {
      modePvpBtn.addEventListener('click', () => {
        this.xoMode = 'pvp';
        modePvpBtn.classList.add('active');
        if (modeOnlineBtn) modeOnlineBtn.classList.remove('active');
        if (modeAiBtn) modeAiBtn.classList.remove('active');
        this.resetXORound(false, this.xoRoundStarter);
      });
    }

    if (modeAiBtn) {
      modeAiBtn.addEventListener('click', () => {
        this.xoMode = 'ai';
        modeAiBtn.classList.add('active');
        if (modeOnlineBtn) modeOnlineBtn.classList.remove('active');
        if (modePvpBtn) modePvpBtn.classList.remove('active');
        this.resetXORound(false, this.xoRoundStarter);
      });
    }

    this.setXOSymbolTheme(this.xoSymbolTheme, false);
    this.updateXOStarterUI();
    this.updateXOTurnIndicator();
  }

  updateXOStarterUI() {
    const starterBtn = document.getElementById('xo-starter-btn');
    const starterIcon = document.getElementById('xo-starter-icon');
    const starterLabel = document.getElementById('xo-starter-label');
    if (!starterBtn) return;

    const isClassic = this.xoSymbolTheme === 'classic';
    const starter = this.xoRoundStarter || 'X';

    if (starter === 'X') {
      if (starterIcon) starterIcon.innerHTML = isClassic ? '<span style="color:#ef4444;font-weight:900;">X</span>' : '💙';
      if (starterLabel) starterLabel.textContent = isClassic ? 'X' : '💙';
      starterBtn.title = 'Turn: RK (Blue 💙) starts • Click to switch to Thanu (Purple 💜)';
    } else {
      if (starterIcon) starterIcon.innerHTML = isClassic ? '<span style="color:#2563eb;font-weight:900;">O</span>' : '💜';
      if (starterLabel) starterLabel.textContent = isClassic ? 'O' : '💜';
      starterBtn.title = 'Turn: Thanu (Purple 💜) starts • Click to switch to RK (Blue 💙)';
    }
  }

  toggleXOStarter(broadcast = true) {
    const newStarter = (this.xoRoundStarter === 'X') ? 'O' : 'X';
    this.xoRoundStarter = newStarter;

    try {
      sessionStorage.setItem('thanu_xo_round_starter', newStarter);
    } catch (e) {}

    // Check if the board is empty (no moves played yet in current round)
    const isBoardEmpty = this.xoBoard.every(cell => cell === null);
    if (isBoardEmpty && this.xoGameActive) {
      this.xoCurrentPlayer = newStarter;
      this.updateXOTurnIndicator();

      if (this.xoMode === 'ai' && this.xoCurrentPlayer === 'O') {
        setTimeout(() => this.makeAIMove(), 600);
      }
    }

    this.updateXOStarterUI();

    if (broadcast && this.xoMode === 'online') {
      const sync = window.workspaceSync || window.wbSyncEngine;
      if (sync && sync.broadcast) {
        sync.broadcast('XO_STARTER_CHANGE', { starter: newStarter, applyImmediate: isBoardEmpty });
      }
    }

    if (window.app && broadcast) {
      const starterName = newStarter === 'X' ? 'RK 💙 (Me)' : 'Thanasri 💜 (Her)';
      window.app.showToast(`Starting turn switched to ${starterName}! ✨`);
    }
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
      return player === 'X' ? 'X' : 'O';
    }
    return player === 'X' ? '💙' : '💜';
  }

  toggleXOSymbolTheme(broadcast = true) {
    const nextTheme = this.xoSymbolTheme === 'hearts' ? 'classic' : 'hearts';
    this.setXOSymbolTheme(nextTheme, broadcast);
  }

  setXOSymbolTheme(theme, broadcast = true) {
    this.xoSymbolTheme = (theme === 'classic') ? 'classic' : 'hearts';

    // Update Theme Toggle Button UI (💙💜 / X O)
    const themeHearts = document.getElementById('xo-theme-hearts');
    const themeClassic = document.getElementById('xo-theme-classic');
    if (themeHearts && themeClassic) {
      if (this.xoSymbolTheme === 'classic') {
        themeHearts.classList.remove('active');
        themeClassic.classList.add('active');
      } else {
        themeHearts.classList.add('active');
        themeClassic.classList.remove('active');
      }
    }
    const iconEl = document.getElementById('xo-theme-icon');
    const labelEl = document.getElementById('xo-theme-label');
    if (iconEl && labelEl) {
      if (this.xoSymbolTheme === 'classic') {
        iconEl.innerHTML = '<span style="color:#ef4444;font-weight:900;">X</span><span style="color:#2563eb;font-weight:900;">O</span>';
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
      scoreLabelX.innerHTML = this.xoSymbolTheme === 'classic' ? '<span style="color:#ef4444;font-weight:900;">X</span> RK' : '💙 RK';
    }
    if (scoreLabelO) {
      scoreLabelO.innerHTML = this.xoSymbolTheme === 'classic' ? '<span style="color:#2563eb;font-weight:900;">O</span> Thanu' : '💜 Thanu';
    }

    // Refresh existing moves on the board
    if (this.xoBoard) {
      this.xoBoard.forEach((player, idx) => {
        if (player) {
          const cell = document.querySelector(`.xo-cell[data-index="${idx}"]`);
          if (cell) {
            if (this.xoSymbolTheme === 'classic') {
              const markerClass = player === 'X' ? 'xo-classic-x' : 'xo-classic-o';
              cell.innerHTML = `<span class="${markerClass}">${player}</span>`;
            } else {
              const sym = player === 'X' ? '💙' : '💜';
              const markerClass = player === 'X' ? 'xo-marker-x' : 'xo-marker-o';
              cell.innerHTML = `<span class="${markerClass}">${sym}</span>`;
            }
          }
        }
      });
    }

    // Update turn indicator and starter UI
    this.updateXOStarterUI();
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
    const remoteStarter = (data && (data.starter === 'X' || data.starter === 'O'))
      ? data.starter
      : ((this.xoRoundStarter === 'X') ? 'O' : 'X');
    this.resetXORound(false, remoteStarter);
    const starterName = remoteStarter === 'X' ? 'RK 💙' : 'Thanasri 💜';
    if (window.app) window.app.showToast(`Partner started new round! ${starterName} starts 🔄✨`);
  }

  makeMove(index, player) {
    this.xoBoard[index] = player;
    const cell = document.querySelector(`.xo-cell[data-index="${index}"]`);
    if (cell) {
      cell.classList.add('taken');
      if (this.xoSymbolTheme === 'classic') {
        const markerClass = player === 'X' ? 'xo-classic-x' : 'xo-classic-o';
        cell.innerHTML = `<span class="${markerClass}">${player}</span>`;
      } else {
        const symbol = player === 'X' ? '💙' : '💜';
        const markerClass = player === 'X' ? 'xo-marker-x' : 'xo-marker-o';
        cell.innerHTML = `<span class="${markerClass}">${symbol}</span>`;
      }
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
    const isClassic = this.xoSymbolTheme === 'classic';
    const xName = isClassic ? '<span style="color:#ef4444;font-weight:900;">X</span> RK' : 'RK 💙';
    const oName = isClassic ? '<span style="color:#2563eb;font-weight:900;">O</span> Thanu' : 'Thanu 💜';

    const winnerName = winData.winner === 'X' ? xName : oName;
    const winnerPlain = winData.winner === 'X' ? (isClassic ? 'RK (X)' : 'RK 💙') : (isClassic ? 'Thanu (O)' : 'Thanu 💜');

    if (winData.winner === 'X') {
      this.scores.x++;
      const name = this.xoMode === 'online' ? (window.workspaceSync?.userRole === 'thanu' ? winnerName : `You (${winnerName})`) : winnerName;
      if (indicator) {
        indicator.innerHTML = `🎉 <b>${name} Wins!</b>`;
        indicator.className = 'xo-turn-indicator turn-mine';
      }
    } else {
      this.scores.o++;
      const botName = isClassic ? '<span style="color:#2563eb;font-weight:900;">O</span> Bot' : 'Bot 💜';
      const name = this.xoMode === 'ai' ? botName : (this.xoMode === 'online' ? (window.workspaceSync?.userRole === 'thanu' ? `You (${winnerName})` : winnerName) : winnerName);
      if (indicator) {
        indicator.innerHTML = `🎉 <b>${name} Wins!</b>`;
        indicator.className = 'xo-turn-indicator turn-mine';
      }
    }

    this.updateXOScores();

    // 1. Victory Fanfare Sound Chime
    this.playVictoryFanfare();

    // 2. Multi-wave Confetti Cannons
    if (window.birthdayApp) {
      window.birthdayApp.triggerBurstConfetti(110);
      setTimeout(() => window.birthdayApp && window.birthdayApp.triggerBurstConfetti(75), 250);
      setTimeout(() => window.birthdayApp && window.birthdayApp.triggerBurstConfetti(85), 500);
    }

    // 3. Victory Celebration Banner Overlay with Next Starter info
    const nextStarter = (this.xoRoundStarter === 'X') ? 'O' : 'X';
    const nextStarterName = nextStarter === 'X' ? 'RK 💙 (Me)' : 'Thanasri 💜 (Her)';
    const nextStarterShort = nextStarter === 'X' ? 'RK' : 'Thanu';

    const banner = document.getElementById('xo-victory-banner');
    const titleEl = document.getElementById('xo-vic-title');
    const subEl = document.getElementById('xo-vic-sub');
    const vicBtn = document.getElementById('xo-vic-btn');
    if (vicBtn) {
      vicBtn.textContent = `🔄 Play Next Round (${nextStarterShort} starts)`;
    }
    if (banner && titleEl && subEl) {
      titleEl.innerHTML = `🎉 ${winnerPlain} Won! 🏆`;
      subEl.innerHTML = `Magnificent round! ✨<br><span style="font-size:0.86rem;font-weight:700;color:#7e22ce;">Next round starts with: <b>${nextStarterName}</b></span>`;
      banner.classList.add('active');
      clearTimeout(this._vicBannerTimeout);
      this._vicBannerTimeout = setTimeout(() => {
        banner.classList.remove('active');
      }, 4500);
    }
  }

  handleXOTie() {
    this.xoGameActive = false;
    this.scores.ties++;
    const nextStarter = (this.xoRoundStarter === 'X') ? 'O' : 'X';
    const nextStarterName = nextStarter === 'X' ? 'RK 💙' : 'Thanasri 💜';

    const indicator = document.getElementById('xo-turn-indicator');
    if (indicator) {
      indicator.innerHTML = `🤝 <b>Cute Tie!</b> Next round: <b>${nextStarterName}</b> starts`;
      indicator.className = 'xo-turn-indicator';
      indicator.style.background = '#f8fafc';
      indicator.style.borderColor = '#cbd5e1';
      indicator.style.color = '#334155';
    }
    this.updateXOScores();
  }

  updateXOTurnIndicator() {
    const indicator = document.getElementById('xo-turn-indicator');
    if (!indicator) return;

    // Highlight active turn score-box
    const boxX = document.getElementById('xo-score-box-x');
    const boxO = document.getElementById('xo-score-box-o');
    if (boxX && boxO) {
      if (this.xoGameActive) {
        if (this.xoCurrentPlayer === 'X') {
          boxX.classList.add('active-turn');
          boxO.classList.remove('active-turn');
        } else {
          boxO.classList.add('active-turn');
          boxX.classList.remove('active-turn');
        }
      } else {
        boxX.classList.remove('active-turn');
        boxO.classList.remove('active-turn');
      }
    }

    if (!this.xoGameActive) return;

    const isClassic = this.xoSymbolTheme === 'classic';
    const xSym = isClassic ? '<span style="color:#ef4444;font-weight:900;">X</span>' : '💙';
    const oSym = isClassic ? '<span style="color:#2563eb;font-weight:900;">O</span>' : '💜';
    const roundBadge = `<span style="font-size:0.82rem;font-weight:700;opacity:0.85;margin-left:4px;">(Round ${this.xoRoundNumber || 1})</span>`;

    indicator.style.background = '';
    indicator.style.color = '';
    indicator.style.borderColor = '';

    if (this.xoMode === 'online') {
      const myPiece = this.getMyXOPiece();
      const isMyTurn = this.xoCurrentPlayer === myPiece;
      const sync = window.workspaceSync || window.wbSyncEngine;
      const partner = sync ? sync.getPartnerDisplayName() : (myPiece === 'X' ? 'Thanasri 💜' : 'RK 💙');
      const myName = myPiece === 'X' ? `${xSym} RK` : `${oSym} Thanu`;
      const partnerSym = myPiece === 'X' ? oSym : xSym;

      if (isMyTurn) {
        indicator.innerHTML = `✨ <b>Your Turn!</b> Play with ${myName} ${roundBadge}`;
        indicator.className = 'xo-turn-indicator turn-mine';
      } else {
        indicator.innerHTML = `⏳ <b>${partner}'s Turn</b> (${partnerSym} Waiting...) ${roundBadge}`;
        indicator.className = 'xo-turn-indicator turn-partner';
      }
    } else if (this.xoMode === 'pvp') {
      if (this.xoCurrentPlayer === 'X') {
        indicator.innerHTML = `${xSym} <b>RK's Turn</b> (Player 1) ${roundBadge}`;
        indicator.className = 'xo-turn-indicator turn-x';
      } else {
        indicator.innerHTML = `${oSym} <b>Thanasri's Turn</b> (Player 2) ${roundBadge}`;
        indicator.className = 'xo-turn-indicator turn-o';
      }
    } else {
      // AI Mode
      if (this.xoCurrentPlayer === 'X') {
        indicator.innerHTML = `${xSym} <b>RK's Turn</b> (You) ${roundBadge}`;
        indicator.className = 'xo-turn-indicator turn-x';
      } else {
        indicator.innerHTML = `${oSym} <b>Bot's Turn</b> (Thinking...) ${roundBadge}`;
        indicator.className = 'xo-turn-indicator turn-o';
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

  resetXORound(broadcast = true, explicitStarter = null) {
    this.xoBoard = Array(9).fill(null);
    this.xoGameActive = true;

    // Alternating starter logic:
    // If explicitStarter provided, use it.
    // Otherwise, alternate: one time Me ('X'), one time Her ('O')!
    let nextStarter;
    if (explicitStarter === 'X' || explicitStarter === 'O') {
      nextStarter = explicitStarter;
    } else {
      nextStarter = (this.xoRoundStarter === 'X') ? 'O' : 'X';
      this.xoRoundNumber = (this.xoRoundNumber || 1) + 1;
    }

    this.xoRoundStarter = nextStarter;
    this.xoCurrentPlayer = nextStarter;

    try {
      sessionStorage.setItem('thanu_xo_round_starter', this.xoRoundStarter);
      sessionStorage.setItem('thanu_xo_round_num', this.xoRoundNumber);
    } catch (e) {}

    const banner = document.getElementById('xo-victory-banner');
    if (banner) banner.classList.remove('active');
    clearTimeout(this._vicBannerTimeout);

    const cells = document.querySelectorAll('.xo-cell');
    cells.forEach(cell => {
      cell.classList.remove('taken', 'winner-cell');
      cell.innerHTML = '';
    });

    this.updateXOStarterUI();
    this.updateXOTurnIndicator();

    if (broadcast && this.xoMode === 'online') {
      const sync = window.workspaceSync || window.wbSyncEngine;
      if (sync) sync.sendXOReset(nextStarter);
    }

    // If AI mode and Bot ('O') starts
    if (this.xoMode === 'ai' && this.xoCurrentPlayer === 'O' && this.xoGameActive) {
      setTimeout(() => this.makeAIMove(), 600);
    }
  }

  playVictoryFanfare() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();

      const notes = [
        { f: 523.25, d: 0.12 }, // C5
        { f: 659.25, d: 0.12 }, // E5
        { f: 783.99, d: 0.16 }, // G5
        { f: 1046.50, d: 0.45 } // C6
      ];

      let now = ctx.currentTime + 0.05;
      notes.forEach((n, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.24, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + n.d);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + n.d + 0.05);

        now += (idx === 2 ? 0.18 : 0.12);
      });
    } catch (e) {
      console.log('Fanfare audio note:', e);
    }
  }

  /* ==========================================================================
     2. TYPING GAME (Speed & Mindful Stress Buster)
     ========================================================================== */
  initTypingGame() {
    this.passages = [
      "Believe in yourself and all that you are. There is something inside you that is greater than any obstacle you encounter.",
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

    // Curated rich set of popular, solvable English word bridge pairs
    const defaultPairs = {
      's-t': ['start', 'smart', 'sweet', 'sunset', 'street', 'secret', 'sport', 'sight', 'shirt', 'suit'],
      'p-e': ['purple', 'peace', 'promise', 'phone', 'price', 'please', 'profile', 'praise', 'pride'],
      'c-e': ['cute', 'cake', 'circle', 'care', 'choice', 'coffee', 'candle', 'change', 'code'],
      'b-y': ['birthday', 'baby', 'beauty', 'busy', 'bravery', 'battery', 'body'],
      'l-e': ['love', 'life', 'little', 'lake', 'line', 'language', 'large', 'late', 'live'],
      'h-t': ['heart', 'hat', 'heat', 'height', 'honest', 'habit', 'hunt'],
      's-e': ['smile', 'style', 'scale', 'scene', 'shore', 'share', 'stone', 'space', 'score'],
      'd-m': ['dream', 'diagram', 'drum', 'domain'],
      'm-e': ['magic', 'make', 'minute', 'movie', 'muscle', 'message', 'middle'],
      'f-t': ['first', 'fast', 'flight', 'forest', 'fruit', 'front', 'foot', 'fact'],
      'p-t': ['point', 'plant', 'pilot', 'post', 'part', 'past', 'paint', 'pocket'],
      'b-k': ['book', 'back', 'bank', 'black', 'brick', 'blank', 'bark', 'block'],
      't-n': ['train', 'town', 'twin', 'turn', 'token', 'tension', 'tuition'],
      'w-d': ['world', 'word', 'wind', 'wood', 'wild', 'weird', 'wizard'],
      'g-t': ['great', 'giant', 'gift', 'guest', 'ghost', 'guilt', 'gate'],
      'r-d': ['read', 'road', 'red', 'round', 'reward', 'record', 'rapid']
    };

    const combinedPairs = Object.assign({}, defaultPairs, window.WORD_PAIRS || {});
    const filteredPairs = {};
    for (const [k, words] of Object.entries(combinedPairs)) {
      if (Array.isArray(words) && words.length >= 3 && k.includes('-')) {
        filteredPairs[k] = words;
      }
    }
    this.wbPairs = Object.keys(filteredPairs).length > 0 ? filteredPairs : defaultPairs;
    this.wbPairKeys = Object.keys(this.wbPairs);

    this.wbCurrentKey = '';
    this.wbStartChar = '';
    this.wbEndChar = '';
    this.wbRoundNumber = 1;
    this.wbWinsRk = 0;
    this.wbWinsThanu = 0;
    this.wbRoundActive = true;
    this.wbRoundWinner = null;
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
    this.wbScoreEl = document.getElementById('wb-score');
    this.wbWinsRkEl = document.getElementById('wb-wins-rk');
    this.wbWinsThanuEl = document.getElementById('wb-wins-thanu');
    this.wbRoundNumEl = document.getElementById('wb-round-num');
    this.wbRaceStatusEl = document.getElementById('wb-race-status');

    this.wbVicBanner = document.getElementById('wb-victory-banner');
    this.wbVicTitle = document.getElementById('wb-vic-title');
    this.wbVicWordTag = document.getElementById('wb-vic-word-tag');
    this.wbVicSub = document.getElementById('wb-vic-sub');
    this.wbVicNextBtn = document.getElementById('wb-vic-next-btn');

    // 10s Countdown elements
    this.wbCountdownSecEl = document.getElementById('wb-countdown-seconds');
    this.wbCountdownBarEl = document.getElementById('wb-countdown-progress');
    this.wbVicBtnTextEl = document.getElementById('wb-vic-btn-text');
    this._wbCountdownTimer = null;
    this._wbCountdownSec = 10;

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
        this.clearWordBridgeCountdown();
        this.newWordBridgePair(true);
      });
    }

    if (this.wbVicNextBtn) {
      this.wbVicNextBtn.addEventListener('click', () => {
        this.clearWordBridgeCountdown();
        if (this.wbVicBanner) this.wbVicBanner.classList.remove('active');
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
        this.clearWordBridgeCountdown();
        this.resetWordBridgeGame(false);
      });
    }

    // Auto-uppercase sanitize
    this.wbInputEl.addEventListener('input', () => {
      this.wbInputEl.value = this.wbInputEl.value.replace(/[^a-zA-Z]/g, '').toUpperCase();
    });

    // Start first synchronized round
    this.newWordBridgePair(false);
  }

  getPairKeyForRound(roundNum) {
    if (!this.wbPairKeys || this.wbPairKeys.length === 0) return 's-t';
    const idx = (Math.max(1, roundNum || 1) - 1) % this.wbPairKeys.length;
    return this.wbPairKeys[idx];
  }

  newWordBridgePair(userInitiated = false, isRemote = false, remoteData = null) {
    this.clearWordBridgeCountdown();
    clearTimeout(this._wbVicTimeout);
    if (this.wbVicBanner) this.wbVicBanner.classList.remove('active');

    if (isRemote && remoteData) {
      this.wbStartChar = remoteData.startChar.toUpperCase();
      this.wbEndChar = remoteData.endChar.toUpperCase();
      this.wbCurrentKey = remoteData.pairKey;
      if (remoteData.roundNumber) {
        this.wbRoundNumber = remoteData.roundNumber;
      }
    } else {
      if (userInitiated) {
        this.wbRoundNumber = (this.wbRoundNumber || 1) + 1;
      }
      const nextKey = this.getPairKeyForRound(this.wbRoundNumber);
      this.wbCurrentKey = nextKey;
      const parts = nextKey.split('-');
      this.wbStartChar = parts[0].toUpperCase();
      this.wbEndChar = parts[1].toUpperCase();

      if (userInitiated) {
        const sync = window.workspaceSync || window.wbSyncEngine;
        if (sync && sync.sendWordPair) {
          sync.sendWordPair(this.wbStartChar, this.wbEndChar, this.wbCurrentKey, this.wbRoundNumber);
        }
      }
    }

    this.wbRoundActive = true;
    this.wbRoundWinner = null;

    if (this.wbStartEl) this.wbStartEl.textContent = this.wbStartChar;
    if (this.wbEndEl) this.wbEndEl.textContent = this.wbEndChar;
    if (this.wbPairTagEl) this.wbPairTagEl.textContent = `${this.wbStartChar} ... ${this.wbEndChar}`;
    if (this.wbRoundNumEl) this.wbRoundNumEl.textContent = `#${this.wbRoundNumber}`;
    if (this.wbRaceStatusEl) {
      this.wbRaceStatusEl.textContent = '⚡ Race Open!';
      this.wbRaceStatusEl.style.color = 'var(--purple-600)';
    }

    this.wbFoundWordsForPair.clear();
    this.renderWordBridgeChips();

    if (this.wbInputEl) {
      this.wbInputEl.value = '';
      this.wbInputEl.disabled = false;
      this.wbInputEl.placeholder = `Type an English word starting with "${this.wbStartChar}" and ending with "${this.wbEndChar}"...`;
      this.wbInputEl.focus();
    }

    if (this.wbFeedbackEl) {
      if (userInitiated) {
        this.setWordBridgeFeedback(`🔀 Round #${this.wbRoundNumber}: Letters are ${this.wbStartChar} ... ${this.wbEndChar}! First to type wins! ⚡`, 'info');
      } else if (isRemote) {
        const sync = window.workspaceSync || window.wbSyncEngine;
        const partner = sync ? sync.getPartnerDisplayName() : 'Partner';
        this.setWordBridgeFeedback(`🔀 ${partner} started Round #${this.wbRoundNumber} with ${this.wbStartChar} ... ${this.wbEndChar}! First to type wins! ⚡`, 'info');
      } else {
        this.setWordBridgeFeedback(`Round #${this.wbRoundNumber}: First one to type a real English word starting with "${this.wbStartChar}" and ending with "${this.wbEndChar}" wins! ⚡`, 'info');
      }
    }
  }

  /* 10-Second Live Countdown Timer (10 to 0) & Continuous Letter Refresh */
  startWordBridgeCountdown(duration = 10) {
    this.clearWordBridgeCountdown();
    this._wbCountdownSec = duration;

    const updateUI = (sec) => {
      if (this.wbCountdownSecEl) {
        this.wbCountdownSecEl.textContent = sec;
      }
      if (this.wbCountdownBarEl) {
        const pct = Math.max(0, (sec / duration) * 100);
        this.wbCountdownBarEl.style.width = `${pct}%`;
      }
      if (this.wbVicBtnTextEl) {
        this.wbVicBtnTextEl.textContent = `🔀 Next Round Challenge ➔ (${sec}s)`;
      }
    };

    updateUI(this._wbCountdownSec);

    this._wbCountdownTimer = setInterval(() => {
      this._wbCountdownSec--;
      if (this._wbCountdownSec >= 0) {
        updateUI(this._wbCountdownSec);
      }

      if (this._wbCountdownSec <= 0) {
        this.clearWordBridgeCountdown();
        if (this.wbVicBanner) {
          this.wbVicBanner.classList.remove('active');
        }
        // Continuous flow: auto-provide new letters if this round was completed
        if (!this.wbRoundActive) {
          this.newWordBridgePair(true);
        }
      }
    }, 1000);
  }

  clearWordBridgeCountdown() {
    if (this._wbCountdownTimer) {
      clearInterval(this._wbCountdownTimer);
      this._wbCountdownTimer = null;
    }
    this._wbCountdownSec = 10;
    if (this.wbCountdownSecEl) this.wbCountdownSecEl.textContent = '10';
    if (this.wbCountdownBarEl) this.wbCountdownBarEl.style.width = '100%';
    if (this.wbVicBtnTextEl) this.wbVicBtnTextEl.textContent = '🔀 Next Round Challenge ➔ (10s)';
  }

  handleRemoteWordPair(data) {
    if (!data || !data.startChar || !data.endChar) return;
    this.clearWordBridgeCountdown();
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

    if (!this.wbRoundActive) {
      this.setWordBridgeFeedback(`Round #${this.wbRoundNumber} was already won by ${this.wbRoundWinner}! Click "Next Letter Pair" for the next race! 🏆`, 'info');
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

    // 4. Must be only English alphabetic letters
    if (!/^[a-z]+$/.test(rawVal)) {
      this.setWordBridgeFeedback('Only English alphabetic letters (A-Z) allowed! 🔤', 'warning');
      this.shakeWordBridgeInput();
      return;
    }

    // 5. Strict English dictionary validity check
    let isValid = false;

    if (this.wbDict.has(rawVal)) {
      isValid = true;
    } else if (this.wbPairs[this.wbCurrentKey] && this.wbPairs[this.wbCurrentKey].includes(rawVal)) {
      isValid = true;
    } else {
      // Check official English dictionary API
      try {
        this.setWordBridgeFeedback(`Validating "${rawVal.toUpperCase()}" with English dictionary... ⏳`, 'info');
        const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(rawVal)}`);
        if (res.status === 200) {
          const json = await res.json();
          if (Array.isArray(json) && json.length > 0 && json[0].word) {
            isValid = true;
            this.wbDict.add(rawVal);
          }
        }
      } catch (err) {
        // Fallback: If offline or API fails, only accept words in preloaded dictionary
        isValid = false;
      }
    }

    if (!isValid) {
      this.setWordBridgeFeedback(`"${rawVal.toUpperCase()}" is not a recognized English word! Please type a real English word. 🤔`, 'warning');
      this.shakeWordBridgeInput();
      return;
    }

    // 6. Valid English word accepted: This player types it first and WINS!
    this.handleWordRoundWin(rawVal, false);
  }

  handleWordRoundWin(word, isRemote = false, remoteData = null) {
    if (!this.wbRoundActive && !isRemote) return;

    this.wbRoundActive = false;

    const sync = window.workspaceSync || window.wbSyncEngine;
    const userRole = isRemote ? (remoteData?.winnerRole || 'partner') : (sync?.userRole || 'rk');
    const isRK = userRole === 'rk';
    const winnerDisplayName = isRemote
      ? (remoteData?.winnerName || (isRK ? 'RK 💙' : 'Thanasri 💜'))
      : (sync ? sync.getUserDisplayName() : (isRK ? 'RK 💙' : 'Thanasri 💜'));

    this.wbRoundWinner = winnerDisplayName;

    // Calculate score points
    const lenBonus = Math.max(0, (word.length - 4) * 3);
    const earned = isRemote ? (remoteData?.points || 25) : (20 + lenBonus);
    this.wbScore += earned;

    // Increment head-to-head round win score
    if (isRK) {
      this.wbWinsRk++;
    } else {
      this.wbWinsThanu++;
    }

    // Update scoreboard elements
    if (this.wbWinsRkEl) this.wbWinsRkEl.textContent = this.wbWinsRk;
    if (this.wbWinsThanuEl) this.wbWinsThanuEl.textContent = this.wbWinsThanu;
    if (this.wbScoreEl) this.wbScoreEl.textContent = `${this.wbScore} pts`;
    if (this.wbRaceStatusEl) {
      this.wbRaceStatusEl.textContent = `🏆 ${winnerDisplayName} Won!`;
      this.wbRaceStatusEl.style.color = '#16a34a';
    }

    // Record word in pair history
    this.wbFoundWordsForPair.set(word, winnerDisplayName);
    this.wbAllFoundWords.push(word);
    this.renderWordBridgeChips();

    // Broadcast round win to other player in real-time
    if (!isRemote && sync && sync.sendWordRoundWin) {
      sync.sendWordRoundWin(word, winnerDisplayName, userRole, earned, this.wbRoundNumber);
    }

    // TRIGGER POPUP WIN EFFECT ONLY ON CORRECT WORD!
    this.playVictoryFanfare();
    if (window.birthdayApp) {
      window.birthdayApp.triggerBurstConfetti(95);
      setTimeout(() => window.birthdayApp && window.birthdayApp.triggerBurstConfetti(65), 250);
      setTimeout(() => window.birthdayApp && window.birthdayApp.triggerBurstConfetti(75), 500);
    }

    // Show celebratory victory popup modal / banner with 10s Countdown
    if (this.wbVicBanner && this.wbVicTitle && this.wbVicWordTag && this.wbVicSub) {
      const isMe = !isRemote;
      this.wbVicTitle.innerHTML = isMe ? `🎉 You Won Round #${this.wbRoundNumber}! 🏆` : `🎉 ${winnerDisplayName} Won Round #${this.wbRoundNumber}! 🏆`;
      this.wbVicWordTag.textContent = `Word: "${word.toUpperCase()}" (+${earned} pts)`;
      this.wbVicSub.innerHTML = `Valid English Word! ⚡ First one to bridge <b>${this.wbStartChar} ... ${this.wbEndChar}</b>!`;
      this.wbVicBanner.classList.add('active');

      // Start 10-to-0 countdown to continuously provide another letters
      this.startWordBridgeCountdown(10);
    }

    this.setWordBridgeFeedback(
      `🏆 ${winnerDisplayName} bridged it first with "${word.toUpperCase()}"! (+${earned} pts) ⏱️ Next challenge starting in 10s...`,
      'success'
    );

    if (!isRemote && this.wbInputEl) {
      this.wbInputEl.value = '';
    }
  }

  handleRemoteWordRoundWin(data) {
    if (!data || !data.word) return;
    const word = data.word.toLowerCase();
    this.handleWordRoundWin(word, true, data);
  }

  handleWordBridgeStateRequest() {
    const sync = window.workspaceSync || window.wbSyncEngine;
    if (sync && sync.sendWordBridgeState) {
      sync.sendWordBridgeState({
        pairKey: this.wbCurrentKey,
        startChar: this.wbStartChar,
        endChar: this.wbEndChar,
        roundNumber: this.wbRoundNumber,
        winsRk: this.wbWinsRk,
        winsThanu: this.wbWinsThanu,
        roundActive: this.wbRoundActive,
        score: this.wbScore
      });
    }
  }

  handleWordBridgeStateResponse(state) {
    if (!state || !state.startChar || !state.endChar) return;
    this.newWordBridgePair(false, true, state);
    if (state.winsRk !== undefined) this.wbWinsRk = state.winsRk;
    if (state.winsThanu !== undefined) this.wbWinsThanu = state.winsThanu;
    if (state.score !== undefined) this.wbScore = state.score;
    if (this.wbWinsRkEl) this.wbWinsRkEl.textContent = this.wbWinsRk;
    if (this.wbWinsThanuEl) this.wbWinsThanuEl.textContent = this.wbWinsThanu;
    if (this.wbScoreEl) this.wbScoreEl.textContent = `${this.wbScore} pts`;
  }

  giveWordBridgeHint() {
    const list = this.wbPairs[this.wbCurrentKey] || [];
    const available = list.filter(w => !this.wbFoundWordsForPair.has(w));

    if (available.length === 0) {
      this.setWordBridgeFeedback('Click "Next Letter Pair" for a new challenge! 🏆', 'success');
      return;
    }

    const hintWord = available[Math.floor(Math.random() * available.length)];
    const upper = hintWord.toUpperCase();
    let masked = upper[0] + ' ' + upper.slice(1, -1).split('').map(() => '_').join(' ') + ' ' + upper[upper.length - 1];
    
    this.setWordBridgeFeedback(
      `💡 Clue: A ${hintWord.length}-letter word exists: ${masked} (or think of another!)`,
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
    this.clearWordBridgeCountdown();
    this.wbScore = 0;
    this.wbStreak = 0;
    this.wbWinsRk = 0;
    this.wbWinsThanu = 0;
    this.wbRoundNumber = 1;
    this.wbRoundActive = true;
    this.wbRoundWinner = null;
    this.wbFoundWordsForPair.clear();
    this.wbAllFoundWords = [];

    if (this.wbWinsRkEl) this.wbWinsRkEl.textContent = '0';
    if (this.wbWinsThanuEl) this.wbWinsThanuEl.textContent = '0';
    if (this.wbRoundNumEl) this.wbRoundNumEl.textContent = '#1';
    if (this.wbScoreEl) this.wbScoreEl.textContent = '0 pts';
    if (this.wbRaceStatusEl) {
      this.wbRaceStatusEl.textContent = '⚡ Race Open!';
      this.wbRaceStatusEl.style.color = 'var(--purple-600)';
    }

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
      sync.on('XO_STARTER_CHANGE', (data) => {
        if (data && (data.starter === 'X' || data.starter === 'O')) {
          this.xoRoundStarter = data.starter;
          try {
            sessionStorage.setItem('thanu_xo_round_starter', data.starter);
          } catch (e) {}

          if (data.applyImmediate && this.xoBoard.every(cell => cell === null) && this.xoGameActive) {
            this.xoCurrentPlayer = data.starter;
            this.updateXOTurnIndicator();
          }
          this.updateXOStarterUI();
          const starterName = data.starter === 'X' ? 'RK 💙' : 'Thanasri 💜';
          if (window.app) window.app.showToast(`Partner set starting turn to ${starterName}! ✨`);
        }
      });
      sync.on('XO_THEME', (data) => {
        if (data && data.theme) {
          this.setXOSymbolTheme(data.theme, false);
        }
      });

      // Word Bridge Real-Time Listeners
      sync.on('WORD_PAIR', (data) => this.handleRemoteWordPair(data));
      sync.on('WORD_ROUND_WIN', (data) => this.handleRemoteWordRoundWin(data));
      sync.on('WORD_FOUND', (data) => this.handleRemoteWordFound(data));
      sync.on('WORD_REQ_STATE', () => this.handleWordBridgeStateRequest());
      sync.on('WORD_RES_STATE', (data) => this.handleWordBridgeStateResponse(data));
      sync.on('WORD_RESET', () => this.resetWordBridgeGame(true));

      // Sync active Word Bridge state across devices
      if (sync.requestWordBridgeState) {
        setTimeout(() => sync.requestWordBridgeState(), 400);
      }

      // When partner joins or announces presence, ensure both have identical letter pairs
      sync.on('PRESENCE', (data) => {
        if (data && !data.isResponse && sync.sendWordBridgeState) {
          sync.sendWordBridgeState({
            pairKey: this.wbCurrentKey,
            startChar: this.wbStartChar,
            endChar: this.wbEndChar,
            roundNumber: this.wbRoundNumber,
            winsRk: this.wbWinsRk,
            winsThanu: this.wbWinsThanu,
            roundActive: this.wbRoundActive,
            score: this.wbScore
          });
        }
      });
    };

    attach();
  }
}

window.GamesHub = GamesHub;

