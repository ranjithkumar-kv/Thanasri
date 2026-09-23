/* ==========================================================================
   Thanu's WorkSpace - Saved Modules Manager
   Whiteboard Slide Snapshots & Past Lectures Archive
   LocalStorage persistent storage
   ========================================================================== */

class SavedModulesManager {
  constructor() {
    this.slidesKey = 'thanu_saved_slides_v1';
    this.lecturesKey = 'thanu_saved_lectures_v1';
    this.savedSlides = [];
    this.savedLectures = [];

    this.loadData();
    this.initEvents();
    this.renderSlides();
    this.renderLectures();
    this.updateBadge();
  }

  loadData() {
    try {
      const storedSlides = localStorage.getItem(this.slidesKey);
      this.savedSlides = storedSlides ? JSON.parse(storedSlides) : [];

      const storedLectures = localStorage.getItem(this.lecturesKey);
      if (storedLectures) {
        this.savedLectures = JSON.parse(storedLectures);
      } else {
        // Pre-populate with initial meaningful lectures taken before!
        this.savedLectures = [
          {
            id: 'lec-1',
            title: 'Foundations of Programming & Problem Solving',
            date: '2024-05-12',
            category: 'Tech',
            notes: 'Comprehensive introduction covering variables, conditions, loops, and clean function structuring. Key focus was developing logical thinking without getting stressed.',
            keyPoints: ['Variables & Types', 'Conditionals & If-Else logic', 'Loops and repetition', 'Writing reusable functions']
          },
          {
            id: 'lec-2',
            title: 'Japanese Hiragana & Essential Manners',
            date: '2024-07-20',
            category: 'Japanese',
            notes: 'Covered the 46 core Hiragana sounds (A-I-U-E-O through WA-WO-N), plus cultural manners like bow etiquette and saying Otanjoubi Omedetou!',
            keyPoints: ['Basic Hiragana chart', 'Pronouncing A-I-U-E-O', 'Daily greetings', 'Polite particle wa']
          },
          {
            id: 'lec-3',
            title: 'Color Theory & Purple Aesthetics in Web Design',
            date: '2024-09-02',
            category: 'Design',
            notes: 'Explored why lavender and amethyst purple create a calming, royal, and inspiring workspace environment when paired with clean white surfaces.',
            keyPoints: ['80/20 Color rule', 'Soft shadows & glassmorphism', 'Readability & typography']
          }
        ];
        this.saveLecturesToStorage();
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }

  saveSlidesToStorage() {
    try {
      localStorage.setItem(this.slidesKey, JSON.stringify(this.savedSlides));
      this.updateBadge();
    } catch (e) {
      console.warn('Storage quota exceeded or error:', e);
    }
  }

  saveLecturesToStorage() {
    try {
      localStorage.setItem(this.lecturesKey, JSON.stringify(this.savedLectures));
      this.updateBadge();
    } catch (e) {}
  }

  updateBadge() {
    const badgeEl = document.getElementById('saved-modules-badge');
    if (badgeEl) {
      const total = this.savedSlides.length + this.savedLectures.length;
      badgeEl.textContent = total;
    }
  }

  initEvents() {
    // Saved modules subtabs (Whiteboard Slides vs Lectures)
    const tabs = document.querySelectorAll('.saved-tab-btn');
    const panels = document.querySelectorAll('.saved-panel');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        const target = tab.dataset.target;
        const panel = document.getElementById(`saved-${target}`);
        if (panel) panel.classList.add('active');
      });
    });

    // Add lecture modal open & close
    const openAddModalBtn = document.getElementById('btn-open-add-lecture');
    const addLectureModal = document.getElementById('add-lecture-modal');
    const cancelModalBtn = document.getElementById('btn-cancel-lecture');
    const lectureForm = document.getElementById('add-lecture-form');

    if (openAddModalBtn && addLectureModal) {
      openAddModalBtn.addEventListener('click', () => {
        addLectureModal.classList.add('active');
        const dateInput = document.getElementById('form-lecture-date');
        if (dateInput && !dateInput.value) {
          dateInput.value = new Date().toISOString().split('T')[0];
        }
      });
    }

    if (cancelModalBtn && addLectureModal) {
      cancelModalBtn.addEventListener('click', () => {
        addLectureModal.classList.remove('active');
      });
    }

    if (lectureForm) {
      lectureForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleCreateLecture();
      });
    }

    // Search lectures input
    const searchInput = document.getElementById('lecture-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filterLectures(e.target.value.toLowerCase());
      });
    }

    // Slide preview modal close
    const slidePreviewModal = document.getElementById('slide-preview-modal');
    const closeSlideModal = document.getElementById('btn-close-slide-preview');
    if (closeSlideModal && slidePreviewModal) {
      closeSlideModal.addEventListener('click', () => {
        slidePreviewModal.classList.remove('active');
      });
    }
  }

  /* 1. Slide Management from Whiteboard */
  saveSlide({ title, imageData, strokesCount }) {
    const newSlide = {
      id: 'slide-' + Date.now(),
      title: title || `Whiteboard Note #${this.savedSlides.length + 1}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      imageData,
      strokesCount: strokesCount || 0
    };

    this.savedSlides.unshift(newSlide);
    this.saveSlidesToStorage();
    this.renderSlides();
    return newSlide;
  }

  deleteSlide(slideId) {
    if (confirm('Delete this saved slide?')) {
      this.savedSlides = this.savedSlides.filter(s => s.id !== slideId);
      this.saveSlidesToStorage();
      this.renderSlides();
      if (window.app) window.app.showToast('Slide deleted');
    }
  }

  renderSlides() {
    const grid = document.getElementById('saved-slides-grid');
    const emptyBox = document.getElementById('saved-slides-empty');
    if (!grid) return;

    if (this.savedSlides.length === 0) {
      grid.style.display = 'none';
      if (emptyBox) emptyBox.style.display = 'block';
      return;
    }

    grid.style.display = 'grid';
    if (emptyBox) emptyBox.style.display = 'none';
    grid.innerHTML = '';

    this.savedSlides.forEach(slide => {
      const card = document.createElement('div');
      card.className = 'saved-slide-card';
      card.innerHTML = `
        <div class="slide-card-thumb-wrap">
          <img src="${slide.imageData}" alt="${slide.title}" />
        </div>
        <div class="slide-card-body">
          <div class="slide-card-title">${slide.title}</div>
          <div class="slide-card-date">📅 ${slide.date}</div>
          <div class="slide-card-actions">
            <button class="btn btn-secondary btn-sm" style="flex:1;" data-action="preview">View Full</button>
            <a href="${slide.imageData}" download="${slide.title}.png" class="btn btn-white btn-sm" title="Download Image">⬇️</a>
            <button class="btn btn-white btn-sm" style="color:#dc2626;" data-action="delete" title="Delete">🗑️</button>
          </div>
        </div>
      `;

      card.querySelector('[data-action="preview"]').addEventListener('click', () => {
        this.openSlidePreview(slide);
      });

      card.querySelector('[data-action="delete"]').addEventListener('click', () => {
        this.deleteSlide(slide.id);
      });

      grid.appendChild(card);
    });
  }

  openSlidePreview(slide) {
    const modal = document.getElementById('slide-preview-modal');
    const titleEl = document.getElementById('slide-preview-title');
    const imgEl = document.getElementById('slide-preview-img');
    const downloadLink = document.getElementById('slide-preview-download');

    if (!modal) return;
    if (titleEl) titleEl.textContent = slide.title;
    if (imgEl) imgEl.src = slide.imageData;
    if (downloadLink) {
      downloadLink.href = slide.imageData;
      downloadLink.download = `${slide.title}.png`;
    }

    modal.classList.add('active');
  }

  /* 2. Lectures & Topics Management */
  handleCreateLecture() {
    const titleInput = document.getElementById('form-lecture-title');
    const dateInput = document.getElementById('form-lecture-date');
    const catInput = document.getElementById('form-lecture-category');
    const notesInput = document.getElementById('form-lecture-notes');
    const pointsInput = document.getElementById('form-lecture-points');
    const modal = document.getElementById('add-lecture-modal');

    if (!titleInput.value.trim()) {
      alert('Please provide a topic title');
      return;
    }

    const keyPoints = pointsInput.value
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    const newLecture = {
      id: 'lec-' + Date.now(),
      title: titleInput.value.trim(),
      date: dateInput.value || new Date().toISOString().split('T')[0],
      category: catInput.value || 'General',
      notes: notesInput.value.trim() || 'No additional notes provided.',
      keyPoints
    };

    this.savedLectures.unshift(newLecture);
    this.saveLecturesToStorage();
    this.renderLectures();

    // Reset and close
    titleInput.value = '';
    notesInput.value = '';
    pointsInput.value = '';
    if (modal) modal.classList.remove('active');

    if (window.app) {
      window.app.showToast('New lecture added to Saved Modules! 💜');
    }
  }

  deleteLecture(id) {
    if (confirm('Delete this lecture?')) {
      this.savedLectures = this.savedLectures.filter(l => l.id !== id);
      this.saveLecturesToStorage();
      this.renderLectures();
      if (window.app) window.app.showToast('Lecture deleted');
    }
  }

  renderLectures(filteredList = null) {
    const grid = document.getElementById('lectures-list-grid');
    const emptyBox = document.getElementById('lectures-empty');
    if (!grid) return;

    const list = filteredList || this.savedLectures;

    if (list.length === 0) {
      grid.style.display = 'none';
      if (emptyBox) emptyBox.style.display = 'block';
      return;
    }

    grid.style.display = 'grid';
    if (emptyBox) emptyBox.style.display = 'none';
    grid.innerHTML = '';

    list.forEach(lec => {
      const card = document.createElement('div');
      card.className = 'lecture-card';

      const pointsHtml = lec.keyPoints && lec.keyPoints.length > 0
        ? `<div style="margin-bottom:1rem;">
             <strong style="font-size:0.82rem;color:var(--purple-700);display:block;margin-bottom:0.35rem;">CONCEPTS COVERED:</strong>
             <ul style="padding-left:1.2rem;font-size:0.85rem;color:var(--purple-900);">
               ${lec.keyPoints.map(pt => `<li>${pt}</li>`).join('')}
             </ul>
           </div>`
        : '';

      card.innerHTML = `
        <div class="lecture-card-meta">
          <span class="lecture-tag">${lec.category}</span>
          <span class="lecture-date">📅 ${lec.date}</span>
        </div>
        <h4>${lec.title}</h4>
        <p class="lecture-notes-preview">${lec.notes}</p>
        ${pointsHtml}
        <div class="lecture-card-footer">
          <span style="font-size:0.78rem;font-weight:700;color:var(--purple-600);">✓ Recorded Lecture</span>
          <button class="btn btn-white btn-sm" style="color:#dc2626;" data-action="delete">🗑️ Delete</button>
        </div>
      `;

      card.querySelector('[data-action="delete"]').addEventListener('click', () => {
        this.deleteLecture(lec.id);
      });

      grid.appendChild(card);
    });
  }

  filterLectures(query) {
    if (!query) {
      this.renderLectures();
      return;
    }
    const filtered = this.savedLectures.filter(l => 
      l.title.toLowerCase().includes(query) ||
      l.category.toLowerCase().includes(query) ||
      l.notes.toLowerCase().includes(query)
    );
    this.renderLectures(filtered);
  }
}

window.SavedModulesManager = SavedModulesManager;
