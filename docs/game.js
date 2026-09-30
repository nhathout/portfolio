// Atari [Course]out: a breakout side quest where every brick is a course.
// Keyboard, mouse and touch controls; combos, power-ups, multi-hit bricks and
// levels; retro WebAudio sound; and a shared leaderboard on the Render API
// (same contract as before: GET/POST /api/leaderboard, POST /api/leaderboard/reset).
(() => {
    const root = document.getElementById('mini-game');
    const stage = document.getElementById('gameStage');
    const canvas = document.getElementById('gameCanvas');
    const panel = document.getElementById('start-screen');
    const startBtn = document.getElementById('startBtn');
    const resetBtn = document.getElementById('resetLeaderboardBtn');
    const leaderboardEl = document.getElementById('leaderboard');
    const panelEyebrow = document.getElementById('gamePanelEyebrow');
    const panelTitle = document.getElementById('gamePanelTitle');
    const panelSummary = document.getElementById('gamePanelSummary');
    const scoreForm = document.getElementById('gameScoreForm');
    const initialsInput = document.getElementById('gameInitials');
    const formMessage = document.getElementById('gameFormMessage');
    const skipBtn = document.getElementById('gameSkip');
    const pauseBtn = document.getElementById('gamePause');
    const quitBtn = document.getElementById('gameQuit');
    const muteBtn = document.getElementById('gameMute');
    const liveRegion = document.getElementById('gameLive');

    if (!root || !stage || !canvas || !panel || !startBtn || !leaderboardEl) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ------------------------------------------------------------------
    //  Config
    // ------------------------------------------------------------------
    const SERVER_URL = 'https://portfolio-xoe6.onrender.com';
    const MAX_NAME_LENGTH = 4;
    const MUTE_KEY = 'courseout-muted';
    const INITIALS_KEY = 'courseout-initials';
    const BEST_KEY = 'courseout-best';
    const FONT = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const START_LIVES = 3;
    const MAX_LIVES = 6;
    const MAX_BALLS = 5;
    const MAX_PARTICLES = 240;

    const LAYOUTS = {
        wide: { name: 'wide', w: 680, h: 400, cols: 5, brickH: 66, top: 58, side: 18, gap: 12, paddleW: 112, paddleH: 16, titleLines: 3, paddleSpeed: 9.5 },
        tall: { name: 'tall', w: 420, h: 600, cols: 3, brickH: 60, top: 58, side: 14, gap: 10, paddleW: 104, paddleH: 16, titleLines: 2, paddleSpeed: 8 }
    };

    const COURSES = [
        { title: 'Vis, Rob & Plan', code: 'SE740', tone: '#0f766e', fill: '#dff7f1' },
        { title: 'Intro to R&AS', code: 'EK505', tone: '#0f766e', fill: '#ddf5ef' },
        { title: 'Product Design in ECE', code: 'EC601', tone: '#b45309', fill: '#fff0d9' },
        { title: 'Image/Video Computing', code: 'CS585', tone: '#2563eb', fill: '#e1efff' },
        { title: 'Smart/Embedded Systems', code: 'EC444/535', tone: '#7c3aed', fill: '#f0e8ff' },
        { title: 'Robot Learning', code: 'EC518', tone: '#0f766e', fill: '#dff7f1' },
        { title: 'M.S. Thesis', code: 'ME954', tone: '#be123c', fill: '#ffe4ea' },
        { title: 'ML', code: 'EC414', tone: '#1d4ed8', fill: '#e2ecff' },
        { title: 'DL', code: 'EC523', tone: '#0f766e', fill: '#dff7f1' },
        { title: 'RL', code: 'EC418', tone: '#b45309', fill: '#fff0d9' }
    ];
    const LEVEL_NAMES = ['Fall semester', 'Spring semester', 'Finals week', 'Thesis defense'];

    const POWERUPS = {
        wide: { glyph: 'W', label: 'WIDE PADDLE', color: '#14b8a6', ink: '#042f2e', weight: 3 },
        multi: { glyph: 'M', label: 'MULTIBALL', color: '#fac123', ink: '#422006', weight: 2.5 },
        slow: { glyph: 'S', label: 'SLOW-MO', color: '#60a5fa', ink: '#0b2447', weight: 2.5 },
        life: { glyph: 'heart', label: '+1 LIFE', color: '#fb7185', ink: '#4c0519', weight: 1.6 }
    };

    const GLYPHS = {
        W: ['X...X', 'X...X', 'X.X.X', 'XX.XX', 'X...X'],
        M: ['X...X', 'XX.XX', 'X.X.X', 'X...X', 'X...X'],
        S: ['.XXXX', 'X....', '.XXX.', '....X', 'XXXX.'],
        heart: ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...']
    };

    const THEMES = {
        light: {
            bgTop: '#f8fbfb', bgMid: '#eff8f7', bgBottom: '#dff1ed',
            grid: 'rgba(15, 118, 110, 0.08)', glow: 'rgba(250, 193, 35, 0.2)',
            hud: 'rgba(255, 255, 255, 0.84)', hudStroke: 'rgba(15, 118, 110, 0.18)',
            ink: '#0f172a', muted: '#475569',
            brickStroke: 'rgba(255, 255, 255, 0.85)', brickShadow: 'rgba(15, 23, 42, 0.16)',
            pill: 'rgba(255, 255, 255, 0.94)', pillStroke: 'rgba(15, 23, 42, 0.08)',
            paddleA: '#0f766e', paddleB: '#053b36', paddleGlow: 'rgba(5, 59, 54, 0.3)',
            ball: '#fac123', ballCore: '#fff7d6', ballGlow: 'rgba(250, 193, 35, 0.45)',
            overlay: 'rgba(15, 23, 42, 0.5)', card: 'rgba(15, 23, 42, 0.9)', cardInk: '#f8fafc', cardMuted: '#cbd5e1',
            heart: '#e11d48', heartEmpty: 'rgba(15, 23, 42, 0.14)', textOutline: 'rgba(255, 255, 255, 0.92)'
        },
        dark: {
            bgTop: '#0b1526', bgMid: '#0c1a2b', bgBottom: '#0a2226',
            grid: 'rgba(94, 234, 212, 0.06)', glow: 'rgba(56, 189, 248, 0.16)',
            hud: 'rgba(9, 17, 32, 0.84)', hudStroke: 'rgba(148, 163, 184, 0.22)',
            ink: '#e5eefb', muted: '#94a3b8',
            brickStroke: 'rgba(148, 163, 184, 0.24)', brickShadow: 'rgba(0, 0, 0, 0.45)',
            pill: 'rgba(9, 17, 32, 0.92)', pillStroke: 'rgba(148, 163, 184, 0.2)',
            paddleA: '#38bdf8', paddleB: '#0f766e', paddleGlow: 'rgba(56, 189, 248, 0.32)',
            ball: '#fac123', ballCore: '#fff7d6', ballGlow: 'rgba(250, 193, 35, 0.5)',
            overlay: 'rgba(2, 6, 23, 0.58)', card: 'rgba(12, 22, 40, 0.95)', cardInk: '#f8fafc', cardMuted: '#b5c5d8',
            heart: '#fb7185', heartEmpty: 'rgba(226, 232, 240, 0.16)', textOutline: 'rgba(2, 6, 23, 0.85)'
        }
    };

    // ------------------------------------------------------------------
    //  State
    // ------------------------------------------------------------------
    let layout = LAYOUTS.wide;
    let W = layout.w;
    let H = layout.h;
    let scale = 1;
    let themeName = currentTheme();
    let mode = 'idle'; // idle | serve | play | paused | cleared | over
    let pausedFrom = 'play';
    let bricks = [];
    let balls = [];
    let capsules = [];
    let particles = [];
    let floaters = [];
    const paddle = { x: 0, y: 0, w: 112, h: 16, baseW: 112, targetW: 112, targetX: null, squashAt: -1e9 };
    const keys = { left: false, right: false };
    let score = 0;
    let lives = START_LIVES;
    let level = 1;
    let streak = 0;
    let multiplier = 1;
    let dropPity = 0;
    let bricksCleared = 0;
    let levelBonus = 0;
    let clock = 0; // gameplay time (ms), only advances while playing
    let effects = { wideUntil: 0, slowUntil: 0 };
    let shakeUntil = 0;
    let shakeMagnitude = 0;
    let shakeDuration = 1;
    let rafId = 0;
    let lastFrame = 0;
    let lastInput = 'keys'; // keys | mouse | touch
    let pointerDown = null;
    let serveStartedAt = 0;
    let clearedAt = 0;
    let overTimer = 0;
    let bgCache = null;
    let leaderboard = [];
    let leaderboardState = 'loading'; // loading | ready | error
    let lastSaved = null;
    let overReason = 'OUT OF LIVES';
    let autopilot = false; // debug hook only

    // ------------------------------------------------------------------
    //  Small helpers
    // ------------------------------------------------------------------
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const now = () => performance.now();

    function currentTheme() {
        return document.documentElement.classList.contains('darkmode') ? 'dark' : 'light';
    }

    function palette() {
        return THEMES[themeName];
    }

    function hexToRgb(hex) {
        const value = parseInt(hex.slice(1), 16);
        return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
    }

    function mix(hexA, hexB, t) {
        const a = hexToRgb(hexA);
        const b = hexToRgb(hexB);
        return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(', ')})`;
    }

    function rgba(hex, alpha) {
        const [r, g, b] = hexToRgb(hex);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    function toneFor(course) {
        return themeName === 'dark' ? mix(course.tone, '#ffffff', 0.5) : course.tone;
    }

    function readStorage(key) {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            return null;
        }
    }

    function writeStorage(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (error) {}
    }

    function announce(message) {
        if (liveRegion) liveRegion.textContent = message;
    }

    function levelName(n) {
        return n <= LEVEL_NAMES.length ? LEVEL_NAMES[n - 1] : `Overtime ${n - LEVEL_NAMES.length}`;
    }

    function roundRectPath(g, x, y, w, h, r) {
        const radius = Math.max(0, Math.min(r, w / 2, h / 2));
        g.beginPath();
        g.moveTo(x + radius, y);
        g.arcTo(x + w, y, x + w, y + h, radius);
        g.arcTo(x + w, y + h, x, y + h, radius);
        g.arcTo(x, y + h, x, y, radius);
        g.arcTo(x, y, x + w, y, radius);
        g.closePath();
    }

    function wrapLines(g, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let line = '';
        words.forEach(word => {
            const test = line ? `${line} ${word}` : word;
            if (g.measureText(test).width > maxWidth && line) {
                lines.push(line);
                line = word;
            } else {
                line = test;
            }
        });
        if (line) lines.push(line);
        return lines;
    }

    function drawGlyph(g, rows, x, y, px, color) {
        g.fillStyle = color;
        rows.forEach((row, r) => {
            for (let c = 0; c < row.length; c += 1) {
                if (row[c] === 'X') g.fillRect(x + c * px, y + r * px, px + 0.02, px + 0.02);
            }
        });
    }

    // ------------------------------------------------------------------
    //  Sound: tiny square-wave blips, created only after a user gesture
    // ------------------------------------------------------------------
    let audio = null;
    let master = null;
    let muted = readStorage(MUTE_KEY) === '1';

    function ensureAudio() {
        if (!audio) {
            const AudioCtor = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtor) return;
            try {
                audio = new AudioCtor();
                master = audio.createGain();
                master.gain.value = 0.12;
                master.connect(audio.destination);
            } catch (error) {
                audio = null;
                return;
            }
        }
        if (audio.state === 'suspended') audio.resume().catch(() => {});
    }

    function blip(freq, duration, { type = 'square', to = null, delay = 0, volume = 0.5 } = {}) {
        if (muted || !audio || audio.state !== 'running') return;
        const start = audio.currentTime + delay;
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, start);
        if (to) osc.frequency.exponentialRampToValueAtTime(to, start + duration);
        gain.gain.setValueAtTime(volume, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        osc.connect(gain);
        gain.connect(master);
        osc.start(start);
        osc.stop(start + duration + 0.03);
    }

    const sfx = {
        launch: () => blip(620, 0.07, { type: 'triangle', to: 880 }),
        paddle: () => blip(300, 0.06, { volume: 0.4 }),
        wall: () => blip(190, 0.03, { type: 'triangle', volume: 0.18 }),
        brick: step => blip(480 * Math.pow(2, Math.min(step, 12) / 12), 0.08, { to: 720 * Math.pow(2, Math.min(step, 12) / 12), volume: 0.35 }),
        hit: () => blip(170, 0.09, { type: 'triangle', volume: 0.5 }),
        power: () => [523, 659, 784, 1046].forEach((f, i) => blip(f, 0.08, { delay: i * 0.06, volume: 0.3 })),
        lose: () => blip(320, 0.5, { type: 'sawtooth', to: 55, volume: 0.28 }),
        clear: () => [392, 523, 659, 784, 1046].forEach((f, i) => blip(f, 0.14, { delay: i * 0.09, volume: 0.3 }))
    };

    const SPEAKER_ON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4V9Zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4Zm-2.5-8.3v2.1a7 7 0 0 1 0 12.4v2.1a9 9 0 0 0 0-16.6Z"/></svg>';
    const SPEAKER_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4V9Zm12.3.3 1.4-1.4L20 10.2l2.3-2.3 1.4 1.4-2.3 2.3 2.3 2.3-1.4 1.4-2.3-2.3-2.3 2.3-1.4-1.4 2.3-2.3-2.3-2.3Z"/></svg>';

    function syncMuteButton() {
        if (!muteBtn) return;
        muteBtn.setAttribute('aria-pressed', String(muted));
        muteBtn.setAttribute('aria-label', muted ? 'Turn game sound on' : 'Turn game sound off');
        const icon = muteBtn.querySelector('.game-toolbar__icon');
        const label = muteBtn.querySelector('[data-sound-label]');
        if (icon) icon.innerHTML = muted ? SPEAKER_OFF : SPEAKER_ON;
        if (label) label.textContent = muted ? 'Sound off' : 'Sound on';
    }

    // ------------------------------------------------------------------
    //  Layout + canvas sizing
    // ------------------------------------------------------------------
    function pickLayout() {
        const width = stage.clientWidth || root.clientWidth || LAYOUTS.wide.w;
        return width < 520 ? LAYOUTS.tall : LAYOUTS.wide;
    }

    function applyLayout(next) {
        layout = next;
        W = layout.w;
        H = layout.h;
        canvas.style.aspectRatio = `${W} / ${H}`;
        stage.style.setProperty('--game-aspect', `${W} / ${H}`);
        stage.dataset.layout = layout.name;
        paddle.baseW = layout.paddleW;
        paddle.h = layout.paddleH;
        paddle.y = H - layout.paddleH - 18;
        resizeBacking();
    }

    function invalidateCaches() {
        bgCache = null;
        bricks.forEach(brick => {
            brick.sprite = null;
        });
    }

    function resizeBacking() {
        const cssWidth = canvas.getBoundingClientRect().width;
        if (!cssWidth) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
        const pixelWidth = Math.max(1, Math.round(cssWidth * dpr));
        const pixelHeight = Math.max(1, Math.round((cssWidth * dpr * H) / W));
        if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
            canvas.width = pixelWidth;
            canvas.height = pixelHeight;
        }
        scale = pixelWidth / W;
        invalidateCaches();
        if (mode !== 'idle') render();
    }

    // ------------------------------------------------------------------
    //  Level setup
    // ------------------------------------------------------------------
    function hitsFor(course, lvl) {
        if (course.code === 'ME954') {
            if (lvl === 1) return 1;
            return lvl <= 3 ? 3 : 4;
        }
        if (lvl === 1) return 1;
        if (lvl >= 4) return 2;
        const tough = lvl === 2
            ? ['EC518', 'CS585', 'EC523']
            : ['EC518', 'CS585', 'EC523', 'SE740', 'EC444/535', 'EC601'];
        return tough.includes(course.code) ? 2 : 1;
    }

    function buildBricks(lvl) {
        const { cols, side, gap, top, brickH } = layout;
        const brickW = (W - side * 2 - gap * (cols - 1)) / cols;
        return COURSES.map((course, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
            const inRow = Math.min(cols, COURSES.length - row * cols);
            const rowOffset = ((cols - inRow) * (brickW + gap)) / 2;
            const hits = hitsFor(course, lvl);
            return {
                ...course,
                x: side + rowOffset + col * (brickW + gap),
                y: top + row * (brickH + gap),
                w: brickW,
                h: brickH,
                hits,
                maxHits: hits,
                boss: course.code === 'ME954' && hits > 1,
                alive: true,
                flashAt: -1e9,
                sprite: null,
                spriteKey: ''
            };
        });
    }

    function levelSpeed() {
        return Math.min(4.8 + (level - 1) * 0.55, 8.4);
    }

    function levelMaxSpeed() {
        return Math.min(levelSpeed() * 1.45, 10.5);
    }

    function makeBall(x, y, angle, speed) {
        return {
            x,
            y,
            r: 8,
            speed,
            vx: speed * Math.sin(angle),
            vy: -speed * Math.cos(angle),
            trail: [],
            dead: false
        };
    }

    function serve() {
        mode = 'serve';
        balls = [makeBall(paddle.x + paddle.w / 2, paddle.y - 9, 0, levelSpeed())];
        serveStartedAt = now();
        syncToolbar();
    }

    function launch() {
        if (mode !== 'serve' || !balls.length) return;
        const drift = keys.left ? -0.2 : keys.right ? 0.2 : 0;
        const angle = clamp((Math.random() * 0.5 - 0.25) + drift, -0.5, 0.5);
        const ball = balls[0];
        ball.vx = ball.speed * Math.sin(angle);
        ball.vy = -ball.speed * Math.cos(angle);
        mode = 'play';
        sfx.launch();
        syncToolbar();
    }

    // ------------------------------------------------------------------
    //  Run lifecycle
    // ------------------------------------------------------------------
    function startGame() {
        clearTimeout(overTimer);
        ensureAudio();
        scoreForm.hidden = true;
        setStartProminent(true);
        panelSummary.hidden = true;
        panel.style.display = 'none';
        canvas.style.display = 'block';
        canvas.classList.add('is-running');
        applyLayout(pickLayout());

        score = 0;
        lives = START_LIVES;
        level = 1;
        streak = 0;
        multiplier = 1;
        dropPity = 0;
        bricksCleared = 0;
        clock = 0;
        effects = { wideUntil: 0, slowUntil: 0 };
        capsules = [];
        particles = [];
        floaters = [];
        keys.left = false;
        keys.right = false;
        paddle.w = paddle.baseW;
        paddle.targetW = paddle.baseW;
        paddle.x = (W - paddle.w) / 2;
        paddle.targetX = null;
        bricks = buildBricks(level);
        serve();
        announce(`${levelName(level)}. ${lastInput === 'touch' ? 'Tap' : 'Press Space'} to launch.`);
        canvas.focus({ preventScroll: true });
        lastFrame = 0;
        schedule();
    }

    function pause() {
        if (mode !== 'play' && mode !== 'serve') return;
        pausedFrom = mode;
        mode = 'paused';
        keys.left = false;
        keys.right = false;
        announce('Paused');
        syncToolbar();
        render();
        stopLoop();
    }

    function resume() {
        if (mode !== 'paused') return;
        ensureAudio();
        mode = pausedFrom;
        announce('Resumed');
        syncToolbar();
        lastFrame = 0;
        schedule();
    }

    function primaryAction() {
        if (mode === 'serve') launch();
        else if (mode === 'paused') resume();
        else if (mode === 'cleared') continueLevel();
    }

    function loseLife() {
        lives -= 1;
        streak = 0;
        multiplier = 1;
        capsules = [];
        effects = { wideUntil: 0, slowUntil: 0 };
        paddle.targetW = paddle.baseW;
        sfx.lose();
        shake(8, 380);
        if (lives <= 0) {
            gameOver('OUT OF LIVES');
            return;
        }
        announce(`Life lost. ${lives} left.`);
        serve();
    }

    function clearLevel() {
        mode = 'cleared';
        levelBonus = lives * 2 + level;
        score += levelBonus;
        capsules = [];
        balls = [];
        effects = { wideUntil: 0, slowUntil: 0 };
        paddle.targetW = paddle.baseW;
        clearedAt = now();
        sfx.clear();
        burstConfetti();
        announce(`${levelName(level)} complete. Bonus ${levelBonus}. Press Space or tap to continue.`);
        syncToolbar();
    }

    function continueLevel() {
        if (now() - clearedAt < 600) return;
        level += 1;
        effects = { wideUntil: 0, slowUntil: 0 };
        paddle.targetW = paddle.baseW;
        bricks = buildBricks(level);
        serve();
        announce(`${levelName(level)}. Faster ball, tougher courses.`);
        lastFrame = 0;
        schedule();
    }

    function gameOver(reason) {
        if (mode === 'over') return;
        mode = 'over';
        keys.left = false;
        keys.right = false;
        balls = [];
        capsules = [];
        syncToolbar();
        overReason = reason;
        announce(`Game over. Final score ${score}.`);
        render();
        clearTimeout(overTimer);
        overTimer = setTimeout(showResults, reducedMotion ? 350 : 1400);
    }

    function showResults() {
        stopLoop();
        mode = 'idle';
        canvas.classList.remove('is-running');
        canvas.style.display = 'none';
        panel.style.display = '';
        syncToolbar();

        const best = Math.max(score, Number.parseInt(readStorage(BEST_KEY), 10) || 0);
        const isBest = score > 0 && score >= best;
        writeStorage(BEST_KEY, String(best));

        panelEyebrow.textContent = isBest ? 'New personal best' : 'Run over';
        panelTitle.textContent = `Final score: ${score}`;
        panelSummary.textContent = `Reached ${levelName(level)} · ${bricksCleared} course${bricksCleared === 1 ? '' : 's'} cleared${isBest ? '' : ` · your best: ${best}`}`;
        panelSummary.hidden = false;
        startBtn.textContent = 'Play again';

        setStartProminent(score <= 0);
        if (score > 0) {
            scoreForm.hidden = false;
            formMessage.textContent = '';
            scoreForm.querySelector('button[type="submit"]').disabled = false;
            initialsInput.value = readStorage(INITIALS_KEY) || '';
            initialsInput.focus({ preventScroll: true });
        } else {
            scoreForm.hidden = true;
            startBtn.focus({ preventScroll: true });
        }
        stage.scrollIntoView({ block: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' });
    }

    // while the initials form is up, "Save score" is the primary action
    function setStartProminent(prominent) {
        startBtn.classList.toggle('game-btn-primary', prominent);
        startBtn.classList.toggle('game-btn-ghost', !prominent);
    }

    function syncToolbar() {
        const running = mode === 'serve' || mode === 'play' || mode === 'paused' || mode === 'cleared';
        if (pauseBtn) {
            pauseBtn.hidden = !running || mode === 'cleared';
            pauseBtn.textContent = mode === 'paused' ? 'Resume' : 'Pause';
            pauseBtn.setAttribute('aria-pressed', String(mode === 'paused'));
        }
        if (quitBtn) quitBtn.hidden = !running;
        canvas.classList.toggle('is-playing', mode === 'play' || mode === 'serve');
    }

    // ------------------------------------------------------------------
    //  Juice
    // ------------------------------------------------------------------
    function shake(magnitude, duration) {
        if (reducedMotion) return;
        shakeMagnitude = magnitude;
        shakeDuration = duration;
        shakeUntil = now() + duration;
    }

    function spawnParticles(brick, count, small = false) {
        const color = toneFor(brick);
        for (let i = 0; i < count && particles.length < MAX_PARTICLES; i += 1) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (small ? 1.2 : 2) + Math.random() * (small ? 1.6 : 3.2);
            particles.push({
                x: brick.x + brick.w / 2 + (Math.random() - 0.5) * brick.w * 0.7,
                y: brick.y + brick.h / 2 + (Math.random() - 0.5) * brick.h * 0.6,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1.2,
                size: small ? 2 : 2 + Math.random() * 3,
                color: Math.random() < 0.3 ? '#fac123' : color,
                born: now(),
                life: 520 + Math.random() * 380
            });
        }
    }

    function burstConfetti() {
        const colors = ['#fac123', '#14b8a6', '#60a5fa', '#fb7185', '#a78bfa'];
        const count = reducedMotion ? 16 : 70;
        for (let i = 0; i < count && particles.length < MAX_PARTICLES; i += 1) {
            particles.push({
                x: W / 2 + (Math.random() - 0.5) * 80,
                y: H * 0.42,
                vx: (Math.random() - 0.5) * 9,
                vy: -3 - Math.random() * 5,
                size: 3 + Math.random() * 3,
                color: colors[i % colors.length],
                born: now(),
                life: 1200 + Math.random() * 600
            });
        }
    }

    function floatText(x, y, text, color, big = false) {
        floaters.push({ x, y, text, color, big, born: now(), life: big ? 1200 : 950 });
        if (floaters.length > 14) floaters.shift();
    }

    // ------------------------------------------------------------------
    //  Simulation
    // ------------------------------------------------------------------
    function update(dtf) {
        if (effects.wideUntil && clock >= effects.wideUntil) {
            effects.wideUntil = 0;
            paddle.targetW = paddle.baseW;
        }
        if (effects.slowUntil && clock >= effects.slowUntil) effects.slowUntil = 0;

        const timeScale = effects.slowUntil ? 0.58 : 1;
        for (const ball of balls) {
            stepBall(ball, dtf * timeScale);
            if (mode !== 'play') return; // level cleared mid-step
        }
        balls = balls.filter(ball => !ball.dead);
        if (!balls.length) {
            loseLife();
            return;
        }
        updateCapsules(dtf);
    }

    function keepAngleSane(ball) {
        // avoid near-horizontal loops that never come back down
        const minVy = ball.speed * 0.3;
        if (Math.abs(ball.vy) < minVy) {
            ball.vy = (ball.vy < 0 ? -1 : 1) * minVy;
            ball.vx = (ball.vx < 0 ? -1 : 1) * Math.sqrt(Math.max(0, ball.speed * ball.speed - minVy * minVy));
        }
    }

    function stepBall(ball, dtf) {
        const travel = ball.speed * dtf;
        const steps = Math.max(1, Math.ceil(travel / (ball.r * 0.6)));
        const f = dtf / steps;
        for (let i = 0; i < steps; i += 1) {
            ball.x += ball.vx * f;
            ball.y += ball.vy * f;

            if (ball.x < ball.r) {
                ball.x = ball.r;
                ball.vx = Math.abs(ball.vx);
                sfx.wall();
            } else if (ball.x > W - ball.r) {
                ball.x = W - ball.r;
                ball.vx = -Math.abs(ball.vx);
                sfx.wall();
            }
            if (ball.y < ball.r) {
                ball.y = ball.r;
                ball.vy = Math.abs(ball.vy);
                sfx.wall();
            }

            if (
                ball.vy > 0 &&
                ball.y + ball.r >= paddle.y &&
                ball.y - ball.r <= paddle.y + paddle.h &&
                ball.x >= paddle.x - ball.r * 0.6 &&
                ball.x <= paddle.x + paddle.w + ball.r * 0.6
            ) {
                bounceOffPaddle(ball);
            }

            if (hitBricks(ball) && mode !== 'play') return;

            if (ball.y - ball.r > H) {
                ball.dead = true;
                break;
            }
        }
        if (!reducedMotion) {
            ball.trail.push({ x: ball.x, y: ball.y });
            if (ball.trail.length > 7) ball.trail.shift();
        }
    }

    function bounceOffPaddle(ball) {
        const offset = clamp((ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2), -1, 1);
        const angle = offset * (Math.PI * 0.36);
        ball.speed = Math.min(ball.speed * 1.025, levelMaxSpeed());
        ball.vx = ball.speed * Math.sin(angle);
        ball.vy = -ball.speed * Math.cos(angle);
        ball.y = paddle.y - ball.r - 0.5;
        streak = 0;
        multiplier = 1;
        paddle.squashAt = now();
        sfx.paddle();
    }

    function hitBricks(ball) {
        for (const brick of bricks) {
            if (!brick.alive) continue;
            const closestX = clamp(ball.x, brick.x, brick.x + brick.w);
            const closestY = clamp(ball.y, brick.y, brick.y + brick.h);
            const dx = ball.x - closestX;
            const dy = ball.y - closestY;
            if (dx * dx + dy * dy > ball.r * ball.r) continue;

            const overlapLeft = ball.x + ball.r - brick.x;
            const overlapRight = brick.x + brick.w - (ball.x - ball.r);
            const overlapTop = ball.y + ball.r - brick.y;
            const overlapBottom = brick.y + brick.h - (ball.y - ball.r);
            const minX = Math.min(overlapLeft, overlapRight);
            const minY = Math.min(overlapTop, overlapBottom);
            if (minX < minY) {
                if (overlapLeft < overlapRight) {
                    ball.x -= overlapLeft;
                    ball.vx = -Math.abs(ball.vx);
                } else {
                    ball.x += overlapRight;
                    ball.vx = Math.abs(ball.vx);
                }
            } else if (overlapTop < overlapBottom) {
                ball.y -= overlapTop;
                ball.vy = -Math.abs(ball.vy);
            } else {
                ball.y += overlapBottom;
                ball.vy = Math.abs(ball.vy);
            }
            keepAngleSane(ball);
            damageBrick(brick);
            return true;
        }
        return false;
    }

    function damageBrick(brick) {
        brick.hits -= 1;
        brick.flashAt = now();
        brick.sprite = null;
        if (brick.hits > 0) {
            sfx.hit();
            spawnParticles(brick, reducedMotion ? 2 : 6, true);
            shake(brick.boss ? 4 : 2.5, 140);
            if (brick.boss) floatText(brick.x + brick.w / 2, brick.y + brick.h / 2, `${brick.hits} HIT${brick.hits === 1 ? '' : 'S'} LEFT`, toneFor(brick));
            return;
        }

        brick.alive = false;
        bricksCleared += 1;
        streak += 1;
        multiplier = Math.min(4, 1 + Math.floor((streak - 1) / 2));
        const points = (brick.boss ? 3 : 1) * multiplier;
        score += points;
        sfx.brick(streak);
        spawnParticles(brick, reducedMotion ? 5 : brick.boss ? 30 : 16);
        shake(brick.boss ? 7 : 3, brick.boss ? 280 : 150);
        floatText(brick.x + brick.w / 2, brick.y + brick.h / 2, `+${points} ${brick.code} ✓`, toneFor(brick));
        maybeDropCapsule(brick);

        if (!bricks.some(entry => entry.alive)) clearLevel();
    }

    function maybeDropCapsule(brick) {
        const chance = 0.2 + dropPity * 0.09;
        if (Math.random() > chance) {
            dropPity += 1;
            return;
        }
        dropPity = 0;
        const pool = Object.entries(POWERUPS).filter(([type]) =>
            (type !== 'life' || lives < MAX_LIVES) && (type !== 'multi' || balls.length < MAX_BALLS));
        if (!pool.length) return;
        const total = pool.reduce((sum, [, def]) => sum + def.weight, 0);
        let pick = Math.random() * total;
        let type = pool[0][0];
        for (const [key, def] of pool) {
            pick -= def.weight;
            if (pick <= 0) {
                type = key;
                break;
            }
        }
        capsules.push({ type, x: brick.x + brick.w / 2, y: brick.y + brick.h / 2, w: 36, h: 16, vy: 2.1, born: now() });
    }

    function updateCapsules(dtf) {
        for (const capsule of capsules) {
            capsule.y += capsule.vy * dtf;
            const caught = capsule.y + capsule.h / 2 >= paddle.y &&
                capsule.y - capsule.h / 2 <= paddle.y + paddle.h &&
                capsule.x + capsule.w / 2 >= paddle.x &&
                capsule.x - capsule.w / 2 <= paddle.x + paddle.w;
            if (caught) {
                applyPowerup(capsule.type);
                capsule.done = true;
            } else if (capsule.y - capsule.h / 2 > H) {
                capsule.done = true;
            }
        }
        capsules = capsules.filter(capsule => !capsule.done);
    }

    function applyPowerup(type) {
        const def = POWERUPS[type];
        sfx.power();
        floatText(paddle.x + paddle.w / 2, paddle.y - 16, def.label, def.color, true);
        announce(`Power-up: ${def.label.toLowerCase()}`);
        if (type === 'wide') {
            effects.wideUntil = clock + 10000;
            paddle.targetW = paddle.baseW * 1.55;
        } else if (type === 'slow') {
            effects.slowUntil = clock + 8000;
        } else if (type === 'life') {
            lives = Math.min(MAX_LIVES, lives + 1);
        } else if (type === 'multi') {
            const source = balls.find(ball => !ball.dead);
            if (!source) return;
            const heading = Math.atan2(source.vx, -source.vy);
            [-0.42, 0.42].forEach(turn => {
                if (balls.length >= MAX_BALLS) return;
                balls.push(makeBall(source.x, source.y, heading + turn, source.speed));
            });
        }
    }

    function updatePaddle(dtf) {
        if (Math.abs(paddle.targetW - paddle.w) > 0.3) {
            const centre = paddle.x + paddle.w / 2;
            paddle.w += (paddle.targetW - paddle.w) * Math.min(1, 0.18 * dtf);
            paddle.x = centre - paddle.w / 2;
        }
        if (autopilot && balls.length) {
            const lowest = balls.reduce((a, b) => (b.y > a.y ? b : a));
            paddle.targetX = lowest.x - paddle.w / 2;
        }
        if (keys.left || keys.right) {
            paddle.targetX = null;
            paddle.x += ((keys.right ? 1 : 0) - (keys.left ? 1 : 0)) * layout.paddleSpeed * dtf;
        } else if (paddle.targetX !== null) {
            const target = clamp(paddle.targetX, 0, W - paddle.w);
            paddle.x += (target - paddle.x) * Math.min(1, 0.55 * dtf);
        }
        paddle.x = clamp(paddle.x, 0, W - paddle.w);
        if (mode === 'serve' && balls[0]) {
            balls[0].x = paddle.x + paddle.w / 2;
            balls[0].y = paddle.y - balls[0].r - 1;
            balls[0].trail.length = 0;
        }
    }

    function updateParticles(dtf) {
        const t = now();
        particles = particles.filter(p => t - p.born < p.life);
        particles.forEach(p => {
            p.vy += 0.14 * dtf;
            p.vx *= Math.pow(0.985, dtf);
            p.x += p.vx * dtf;
            p.y += p.vy * dtf;
        });
        floaters = floaters.filter(f => t - f.born < f.life);
    }

    // ------------------------------------------------------------------
    //  Rendering
    // ------------------------------------------------------------------
    function background() {
        const key = `${themeName}|${canvas.width}x${canvas.height}|${layout.name}`;
        if (bgCache?.key === key) return bgCache.canvas;
        const p = palette();
        const cache = document.createElement('canvas');
        cache.width = canvas.width;
        cache.height = canvas.height;
        const g = cache.getContext('2d');
        g.setTransform(scale, 0, 0, scale, 0, 0);

        const gradient = g.createLinearGradient(0, 0, 0, H);
        gradient.addColorStop(0, p.bgTop);
        gradient.addColorStop(0.58, p.bgMid);
        gradient.addColorStop(1, p.bgBottom);
        g.fillStyle = gradient;
        g.fillRect(0, 0, W, H);

        const glow = g.createRadialGradient(W * 0.82, 48, 0, W * 0.82, 48, 200);
        glow.addColorStop(0, p.glow);
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        g.fillStyle = glow;
        g.fillRect(0, 0, W, H);

        g.strokeStyle = p.grid;
        g.lineWidth = 1;
        g.beginPath();
        for (let x = 18; x < W; x += 28) {
            g.moveTo(x, 0);
            g.lineTo(x, H);
        }
        for (let y = 18; y < H; y += 28) {
            g.moveTo(0, y);
            g.lineTo(W, y);
        }
        g.stroke();

        roundRectPath(g, 10, 10, W - 20, 36, 18);
        g.fillStyle = p.hud;
        g.fill();
        g.strokeStyle = p.hudStroke;
        g.stroke();

        bgCache = { key, canvas: cache };
        return cache;
    }

    function brickSprite(brick) {
        const key = `${themeName}|${scale.toFixed(3)}|${brick.hits}`;
        if (brick.sprite && brick.spriteKey === key) return brick.sprite;
        const pad = 20;
        const sprite = document.createElement('canvas');
        sprite.width = Math.ceil((brick.w + pad * 2) * scale);
        sprite.height = Math.ceil((brick.h + pad * 2) * scale);
        const g = sprite.getContext('2d');
        g.setTransform(scale, 0, 0, scale, pad * scale, pad * scale);
        drawBrickBody(g, brick);
        brick.sprite = sprite;
        brick.spriteKey = key;
        brick.spritePad = pad;
        return sprite;
    }

    function drawBrickBody(g, brick) {
        const p = palette();
        const dark = themeName === 'dark';
        const tone = toneFor(brick);
        const { w, h } = brick;

        g.save();
        g.shadowColor = p.brickShadow;
        g.shadowBlur = 12;
        g.shadowOffsetY = 6;
        roundRectPath(g, 0, 0, w, h, 12);
        if (dark) {
            g.fillStyle = '#15233a';
            g.fill();
            g.shadowColor = 'transparent';
            const wash = g.createLinearGradient(0, 0, 0, h);
            wash.addColorStop(0, rgba(brick.tone, 0.1));
            wash.addColorStop(1, rgba(brick.tone, 0.38));
            g.fillStyle = wash;
            g.fill();
        } else {
            const fill = g.createLinearGradient(0, 0, 0, h);
            fill.addColorStop(0, 'rgba(255, 255, 255, 0.96)');
            fill.addColorStop(1, brick.fill);
            g.fillStyle = fill;
            g.fill();
        }
        g.restore();

        g.lineWidth = brick.boss ? 2 : 1;
        g.strokeStyle = brick.boss ? rgba(brick.tone, 0.7) : p.brickStroke;
        roundRectPath(g, 0, 0, w, h, 12);
        g.stroke();

        // accent bar
        g.fillStyle = tone;
        roundRectPath(g, 9, 7, w - 18, 6, 3);
        g.fill();

        // course code pill
        g.font = `700 10px ${FONT}`;
        const codeWidth = Math.max(54, g.measureText(brick.code).width + 18);
        roundRectPath(g, (w - codeWidth) / 2, 17, codeWidth, 16, 8);
        g.fillStyle = p.pill;
        g.fill();
        g.strokeStyle = p.pillStroke;
        g.lineWidth = 1;
        g.stroke();
        g.fillStyle = tone;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(brick.code, w / 2, 25.5);

        // title
        g.font = `700 10.5px ${FONT}`;
        const lines = wrapLines(g, brick.title, w - 18).slice(0, layout.titleLines);
        const lineHeight = 11.5;
        const areaTop = 37;
        const areaHeight = h - areaTop - (brick.maxHits > 1 ? 10 : 4);
        const startY = areaTop + (areaHeight - lines.length * lineHeight) / 2 + lineHeight / 2;
        g.fillStyle = tone;
        lines.forEach((line, i) => g.fillText(line, w / 2, startY + i * lineHeight));

        // multi-hit bricks: pips + cracks
        if (brick.maxHits > 1) {
            const pip = 5;
            const gap = 3;
            const total = brick.maxHits * pip + (brick.maxHits - 1) * gap;
            for (let i = 0; i < brick.maxHits; i += 1) {
                g.fillStyle = i < brick.hits ? tone : rgba(brick.tone, dark ? 0.35 : 0.22);
                g.fillRect(w - 9 - total + i * (pip + gap), h - 9, pip, pip);
            }
            const damage = brick.maxHits - brick.hits;
            if (damage > 0) {
                g.strokeStyle = dark ? 'rgba(2, 6, 23, 0.55)' : 'rgba(15, 23, 42, 0.35)';
                g.lineWidth = 1.2;
                g.beginPath();
                g.moveTo(w * 0.18, 3);
                g.lineTo(w * 0.26, h * 0.35);
                g.lineTo(w * 0.2, h * 0.55);
                g.lineTo(w * 0.3, h - 3);
                if (damage > 1) {
                    g.moveTo(w * 0.84, 3);
                    g.lineTo(w * 0.76, h * 0.42);
                    g.lineTo(w * 0.82, h * 0.62);
                    g.lineTo(w * 0.72, h - 12);
                }
                if (damage > 2) {
                    g.moveTo(w * 0.5, h - 3);
                    g.lineTo(w * 0.56, h * 0.7);
                    g.lineTo(w * 0.48, h * 0.55);
                }
                g.stroke();
            }
        }

        if (brick.boss) {
            g.font = `800 8px ${FONT}`;
            const tagWidth = g.measureText('BOSS').width + 10;
            roundRectPath(g, 6, h - 14, tagWidth, 11, 5.5);
            g.fillStyle = brick.tone;
            g.fill();
            g.fillStyle = '#ffffff';
            g.textAlign = 'center';
            g.fillText('BOSS', 6 + tagWidth / 2, h - 8.2);
        }
    }

    function drawBricks(t) {
        for (const brick of bricks) {
            if (!brick.alive) continue;
            const sprite = brickSprite(brick);
            const pad = brick.spritePad;
            ctx.drawImage(sprite, brick.x - pad, brick.y - pad, brick.w + pad * 2, brick.h + pad * 2);

            if (brick.boss && !reducedMotion) {
                const pulse = 0.35 + 0.35 * Math.sin(t / 260);
                ctx.save();
                ctx.strokeStyle = rgba(brick.tone, pulse);
                ctx.lineWidth = 2;
                roundRectPath(ctx, brick.x - 3, brick.y - 3, brick.w + 6, brick.h + 6, 14);
                ctx.stroke();
                ctx.restore();
            }
            const since = t - brick.flashAt;
            if (since < 140) {
                ctx.save();
                ctx.globalAlpha = 0.7 * (1 - since / 140);
                ctx.fillStyle = '#ffffff';
                roundRectPath(ctx, brick.x, brick.y, brick.w, brick.h, 12);
                ctx.fill();
                ctx.restore();
            }
        }
    }

    function drawPaddle(p, t) {
        const squash = reducedMotion ? 0 : Math.max(0, 1 - (t - paddle.squashAt) / 160);
        const height = paddle.h * (1 - squash * 0.25);
        const y = paddle.y + (paddle.h - height);
        const gradient = ctx.createLinearGradient(0, y, 0, y + height);
        gradient.addColorStop(0, p.paddleA);
        gradient.addColorStop(1, p.paddleB);
        ctx.save();
        ctx.shadowColor = effects.wideUntil ? 'rgba(20, 184, 166, 0.55)' : p.paddleGlow;
        ctx.shadowBlur = effects.wideUntil ? 20 : 14;
        ctx.shadowOffsetY = 5;
        roundRectPath(ctx, paddle.x, y, paddle.w, height, height / 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        roundRectPath(ctx, paddle.x + 12, y + 3.5, Math.max(0, paddle.w - 24), 3.5, 1.75);
        ctx.fill();
    }

    function drawBalls(p) {
        const slow = Boolean(effects.slowUntil);
        for (const ball of balls) {
            ball.trail.forEach((point, i) => {
                const k = (i + 1) / (ball.trail.length + 1);
                ctx.globalAlpha = 0.28 * k;
                ctx.fillStyle = slow ? '#60a5fa' : p.ball;
                ctx.beginPath();
                ctx.arc(point.x, point.y, ball.r * (0.45 + 0.5 * k), 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1;
            ctx.save();
            ctx.shadowColor = slow ? 'rgba(96, 165, 250, 0.6)' : p.ballGlow;
            ctx.shadowBlur = 16;
            ctx.fillStyle = slow ? '#93c5fd' : p.ball;
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            ctx.fillStyle = p.ballCore;
            ctx.beginPath();
            ctx.arc(ball.x - 2, ball.y - 2, ball.r * 0.45, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawCapsule(x, y, w, h, type, t) {
        const def = POWERUPS[type];
        const bob = reducedMotion ? 0 : Math.sin(t / 140) * 0.6;
        ctx.save();
        ctx.shadowColor = rgba(def.color, 0.55);
        ctx.shadowBlur = 10;
        roundRectPath(ctx, x - w / 2, y - h / 2 + bob, w, h, h / 2);
        ctx.fillStyle = def.color;
        ctx.fill();
        ctx.restore();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1;
        roundRectPath(ctx, x - w / 2, y - h / 2 + bob, w, h, h / 2);
        ctx.stroke();
        const rows = GLYPHS[def.glyph];
        const px = type === 'life' ? 1.4 : 1.6;
        const gw = rows[0].length * px;
        const gh = rows.length * px;
        drawGlyph(ctx, rows, x - gw / 2, y - gh / 2 + bob, px, def.ink);
    }

    function drawParticles(t) {
        particles.forEach(p => {
            const k = 1 - (t - p.born) / p.life;
            ctx.globalAlpha = Math.max(0, k);
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        });
        ctx.globalAlpha = 1;
    }

    function drawFloaters(p, t) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineJoin = 'round';
        floaters.forEach(f => {
            const k = (t - f.born) / f.life;
            ctx.globalAlpha = k < 0.7 ? 1 : Math.max(0, 1 - (k - 0.7) / 0.3);
            ctx.font = `800 ${f.big ? 13 : 11}px ${FONT}`;
            const y = f.y - k * (f.big ? 34 : 26);
            ctx.lineWidth = 3;
            ctx.strokeStyle = p.textOutline;
            ctx.strokeText(f.text, f.x, y);
            ctx.fillStyle = f.color;
            ctx.fillText(f.text, f.x, y);
        });
        ctx.restore();
    }

    function hudBadge(text, x, y, { align = 'left', fill, stroke, color, height = 22 } = {}) {
        const p = palette();
        ctx.save();
        ctx.font = `700 10.5px ${FONT}`;
        const width = ctx.measureText(text).width + 20;
        let left = x;
        if (align === 'right') left = x - width;
        else if (align === 'center') left = x - width / 2;
        roundRectPath(ctx, left, y, width, height, height / 2);
        ctx.fillStyle = fill || p.pill;
        ctx.fill();
        ctx.strokeStyle = stroke || p.pillStroke;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = color || p.ink;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, left + 10, y + height / 2 + 0.5);
        ctx.restore();
        return width;
    }

    function drawHud(p) {
        const tall = layout.name === 'tall';
        hudBadge(`SCORE ${score}`, 17, 17);

        if (multiplier > 1) {
            hudBadge(`x${multiplier} COMBO`, W / 2, 17, { align: 'center', fill: '#fac123', stroke: 'rgba(180, 83, 9, 0.35)', color: '#422006' });
        } else {
            const label = tall ? `LV ${level}` : levelName(level).toUpperCase();
            hudBadge(label, W / 2, 17, { align: 'center', fill: themeName === 'dark' ? 'rgba(56, 189, 248, 0.16)' : 'rgba(5, 59, 54, 0.92)', stroke: 'rgba(255, 255, 255, 0.14)', color: themeName === 'dark' ? '#dff8ff' : '#f8fafc' });
        }

        // lives as pixel hearts, right-aligned
        const px = 2;
        const heartW = 7 * px;
        const spacing = heartW + 4;
        const shown = Math.max(lives, START_LIVES);
        let x = W - 18 - shown * spacing + 4;
        for (let i = 0; i < shown; i += 1) {
            drawGlyph(ctx, GLYPHS.heart, x + i * spacing, 22, px, i < lives ? p.heart : p.heartEmpty);
        }

        // active timed power-ups, left of the hearts
        let slotX = x - 12;
        [['slow', effects.slowUntil, 8000], ['wide', effects.wideUntil, 10000]].forEach(([type, until, total]) => {
            if (!until) return;
            const remaining = clamp((until - clock) / total, 0, 1);
            const w = 26;
            const cx = slotX - w / 2;
            drawCapsule(cx, 25, w, 12, type, 0);
            ctx.fillStyle = POWERUPS[type].color;
            ctx.fillRect(cx - w / 2, 34, w * remaining, 2.5);
            slotX -= w + 8;
        });
    }

    function drawBanner(p, t) {
        const since = t - serveStartedAt;
        const visible = since < 1900;
        const k = visible ? Math.min(1, since / 250) * Math.min(1, (1900 - since) / 450) : 0;
        if (k > 0) {
            ctx.save();
            ctx.globalAlpha = k;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = `900 ${layout.name === 'tall' ? 22 : 26}px ${FONT}`;
            ctx.lineWidth = 5;
            ctx.lineJoin = 'round';
            ctx.strokeStyle = p.textOutline;
            const y = layout.name === 'tall' ? H * 0.62 : H * 0.6;
            ctx.strokeText(levelName(level).toUpperCase(), W / 2, y);
            ctx.fillStyle = p.ink;
            ctx.fillText(levelName(level).toUpperCase(), W / 2, y);
            if (level > 1) {
                ctx.font = `700 11px ${FONT}`;
                ctx.lineWidth = 3;
                ctx.strokeText('faster ball · tougher courses', W / 2, y + 22);
                ctx.fillStyle = p.muted;
                ctx.fillText('faster ball · tougher courses', W / 2, y + 22);
            }
            ctx.restore();
        }
        const hint = lastInput === 'touch' ? 'TAP TO LAUNCH' : 'SPACE OR CLICK TO LAUNCH';
        const blink = reducedMotion ? 1 : 0.65 + 0.35 * Math.sin(t / 220);
        ctx.save();
        ctx.globalAlpha = blink;
        hudBadge(hint, W / 2, paddle.y - 50, { align: 'center', fill: 'rgba(5, 59, 54, 0.9)', stroke: 'rgba(255, 255, 255, 0.2)', color: '#f8fafc' });
        ctx.restore();
    }

    function drawCard(p, title, lines, accent = '#fac123') {
        ctx.save();
        ctx.fillStyle = p.overlay;
        ctx.fillRect(0, 0, W, H);
        const cardW = Math.min(W - 40, 360);
        const cardH = 64 + lines.length * 20;
        const x = (W - cardW) / 2;
        const y = (H - cardH) / 2;
        roundRectPath(ctx, x, y, cardW, cardH, 18);
        ctx.fillStyle = p.card;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = accent;
        ctx.fillRect(x + cardW / 2 - 24, y + 14, 48, 3);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = p.cardInk;
        ctx.font = `900 20px ${FONT}`;
        ctx.fillText(title, W / 2, y + 36);
        ctx.font = `600 11px ${FONT}`;
        ctx.fillStyle = p.cardMuted;
        lines.forEach((line, i) => ctx.fillText(line, W / 2, y + 60 + i * 20));
        ctx.restore();
    }

    function render() {
        const theme = currentTheme();
        if (theme !== themeName) {
            themeName = theme;
            invalidateCaches();
        }
        if (!canvas.width || !canvas.height) return;
        const p = palette();
        const t = now();

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(background(), 0, 0);

        let offsetX = 0;
        let offsetY = 0;
        if (t < shakeUntil && mode !== 'paused') {
            const k = (shakeUntil - t) / shakeDuration;
            offsetX = (Math.random() * 2 - 1) * shakeMagnitude * k;
            offsetY = (Math.random() * 2 - 1) * shakeMagnitude * k;
        }
        ctx.setTransform(scale, 0, 0, scale, offsetX * scale, offsetY * scale);
        drawBricks(t);
        capsules.forEach(capsule => drawCapsule(capsule.x, capsule.y, capsule.w, capsule.h, capsule.type, t));
        drawParticles(t);
        drawPaddle(p, t);
        drawBalls(p);
        drawFloaters(p, t);

        ctx.setTransform(scale, 0, 0, scale, 0, 0);
        drawHud(p);

        if (mode === 'serve') {
            drawBanner(p, t);
        } else if (mode === 'paused') {
            drawCard(p, 'PAUSED', [lastInput === 'touch' ? 'TAP TO RESUME' : 'SPACE, CLICK, OR P TO RESUME', `SCORE ${score} · ${levelName(level).toUpperCase()}`]);
        } else if (mode === 'cleared') {
            const ready = t - clearedAt > 600;
            drawCard(p, 'SEMESTER COMPLETE', [
                `${levelName(level).toUpperCase()} CLEARED · +${levelBonus} BONUS`,
                `NEXT UP: ${levelName(level + 1).toUpperCase()}`,
                ready ? (lastInput === 'touch' ? 'TAP TO CONTINUE' : 'SPACE, CLICK, OR TAP TO CONTINUE') : ' '
            ], '#14b8a6');
        } else if (mode === 'over') {
            drawCard(p, overReason, [`FINAL SCORE ${score}`, `REACHED ${levelName(level).toUpperCase()}`], '#fb7185');
        }
    }

    // ------------------------------------------------------------------
    //  Main loop
    // ------------------------------------------------------------------
    function frame(timestamp) {
        rafId = 0;
        if (!lastFrame) lastFrame = timestamp;
        const dtMs = Math.min(40, Math.max(0, timestamp - lastFrame));
        lastFrame = timestamp;
        const dtf = dtMs / (1000 / 60);

        if ((mode === 'play' || mode === 'serve') && document.querySelector('dialog[open]')) {
            pause();
            return;
        }

        if (mode === 'play') {
            clock += dtMs;
            updatePaddle(dtf);
            update(dtf);
        } else if (mode === 'serve') {
            updatePaddle(dtf);
        }
        updateParticles(dtf);
        render();

        // the level-clear card goes static once the confetti has settled
        const keepGoing = mode === 'play' || mode === 'serve' || mode === 'over' ||
            (mode === 'cleared' && (particles.length > 0 || now() - clearedAt < 700));
        if (keepGoing) schedule();
    }

    function schedule() {
        if (!rafId) rafId = requestAnimationFrame(frame);
    }

    function stopLoop() {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = 0;
        lastFrame = 0;
    }

    // ------------------------------------------------------------------
    //  Input
    // ------------------------------------------------------------------
    function isRunning() {
        return canvas.style.display !== 'none' && (mode === 'serve' || mode === 'play' || mode === 'paused' || mode === 'cleared');
    }

    function isOnScreen() {
        const rect = canvas.getBoundingClientRect();
        return rect.bottom > 0 && rect.top < window.innerHeight && rect.width > 0;
    }

    function trackPointer(event) {
        if (mode !== 'serve' && mode !== 'play') return;
        const rect = canvas.getBoundingClientRect();
        if (!rect.width) return;
        const gameX = (event.clientX - rect.left) * (W / rect.width);
        paddle.targetX = gameX - paddle.w / 2;
        keys.left = false;
        keys.right = false;
    }

    canvas.addEventListener('pointerdown', event => {
        if (!isRunning()) return;
        ensureAudio();
        if (event.pointerType === 'mouse') {
            lastInput = 'mouse';
            if (event.button !== 0) return;
            trackPointer(event);
            primaryAction();
            return;
        }
        lastInput = 'touch';
        pointerDown = { id: event.pointerId, x: event.clientX, y: event.clientY, t: now(), moved: 0 };
        try {
            canvas.setPointerCapture(event.pointerId);
        } catch (error) {}
        trackPointer(event);
        event.preventDefault();
    });

    canvas.addEventListener('pointermove', event => {
        if (!isRunning()) return;
        if (event.pointerType === 'mouse') {
            lastInput = 'mouse';
            trackPointer(event);
            return;
        }
        if (pointerDown && event.pointerId === pointerDown.id) {
            pointerDown.moved = Math.max(pointerDown.moved, Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y));
            trackPointer(event);
        }
    });

    const endTouch = event => {
        if (!pointerDown || event.pointerId !== pointerDown.id) return;
        const tap = event.type === 'pointerup' && pointerDown.moved < 12 && now() - pointerDown.t < 400;
        pointerDown = null;
        if (tap) primaryAction();
    };
    canvas.addEventListener('pointerup', endTouch);
    canvas.addEventListener('pointercancel', endTouch);

    document.addEventListener('keydown', event => {
        if (!isRunning() || !isOnScreen()) return;
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        if (event.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
        if (document.querySelector('dialog[open]')) return;

        switch (event.key) {
            case 'ArrowLeft':
            case 'Left':
                keys.left = true;
                lastInput = 'keys';
                event.preventDefault();
                break;
            case 'ArrowRight':
            case 'Right':
                keys.right = true;
                lastInput = 'keys';
                event.preventDefault();
                break;
            case ' ':
            case 'Spacebar':
                // a focused button handles its own Space press
                if (event.target.closest?.('button, a')) return;
                event.preventDefault();
                if (!event.repeat) {
                    if (lastInput === 'touch') lastInput = 'keys';
                    ensureAudio();
                    primaryAction();
                }
                break;
            case 'Escape':
                if (mode === 'play' || mode === 'serve') pause();
                break;
            case 'p':
            case 'P':
                if (event.repeat) break;
                event.preventDefault();
                if (mode === 'paused') resume();
                else pause();
                break;
            default:
                break;
        }
    });

    document.addEventListener('keyup', event => {
        if (event.key === 'ArrowLeft' || event.key === 'Left') keys.left = false;
        if (event.key === 'ArrowRight' || event.key === 'Right') keys.right = false;
    });

    window.addEventListener('blur', () => {
        keys.left = false;
        keys.right = false;
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden && mode === 'play') pause();
    });

    if ('IntersectionObserver' in window) {
        new IntersectionObserver(entries => {
            if (!entries[0].isIntersecting && mode === 'play') pause();
        }, { threshold: 0.35 }).observe(canvas);
    }

    if ('ResizeObserver' in window) {
        new ResizeObserver(() => {
            if (mode === 'idle') {
                const next = pickLayout();
                if (next !== layout) applyLayout(next);
            } else {
                resizeBacking();
            }
        }).observe(stage);
    } else {
        window.addEventListener('resize', () => (mode === 'idle' ? applyLayout(pickLayout()) : resizeBacking()));
    }

    // theme flips while paused/idle still need a redraw
    new MutationObserver(() => {
        if (mode !== 'idle' && !rafId) render();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    // ------------------------------------------------------------------
    //  Leaderboard (same server contract as before)
    // ------------------------------------------------------------------
    function sanitizeName(value) {
        return String(value ?? '')
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .slice(0, MAX_NAME_LENGTH);
    }

    function normalizeEntries(entries) {
        if (!Array.isArray(entries)) return [];
        return entries
            .map(entry => ({
                initials: sanitizeName(entry?.initials),
                score: Number.parseInt(entry?.score, 10) || 0
            }))
            .filter(entry => entry.initials)
            .sort((a, b) => b.score - a.score || a.initials.localeCompare(b.initials));
    }

    async function fetchJSON(url, options = {}, timeout = 20000) {
        const controller = typeof AbortController === 'function' ? new AbortController() : null;
        const timer = controller ? setTimeout(() => controller.abort(), timeout) : 0;
        try {
            const response = await fetch(url, controller ? { ...options, signal: controller.signal } : options);
            const data = await response.json().catch(() => ({}));
            return { ok: response.ok, status: response.status, data };
        } finally {
            clearTimeout(timer);
        }
    }

    async function loadLeaderboard() {
        if (!leaderboard.length) {
            leaderboardState = 'loading';
            renderLeaderboard();
        }
        try {
            const { ok, data } = await fetchJSON(`${SERVER_URL}/api/leaderboard`);
            if (!ok) throw new Error('bad status');
            leaderboard = normalizeEntries(data);
            leaderboardState = 'ready';
        } catch (error) {
            leaderboardState = leaderboard.length ? 'ready' : 'error';
        }
        renderLeaderboard();
    }

    function renderLeaderboard() {
        leaderboardEl.innerHTML = '';
        if (leaderboardState === 'loading') {
            const note = document.createElement('p');
            note.className = 'game-leaderboard-empty';
            note.textContent = 'Loading scores… the leaderboard server can take a few seconds to wake up.';
            leaderboardEl.appendChild(note);
            return;
        }
        if (leaderboardState === 'error') {
            const note = document.createElement('p');
            note.className = 'game-leaderboard-empty';
            note.textContent = 'The leaderboard is offline right now. You can still play.';
            leaderboardEl.appendChild(note);
            return;
        }
        if (!leaderboard.length) {
            const note = document.createElement('p');
            note.className = 'game-leaderboard-empty';
            note.textContent = 'No scores yet. Clear the courses and take the top spot.';
            leaderboardEl.appendChild(note);
            return;
        }

        const list = document.createElement('ol');
        list.className = 'game-leaderboard';
        let highlighted = false;
        leaderboard.forEach((entry, index) => {
            const item = document.createElement('li');
            item.className = 'game-leaderboard__item';
            if (index < 3) item.classList.add(`is-top${index + 1}`);
            if (!highlighted && lastSaved && entry.initials === lastSaved.initials && entry.score === lastSaved.score) {
                item.classList.add('is-you');
                item.setAttribute('aria-current', 'true');
                highlighted = true;
            }
            const rank = document.createElement('span');
            rank.className = 'game-leaderboard__rank';
            rank.textContent = `#${index + 1}`;
            const name = document.createElement('span');
            name.className = 'game-leaderboard__name';
            name.textContent = entry.initials;
            const points = document.createElement('strong');
            points.textContent = String(entry.score);
            item.append(rank, name, points);
            list.appendChild(item);
        });
        leaderboardEl.appendChild(list);
        leaderboardEl.querySelector('.is-you')?.scrollIntoView({ block: 'nearest' });
    }

    async function saveScore(initials, value) {
        try {
            const { ok, data } = await fetchJSON(`${SERVER_URL}/api/leaderboard`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ initials, score: value })
            });
            if (!ok) return false;
            if (Array.isArray(data?.leaderboard)) {
                leaderboard = normalizeEntries(data.leaderboard);
                leaderboardState = 'ready';
            }
            return true;
        } catch (error) {
            return false;
        }
    }

    async function resetLeaderboard() {
        const passkey = window.prompt('if you know, you know:');
        if (!passkey) return;
        try {
            const { data } = await fetchJSON(`${SERVER_URL}/api/leaderboard/reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passkey })
            });
            if (data?.error) {
                window.alert(data.error);
                return;
            }
            leaderboard = [];
            leaderboardState = 'ready';
            lastSaved = null;
            renderLeaderboard();
            window.alert('reset the leaderboard');
        } catch (error) {
            window.alert("Couldn't reach the leaderboard server.");
        }
    }

    scoreForm?.addEventListener('submit', async event => {
        event.preventDefault();
        const initials = sanitizeName(initialsInput.value);
        initialsInput.value = initials;
        if (!initials) {
            formMessage.textContent = 'Use 1–4 letters or numbers.';
            initialsInput.focus();
            return;
        }
        const submit = scoreForm.querySelector('button[type="submit"]');
        submit.disabled = true;
        formMessage.textContent = 'Saving…';
        const saved = await saveScore(initials, score);
        submit.disabled = false;
        if (!saved) {
            formMessage.textContent = "Couldn't reach the leaderboard server. Try again in a moment.";
            return;
        }
        writeStorage(INITIALS_KEY, initials);
        lastSaved = { initials, score };
        scoreForm.hidden = true;
        setStartProminent(true);
        const rank = leaderboard.findIndex(entry => entry.initials === initials && entry.score === score);
        panelSummary.textContent = rank >= 0
            ? `Saved! ${initials} is #${rank + 1} on the board.`
            : `Saved! Nice run, ${initials}.`;
        renderLeaderboard();
        startBtn.focus({ preventScroll: true });
    });

    initialsInput?.addEventListener('input', () => {
        const clean = sanitizeName(initialsInput.value);
        if (clean !== initialsInput.value) initialsInput.value = clean;
        if (formMessage.textContent && clean) formMessage.textContent = '';
    });

    skipBtn?.addEventListener('click', () => {
        scoreForm.hidden = true;
        setStartProminent(true);
        startBtn.focus({ preventScroll: true });
    });

    // ------------------------------------------------------------------
    //  Wiring
    // ------------------------------------------------------------------
    startBtn.addEventListener('click', startGame);
    resetBtn?.addEventListener('click', resetLeaderboard);
    pauseBtn?.addEventListener('click', () => {
        if (mode === 'paused') resume();
        else pause();
        if (mode === 'play' || mode === 'serve') canvas.focus({ preventScroll: true });
    });
    quitBtn?.addEventListener('click', () => {
        if (isRunning()) gameOver('RUN ENDED');
    });
    muteBtn?.addEventListener('click', () => {
        muted = !muted;
        writeStorage(MUTE_KEY, muted ? '1' : '0');
        syncMuteButton();
        if (!muted) {
            ensureAudio();
            blip(660, 0.06, { type: 'triangle', volume: 0.3 });
        }
    });

    // test hook for automated checks: only with ?courseout-debug in the URL
    if (new URLSearchParams(window.location.search).has('courseout-debug')) {
        window.__courseout = {
            state: () => ({
                mode, score, lives, level, streak, multiplier,
                balls: balls.length,
                bricksAlive: bricks.filter(b => b.alive).length,
                boss: bricks.find(b => b.boss)?.hits ?? null,
                capsules: capsules.length,
                paddleW: Math.round(paddle.w),
                baseW: paddle.baseW,
                layout: layout.name,
                effects: { ...effects },
                canvas: { w: canvas.width, h: canvas.height }
            }),
            aimAt(index) {
                const brick = bricks.filter(b => b.alive)[index];
                const ball = balls[0];
                if (!brick || !ball) return false;
                ball.x = brick.x + brick.w / 2;
                ball.y = brick.y + brick.h + ball.r + 6;
                ball.vx = 0;
                ball.vy = -ball.speed;
                return true;
            },
            drop(type) {
                capsules.push({ type, x: paddle.x + paddle.w / 2, y: paddle.y - 40, w: 36, h: 16, vy: 2.1, born: now() });
            },
            clearAllBut(keep) {
                bricks.filter(b => b.alive).slice(keep).forEach(b => {
                    b.alive = false;
                });
            },
            autopilot(on) {
                autopilot = Boolean(on);
            },
            kill() {
                balls.forEach(ball => {
                    ball.y = H + 40;
                    ball.vy = Math.abs(ball.vy) || 5;
                });
            }
        };
    }

    syncMuteButton();
    syncToolbar();
    applyLayout(pickLayout());
    renderLeaderboard();
    if (document.readyState === 'complete') {
        loadLeaderboard();
    } else {
        window.addEventListener('load', loadLeaderboard, { once: true });
    }
})();
