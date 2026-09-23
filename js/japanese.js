/* ==========================================================================
   Thanu's WorkSpace - Japanese Learning Engine
   Module: "日本語を学ぶ" (Learn Japanese)
   From Basics: Hiragana, Katakana, Phrases, Numbers, Grammar, Audio, Quiz
   ========================================================================== */

class JapaneseLearningHub {
  constructor() {
    this.activeTab = 'kana';
    this.activeKanaType = 'hiragana';
    this.quizState = {
      currentIndex: 0,
      score: 0,
      totalQuestions: 8,
      questions: []
    };

    this.kanaData = {
      hiragana: [
        { char: 'あ', romaji: 'a' }, { char: 'い', romaji: 'i' }, { char: 'う', romaji: 'u' }, { char: 'え', romaji: 'e' }, { char: 'お', romaji: 'o' },
        { char: 'か', romaji: 'ka' }, { char: 'き', romaji: 'ki' }, { char: 'く', romaji: 'ku' }, { char: 'け', romaji: 'ke' }, { char: 'こ', romaji: 'ko' },
        { char: 'さ', romaji: 'sa' }, { char: 'し', romaji: 'shi' }, { char: 'す', romaji: 'su' }, { char: 'せ', romaji: 'se' }, { char: 'そ', romaji: 'so' },
        { char: 'た', romaji: 'ta' }, { char: 'ち', romaji: 'chi' }, { char: 'つ', romaji: 'tsu' }, { char: 'て', romaji: 'te' }, { char: 'と', romaji: 'to' },
        { char: 'な', romaji: 'na' }, { char: 'に', romaji: 'ni' }, { char: 'ぬ', romaji: 'nu' }, { char: 'ね', romaji: 'ne' }, { char: 'の', romaji: 'no' },
        { char: 'は', romaji: 'ha' }, { char: 'ひ', romaji: 'hi' }, { char: 'ふ', romaji: 'fu' }, { char: 'へ', romaji: 'he' }, { char: 'ほ', romaji: 'ho' },
        { char: 'ま', romaji: 'ma' }, { char: 'み', romaji: 'mi' }, { char: 'む', romaji: 'mu' }, { char: 'め', romaji: 'me' }, { char: 'も', romaji: 'mo' },
        { char: 'や', romaji: 'ya' }, { char: 'ゆ', romaji: 'yu' }, { char: 'よ', romaji: 'yo' },
        { char: 'ら', romaji: 'ra' }, { char: 'り', romaji: 'ri' }, { char: 'る', romaji: 'ru' }, { char: 'れ', romaji: 're' }, { char: 'ろ', romaji: 'ro' },
        { char: 'わ', romaji: 'wa' }, { char: 'を', romaji: 'wo' }, { char: 'ん', romaji: 'n' }
      ],
      katakana: [
        { char: 'ア', romaji: 'a' }, { char: 'イ', romaji: 'i' }, { char: 'ウ', romaji: 'u' }, { char: 'エ', romaji: 'e' }, { char: 'オ', romaji: 'o' },
        { char: 'カ', romaji: 'ka' }, { char: 'キ', romaji: 'ki' }, { char: 'ク', romaji: 'ku' }, { char: 'ケ', romaji: 'ke' }, { char: 'コ', romaji: 'ko' },
        { char: 'サ', romaji: 'sa' }, { char: 'シ', romaji: 'shi' }, { char: 'ス', romaji: 'su' }, { char: 'セ', romaji: 'se' }, { char: 'ソ', romaji: 'so' },
        { char: 'タ', romaji: 'ta' }, { char: 'チ', romaji: 'chi' }, { char: 'ツ', romaji: 'tsu' }, { char: 'テ', romaji: 'te' }, { char: 'ト', romaji: 'to' },
        { char: 'ナ', romaji: 'na' }, { char: 'ニ', romaji: 'ni' }, { char: 'ヌ', romaji: 'nu' }, { char: 'ネ', romaji: 'ne' }, { char: 'ノ', romaji: 'no' },
        { char: 'ハ', romaji: 'ha' }, { char: 'ヒ', romaji: 'hi' }, { char: 'フ', romaji: 'fu' }, { char: 'ヘ', romaji: 'he' }, { char: 'ホ', romaji: 'ho' },
        { char: 'マ', romaji: 'ma' }, { char: 'ミ', romaji: 'mi' }, { char: 'ム', romaji: 'mu' }, { char: 'メ', romaji: 'me' }, { char: 'モ', romaji: 'mo' },
        { char: 'ヤ', romaji: 'ya' }, { char: 'ユ', romaji: 'yu' }, { char: 'ヨ', romaji: 'yo' },
        { char: 'ラ', romaji: 'ra' }, { char: 'リ', romaji: 'ri' }, { char: 'ル', romaji: 'ru' }, { char: 'レ', romaji: 're' }, { char: 'ロ', romaji: 'ro' },
        { char: 'ワ', romaji: 'wa' }, { char: 'ヲ', romaji: 'wo' }, { char: 'ン', romaji: 'n' }
      ]
    };

    this.phrasesData = [
      { jp: 'お誕生日おめでとう！', romaji: 'Otanjoubi omedetou!', en: 'Happy Birthday Cuteuhhh! 💜', special: true },
      { jp: 'おはようございます', romaji: 'Ohayou gozaimasu', en: 'Good morning' },
      { jp: 'こんにちは', romaji: 'Konnichiwa', en: 'Hello / Good afternoon' },
      { jp: 'こんばんは', romaji: 'Konbanwa', en: 'Good evening' },
      { jp: 'ありがとうございます', romaji: 'Arigatou gozaimasu', en: 'Thank you very much' },
      { jp: 'よろしくお願いします', romaji: 'Yoroshiku onegaishimasu', en: 'Pleased to meet you / Let\'s do well together' },
      { jp: 'おやすみなさい', romaji: 'Oyasuminasai', en: 'Good night' },
      { jp: 'かわいい！', romaji: 'Kawaii!', en: 'So cute!' },
      { jp: 'すごい！', romaji: 'Sugoi!', en: 'Amazing / Incredible!' },
      { jp: 'だいじょうぶです', romaji: 'Daijoubu desu', en: 'It\'s all right / Everything will be okay' },
      { jp: 'がんばって！', romaji: 'Ganbatte!', en: 'Do your best / You can do it!' }
    ];

    this.numbersData = [
      { jp: '一 (いち)', romaji: 'ichi', en: '1' },
      { jp: '二 (に)', romaji: 'ni', en: '2' },
      { jp: '三 (さん)', romaji: 'san', en: '3' },
      { jp: '四 (よん / し)', romaji: 'yon / shi', en: '4' },
      { jp: '五 (ご)', romaji: 'go', en: '5' },
      { jp: '六 (ろく)', romaji: 'roku', en: '6' },
      { jp: '七 (なな / しち)', romaji: 'nana / shichi', en: '7' },
      { jp: '八 (はち)', romaji: 'hachi', en: '8' },
      { jp: '九 (きゅう)', romaji: 'kyuu', en: '9' },
      { jp: '十 (じゅう)', romaji: 'juu', en: '10' },
      { jp: '百 (ひゃく)', romaji: 'hyaku', en: '100' },
      { jp: '千 (せん)', romaji: 'sen', en: '1,000' }
    ];

    this.initEvents();
    this.renderKanaGrid();
    this.renderPhrases();
    this.renderNumbers();
    this.startQuiz();
  }

  initEvents() {
    // Navigation Tabs
    const tabs = document.querySelectorAll('.jp-tab-btn');
    const panels = document.querySelectorAll('.jp-panel');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        const targetId = tab.dataset.target;
        this.activeTab = targetId;
        const panel = document.getElementById(`jp-${targetId}`);
        if (panel) panel.classList.add('active');
      });
    });

    // Kana Sub-toggle (Hiragana vs Katakana)
    const btnHiragana = document.getElementById('btn-show-hiragana');
    const btnKatakana = document.getElementById('btn-show-katakana');

    if (btnHiragana && btnKatakana) {
      btnHiragana.addEventListener('click', () => {
        this.activeKanaType = 'hiragana';
        btnHiragana.classList.add('active');
        btnKatakana.classList.remove('active');
        this.renderKanaGrid();
      });

      btnKatakana.addEventListener('click', () => {
        this.activeKanaType = 'katakana';
        btnKatakana.classList.add('active');
        btnHiragana.classList.remove('active');
        this.renderKanaGrid();
      });
    }

    // Quiz restart button
    const restartQuizBtn = document.getElementById('btn-restart-quiz');
    if (restartQuizBtn) {
      restartQuizBtn.addEventListener('click', () => this.startQuiz());
    }
  }

  /* Audio pronunciation using Web Speech API */
  speakJapanese(text) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop prior speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = 0.88; // Comfortable beginner listening speed
      window.speechSynthesis.speak(utterance);
    }
  }

  /* 1. Render Kana Grid */
  renderKanaGrid() {
    const grid = document.getElementById('kana-grid');
    if (!grid) return;

    grid.innerHTML = '';
    const items = this.kanaData[this.activeKanaType];

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'kana-card';
      card.innerHTML = `
        <div class="kana-char">${item.char}</div>
        <div class="kana-romaji">${item.romaji}</div>
        <div class="kana-audio-hint">🔊 play</div>
      `;
      card.addEventListener('click', () => {
        this.speakJapanese(item.char);
      });
      grid.appendChild(card);
    });
  }

  /* 2. Render Essential Phrases */
  renderPhrases() {
    const grid = document.getElementById('phrases-grid');
    if (!grid) return;

    grid.innerHTML = '';
    this.phrasesData.forEach(phrase => {
      const card = document.createElement('div');
      card.className = `phrase-card ${phrase.special ? 'special-birthday' : ''}`;
      card.innerHTML = `
        <div class="phrase-content">
          <h4>${phrase.jp}</h4>
          <div class="phrase-romaji">${phrase.romaji}</div>
          <div class="phrase-meaning">${phrase.en}</div>
        </div>
        <button class="phrase-speaker-btn" title="Listen pronunciation">🔊</button>
      `;
      card.addEventListener('click', () => {
        this.speakJapanese(phrase.jp);
      });
      grid.appendChild(card);
    });
  }

  /* 3. Render Numbers */
  renderNumbers() {
    const grid = document.getElementById('numbers-grid');
    if (!grid) return;

    grid.innerHTML = '';
    this.numbersData.forEach(item => {
      const card = document.createElement('div');
      card.className = 'phrase-card';
      card.innerHTML = `
        <div class="phrase-content">
          <h4>${item.jp}</h4>
          <div class="phrase-romaji">${item.romaji}</div>
          <div class="phrase-meaning">Number: ${item.en}</div>
        </div>
        <button class="phrase-speaker-btn">🔊</button>
      `;
      card.addEventListener('click', () => {
        this.speakJapanese(item.jp.split(' ')[0]);
      });
      grid.appendChild(card);
    });
  }

  /* 4. Interactive Quiz */
  startQuiz() {
    this.quizState.currentIndex = 0;
    this.quizState.score = 0;
    this.quizState.questions = this.generateQuizQuestions(8);

    const quizBox = document.getElementById('quiz-active-area');
    const resultBox = document.getElementById('quiz-result-area');
    if (quizBox) quizBox.style.display = 'block';
    if (resultBox) resultBox.style.display = 'none';

    this.renderCurrentQuestion();
  }

  generateQuizQuestions(count) {
    const pool = [...this.kanaData.hiragana, ...this.kanaData.katakana];
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const questions = [];

    for (let i = 0; i < count; i++) {
      const target = shuffled[i];
      // Generate 3 wrong options
      const wrong = pool
        .filter(p => p.romaji !== target.romaji)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map(p => p.romaji);

      const options = [target.romaji, ...wrong].sort(() => 0.5 - Math.random());
      questions.push({
        char: target.char,
        correct: target.romaji,
        options: options
      });
    }

    return questions;
  }

  renderCurrentQuestion() {
    const q = this.quizState.questions[this.quizState.currentIndex];
    if (!q) return;

    const charEl = document.getElementById('quiz-current-char');
    const countEl = document.getElementById('quiz-counter');
    const progressFill = document.getElementById('quiz-progress-fill');
    const optionsGrid = document.getElementById('quiz-options-grid');

    if (charEl) charEl.textContent = q.char;
    if (countEl) countEl.textContent = `Question ${this.quizState.currentIndex + 1} of ${this.quizState.totalQuestions}`;
    if (progressFill) {
      const pct = ((this.quizState.currentIndex) / this.quizState.totalQuestions) * 100;
      progressFill.style.width = `${pct}%`;
    }

    if (optionsGrid) {
      optionsGrid.innerHTML = '';
      q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'quiz-opt-btn';
        btn.textContent = opt;
        btn.addEventListener('click', () => this.handleQuizAnswer(btn, opt, q.correct));
        optionsGrid.appendChild(btn);
      });
    }
  }

  handleQuizAnswer(selectedBtn, chosen, correct) {
    const allBtns = document.querySelectorAll('.quiz-opt-btn');
    allBtns.forEach(b => b.disabled = true);

    if (chosen === correct) {
      selectedBtn.classList.add('correct');
      this.quizState.score++;
    } else {
      selectedBtn.classList.add('wrong');
      allBtns.forEach(b => {
        if (b.textContent === correct) b.classList.add('correct');
      });
    }

    setTimeout(() => {
      this.quizState.currentIndex++;
      if (this.quizState.currentIndex < this.quizState.totalQuestions) {
        this.renderCurrentQuestion();
      } else {
        this.finishQuiz();
      }
    }, 900);
  }

  finishQuiz() {
    const quizBox = document.getElementById('quiz-active-area');
    const resultBox = document.getElementById('quiz-result-area');
    const scoreVal = document.getElementById('quiz-final-score');
    const progressFill = document.getElementById('quiz-progress-fill');

    if (progressFill) progressFill.style.width = '100%';
    if (quizBox) quizBox.style.display = 'none';
    if (resultBox) resultBox.style.display = 'block';
    if (scoreVal) scoreVal.textContent = `${this.quizState.score} / ${this.quizState.totalQuestions}`;

    if (this.quizState.score >= 6 && window.birthdayApp) {
      window.birthdayApp.triggerBurstConfetti();
    }
    if (window.app) {
      window.app.showToast(`Quiz completed! Score: ${this.quizState.score}/${this.quizState.totalQuestions} 🌸`);
    }
  }
}

window.JapaneseLearningHub = JapaneseLearningHub;
