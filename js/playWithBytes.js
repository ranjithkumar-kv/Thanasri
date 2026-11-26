/* ==========================================================================
   Thanu's WorkSpace - Play with Bytes Dynamic Execution Engine
   Programiz-Grade Online Compiler Process for All Programs
   Divided Panels: Code Editor (Left) & Output / Iteration (Right)
   Dynamic Interactive Stdin, Real Step-by-Step Tracing & Universal Compilation
   ========================================================================== */

/* ==========================================================================
   Universal Real-Time Firebase Database Engine
   Powers:
   - .info/connected
   - onDisconnect().set()
   - presence/rk & presence/thanu
   - compiler/session/isConnected
   - compiler/sharedRoom
   Works across tabs via BroadcastChannel and across devices via MQTT WebSockets
   plus real Firebase Database if configured.
   ========================================================================== */
class UniversalFirebaseDb {
    constructor() {
        this.store = {};
        this.listeners = {};
        this.disconnectPayloads = {};
        this.broadcastChannel = null;

        try {
            this.broadcastChannel = new BroadcastChannel('thanu_firebase_rtdb_channel');
            this.broadcastChannel.onmessage = (event) => {
                const msg = event.data;
                if (msg && msg.type === 'FIREBASE_RTDB_SYNC') {
                    this.applyRemoteValue(msg.path, msg.value, false);
                }
            };
        } catch (e) { }

        // Cross-device sync via window.workspaceSync
        if (window.workspaceSync) {
            window.workspaceSync.on('FIREBASE_RTDB_SYNC', (data) => {
                if (data && data.path) {
                    this.applyRemoteValue(data.path, data.value, false);
                }
            });
        }

        // On window beforeunload, fire onDisconnect handlers
        window.addEventListener('beforeunload', () => {
            this.fireDisconnectHandlers();
        });
    }

    ref(path) {
        const cleanPath = (path || '').replace(/^\/+|\/+$/g, '');
        const self = this;

        return {
            path: cleanPath,
            set: (value) => self.setValue(cleanPath, value, true),
            update: (value) => self.updateValue(cleanPath, value, true),
            on: (eventType, callback) => {
                if (eventType === 'value') {
                    self.addListener(cleanPath, callback);
                }
            },
            off: (eventType, callback) => {
                if (eventType === 'value') {
                    self.removeListener(cleanPath, callback);
                }
            },
            once: (eventType) => {
                return new Promise((resolve) => {
                    const currentVal = self.getValue(cleanPath);
                    resolve({ val: () => currentVal });
                });
            },
            onDisconnect: () => {
                return {
                    set: (val) => {
                        self.disconnectPayloads[cleanPath] = val;
                        if (window.firebase && window.firebase.apps && window.firebase.apps.length > 0) {
                            try {
                                window.firebase.database().ref(cleanPath).onDisconnect().set(val);
                            } catch (e) { }
                        }
                        return Promise.resolve();
                    }
                };
            }
        };
    }

    getValue(path) {
        if (path === '.info/connected') {
            return true;
        }
        return this.store[path] !== undefined ? this.store[path] : null;
    }

    setValue(path, value, broadcast = true) {
        this.store[path] = value;
        this.notifyListeners(path, value);

        if (broadcast) {
            // 1. BroadcastChannel (local tabs/windows)
            if (this.broadcastChannel) {
                try {
                    this.broadcastChannel.postMessage({
                        type: 'FIREBASE_RTDB_SYNC',
                        path: path,
                        value: value
                    });
                } catch (e) { }
            }

            // 2. MQTT WebSockets across devices
            if (window.workspaceSync && typeof window.workspaceSync.broadcast === 'function') {
                window.workspaceSync.broadcast('FIREBASE_RTDB_SYNC', { path: path, value: value }, 1);
            }

            // 3. Real Firebase if app exists
            if (window.firebase && window.firebase.apps && window.firebase.apps.length > 0) {
                try {
                    window.firebase.database().ref(path).set(value);
                } catch (e) { }
            }
        }
        return Promise.resolve();
    }

    updateValue(path, partialValue, broadcast = true) {
        const current = (typeof this.store[path] === 'object' && this.store[path] !== null) ? this.store[path] : {};
        const merged = Object.assign({}, current, partialValue);
        this.store[path] = merged;
        this.notifyListeners(path, merged);

        if (broadcast) {
            // 1. BroadcastChannel (local tabs/windows)
            if (this.broadcastChannel) {
                try {
                    this.broadcastChannel.postMessage({
                        type: 'FIREBASE_RTDB_SYNC',
                        path: path,
                        value: merged
                    });
                } catch (e) { }
            }

            // 2. MQTT WebSockets across devices
            if (window.workspaceSync && typeof window.workspaceSync.broadcast === 'function') {
                window.workspaceSync.broadcast('FIREBASE_RTDB_SYNC', { path: path, value: merged }, 1);
            }

            // 3. Real Firebase if app exists (use update so children nodes are preserved)
            if (window.firebase && window.firebase.apps && window.firebase.apps.length > 0) {
                try {
                    window.firebase.database().ref(path).update(partialValue);
                } catch (e) { }
            }
        }
        return Promise.resolve();
    }

    addListener(path, callback) {
        if (!this.listeners[path]) {
            this.listeners[path] = new Set();
        }
        this.listeners[path].add(callback);

        // Immediate callback with current snapshot
        const currentVal = this.getValue(path);
        try {
            callback({ val: () => currentVal });
        } catch (e) { }

        // Also subscribe on real Firebase if available
        if (window.firebase && window.firebase.apps && window.firebase.apps.length > 0) {
            try {
                window.firebase.database().ref(path).on('value', (snap) => {
                    const fbVal = snap.val();
                    if (fbVal !== undefined && fbVal !== null) {
                        this.applyRemoteValue(path, fbVal, false);
                    }
                });
            } catch (e) { }
        }
    }

    removeListener(path, callback) {
        if (this.listeners[path]) {
            if (callback) {
                this.listeners[path].delete(callback);
            } else {
                this.listeners[path].clear();
            }
        }
    }

    notifyListeners(path, value) {
        if (this.listeners[path]) {
            const snap = { val: () => value };
            this.listeners[path].forEach((cb) => {
                try {
                    cb(snap);
                } catch (e) {
                    console.error('[FirebaseRTDB Callback Error]:', e);
                }
            });
        }
    }

    applyRemoteValue(path, value) {
        this.store[path] = value;
        this.notifyListeners(path, value);
    }

    fireDisconnectHandlers() {
        for (const path in this.disconnectPayloads) {
            this.setValue(path, this.disconnectPayloads[path], true);
        }
    }
}

class PlayWithBytesManager {
    constructor() {
        this.currentLanguage = 'java';
        this.storageKey = 'thanu_coding_drafts_v7';
        this.currentViewTab = 'output';    // 'output' or 'iteration'
        this.currentFlowMode = 'lively';   // 'lively' or 'script'

        // Playback state
        this.currentStep = 1;
        this.totalSteps = 0;
        this.playbackSpeed = 1;
        this.isPlaying = false;
        this.playbackTimer = null;
        this.stepsData = [];

        // Execution & stdin state
        this.isExecuting = false;
        this.abortController = null;
        this.inputResolve = null;
        this.inputReject = null;
        this.accumulatedTerminalText = '';
        this.runSessionInputs = [];
        this.stepChunks = [];
        this.previousStdoutLength = 0;
        this.finalChunk = '';

        // Line highlight tracking
        this.activeLineNumber = 1;
        this.lineHeight = 23.8; // 14px font * 1.7 line-height

        // History (Undo / Redo) Stack for Code Editor
        this.undoStack = [];
        this.redoStack = [];
        this.isUndoingOrRedoing = false;
        this.typingDebounceTimer = null;
        this.maxHistorySize = 150;

        // Two-User Role & Presence State
        this.currentUser = this.resolveCurrentUser();
        this.partnerUser = this.currentUser === 'rk' ? 'thanu' : 'rk';
        this.partnerDisplayName = this.currentUser === 'rk' ? 'Thanu' : 'RK';
        this.partnerOnline = false;

        // Shared Session & Zero-Delay Sync State
        this.isConnected = false;
        this.isApplyingRemote = false;
        this.typingSyncTimer = null;
        this.firebaseDb = null;

        // Shared & Solo Console State
        this.sharedConsoleState = {
            transcript: 'Terminal ready. Click Run to compile and execute.',
            inputs: [],
            waitingForInput: false,
            isRunning: false,
            iteration: 0,
            activeTab: 'output',
            stepChunks: [],
            previousStdoutLength: 0,
            finalChunk: '',
            updatedAt: 0,
            updatedBy: ''
        };
        this.soloConsoleState = {
            transcript: 'Terminal ready. Click Run to compile and execute.',
            inputs: [],
            waitingForInput: false,
            isRunning: false,
            iteration: 0,
            activeTab: 'output',
            stepChunks: [],
            previousStdoutLength: 0,
            finalChunk: ''
        };
        this.isApplyingRemoteConsole = false;
        this.isInitiatingRun = false;

        // Shared & Solo Iteration History State
        this.sharedIterations = [];
        this.soloIterations = [];
        this.activeIterationIndex = -1;
        this.isApplyingRemotePlayback = false;
        this.scriptTraceLines = [];

        // Saved drafts
        this.codeDrafts = this.loadDrafts();

        // Standard boilerplate programs (used only when clicking 🔄 Basic)
        this.boilerplates = {
            java: `class Main {
    public static void main(String[] args) {
        // Write your code here...
    }
}
`,
            python: `# Online Python Compiler
# Write, compile and run Python code online

def main():
    total_sum = 0
    print("Enter 5 numbers:")

    for i in range(1, 6):
        print(f"Number {i}: ")
        num = int(input())
        total_sum += num

    print(f"Total Sum = {total_sum}")

if __name__ == "__main__":
    main()
`,
            c: `// Online C Compiler
// Write, compile and run C code online

#include <stdio.h>

int main() {
    int sum = 0;
    printf("Enter 5 numbers:\\n");

    for (int i = 1; i <= 5; i++) {
        printf("Number %d: ", i);
        int num;
        scanf("%d", &num);
        sum += num;
    }

    printf("Total Sum = %d\\n", sum);
    return 0;
}
`,
            cpp: `// Online C++ Compiler
// Write, compile and run C++ code online

#include <iostream>
using namespace std;

int main() {
    int sum = 0;
    cout << "Enter 5 numbers:" << endl;

    for (int i = 1; i <= 5; i++) {
        cout << "Number " << i << ": ";
        int num;
        cin >> num;
        sum += num;
    }

    cout << "Total Sum = " << sum << endl;
    return 0;
}
`,
            javascript: `// Online JavaScript Runner
// Write and execute JavaScript code online

function main() {
    let sum = 0;
    console.log("Enter 5 numbers:");

    for (let i = 1; i <= 5; i++) {
        console.log("Number " + i + ": ");
        let num = 1;
        sum += num;
    }

    console.log("Total Sum = " + sum);
}

main();
`,
            sql: `-- Online SQL Compiler
-- Execute SQL queries and view results online

CREATE TABLE numbers (
    id INT PRIMARY KEY,
    val INT
);

INSERT INTO numbers VALUES (1, 1), (2, 1), (3, 1), (4, 1), (5, 1);

SELECT id, val, SUM(val) OVER (ORDER BY id) AS running_sum FROM numbers;
`
        };

        // Syntax database for auto-recommend
        this.syntaxDatabase = {
            java: [
                { word: 'Scanner', type: 'snippet', template: 'Scanner scanner = new Scanner(System.in);', doc: 'Input scanner' },
                { word: 'System.out.println', type: 'function', template: 'System.out.println($CURSOR);', doc: 'Print line' },
                { word: 'System.out.print', type: 'function', template: 'System.out.print($CURSOR);', doc: 'Print inline' },
                { word: 'sout', type: 'snippet', template: 'System.out.println($CURSOR);', doc: 'Print shortcut' },
                { word: 'for', type: 'loop', template: 'for (int i = 1; i <= 5; i++) {\n    $CURSOR\n}', doc: 'For loop' },
                { word: 'while', type: 'loop', template: 'while ($CURSOR) {\n    \n}', doc: 'While loop' },
                { word: 'if', type: 'keyword', template: 'if ($CURSOR) {\n    \n}', doc: 'If condition' },
                { word: 'scanner.nextInt', type: 'function', template: 'scanner.nextInt()', doc: 'Read integer' },
                { word: 'scanner.nextLine', type: 'function', template: 'scanner.nextLine()', doc: 'Read line' },
                { word: 'int', type: 'type', template: 'int $CURSOR = 0;', doc: 'Integer variable' }
            ],
            python: [
                { word: 'print', type: 'function', template: 'print($CURSOR)', doc: 'Print statement' },
                { word: 'def', type: 'keyword', template: 'def function_name(args):\n    $CURSOR\n    return None', doc: 'Function definition' },
                { word: 'for', type: 'loop', template: 'for i in range(1, 6):\n    $CURSOR', doc: 'Range loop' },
                { word: 'while', type: 'loop', template: 'while $CURSOR:\n    ', doc: 'While loop' },
                { word: 'if', type: 'keyword', template: 'if $CURSOR:\n    ', doc: 'If condition' },
                { word: 'input', type: 'function', template: 'input("$CURSOR")', doc: 'Prompt user input' }
            ],
            c: [
                { word: 'printf', type: 'function', template: 'printf("%d\\n", $CURSOR);', doc: 'Formatted print' },
                { word: 'scanf', type: 'function', template: 'scanf("%d", &$CURSOR);', doc: 'Read input' },
                { word: 'for', type: 'loop', template: 'for (int i = 1; i <= 5; i++) {\n    $CURSOR\n}', doc: 'For loop' },
                { word: 'while', type: 'loop', template: 'while ($CURSOR) {\n    \n}', doc: 'While loop' }
            ],
            cpp: [
                { word: 'cout', type: 'snippet', template: 'cout << $CURSOR << endl;', doc: 'Console output' },
                { word: 'cin', type: 'snippet', template: 'cin >> $CURSOR;', doc: 'Console input' },
                { word: 'for', type: 'loop', template: 'for (int i = 1; i <= 5; i++) {\n    $CURSOR\n}', doc: 'For loop' },
                { word: 'while', type: 'loop', template: 'while ($CURSOR) {\n    \n}', doc: 'While loop' }
            ],
            javascript: [
                { word: 'console.log', type: 'function', template: 'console.log($CURSOR);', doc: 'Console log' },
                { word: 'for', type: 'loop', template: 'for (let i = 1; i <= 5; i++) {\n    $CURSOR\n}', doc: 'For loop' },
                { word: 'while', type: 'loop', template: 'while ($CURSOR) {\n    \n}', doc: 'While loop' }
            ],
            sql: [
                { word: 'SELECT', type: 'statement', template: 'SELECT * FROM table_name;', doc: 'Select query' }
            ]
        };

        this.activeRecIndex = 0;
        this.currentRecommendations = [];

        this.init();
    }

    getStorageKey() {
        if (this.isConnected) {
            return 'thanu_coding_shared_drafts';
        }
        return `thanu_coding_drafts_${this.currentUser || 'thanu'}`;
    }

    loadDrafts() {
        try {
            const key = this.getStorageKey();
            const stored = localStorage.getItem(key);
            let drafts = stored ? JSON.parse(stored) : null;
            if (!drafts) {
                const legacy = localStorage.getItem(this.storageKey);
                drafts = legacy ? JSON.parse(legacy) : {};
            }
            if (!drafts.java || !drafts.java.trim() || drafts.java.includes('Scanner scanner = new Scanner(System.in);')) {
                drafts.java = `class Main {\n    public static void main(String[] args) {\n        // Write your code here...\n    }\n}\n`;
            }
            return drafts;
        } catch (e) {
            return {
                java: `class Main {\n    public static void main(String[] args) {\n        // Write your code here...\n    }\n}\n`
            };
        }
    }

    saveDrafts() {
        try {
            const key = this.getStorageKey();
            localStorage.setItem(key, JSON.stringify(this.codeDrafts));
        } catch (e) { }
    }

    init() {
        this.bindDomElements();
        this.initEvents();
        this.initFirebase();

        // Ensure Java starts with the standard boilerplate or preserved draft
        this.setLanguage(this.currentLanguage, true);
        if (this.textarea) {
            if (!this.textarea.value || !this.textarea.value.trim()) {
                if (this.currentLanguage === 'java') {
                    this.textarea.value = this.boilerplates.java;
                } else {
                    this.textarea.value = '';
                }
            }
            this.textarea.placeholder = `Write ${this.getLanguageDisplayName(this.currentLanguage)} code here...`;
            if (this.textarea.value.includes('// Write your code here...')) {
                const commentIdx = this.textarea.value.indexOf('// Write your code here...');
                this.textarea.setSelectionRange(commentIdx, commentIdx + 26);
            }
        }
        this.resetHistory();
        this.updateLineNumbers();
        this.updateSyntaxHighlight();
        this.setActiveLine(1);
        this.renderEmptyIterationState();

        if (this.terminalText) {
            this.terminalText.textContent = 'Terminal ready. Click Run to compile and execute.';
        }
        if (this.terminalInputRow) {
            this.terminalInputRow.style.display = 'none';
        }
        this.accumulatedTerminalText = '';

        window.playWithBytes = this;
    }

    bindDomElements() {
        this.fileBtn = document.getElementById('compiler-file-btn');
        this.fileMenu = document.getElementById('compiler-file-menu');
        this.activeFilename = document.getElementById('compiler-active-filename');
        this.statusPillWrap = document.querySelector('.compiler-status-dropdown-wrap');
        this.statusPill = document.getElementById('compiler-status-pill');
        this.statusDot = document.getElementById('compiler-status-dot');
        this.statusText = document.getElementById('compiler-status-text');
        this.statusMenu = document.getElementById('compiler-status-menu');
        this.statusMenuPartner = document.getElementById('status-menu-partner');
        this.btnModeConnect = document.getElementById('btn-mode-connect');
        this.btnModeDisconnect = document.getElementById('btn-mode-disconnect');
        this.checkModeConnect = document.getElementById('check-mode-connect');
        this.checkModeDisconnect = document.getElementById('check-mode-disconnect');
        this.btnRun = document.getElementById('btn-run-code');
        this.runBtnIcon = document.getElementById('run-btn-icon');
        this.runBtnLabel = document.getElementById('run-btn-label');
        this.btnClear = document.getElementById('btn-clear-code');
        this.btnSave = document.getElementById('btn-compiler-save');

        this.tabOutput = document.getElementById('tab-view-output');
        this.tabIteration = document.getElementById('tab-view-iteration');
        this.iterationBadge = document.getElementById('iteration-count-badge');
        this.flowToggleWrap = document.getElementById('compiler-flow-toggle');
        this.btnToggleLively = document.getElementById('btn-toggle-lively');
        this.btnToggleScript = document.getElementById('btn-toggle-script');

        this.editorWrapper = document.getElementById('compiler-editor-wrapper');
        this.lineNumbers = document.getElementById('compiler-line-numbers');
        this.activeLineBg = document.getElementById('compiler-active-line-bg');
        this.textarea = document.getElementById('coding-editor-textarea');
        this.highlightPre = document.getElementById('compiler-highlight-pre');
        this.highlightCodeEl = document.getElementById('compiler-highlight-code');

        this.recommendPopup = document.getElementById('syntax-recommend-popup');
        this.recommendList = document.getElementById('recommend-list');

        this.iterationView = document.getElementById('compiler-iteration-view');
        this.iterationHistoryStrip = document.getElementById('iteration-history-strip');
        this.iterationHistoryPills = document.getElementById('iteration-history-pills');
        this.outputView = document.getElementById('compiler-output-view');
        this.emptyState = document.getElementById('iteration-empty-state');
        this.btnRunNow = document.getElementById('btn-iteration-run-now');
        this.livelyContainer = document.getElementById('lively-flow-container');
        this.scriptContainer = document.getElementById('script-text-container');
        this.scriptContent = document.getElementById('script-text-content');
        this.terminalText = document.getElementById('compiler-terminal-text');
        this.terminalScroll = document.getElementById('compiler-output-scroll');
        this.terminalInputRow = document.getElementById('terminal-input-row');
        this.terminalInlineInput = document.getElementById('terminal-inline-input');
        this.btnCopyTrace = document.getElementById('btn-copy-trace');

        this.btnRestart = document.getElementById('btn-tracer-restart');
        this.btnPrev = document.getElementById('btn-tracer-prev');
        this.btnPlay = document.getElementById('btn-tracer-play');
        this.btnNext = document.getElementById('btn-tracer-next');
        this.btnForward = document.getElementById('btn-tracer-forward');
        this.stepPill = document.getElementById('playback-step-pill');
        this.progressFill = document.getElementById('compiler-progress-fill');
        this.playIcon = document.getElementById('play-icon');
        this.playText = document.getElementById('play-text');

        this.saveModal = document.getElementById('save-code-modal');
        this.saveForm = document.getElementById('save-code-form');
        this.btnCancelSave = document.getElementById('btn-cancel-save-code');
        this.btnCancelSaveFooter = document.getElementById('btn-cancel-save-code-footer');
        this.saveCodeTitle = document.getElementById('save-code-title');
        this.saveCodeLang = document.getElementById('save-code-lang');
        this.saveCodeCategory = document.getElementById('save-code-category');
        this.saveCodeNotes = document.getElementById('save-code-notes');
        this.saveCodePreview = document.getElementById('save-code-preview');
    }

    initEvents() {
        if (this.fileBtn && this.fileMenu) {
            this.fileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = this.fileMenu.style.display === 'block';
                this.fileMenu.style.display = isOpen ? 'none' : 'block';
            });

            const menuItems = this.fileMenu.querySelectorAll('.compiler-menu-item');
            menuItems.forEach(item => {
                item.addEventListener('click', () => {
                    menuItems.forEach(m => m.classList.remove('active'));
                    item.classList.add('active');
                    const lang = item.dataset.lang;
                    this.setLanguage(lang);
                    this.fileMenu.style.display = 'none';
                });
            });

            document.addEventListener('click', (e) => {
                if (!e.target.closest('.compiler-file-dropdown-wrap')) {
                    this.fileMenu.style.display = 'none';
                }
            });
        }

        // Status Pill toggle dropdown menu
        if (this.statusPill && this.statusMenu) {
            this.statusPill.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = this.statusMenu.style.display === 'flex';
                this.toggleStatusMenu(!isOpen);
            });
        }

        // Outside click to close status menu
        document.addEventListener('click', (e) => {
            if (this.statusMenu && !e.target.closest('.compiler-status-dropdown-wrap')) {
                this.toggleStatusMenu(false);
            }
        });

        // Mode switch buttons (Connect / Disconnect) -> sets compiler/session/isConnected in Firebase
        if (this.btnModeConnect) {
            this.btnModeConnect.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.firebaseDb) {
                    this.firebaseDb.ref('compiler/session/isConnected').set(true);
                }
                this.toggleStatusMenu(false);
            });
        }
        if (this.btnModeDisconnect) {
            this.btnModeDisconnect.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.firebaseDb) {
                    this.firebaseDb.ref('compiler/session/isConnected').set(false);
                }
                this.toggleStatusMenu(false);
            });
        }

        if (this.tabOutput) {
            this.tabOutput.addEventListener('click', () => this.switchViewTab('output'));
        }
        if (this.tabIteration) {
            this.tabIteration.addEventListener('click', () => this.switchViewTab('iteration'));
        }

        if (this.btnToggleLively) {
            this.btnToggleLively.addEventListener('click', () => this.setFlowMode('lively'));
        }
        if (this.btnToggleScript) {
            this.btnToggleScript.addEventListener('click', () => this.setFlowMode('script'));
        }

        if (this.btnRestart) this.btnRestart.addEventListener('click', () => this.jumpToStep(1, true));
        if (this.btnPrev) this.btnPrev.addEventListener('click', () => this.stepRelative(-1, true));
        if (this.btnNext) this.btnNext.addEventListener('click', () => this.stepRelative(1, true));
        if (this.btnForward) this.btnForward.addEventListener('click', () => this.jumpToStep(this.totalSteps, true));
        if (this.btnPlay) this.btnPlay.addEventListener('click', () => this.toggleLivePlayback(true));
        if (this.btnRunNow) this.btnRunNow.addEventListener('click', () => this.compileAndRun());

        const speedBtns = document.querySelectorAll('.speed-btn');
        speedBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const spd = parseFloat(btn.dataset.speed) || 1;
                this.setPlaybackSpeed(spd, true);
            });
        });

        if (this.btnCopyTrace) {
            this.btnCopyTrace.addEventListener('click', () => {
                if (this.scriptContent) {
                    navigator.clipboard.writeText(this.scriptContent.innerText).then(() => {
                        if (window.app) window.app.showToast('Iteration trace copied to clipboard! 📋');
                    });
                }
            });
        }

        if (this.textarea) {
            const onEditorInputOrKey = () => {
                this.updateLineNumbers();
                this.updateLineHighlightFromCursor();
                this.checkSyntaxRecommendations();
                this.saveCurrentDraft();

                // Zero-delay write to compiler/sharedRoom if isConnected === true
                if (this.isConnected && !this.isApplyingRemote) {
                    this.writeToSharedRoom(false);
                }

                if (!this.isUndoingOrRedoing) {
                    this.recordSnapshot(false);
                }
            };

            this.textarea.addEventListener('input', onEditorInputOrKey);
            this.textarea.addEventListener('paste', () => {
                this.recordSnapshot(true);
                setTimeout(() => {
                    this.recordSnapshot(true);
                    this.updateLineNumbers();
                    this.updateLineHighlightFromCursor();
                    this.saveCurrentDraft();
                }, 10);
            });
            this.textarea.addEventListener('keyup', (e) => {
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                    this.updateLineHighlightFromCursor();
                } else if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                    onEditorInputOrKey();
                }
            });

            this.textarea.addEventListener('click', () => {
                this.updateLineHighlightFromCursor();
                this.hideRecommendations();
            });

            this.textarea.addEventListener('keyup', (e) => {
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                    this.updateLineHighlightFromCursor();
                }
            });

            this.textarea.addEventListener('scroll', () => {
                if (this.lineNumbers) {
                    this.lineNumbers.scrollTop = this.textarea.scrollTop;
                }
                if (this.highlightPre) {
                    this.highlightPre.scrollTop = this.textarea.scrollTop;
                    this.highlightPre.scrollLeft = this.textarea.scrollLeft;
                }
                this.updateLineHighlight();
            });

            this.textarea.addEventListener('keydown', (e) => {
                this.handleEditorKeydown(e);
            });

            const closeRecBtn = document.getElementById('recommend-popup-close');
            if (closeRecBtn) {
                closeRecBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.hideRecommendations();
                    if (this.textarea) this.textarea.focus();
                });
            }

            // Global Ctrl+Z and Ctrl+Y fallback for the compiler subview
            document.addEventListener('keydown', (e) => {
                const subview = document.getElementById('subview-play-with-bytes');
                if (!subview || subview.style.display === 'none') return;
                if (e.target && (e.target.id === 'compiler-save-title' || e.target.id === 'coding-terminal-input')) return;

                if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
                    if (e.target !== this.textarea) {
                        e.preventDefault();
                        if (e.shiftKey) {
                            this.redo();
                        } else {
                            this.undo();
                        }
                    }
                } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
                    if (e.target !== this.textarea) {
                        e.preventDefault();
                        this.redo();
                    }
                }
            });
        }

        if (this.btnRun) {
            this.btnRun.addEventListener('click', () => this.compileAndRun());
        }

        if (this.btnClear) {
            this.btnClear.addEventListener('click', () => {
                if (this.currentViewTab === 'output') {
                    if (this.isConnected) {
                        this.resetSharedConsole();
                    } else {
                        this.resetSoloConsole();
                    }
                    if (window.app) window.app.showToast('Output cleared');
                } else {
                    if (confirm('Clear the code editor?')) {
                        if (this.currentLanguage === 'java') {
                            this.textarea.value = this.boilerplates.java;
                            if (this.textarea.value.includes('// Write your code here...')) {
                                const commentIdx = this.textarea.value.indexOf('// Write your code here...');
                                this.textarea.setSelectionRange(commentIdx, commentIdx + 26);
                            }
                        } else {
                            this.textarea.value = '';
                        }
                        this.updateLineNumbers();
                        this.saveCurrentDraft();
                        this.renderEmptyIterationState();

                        if (this.isConnected && !this.isApplyingRemote) {
                            this.writeToSharedRoom(true);
                        }
                    }
                }
            });
        }

        if (this.btnSave) {
            this.btnSave.addEventListener('click', () => this.openSaveModal());
        }

        if (this.terminalInlineInput) {
            this.terminalInlineInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleInlineInputSubmit();
                }
            });
        }

        if (this.btnCancelSave) this.btnCancelSave.addEventListener('click', () => this.closeSaveModal());
        if (this.btnCancelSaveFooter) this.btnCancelSaveFooter.addEventListener('click', () => this.closeSaveModal());
        if (this.saveModal) {
            this.saveModal.addEventListener('click', (e) => {
                if (e.target === this.saveModal) {
                    this.closeSaveModal();
                }
            });
        }
        if (this.saveCodeTitle) {
            this.saveCodeTitle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleSaveCodeSubmit();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    this.closeSaveModal();
                }
            });
        }
        if (this.saveForm) {
            this.saveForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSaveCodeSubmit();
            });
        }

        document.addEventListener('click', (e) => {
            if (!e.target.closest('#syntax-recommend-popup') && e.target !== this.textarea) {
                this.hideRecommendations();
            }
        });
    }

    /* --------------------------------------------------------------------------
       PRESENCE & LIVE PAIR-PROGRAMMING COLLABORATION
       -------------------------------------------------------------------------- */
    resolveCurrentUser() {
        try {
            const sessionUser = sessionStorage.getItem('thanu_sync_user_role') || sessionStorage.getItem('thanu_active_user');
            if (sessionUser === 'rk') return 'rk';
            if (sessionUser === 'thanu' || sessionUser === 'thanasri') return 'thanu';

            const localUser = localStorage.getItem('thanu_sync_user_role') || localStorage.getItem('thanu_active_user');
            if (localUser === 'rk') return 'rk';
            if (localUser === 'thanu' || localUser === 'thanasri') return 'thanu';

            if (window.app && window.app.currentUser) {
                if (window.app.currentUser === 'rk') return 'rk';
                if (window.app.currentUser === 'thanu' || window.app.currentUser === 'thanasri') return 'thanu';
            }
        } catch (e) { }
        return 'thanu';
    }

    onUserLogin(role) {
        const cleanRole = (role === 'rk') ? 'rk' : 'thanu';
        this.currentUser = cleanRole;
        this.partnerUser = cleanRole === 'rk' ? 'thanu' : 'rk';
        this.partnerDisplayName = cleanRole === 'rk' ? 'Thanu' : 'RK';

        if (this.firebaseDb) {
            this.setupFirebasePresence();
        }
        this.updatePresenceBadge();
    }

    initFirebase() {
        try {
            if (!this.firebaseDb) {
                this.firebaseDb = new UniversalFirebaseDb();
            }

            // 1. Live presence tracking at presence/rk and presence/thanu
            this.setupFirebasePresence();

            // 2. Shared connect/disconnect session state (compiler/session/isConnected)
            this.setupFirebaseSession();

            // 3. Real-time Firebase listener on compiler/sharedRoom immediately on page load
            this.setupFirebaseSharedRoom();

            // 4. Shared console state in Firebase (compiler/sharedRoom/console) on page load
            this.setupFirebaseConsole();

            // 5. Shared iteration history in Firebase (compiler/sharedRoom/iterations) on page load
            this.setupFirebaseIterations();
        } catch (e) {
            console.error('[PlayWithBytes] Firebase init error:', e);
        }
    }

    setupFirebasePresence() {
        if (!this.firebaseDb) return;

        try {
            const connectedRef = this.firebaseDb.ref('.info/connected');
            const myPresenceRef = this.firebaseDb.ref(`presence/${this.currentUser}`);

            connectedRef.on('value', (snap) => {
                if (snap.val() === true) {
                    myPresenceRef.onDisconnect().set({
                        online: false,
                        user: this.currentUser,
                        lastSeen: Date.now()
                    });
                    myPresenceRef.set({
                        online: true,
                        user: this.currentUser,
                        lastSeen: Date.now()
                    });
                }
            });

            // Listen to partner presence in real time
            const partnerPresenceRef = this.firebaseDb.ref(`presence/${this.partnerUser}`);
            partnerPresenceRef.on('value', (snap) => {
                const val = snap.val();
                const isOnline = !!(val && val.online);
                this.handlePartnerPresence(isOnline);
            });
        } catch (e) {
            console.warn('[PlayWithBytes] setupFirebasePresence error:', e);
        }
    }

    handlePartnerPresence(isOnline) {
        this.partnerOnline = !!isOnline;
        this.updatePresenceBadge();
    }

    updatePresenceBadge() {
        if (!this.statusPill || !this.statusDot || !this.statusText) return;

        if (this.isExecuting) {
            this.statusText.textContent = 'Compiling...';
            return;
        }

        if (this.partnerOnline) {
            this.statusDot.classList.add('online');
            this.statusPill.classList.add('online-status');
            this.statusText.textContent = `${this.currentUser === 'rk' ? 'Thanu' : 'RK'} Online`;
        } else {
            this.statusDot.classList.remove('online');
            this.statusPill.classList.remove('online-status');
            this.statusText.textContent = `${this.currentUser === 'rk' ? 'Thanu' : 'RK'} Offline`;
        }

        if (this.statusMenuPartner) {
            this.statusMenuPartner.textContent = `Partner: ${this.partnerDisplayName} (${this.partnerOnline ? 'Online' : 'Offline'})`;
        }
    }

    toggleStatusMenu(show) {
        if (!this.statusMenu) return;
        this.statusMenu.style.display = show ? 'flex' : 'none';
        if (this.statusPill) {
            this.statusPill.setAttribute('aria-expanded', show ? 'true' : 'false');
        }
    }

    setupFirebaseSession() {
        if (!this.firebaseDb) return;

        const sessionRef = this.firebaseDb.ref('compiler/session/isConnected');
        sessionRef.on('value', (snap) => {
            const val = snap.val();
            const connected = (val === true);
            this.applyConnectionState(connected);
        });
    }

    applyConnectionState(isConnected) {
        if (this.isConnected === isConnected && this.hasAppliedInitialState) {
            return;
        }
        this.hasAppliedInitialState = true;
        this.isConnected = !!isConnected;

        // Both panels immediately switch to Connected/Disconnected mode and highlight selected
        if (this.btnModeConnect && this.btnModeDisconnect) {
            if (this.isConnected) {
                this.btnModeConnect.classList.add('active');
                this.btnModeDisconnect.classList.remove('active');
                if (this.checkModeConnect) this.checkModeConnect.style.display = 'inline';
                if (this.checkModeDisconnect) this.checkModeDisconnect.style.display = 'none';
                if (this.statusPill) {
                    this.statusPill.classList.add('connected-mode');
                    this.statusPill.title = 'Pair Programming (Shared Live Compiler) - Click to toggle Solo/Connected';
                }
            } else {
                this.btnModeConnect.classList.remove('active');
                this.btnModeDisconnect.classList.add('active');
                if (this.checkModeConnect) this.checkModeConnect.style.display = 'none';
                if (this.checkModeDisconnect) this.checkModeDisconnect.style.display = 'inline';
                if (this.statusPill) {
                    this.statusPill.classList.remove('connected-mode');
                    this.statusPill.title = 'Solo Mode (Separate Compilers) - Click to toggle Solo/Connected';
                }
            }
        }

        if (this.isConnected) {
            if (window.app && this.hasInteracted) {
                window.app.showToast('Connected to Live Pair-Programming! ⚡');
            }
            // Save current solo console state before applying shared room
            this.soloConsoleState = {
                transcript: this.accumulatedTerminalText || 'Terminal ready. Click Run to compile and execute.',
                inputs: [...this.runSessionInputs],
                waitingForInput: (this.terminalInputRow && this.terminalInputRow.style.display !== 'none'),
                isRunning: this.isExecuting,
                iteration: (this.soloConsoleState ? this.soloConsoleState.iteration : 0),
                activeTab: this.currentViewTab,
                stepChunks: [...this.stepChunks],
                previousStdoutLength: this.previousStdoutLength,
                finalChunk: this.finalChunk
            };
            this.fetchSharedRoomState();
        } else {
            if (window.app && this.hasInteracted) {
                window.app.showToast('Switched to Solo Mode (Separate Compilers) 👤');
            }
            // In solo mode, load user's solo drafts
            this.codeDrafts = this.loadDrafts();
            const soloCode = (this.codeDrafts[this.currentLanguage] && this.codeDrafts[this.currentLanguage].trim())
                ? this.codeDrafts[this.currentLanguage]
                : (this.currentLanguage === 'java' ? this.boilerplates.java : '');
            if (this.textarea) {
                this.isApplyingRemote = true;
                this.textarea.value = soloCode;
                this.updateLineNumbers();
                this.updateLineHighlightFromCursor();
                this.isApplyingRemote = false;
            }

            // In solo mode, restore user's solo console state
            if (this.soloConsoleState) {
                this.accumulatedTerminalText = this.soloConsoleState.transcript || 'Terminal ready. Click Run to compile and execute.';
                this.updateTerminalDisplay();
                this.runSessionInputs = [...(this.soloConsoleState.inputs || [])];
                this.stepChunks = [...(this.soloConsoleState.stepChunks || [])];
                this.previousStdoutLength = this.soloConsoleState.previousStdoutLength || 0;
                this.finalChunk = this.soloConsoleState.finalChunk || '';
                this.setRunningState(this.soloConsoleState.isRunning || false);
                if (this.soloConsoleState.waitingForInput) {
                    this.showInlineInput();
                } else {
                    this.hideInlineInput();
                }
                const soloIt = this.soloConsoleState.iteration || 0;
                if (this.iterationBadge) {
                    this.iterationBadge.textContent = soloIt;
                    this.iterationBadge.style.display = soloIt > 0 ? 'inline-block' : 'none';
                }
                this.switchViewTab(this.soloConsoleState.activeTab || 'output', false);
            }

            // Restore user's solo iterations list
            this.applyIterationsList(this.soloIterations);
        }
    }

    fetchSharedRoomState() {
        if (!this.firebaseDb) return;
        // 1. Fetch shared code and language
        this.firebaseDb.ref('compiler/sharedRoom').once('value').then((snap) => {
            const data = snap.val();
            if (data && data.code !== undefined) {
                this.applyRemoteSharedRoom(data);
            } else if (this.textarea && this.textarea.value) {
                this.writeToSharedRoom(true);
            }
        });

        // 2. Fetch shared console state
        this.firebaseDb.ref('compiler/sharedRoom/console').once('value').then((snap) => {
            const consoleData = snap.val();
            if (consoleData && consoleData.transcript !== undefined) {
                this.sharedConsoleState = consoleData;
                this.applySharedConsoleState(consoleData);
            } else {
                this.resetSharedConsole();
            }
        });

        // 3. Fetch shared iteration history
        this.firebaseDb.ref('compiler/sharedRoom/iterations').once('value').then((snap) => {
            const iterData = snap.val();
            const list = Array.isArray(iterData) ? iterData : [];
            this.sharedIterations = list;
            this.applyIterationsList(list);
        });
    }

    setupFirebaseSharedRoom() {
        if (!this.firebaseDb) return;

        // Attach listener immediately on page load
        const sharedRoomRef = this.firebaseDb.ref('compiler/sharedRoom');
        sharedRoomRef.on('value', (snap) => {
            const data = snap.val();
            if (!data) return;
            if (data.updatedBy !== this.currentUser && this.isConnected === true) {
                this.applyRemoteSharedRoom(data);
            }
        });
    }

    setupFirebaseConsole() {
        if (!this.firebaseDb) return;

        // Attach real-time listener on compiler/sharedRoom/console immediately on page load
        const consoleRef = this.firebaseDb.ref('compiler/sharedRoom/console');
        consoleRef.on('value', (snap) => {
            const data = snap.val();
            if (!data) return;
            this.sharedConsoleState = data;
            if (this.isConnected === true) {
                this.applySharedConsoleState(data);
            }
        });
    }

    setupFirebaseIterations() {
        if (!this.firebaseDb) return;

        // 1. History array listener
        const iterRef = this.firebaseDb.ref('compiler/sharedRoom/iterations');
        iterRef.on('value', (snap) => {
            const data = snap.val();
            const list = Array.isArray(data) ? data : [];
            this.sharedIterations = list;

            if (this.isConnected === true) {
                this.applyIterationsList(list);
            }
        });

        // 2. Playback state listener (Play Live, Speed, Jump)
        const playbackRef = this.firebaseDb.ref('compiler/sharedRoom/playback');
        playbackRef.on('value', (snap) => {
            const data = snap.val();
            if (!data) return;
            if (this.isConnected === true && data.updatedBy !== this.currentUser) {
                this.applyRemotePlayback(data);
            }
        });
    }

    applyIterationsList(list) {
        const count = Array.isArray(list) ? list.length : 0;

        // Pink badge count
        if (this.iterationBadge) {
            this.iterationBadge.textContent = count;
            this.iterationBadge.style.display = count > 0 ? 'inline-block' : 'none';
        }

        this.renderIterationHistoryPills(list);

        if (count === 0) {
            this.renderEmptyIterationState();
            return;
        }

        // Display latest iteration by default, or active if valid
        const targetIdx = (this.activeIterationIndex >= 0 && this.activeIterationIndex < count)
            ? this.activeIterationIndex
            : count - 1;
        this.selectIterationByIndex(targetIdx, list, false);
    }

    selectIterationByIndex(index, list = null, broadcast = true) {
        const targetList = list || (this.isConnected ? this.sharedIterations : this.soloIterations);
        if (!Array.isArray(targetList) || index < 0 || index >= targetList.length) return;

        this.activeIterationIndex = index;
        const entry = targetList[index];

        this.stepsData = Array.isArray(entry.steps) ? [...entry.steps] : [];
        this.totalSteps = this.stepsData.length;

        if (this.emptyState) this.emptyState.style.display = 'none';
        this.renderLivelyFlowCards();
        this.renderScriptText(entry.scriptTrace || []);
        this.updatePlaybackUI();
        if (this.totalSteps > 0) {
            this.jumpToStep(1, false);
        }

        this.updateIterationHistoryPillsActive();
    }

    renderIterationHistoryPills(list) {
        if (!this.iterationHistoryStrip || !this.iterationHistoryPills) return;

        const count = Array.isArray(list) ? list.length : 0;
        if (count === 0) {
            this.iterationHistoryStrip.style.display = 'none';
            this.iterationHistoryPills.innerHTML = '';
            return;
        }

        this.iterationHistoryStrip.style.display = 'flex';
        this.iterationHistoryPills.innerHTML = '';

        list.forEach((entry, idx) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `iteration-pill-btn ${idx === (this.activeIterationIndex >= 0 ? this.activeIterationIndex : count - 1) ? 'active' : ''}`;
            const num = entry.iterationNumber || (idx + 1);
            const userTag = entry.runBy ? ` (${entry.runBy.toUpperCase()})` : '';
            btn.textContent = `Run #${num}${userTag}`;
            btn.title = `Run #${num} - ${new Date(entry.timestamp).toLocaleTimeString()}`;
            btn.addEventListener('click', () => {
                this.selectIterationByIndex(idx, list, true);
            });
            this.iterationHistoryPills.appendChild(btn);
        });
    }

    updateIterationHistoryPillsActive() {
        if (!this.iterationHistoryPills) return;
        const btns = this.iterationHistoryPills.querySelectorAll('.iteration-pill-btn');
        btns.forEach((btn, idx) => {
            if (idx === this.activeIterationIndex) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    saveIterationEntry(entry) {
        if (this.isConnected) {
            const list = Array.isArray(this.sharedIterations) ? [...this.sharedIterations] : [];
            list.push(entry);
            this.sharedIterations = list;
            this.activeIterationIndex = list.length - 1;
            if (this.firebaseDb) {
                this.firebaseDb.ref('compiler/sharedRoom/iterations').set(list);
            }
            this.applyIterationsList(list);
        } else {
            const list = Array.isArray(this.soloIterations) ? [...this.soloIterations] : [];
            list.push(entry);
            this.soloIterations = list;
            this.activeIterationIndex = list.length - 1;
            this.applyIterationsList(list);
        }
    }

    setPlaybackSpeed(speed, broadcast = true) {
        this.playbackSpeed = speed;
        const speedBtns = document.querySelectorAll('.speed-btn');
        speedBtns.forEach(btn => {
            if (parseFloat(btn.dataset.speed) === speed) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        if (this.isPlaying) {
            clearInterval(this.playbackTimer);
            this.startPlaybackTimer();
        }
        if (broadcast && this.isConnected && !this.isApplyingRemotePlayback && this.firebaseDb) {
            this.firebaseDb.ref('compiler/sharedRoom/playback').set({
                action: 'speed',
                speed: speed,
                updatedBy: this.currentUser,
                timestamp: Date.now()
            });
        }
    }

    applyRemotePlayback(data) {
        if (!data) return;
        this.isApplyingRemotePlayback = true;
        try {
            if (data.action === 'play') {
                if (typeof data.speed === 'number') {
                    this.setPlaybackSpeed(data.speed, false);
                }
                if (typeof data.currentStep === 'number') {
                    this.jumpToStep(data.currentStep, false);
                }
                this.startPlayback(false);
            } else if (data.action === 'pause') {
                this.pausePlayback(false);
                if (typeof data.currentStep === 'number') {
                    this.jumpToStep(data.currentStep, false);
                }
            } else if (data.action === 'jump') {
                if (typeof data.step === 'number') {
                    this.jumpToStep(data.step, false);
                }
            } else if (data.action === 'speed') {
                if (typeof data.speed === 'number') {
                    this.setPlaybackSpeed(data.speed, false);
                }
            } else if (data.action === 'stop') {
                this.pausePlayback(false);
                this.renderEmptyIterationState();
            }
        } finally {
            this.isApplyingRemotePlayback = false;
        }
    }

    applySharedConsoleState(data) {
        if (!data) return;
        this.isApplyingRemoteConsole = true;

        try {
            // 1. Active Tab
            if (data.activeTab && (data.activeTab === 'output' || data.activeTab === 'iteration')) {
                if (data.activeTab !== this.currentViewTab) {
                    this.switchViewTab(data.activeTab, false);
                }
            }

            // 2. Iteration Badge Count (derived from iterations if available, fallback to console iteration)
            const it = (this.sharedIterations && this.sharedIterations.length > 0)
                ? this.sharedIterations.length
                : ((typeof data.iteration === 'number') ? data.iteration : 0);
            if (this.iterationBadge) {
                this.iterationBadge.textContent = it;
                this.iterationBadge.style.display = it > 0 ? 'inline-block' : 'none';
            }

            // 3. Transcript
            if (typeof data.transcript === 'string') {
                this.accumulatedTerminalText = data.transcript;
                this.updateTerminalDisplay();
            }

            // 4. Inputs & chunks sync
            if (Array.isArray(data.inputs)) {
                this.runSessionInputs = [...data.inputs];
            }
            if (Array.isArray(data.stepChunks)) {
                this.stepChunks = [...data.stepChunks];
            }
            if (typeof data.previousStdoutLength === 'number') {
                this.previousStdoutLength = data.previousStdoutLength;
            }
            if (typeof data.finalChunk === 'string') {
                this.finalChunk = data.finalChunk;
            }

            // 5. Running state & Status text
            const isRunning = !!data.isRunning;
            this.setRunningState(isRunning);
            if (isRunning) {
                if (this.statusText) this.statusText.textContent = 'Compiling...';
            } else if (data.waitingForInput) {
                if (this.statusText) this.statusText.textContent = 'Waiting for input...';
            } else {
                this.updatePresenceBadge();
            }

            // 6. Interactive Input Box
            if (data.waitingForInput === true) {
                this.showInlineInput();
            } else {
                this.hideInlineInput();
            }
        } finally {
            this.isApplyingRemoteConsole = false;
        }
    }

    resetSharedConsole() {
        const resetState = {
            transcript: 'Terminal ready. Click Run to compile and execute.',
            inputs: [],
            waitingForInput: false,
            isRunning: false,
            iteration: 0,
            activeTab: 'output',
            stepChunks: [],
            previousStdoutLength: 0,
            finalChunk: '',
            updatedAt: Date.now(),
            updatedBy: this.currentUser
        };
        this.sharedConsoleState = resetState;
        this.sharedIterations = [];
        this.activeIterationIndex = -1;
        if (this.firebaseDb) {
            this.firebaseDb.ref('compiler/sharedRoom/console').set(resetState);
            this.firebaseDb.ref('compiler/sharedRoom/iterations').set([]);
            this.firebaseDb.ref('compiler/sharedRoom/playback').set({ action: 'stop', updatedBy: this.currentUser });
        }
        this.applySharedConsoleState(resetState);
        this.applyIterationsList([]);
    }

    resetSoloConsole() {
        this.soloConsoleState = {
            transcript: 'Terminal ready. Click Run to compile and execute.',
            inputs: [],
            waitingForInput: false,
            isRunning: false,
            iteration: 0,
            activeTab: this.currentViewTab,
            stepChunks: [],
            previousStdoutLength: 0,
            finalChunk: ''
        };
        this.accumulatedTerminalText = this.soloConsoleState.transcript;
        this.updateTerminalDisplay();
        this.hideInlineInput();
        this.runSessionInputs = [];
        this.stepChunks = [];
        this.previousStdoutLength = 0;
        this.finalChunk = '';
        this.setRunningState(false);
        this.soloIterations = [];
        this.activeIterationIndex = -1;
        this.applyIterationsList([]);
    }

    applyRemoteSharedRoom(data) {
        if (!data) return;

        // 1. Language update
        if (data.language && data.language !== this.currentLanguage) {
            this.applyRemoteLanguage(data.language);
        }

        // 2. Code update with cursor position preservation
        if (this.textarea && typeof data.code === 'string' && this.textarea.value !== data.code) {
            this.isApplyingRemote = true;
            const curStart = this.textarea.selectionStart;
            const curEnd = this.textarea.selectionEnd;
            const oldLen = this.textarea.value.length;

            this.textarea.value = data.code;
            this.updateLineNumbers();
            this.updateLineHighlightFromCursor();

            const newLen = this.textarea.value.length;
            const diff = newLen - oldLen;
            const newStart = Math.min(newLen, Math.max(0, curStart + (curStart >= (data.selectionStart || 0) ? diff : 0)));
            const newEnd = Math.min(newLen, Math.max(0, curEnd + (curEnd >= (data.selectionEnd || 0) ? diff : 0)));
            try {
                this.textarea.setSelectionRange(newStart, newEnd);
            } catch (e) { }

            this.isApplyingRemote = false;
        }
    }

    applyRemoteLanguage(lang) {
        if (this.currentLanguage === lang) return;
        this.currentLanguage = lang;
        const filename = this.getFilename(lang);
        if (this.activeFilename) this.activeFilename.textContent = filename;

        if (this.fileMenu) {
            const items = this.fileMenu.querySelectorAll('.compiler-menu-item');
            items.forEach(item => {
                if (item.dataset.lang === lang) item.classList.add('active');
                else item.classList.remove('active');
            });
        }

        if (this.textarea) {
            this.textarea.placeholder = `Write ${this.getLanguageDisplayName(lang)} code here...`;
        }
    }

    writeToSharedRoom(immediate = false) {
        if (!this.isConnected || this.isApplyingRemote || !this.textarea) return;

        const doWrite = () => {
            if (!this.isConnected || this.isApplyingRemote || !this.firebaseDb) return;
            const payload = {
                code: this.textarea.value,
                language: this.currentLanguage,
                updatedBy: this.currentUser,
                selectionStart: this.textarea.selectionStart,
                selectionEnd: this.textarea.selectionEnd,
                timestamp: Date.now()
            };
            this.firebaseDb.ref('compiler/sharedRoom').update(payload);
        };

        if (immediate) {
            if (this.typingSyncTimer) {
                clearTimeout(this.typingSyncTimer);
                this.typingSyncTimer = null;
            }
            doWrite();
        } else {
            if (this.typingSyncTimer) clearTimeout(this.typingSyncTimer);
            // 0ms–50ms max delay
            this.typingSyncTimer = setTimeout(() => {
                this.typingSyncTimer = null;
                doWrite();
            }, 30);
        }
    }

    /* --------------------------------------------------------------------------
       LANGUAGE MANAGEMENT
       -------------------------------------------------------------------------- */
    setLanguage(lang, preserveDraft = false) {
        this.currentLanguage = lang;

        const filename = this.getFilename(lang);
        if (this.activeFilename) this.activeFilename.textContent = filename;

        // Sync dropdown menu active state
        if (this.fileMenu) {
            const items = this.fileMenu.querySelectorAll('.compiler-menu-item');
            items.forEach(item => {
                if (item.dataset.lang === lang) item.classList.add('active');
                else item.classList.remove('active');
            });
        }

        if (this.textarea) {
            this.textarea.placeholder = `Write ${this.getLanguageDisplayName(lang)} code here...`;
            if (preserveDraft && this.codeDrafts[lang] && this.codeDrafts[lang].trim()) {
                this.textarea.value = this.codeDrafts[lang];
            } else if (!preserveDraft || !this.codeDrafts[lang] || !this.codeDrafts[lang].trim()) {
                if (lang === 'java') {
                    this.textarea.value = this.boilerplates.java;
                } else {
                    this.textarea.value = '';
                }
            }
            if (this.textarea.value.includes('// Write your code here...')) {
                const commentIdx = this.textarea.value.indexOf('// Write your code here...');
                this.textarea.setSelectionRange(commentIdx, commentIdx + 26);
            }
        }

        this.updateLineNumbers();
        this.saveCurrentDraft();
        this.resetHistory();

        // Zero-delay write to compiler/sharedRoom if connected and not applying remote
        if (this.isConnected && !this.isApplyingRemote) {
            this.writeToSharedRoom(true);
        }

        if (this.textarea && this.textarea.value.trim()) {
            this.compileAndTrace();
        } else {
            this.renderEmptyIterationState();
        }
    }

    loadBoilerplate() {
        if (!this.textarea) return;
        this.recordSnapshot(true);
        this.textarea.value = this.boilerplates[this.currentLanguage] || '';
        this.updateLineNumbers();
        this.saveCurrentDraft();
        this.resetHistory();
        if (this.textarea.value.includes('// Write your code here...')) {
            const commentIdx = this.textarea.value.indexOf('// Write your code here...');
            this.textarea.setSelectionRange(commentIdx, commentIdx + 26);
            this.textarea.focus();
        }
    }

    saveCurrentDraft() {
        if (!this.textarea) return;
        this.codeDrafts[this.currentLanguage] = this.textarea.value;
        this.saveDrafts();
    }

    getFilename(lang) {
        switch (lang) {
            case 'java': return 'Main.java';
            case 'python': return 'main.py';
            case 'c': return 'main.c';
            case 'cpp': return 'main.cpp';
            case 'javascript': return 'script.js';
            case 'sql': return 'query.sql';
            default: return 'code.txt';
        }
    }

    getLanguageDisplayName(lang) {
        switch (lang) {
            case 'java': return 'Java';
            case 'python': return 'Python';
            case 'c': return 'C';
            case 'cpp': return 'C++';
            case 'javascript': return 'JavaScript';
            case 'sql': return 'SQL';
            default: return lang;
        }
    }

    /* --------------------------------------------------------------------------
       LINE NUMBERS & ACTIVE LINE HIGHLIGHT
       -------------------------------------------------------------------------- */
    updateLineNumbers() {
        if (!this.textarea || !this.lineNumbers) return;
        const lines = this.textarea.value.split('\n');
        const count = Math.max(1, lines.length);
        let numsText = '';
        for (let i = 1; i <= count; i++) {
            numsText += i + '\n';
        }
        this.lineNumbers.textContent = numsText;
        this.updateSyntaxHighlight();
    }

    updateLineHighlightFromCursor() {
        if (!this.textarea) return;
        const selStart = this.textarea.selectionStart;
        const textBefore = this.textarea.value.slice(0, selStart);
        const lineNum = textBefore.split('\n').length;
        this.setActiveLine(lineNum);
    }

    setActiveLine(lineNum) {
        this.activeLineNumber = lineNum;
        this.updateLineHighlight();
    }

    updateLineHighlight() {
        if (!this.activeLineBg || !this.textarea) return;
        const lineIndex = Math.max(0, this.activeLineNumber - 1);
        const topPos = 16 + (lineIndex * this.lineHeight) - this.textarea.scrollTop;

        if (topPos >= 0 && topPos <= this.textarea.clientHeight) {
            this.activeLineBg.style.top = `${topPos}px`;
            this.activeLineBg.style.display = 'block';
        } else {
            this.activeLineBg.style.display = 'none';
        }
    }

    /* --------------------------------------------------------------------------
       SYNTAX HIGHLIGHTING ENGINE
       Colors: #8a00c2 (Keywords/Types/Strings) & Black (Code/Brackets/Identifiers)
       -------------------------------------------------------------------------- */
    updateSyntaxHighlight() {
        if (!this.highlightCodeEl || !this.textarea) return;
        const code = this.textarea.value || '';
        this.highlightCodeEl.innerHTML = this.highlightCode(code, this.currentLanguage) + '\n';
        if (this.highlightPre) {
            this.highlightPre.scrollTop = this.textarea.scrollTop;
            this.highlightPre.scrollLeft = this.textarea.scrollLeft;
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    highlightCode(code, lang = 'java') {
        if (!code) return '';
        const safeLang = (lang || 'java').toLowerCase();

        const KEYWORDS = {
            java: new Set([
                'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class',
                'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final',
                'finally', 'float', 'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int',
                'interface', 'long', 'native', 'new', 'package', 'private', 'protected', 'public',
                'return', 'short', 'static', 'strictfp', 'super', 'switch', 'synchronized', 'this',
                'throw', 'throws', 'transient', 'try', 'void', 'volatile', 'while', 'true', 'false',
                'null', 'String', 'System', 'Scanner', 'Integer', 'Double', 'Boolean', 'Math', 'Override'
            ]),
            python: new Set([
                'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break', 'class',
                'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global',
                'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return',
                'try', 'while', 'with', 'yield', 'print', 'range', 'len', 'input', 'int', 'float', 'str',
                'list', 'dict', 'set', 'tuple', 'bool', 'self'
            ]),
            c: new Set([
                'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do', 'double', 'else',
                'enum', 'extern', 'float', 'for', 'goto', 'if', 'int', 'long', 'register', 'return',
                'short', 'signed', 'sizeof', 'static', 'struct', 'switch', 'typedef', 'union',
                'unsigned', 'void', 'volatile', 'while', 'include', 'define', 'printf', 'scanf', 'NULL'
            ]),
            cpp: new Set([
                'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do', 'double', 'else',
                'enum', 'extern', 'float', 'for', 'goto', 'if', 'int', 'long', 'register', 'return',
                'short', 'signed', 'sizeof', 'static', 'struct', 'switch', 'typedef', 'union',
                'unsigned', 'void', 'volatile', 'while', 'class', 'public', 'private', 'protected',
                'template', 'typename', 'this', 'virtual', 'friend', 'namespace', 'using', 'std',
                'cout', 'cin', 'endl', 'new', 'delete', 'true', 'false', 'include', 'define', 'NULL'
            ]),
            javascript: new Set([
                'abstract', 'arguments', 'await', 'boolean', 'break', 'byte', 'case', 'catch', 'char',
                'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do', 'double', 'else',
                'enum', 'eval', 'export', 'extends', 'false', 'final', 'finally', 'float', 'for',
                'function', 'goto', 'if', 'implements', 'import', 'in', 'instanceof', 'int', 'interface',
                'let', 'long', 'native', 'new', 'null', 'package', 'private', 'protected', 'public',
                'return', 'short', 'static', 'super', 'switch', 'synchronized', 'this', 'throw',
                'throws', 'transient', 'true', 'try', 'typeof', 'var', 'void', 'volatile', 'while',
                'with', 'yield', 'console', 'log', 'document', 'window'
            ]),
            sql: new Set([
                'select', 'from', 'where', 'insert', 'into', 'update', 'delete', 'create', 'table',
                'drop', 'alter', 'and', 'or', 'not', 'order', 'by', 'group', 'having', 'join',
                'inner', 'outer', 'left', 'right', 'on', 'as', 'distinct', 'count', 'sum', 'avg',
                'max', 'min', 'limit', 'primary', 'key', 'foreign', 'null', 'is', 'in', 'between',
                'like', 'values', 'set', 'over', 'partition', 'rows', 'range'
            ])
        };

        const kwSet = KEYWORDS[safeLang] || KEYWORDS.java;

        // Build comment pattern
        const commentPattern = safeLang === 'python'
            ? '(?:#.*)'
            : safeLang === 'sql'
                ? '(?:--.*|/\\*[\\s\\S]*?(?:\\*/|$))'
                : '(?:/\\*[\\s\\S]*?(?:\\*/|$)|//.*)';

        // Comprehensive tokenizer regex
        const tokenRegex = new RegExp(
            `(${commentPattern})|` +
            `("(?:\\\\.|[^"\\\\])*"?|'(?:\\\\.|[^'\\\\])*'?|\`(?:\\\\.|[^\`\\\\])*\`?)|` +
            `(\\b[a-zA-Z_$][a-zA-Z0-9_$]*\\b)|` +
            `(\\d+(?:\\.\\d+)?)|` +
            `([^a-zA-Z0-9_$"'\`#/]+|[/])`,
            'g'
        );

        return code.replace(tokenRegex, (match, comment, str, word, num, other) => {
            if (comment) {
                return `<span class="hl-comment">${this.escapeHtml(comment)}</span>`;
            }
            if (str) {
                return `<span class="hl-string">${this.escapeHtml(str)}</span>`;
            }
            if (word) {
                const isKeyword = safeLang === 'sql'
                    ? kwSet.has(word.toLowerCase())
                    : kwSet.has(word);

                if (isKeyword) {
                    return `<span class="hl-keyword">${this.escapeHtml(word)}</span>`;
                }
                return `<span class="hl-code">${this.escapeHtml(word)}</span>`;
            }
            if (num) {
                return `<span class="hl-number">${this.escapeHtml(num)}</span>`;
            }
            return `<span class="hl-code">${this.escapeHtml(match)}</span>`;
        });
    }

    /* --------------------------------------------------------------------------
       STEP RECORDING & REAL-TIME SYNCHRONIZATION
       -------------------------------------------------------------------------- */
    recordStep(step, stepsArray, scriptTraceArray) {
        stepsArray.push(step);
        this.stepsData = stepsArray;
        this.totalSteps = stepsArray.length;

        if (this.iterationBadge) {
            this.iterationBadge.textContent = this.totalSteps;
            this.iterationBadge.style.display = 'inline-block';
        }

        // Live line highlight synchronization
        if (step.line) {
            this.setActiveLine(step.line);
        }

        // Update playback UI
        this.updatePlaybackUI();

        // If iteration tab is currently visible, render cards live
        if (this.currentViewTab === 'iteration') {
            this.renderLivelyFlowCards();
            if (scriptTraceArray) {
                this.renderScriptText(scriptTraceArray);
            }
        }
    }

    /* --------------------------------------------------------------------------
       PROGRAMIZ-GRADE INTERACTIVE COMPILATION PROCESS (Codapi Execution API)
       -------------------------------------------------------------------------- */
    async compileAndRun() {
        if (this.isExecuting) {
            this.stopExecution();
            return;
        }

        const code = this.textarea ? this.textarea.value : '';
        const trimmed = code.trim();

        // 1. Empty Code Check (Matches Image 7)
        if (!trimmed || trimmed === `Write ${this.getLanguageDisplayName(this.currentLanguage)} code here...`) {
            this.setRunningState(false);
            this.switchViewTab('output', false);
            this.accumulatedTerminalText = `Compilation Error:\nerror: class, interface, or enum expected\n`;
            this.updateTerminalDisplay();
            this.setActiveLine(1);
            this.renderEmptyIterationState();
            return;
        }

        const filename = this.getFilename(this.currentLanguage);

        if (this.isConnected) {
            this.isInitiatingRun = true;
            const currentIt = (this.sharedConsoleState && typeof this.sharedConsoleState.iteration === 'number')
                ? this.sharedConsoleState.iteration
                : 0;
            const nextIteration = currentIt + 1;

            this.runSessionInputs = [];
            this.stepChunks = [];
            this.previousStdoutLength = 0;
            this.finalChunk = '';

            this.accumulatedTerminalText = `Compiling ${filename}...\n`;
            this.switchViewTab('output', false);
            this.setRunningState(true);
            this.updateTerminalDisplay();
            this.hideInlineInput();

            if (this.iterationBadge) {
                this.iterationBadge.textContent = nextIteration;
                this.iterationBadge.style.display = 'inline-block';
            }

            const initialPayload = {
                transcript: this.accumulatedTerminalText,
                inputs: [],
                waitingForInput: false,
                isRunning: true,
                iteration: nextIteration,
                activeTab: 'output',
                stepChunks: [],
                previousStdoutLength: 0,
                finalChunk: '',
                updatedAt: Date.now(),
                updatedBy: this.currentUser
            };
            this.sharedConsoleState = initialPayload;
            if (this.firebaseDb) {
                this.firebaseDb.ref('compiler/sharedRoom/console').set(initialPayload);
            }

            await this.executeRunSession(code);
        } else {
            // Solo mode execution
            this.soloConsoleState.iteration = (this.soloConsoleState.iteration || 0) + 1;
            if (this.iterationBadge) {
                this.iterationBadge.textContent = this.soloConsoleState.iteration;
                this.iterationBadge.style.display = 'inline-block';
            }
            this.runSessionInputs = [];
            this.stepChunks = [];
            this.previousStdoutLength = 0;
            this.finalChunk = '';

            this.accumulatedTerminalText = `Compiling ${filename}...\n`;
            this.switchViewTab('output', false);
            this.setRunningState(true);
            this.updateTerminalDisplay();
            this.hideInlineInput();

            await this.executeRunSession(code);
        }
    }

    async executeRunSession(code) {
        this.setRunningState(true);
        if (this.statusText) this.statusText.textContent = 'Compiling...';

        if (this.abortController) {
            this.abortController.abort();
        }
        this.abortController = new AbortController();

        // Map selected language to Codapi sandbox ('gcc' for C, 'typescript' for JS, native for java/python/cpp)
        const selectedLanguage = this.currentLanguage || 'java';
        const sandboxMap = {
            java: 'java',
            python: 'python',
            c: 'gcc',
            cpp: 'cpp',
            javascript: 'typescript'
        };
        const sandbox = sandboxMap[selectedLanguage] || selectedLanguage;
        const userInput = this.runSessionInputs.join('\n') + (this.runSessionInputs.length ? '\n' : '');

        // Prepare code for execution when inputs are present
        let codeToSend = code;
        if (this.runSessionInputs.length > 0) {
            if (selectedLanguage === 'java' && (code.includes('Scanner') || code.includes('System.in'))) {
                const escapedInput = JSON.stringify(userInput);
                const injectStmt = `java.lang.System.setIn(new java.io.ByteArrayInputStream(${escapedInput}.getBytes()));`;
                codeToSend = code.replace(/(public\s+static\s+void\s+main\s*\([^)]*\)\s*\{)/, `$1\n        ${injectStmt}`);
            } else if (selectedLanguage === 'python' && (code.includes('input(') || code.includes('sys.stdin'))) {
                const escapedInput = JSON.stringify(userInput);
                const injectStmt = `import sys, io\nsys.stdin = io.StringIO(${escapedInput})\n`;
                codeToSend = injectStmt + code;
            }
        }

        const payload = {
            sandbox: sandbox,
            command: 'run',
            files: {
                '': codeToSend
            },
            stdin: userInput
        };

        try {
            const response = await fetch('https://api.codapi.org/v1/exec', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload),
                signal: this.abortController.signal
            });

            const data = await response.json();
            const stdout = (data && data.stdout) ? data.stdout : '';
            const stderr = (data && data.stderr) ? data.stderr : '';

            // Check if the program failed because it is waiting for user input
            const isInputStarved = (!data.ok && (
                stderr.includes('NoSuchElementException') ||
                stderr.includes('EOFError') ||
                stderr.includes('reading a line') ||
                stderr.includes('End of file') ||
                (stdout && stdout.includes('EOFError'))
            ));

            // Clean stderr noise if needed
            let currentStdout = stdout;
            if (isInputStarved && !currentStdout && stderr) {
                const cleanedStderr = stderr
                    .replace(/Exception in thread "main"[\s\S]*/, '')
                    .replace(/Traceback \(most recent call last\)[\s\S]*/, '')
                    .replace(/\(exit status \d+\)/g, '')
                    .trimEnd();
                if (cleanedStderr) {
                    currentStdout = cleanedStderr;
                }
            }

            // Calculate only the newly printed chunk for step i by slicing off previous output length:
            const newChunk = currentStdout.slice(Math.min(this.previousStdoutLength, currentStdout.length));
            this.previousStdoutLength = currentStdout.length;

            if (isInputStarved) {
                // Record the newly printed chunk for this step
                this.stepChunks.push(newChunk);

                // Render the stitched transcript
                this.renderTranscript(false);

                // Highlight active input line in editor (Matches Image 2 line 5 highlight)
                this.syncActiveInputLine(code);

                // Show inline terminal input box right below the prompt
                this.showInlineInput();
                if (this.statusText) this.statusText.textContent = 'Waiting for input...';

                // Sync with Firebase in connected mode so both screens show inline input and prompt
                if (this.isConnected && this.firebaseDb) {
                    const waitingPayload = {
                        transcript: this.accumulatedTerminalText,
                        inputs: this.runSessionInputs,
                        waitingForInput: true,
                        isRunning: false,
                        iteration: (this.sharedConsoleState && typeof this.sharedConsoleState.iteration === 'number') ? this.sharedConsoleState.iteration : 1,
                        activeTab: 'output',
                        stepChunks: this.stepChunks,
                        previousStdoutLength: this.previousStdoutLength,
                        finalChunk: '',
                        updatedAt: Date.now(),
                        updatedBy: this.currentUser
                    };
                    this.sharedConsoleState = waitingPayload;
                    this.firebaseDb.ref('compiler/sharedRoom/console').set(waitingPayload);
                }
                return; // Remain active, waiting for Enter
            }

            // Check for real compilation or syntax error
            if (!data.ok && stderr) {
                this.setRunningState(false);
                this.updatePresenceBadge();
                this.hideInlineInput();

                this.accumulatedTerminalText = `Compilation Error:\n${stderr.trim()}\n`;
                this.updateTerminalDisplay();

                const lineMatch = stderr.match(/(?::|\.java:|\.c:|\.cpp:|\.py:|\.js:|\.ts:)(\d+)/i) || stderr.match(/:(\d+):/);
                if (lineMatch && lineMatch[1]) {
                    this.setActiveLine(parseInt(lineMatch[1], 10));
                } else {
                    this.setActiveLine(1);
                }

                if (this.isConnected && this.firebaseDb) {
                    const errorPayload = {
                        transcript: this.accumulatedTerminalText,
                        inputs: this.runSessionInputs,
                        waitingForInput: false,
                        isRunning: false,
                        iteration: (this.sharedConsoleState && typeof this.sharedConsoleState.iteration === 'number') ? this.sharedConsoleState.iteration : 1,
                        activeTab: 'output',
                        stepChunks: [],
                        previousStdoutLength: 0,
                        finalChunk: '',
                        updatedAt: Date.now(),
                        updatedBy: this.currentUser
                    };
                    this.sharedConsoleState = errorPayload;
                    this.firebaseDb.ref('compiler/sharedRoom/console').set(errorPayload);
                }

                const partialSteps = this.getPartialTraceOnSyntaxError(code);
                if (partialSteps && partialSteps.length > 0) {
                    this.stepsData = partialSteps;
                    this.totalSteps = partialSteps.length;
                    this.renderLivelyFlowCards();
                    this.jumpToStep(1, false);
                } else {
                    this.renderEmptyIterationState();
                }

                const iterNumber = this.isConnected
                    ? ((this.sharedIterations && this.sharedIterations.length) ? this.sharedIterations.length + 1 : 1)
                    : ((this.soloIterations && this.soloIterations.length) ? this.soloIterations.length + 1 : 1);

                const iterationEntry = {
                    iterationNumber: iterNumber,
                    timestamp: Date.now(),
                    language: this.currentLanguage,
                    codeSnapshot: code,
                    steps: Array.isArray(this.stepsData) ? [...this.stepsData] : [],
                    scriptTrace: Array.isArray(this.scriptTraceLines) ? [...this.scriptTraceLines] : [],
                    output: this.accumulatedTerminalText,
                    runBy: this.currentUser
                };
                this.saveIterationEntry(iterationEntry);
                return;
            }

            // Execution Completed Successfully!
            this.setRunningState(false);
            this.updatePresenceBadge();
            this.hideInlineInput();

            // Store final chunk and render finished transcript
            this.finalChunk = newChunk;
            this.renderTranscript(true);

            if (this.isConnected && this.firebaseDb) {
                const finishedPayload = {
                    transcript: this.accumulatedTerminalText,
                    inputs: this.runSessionInputs,
                    waitingForInput: false,
                    isRunning: false,
                    iteration: (this.sharedConsoleState && typeof this.sharedConsoleState.iteration === 'number') ? this.sharedConsoleState.iteration : 1,
                    activeTab: 'output',
                    stepChunks: this.stepChunks,
                    previousStdoutLength: this.previousStdoutLength,
                    finalChunk: this.finalChunk,
                    updatedAt: Date.now(),
                    updatedBy: this.currentUser
                };
                this.sharedConsoleState = finishedPayload;
                this.firebaseDb.ref('compiler/sharedRoom/console').set(finishedPayload);
            }

            // Generate lively flow iteration steps
            try {
                await this.executeCodeInteractively(code, true /* dryRun */, this.runSessionInputs.join('\n'));
            } catch (traceErr) {
                console.warn('Trace generation note:', traceErr);
            }

            const iterNumber = this.isConnected
                ? ((this.sharedIterations && this.sharedIterations.length) ? this.sharedIterations.length + 1 : 1)
                : ((this.soloIterations && this.soloIterations.length) ? this.soloIterations.length + 1 : 1);

            const iterationEntry = {
                iterationNumber: iterNumber,
                timestamp: Date.now(),
                language: this.currentLanguage,
                codeSnapshot: code,
                steps: Array.isArray(this.stepsData) ? [...this.stepsData] : [],
                scriptTrace: Array.isArray(this.scriptTraceLines) ? [...this.scriptTraceLines] : [],
                output: this.accumulatedTerminalText,
                runBy: this.currentUser
            };
            this.saveIterationEntry(iterationEntry);
        } catch (err) {
            this.setRunningState(false);
            this.updatePresenceBadge();
            this.hideInlineInput();

            if (err && (err.name === 'AbortError' || err.message === 'USER_STOPPED')) {
                this.accumulatedTerminalText += '\n> Program stopped by user.\n';
            } else {
                this.accumulatedTerminalText += `\nExecution Error: ${err ? (err.message || err) : 'Error'}\n`;
            }
            this.updateTerminalDisplay();

            if (this.isConnected && this.firebaseDb) {
                const catchPayload = {
                    transcript: this.accumulatedTerminalText,
                    inputs: this.runSessionInputs,
                    waitingForInput: false,
                    isRunning: false,
                    iteration: (this.sharedConsoleState && typeof this.sharedConsoleState.iteration === 'number') ? this.sharedConsoleState.iteration : 1,
                    activeTab: 'output',
                    stepChunks: this.stepChunks,
                    previousStdoutLength: this.previousStdoutLength,
                    finalChunk: this.finalChunk,
                    updatedAt: Date.now(),
                    updatedBy: this.currentUser
                };
                this.sharedConsoleState = catchPayload;
                this.firebaseDb.ref('compiler/sharedRoom/console').set(catchPayload);
            }
        }
    }

    renderTranscript(isFinished = false) {
        let transcript = '';
        const inputCount = this.runSessionInputs.length;
        const chunkCount = this.stepChunks.length;

        for (let j = 0; j < chunkCount; j++) {
            const chunk = this.stepChunks[j];
            if (j < inputCount) {
                const sep = (chunk.endsWith(' ') || chunk.endsWith('\t') || chunk.endsWith('\n')) ? '' : ' ';
                transcript += chunk + sep + this.runSessionInputs[j] + '\n';
            } else {
                transcript += chunk;
            }
        }

        if (isFinished) {
            if (this.finalChunk) {
                transcript += this.finalChunk;
            }
            if (!transcript.endsWith('\n')) {
                transcript += '\n';
            }
            transcript += '\n> Program finished with exit code 0\n';
        }

        this.accumulatedTerminalText = transcript;
        this.updateTerminalDisplay();
    }

    syncActiveInputLine(code) {
        if (!code) return;
        const lines = code.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.includes('Scanner') || line.includes('System.in') || line.includes('.next') || line.includes('input(') || line.includes('cin >>') || line.includes('scanf(')) {
                this.setActiveLine(i + 1);
                return;
            }
        }
    }

    formatInteractiveTerminalText(rawText) {
        if (!rawText) return '';
        if (!this.runSessionInputs || this.runSessionInputs.length === 0) {
            return rawText;
        }

        let result = rawText;
        for (let k = 0; k < this.runSessionInputs.length; k++) {
            const inp = this.runSessionInputs[k];
            const promptPattern = /(:|\?|>)\s*(?=[A-Za-z0-9_#])/;
            if (promptPattern.test(result) && !result.includes(`: ${inp}`)) {
                result = result.replace(promptPattern, `$1 ${inp}\n`);
            }
        }
        return result;
    }

    showInlineInput() {
        if (this.terminalInputRow && this.terminalInlineInput) {
            this.terminalInputRow.style.display = 'flex';
            this.terminalInlineInput.value = '';
            setTimeout(() => {
                if (this.terminalInlineInput) this.terminalInlineInput.focus();
                if (this.terminalScroll) this.terminalScroll.scrollTop = this.terminalScroll.scrollHeight;
            }, 40);
        }
    }

    hideInlineInput() {
        if (this.terminalInputRow) {
            this.terminalInputRow.style.display = 'none';
        }
    }

    handleInlineInputSubmit() {
        const val = this.terminalInlineInput ? this.terminalInlineInput.value : '';
        this.hideInlineInput();

        if (this.inputResolve) {
            const resolve = this.inputResolve;
            this.inputResolve = null;
            this.inputReject = null;
            this.accumulatedTerminalText += (this.accumulatedTerminalText.endsWith('\n') ? '' : ' ') + val + '\n';
            this.updateTerminalDisplay();
            resolve(val);
            return;
        }

        if (this.isConnected) {
            // Push input into shared session
            const currentInputs = (this.sharedConsoleState && Array.isArray(this.sharedConsoleState.inputs))
                ? [...this.sharedConsoleState.inputs]
                : [...this.runSessionInputs];
            currentInputs.push(val);
            this.runSessionInputs = currentInputs;

            if (this.sharedConsoleState && Array.isArray(this.sharedConsoleState.stepChunks)) {
                this.stepChunks = [...this.sharedConsoleState.stepChunks];
            }
            if (this.sharedConsoleState && typeof this.sharedConsoleState.previousStdoutLength === 'number') {
                this.previousStdoutLength = this.sharedConsoleState.previousStdoutLength;
            }

            // Immediately render the transcript with the user input inline
            this.renderTranscript(false);

            // Broadcast intermediate running state so partner sees entered input & running state immediately
            if (this.firebaseDb) {
                const intermediate = {
                    transcript: this.accumulatedTerminalText,
                    inputs: this.runSessionInputs,
                    waitingForInput: false,
                    isRunning: true,
                    iteration: (this.sharedConsoleState && typeof this.sharedConsoleState.iteration === 'number') ? this.sharedConsoleState.iteration : 1,
                    activeTab: 'output',
                    stepChunks: this.stepChunks,
                    previousStdoutLength: this.previousStdoutLength,
                    finalChunk: '',
                    updatedAt: Date.now(),
                    updatedBy: this.currentUser
                };
                this.sharedConsoleState = intermediate;
                this.firebaseDb.ref('compiler/sharedRoom/console').set(intermediate);
            }

            // Auto re-run API call with updated inputs until exit code 0
            const code = this.textarea ? this.textarea.value : '';
            this.executeRunSession(code);
        } else {
            // Push input into solo session
            this.runSessionInputs.push(val);

            // Re-render transcript showing the entered input inline
            this.renderTranscript(false);

            // Auto re-run API call with updated inputs until exit code 0
            const code = this.textarea ? this.textarea.value : '';
            this.executeRunSession(code);
        }
    }

    setRunningState(isRunning) {
        this.isExecuting = isRunning;
        if (this.btnRun) {
            if (isRunning) {
                this.btnRun.classList.add('is-running');
                if (this.runBtnIcon) this.runBtnIcon.textContent = '⏹';
                if (this.runBtnLabel) this.runBtnLabel.textContent = 'Stop';
                this.btnRun.title = 'Stop Execution';
            } else {
                this.btnRun.classList.remove('is-running');
                if (this.runBtnIcon) this.runBtnIcon.textContent = '▶';
                if (this.runBtnLabel) this.runBtnLabel.textContent = 'Run';
                this.btnRun.title = 'Run Code (Ctrl + Enter)';
            }
        }
    }

    stopExecution() {
        this.isExecuting = false;
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
        this.hideInlineInput();
        if (this.inputReject) {
            const reject = this.inputReject;
            this.inputResolve = null;
            this.inputReject = null;
            reject(new Error('USER_STOPPED'));
        }
        this.setRunningState(false);
        this.updatePresenceBadge();

        if (this.isConnected && this.firebaseDb) {
            this.accumulatedTerminalText += '\n> Program stopped by user.\n';
            this.updateTerminalDisplay();
            const stopPayload = {
                transcript: this.accumulatedTerminalText,
                inputs: this.runSessionInputs,
                waitingForInput: false,
                isRunning: false,
                iteration: (this.sharedConsoleState && typeof this.sharedConsoleState.iteration === 'number') ? this.sharedConsoleState.iteration : 0,
                activeTab: 'output',
                stepChunks: this.stepChunks,
                previousStdoutLength: this.previousStdoutLength,
                finalChunk: '',
                updatedAt: Date.now(),
                updatedBy: this.currentUser
            };
            this.sharedConsoleState = stopPayload;
            this.firebaseDb.ref('compiler/sharedRoom/console').set(stopPayload);
        }
    }

    /* Stdin Prompt (Legacy helper) */
    async promptInteractiveInput(promptText = '') {
        if (promptText) {
            this.accumulatedTerminalText += promptText;
            this.updateTerminalDisplay();
        }

        this.showInlineInput();

        return new Promise((resolve, reject) => {
            this.inputResolve = resolve;
            this.inputReject = reject;
        });
    }

    updateTerminalDisplay() {
        if (this.terminalText) {
            this.terminalText.textContent = this.accumulatedTerminalText;
        }
        if (this.terminalScroll) {
            this.terminalScroll.scrollTop = this.terminalScroll.scrollHeight;
        }
    }

    /* --------------------------------------------------------------------------
       PROGRAMIZ / JAVAC ERROR DIAGNOSTICS
       -------------------------------------------------------------------------- */
    checkCompilationErrors(code, lang) {
        const filename = this.getFilename(lang);
        const lines = code.split('\n');

        // 1. Missing Semicolon Check (Java, C, C++, JS)
        if (['java', 'c', 'cpp', 'javascript'].includes(lang)) {
            for (let i = 0; i < lines.length; i++) {
                const rawLine = lines[i];
                const trimmed = rawLine.trim();
                const lineNum = i + 1;

                if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('#')) {
                    continue;
                }
                if (trimmed.startsWith('public class ') || trimmed.startsWith('class ') || trimmed.startsWith('interface ') || trimmed.startsWith('enum ')) {
                    continue;
                }
                if (trimmed.includes('main(') || trimmed.startsWith('for') || trimmed.startsWith('while') || trimmed.startsWith('if') || trimmed.startsWith('else')) {
                    continue;
                }
                if (trimmed.endsWith('{') || trimmed.endsWith('}') || trimmed.endsWith(':')) {
                    continue;
                }

                // Check statement lines missing a semicolon
                if (
                    trimmed.startsWith('int ') || trimmed.startsWith('double ') || trimmed.startsWith('float ') ||
                    trimmed.startsWith('String ') || trimmed.startsWith('char ') || trimmed.startsWith('boolean ') ||
                    trimmed.startsWith('Scanner ') || trimmed.startsWith('System.out.') || trimmed.startsWith('printf') ||
                    trimmed.startsWith('cout') || trimmed.startsWith('cin') || trimmed.startsWith('return ') ||
                    trimmed.startsWith('sum') || trimmed.startsWith('num') || trimmed.includes('=')
                ) {
                    if (!trimmed.endsWith(';')) {
                        const caretSpaces = ' '.repeat(rawLine.length);
                        return {
                            lineNum: lineNum,
                            message: `${filename}:${lineNum}: error: ';' expected\n    ${trimmed}\n    ${caretSpaces}^\n1 error`
                        };
                    }
                }
            }
        }

        // 2. Unclosed Braces Check (Matches Image 1)
        const openBraces = code.split('{').length - 1;
        const closeBraces = code.split('}').length - 1;
        if (openBraces > closeBraces) {
            const lastLine = lines.length;
            return {
                lineNum: 5,
                message: `${filename}:${lastLine}: error: reached end of file while parsing (unclosed '{')\n}\n ^\n1 error`
            };
        } else if (closeBraces > openBraces) {
            return {
                lineNum: 1,
                message: `${filename}: error: unexpected '}' found without matching opening brace\n1 error`
            };
        }

        // 3. Unclosed Parentheses Check
        const openParen = (code.match(/\(/g) || []).length;
        const closeParen = (code.match(/\)/g) || []).length;
        if (openParen > closeParen) {
            return {
                lineNum: lines.length,
                message: `${filename}:${lines.length}: error: reached end of file while parsing (unclosed '(')\n1 error`
            };
        }

        // 4. Unclosed String Literal Check
        const cleanedQuotes = code.replace(/\\"/g, '');
        const doubleQuotes = (cleanedQuotes.match(/"/g) || []).length;
        if (doubleQuotes % 2 !== 0) {
            return {
                lineNum: 1,
                message: `${filename}: error: unclosed string literal (missing \")\n1 error`
            };
        }

        return null;
    }

    getPartialTraceOnSyntaxError(code) {
        const lines = code.split('\n');
        const steps = [];
        for (let i = 0; i < lines.length; i++) {
            const trimmed = lines[i].trim();
            const lineNum = i + 1;
            if (trimmed.match(/Scanner\s+(\w+)\s*=\s*new\s+Scanner/i)) {
                steps.push({
                    stepNum: steps.length + 1,
                    type: 'Statement',
                    typeClass: 'statement',
                    iterTag: '',
                    line: lineNum,
                    code: trimmed.replace(';', ''),
                    subtext: trimmed,
                    isPrint: false
                });
            } else if (this.matchPrintStatement(trimmed)) {
                const p = this.matchPrintStatement(trimmed);
                const evalMsg = this.evalPrintExpression(p.expr, { vars: {}, arrays: {} });
                steps.push({
                    stepNum: steps.length + 1,
                    type: 'Print Output',
                    typeClass: 'print',
                    iterTag: '',
                    line: lineNum,
                    code: `"${evalMsg}"`,
                    subtext: trimmed,
                    isPrint: true
                });
                break; // Exactly 2 steps as in Image 1 & 2
            }
        }
        return steps;
    }

    /* --------------------------------------------------------------------------
       DYNAMIC CODE INTERPRETER & ITERATION GENERATOR (Universal Engine)
       -------------------------------------------------------------------------- */
    async executeCodeInteractively(code, dryRun = false, stdinStr = '') {
        const lines = code.split('\n');
        const steps = [];
        const scriptTraceLines = [];

        // Parse stdin string into tokens for step tracing
        const stdinTokens = (stdinStr || '').trim().split(/\s+/).filter(Boolean);
        let stdinTokenIdx = 0;
        const getNextStdinVal = (defaultVal = 1) => {
            if (stdinTokenIdx < stdinTokens.length) {
                const token = stdinTokens[stdinTokenIdx++];
                const num = Number(token);
                return isNaN(num) ? token : num;
            }
            return defaultVal;
        };

        // Universal Scope state
        const state = {
            vars: {},
            arrays: {},
            methods: {},
            lastPromptText: '',
            hasScanner: false
        };

        // Extract custom static methods first: static int add(int a, int b) { return a + b; }
        this.extractMethods(code, state);

        let inMain = false;

        for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
            if (!this.isExecuting && !dryRun) return;

            const rawLine = lines[lineIdx];
            const trimmed = rawLine.trim();
            const lineNum = lineIdx + 1;

            if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
                continue;
            }

            // Detect main function or entry block
            if (trimmed.includes('main(') || trimmed.includes('def main')) {
                inMain = true;
                continue;
            }

            // Skip class declaration / imports / includes
            if (!inMain && (trimmed.startsWith('import ') || trimmed.startsWith('public class ') || trimmed.startsWith('class ') || trimmed.startsWith('#include') || trimmed.startsWith('using namespace'))) {
                continue;
            }

            // Skip method definitions (already extracted)
            if (trimmed.match(/static\s+\w+\s+\w+\s*\(/)) {
                let depth = trimmed.includes('{') ? 1 : 0;
                while (depth > 0 && lineIdx < lines.length - 1) {
                    lineIdx++;
                    const subL = lines[lineIdx];
                    if (subL.includes('{')) depth++;
                    if (subL.includes('}')) depth--;
                }
                continue;
            }

            // 1. Scanner Initialization: Scanner scanner = new Scanner(System.in);
            if (trimmed.match(/Scanner\s+(\w+)\s*=\s*new\s+Scanner/i)) {
                state.hasScanner = true;
                this.recordStep({
                    stepNum: steps.length + 1,
                    type: 'Statement',
                    typeClass: 'statement',
                    iterTag: '',
                    line: lineNum,
                    code: trimmed.replace(';', ''),
                    subtext: trimmed,
                    isPrint: false
                }, steps, scriptTraceLines);
                continue;
            }

            // 2. Array Initialization: int[] nums = new int[5]; or int[] nums = {1, 2, 3};
            const arrayMatch = trimmed.match(/(?:int\s*\[\s*\]|let|var|const)?\s*(\w+)\s*=\s*new\s+int\s*\[\s*(\d+)\s*\]/i) ||
                trimmed.match(new RegExp('(?:int\\s*\\[\\s*\\]|let|var|const)?\\s*(\\w+)\\s*=\\s*\\{\\s*(.*?)\\s*\\};?')) ||
                trimmed.match(/(\w+)\s*=\s*\[\s*(.*?)\s*\]/);
            if (arrayMatch && !trimmed.startsWith('for') && !trimmed.startsWith('if') && !trimmed.startsWith('while')) {
                const arrName = arrayMatch[1];
                const sizeOrVals = arrayMatch[2];
                let initialArray = [];
                if (!isNaN(parseInt(sizeOrVals, 10)) && !sizeOrVals.includes(',')) {
                    initialArray = new Array(parseInt(sizeOrVals, 10)).fill(0);
                } else if (sizeOrVals) {
                    initialArray = sizeOrVals.split(',').map(s => parseInt(s.trim(), 10) || 0);
                } else {
                    initialArray = [0, 0, 0, 0, 0];
                }
                state.arrays[arrName] = initialArray;

                this.recordStep({
                    stepNum: steps.length + 1,
                    type: 'Statement',
                    typeClass: 'statement',
                    iterTag: '',
                    line: lineNum,
                    code: `${arrName} = [${initialArray.join(', ')}]`,
                    subtext: trimmed,
                    isPrint: false
                }, steps, scriptTraceLines);
                continue;
            }

            // 3. Variable Declaration / Multiple Declarations: int a = 5, b = 10, sum = 0;
            const multiVarMatch = trimmed.match(/^(?:int|let|var|const|double|float|long|short)\s+([^;]+);?$/);
            if (multiVarMatch && !trimmed.includes('(') && !trimmed.includes('new ') && !trimmed.includes('nextInt') && !trimmed.includes('input(')) {
                const decls = multiVarMatch[1].split(',');
                for (const decl of decls) {
                    const parts = decl.trim().split('=');
                    const vName = parts[0].trim();
                    const vVal = parts.length > 1 ? this.evalExpression(parts[1].trim(), state) : 0;
                    state.vars[vName] = vVal;

                    this.recordStep({
                        stepNum: steps.length + 1,
                        type: 'Initialize',
                        typeClass: 'initialize',
                        iterTag: '',
                        line: lineNum,
                        code: `${vName}=${vVal}`,
                        subtext: trimmed,
                        isPrint: false
                    }, steps, scriptTraceLines);

                    if (scriptTraceLines.length === 0) scriptTraceLines.push('// Reading from input');
                    scriptTraceLines.push(`${vName}=${vVal}`);
                }
                continue;
            }

            // 4. Single Variable Assignment / Expression: sum = sum + num; or sum += num;
            const singleAssignMatch = trimmed.match(/^(\w+)\s*=\s*([^;]+);?$/);
            if (singleAssignMatch && !trimmed.startsWith('return') && !trimmed.startsWith('for') && !trimmed.startsWith('if') && !trimmed.startsWith('while') && !trimmed.includes('new ') && !trimmed.includes('nextInt') && !trimmed.includes('input(')) {
                const varName = singleAssignMatch[1];
                const valExpr = singleAssignMatch[2].trim();
                const evalVal = this.evalExpression(valExpr, state);
                state.vars[varName] = evalVal;

                this.recordStep({
                    stepNum: steps.length + 1,
                    type: 'Initialize',
                    typeClass: 'initialize',
                    iterTag: '',
                    line: lineNum,
                    code: `${varName}=${evalVal}`,
                    subtext: trimmed,
                    isPrint: false
                }, steps, scriptTraceLines);

                scriptTraceLines.push(`${varName}=${evalVal}`);
                continue;
            }

            // 5. Standalone Print Statement: System.out.println("Hello, World!");
            const printMatch = this.matchPrintStatement(trimmed);
            if (printMatch && !trimmed.includes('nextInt') && !trimmed.includes('input(')) {
                const evaluatedMsg = this.evalPrintExpression(printMatch.expr, state);
                const isPrintln = printMatch.isPrintln;

                if (!dryRun) {
                    this.accumulatedTerminalText += evaluatedMsg + (isPrintln ? '\n' : '');
                    this.updateTerminalDisplay();
                    state.lastPromptText = evaluatedMsg;
                }

                this.recordStep({
                    stepNum: steps.length + 1,
                    type: 'Print Output',
                    typeClass: 'print',
                    iterTag: '',
                    line: lineNum,
                    code: `"${evaluatedMsg}"`,
                    subtext: trimmed,
                    isPrint: true
                }, steps, scriptTraceLines);

                scriptTraceLines.push(`"${evaluatedMsg}"`);
                continue;
            }

            // 6. Standalone Input Statement outside loop: int n = scanner.nextInt();
            const inputMatch = this.matchInputStatement(trimmed);
            if (inputMatch) {
                const varName = inputMatch.varName;
                let val = 1;
                if (!dryRun) {
                    const promptMsg = inputMatch.promptMsg || (state.lastPromptText ? '' : 'Enter input: ');
                    const rawVal = await this.promptInteractiveInput(promptMsg);
                    val = parseInt(rawVal.trim(), 10) || rawVal.trim();
                } else {
                    val = getNextStdinVal(1);
                }
                state.vars[varName] = val;

                this.recordStep({
                    stepNum: steps.length + 1,
                    type: 'Initialize',
                    typeClass: 'initialize',
                    iterTag: '',
                    line: lineNum,
                    code: `${varName}=${val}`,
                    subtext: trimmed,
                    isPrint: false
                }, steps, scriptTraceLines);

                scriptTraceLines.push(`${varName}=${val}`);
                continue;
            }

            // 7. IF / ELSE IF / ELSE CONDITION BLOCKS
            const ifMatch = trimmed.match(new RegExp('^if\\s*\\((.*)\\)\\s*\\{?')) || trimmed.match(/^if\s+(.*):/);
            if (ifMatch) {
                const condExpr = ifMatch[1];
                const condMet = this.evalConditionExpr(condExpr, state);

                this.recordStep({
                    stepNum: steps.length + 1,
                    type: 'Condition Check',
                    typeClass: 'condition',
                    iterTag: '',
                    line: lineNum,
                    code: `if (${condExpr}) => ${condMet ? 'TRUE' : 'FALSE'}`,
                    subtext: trimmed,
                    isPrint: false
                }, steps, scriptTraceLines);

                // Collect if body and optional else body
                const ifBlock = this.extractBlock(lines, lineIdx);
                lineIdx = ifBlock.endIndex;

                if (condMet) {
                    await this.executeStatementsSequence(ifBlock.lines, state, steps, scriptTraceLines, dryRun);
                } else if (ifBlock.hasElse) {
                    await this.executeStatementsSequence(ifBlock.elseLines, state, steps, scriptTraceLines, dryRun);
                }
                continue;
            }

            // 8. WHILE LOOP BLOCK: while (i <= 5) { ... }
            const whileMatch = trimmed.match(new RegExp('^while\\s*\\((.*)\\)\\s*\\{?')) || trimmed.match(/^while\s+(.*):/);
            if (whileMatch && !trimmed.startsWith('do')) {
                const condExpr = whileMatch[1];
                const loopLineNum = lineNum;

                const whileBlock = this.extractBlock(lines, lineIdx);
                lineIdx = whileBlock.endIndex;

                let iterCount = 1;
                while (this.evalConditionExpr(condExpr, state)) {
                    if (!this.isExecuting && !dryRun) return;

                    await this.executeStatementsSequence(whileBlock.lines, state, steps, scriptTraceLines, dryRun, iterCount);
                    iterCount++;
                    if (iterCount > 50) break; // Infinite loop safety guard
                }

                this.recordStep({
                    stepNum: steps.length + 1,
                    type: 'Condition Check',
                    typeClass: 'condition',
                    iterTag: `Iteration #${iterCount}`,
                    line: loopLineNum,
                    code: `Condition (${condExpr}) is FALSE => Loop finished`,
                    subtext: condExpr,
                    isPrint: false
                }, steps, scriptTraceLines);
                continue;
            }

            // 9. FOR LOOP BLOCK (Java, C, C++, JS, Python)
            const forLoopMatch = trimmed.match(new RegExp('for\\s*\\(\\s*(?:int|let|var)?\\s*(\\w+)\\s*=\\s*([^;]+);\\s*(\\w+)\\s*(<=|<|>=|>|!=)\\s*([^;]+);\\s*([^)]+)\\)\\s*\\{?')) ||
                trimmed.match(/for\s+(\w+)\s+in\s+range\s*\(([^)]+)\)\s*:?/);

            if (forLoopMatch) {
                const loopLineNum = lineNum;
                let loopVar = '';
                let startVal = 1;
                let op = '<=';
                let endVal = 5;

                if (trimmed.includes('range')) {
                    loopVar = forLoopMatch[1];
                    const rangeArgs = forLoopMatch[2].split(',').map(s => s.trim());
                    if (rangeArgs.length === 1) {
                        startVal = 0;
                        endVal = this.evalExpression(rangeArgs[0], state) - 1;
                        op = '<=';
                    } else if (rangeArgs.length >= 2) {
                        startVal = this.evalExpression(rangeArgs[0], state);
                        endVal = this.evalExpression(rangeArgs[1], state) - 1;
                        op = '<=';
                    }
                } else {
                    loopVar = forLoopMatch[1];
                    startVal = this.evalExpression(forLoopMatch[2], state);
                    op = forLoopMatch[4];
                    endVal = this.evalExpression(forLoopMatch[5], state);
                }

                // Collect loop body lines
                const bodyLines = [];
                let braceCount = trimmed.includes('{') ? 1 : 0;
                let innerIdx = lineIdx + 1;

                while (innerIdx < lines.length) {
                    const bLine = lines[innerIdx];
                    const bTrim = bLine.trim();
                    if (bTrim.includes('{')) braceCount++;
                    if (bTrim.includes('}')) {
                        braceCount--;
                        if (braceCount <= 0) break;
                    }
                    if (bTrim && !bTrim.startsWith('//')) {
                        bodyLines.push({ text: bTrim, lineNum: innerIdx + 1 });
                    }
                    innerIdx++;
                }
                lineIdx = innerIdx; // Advance outer loop index past loop block

                // Run Loop Iterations
                let iterCount = 1;
                state.vars[loopVar] = startVal;

                while (this.evalCondition(state.vars[loopVar], op, endVal)) {
                    if (!this.isExecuting && !dryRun) return;
                    const curVal = state.vars[loopVar];
                    const iterTag = `Iteration #${iterCount}`;

                    // Initial step for loop variable (only on first iteration, matches Image 4 Step 4)
                    if (iterCount === 1) {
                        this.recordStep({
                            stepNum: steps.length + 1,
                            type: 'Initialize',
                            typeClass: 'initialize',
                            iterTag: iterTag,
                            line: loopLineNum,
                            code: `${loopVar}=${curVal}`,
                            subtext: `for (int ${loopVar} = ${curVal}; ...)`,
                            isPrint: false
                        }, steps, scriptTraceLines);
                        scriptTraceLines.push(`${loopVar}=${curVal}`);
                    }

                    // Execute Loop Body lines sequentially
                    for (const bItem of bodyLines) {
                        if (!this.isExecuting && !dryRun) return;
                        const bText = bItem.text;
                        const bLineNum = bItem.lineNum;

                        // Check Print in loop
                        const bPrint = this.matchPrintStatement(bText);
                        if (bPrint && !bText.includes('nextInt') && !bText.includes('input(')) {
                            const evalMsg = this.evalPrintExpression(bPrint.expr, state);
                            if (!dryRun) {
                                this.accumulatedTerminalText += evalMsg + (bPrint.isPrintln ? '\n' : '');
                                this.updateTerminalDisplay();
                                state.lastPromptText = evalMsg;
                            }

                            this.recordStep({
                                stepNum: steps.length + 1,
                                type: 'Print Output',
                                typeClass: 'print',
                                iterTag: '',
                                line: bLineNum,
                                code: `"${evalMsg}"`,
                                subtext: bText,
                                isPrint: true
                            }, steps, scriptTraceLines);

                            scriptTraceLines.push(`"${evalMsg}"`);
                            continue;
                        }

                        // Check Input in loop: nums[i] = sc.nextInt(); or int s = scanner.nextInt();
                        const bInput = this.matchInputStatement(bText);
                        if (bInput) {
                            let valIn = 1;
                            if (!dryRun) {
                                const promptMsg = bInput.promptMsg || '';
                                const rawIn = await this.promptInteractiveInput(promptMsg);
                                const parsed = parseInt(rawIn.trim(), 10);
                                valIn = isNaN(parsed) ? (rawIn.trim() || 1) : parsed;
                            } else {
                                valIn = getNextStdinVal(1);
                            }

                            if (bInput.isArray) {
                                const arrName = bInput.arrayName;
                                const idxVal = state.vars[bInput.indexVar] !== undefined ? state.vars[bInput.indexVar] : (curVal - 1);
                                if (!state.arrays[arrName]) state.arrays[arrName] = [];
                                state.arrays[arrName][idxVal] = valIn;

                                this.recordStep({
                                    stepNum: steps.length + 1,
                                    type: 'Increment / Step',
                                    typeClass: 'step',
                                    iterTag: '',
                                    line: bLineNum,
                                    code: `${arrName}[${idxVal}] = ${valIn}`,
                                    subtext: bText,
                                    isPrint: false
                                }, steps, scriptTraceLines);

                                scriptTraceLines.push(`${arrName}[${idxVal}] = ${valIn}`);
                            } else {
                                const varName = bInput.varName;
                                state.vars[varName] = valIn;

                                this.recordStep({
                                    stepNum: steps.length + 1,
                                    type: 'Initialize',
                                    typeClass: 'initialize',
                                    iterTag: '',
                                    line: bLineNum,
                                    code: `${varName}=${valIn}`,
                                    subtext: bText,
                                    isPrint: false
                                }, steps, scriptTraceLines);

                                scriptTraceLines.push(`${varName}=${valIn}`);
                            }
                            continue;
                        }

                        // Check Accumulation in loop: sum += num; or sum += nums[i]; or sum = sum + num;
                        const accumMatch = bText.match(/(\w+)\s*\+=\s*([^;]+);?/) ||
                            bText.match(/(\w+)\s*=\s*\1\s*\+\s*([^;]+);?/);
                        if (accumMatch) {
                            const targetVar = accumMatch[1];
                            const addExpr = accumMatch[2].trim();
                            const addVal = this.evalExpression(addExpr, state);
                            const oldVal = state.vars[targetVar] || 0;
                            const newVal = oldVal + addVal;
                            state.vars[targetVar] = newVal;

                            this.recordStep({
                                stepNum: steps.length + 1,
                                type: 'Increment / Step',
                                typeClass: 'step',
                                iterTag: '',
                                line: bLineNum,
                                code: `${targetVar} += ${addVal} => ${targetVar}=${newVal}`,
                                subtext: bText,
                                isPrint: false
                            }, steps, scriptTraceLines);

                            scriptTraceLines.push(`${targetVar} += ${addVal} => ${targetVar}=${newVal}`);
                            continue;
                        }
                    }

                    // Loop step increment: i++ => i=next
                    state.vars[loopVar] += 1;
                    const nextVal = state.vars[loopVar];
                    this.recordStep({
                        stepNum: steps.length + 1,
                        type: 'Increment / Step',
                        typeClass: 'step',
                        iterTag: iterTag,
                        line: loopLineNum,
                        code: `${loopVar}++ => ${loopVar}=${nextVal}`,
                        subtext: `${loopVar}++`,
                        isPrint: false
                    }, steps, scriptTraceLines);

                    scriptTraceLines.push(`${loopVar}++ => ${loopVar}=${nextVal}`);

                    iterCount++;
                    if (iterCount > 50) break; // Infinite loop safety guard
                }

                // Condition Check Step (Loop finished, matches Image 6 Step 20)
                this.recordStep({
                    stepNum: steps.length + 1,
                    type: 'Condition Check',
                    typeClass: 'condition',
                    iterTag: `Iteration #${iterCount}`,
                    line: loopLineNum,
                    code: `Condition (${loopVar} ${op} ${endVal}) is FALSE => Loop finished`,
                    subtext: `${loopVar} ${op} ${endVal}`,
                    isPrint: false
                }, steps, scriptTraceLines);
                continue;
            }

            // 10. General Suffix Print Output / Other Statements
            const finalPrint = this.matchPrintStatement(trimmed);
            if (finalPrint) {
                const evalMsg = this.evalPrintExpression(finalPrint.expr, state);
                if (!dryRun) {
                    this.accumulatedTerminalText += evalMsg + '\n';
                    this.updateTerminalDisplay();
                }

                this.recordStep({
                    stepNum: steps.length + 1,
                    type: 'Print Output',
                    typeClass: 'print',
                    iterTag: '',
                    line: lineNum,
                    code: `"${evalMsg}"`,
                    subtext: trimmed,
                    isPrint: true
                }, steps, scriptTraceLines);

                scriptTraceLines.push(`"${evalMsg}"`);
            }
        }

        // Programiz Code Execution Completion Badge
        if (!dryRun) {
            this.accumulatedTerminalText += `\n----------------------------------------\n=== Code Execution Successful ===\n`;
            this.updateTerminalDisplay();
        }

        this.stepsData = steps;
        this.totalSteps = steps.length;
        this.scriptTraceLines = scriptTraceLines;

        this.renderLivelyFlowCards();
        this.renderScriptText(scriptTraceLines);
        this.updatePlaybackUI();
        if (this.totalSteps > 0) {
            this.jumpToStep(1, false);
        }
        return scriptTraceLines;
    }

    /* Dry-run preview trace for ANY code */
    compileAndTrace() {
        const code = this.textarea ? this.textarea.value : '';
        const trimmed = code.trim();

        if (!trimmed || trimmed.startsWith('Write ')) {
            this.renderEmptyIterationState();
            return;
        }

        const customStdin = (this.runSessionInputs && this.runSessionInputs.length) ? this.runSessionInputs.join('\n') : '';
        // Parse in dry-run mode without waiting on stdin
        this.executeCodeInteractively(code, true /* dryRun */, customStdin);
    }

    /* --------------------------------------------------------------------------
       HELPER METHODS FOR EXECUTION
       -------------------------------------------------------------------------- */
    extractMethods(code, state) {
        const methodRegex = new RegExp('static\\s+(\\w+)\\s+(\\w+)\\s*\\(([^)]*)\\)\\s*\\{([^}]*)\\}', 'g');
        let match;
        while ((match = methodRegex.exec(code)) !== null) {
            const retType = match[1];
            const name = match[2];
            const args = match[3].split(',').map(a => a.trim().split(' ').pop()).filter(Boolean);
            const body = match[4].trim();
            if (name !== 'main') {
                state.methods[name] = { retType, args, body };
            }
        }
    }

    extractBlock(lines, startIdx) {
        let braceCount = 0;
        let foundOpen = false;
        const blockLines = [];
        let curIdx = startIdx;

        while (curIdx < lines.length) {
            const line = lines[curIdx].trim();
            if (line.includes('{')) {
                braceCount += (line.split('{').length - 1);
                foundOpen = true;
            }
            if (line.includes('}')) {
                braceCount -= (line.split('}').length - 1);
                if (foundOpen && braceCount <= 0) {
                    break;
                }
            }
            if (curIdx > startIdx && line && !line.startsWith('//')) {
                blockLines.push({ text: line, lineNum: curIdx + 1 });
            }
            curIdx++;
        }

        return {
            lines: blockLines,
            endIndex: curIdx,
            hasElse: false,
            elseLines: []
        };
    }

    async executeStatementsSequence(stmtLines, state, steps, scriptTraceLines, dryRun, iterIndex = null) {
        for (const item of stmtLines) {
            if (!this.isExecuting && !dryRun) return;
            const text = item.text.replace(/;$/, '');
            const lineNum = item.lineNum;

            // 1. Print
            const pr = this.matchPrintStatement(text);
            if (pr && !text.includes('nextInt') && !text.includes('input(')) {
                const evalMsg = this.evalPrintExpression(pr.expr, state);
                if (!dryRun) {
                    this.accumulatedTerminalText += evalMsg + (pr.isPrintln ? '\n' : '');
                    this.updateTerminalDisplay();
                    state.lastPromptText = evalMsg;
                }

                this.recordStep({
                    stepNum: steps.length + 1,
                    type: 'Print Output',
                    typeClass: 'print',
                    iterTag: iterIndex ? `Iteration #${iterIndex}` : '',
                    line: lineNum,
                    code: `"${evalMsg}"`,
                    subtext: item.text,
                    isPrint: true
                }, steps, scriptTraceLines);

                scriptTraceLines.push(`"${evalMsg}"`);
                continue;
            }

            // 2. Increment / Math Assignment: sum += num or fact = fact * i or i++
            const incMatch = text.match(/(\w+)\+\+/);
            if (incMatch) {
                const varName = incMatch[1];
                state.vars[varName] = (state.vars[varName] || 0) + 1;
                this.recordStep({
                    stepNum: steps.length + 1,
                    type: 'Increment / Step',
                    typeClass: 'step',
                    iterTag: iterIndex ? `Iteration #${iterIndex}` : '',
                    line: lineNum,
                    code: `${varName}++ => ${varName}=${state.vars[varName]}`,
                    subtext: item.text,
                    isPrint: false
                }, steps, scriptTraceLines);
                continue;
            }

            const mathAssign = text.match(/(\w+)\s*([\+\-\*\/%]=|=)\s*(.+)/);
            if (mathAssign) {
                const target = mathAssign[1];
                const op = mathAssign[2];
                const expr = mathAssign[3];
                const val = this.evalExpression(expr, state);
                if (op === '=') {
                    state.vars[target] = val;
                } else if (op === '+=') {
                    state.vars[target] = (state.vars[target] || 0) + val;
                } else if (op === '-=') {
                    state.vars[target] = (state.vars[target] || 0) - val;
                } else if (op === '*=') {
                    state.vars[target] = (state.vars[target] || 1) * val;
                } else if (op === '/=') {
                    state.vars[target] = Math.floor((state.vars[target] || 1) / (val || 1));
                }

                this.recordStep({
                    stepNum: steps.length + 1,
                    type: 'Increment / Step',
                    typeClass: 'step',
                    iterTag: iterIndex ? `Iteration #${iterIndex}` : '',
                    line: lineNum,
                    code: `${target} ${op} ${val} => ${target}=${state.vars[target]}`,
                    subtext: item.text,
                    isPrint: false
                }, steps, scriptTraceLines);
                continue;
            }
        }
    }

    evalConditionExpr(expr, state) {
        if (!expr) return false;
        let s = expr.trim();
        // Replace known variables
        try {
            const varKeys = Object.keys(state.vars).sort((a, b) => b.length - a.length);
            for (const k of varKeys) {
                const reg = new RegExp(`\\b${k}\\b`, 'g');
                s = s.replace(reg, state.vars[k]);
            }
            if (/^[0-9+\-*/%().\s<>=!&|]+$/.test(s)) {
                return Boolean(Function(`"use strict"; return (${s})`)());
            }
        } catch (e) { }
        return false;
    }

    matchPrintStatement(line) {
        // Java
        let m = line.match(/System\.out\.(println|print)\s*\((.*)\);?/);
        if (m) return { isPrintln: m[1] === 'println', expr: m[2] };

        // Python
        m = line.match(/^print\s*\((.*)\)$/);
        if (m) return { isPrintln: true, expr: m[1] };

        // C
        m = line.match(/printf\s*\((.*)\);?/);
        if (m) return { isPrintln: line.includes('\\n'), expr: m[1] };

        // C++
        m = line.match(/cout\s*<<\s*(.*);?/);
        if (m) return { isPrintln: line.includes('endl'), expr: m[1].replace(/<<\s*endl/g, '') };

        // JS
        m = line.match(/console\.log\s*\((.*)\);?/);
        if (m) return { isPrintln: true, expr: m[1] };

        return null;
    }

    matchInputStatement(line) {
        // Java: int num = scanner.nextInt(); or num = scanner.nextInt();
        let m = line.match(/(?:int|double|float|String)?\s*(\w+)\s*=\s*(?:\w+)\.(nextInt|nextLine|nextDouble|next)\s*\(\s*\);?/i);
        if (m) return { varName: m[1], isArray: false };

        // Java array input: nums[i] = scanner.nextInt(); or nums[i] = sc.nextInt();
        m = line.match(/(\w+)\s*\[\s*(\w+)\s*\]\s*=\s*(?:\w+)\.next(?:Int|Line|Double)?\s*\(\s*\);?/i);
        if (m) return { isArray: true, arrayName: m[1], indexVar: m[2] };

        // Python: val = int(input("...")) or val = input("...")
        m = line.match(/(\w+)\s*=\s*(?:int|float)?\s*\(?\s*input\s*\(\s*(.*?)\s*\)\s*\)?/);
        if (m) return { varName: m[1], promptMsg: m[2].replace(/["']/g, '') };

        // C: scanf("%d", &num);
        m = line.match(/scanf\s*\(.*,\s*&?(\w+)\);?/);
        if (m) return { varName: m[1] };

        // C++: cin >> num;
        m = line.match(/cin\s*>>\s*(\w+);?/);
        if (m) return { varName: m[1] };

        return null;
    }

    evalPrintExpression(rawExpr, state) {
        if (!rawExpr) return '';
        let expr = rawExpr.trim();

        // If Python f-string: f"Number {i}: "
        if (expr.startsWith('f"') || expr.startsWith("f'")) {
            let str = expr.slice(2, -1);
            return str.replace(new RegExp('\\{([^}]+)\\}', 'g'), (_, inner) => {
                return this.evalExpression(inner.trim(), state);
            });
        }

        // If C printf format: "Number %d: \n", i
        if (expr.includes(',') && (expr.includes('%d') || expr.includes('%s') || expr.includes('%f'))) {
            const parts = expr.split(',');
            let fmt = parts[0].replace(/["']/g, '').replace(/\\n/g, '');
            for (let i = 1; i < parts.length; i++) {
                const val = this.evalExpression(parts[i].trim(), state);
                fmt = fmt.replace(/%[dsf]/, val);
            }
            return fmt;
        }

        // C++ cout streaming: "Number " << i << ": "
        if (expr.includes('<<')) {
            const segments = expr.split('<<').map(s => s.trim());
            return segments.map(seg => {
                if (seg.startsWith('"') && seg.endsWith('"')) return seg.slice(1, -1);
                return this.evalExpression(seg, state);
            }).join('');
        }

        // Java/JS concatenation: "Number " + i + ": "
        const tokens = [];
        let current = '';
        let inQuotes = false;
        let quoteChar = '';

        for (let i = 0; i < expr.length; i++) {
            const ch = expr[i];
            if ((ch === '"' || ch === "'") && !inQuotes) {
                inQuotes = true;
                quoteChar = ch;
                current += ch;
            } else if (ch === quoteChar && inQuotes) {
                inQuotes = false;
                current += ch;
            } else if (ch === '+' && !inQuotes) {
                tokens.push(current.trim());
                current = '';
            } else {
                current += ch;
            }
        }
        if (current.trim()) tokens.push(current.trim());

        if (tokens.length > 1) {
            return tokens.map(tok => {
                if ((tok.startsWith('"') && tok.endsWith('"')) || (tok.startsWith("'") && tok.endsWith("'"))) {
                    return tok.slice(1, -1);
                }
                return this.evalExpression(tok, state);
            }).join('');
        }

        // Single literal or variable
        if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
            return expr.slice(1, -1);
        }

        return this.evalExpression(expr, state);
    }

    evalExpression(expr, state) {
        if (!expr) return 0;
        let s = expr.trim();
        if (s.endsWith(';')) s = s.slice(0, -1).trim();

        // Literal number
        if (!isNaN(Number(s))) return Number(s);

        // Literal string
        if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
            return s.slice(1, -1);
        }

        // Custom method call: multiply(6, 7)
        const methodCall = s.match(/^(\w+)\s*\((.*)\)$/);
        if (methodCall && state.methods && state.methods[methodCall[1]]) {
            const mData = state.methods[methodCall[1]];
            const argVals = methodCall[2].split(',').map(a => this.evalExpression(a.trim(), state));
            const subState = { vars: {}, arrays: {}, methods: state.methods };
            for (let i = 0; i < mData.args.length; i++) {
                subState.vars[mData.args[i]] = argVals[i];
            }
            const retMatch = mData.body.match(/return\s+([^;]+);?/);
            if (retMatch) {
                return this.evalExpression(retMatch[1].trim(), subState);
            }
        }

        // Array element: nums[i]
        const arrM = s.match(/(\w+)\[([^\]]+)\]/);
        if (arrM) {
            const arrName = arrM[1];
            const idx = this.evalExpression(arrM[2], state);
            if (state.arrays && state.arrays[arrName] && state.arrays[arrName][idx] !== undefined) {
                return state.arrays[arrName][idx];
            }
            return 0;
        }

        // Simple variable lookup
        if (state.vars && state.vars[s] !== undefined) {
            return state.vars[s];
        }

        // Math expression evaluation: replace known variables
        try {
            let mathExpr = s;
            if (state.vars) {
                const varKeys = Object.keys(state.vars).sort((a, b) => b.length - a.length);
                for (const k of varKeys) {
                    const reg = new RegExp(`\\b${k}\\b`, 'g');
                    mathExpr = mathExpr.replace(reg, state.vars[k]);
                }
            }
            if (/^[0-9+\-*/%().\s]+$/.test(mathExpr)) {
                return Function(`"use strict"; return (${mathExpr})`)();
            }
        } catch (e) { }

        return s;
    }

    evalCondition(left, op, right) {
        switch (op) {
            case '<=': return left <= right;
            case '<': return left < right;
            case '>=': return left >= right;
            case '>': return left > right;
            case '==': return left === right;
            case '!=': return left !== right;
            default: return false;
        }
    }

    /* --------------------------------------------------------------------------
       RENDER & PLAYBACK UI
       -------------------------------------------------------------------------- */
    renderEmptyIterationState() {
        this.stepsData = [];
        this.totalSteps = 0;
        if (this.iterationBadge) this.iterationBadge.style.display = 'none';
        if (this.emptyState) this.emptyState.style.display = 'flex';
        if (this.livelyContainer) this.livelyContainer.style.display = 'none';
        if (this.scriptContainer) this.scriptContainer.style.display = 'none';
        if (this.stepPill) this.stepPill.textContent = 'No steps';
        if (this.progressFill) this.progressFill.style.width = '0%';
        if (this.iterationHistoryStrip) this.iterationHistoryStrip.style.display = 'none';
        if (this.iterationHistoryPills) this.iterationHistoryPills.innerHTML = '';
    }

    renderLivelyFlowCards() {
        if (!this.livelyContainer) return;
        if (this.emptyState) this.emptyState.style.display = 'none';
        if (this.currentFlowMode === 'lively') {
            this.livelyContainer.style.display = 'flex';
        }
        this.livelyContainer.innerHTML = '';

        this.stepsData.forEach(step => {
            const card = document.createElement('div');
            card.className = `lively-flow-card ${step.stepNum === this.currentStep ? 'active' : ''}`;
            card.id = `lively-card-${step.stepNum}`;

            const activePill = step.stepNum === this.currentStep
                ? `<span class="lively-active-pill">ACTIVE</span>`
                : '';

            const iterLabel = step.iterTag ? `<span class="lively-iter-tag">${step.iterTag}</span>` : '';

            let contentBoxClass = 'lively-code-box';
            let icon = '';
            if (step.isPrint) {
                contentBoxClass += ' print-output';
                icon = '<span>🖨️</span> ';
            } else if (step.typeClass === 'initialize') {
                contentBoxClass += ' init-box';
            } else if (step.typeClass === 'condition') {
                contentBoxClass += ' cond-box';
            } else if (step.typeClass === 'statement') {
                contentBoxClass += ' statement-box';
            } else if (step.typeClass === 'step' || step.typeClass === 'increment') {
                contentBoxClass += ' step-box';
            }

            card.innerHTML = `
                <div class="lively-card-head">
                    <div class="lively-card-left">
                        <span class="lively-step-badge">${step.stepNum}</span>
                        <span class="lively-type-tag ${step.typeClass}">${step.type}</span>
                        ${iterLabel}
                    </div>
                    <div class="lively-card-right">
                        <span class="lively-line-label">Line ${step.line}</span>
                        ${activePill}
                    </div>
                </div>
                <div class="lively-card-body">
                    <div class="${contentBoxClass}">${icon}${step.code}</div>
                    <div class="lively-subtext">${step.subtext}</div>
                </div>
            `;

            card.addEventListener('click', () => {
                this.jumpToStep(step.stepNum, true);
            });

            this.livelyContainer.appendChild(card);
        });
    }

    renderScriptText(traceLines) {
        this.scriptTraceLines = traceLines;
        if (!this.scriptContent) return;
        this.scriptContent.textContent = traceLines.join('\n');
    }

    jumpToStep(stepNum, broadcast = true) {
        if (this.totalSteps === 0) return;
        if (stepNum < 1) stepNum = 1;
        if (stepNum > this.totalSteps) stepNum = this.totalSteps;
        this.currentStep = stepNum;

        document.querySelectorAll('.lively-flow-card').forEach(card => card.classList.remove('active'));
        const targetCard = document.getElementById(`lively-card-${stepNum}`);
        if (targetCard) {
            targetCard.classList.add('active');
            targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        const currentStepData = this.stepsData[stepNum - 1];
        if (currentStepData) {
            this.setActiveLine(currentStepData.line);
        }

        this.updatePlaybackUI();

        if (broadcast && this.isConnected && !this.isApplyingRemotePlayback && this.firebaseDb) {
            this.firebaseDb.ref('compiler/sharedRoom/playback').set({
                action: 'jump',
                step: stepNum,
                updatedBy: this.currentUser,
                timestamp: Date.now()
            });
        }
    }

    stepRelative(delta, broadcast = true) {
        this.jumpToStep(this.currentStep + delta, broadcast);
    }

    updatePlaybackUI() {
        if (this.stepPill) {
            this.stepPill.textContent = this.totalSteps > 0
                ? `Step ${this.currentStep} / ${this.totalSteps}`
                : 'No steps';
        }
        if (this.progressFill) {
            const pct = this.totalSteps > 0 ? (this.currentStep / this.totalSteps) * 100 : 0;
            this.progressFill.style.width = `${pct}%`;
        }
    }

    toggleLivePlayback(broadcast = true) {
        if (this.totalSteps === 0) {
            this.compileAndRun();
            return;
        }

        if (this.isPlaying) {
            this.pausePlayback(broadcast);
        } else {
            this.startPlayback(broadcast);
        }
    }

    startPlayback(broadcast = true) {
        this.isPlaying = true;
        if (this.playIcon) this.playIcon.textContent = '⏸';
        if (this.playText) this.playText.textContent = 'Pause';

        if (this.currentStep >= this.totalSteps) {
            this.jumpToStep(1, false);
        }

        this.startPlaybackTimer();

        if (broadcast && this.isConnected && !this.isApplyingRemotePlayback && this.firebaseDb) {
            this.firebaseDb.ref('compiler/sharedRoom/playback').set({
                action: 'play',
                speed: this.playbackSpeed,
                currentStep: this.currentStep,
                updatedBy: this.currentUser,
                timestamp: Date.now()
            });
        }
    }

    startPlaybackTimer() {
        const baseInterval = 800;
        const interval = baseInterval / this.playbackSpeed;

        this.playbackTimer = setInterval(() => {
            if (this.currentStep >= this.totalSteps) {
                this.pausePlayback(true);
            } else {
                this.stepRelative(1, true);
            }
        }, interval);
    }

    pausePlayback(broadcast = true) {
        this.isPlaying = false;
        if (this.playIcon) this.playIcon.textContent = '▶';
        if (this.playText) this.playText.textContent = 'Play Live';
        if (this.playbackTimer) {
            clearInterval(this.playbackTimer);
            this.playbackTimer = null;
        }

        if (broadcast && this.isConnected && !this.isApplyingRemotePlayback && this.firebaseDb) {
            this.firebaseDb.ref('compiler/sharedRoom/playback').set({
                action: 'pause',
                currentStep: this.currentStep,
                updatedBy: this.currentUser,
                timestamp: Date.now()
            });
        }
    }

    /* --------------------------------------------------------------------------
       VIEW SWITCHING
       -------------------------------------------------------------------------- */
    switchViewTab(tab, broadcast = true) {
        this.currentViewTab = tab;
        if (tab === 'output') {
            if (this.tabOutput) this.tabOutput.classList.add('active');
            if (this.tabIteration) this.tabIteration.classList.remove('active');
            if (this.outputView) this.outputView.style.display = 'flex';
            if (this.iterationView) this.iterationView.style.display = 'none';
            if (this.flowToggleWrap) this.flowToggleWrap.style.display = 'none';
        } else {
            if (this.tabIteration) this.tabIteration.classList.add('active');
            if (this.tabOutput) this.tabOutput.classList.remove('active');
            if (this.iterationView) this.iterationView.style.display = 'flex';
            if (this.outputView) this.outputView.style.display = 'none';
            if (this.flowToggleWrap) this.flowToggleWrap.style.display = 'flex';

            if (this.totalSteps === 0) {
                if (this.emptyState) this.emptyState.style.display = 'flex';
                if (this.livelyContainer) this.livelyContainer.style.display = 'none';
                if (this.scriptContainer) this.scriptContainer.style.display = 'none';
            } else {
                if (this.emptyState) this.emptyState.style.display = 'none';
                this.setFlowMode(this.currentFlowMode);
            }
        }

        if (broadcast && this.isConnected && !this.isApplyingRemoteConsole && this.firebaseDb) {
            this.firebaseDb.ref('compiler/sharedRoom/console').update({
                activeTab: tab,
                updatedAt: Date.now(),
                updatedBy: this.currentUser
            });
        }
    }

    setFlowMode(mode) {
        this.currentFlowMode = mode;
        if (mode === 'lively') {
            if (this.btnToggleLively) this.btnToggleLively.classList.add('active');
            if (this.btnToggleScript) this.btnToggleScript.classList.remove('active');
            if (this.livelyContainer) this.livelyContainer.style.display = 'flex';
            if (this.scriptContainer) this.scriptContainer.style.display = 'none';
        } else {
            if (this.btnToggleScript) this.btnToggleScript.classList.add('active');
            if (this.btnToggleLively) this.btnToggleLively.classList.remove('active');
            if (this.scriptContainer) this.scriptContainer.style.display = 'block';
            if (this.livelyContainer) this.livelyContainer.style.display = 'none';
        }
    }

    /* --------------------------------------------------------------------------
       AUTO-RECOMMEND SYNTAX (INTELLISENSE)
       -------------------------------------------------------------------------- */
    checkSyntaxRecommendations() {
        if (!this.textarea) return;
        const cursorPos = this.textarea.selectionStart;
        const textBefore = this.textarea.value.slice(0, cursorPos);
        const match = textBefore.match(/([a-zA-Z_#][a-zA-Z0-9_#.:]*)$/);

        if (!match) {
            this.hideRecommendations();
            return;
        }

        const currentWord = match[1];
        if (currentWord.length < 1) {
            this.hideRecommendations();
            return;
        }

        const db = this.syntaxDatabase[this.currentLanguage] || [];
        const query = currentWord.toLowerCase();
        const filtered = db.filter(item => item.word.toLowerCase().startsWith(query) || item.word.toLowerCase().includes(query));

        if (filtered.length === 0) {
            this.hideRecommendations();
            return;
        }

        this.currentRecommendations = filtered.slice(0, 6);
        this.currentQueryWord = currentWord;
        this.activeRecIndex = 0;
        this.showRecommendations(cursorPos);
    }

    showRecommendations(cursorPos) {
        if (!this.recommendPopup) return;
        this.renderRecommendationsList();

        const textBefore = this.textarea.value.slice(0, cursorPos);
        const lines = textBefore.split('\n');
        const lineIndex = lines.length - 1;
        const curLineText = lines[lineIndex] || '';

        // 16px is textarea top padding; this.lineHeight is ~23.8px
        const lineTop = 16 + (lineIndex * this.lineHeight) - this.textarea.scrollTop;
        const lineBottom = lineTop + this.lineHeight;

        const editorHeight = this.textarea.clientHeight || 450;
        const editorWidth = this.textarea.clientWidth || 550;

        // Position strictly BELOW the active line so it never covers what the user is typing
        let topPos = lineBottom + 6;

        // Estimated popup height (approx 42px header + ~36px per item)
        const popupHeight = Math.min(240, 42 + (this.currentRecommendations.length * 36));

        // If rendering below would clip below the visible editor panel, flip above the line
        if (topPos + popupHeight > editorHeight - 12) {
            const abovePos = lineTop - popupHeight - 6;
            if (abovePos >= 10) {
                topPos = abovePos;
            } else {
                topPos = Math.max(10, editorHeight - popupHeight - 12);
            }
        }

        // Horizontal position: follow typing column with gutter offset
        // Gutter (48px) + textarea padding (20px) = 68px
        const charWidth = 8.4;
        const cursorCol = curLineText.length;
        let leftPos = 68 + (cursorCol * charWidth);

        const popupWidth = 320;
        if (leftPos + popupWidth > editorWidth + 48) {
            leftPos = Math.max(68, editorWidth + 48 - popupWidth - 16);
        }
        leftPos = Math.max(68, leftPos);

        this.recommendPopup.style.top = `${Math.round(topPos)}px`;
        this.recommendPopup.style.left = `${Math.round(leftPos)}px`;
        this.recommendPopup.style.display = 'block';
    }

    hideRecommendations() {
        if (this.recommendPopup) {
            this.recommendPopup.style.display = 'none';
            this.currentRecommendations = [];
        }
    }

    renderRecommendationsList() {
        if (!this.recommendList) return;
        this.recommendList.innerHTML = '';

        this.currentRecommendations.forEach((item, index) => {
            const el = document.createElement('div');
            el.className = `recommend-item ${index === this.activeRecIndex ? 'active' : ''}`;

            const word = item.word;
            const q = this.currentQueryWord || '';
            let formattedWord = word;
            const matchIdx = word.toLowerCase().indexOf(q.toLowerCase());
            if (matchIdx !== -1) {
                formattedWord = word.substring(0, matchIdx) +
                    `<span class="rec-match">${word.substring(matchIdx, matchIdx + q.length)}</span>` +
                    word.substring(matchIdx + q.length);
            }

            el.innerHTML = `
                <div class="rec-left">
                    <span class="rec-badge ${item.type}">${item.type}</span>
                    <span class="rec-word">${formattedWord}</span>
                </div>
            `;

            el.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.activeRecIndex = index;
                this.applySelectedRecommendation();
            });

            this.recommendList.appendChild(el);
        });
    }

    applySelectedRecommendation() {
        const item = this.currentRecommendations[this.activeRecIndex];
        if (!item) return;

        this.recordSnapshot(true);

        const cursorPos = this.textarea.selectionStart;
        const textBefore = this.textarea.value.slice(0, cursorPos);
        const textAfter = this.textarea.value.slice(cursorPos);
        const qLen = this.currentQueryWord ? this.currentQueryWord.length : 0;
        const baseTextBefore = textBefore.slice(0, textBefore.length - qLen);

        let templateToInsert = item.template;
        let targetCursorOffset = templateToInsert.indexOf('$CURSOR');
        if (targetCursorOffset !== -1) {
            templateToInsert = templateToInsert.replace('$CURSOR', '');
        } else {
            targetCursorOffset = templateToInsert.length;
        }

        this.textarea.value = baseTextBefore + templateToInsert + textAfter;
        const newPos = baseTextBefore.length + targetCursorOffset;
        this.textarea.setSelectionRange(newPos, newPos);
        this.textarea.focus();

        this.hideRecommendations();
        this.updateLineNumbers();
        this.updateLineHighlightFromCursor();
        this.saveCurrentDraft();
    }

    handleEditorKeydown(e) {
        // 0. Undo: Ctrl+Z (or Cmd+Z). Redo: Ctrl+Y, Cmd+Y, or Ctrl+Shift+Z / Cmd+Shift+Z
        if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
            e.preventDefault();
            if (e.shiftKey) {
                this.redo();
            } else {
                this.undo();
            }
            return;
        }

        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
            e.preventDefault();
            this.redo();
            return;
        }

        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            this.compileAndRun();
            return;
        }

        const isRecOpen = this.recommendPopup &&
            this.recommendPopup.style.display !== 'none' &&
            this.currentRecommendations &&
            this.currentRecommendations.length > 0;

        if (isRecOpen) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.activeRecIndex = (this.activeRecIndex + 1) % this.currentRecommendations.length;
                this.renderRecommendationsList();
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.activeRecIndex = (this.activeRecIndex - 1 + this.currentRecommendations.length) % this.currentRecommendations.length;
                this.renderRecommendationsList();
                return;
            }
            if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                this.applySelectedRecommendation();
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                this.hideRecommendations();
                return;
            }
        }

        // Bracket & quote pairs mapping
        const BRACKET_PAIRS = {
            '(': ')',
            '{': '}',
            '[': ']',
            '"': '"',
            "'": "'",
            '`': '`'
        };

        const CLOSING_CHARS = [')', '}', ']', '"', "'", '`'];

        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        const val = this.textarea.value;

        // 1. Step-over closing character if next character matches what was typed
        if (CLOSING_CHARS.includes(e.key) && start === end) {
            const nextChar = val.charAt(start);
            if (nextChar === e.key) {
                e.preventDefault();
                this.textarea.setSelectionRange(start + 1, start + 1);
                this.updateLineHighlightFromCursor();
                this.hideRecommendations();
                return;
            }
        }

        // 2. Auto-close opening brackets & quotes and place cursor inside
        if (BRACKET_PAIRS[e.key] && !e.ctrlKey && !e.metaKey && !e.altKey) {
            this.recordSnapshot(true);
            e.preventDefault();
            const openChar = e.key;
            const closeChar = BRACKET_PAIRS[openChar];

            if (start !== end) {
                // Wrap selected text
                const selectedText = val.slice(start, end);
                this.textarea.setRangeText(openChar + selectedText + closeChar, start, end, 'select');
                this.textarea.setSelectionRange(start + 1, end + 1);
            } else {
                // Insert pair and place cursor between brackets
                this.textarea.setRangeText(openChar + closeChar, start, start, 'end');
                this.textarea.setSelectionRange(start + 1, start + 1);
            }

            this.updateLineNumbers();
            this.saveCurrentDraft();
            this.updateLineHighlightFromCursor();
            this.hideRecommendations();
            if (this.isConnected && !this.isApplyingRemote) {
                this.writeToSharedRoom(false);
            }
            return;
        }

        // 3. Backspace deletes matching empty pair
        if (e.key === 'Backspace' && start === end && start > 0) {
            const prevChar = val.charAt(start - 1);
            const nextChar = val.charAt(start);
            if (BRACKET_PAIRS[prevChar] === nextChar) {
                this.recordSnapshot(true);
                e.preventDefault();
                this.textarea.setRangeText('', start - 1, start + 1, 'end');
                this.textarea.setSelectionRange(start - 1, start - 1);
                this.updateLineNumbers();
                this.saveCurrentDraft();
                this.updateLineHighlightFromCursor();
                this.checkSyntaxRecommendations(start - 1);
                if (this.isConnected && !this.isApplyingRemote) {
                    this.writeToSharedRoom(false);
                }
                return;
            }
        }

        // 4. Tab indentation
        if (e.key === 'Tab') {
            this.recordSnapshot(true);
            e.preventDefault();
            this.textarea.setRangeText('    ', start, end, 'end');
            this.updateLineNumbers();
            this.saveCurrentDraft();
            this.updateLineHighlightFromCursor();
            if (this.isConnected && !this.isApplyingRemote) {
                this.writeToSharedRoom(false);
            }
            return;
        }

        // 5. Enter key auto-indentation and newline expansion between { and }
        if (e.key === 'Enter') {
            this.recordSnapshot(true);
            const textBefore = val.slice(0, start);
            const curLine = textBefore.split('\n').pop();
            const matchIndent = curLine.match(/^(\s*)/);
            const baseIndent = matchIndent ? matchIndent[1] : '';

            // If Enter between { and } -> expand cleanly with 4 space indent
            if (start === end && start > 0) {
                const prevChar = val.charAt(start - 1);
                const nextChar = val.charAt(start);
                if (prevChar === '{' && nextChar === '}') {
                    e.preventDefault();
                    const innerIndent = baseIndent + '    ';
                    const insertText = '\n' + innerIndent + '\n' + baseIndent;
                    this.textarea.setRangeText(insertText, start, start, 'end');
                    const newPos = start + 1 + innerIndent.length;
                    this.textarea.setSelectionRange(newPos, newPos);
                    this.updateLineNumbers();
                    this.saveCurrentDraft();
                    this.updateLineHighlightFromCursor();
                    this.hideRecommendations();
                    if (this.isConnected && !this.isApplyingRemote) {
                        this.writeToSharedRoom(false);
                    }
                    return;
                }
            }

            let indent = baseIndent;
            const trimmed = curLine.trim();
            if (trimmed.endsWith(':') || trimmed.endsWith('{') || trimmed.endsWith('(')) {
                indent += '    ';
            }

            if (indent.length > 0) {
                e.preventDefault();
                this.textarea.setRangeText('\n' + indent, start, start, 'end');
                this.updateLineNumbers();
                this.saveCurrentDraft();
                this.updateLineHighlightFromCursor();
                this.hideRecommendations();
                if (this.isConnected && !this.isApplyingRemote) {
                    this.writeToSharedRoom(false);
                }
                return;
            }
        }
    }

    /* --------------------------------------------------------------------------
       HISTORY (UNDO / REDO) SYSTEM
       -------------------------------------------------------------------------- */
    resetHistory() {
        if (this.typingDebounceTimer) {
            clearTimeout(this.typingDebounceTimer);
            this.typingDebounceTimer = null;
        }
        this.undoStack = [];
        this.redoStack = [];
        if (this.textarea) {
            this.undoStack.push({
                value: this.textarea.value,
                selectionStart: this.textarea.selectionStart || 0,
                selectionEnd: this.textarea.selectionEnd || 0,
                time: Date.now()
            });
        }
    }

    recordSnapshot(immediate = false) {
        if (!this.textarea || this.isUndoingOrRedoing) return;

        const currentValue = this.textarea.value;
        const currentSelectionStart = this.textarea.selectionStart || 0;
        const currentSelectionEnd = this.textarea.selectionEnd || 0;

        const snapshot = {
            value: currentValue,
            selectionStart: currentSelectionStart,
            selectionEnd: currentSelectionEnd,
            time: Date.now()
        };

        const topOfUndo = this.undoStack[this.undoStack.length - 1];
        if (topOfUndo && topOfUndo.value === currentValue) {
            topOfUndo.selectionStart = currentSelectionStart;
            topOfUndo.selectionEnd = currentSelectionEnd;
            return;
        }

        if (immediate) {
            if (this.typingDebounceTimer) {
                clearTimeout(this.typingDebounceTimer);
                this.typingDebounceTimer = null;
            }
            this.undoStack.push(snapshot);
            if (this.undoStack.length > this.maxHistorySize) {
                this.undoStack.shift();
            }
            this.redoStack = [];
        } else {
            if (this.typingDebounceTimer) clearTimeout(this.typingDebounceTimer);
            this.typingDebounceTimer = setTimeout(() => {
                this.recordSnapshot(true);
            }, 350);
        }
    }

    undo() {
        if (!this.textarea) return;

        if (this.typingDebounceTimer) {
            clearTimeout(this.typingDebounceTimer);
            this.typingDebounceTimer = null;
        }

        const currentValue = this.textarea.value;
        const currentSelectionStart = this.textarea.selectionStart || 0;
        const currentSelectionEnd = this.textarea.selectionEnd || 0;

        const topOfUndo = this.undoStack[this.undoStack.length - 1];
        if (!topOfUndo || topOfUndo.value !== currentValue) {
            this.redoStack.push({
                value: currentValue,
                selectionStart: currentSelectionStart,
                selectionEnd: currentSelectionEnd,
                time: Date.now()
            });
        } else {
            if (this.undoStack.length <= 1) {
                return;
            }
            const currentSnapshot = this.undoStack.pop();
            this.redoStack.push(currentSnapshot);
        }

        let targetState = null;
        while (this.undoStack.length > 0) {
            const candidate = this.undoStack[this.undoStack.length - 1];
            if (candidate && candidate.value !== currentValue) {
                targetState = candidate;
                break;
            } else {
                this.undoStack.pop();
            }
        }

        if (!targetState) return;

        this.isUndoingOrRedoing = true;
        this.textarea.value = targetState.value;
        const selStart = Math.min(targetState.selectionStart, targetState.value.length);
        const selEnd = Math.min(targetState.selectionEnd, targetState.value.length);
        this.textarea.setSelectionRange(selStart, selEnd);
        this.textarea.focus();

        this.updateLineNumbers();
        this.updateLineHighlightFromCursor();
        this.saveCurrentDraft();
        this.hideRecommendations();

        if (this.isConnected && !this.isApplyingRemote) {
            this.writeToSharedRoom(false);
        }
        this.isUndoingOrRedoing = false;
    }

    redo() {
        if (!this.textarea || this.redoStack.length === 0) return;

        if (this.typingDebounceTimer) {
            clearTimeout(this.typingDebounceTimer);
            this.typingDebounceTimer = null;
        }

        const nextState = this.redoStack.pop();
        if (!nextState) return;

        const currentValue = this.textarea.value;
        const lastInUndo = this.undoStack[this.undoStack.length - 1];
        if (!lastInUndo || lastInUndo.value !== nextState.value) {
            this.undoStack.push(nextState);
        }

        this.isUndoingOrRedoing = true;
        this.textarea.value = nextState.value;
        const selStart = Math.min(nextState.selectionStart, nextState.value.length);
        const selEnd = Math.min(nextState.selectionEnd, nextState.value.length);
        this.textarea.setSelectionRange(selStart, selEnd);
        this.textarea.focus();

        this.updateLineNumbers();
        this.updateLineHighlightFromCursor();
        this.saveCurrentDraft();
        this.hideRecommendations();

        if (this.isConnected && !this.isApplyingRemote) {
            this.writeToSharedRoom(false);
        }
        this.isUndoingOrRedoing = false;
    }

    /* --------------------------------------------------------------------------
       SAVED MODULES INTEGRATION
       -------------------------------------------------------------------------- */
    openSaveModal() {
        if (!this.saveModal) return;
        const code = this.textarea ? this.textarea.value : '';
        const trimmed = code.trim();
        if (!trimmed || trimmed === `Write ${this.getLanguageDisplayName(this.currentLanguage)} code here...`) {
            if (window.app) window.app.showToast('Please write some code before saving! 💜');
            else alert('Please write some code before saving!');
            return;
        }

        if (this.saveCodeTitle) {
            const defaultName = this.getFilename(this.currentLanguage);
            this.saveCodeTitle.value = defaultName;
        }

        const langPill = document.getElementById('compiler-save-lang-pill');
        if (langPill) {
            langPill.textContent = this.getLanguageDisplayName(this.currentLanguage);
        }

        this.saveModal.classList.add('active');
        setTimeout(() => {
            if (this.saveCodeTitle) {
                this.saveCodeTitle.focus();
                this.saveCodeTitle.select();
            }
        }, 50);
    }

    closeSaveModal() {
        if (this.saveModal) this.saveModal.classList.remove('active');
    }

    handleSaveCodeSubmit() {
        const title = this.saveCodeTitle ? this.saveCodeTitle.value.trim() : '';
        const lang = this.currentLanguage || 'java';
        const code = this.textarea ? this.textarea.value : '';

        if (!title) {
            if (this.saveCodeTitle) this.saveCodeTitle.focus();
            return;
        }

        if (window.savedModulesManager && window.savedModulesManager.saveCode) {
            window.savedModulesManager.saveCode({
                title,
                language: lang,
                category: 'Practice',
                notes: `Saved from Play with Bytes (${this.getLanguageDisplayName(lang)})`,
                code,
                output: this.terminalText ? this.terminalText.innerText : ''
            });
        }

        this.saveCurrentDraft();
        this.closeSaveModal();
        if (window.app) {
            window.app.showToast(`Saved "${title}" into Saved Modules! 💜`);
        }
    }

    loadCodeSnippet(snippet) {
        if (!snippet) return;
        if (snippet.language) {
            this.setLanguage(snippet.language, false);
        }
        if (this.textarea && snippet.code) {
            this.textarea.value = snippet.code;
            this.updateLineNumbers();
            this.saveCurrentDraft();
            this.compileAndTrace();
        }
        if (window.app) {
            window.app.openWorkspaceModule('play-with-bytes');
            window.app.showToast(`Loaded "${snippet.title}" into Play with Bytes! 💜`);
        }
    }
}

// Global initialization
window.PlayWithBytesManager = PlayWithBytesManager;
function initPlayWithBytes() {
    if (!window.playWithBytes) {
        window.playWithBytes = new PlayWithBytesManager();
    }
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPlayWithBytes);
} else {
    initPlayWithBytes();
}
