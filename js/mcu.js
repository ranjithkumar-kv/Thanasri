/**
 * Thanu's Workspace - MCU Watchlist & Tracker (The Infinity Saga: Phase 1 & 2)
 * Complete Marvel Cinematic Universe watch order with interactive tracking,
 * Wikipedia links, star ratings, and real-time partner sync for Thanu & Ranjith.
 */

class McuWatchlist {
  constructor(syncEngine) {
    this.syncEngine = syncEngine;
    this.activeFilter = 'all'; // 'all' | 'phase1' | 'phase2' | 'watched' | 'unwatched'
    this.searchQuery = '';

    // MCU Movies Dataset (Phase 1 & Phase 2 - The Infinity Saga)
    this.movies = [
      // PHASE 1: ASSEMBLE
      {
        id: 'iron-man-1',
        title: 'Iron Man',
        year: 2008,
        phase: 1,
        phaseName: 'Phase 1: Assemble',
        phaseOrder: 1,
        saga: 'The Infinity Saga',
        runtime: '126 min',
        director: 'Jon Favreau',
        tagline: "Heroes aren't born. They're built.",
        highlights: 'Billionaire genius Tony Stark is captured by terrorists, builds an armored suit to escape, and chooses to become Iron Man.',
        characters: 'Tony Stark, Pepper Potts, James Rhodes, Obadiah Stane',
        stone: '— (Birth of the MCU)',
        wikipedia: 'https://en.wikipedia.org/wiki/Iron_Man_(film)',
        color: '#e11d48'
      },
      {
        id: 'the-incredible-hulk',
        title: 'The Incredible Hulk',
        year: 2008,
        phase: 1,
        phaseName: 'Phase 1: Assemble',
        phaseOrder: 2,
        saga: 'The Infinity Saga',
        runtime: '112 min',
        director: 'Louis Leterrier',
        tagline: 'On June 13, unleash the power.',
        highlights: 'Dr. Bruce Banner searches for a cure for his gamma-induced transformations while pursued by General Ross and facing the ferocious Abomination.',
        characters: 'Bruce Banner, Betty Ross, Emil Blonsky, General Thaddeus Ross',
        stone: 'Super Soldier Serum legacy',
        wikipedia: 'https://en.wikipedia.org/wiki/The_Incredible_Hulk_(film)',
        color: '#16a34a'
      },
      {
        id: 'iron-man-2',
        title: 'Iron Man 2',
        year: 2010,
        phase: 1,
        phaseName: 'Phase 1: Assemble',
        phaseOrder: 3,
        saga: 'The Infinity Saga',
        runtime: '124 min',
        director: 'Jon Favreau',
        tagline: "It's not the armor that makes the hero, but the man inside.",
        highlights: 'Tony Stark resists pressure to turn over his technology while dealing with failing health and vengeful physicist Ivan Vanko (Whiplash).',
        characters: 'Tony Stark, Natasha Romanoff (Black Widow debut), War Machine, Whiplash',
        stone: 'Howard Stark’s Tesseract notes',
        wikipedia: 'https://en.wikipedia.org/wiki/Iron_Man_2',
        color: '#f59e0b'
      },
      {
        id: 'thor-1',
        title: 'Thor',
        year: 2011,
        phase: 1,
        phaseName: 'Phase 1: Assemble',
        phaseOrder: 4,
        saga: 'The Infinity Saga',
        runtime: '115 min',
        director: 'Kenneth Branagh',
        tagline: 'The courage to be more than a god.',
        highlights: 'Banished to Earth without his mighty hammer Mjolnir by his father Odin, Thor must prove himself worthy to reclaim his power and stop Loki.',
        characters: 'Thor, Loki, Jane Foster, Odin, Erik Selvig, Hawkeye (cameo)',
        stone: '🔷 Space Stone (Tesseract teaser)',
        wikipedia: 'https://en.wikipedia.org/wiki/Thor_(film)',
        color: '#0284c7'
      },
      {
        id: 'captain-america-1',
        title: 'Captain America: The First Avenger',
        year: 2011,
        phase: 1,
        phaseName: 'Phase 1: Assemble',
        phaseOrder: 5,
        saga: 'The Infinity Saga',
        runtime: '124 min',
        director: 'Joe Johnston',
        tagline: 'When patriots become heroes.',
        highlights: 'During WWII, frail Steve Rogers volunteers for a top-secret experiment turning him into Captain America to combat the Red Skull and Hydra.',
        characters: 'Steve Rogers, Peggy Carter, Bucky Barnes, Red Skull, Howard Stark',
        stone: '🔷 Space Stone (The Tesseract)',
        wikipedia: 'https://en.wikipedia.org/wiki/Captain_America:_The_First_Avenger',
        color: '#2563eb'
      },
      {
        id: 'the-avengers',
        title: 'The Avengers',
        year: 2012,
        phase: 1,
        phaseName: 'Phase 1: Assemble',
        phaseOrder: 6,
        saga: 'The Infinity Saga',
        runtime: '143 min',
        director: 'Joss Whedon',
        tagline: 'Avengers Assemble!',
        highlights: 'Earth’s mightiest heroes unite under Nick Fury to stop Loki and his alien Chitauri invaders during the historic Battle of New York.',
        characters: 'Iron Man, Captain America, Thor, Hulk, Black Widow, Hawkeye, Loki',
        stone: '🔷 Space Stone + 🟡 Mind Stone (Scepter)',
        wikipedia: 'https://en.wikipedia.org/wiki/The_Avengers_(2012_film)',
        color: '#7c3aed'
      },

      // PHASE 2: AGE OF HEROES
      {
        id: 'iron-man-3',
        title: 'Iron Man 3',
        year: 2013,
        phase: 2,
        phaseName: 'Phase 2: Age of Heroes',
        phaseOrder: 1,
        saga: 'The Infinity Saga',
        runtime: '130 min',
        director: 'Shane Black',
        tagline: 'Unleash the power behind the armor.',
        highlights: 'Confronted with PTSD following the alien invasion, Tony Stark’s world is torn apart by the Mandarin and the deadly Extremis enhancement.',
        characters: 'Tony Stark, Pepper Potts, Aldrich Killian, Iron Patriot',
        stone: '— (Post-NY Trauma)',
        wikipedia: 'https://en.wikipedia.org/wiki/Iron_Man_3',
        color: '#dc2626'
      },
      {
        id: 'thor-2',
        title: 'Thor: The Dark World',
        year: 2013,
        phase: 2,
        phaseName: 'Phase 2: Age of Heroes',
        phaseOrder: 2,
        saga: 'The Infinity Saga',
        runtime: '112 min',
        director: 'Alan Taylor',
        tagline: 'Your world will burn.',
        highlights: 'Thor teams up with an imprisoned Loki to protect Jane Foster and prevent Malekith’s Dark Elves from using the ancient Aether weapon.',
        characters: 'Thor, Jane Foster, Loki, Malekith, Odin, The Collector',
        stone: '🔴 Reality Stone (The Aether)',
        wikipedia: 'https://en.wikipedia.org/wiki/Thor:_The_Dark_World',
        color: '#9333ea'
      },
      {
        id: 'captain-america-2',
        title: 'Captain America: The Winter Soldier',
        year: 2014,
        phase: 2,
        phaseName: 'Phase 2: Age of Heroes',
        phaseOrder: 3,
        saga: 'The Infinity Saga',
        runtime: '136 min',
        director: 'Anthony & Joe Russo',
        tagline: 'In heroes we trust.',
        highlights: 'Steve Rogers uncovers a secret conspiracy deep within S.H.I.E.L.D. and faces a deadly assassin: his brainwashed best friend Bucky Barnes.',
        characters: 'Steve Rogers, Natasha Romanoff, Sam Wilson (Falcon), Bucky Barnes',
        stone: '🟡 Mind Stone (Hydra Experimentation)',
        wikipedia: 'https://en.wikipedia.org/wiki/Captain_America:_The_Winter_Soldier',
        color: '#0891b2'
      },
      {
        id: 'guardians-of-the-galaxy-1',
        title: 'Guardians of the Galaxy',
        year: 2014,
        phase: 2,
        phaseName: 'Phase 2: Age of Heroes',
        phaseOrder: 4,
        saga: 'The Infinity Saga',
        runtime: '121 min',
        director: 'James Gunn',
        tagline: "You're welcome.",
        highlights: 'Intergalactic rogue Peter Quill steals a cosmic orb and is forced to forge an uneasy alliance with four misfits to stop Ronan the Accuser.',
        characters: 'Star-Lord, Gamora, Drax, Rocket Raccoon, Groot, Ronan',
        stone: '🟣 Power Stone (The Cosmic Orb)',
        wikipedia: 'https://en.wikipedia.org/wiki/Guardians_of_the_Galaxy_(film)',
        color: '#ec4899'
      },
      {
        id: 'avengers-2',
        title: 'Avengers: Age of Ultron',
        year: 2015,
        phase: 2,
        phaseName: 'Phase 2: Age of Heroes',
        phaseOrder: 5,
        saga: 'The Infinity Saga',
        runtime: '141 min',
        director: 'Joss Whedon',
        tagline: 'A new age begins.',
        highlights: 'When Tony Stark creates artificial intelligence Ultron, it decides humanity must be eradicated. The Avengers reassemble alongside Wanda, Pietro, and Vision.',
        characters: 'The Avengers, Ultron, Wanda Maximoff, Pietro Maximoff, Vision',
        stone: '🟡 Mind Stone (Birth of Vision)',
        wikipedia: 'https://en.wikipedia.org/wiki/Avengers:_Age_of_Ultron',
        color: '#f43f5e'
      },
      {
        id: 'ant-man-1',
        title: 'Ant-Man',
        year: 2015,
        phase: 2,
        phaseName: 'Phase 2: Age of Heroes',
        phaseOrder: 6,
        saga: 'The Infinity Saga',
        runtime: '117 min',
        director: 'Peyton Reed',
        tagline: "Heroes don't come any bigger.",
        highlights: 'Armed with a suit that shrinks the wearer in size while amplifying strength, master thief Scott Lang must pull off an audacious corporate heist.',
        characters: 'Scott Lang, Hank Pym, Hope van Dyne, Darren Cross (Yellowjacket)',
        stone: '🌀 The Quantum Realm',
        wikipedia: 'https://en.wikipedia.org/wiki/Ant-Man_(film)',
        color: '#ea580c'
      }
    ];

    // Load saved watch state from localStorage
    this.state = this.loadState();

    // Setup real-time sync listeners if engine exists
    this.setupSync();
  }

  loadState() {
    try {
      const saved = localStorage.getItem('thanu_mcu_watchlist_state');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse MCU state:', e);
    }
    // Default initial state
    return {
      watched: {}, // { [id]: { thanu: boolean, rk: boolean } }
      ratings: {}  // { [id]: number }
    };
  }

  saveState() {
    try {
      localStorage.setItem('thanu_mcu_watchlist_state', JSON.stringify(this.state));
    } catch (e) {
      console.warn('Failed to save MCU state:', e);
    }
  }

  setupSync() {
    if (!this.syncEngine) return;

    const handleWatchToggle = (data) => {
      if (!data || !data.movieId) return;
      if (!this.state.watched[data.movieId]) {
        this.state.watched[data.movieId] = {};
      }
      this.state.watched[data.movieId][data.userRole] = !!data.watched;
      this.saveState();
      this.render();
      if (window.app) {
        const movie = this.movies.find(m => m.id === data.movieId);
        const name = data.userRole === 'thanu' ? 'Thanasri 💜' : 'Ranjith 💙';
        const action = data.watched ? 'watched' : 'unmarked';
        window.app.showToast(`${name} ${action} ${movie ? movie.title : 'a movie'}! 🍿`);
      }
    };

    const handleRating = (data) => {
      if (!data || !data.movieId) return;
      this.state.ratings[data.movieId] = data.rating;
      this.saveState();
      this.render();
    };

    if (this.syncEngine.on) {
      this.syncEngine.on('MCU_WATCH_TOGGLE', handleWatchToggle);
      this.syncEngine.on('MCU_RATING', handleRating);
    }
  }

  init() {
    this.render();
    this.bindEvents();
  }

  bindEvents() {
    // Search input listener
    const searchInput = document.getElementById('mcu-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = (e.target.value || '').trim().toLowerCase();
        this.renderMovies();
      });
    }

    // Filter pill buttons
    const filterPills = document.querySelectorAll('.mcu-filter-pill');
    filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.activeFilter = pill.getAttribute('data-filter') || 'all';
        this.renderMovies();
      });
    });
  }

  getCurrentUserRole() {
    if (this.syncEngine && this.syncEngine.userRole) {
      return this.syncEngine.userRole;
    }
    const saved = localStorage.getItem('thanu_sync_user_role');
    return saved === 'thanu' ? 'thanu' : 'rk';
  }

  toggleWatch(movieId) {
    const role = this.getCurrentUserRole();
    if (!this.state.watched[movieId]) {
      this.state.watched[movieId] = {};
    }
    const currentStatus = !!this.state.watched[movieId][role];
    const newStatus = !currentStatus;
    this.state.watched[movieId][role] = newStatus;

    this.saveState();
    this.render();

    // Broadcast change to partner
    if (this.syncEngine && this.syncEngine.broadcast) {
      this.syncEngine.broadcast('MCU_WATCH_TOGGLE', {
        movieId,
        watched: newStatus,
        userRole: role
      });
    }

    if (window.app) {
      const movie = this.movies.find(m => m.id === movieId);
      const title = movie ? movie.title : 'Movie';
      if (newStatus) {
        window.app.showToast(`Marked "${title}" as Watched! 🍿✨`);
      } else {
        window.app.showToast(`Removed "${title}" from Watched list`);
      }
    }
  }

  setRating(movieId, rating) {
    this.state.ratings[movieId] = rating;
    this.saveState();
    this.renderMovies();

    // Broadcast rating
    if (this.syncEngine && this.syncEngine.broadcast) {
      this.syncEngine.broadcast('MCU_RATING', {
        movieId,
        rating
      });
    }
  }

  isMovieWatched(movieId) {
    const w = this.state.watched[movieId];
    return !!(w && (w.thanu || w.rk));
  }

  isMovieWatchedTogether(movieId) {
    const w = this.state.watched[movieId];
    return !!(w && w.thanu && w.rk);
  }

  getFilteredMovies() {
    return this.movies.filter(movie => {
      // 1. Phase or status filter
      if (this.activeFilter === 'phase1' && movie.phase !== 1) return false;
      if (this.activeFilter === 'phase2' && movie.phase !== 2) return false;
      if (this.activeFilter === 'watched' && !this.isMovieWatched(movie.id)) return false;
      if (this.activeFilter === 'unwatched' && this.isMovieWatched(movie.id)) return false;

      // 2. Search query filter
      if (this.searchQuery) {
        const text = `${movie.title} ${movie.year} ${movie.characters} ${movie.director} ${movie.highlights}`.toLowerCase();
        if (!text.includes(this.searchQuery)) return false;
      }

      return true;
    });
  }

  render() {
    this.renderProgress();
    this.renderMovies();
  }

  renderProgress() {
    const totalCount = this.movies.length;
    let watchedCount = 0;
    let thanuCount = 0;
    let rkCount = 0;

    this.movies.forEach(m => {
      const w = this.state.watched[m.id];
      if (w && (w.thanu || w.rk)) watchedCount++;
      if (w && w.thanu) thanuCount++;
      if (w && w.rk) rkCount++;
    });

    const percent = Math.round((watchedCount / totalCount) * 100);

    const statsEl = document.getElementById('mcu-progress-stats');
    if (statsEl) {
      statsEl.textContent = `${watchedCount} of ${totalCount} Movies Watched • ${percent}%`;
    }

    const fillEl = document.getElementById('mcu-progress-fill');
    if (fillEl) {
      fillEl.style.width = `${percent}%`;
    }

    const badgesEl = document.getElementById('mcu-progress-user-badges');
    if (badgesEl) {
      badgesEl.innerHTML = `
        <span style="color: #9333ea;">💜 Thanasri: <strong>${thanuCount}/12</strong></span>
        <span style="color: #2563eb;">💙 Ranjith: <strong>${rkCount}/12</strong></span>
      `;
    }
  }

  renderMovies() {
    const container = document.getElementById('mcu-content-area');
    if (!container) return;

    const filtered = this.getFilteredMovies();

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem 1.5rem; background: white; border-radius: var(--radius-lg); border: 1.5px dashed var(--purple-200);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🍿</div>
          <h4 style="color: var(--purple-900); font-weight: 700; margin: 0 0 0.35rem 0;">No MCU movies found</h4>
          <p style="color: var(--purple-600); font-size: 0.9rem; margin: 0;">Try adjusting your filter or search keywords.</p>
        </div>
      `;
      return;
    }

    // Group filtered movies by Phase
    const phases = [
      { num: 1, name: 'Phase 1: Assemble', saga: 'The Infinity Saga' },
      { num: 2, name: 'Phase 2: Age of Heroes', saga: 'The Infinity Saga' }
    ];

    let html = '';

    phases.forEach(phase => {
      const phaseMovies = filtered.filter(m => m.phase === phase.num);
      if (phaseMovies.length === 0) return;

      const phaseTotal = this.movies.filter(m => m.phase === phase.num).length;
      const phaseWatched = phaseMovies.filter(m => this.isMovieWatched(m.id)).length;

      html += `
        <div class="mcu-phase-section" id="mcu-phase-${phase.num}-section">
          <div class="mcu-phase-header">
            <div class="mcu-phase-title-group">
              <h3>${phase.name}</h3>
              <span class="mcu-phase-saga-tag">(${phase.saga})</span>
            </div>
            <span class="mcu-phase-count-badge">${phaseWatched}/${phaseTotal} Watched</span>
          </div>

          <div class="mcu-movies-grid">
            ${phaseMovies.map(movie => this.renderMovieCard(movie)).join('')}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  renderMovieCard(movie) {
    const w = this.state.watched[movie.id] || {};
    const role = this.getCurrentUserRole();
    const isWatchedByMe = !!w[role];
    const isWatchedTogether = !!(w.thanu && w.rk);
    const isAnyWatched = !!(w.thanu || w.rk);
    const rating = this.state.ratings[movie.id] || 0;

    // Star rating HTML
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
      const filled = i <= rating ? 'filled' : '';
      starsHtml += `<span class="mcu-star ${filled}" onclick="window.mcuWatchlist.setRating('${movie.id}', ${i})" title="Rate ${i} Star${i > 1 ? 's' : ''}">★</span>`;
    }

    return `
      <div class="mcu-movie-card ${isAnyWatched ? 'watched' : ''}" style="--card-accent: ${movie.color};" id="card-${movie.id}">
        <div>
          <div class="mcu-card-top">
            <span class="mcu-index-badge">${movie.phaseOrder}. Phase ${movie.phase}</span>
            <span class="mcu-year-badge">${movie.year}</span>
          </div>

          <div class="mcu-card-title-group">
            <h4 class="mcu-movie-title">${movie.title}</h4>
            <span class="mcu-movie-tagline">"${movie.tagline}"</span>
          </div>

          <p class="mcu-movie-highlights">${movie.highlights}</p>

          ${movie.stone ? `
            <div class="mcu-stone-introduced" title="Infinity Stone lore">
              <span>💎</span>
              <span>${movie.stone}</span>
            </div>
          ` : ''}

          <div class="mcu-user-watchers">
            <span class="mcu-user-chip ${w.thanu ? 'thanu-watched' : ''}">
              ${w.thanu ? '✓ Thanu Watched 💜' : '○ Thanu'}
            </span>
            <span class="mcu-user-chip ${w.rk ? 'ranjith-watched' : ''}">
              ${w.rk ? '✓ Ranjith Watched 💙' : '○ Ranjith'}
            </span>
            ${isWatchedTogether ? '<span class="mcu-user-chip" style="background:#fef3c7; color:#b45309; border:1px solid #fde68a;">🍿 Watched Together!</span>' : ''}
          </div>
        </div>

        <div class="mcu-card-actions">
          <a href="${movie.wikipedia}" target="_blank" rel="noopener noreferrer" class="mcu-wikipedia-btn" title="Read on Wikipedia">
            <span>Wikipedia</span>
            <span>↗</span>
          </a>

          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <div class="mcu-star-rating" title="Give your rating">
              ${starsHtml}
            </div>

            <button type="button" class="mcu-watch-btn ${isWatchedByMe ? 'active' : ''}" onclick="window.mcuWatchlist.toggleWatch('${movie.id}')">
              <span>${isWatchedByMe ? '✓ Watched' : '+ Watch'}</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

// Global instance setup
window.McuWatchlist = McuWatchlist;
