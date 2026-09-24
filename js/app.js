/* ==========================================================================
   Thanu's WorkSpace - Main App Controller & Router
   ========================================================================== */

class AppController {
  constructor() {
    this.currentView = 'passcode'; // 'passcode' | 'birthday' | 'workspace'
    this.currentWorkspaceModule = 'hub'; // 'hub' | 'wish-to-know' | 'pass-the-time' | 'learn-japanese' | 'saved-modules'
    this.historyStack = [];

    // Two authorized users configuration
    this.users = {
      'rk': {
        username: 'rk',
        password: 'thanu2596',
        name: 'RK',
        displayName: 'RK 💙',
        role: 'rk',
        avatar: '👨‍💻',
        theme: 'rk-theme',
        hint: 'thanu2596'
      },
      'thanasri': {
        username: 'thanasri',
        aliases: ['thanu'],
        password: '12345678',
        name: 'Thanasri',
        displayName: 'Thanasri 💜',
        role: 'thanu',
        avatar: '💜',
        theme: 'thanasri-theme',
        hint: 'Your hotspot password 😊 (12345678)'
      }
    };

    this.selectedUser = 'thanasri';
    this.currentUser = null;

    this.initPasscode();
    this.initNavigation();
    this.initToastSystem();
    this.initHistory();
  }

  /* History & Navigation Stack Management */
  initHistory() {
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.view) {
        this.navigateTo(e.state.view, e.state.module || 'hub', false);
      } else {
        this.goBack();
      }
    });
  }

  saveSessionState() {
    try {
      if (this.currentUser) {
        sessionStorage.setItem('thanu_active_user', this.currentUser);
        sessionStorage.setItem('thanu_active_view', this.currentView);
        sessionStorage.setItem('thanu_active_module', this.currentWorkspaceModule || 'hub');
      } else {
        sessionStorage.removeItem('thanu_active_user');
        sessionStorage.removeItem('thanu_active_view');
        sessionStorage.removeItem('thanu_active_module');
      }
    } catch (e) {}
  }

  restoreSessionState() {
    try {
      const savedUser = sessionStorage.getItem('thanu_active_user');
      const savedView = sessionStorage.getItem('thanu_active_view');
      const savedModule = sessionStorage.getItem('thanu_active_module') || 'hub';

      if (savedUser && this.users[savedUser]) {
        this.currentUser = savedUser;
        const userObj = this.users[savedUser];

        // Restore sync role
        if (window.workspaceSync) {
          window.workspaceSync.setRole(userObj.role);
        } else {
          localStorage.setItem('thanu_sync_user_role', userObj.role);
        }

        // Update header user pill
        this.updateHeaderUserBadge();

        // Update quiz badge and Thanu answers button visibility for RK
        if (window.birthdayQuiz) {
          window.birthdayQuiz.updateHeaderBadge();
          window.birthdayQuiz.updateProgress(false);
        }

        // If user was on birthday or workspace, restore that exact view on reload!
        if (savedView && savedView !== 'passcode') {
          if (savedView === 'workspace') {
            this.currentWorkspaceModule = savedModule;
          }
          this.switchView(savedView);
          if (savedView === 'workspace') {
            this.openWorkspaceModule(savedModule, false);
          }
          try {
            window.history.replaceState({ view: savedView, module: savedModule }, '');
          } catch (e) {}
          return true;
        }
      }
    } catch (e) {}
    return false;
  }

  navigateTo(viewName, moduleName = 'hub', recordHistory = true) {
    if (recordHistory) {
      const currentState = { view: this.currentView, module: this.currentWorkspaceModule };
      const last = this.historyStack[this.historyStack.length - 1];
      if (!last || last.view !== currentState.view || last.module !== currentState.module) {
        this.historyStack.push(currentState);
        try {
          window.history.pushState({ view: viewName, module: moduleName }, '');
        } catch (e) {}
      }
    }

    if (this.currentView !== viewName) {
      this.switchView(viewName);
    }
    if (viewName === 'workspace') {
      this.openWorkspaceModule(moduleName, false);
    }
    this.updateBackButtons();
  }

  goBack() {
    let target = null;
    if (this.historyStack.length > 0) {
      target = this.historyStack.pop();
    } else {
      // Sensible hierarchy fallback
      if (this.currentView === 'workspace') {
        if (this.currentWorkspaceModule !== 'hub') {
          target = { view: 'workspace', module: 'hub' };
        } else {
          // If RK (thanu2596), going back from hub locks workspace since RK directly entered workspace
          if (this.currentUser === 'rk') {
            this.lockWorkspace();
            return;
          } else {
            target = { view: 'birthday', module: 'hub' };
          }
        }
      } else if (this.currentView === 'birthday') {
        this.lockWorkspace();
        return;
      }
    }

    if (target) {
      if (target.view === 'passcode') {
        this.lockWorkspace();
        return;
      }
      if (this.currentView !== target.view) {
        this.switchView(target.view);
      }
      if (target.view === 'workspace') {
        this.openWorkspaceModule(target.module, false);
      }
      try {
        window.history.replaceState({ view: target.view, module: target.module }, '');
      } catch (e) {}
      this.updateBackButtons();
    }
  }

  updateBackButtons() {
    const headerBackBtn = document.getElementById('header-back-btn');
    const headerBackLabel = document.getElementById('header-back-label');

    if (headerBackBtn) {
      if (this.currentView === 'workspace') {
        headerBackBtn.style.display = 'inline-flex';
        if (this.currentWorkspaceModule === 'hub') {
          if (this.currentUser === 'rk') {
            if (headerBackLabel) headerBackLabel.textContent = 'Lock 🔒';
            headerBackBtn.title = 'Lock WorkSpace';
          } else {
            if (headerBackLabel) headerBackLabel.textContent = 'Birthday Card 🎂';
            headerBackBtn.title = 'Go back to Birthday Greeting Card';
          }
        } else {
          if (headerBackLabel) headerBackLabel.textContent = 'Hub';
          headerBackBtn.title = 'Go back to Workspace Hub';
        }
      } else {
        headerBackBtn.style.display = 'none';
      }
    }

    const subnav = document.getElementById('workspace-subnav');
    if (subnav) {
      if (this.currentView === 'workspace' && this.currentWorkspaceModule !== 'hub') {
        subnav.style.display = 'flex';
      } else {
        subnav.style.display = 'none';
      }
    }
  }

  /* 1. Passcode Authentication (Auto-determines user from entered passcode) */
  initPasscode() {
    const pwdInput = document.getElementById('passcode-input');
    const submitBtn = document.getElementById('passcode-submit-btn');
    const togglePwdBtn = document.getElementById('toggle-pwd-btn');
    const hintBtn = document.getElementById('passcode-hint-btn');

    if (submitBtn) {
      submitBtn.addEventListener('click', () => this.checkPasscode());
    }

    if (pwdInput) {
      pwdInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.checkPasscode();
      });
    }

    if (togglePwdBtn && pwdInput) {
      togglePwdBtn.addEventListener('click', () => {
        if (pwdInput.type === 'password') {
          pwdInput.type = 'text';
          togglePwdBtn.textContent = '🔒';
        } else {
          pwdInput.type = 'password';
          togglePwdBtn.textContent = '👁️';
        }
      });
    }

    if (hintBtn) {
      hintBtn.addEventListener('click', () => {
        this.showToast("💡 Hint: Enter your secret passcode to unlock! 😊", 4000);
      });
    }
  }

  showLoginError(msg) {
    const errorEl = document.getElementById('passcode-error');
    const boxEl = document.querySelector('.passcode-box');
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.classList.add('visible');
    }
    if (boxEl) {
      boxEl.classList.remove('shake');
      void boxEl.offsetWidth;
      boxEl.classList.add('shake');
    }
  }

  checkPasscode() {
    const pwdInput = document.getElementById('passcode-input');
    const errorEl = document.getElementById('passcode-error');

    const enteredPwd = (pwdInput ? pwdInput.value || '' : '').trim();

    if (!enteredPwd) {
      this.showLoginError('Please enter secret passcode 💜');
      if (pwdInput) pwdInput.focus();
      return;
    }

    // Determine user automatically based on the passcode entered:
    // 1. "thanu2596" -> RK (directly moves to workspace, no questions provided)
    // 2. "12345678"  -> Thanasri (shows questions first, unlocks workspace after answering)
    let detectedUser = null;
    if (enteredPwd === 'thanu2596') {
      detectedUser = this.users['rk'];
    } else if (enteredPwd === '12345678') {
      detectedUser = this.users['thanasri'];
      // Every time Thanasri logs in fresh with 12345678, reset the questions so she answers them again!
      if (window.birthdayQuiz) {
        window.birthdayQuiz.resetQuizForNewLogin();
      }
    }

    if (detectedUser) {
      if (errorEl) errorEl.classList.remove('visible');
      this.loginAs(detectedUser);
    } else {
      this.showLoginError('Incorrect passcode! Try again 💜');
      if (pwdInput) {
        pwdInput.select();
        pwdInput.focus();
      }
    }
  }

  loginAs(userObj) {
    this.currentUser = userObj.username;
    try {
      sessionStorage.setItem('thanu_active_user', userObj.username);
      localStorage.setItem('thanu_sync_user_role', userObj.role);
    } catch (e) {}

    // Update real-time sync role
    if (window.workspaceSync) {
      window.workspaceSync.setRole(userObj.role);
    }

    // Update header pill
    this.updateHeaderUserBadge();

    // Update quiz badge and visibility of Thanu's answers button
    if (window.birthdayQuiz) {
      window.birthdayQuiz.updateHeaderBadge();
      window.birthdayQuiz.updateProgress(false);
    }

    this.showToast(`Welcome, ${userObj.displayName}! ✨`);

    // Clear password field for next lock
    const pwdInput = document.getElementById('passcode-input');
    if (pwdInput) pwdInput.value = '';

    // Route based on user:
    // - "thanu2596" (RK): questions will NOT be provided, directly moves to workspace!
    // - "12345678" (Thanasri): shows questions, then after answering unlocks workspace
    if (userObj.username === 'rk') {
      this.enterWorkspace();
    } else {
      this.unlockToBirthdayView();
    }

    this.saveSessionState();
  }

  lockWorkspace() {
    this.currentUser = null;
    try {
      sessionStorage.removeItem('thanu_active_user');
      sessionStorage.removeItem('thanu_active_view');
      sessionStorage.removeItem('thanu_active_module');
      sessionStorage.removeItem('thanu_active_session_answers');
    } catch (e) {}

    const pwdInput = document.getElementById('passcode-input');
    if (pwdInput) {
      pwdInput.value = '';
    }

    // Hide answers buttons on lock
    if (window.birthdayQuiz) {
      window.birthdayQuiz.updateHeaderBadge();
    }

    this.switchToPasscodeView();
    this.saveSessionState();
    this.showToast('Workspace locked 🔒');
  }

  switchToPasscodeView() {
    this.switchView('passcode');
    const pwdInput = document.getElementById('passcode-input');
    if (pwdInput) {
      setTimeout(() => pwdInput.focus(), 150);
    }
  }

  updateHeaderUserBadge() {
    const pill = document.getElementById('header-user-pill');
    const avatarEl = document.getElementById('header-user-avatar');
    const nameEl = document.getElementById('header-user-name');

    if (!pill || !avatarEl || !nameEl) return;

    const u = this.currentUser || this.selectedUser || 'thanasri';
    const userObj = this.users[u] || this.users['thanasri'];

    avatarEl.textContent = userObj.avatar;
    nameEl.textContent = userObj.name;

    pill.className = `header-user-pill user-${userObj.username}`;
    pill.title = `Logged in as ${userObj.displayName} • Click 🔒 to lock or switch`;
  }

  unlockToBirthdayView() {
    this.navigateTo('birthday', 'hub');

    if (window.birthdayApp) {
      window.birthdayApp.startCelebration();
    }
  }

  /* 2. Workspace Navigation */
  initNavigation() {
    // "Welcome to the Workspace" button on birthday page
    const welcomeBtn = document.getElementById('btn-welcome-workspace');
    if (welcomeBtn) {
      welcomeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.enterWorkspace();
      });
    }

    // Header Lock button
    const headerLockBtn = document.getElementById('btn-header-lock');
    if (headerLockBtn) {
      headerLockBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.lockWorkspace();
      });
    }

    // Go Back button in Header
    const headerBackBtn = document.getElementById('header-back-btn');
    if (headerBackBtn) {
      headerBackBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.goBack();
      });
    }

    // Go Back button in Subnav
    const subnavBackBtn = document.getElementById('btn-subnav-back');
    if (subnavBackBtn) {
      subnavBackBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.goBack();
      });
    }

    // Go Back button on Birthday view
    const bdayBackBtn = document.getElementById('btn-birthday-back');
    if (bdayBackBtn) {
      bdayBackBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.goBack();
      });
    }

    // Birthday card button on Hub Hero
    const hubBdayLink = document.getElementById('btn-hub-birthday-link');
    if (hubBdayLink) {
      hubBdayLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigateTo('birthday', 'hub');
      });
    }

    // Header brand click -> back to hub
    const brandBtn = document.getElementById('brand-btn');
    if (brandBtn) {
      brandBtn.addEventListener('click', () => {
        this.openWorkspaceModule('hub');
      });
    }

    // Top small option: "Saved modules"
    const savedModulesBtn = document.getElementById('top-saved-modules-btn');
    if (savedModulesBtn) {
      savedModulesBtn.addEventListener('click', () => {
        this.openWorkspaceModule('saved-modules');
      });
    }

    // Hub 3 Cards clicks
    const cardWishToKnow = document.getElementById('card-wish-to-know');
    const cardPassTheTime = document.getElementById('card-pass-the-time');
    const cardLearnJapanese = document.getElementById('card-learn-japanese');

    if (cardWishToKnow) {
      cardWishToKnow.addEventListener('click', () => this.openWorkspaceModule('wish-to-know'));
    }
    if (cardPassTheTime) {
      cardPassTheTime.addEventListener('click', () => this.openWorkspaceModule('pass-the-time'));
    }
    if (cardLearnJapanese) {
      cardLearnJapanese.addEventListener('click', () => this.openWorkspaceModule('learn-japanese'));
    }

    // Breadcrumbs home click
    const bcHome = document.getElementById('bc-home-link');
    if (bcHome) {
      bcHome.addEventListener('click', (e) => {
        e.preventDefault();
        this.openWorkspaceModule('hub');
      });
    }
  }

  enterWorkspace() {
    this.navigateTo('workspace', 'hub');
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (window.birthdayApp) {
      window.birthdayApp.stopCelebration();
    }
  }

  switchView(viewName) {
    const views = document.querySelectorAll('.view-section');
    views.forEach(v => {
      v.classList.remove('active');
      v.style.setProperty('display', 'none', 'important');
      v.style.opacity = '0';
    });

    const target = document.getElementById(`${viewName}-view`);
    if (target) {
      target.classList.add('active');
      target.style.setProperty('display', 'flex', 'important');
      target.style.opacity = '1';
      this.currentView = viewName;
    }

    if (viewName === 'birthday' && window.birthdayApp) {
      window.birthdayApp.startCelebration();
    } else if (viewName !== 'birthday' && window.birthdayApp) {
      window.birthdayApp.stopCelebration();
    }

    if (viewName !== 'workspace') {
      if (window.miniCalc && window.miniCalc.hide) window.miniCalc.hide();
      if (window.quickNotepad && window.quickNotepad.hide) window.quickNotepad.hide();
    }

    window.scrollTo({ top: 0, behavior: 'instant' });
    this.updateBackButtons();
    this.saveSessionState();
  }

  openWorkspaceModule(moduleName, recordHistory = true) {
    if (recordHistory) {
      const currentState = { view: this.currentView, module: this.currentWorkspaceModule };
      const last = this.historyStack[this.historyStack.length - 1];
      if (!last || last.view !== currentState.view || last.module !== currentState.module) {
        this.historyStack.push(currentState);
        try {
          window.history.pushState({ view: 'workspace', module: moduleName }, '');
        } catch (e) {}
      }
    }

    this.currentView = 'workspace';
    this.currentWorkspaceModule = moduleName;
    this.saveSessionState();

    // Sub-views inside workspace
    const subviews = document.querySelectorAll('.workspace-subview');
    subviews.forEach(v => {
      v.style.setProperty('display', 'none', 'important');
      v.style.opacity = '0';
    });

    const targetSubview = document.getElementById(`subview-${moduleName}`);
    if (targetSubview) {
      targetSubview.style.setProperty('display', 'block', 'important');
      targetSubview.style.opacity = '1';
    }

    // Subnav breadcrumb visibility
    const subnav = document.getElementById('workspace-subnav');
    const currentBreadcrumb = document.getElementById('bc-current-page');

    if (moduleName === 'hub') {
      if (subnav) subnav.style.display = 'none';
    } else {
      if (subnav) subnav.style.display = 'flex';
      const titles = {
        'wish-to-know': 'Wish to Know (Develop your knowledge)',
        'pass-the-time': 'Pass the Time (Stress Buster)',
        'learn-japanese': '日本語を学ぶ (Learn Japanese)',
        'saved-modules': 'Saved Modules Archive'
      };
      if (currentBreadcrumb) {
        currentBreadcrumb.textContent = titles[moduleName] || moduleName;
      }
    }

    // Specific resize trigger for whiteboard canvas if entering Wish to Know
    if (moduleName === 'wish-to-know') {
      if (window.whiteboard) {
        setTimeout(() => {
          window.whiteboard.handleResize();
        }, 50);
      }
    } else {
      // Auto-hide calculator and notepad when leaving whiteboard
      if (window.miniCalc && window.miniCalc.hide) window.miniCalc.hide();
      if (window.quickNotepad && window.quickNotepad.hide) window.quickNotepad.hide();
    }

    this.updateBackButtons();
  }

  /* 3. Toast Notifications */
  initToastSystem() {
    this.toastContainer = document.getElementById('toast-container');
  }

  showToast(message, duration = 3200) {
    if (!this.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>💜</span> <span>${message}</span>`;
    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, duration);
  }
}

// Global initialization on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Ensure no speech or audio is playing on load
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

  window.app = new AppController();

  // Birthday module
  window.birthdayApp = new BirthdayCelebration();
  window.birthdayQuiz = new BirthdayQuiz();

  // Universal Two-Device Sync Engine
  window.workspaceSync = new WorkspaceSyncEngine();
  window.wbSyncEngine = window.workspaceSync;

  // Whiteboard
  window.whiteboard = new InteractiveWhiteboard(window.workspaceSync);

  // Floating Mini Calculator
  window.miniCalc = new MiniCalculator();

  // Floating Quick Notepad
  window.quickNotepad = new QuickNotepad();

  // Stress Buster Games
  window.gamesHub = new GamesHub();

  // Japanese Learning Hub
  window.japaneseHub = new JapaneseLearningHub();

  // Saved Modules Manager
  window.savedModulesManager = new SavedModulesManager();

  // Initialize active user header badge & restore session view on reload
  if (window.app) {
    window.app.updateHeaderUserBadge();
  }
  if (window.birthdayQuiz) {
    window.birthdayQuiz.updateHeaderBadge();
  }
  if (window.app) {
    window.app.restoreSessionState();
  }

  // Ensure Purple Heart Tab Favicon is set
  try {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.88em%22 font-size=%2288%22>💜</text></svg>';
  } catch (e) {}
});
