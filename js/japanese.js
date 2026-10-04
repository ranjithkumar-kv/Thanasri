/* ==========================================================================
   Thanu's WorkSpace - Japanese Learning Engine
   Module: "日本語を学ぶ" (Learn Japanese)
   From Foundations: Kana, Kanji Master, Themed Vocab, Dialogues, Verbs, Guide & Quiz
   ========================================================================== */

class JapaneseLearningHub {
  constructor() {
    this.activeTab = 'kana';
    this.activeKanaType = 'hiragana'; // 'hiragana' | 'katakana'
    this.activeKanaSound = 'basic'; // 'basic' | 'voiced' | 'combos'
    this.activeKanjiCat = 'all';
    this.activeVocabCat = 'all';
    this.activeVocabView = 'vocab'; // 'vocab' | 'dialogues'
    this.quizMode = 'kana'; // 'kana' | 'kanji' | 'vocab' | 'mixed'

    this.quizState = {
      currentIndex: 0,
      score: 0,
      totalQuestions: 8,
      questions: []
    };

    this.initDatasets();
    this.initAudioSystem();
    this.initEvents();
    this.renderKanaGrid();
    this.renderKanjiGrid();
    this.renderVocabGrid();
    this.renderDialogues();
    this.renderNumbers();
    this.renderDaysOfWeek();
    this.renderVerbConjugations();
    this.renderGrammarParticles();
    this.startQuiz();
  }

  /* ==========================================================================
     DATASETS INITIALIZATION
     ========================================================================== */
  initDatasets() {
    // 1. Kana Syllabary (Gojuon, Dakuon/Handakuon, Yoon)
    this.kanaData = {
      hiragana: {
        basic: [
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
        voiced: [
          { char: 'が', romaji: 'ga' }, { char: 'ぎ', romaji: 'gi' }, { char: 'ぐ', romaji: 'gu' }, { char: 'げ', romaji: 'ge' }, { char: 'ご', romaji: 'go' },
          { char: 'ざ', romaji: 'za' }, { char: 'じ', romaji: 'ji' }, { char: 'ず', romaji: 'zu' }, { char: 'ぜ', romaji: 'ze' }, { char: 'ぞ', romaji: 'zo' },
          { char: 'だ', romaji: 'da' }, { char: 'ぢ', romaji: 'ji' }, { char: 'づ', romaji: 'dzu' }, { char: 'で', romaji: 'de' }, { char: 'ど', romaji: 'do' },
          { char: 'ば', romaji: 'ba' }, { char: 'び', romaji: 'bi' }, { char: 'ぶ', romaji: 'bu' }, { char: 'べ', romaji: 'be' }, { char: 'ぼ', romaji: 'bo' },
          { char: 'ぱ', romaji: 'pa' }, { char: 'ぴ', romaji: 'pi' }, { char: 'ぷ', romaji: 'pu' }, { char: 'ぺ', romaji: 'pe' }, { char: 'ぽ', romaji: 'po' }
        ],
        combos: [
          { char: 'きゃ', romaji: 'kya' }, { char: 'きゅ', romaji: 'kyu' }, { char: 'きょ', romaji: 'kyo' },
          { char: 'しゃ', romaji: 'sha' }, { char: 'しゅ', romaji: 'shu' }, { char: 'しょ', romaji: 'sho' },
          { char: 'ちゃ', romaji: 'cha' }, { char: 'ちゅ', romaji: 'chu' }, { char: 'ちょ', romaji: 'cho' },
          { char: 'にゃ', romaji: 'nya' }, { char: 'にゅ', romaji: 'nyu' }, { char: 'にょ', romaji: 'nyo' },
          { char: 'ひゃ', romaji: 'hya' }, { char: 'ひゅ', romaji: 'hyu' }, { char: 'ひょ', romaji: 'hyo' },
          { char: 'みゃ', romaji: 'mya' }, { char: 'みゅ', romaji: 'myu' }, { char: 'みょ', romaji: 'myo' },
          { char: 'りゃ', romaji: 'rya' }, { char: 'りゅ', romaji: 'ryu' }, { char: 'りょ', romaji: 'ryo' },
          { char: 'ぎゃ', romaji: 'gya' }, { char: 'ぎゅ', romaji: 'gyu' }, { char: 'ぎょ', romaji: 'gyo' },
          { char: 'じゃ', romaji: 'ja' }, { char: 'じゅ', romaji: 'ju' }, { char: 'じょ', romaji: 'jo' },
          { char: 'びゃ', romaji: 'bya' }, { char: 'びゅ', romaji: 'byu' }, { char: 'びょ', romaji: 'byo' },
          { char: 'ぴゃ', romaji: 'pya' }, { char: 'ぴゅ', romaji: 'pyu' }, { char: 'ぴょ', romaji: 'pyo' }
        ]
      },
      katakana: {
        basic: [
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
        ],
        voiced: [
          { char: 'ガ', romaji: 'ga' }, { char: 'ギ', romaji: 'gi' }, { char: 'グ', romaji: 'gu' }, { char: 'ゲ', romaji: 'ge' }, { char: 'ゴ', romaji: 'go' },
          { char: 'ザ', romaji: 'za' }, { char: 'ジ', romaji: 'ji' }, { char: 'ズ', romaji: 'zu' }, { char: 'ゼ', romaji: 'ze' }, { char: 'ゾ', romaji: 'zo' },
          { char: 'ダ', romaji: 'da' }, { char: 'ヂ', romaji: 'ji' }, { char: 'ヅ', romaji: 'dzu' }, { char: 'デ', romaji: 'de' }, { char: 'ド', romaji: 'do' },
          { char: 'バ', romaji: 'ba' }, { char: 'ビ', romaji: 'bi' }, { char: 'ブ', romaji: 'bu' }, { char: 'ベ', romaji: 'be' }, { char: 'ボ', romaji: 'bo' },
          { char: 'パ', romaji: 'pa' }, { char: 'ピ', romaji: 'pi' }, { char: 'プ', romaji: 'pu' }, { char: 'ペ', romaji: 'pe' }, { char: 'ポ', romaji: 'po' }
        ],
        combos: [
          { char: 'キャ', romaji: 'kya' }, { char: 'キュ', romaji: 'kyu' }, { char: 'キョ', romaji: 'kyo' },
          { char: 'シャ', romaji: 'sha' }, { char: 'シュ', romaji: 'shu' }, { char: 'ショ', romaji: 'sho' },
          { char: 'チャ', romaji: 'cha' }, { char: 'チュ', romaji: 'chu' }, { char: 'チョ', romaji: 'cho' },
          { char: 'ニャ', romaji: 'nya' }, { char: 'ニュ', romaji: 'nyu' }, { char: 'ニョ', romaji: 'nyo' },
          { char: 'ヒャ', romaji: 'hya' }, { char: 'ヒュ', romaji: 'hyu' }, { char: 'ヒョ', romaji: 'hyo' },
          { char: 'ミャ', romaji: 'mya' }, { char: 'ミュ', romaji: 'myu' }, { char: 'ミョ', romaji: 'myo' },
          { char: 'リャ', romaji: 'rya' }, { char: 'リュ', romaji: 'ryu' }, { char: 'リョ', romaji: 'ryo' },
          { char: 'ギャ', romaji: 'gya' }, { char: 'ギュ', romaji: 'gyu' }, { char: 'ギョ', romaji: 'gyo' },
          { char: 'ジャ', romaji: 'ja' }, { char: 'ジュ', romaji: 'ju' }, { char: 'ジョ', romaji: 'jo' },
          { char: 'ビャ', romaji: 'bya' }, { char: 'ビュ', romaji: 'byu' }, { char: 'ビョ', romaji: 'byo' },
          { char: 'ピャ', romaji: 'pya' }, { char: 'ピュ', romaji: 'pyu' }, { char: 'ピョ', romaji: 'pyo' }
        ]
      }
    };

    // 2. Comprehensive Kanji Database (JLPT N5 Core)
    this.kanjiData = [
      // Nature & Elements
      { char: '日', meaning: 'Sun / Day', onyomi: 'ニチ, ジツ', kunyomi: 'ひ, -び, か', category: 'nature', strokes: 4, compounds: [{ jp: '日本', romaji: 'Nihon', en: 'Japan' }, { jp: '毎日', romaji: 'Mainichi', en: 'Everyday' }], mnemonic: 'A window with the bright sun shining through.' },
      { char: '月', meaning: 'Moon / Month', onyomi: 'ゲツ, ガツ', kunyomi: 'つき', category: 'nature', strokes: 4, compounds: [{ jp: '月曜日', romaji: 'Getsuyoubi', en: 'Monday' }, { jp: '一月', romaji: 'Ichigatsu', en: 'January' }], mnemonic: 'A crescent moon peeking between night clouds.' },
      { char: '火', meaning: 'Fire', onyomi: 'カ', kunyomi: 'ひ', category: 'nature', strokes: 4, compounds: [{ jp: '火曜日', romaji: 'Kayoubi', en: 'Tuesday' }, { jp: '花火', romaji: 'Hanabi', en: 'Fireworks' }], mnemonic: 'Sparks crackling outwards from a dancing flame.' },
      { char: '水', meaning: 'Water', onyomi: 'スイ', kunyomi: 'みず', category: 'nature', strokes: 4, compounds: [{ jp: '水曜日', romaji: 'Suiyoubi', en: 'Wednesday' }, { jp: 'お水', romaji: 'Omizu', en: 'Water' }], mnemonic: 'Droplets splashing as a fresh river flows.' },
      { char: '木', meaning: 'Tree / Wood', onyomi: 'モク, ボク', kunyomi: 'き', category: 'nature', strokes: 4, compounds: [{ jp: '木曜日', romaji: 'Mokuyoubi', en: 'Thursday' }, { jp: '木', romaji: 'Ki', en: 'Tree' }], mnemonic: 'A tall trunk with branches reaching up and roots down.' },
      { char: '金', meaning: 'Gold / Money', onyomi: 'キン', kunyomi: 'かね', category: 'nature', strokes: 8, compounds: [{ jp: '金曜日', romaji: 'Kinyoubi', en: 'Friday' }, { jp: 'お金', romaji: 'Okane', en: 'Money' }], mnemonic: 'Precious gold ingots buried safely beneath the ground.' },
      { char: '土', meaning: 'Earth / Soil', onyomi: 'ド, ト', kunyomi: 'つち', category: 'nature', strokes: 3, compounds: [{ jp: '土曜日', romaji: 'Doyoubi', en: 'Saturday' }, { jp: '土地', romaji: 'Tochi', en: 'Land / Plot' }], mnemonic: 'A green sprout emerging out of the rich earth.' },
      { char: '山', meaning: 'Mountain', onyomi: 'サン', kunyomi: 'やま', category: 'nature', strokes: 3, compounds: [{ jp: '富士山', romaji: 'Fujisan', en: 'Mt. Fuji' }, { jp: '火山', romaji: 'Kazan', en: 'Volcano' }], mnemonic: 'Three peaks of a towering mountain range.' },
      { char: '川', meaning: 'River', onyomi: 'セン', kunyomi: 'かわ', category: 'nature', strokes: 3, compounds: [{ jp: '小川', romaji: 'Ogawa', en: 'Brook' }, { jp: '川', romaji: 'Kawa', en: 'River' }], mnemonic: 'Three streams of water flowing side-by-side.' },
      { char: '雨', meaning: 'Rain', onyomi: 'ウ', kunyomi: 'あめ', category: 'nature', strokes: 8, compounds: [{ jp: '大雨', romaji: 'Ooame', en: 'Heavy rain' }, { jp: '雨', romaji: 'Ame', en: 'Rain' }], mnemonic: 'Raindrops falling from clouds under a cloudy sky.' },
      { char: '空', meaning: 'Sky / Empty', onyomi: 'クウ', kunyomi: 'そら, あ・く', category: 'nature', strokes: 8, compounds: [{ jp: '青空', romaji: 'Aozora', en: 'Blue sky' }, { jp: '空気', romaji: 'Kuuki', en: 'Air' }], mnemonic: 'Looking up through an opening into the vast clear sky.' },
      { char: '天', meaning: 'Heaven / Sky', onyomi: 'テン', kunyomi: 'あま', category: 'nature', strokes: 4, compounds: [{ jp: '天気', romaji: 'Tenki', en: 'Weather' }, { jp: '天国', romaji: 'Tengoku', en: 'Heaven' }], mnemonic: 'A person with arms spread under the endless sky.' },

      // People & Body
      { char: '人', meaning: 'Person / Human', onyomi: 'ジン, ニン', kunyomi: 'ひと', category: 'people', strokes: 2, compounds: [{ jp: '日本人', romaji: 'Nihonjin', en: 'Japanese person' }, { jp: '大人', romaji: 'Otona', en: 'Adult' }], mnemonic: 'Two legs supporting a standing human being.' },
      { char: '子', meaning: 'Child', onyomi: 'シ, ス', kunyomi: 'こ', category: 'people', strokes: 3, compounds: [{ jp: '子ども', romaji: 'Kodomo', en: 'Child' }, { jp: '女の子', romaji: 'Onnanoko', en: 'Girl' }], mnemonic: 'A cute baby with arms open wide.' },
      { char: '女', meaning: 'Woman / Female', onyomi: 'ジョ', kunyomi: 'おんな', category: 'people', strokes: 3, compounds: [{ jp: '女の人', romaji: 'Onna no hito', en: 'Woman' }, { jp: '彼女', romaji: 'Kanojo', en: 'She / Girlfriend' }], mnemonic: 'A person standing gracefully in a kimono.' },
      { char: '男', meaning: 'Man / Male', onyomi: 'ダン, ナン', kunyomi: 'おとこ', category: 'people', strokes: 7, compounds: [{ jp: '男の人', romaji: 'Otoko no hito', en: 'Man' }, { jp: '男の子', romaji: 'Otokonoko', en: 'Boy' }], mnemonic: 'Strength (力) applied working the rice field (田).' },
      { char: '目', meaning: 'Eye', onyomi: 'モク', kunyomi: 'め', category: 'people', strokes: 5, compounds: [{ jp: '目', romaji: 'Me', en: 'Eye' }, { jp: '目次', romaji: 'Mokuji', en: 'Table of contents' }], mnemonic: 'An eyeball with iris turned vertically.' },
      { char: '口', meaning: 'Mouth / Opening', onyomi: 'コウ, ク', kunyomi: 'くち', category: 'people', strokes: 3, compounds: [{ jp: '入口', romaji: 'Iriguchi', en: 'Entrance' }, { jp: '出口', romaji: 'Deguchi', en: 'Exit' }], mnemonic: 'An open mouth speaking and eating.' },
      { char: '手', meaning: 'Hand', onyomi: 'シュ', kunyomi: 'て', category: 'people', strokes: 4, compounds: [{ jp: '上手', romaji: 'Jouzu', en: 'Skillful' }, { jp: '手紙', romaji: 'Tegami', en: 'Letter' }], mnemonic: 'Five fingers spreading out from a palm.' },
      { char: '耳', meaning: 'Ear', onyomi: 'ジ', kunyomi: 'みみ', category: 'people', strokes: 6, compounds: [{ jp: '耳', romaji: 'Mimi', en: 'Ear' }, { jp: '初耳', romaji: 'Hatsumimi', en: 'First time hearing' }], mnemonic: 'The curves and folds of a human ear.' },
      { char: '足', meaning: 'Foot / Leg', onyomi: 'ソク', kunyomi: 'あし, た・りる', category: 'people', strokes: 7, compounds: [{ jp: '足', romaji: 'Ashi', en: 'Foot / Leg' }, { jp: '遠足', romaji: 'Ensoku', en: 'Excursion' }], mnemonic: 'A leg stepping forward with confidence.' },
      { char: '心', meaning: 'Heart / Mind / Spirit', onyomi: 'シン', kunyomi: 'こころ', category: 'people', strokes: 4, compounds: [{ jp: '安心', romaji: 'Anshin', en: 'Relief / Peace of mind' }, { jp: '中心', romaji: 'Chuushin', en: 'Center / Core' }], mnemonic: 'Four chambers and valves of a warm human heart.' },

      // Time & Numbers
      { char: '年', meaning: 'Year', onyomi: 'ネン', kunyomi: 'とし', category: 'time', strokes: 6, compounds: [{ jp: '今年', romaji: 'Kotoshi', en: 'This year' }, { jp: '来年', romaji: 'Rainen', en: 'Next year' }], mnemonic: 'A grain harvest requiring an entire year of care.' },
      { char: '時', meaning: 'Time / Hour', onyomi: 'ジ', kunyomi: 'とき', category: 'time', strokes: 10, compounds: [{ jp: '時間', romaji: 'Jikan', en: 'Time' }, { jp: '今何時', romaji: 'Ima nanji', en: 'What time is it now?' }], mnemonic: 'Sun (日) measuring time alongside temple (寺) bells.' },
      { char: '分', meaning: 'Minute / Part / Divide', onyomi: 'フン, ブン', kunyomi: 'わ・ける', category: 'time', strokes: 4, compounds: [{ jp: '五分', romaji: 'Gofun', en: '5 minutes' }, { jp: '半分', romaji: 'Hanbun', en: 'Half' }], mnemonic: 'A knife (刀) slicing eight (八) equal portions.' },
      { char: '今', meaning: 'Now / Present', onyomi: 'コン, キン', kunyomi: 'いま', category: 'time', strokes: 4, compounds: [{ jp: '今日', romaji: 'Kyou', en: 'Today' }, { jp: '今週', romaji: 'Konshuu', en: 'This week' }], mnemonic: 'All things sheltered together in the present moment.' },
      { char: '先', meaning: 'Previous / Ahead', onyomi: 'セン', kunyomi: 'さき', category: 'time', strokes: 6, compounds: [{ jp: '先生', romaji: 'Sensei', en: 'Teacher' }, { jp: '先週', romaji: 'Senshuu', en: 'Last week' }], mnemonic: 'A person walking ahead to lead the way.' },
      { char: '毎', meaning: 'Every / Each', onyomi: 'マイ', kunyomi: 'ごと', category: 'time', strokes: 6, compounds: [{ jp: '毎日', romaji: 'Mainichi', en: 'Everyday' }, { jp: '毎朝', romaji: 'Maiasa', en: 'Every morning' }], mnemonic: 'A mother caring for her family day in and day out.' },
      { char: '週', meaning: 'Week', onyomi: 'シュウ', kunyomi: '-', category: 'time', strokes: 11, compounds: [{ jp: '今週', romaji: 'Konshuu', en: 'This week' }, { jp: '週末', romaji: 'Shuumatsu', en: 'Weekend' }], mnemonic: 'A 7-day cycle traveling smoothly down the road.' },
      { char: '百', meaning: 'Hundred (100)', onyomi: 'ヒャク', kunyomi: 'もも', category: 'time', strokes: 6, compounds: [{ jp: '百円', romaji: 'Hyakuen', en: '100 Yen' }, { jp: '三百', romaji: 'Sanbyaku', en: '300' }], mnemonic: 'One stroke over white (白): counting 100 pearls.' },
      { char: '千', meaning: 'Thousand (1,000)', onyomi: 'セン', kunyomi: 'ち', category: 'time', strokes: 3, compounds: [{ jp: '千円', romaji: 'Senen', en: '1,000 Yen' }, { jp: '千葉', romaji: 'Chiba', en: 'Chiba prefecture' }], mnemonic: 'Ten (十) multiplied a hundredfold.' },
      { char: '万', meaning: 'Ten Thousand (10,000)', onyomi: 'マン, バン', kunyomi: 'よろず', category: 'time', strokes: 3, compounds: [{ jp: '一万円', romaji: 'Ichiman-en', en: '10,000 Yen' }, { jp: '万歳', romaji: 'Banzai', en: 'Cheers / Long life' }], mnemonic: 'A massive gathering counting into the ten thousands.' },

      // Directions & Places
      { char: '上', meaning: 'Up / Above', onyomi: 'ジョウ', kunyomi: 'うえ, あ・がる', category: 'directions', strokes: 3, compounds: [{ jp: '机の上', romaji: 'Tsukue no ue', en: 'On the desk' }, { jp: '上手', romaji: 'Jouzu', en: 'Skillful / Good at' }], mnemonic: 'A vertical line rising above the horizon.' },
      { char: '下', meaning: 'Down / Below', onyomi: 'カ, ゲ', kunyomi: 'した, さ・がる', category: 'directions', strokes: 3, compounds: [{ jp: '地下鉄', romaji: 'Chikatetsu', en: 'Subway' }, { jp: '下手', romaji: 'Heta', en: 'Clumsy / Unskilled' }], mnemonic: 'A stroke pointing down beneath the baseline.' },
      { char: '中', meaning: 'Middle / Inside', onyomi: 'チュウ', kunyomi: 'なか', category: 'directions', strokes: 4, compounds: [{ jp: '中国', romaji: 'Chuugoku', en: 'China' }, { jp: '一日中', romaji: 'Ichinichijuu', en: 'All day long' }], mnemonic: 'An arrow striking the bullseye center of a target.' },
      { char: '大', meaning: 'Big / Great', onyomi: 'ダイ, タイ', kunyomi: 'おお・きい', category: 'directions', strokes: 3, compounds: [{ jp: '大学', romaji: 'Daigaku', en: 'University' }, { jp: '大好き', romaji: 'Daisuki', en: 'Love / Like very much' }], mnemonic: 'A person stretching arms and legs out as big as can be.' },
      { char: '小', meaning: 'Small / Little', onyomi: 'ショウ', kunyomi: 'ちい・さい, こ', category: 'directions', strokes: 3, compounds: [{ jp: '小学校', romaji: 'Shougakkou', en: 'Elementary school' }, { jp: '小川', romaji: 'Ogawa', en: 'Brook / Stream' }], mnemonic: 'A split river dividing into small gentle drops.' },
      { char: '左', meaning: 'Left', onyomi: 'サ', kunyomi: 'ひだり', category: 'directions', strokes: 5, compounds: [{ jp: '左手', romaji: 'Hidarite', en: 'Left hand' }, { jp: '左右', romaji: 'Sayuu', en: 'Left and right' }], mnemonic: 'Left hand holding a measuring square.' },
      { char: '右', meaning: 'Right', onyomi: 'ウ, ユウ', kunyomi: 'みぎ', category: 'directions', strokes: 5, compounds: [{ jp: '右手', romaji: 'Migite', en: 'Right hand' }, { jp: '右側', romaji: 'Migigawa', en: 'Right side' }], mnemonic: 'Right hand bringing delicious food to mouth (口).' },
      { char: '北', meaning: 'North', onyomi: 'ホク', kunyomi: 'きた', category: 'directions', strokes: 5, compounds: [{ jp: '北海道', romaji: 'Hokkaido', en: 'Hokkaido' }, { jp: '北口', romaji: 'Kitaguchi', en: 'North exit' }], mnemonic: 'Two people back-to-back braving the cold north wind.' },
      { char: '南', meaning: 'South', onyomi: 'ナン', kunyomi: 'みなみ', category: 'directions', strokes: 9, compounds: [{ jp: '南口', romaji: 'Minamiguchi', en: 'South exit' }, { jp: '東南', romaji: 'Tounan', en: 'Southeast' }], mnemonic: 'A warm southern bell ringing in the breeze.' },
      { char: '東', meaning: 'East', onyomi: 'トウ', kunyomi: 'ひがし', category: 'directions', strokes: 8, compounds: [{ jp: '東京', romaji: 'Toukyou', en: 'Tokyo' }, { jp: '東口', romaji: 'Higashiguchi', en: 'East exit' }], mnemonic: 'The sun (日) rising behind a green tree (木) in the East.' },
      { char: '西', meaning: 'West', onyomi: 'セイ, サイ', kunyomi: 'にし', category: 'directions', strokes: 6, compounds: [{ jp: '西洋', romaji: 'Seiyou', en: 'Western world' }, { jp: '関西', romaji: 'Kansai', en: 'Kansai region' }], mnemonic: 'Birds returning to their nest as the sun sets in the West.' },

      // Everyday Life & Actions
      { char: '本', meaning: 'Book / Origin', onyomi: 'ホン', kunyomi: 'もと', category: 'life', strokes: 5, compounds: [{ jp: '本', romaji: 'Hon', en: 'Book' }, { jp: '日本', romaji: 'Nihon', en: 'Japan' }], mnemonic: 'A line across a tree trunk marking the root origin.' },
      { char: '学', meaning: 'Study / Learn', onyomi: 'ガク', kunyomi: 'まな・ぶ', category: 'life', strokes: 8, compounds: [{ jp: '学校', romaji: 'Gakkou', en: 'School' }, { jp: '学生', romaji: 'Gakusei', en: 'Student' }], mnemonic: 'A child (子) under a roof learning new wisdom.' },
      { char: '校', meaning: 'School', onyomi: 'コウ', kunyomi: '-', category: 'life', strokes: 10, compounds: [{ jp: '高校', romaji: 'Koukou', en: 'High school' }, { jp: '小学校', romaji: 'Shougakkou', en: 'Elementary school' }], mnemonic: 'A wooden academy where friends gather.' },
      { char: '生', meaning: 'Life / Birth / Live', onyomi: 'セイ, ショウ', kunyomi: 'い・きる, う・まれる', category: 'life', strokes: 5, compounds: [{ jp: '先生', romaji: 'Sensei', en: 'Teacher' }, { jp: '誕生日', romaji: 'Tanjoubi', en: 'Birthday' }], mnemonic: 'A fresh green plant sprouting into vibrant life.' },
      { char: '食', meaning: 'Eat / Food', onyomi: 'ショク', kunyomi: 'た・べる', category: 'life', strokes: 9, compounds: [{ jp: '食べる', romaji: 'Taberu', en: 'To eat' }, { jp: '食事', romaji: 'Shokuji', en: 'Meal' }], mnemonic: 'A bowl of tasty rice with a lid over it.' },
      { char: '飲', meaning: 'Drink', onyomi: 'イン', kunyomi: 'の・む', category: 'life', strokes: 12, compounds: [{ jp: '飲む', romaji: 'Nomu', en: 'To drink' }, { jp: '飲み物', romaji: 'Nomimono', en: 'Beverage' }], mnemonic: 'A person eagerly opening mouth for food & drink.' },
      { char: '見', meaning: 'See / Look / Watch', onyomi: 'ケン', kunyomi: 'み・る', category: 'life', strokes: 7, compounds: [{ jp: '見る', romaji: 'Miru', en: 'To see / watch' }, { jp: '意見', romaji: 'Iken', en: 'Opinion' }], mnemonic: 'An eye (目) strolling on legs to discover the world.' },
      { char: '行', meaning: 'Go / Act', onyomi: 'コウ, ギョウ', kunyomi: 'い・く, おこな・う', category: 'life', strokes: 6, compounds: [{ jp: '行く', romaji: 'Iku', en: 'To go' }, { jp: '旅行', romaji: 'Ryokou', en: 'Travel' }], mnemonic: 'A bustling crossroad where paths lead.' },
      { char: '来', meaning: 'Come / Next', onyomi: 'ライ', kunyomi: 'く・る, き・ます', category: 'life', strokes: 7, compounds: [{ jp: '来る', romaji: 'Kuru', en: 'To come' }, { jp: '来週', romaji: 'Raishuu', en: 'Next week' }], mnemonic: 'A ripening wheat stalk arriving for harvest.' },
      { char: '話', meaning: 'Speak / Talk / Story', onyomi: 'ワ', kunyomi: 'はな・す, はなし', category: 'life', strokes: 13, compounds: [{ jp: '話す', romaji: 'Hanasu', en: 'To talk' }, { jp: '電話', romaji: 'Denwa', en: 'Telephone' }], mnemonic: 'Words (言) shaped with the tongue (舌).' },
      { char: '友', meaning: 'Friend', onyomi: 'ユウ', kunyomi: 'とも', category: 'life', strokes: 4, compounds: [{ jp: '友達', romaji: 'Tomodachi', en: 'Friend' }, { jp: '親友', romaji: 'Shinyuu', en: 'Best friend' }], mnemonic: 'Two hands reaching out in affectionate friendship.' },
      { char: '語', meaning: 'Language / Word', onyomi: 'ゴ', kunyomi: 'かた・る', category: 'life', strokes: 14, compounds: [{ jp: '日本語', romaji: 'Nihongo', en: 'Japanese language' }, { jp: '英語', romaji: 'Eigo', en: 'English' }], mnemonic: 'Words (言) expressing thoughts and speech.' },
      { char: '車', meaning: 'Car / Vehicle', onyomi: 'シャ', kunyomi: 'くるま', category: 'life', strokes: 7, compounds: [{ jp: '電車', romaji: 'Densha', en: 'Train' }, { jp: '自動車', romaji: 'Jidousha', en: 'Car' }], mnemonic: 'A cart with axle and two wheels viewed from above.' },
      { char: '国', meaning: 'Country / Nation', onyomi: 'コク', kunyomi: 'くに', category: 'life', strokes: 8, compounds: [{ jp: '外国', romaji: 'Gaikoku', en: 'Foreign country' }, { jp: '国', romaji: 'Kuni', en: 'Country' }], mnemonic: 'A precious jade jewel (玉) protected inside borders (囗).' }
    ];

    // 3. Themed Vocabulary
    this.vocabData = [
      // Food
      { category: 'food', jp: 'ご飯 (ごはん)', romaji: 'Gohan', en: 'Cooked rice / Meal' },
      { category: 'food', jp: 'お水 (おみず)', romaji: 'Omizu', en: 'Water' },
      { category: 'food', jp: 'お茶 (おちゃ)', romaji: 'Ocha', en: 'Green tea' },
      { category: 'food', jp: 'ラーメン', romaji: 'Raamen', en: 'Ramen noodles' },
      { category: 'food', jp: 'お寿司 (おすし)', romaji: 'Osushi', en: 'Sushi' },
      { category: 'food', jp: '魚 (さかな)', romaji: 'Sakana', en: 'Fish' },
      { category: 'food', jp: '肉 (にく)', romaji: 'Niku', en: 'Meat' },
      { category: 'food', jp: '野菜 (やさい)', romaji: 'Yasai', en: 'Vegetables' },
      { category: 'food', jp: 'おいしい！', romaji: 'Oishii!', en: 'Delicious / Yummy!' },
      { category: 'food', jp: 'いただきます', romaji: 'Itadakimasu', en: 'I gratefully receive this meal' },

      // Family & People
      { category: 'family', jp: '家族 (かぞく)', romaji: 'Kazoku', en: 'Family' },
      { category: 'family', jp: 'お母さん (おかあさん)', romaji: 'Okaasan', en: 'Mother' },
      { category: 'family', jp: 'お父さん (おとうさん)', romaji: 'Otousan', en: 'Father' },
      { category: 'family', jp: '友達 (ともだち)', romaji: 'Tomodachi', en: 'Friend' },
      { category: 'family', jp: '先生 (せんせい)', romaji: 'Sensei', en: 'Teacher / Master' },
      { category: 'family', jp: '私 (わたし)', romaji: 'Watashi', en: 'I / Me' },
      { category: 'family', jp: 'あなた', romaji: 'Anata', en: 'You' },
      { category: 'family', jp: '子供 (こども)', romaji: 'Kodomo', en: 'Child / Children' },

      // Emotions & Adjectives
      { category: 'emotions', jp: '嬉しい！ (うれしい)', romaji: 'Ureshii!', en: 'Happy / Glad!' },
      { category: 'emotions', jp: '楽しい！ (たのしい)', romaji: 'Tanoshii!', en: 'Fun / Joyful!' },
      { category: 'emotions', jp: 'かわいい！', romaji: 'Kawaii!', en: 'So cute!' },
      { category: 'emotions', jp: 'きれい！', romaji: 'Kirei!', en: 'Beautiful / Clean!' },
      { category: 'emotions', jp: '大好き！ (だいすき)', romaji: 'Daisuki!', en: 'I love you / Like very much!' },
      { category: 'emotions', jp: '大丈夫です (だいじょうぶ)', romaji: 'Daijoubu desu', en: "It's all right / Everything is fine" },
      { category: 'emotions', jp: '優しい (やさしい)', romaji: 'Yasashii', en: 'Kind / Sweet' },
      { category: 'emotions', jp: 'すごい！', romaji: 'Sugoi!', en: 'Awesome / Amazing!' },

      // Core Action Verbs
      { category: 'verbs', jp: '食べる (たべる)', romaji: 'Taberu', en: 'To eat' },
      { category: 'verbs', jp: '飲む (のむ)', romaji: 'Nomu', en: 'To drink' },
      { category: 'verbs', jp: '行く (いく)', romaji: 'Iku', en: 'To go' },
      { category: 'verbs', jp: '来る (くる)', romaji: 'Kuru', en: 'To come' },
      { category: 'verbs', jp: '見る (みる)', romaji: 'Miru', en: 'To see / watch' },
      { category: 'verbs', jp: '聞く (きく)', romaji: 'Kiku', en: 'To listen / hear' },
      { category: 'verbs', jp: '話す (はなす)', romaji: 'Hanasu', en: 'To speak / talk' },
      { category: 'verbs', jp: '勉強する (べんきょうする)', romaji: 'Benkyou suru', en: 'To study' },
      { category: 'verbs', jp: '買う (かう)', romaji: 'Kau', en: 'To buy' },
      { category: 'verbs', jp: '寝る (ねる)', romaji: 'Neru', en: 'To sleep' },

      // Places & Travel
      { category: 'places', jp: '家 (いえ / うち)', romaji: 'Ie / Uchi', en: 'House / Home' },
      { category: 'places', jp: '部屋 (へや)', romaji: 'Heya', en: 'Room' },
      { category: 'places', jp: '学校 (がっこう)', romaji: 'Gakkou', en: 'School' },
      { category: 'places', jp: '駅 (えき)', romaji: 'Eki', en: 'Train station' },
      { category: 'places', jp: '病院 (びょういん)', romaji: 'Byouin', en: 'Hospital' },
      { category: 'places', jp: '店 (みせ)', romaji: 'Mise', en: 'Shop / Store' },
      { category: 'places', jp: 'トイレ', romaji: 'Toire', en: 'Restroom' },
      { category: 'places', jp: '空港 (くうこう)', romaji: 'Kuukou', en: 'Airport' }
    ];

    // 4. Real-life Situational Dialogues
    this.dialoguesData = [
      {
        title: '💬 Scenario 1: Polite Self-Introduction (自己紹介)',
        lines: [
          { speaker: 'A', name: 'Thanu', avatar: '💜', jp: 'はじめまして！タノです。', romaji: 'Hajimemashite! Thanu desu.', en: 'Nice to meet you! I am Thanu.' },
          { speaker: 'B', name: 'Friend', avatar: '🌸', jp: 'はじめまして！よろしくお願いします。', romaji: 'Hajimemashite! Yoroshiku onegaishimasu.', en: "Pleased to meet you! Let's be great friends." },
          { speaker: 'A', name: 'Thanu', avatar: '💜', jp: 'こちらこそ、よろしくお願いします！', romaji: 'Kochira koso, yoroshiku onegaishimasu!', en: 'Likewise, pleased to meet you!' }
        ]
      },
      {
        title: '☕ Scenario 2: Ordering at a Japanese Cafe (カフェで注文)',
        lines: [
          { speaker: 'A', name: 'Customer', avatar: '🍵', jp: 'すみません！メニューをお願いします。', romaji: 'Sumimasen! Menyuu o onegaishimasu.', en: 'Excuse me! Menu please.' },
          { speaker: 'B', name: 'Staff', avatar: '🧑‍🍳', jp: 'はい、どうぞ！何にしますか？', romaji: 'Hai, douzo! Nani ni shimasu ka?', en: 'Yes, here you go! What would you like?' },
          { speaker: 'A', name: 'Customer', avatar: '🍵', jp: 'これと抹茶ラテをください。', romaji: 'Kore to matcha rate o kudasai.', en: 'This one and a matcha latte, please.' },
          { speaker: 'B', name: 'Staff', avatar: '🧑‍🍳', jp: 'かしこまりました。少々お待ちください。', romaji: 'Kashikomarimashita. Shou-shou omachi kudasai.', en: 'Certainly! Please wait just a moment.' }
        ]
      },
      {
        title: '🏠 Scenario 3: Daily Warm Greetings (日常の挨拶)',
        lines: [
          { speaker: 'A', name: 'Leaving', avatar: '🚪', jp: 'いってきます！', romaji: 'Ittekimasu!', en: 'I am leaving now!' },
          { speaker: 'B', name: 'At Home', avatar: '🏡', jp: 'いってらっしゃい！気をつけてね。', romaji: 'Itterasshai! Ki o tsukete ne.', en: 'Have a great day! Take good care.' },
          { speaker: 'A', name: 'Returning', avatar: '🚪', jp: 'ただいま！', romaji: 'Tadaima!', en: "I'm home!" },
          { speaker: 'B', name: 'At Home', avatar: '🏡', jp: 'おかえりなさい！お疲れ様でした。', romaji: 'Okaerinasai! Otsukaresama deshita.', en: 'Welcome home! Great work today.' }
        ]
      },
      {
        title: '💖 Scenario 4: Sweet Affection & Encouragement (優しい言葉)',
        lines: [
          { speaker: 'A', name: 'RK', avatar: '💙', jp: 'タノ、今日もお疲れ様！いつもありがとう。', romaji: 'Thanu, kyou mo otsukaresama! Itsumo arigatou.', en: 'Thanu, great work today! Thank you always.' },
          { speaker: 'B', name: 'Thanu', avatar: '💜', jp: 'ありがとう！RKも無理しないでね。', romaji: 'Arigatou! RK mo muri shinaide ne.', en: "Thank you! Don't overwork yourself either, okay?" },
          { speaker: 'A', name: 'RK', avatar: '💙', jp: 'うん、大好きだよ！ゆっくり休んでね。', romaji: 'Un, daisuki da yo! Yukkuri yasunde ne.', en: 'Yes, love you lots! Rest up peacefully.' }
        ]
      }
    ];

    // 5. Days of the week (Planetary / Elemental Kanji)
    this.daysData = [
      { jp: '日曜日 (にちようび)', romaji: 'Nichiyoubi', en: 'Sunday (Sun ☀️)', element: 'Sun / Light' },
      { jp: '月曜日 (げつようび)', romaji: 'Getsuyoubi', en: 'Monday (Moon 🌙)', element: 'Moon / Night' },
      { jp: '火曜日 (かようび)', romaji: 'Kayoubi', en: 'Tuesday (Fire 🔥)', element: 'Mars / Fire' },
      { jp: '水曜日 (すいようび)', romaji: 'Suiyoubi', en: 'Wednesday (Water 💧)', element: 'Mercury / Water' },
      { jp: '木曜日 (もくようび)', romaji: 'Mokuyoubi', en: 'Thursday (Wood/Tree 🌲)', element: 'Jupiter / Wood' },
      { jp: '金曜日 (きんようび)', romaji: 'Kinyoubi', en: 'Friday (Gold/Metal 💰)', element: 'Venus / Metal' },
      { jp: '土曜日 (どようび)', romaji: 'Doyoubi', en: 'Saturday (Earth/Soil 🌍)', element: 'Saturn / Earth' }
    ];

    // 6. Numbers Data
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
      { jp: '千 (せん)', romaji: 'sen', en: '1,000' },
      { jp: '一万 (いちまん)', romaji: 'ichiman', en: '10,000' }
    ];

    // 7. Verb Conjugation Matrix
    this.verbData = [
      {
        base: '食べる (たべる - To eat)',
        forms: [
          { type: 'Present (+)', jp: '食べます', romaji: 'Tabemasu', en: 'I eat / will eat' },
          { type: 'Present (-)', jp: '食べません', romaji: 'Tabemasen', en: 'I do not eat' },
          { type: 'Past (+)', jp: '食べました', romaji: 'Tabemashita', en: 'I ate' },
          { type: 'Past (-)', jp: '食べませんでした', romaji: 'Tabemasen deshita', en: 'I did not eat' },
          { type: 'Desire (~たい)', jp: '食べたいです', romaji: 'Tabetai desu', en: 'I want to eat' }
        ]
      },
      {
        base: '行く (いく - To go)',
        forms: [
          { type: 'Present (+)', jp: '行きます', romaji: 'Ikimasu', en: 'I go / will go' },
          { type: 'Present (-)', jp: '行きません', romaji: 'Ikimasen', en: 'I do not go' },
          { type: 'Past (+)', jp: '行きました', romaji: 'Ikimashita', en: 'I went' },
          { type: 'Past (-)', jp: '行きませんでした', romaji: 'Ikimasen deshita', en: 'I did not go' },
          { type: 'Desire (~たい)', jp: '行きたいです', romaji: 'Ikitai desu', en: 'I want to go' }
        ]
      },
      {
        base: '飲む (のむ - To drink)',
        forms: [
          { type: 'Present (+)', jp: '飲みます', romaji: 'Nomimasu', en: 'I drink / will drink' },
          { type: 'Present (-)', jp: '飲みません', romaji: 'Nomimasen', en: 'I do not drink' },
          { type: 'Past (+)', jp: '飲みました', romaji: 'Nomimashita', en: 'I drank' },
          { type: 'Past (-)', jp: '飲みませんでした', romaji: 'Nomimasen deshita', en: 'I did not drink' },
          { type: 'Desire (~たい)', jp: '飲みたいです', romaji: 'Nomitai desu', en: 'I want to drink' }
        ]
      },
      {
        base: '見る (みる - To see / watch)',
        forms: [
          { type: 'Present (+)', jp: '見ます', romaji: 'Mimasu', en: 'I see / will watch' },
          { type: 'Present (-)', jp: '見ません', romaji: 'Mimasen', en: 'I do not watch' },
          { type: 'Past (+)', jp: '見ました', romaji: 'Mimashita', en: 'I watched' },
          { type: 'Past (-)', jp: '見ませんでした', romaji: 'Mimasen deshita', en: 'I did not watch' },
          { type: 'Desire (~たい)', jp: '見たいです', romaji: 'Mitai desu', en: 'I want to see / watch' }
        ]
      }
    ];

    // 8. Grammar Particles
    this.particlesData = [
      { particle: 'は (wa)', title: 'Topic Marker ("As for...")', explanation: "Written as 'ha' but pronounced 'wa'. It indicates the broad topic of the sentence.", exampleJp: 'わたし は たの です。', exampleEn: 'I am Thanu. (As for me, I am Thanu)' },
      { particle: 'を (o / wo)', title: 'Direct Object Marker', explanation: 'Marks the item that directly receives the action of a transitive verb.', exampleJp: 'ほん を よみます。(Hon o yomimasu.)', exampleEn: 'I read a book.' },
      { particle: 'に (ni)', title: 'Time, Target & Destination', explanation: 'Specifies a clear point in time, a receiver of an action, or a destination.', exampleJp: 'にほん に いきます。(Nihon ni ikimasu.)', exampleEn: 'I am going to Japan.' },
      { particle: 'で (de)', title: 'Location of Action & Means', explanation: 'Specifies where an active action takes place or the instrument/tool used.', exampleJp: 'としょかん で べんきょうします。', exampleEn: 'I study at the library.' },
      { particle: 'も (mo)', title: 'Inclusion ("Also / Too")', explanation: "Replaces 'は' or 'を' to mean 'also' or 'too'.", exampleJp: 'わたし も おちゃ が すきです。', exampleEn: 'I also like green tea.' },
      { particle: 'と (to)', title: 'Connecting Nouns & Company ("And / With")', explanation: "Used to list items exhaustively ('and') or specify who you do an action with ('together with').", exampleJp: 'RK と たの (RK and Thanu) / ともだち と はなします。', exampleEn: 'I speak with my friend.' },
      { particle: 'へ (e)', title: 'Direction of Movement ("Towards")', explanation: "Written as 'he' but pronounced 'e'. Points to the direction you are heading.", exampleJp: 'とうきょう へ いきます。(Toukyou e ikimasu.)', exampleEn: 'Heading towards Tokyo.' },
      { particle: 'から / まで', title: 'Start & End Point ("From ... Until")', explanation: "'から' means 'from' and 'まで' means 'until / to'. Used for time, dates, and locations.", exampleJp: 'くじ から ごじ まで べんきょうします。', exampleEn: 'I study from 9:00 until 5:00.' },
      { particle: 'ね / よ', title: 'Conversational Sentence Enders', explanation: "'ね' seeks confirmation/agreement ('right? / isn't it?'). 'よ' politely shares fresh news/emphasis ('you know!').", exampleJp: 'きょう は いい てんき です ね！', exampleEn: "Great weather today, isn't it!" }
    ];
  }

  /* ==========================================================================
     EVENT LISTENERS
     ========================================================================== */
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

    // Kana Writing System Toggle (Hiragana vs Katakana)
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

    // Kanji Category Filters
    const kanjiFilterBtns = document.querySelectorAll('#kanji-filter-group .kanji-filter-btn');
    kanjiFilterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        kanjiFilterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeKanjiCat = btn.dataset.cat;
        this.renderKanjiGrid();
      });
    });

    // Kanji Real-time Search Input
    const kanjiSearchInput = document.getElementById('kanji-search-input');
    if (kanjiSearchInput) {
      kanjiSearchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        this.renderKanjiGrid(query);
      });
    }

    // Vocabulary Sub-Toggle (Themed Words vs Dialogues)
    const btnShowVocab = document.getElementById('btn-show-vocab');
    const btnShowDialogues = document.getElementById('btn-show-dialogues');
    const vocabContainer = document.getElementById('vocab-view-container');
    const dialoguesContainer = document.getElementById('dialogues-view-container');

    if (btnShowVocab && btnShowDialogues && vocabContainer && dialoguesContainer) {
      btnShowVocab.addEventListener('click', () => {
        btnShowVocab.classList.add('active');
        btnShowDialogues.classList.remove('active');
        vocabContainer.style.display = 'block';
        dialoguesContainer.style.display = 'none';
      });

      btnShowDialogues.addEventListener('click', () => {
        btnShowDialogues.classList.add('active');
        btnShowVocab.classList.remove('active');
        vocabContainer.style.display = 'none';
        dialoguesContainer.style.display = 'block';
      });
    }

    // Vocabulary Category Filter Pills
    const vocabFilterBtns = document.querySelectorAll('#vocab-filter-group .kanji-filter-btn');
    vocabFilterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        vocabFilterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeVocabCat = btn.dataset.vcat;
        this.renderVocabGrid();
      });
    });

    // Quiz Mode Selector Buttons
    const quizModeBtns = document.querySelectorAll('.quiz-mode-btn');
    quizModeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        quizModeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.quizMode = btn.dataset.mode;
        this.startQuiz();
      });
    });

    // Quiz restart button
    const restartQuizBtn = document.getElementById('btn-restart-quiz');
    if (restartQuizBtn) {
      restartQuizBtn.addEventListener('click', () => this.startQuiz());
    }
  }

  /* ==========================================================================
     AUDIO PRONUNCIATION ENGINE (Dual-Engine System)
     - Native High-Definition Tokyo Japanese Audio Stream (100% Mobile Compatible)
     - Web Speech API (Local Offline Voice Fallback)
     ========================================================================== */
  initAudioSystem() {
    this.audioPlayer = new Audio();
    this.cachedVoices = [];

    // Pre-load Web Speech API voices if supported
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        try {
          this.cachedVoices = window.speechSynthesis.getVoices() || [];
        } catch (e) {}
      };
      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }

    // Mobile Audio Unlock on first user interaction (touch/click)
    const unlockAudio = () => {
      try {
        if (!this.audioPlayer) {
          this.audioPlayer = new Audio();
        }
        this.audioPlayer.load();
        if ('speechSynthesis' in window) {
          try {
            window.speechSynthesis.resume();
          } catch (e) {}
        }
      } catch (e) {}

      document.removeEventListener('touchstart', unlockAudio, true);
      document.removeEventListener('touchend', unlockAudio, true);
      document.removeEventListener('click', unlockAudio, true);
    };

    document.addEventListener('touchstart', unlockAudio, { capture: true, once: true });
    document.addEventListener('touchend', unlockAudio, { capture: true, once: true });
    document.addEventListener('click', unlockAudio, { capture: true, once: true });
  }

  speakJapanese(text, targetEl = null) {
    if (!text) return;

    // Visual playing indicator on the clicked card/button
    if (targetEl) {
      targetEl.classList.add('playing-audio');
      setTimeout(() => targetEl.classList.remove('playing-audio'), 700);
    }

    // Clean text: strip parenthesis, romaji hints, slashes, bullets
    let cleanText = text
      .replace(/\(.*?\)/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/[•・]/g, '')
      .trim();

    if (cleanText.includes('/')) {
      cleanText = cleanText.split('/')[0].trim();
    }
    cleanText = cleanText.replace(/\s+/g, ' ').trim();

    if (!cleanText) return;

    if (!this.audioPlayer) {
      this.audioPlayer = new Audio();
    }

    // Stop previous audio playback immediately
    try {
      this.audioPlayer.pause();
      this.audioPlayer.currentTime = 0;
    } catch (e) {}

    // Fallback: Web Speech API
    const speakViaSpeechSynthesis = () => {
      if (!('speechSynthesis' in window)) return;
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'ja-JP';
        utterance.rate = 0.88;

        const voices = this.cachedVoices.length ? this.cachedVoices : (window.speechSynthesis.getVoices() || []);
        const jaVoice = voices.find(v => v.lang === 'ja-JP' || v.lang === 'ja_JP' || (v.lang && v.lang.startsWith('ja')));
        if (jaVoice) {
          utterance.voice = jaVoice;
        }

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('SpeechSynthesis error:', err);
      }
    };

    // Primary Engine: Native High-Definition Tokyo Japanese Pronunciation Stream
    // Works reliably on 100% of mobile devices without needing local voice packs
    try {
      const encodedQuery = encodeURIComponent(cleanText);
      const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=ja&q=${encodedQuery}`;

      this.audioPlayer.src = audioUrl;
      const playPromise = this.audioPlayer.play();

      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Direct stream playback error, falling back to Web Speech:', err);
          speakViaSpeechSynthesis();
        });
      }
    } catch (e) {
      speakViaSpeechSynthesis();
    }
  }

  /* ==========================================================================
     1. KANA GRID RENDERER
     ========================================================================== */
  renderKanaGrid() {
    const grid = document.getElementById('kana-grid');
    if (!grid) return;

    grid.innerHTML = '';
    const currentKana = this.kanaData[this.activeKanaType];
    if (!currentKana) return;

    const isHiragana = this.activeKanaType === 'hiragana';
    const typeLabel = isHiragana ? 'Hiragana (ひらがな)' : 'Katakana (カタカナ)';

    const sections = [
      {
        key: 'basic',
        title: `Basic ${typeLabel} — 46 Characters`,
        jpTitle: '五十音 (Gojuon)',
        subtitle: 'Foundational 46 primary vowel & consonant sounds',
        items: currentKana.basic || []
      },
      {
        key: 'voiced',
        title: `Voiced & Semi-Voiced ${typeLabel} — 25 Characters`,
        jpTitle: '濁音・半濁音 (Dakuon & Handakuon)',
        subtitle: 'Sounds modified with dakuten (゛) & handakuten (゜) like G, Z, D, B, P',
        items: currentKana.voiced || []
      },
      {
        key: 'combos',
        title: `Combination ${typeLabel} — 33 Compounds`,
        jpTitle: '拗音 (Yōon)',
        subtitle: isHiragana
          ? 'Contracted sounds paired with small ゃ, ゅ, ょ (kya, sha, cha...)'
          : 'Contracted sounds paired with small ャ, ュ, ョ (kya, sha, cha...)',
        items: currentKana.combos || []
      }
    ];

    sections.forEach(sec => {
      if (!sec.items.length) return;

      const secEl = document.createElement('div');
      secEl.className = 'kana-section';

      secEl.innerHTML = `
        <div class="kana-section-header">
          <div class="kana-section-title">
            <span>🌸</span> ${sec.title}
            <span style="font-size: 0.88rem; font-weight: 600; color: var(--purple-700); margin-left: 0.4rem;">• ${sec.jpTitle}</span>
          </div>
          <div class="kana-section-subtitle">${sec.subtitle}</div>
        </div>
        <div class="kana-cards-grid"></div>
      `;

      const cardsContainer = secEl.querySelector('.kana-cards-grid');

      sec.items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'kana-card';
        card.innerHTML = `
          <div class="kana-char">${item.char}</div>
          <div class="kana-romaji">${item.romaji}</div>
          <div class="kana-audio-hint">🔊 play</div>
        `;
        card.addEventListener('click', () => {
          this.speakJapanese(item.char, card);
        });
        cardsContainer.appendChild(card);
      });

      grid.appendChild(secEl);
    });
  }

  /* ==========================================================================
     2. KANJI MASTER HUB RENDERER
     ========================================================================== */
  renderKanjiGrid(searchQuery = '') {
    const grid = document.getElementById('kanji-grid');
    if (!grid) return;

    grid.innerHTML = '';

    let list = this.kanjiData;
    if (this.activeKanjiCat !== 'all') {
      list = list.filter(k => k.category === this.activeKanjiCat);
    }

    if (searchQuery) {
      list = list.filter(k => 
        k.char.includes(searchQuery) ||
        k.meaning.toLowerCase().includes(searchQuery) ||
        k.onyomi.toLowerCase().includes(searchQuery) ||
        k.kunyomi.toLowerCase().includes(searchQuery)
      );
    }

    if (list.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2.5rem; color: var(--purple-700);">
          <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">🔍</div>
          <h4>No Kanji matched your query!</h4>
          <p style="font-size: 0.88rem;">Try searching for "Sun", "Water", "Nihon", or select "All JLPT N5".</p>
        </div>
      `;
      return;
    }

    list.forEach(k => {
      const card = document.createElement('div');
      card.className = 'kanji-card';

      const compoundsHtml = k.compounds.map(c => `
        <div class="kanji-compound-row">
          <span class="kanji-compound-jp">${c.jp} (${c.romaji})</span>
          <span class="kanji-compound-en">${c.en}</span>
        </div>
      `).join('');

      card.innerHTML = `
        <div class="kanji-card-top">
          <div class="kanji-glyph-box">
            <div class="kanji-main-char">${k.char}</div>
            <span class="kanji-strokes-badge">${k.strokes} strokes</span>
          </div>
          <button class="kanji-speaker-btn" title="Listen Kanji pronunciation">🔊</button>
        </div>

        <div class="kanji-meaning">${k.meaning}</div>

        <div class="kanji-readings-list">
          <div class="kanji-reading-item">
            <span class="reading-lbl on">ON</span>
            <span class="reading-val">${k.onyomi}</span>
          </div>
          <div class="kanji-reading-item">
            <span class="reading-lbl kun">KUN</span>
            <span class="reading-val">${k.kunyomi}</span>
          </div>
        </div>

        <div class="kanji-compounds-list">
          ${compoundsHtml}
        </div>

        <div class="kanji-mnemonic-box">
          <span>💡</span>
          <span>${k.mnemonic}</span>
        </div>
      `;

      // Audio click
      const speakerBtn = card.querySelector('.kanji-speaker-btn');
      speakerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const readTarget = k.kunyomi !== '-' ? k.kunyomi.split(',')[0].replace('・', '') : k.char;
        this.speakJapanese(readTarget, speakerBtn);
      });

      card.addEventListener('click', () => {
        const firstCompound = k.compounds[0] ? k.compounds[0].jp : k.char;
        this.speakJapanese(firstCompound, card);
      });

      grid.appendChild(card);
    });
  }

  /* ==========================================================================
     3. THEMED VOCABULARY & DIALOGUES RENDERERS
     ========================================================================== */
  renderVocabGrid() {
    const grid = document.getElementById('vocab-grid');
    if (!grid) return;

    grid.innerHTML = '';
    let list = this.vocabData;
    if (this.activeVocabCat !== 'all') {
      list = list.filter(v => v.category === this.activeVocabCat);
    }

    list.forEach(item => {
      const card = document.createElement('div');
      card.className = 'phrase-card';
      card.innerHTML = `
        <div class="phrase-content">
          <h4>${item.jp}</h4>
          <div class="phrase-romaji">${item.romaji}</div>
          <div class="phrase-meaning">${item.en}</div>
        </div>
        <button class="phrase-speaker-btn" title="Listen pronunciation">🔊</button>
      `;

      card.addEventListener('click', () => {
        this.speakJapanese(item.jp, card);
      });

      grid.appendChild(card);
    });
  }

  renderDialogues() {
    const container = document.getElementById('dialogues-list');
    if (!container) return;

    container.innerHTML = '';
    this.dialoguesData.forEach(diag => {
      const card = document.createElement('div');
      card.className = 'dialogue-card';

      const messagesHtml = diag.lines.map(l => `
        <div class="dialogue-message ${l.speaker === 'B' ? 'speaker-b' : 'speaker-a'}">
          <div class="dialogue-avatar">${l.avatar}</div>
          <div class="dialogue-bubble" data-jp="${l.jp}">
            <div style="font-size:0.75rem; font-weight:800; color:var(--purple-700); margin-bottom:2px;">${l.name}</div>
            <div class="dialogue-jp-line">${l.jp}</div>
            <div class="dialogue-romaji-line">${l.romaji}</div>
            <div class="dialogue-en-line">${l.en}</div>
          </div>
        </div>
      `).join('');

      card.innerHTML = `
        <div class="dialogue-title-row">
          <h4>${diag.title}</h4>
          <span class="pillar-tag">Click bubble to listen 🔊</span>
        </div>
        <div class="dialogue-chat-flow">
          ${messagesHtml}
        </div>
      `;

      const bubbles = card.querySelectorAll('.dialogue-bubble');
      bubbles.forEach(b => {
        b.addEventListener('click', () => {
          this.speakJapanese(b.dataset.jp, b);
        });
      });

      container.appendChild(card);
    });
  }

  /* ==========================================================================
     4. NUMBERS & DAYS OF THE WEEK
     ========================================================================== */
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
        this.speakJapanese(item.jp.split(' ')[0], card);
      });
      grid.appendChild(card);
    });
  }

  renderDaysOfWeek() {
    const grid = document.getElementById('days-grid');
    if (!grid) return;

    grid.innerHTML = '';
    this.daysData.forEach(item => {
      const card = document.createElement('div');
      card.className = 'phrase-card';
      card.innerHTML = `
        <div class="phrase-content">
          <h4>${item.jp}</h4>
          <div class="phrase-romaji">${item.romaji}</div>
          <div class="phrase-meaning">${item.en} • <i>Element: ${item.element}</i></div>
        </div>
        <button class="phrase-speaker-btn">🔊</button>
      `;
      card.addEventListener('click', () => {
        this.speakJapanese(item.jp.split(' ')[0], card);
      });
      grid.appendChild(card);
    });
  }

  /* ==========================================================================
     5. GRAMMAR & VERB CONJUGATION
     ========================================================================== */
  renderVerbConjugations() {
    const grid = document.getElementById('verb-conjugation-grid');
    if (!grid) return;

    grid.innerHTML = '';
    this.verbData.forEach(v => {
      v.forms.forEach(form => {
        const box = document.createElement('div');
        box.className = 'verb-form-box';
        box.innerHTML = `
          <div class="verb-form-badge">${form.type} (${v.base.split(' ')[0]})</div>
          <div class="verb-form-jp">${form.jp}</div>
          <div class="verb-form-romaji">${form.romaji}</div>
          <div class="verb-form-en">${form.en}</div>
        `;
        box.addEventListener('click', () => {
          this.speakJapanese(form.jp, box);
        });
        grid.appendChild(box);
      });
    });
  }

  renderGrammarParticles() {
    const stack = document.getElementById('grammar-particles-stack');
    if (!stack) return;

    stack.innerHTML = '';
    this.particlesData.forEach(p => {
      const card = document.createElement('div');
      card.className = 'grammar-card';
      card.innerHTML = `
        <div class="grammar-title">
          <span class="grammar-pill">${p.particle}</span>
          <h4>${p.title}</h4>
        </div>
        <p class="grammar-explanation">${p.explanation}</p>
        <div class="grammar-example" style="cursor: pointer;" title="Click to hear example">
          <div class="jp-eg">🔊 ${p.exampleJp}</div>
          <div class="en-eg">${p.exampleEn}</div>
        </div>
      `;

      const eg = card.querySelector('.grammar-example');
      eg.addEventListener('click', () => {
        this.speakJapanese(p.exampleJp, eg);
      });

      stack.appendChild(card);
    });
  }

  /* ==========================================================================
     6. INTERACTIVE MULTI-MODE QUIZ ENGINE
     ========================================================================== */
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
    const questions = [];

    if (this.quizMode === 'kanji') {
      // Kanji Quiz
      const pool = [...this.kanjiData].sort(() => 0.5 - Math.random());
      for (let i = 0; i < Math.min(count, pool.length); i++) {
        const target = pool[i];
        const wrong = pool
          .filter(k => k.meaning !== target.meaning)
          .sort(() => 0.5 - Math.random())
          .slice(0, 3)
          .map(k => k.meaning);
        const options = [target.meaning, ...wrong].sort(() => 0.5 - Math.random());
        questions.push({
          char: target.char,
          subtitle: `What does the Kanji "${target.char}" mean?`,
          correct: target.meaning,
          options: options
        });
      }
    } else if (this.quizMode === 'vocab') {
      // Vocabulary Quiz
      const pool = [...this.vocabData].sort(() => 0.5 - Math.random());
      for (let i = 0; i < Math.min(count, pool.length); i++) {
        const target = pool[i];
        const wrong = pool
          .filter(v => v.en !== target.en)
          .sort(() => 0.5 - Math.random())
          .slice(0, 3)
          .map(v => v.en);
        const options = [target.en, ...wrong].sort(() => 0.5 - Math.random());
        questions.push({
          char: target.jp.split(' ')[0],
          subtitle: `What is the English meaning of "${target.jp}"?`,
          correct: target.en,
          options: options
        });
      }
    } else if (this.quizMode === 'mixed') {
      // Mixed Challenge
      const poolKana = [...this.kanaData.hiragana.basic, ...this.kanaData.katakana.basic];
      const poolKanji = [...this.kanjiData];
      const poolVocab = [...this.vocabData];

      for (let i = 0; i < count; i++) {
        const type = i % 3;
        if (type === 0) {
          // Kana question
          const t = poolKana[Math.floor(Math.random() * poolKana.length)];
          const wrong = poolKana.filter(k => k.romaji !== t.romaji).sort(() => 0.5 - Math.random()).slice(0, 3).map(k => k.romaji);
          questions.push({
            char: t.char,
            subtitle: 'What is the correct Romaji reading for this character?',
            correct: t.romaji,
            options: [t.romaji, ...wrong].sort(() => 0.5 - Math.random())
          });
        } else if (type === 1) {
          // Kanji question
          const t = poolKanji[Math.floor(Math.random() * poolKanji.length)];
          const wrong = poolKanji.filter(k => k.meaning !== t.meaning).sort(() => 0.5 - Math.random()).slice(0, 3).map(k => k.meaning);
          questions.push({
            char: t.char,
            subtitle: `What does the Kanji "${t.char}" mean?`,
            correct: t.meaning,
            options: [t.meaning, ...wrong].sort(() => 0.5 - Math.random())
          });
        } else {
          // Vocab question
          const t = poolVocab[Math.floor(Math.random() * poolVocab.length)];
          const wrong = poolVocab.filter(v => v.en !== t.en).sort(() => 0.5 - Math.random()).slice(0, 3).map(v => v.en);
          questions.push({
            char: t.jp.split(' ')[0],
            subtitle: `What is the meaning of "${t.jp}"?`,
            correct: t.en,
            options: [t.en, ...wrong].sort(() => 0.5 - Math.random())
          });
        }
      }
    } else {
      // Default: Kana Quiz
      const pool = [...this.kanaData.hiragana.basic, ...this.kanaData.katakana.basic];
      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      for (let i = 0; i < count; i++) {
        const target = shuffled[i];
        const wrong = pool
          .filter(p => p.romaji !== target.romaji)
          .sort(() => 0.5 - Math.random())
          .slice(0, 3)
          .map(p => p.romaji);

        const options = [target.romaji, ...wrong].sort(() => 0.5 - Math.random());
        questions.push({
          char: target.char,
          subtitle: 'What is the correct Romaji reading for this character?',
          correct: target.romaji,
          options: options
        });
      }
    }

    return questions;
  }

  renderCurrentQuestion() {
    const q = this.quizState.questions[this.quizState.currentIndex];
    if (!q) return;

    const charEl = document.getElementById('quiz-current-char');
    const subtitleEl = document.getElementById('quiz-question-subtitle');
    const countEl = document.getElementById('quiz-counter');
    const progressFill = document.getElementById('quiz-progress-fill');
    const optionsGrid = document.getElementById('quiz-options-grid');

    if (charEl) charEl.textContent = q.char;
    if (subtitleEl) subtitleEl.textContent = q.subtitle || 'Choose the correct answer:';
    if (countEl) countEl.textContent = `Question ${this.quizState.currentIndex + 1} of ${this.quizState.totalQuestions}`;
    if (progressFill) {
      const pct = (this.quizState.currentIndex / this.quizState.totalQuestions) * 100;
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
      window.birthdayApp.triggerBurstConfetti(90);
    }
    if (window.app) {
      window.app.showToast(`Quiz completed! Score: ${this.quizState.score}/${this.quizState.totalQuestions} 🌸`);
    }
  }
}

window.JapaneseLearningHub = JapaneseLearningHub;
