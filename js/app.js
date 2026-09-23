/* ==========================================================================
   Thanu's WorkSpace - Main App Controller & Router
   ========================================================================== */

class AppController {
  constructor() {
    this.currentView = 'passcode'; // 'passcode' | 'birthday' | 'workspace'
    this.currentWorkspaceModule = 'hub'; // 'hub' | 'wish-to-know' | 'pass-the-time' | 'learn-japanese' | 'saved-modules'
    this.validPasscodes = ['12345678'];
    this.historyStack = [];

    this.initPasscode();
    this.initNavigation();
    this.initToastSystem();
    this.initHistory();
  }

  /* History & Navigation Stack Management */
  initHistory() {
    try {
      window.history.replaceState({ view: 'passcode', module: 'hub' }, '');
    } catch (e) {}

    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.view) {
        this.navigateTo(e.state.view, e.state.module || 'hub', false);
      } else {
        this.goBack();
      }
    });
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
          target = { view: 'birthday', module: 'hub' };
        }
      } else if (this.currentView === 'birthday') {
        target = { view: 'passcode', module: 'hub' };
      }
    }

    if (target) {
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
          if (headerBackLabel) headerBackLabel.textContent = 'Birthday Card 🎂';
          headerBackBtn.title = 'Go back to Birthday Greeting Card';
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

  /* 1. Passcode Authentication */
  initPasscode() {
    const input = document.getElementById('passcode-input');
    const submitBtn = document.getElementById('passcode-submit-btn');
    const togglePwdBtn = document.getElementById('toggle-pwd-btn');
    const hintBtn = document.getElementById('passcode-hint-btn');

    if (submitBtn) {
      submitBtn.addEventListener('click', () => this.checkPasscode());
    }

    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.checkPasscode();
      });
    }

    if (togglePwdBtn && input) {
      togglePwdBtn.addEventListener('click', () => {
        if (input.type === 'password') {
          input.type = 'text';
          togglePwdBtn.textContent = '🔒';
        } else {
          input.type = 'password';
          togglePwdBtn.textContent = '👁️';
        }
      });
    }

    if (hintBtn) {
      hintBtn.addEventListener('click', () => {
        this.showToast("Hint: your hotspot password 😊");
      });
    }
  }

  checkPasscode() {
    const input = document.getElementById('passcode-input');
    const errorEl = document.getElementById('passcode-error');
    const boxEl = document.querySelector('.passcode-box');

    const val = (input ? input.value || '' : '').trim().toLowerCase();

    if (this.validPasscodes.includes(val)) {
      if (errorEl) errorEl.classList.remove('visible');
      this.unlockToBirthdayView();
    } else {
      if (errorEl) {
        errorEl.textContent = 'Incorrect passcode! Try again 💜';
        errorEl.classList.add('visible');
      }
      if (boxEl) {
        boxEl.classList.remove('shake');
        void boxEl.offsetWidth;
        boxEl.classList.add('shake');
      }
      if (input) input.select();
    }
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
    window.scrollTo({ top: 0, behavior: 'instant' });
    this.updateBackButtons();
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
    if (moduleName === 'wish-to-know' && window.whiteboard) {
      setTimeout(() => {
        window.whiteboard.handleResize();
      }, 50);
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
