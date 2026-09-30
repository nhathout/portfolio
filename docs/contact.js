// Contact section pixel art: pixel icons for the contact links, and a Boston
// skyline along the Charles whose sky follows the real time in Boston. A tiny
// pixel Noah waves from the riverbank, and a paper plane takes off whenever a
// visitor reaches out (clicks a link, copies the email, or sends a note).
(() => {
    const kit = window.PixelKit;
    const section = document.getElementById('contact');
    if (!kit || !section) return;
    const { paint, canvasFor, redraw, animate, reducedMotion } = kit;

    // ------------------------------------------------------------------
    //  Link icons (16x16)
    // ------------------------------------------------------------------
    const ICONS = {
        linkedin: [
            '.IIIIIIIIIIIIII.',
            'IIIIIIIIIIIIIIII',
            'IIwwIIIIIIIIIIII',
            'IIwwIIIIIIIIIIII',
            'IIIIIIIIIIIIIIII',
            'IIwwIIwwIwwwIIII',
            'IIwwIIwwwwwwwIII',
            'IIwwIIwwwIIwwwII',
            'IIwwIIwwIIIIwwII',
            'IIwwIIwwIIIIwwII',
            'IIwwIIwwIIIIwwII',
            'IIwwIIwwIIIIwwII',
            'IIwwIIwwIIIIwwII',
            'IIIIIIIIIIIIIIII',
            'IIIIIIIIIIIIIIII',
            '.IIIIIIIIIIIIII.'
        ],
        github: [
            '.....kkkkkk.....',
            '...kkkkkkkkkk...',
            '..kkwkkkkkkwkk..',
            '.kkkwwkkkkwwkkk.',
            '.kkkwwwwwwwwkkk.',
            'kkkwwwwwwwwwwkkk',
            'kkkwwkwwwwkwwkkk',
            'kkkwwwwwwwwwwkkk',
            'kkkwwwwwwwwwwkkk',
            'kkkkwwwwwwwwkkkk',
            '.kkkkkwwwwkkkkk.',
            '.kwwkkwwwwkkkkk.',
            '..kkwwwwwwkkkk..',
            '...kkkwwwwkkk...',
            '.....kwwwwk.....',
            '......kkkk......'
        ],
        email: [
            '................',
            '................',
            '................',
            '.kkkkkkkkkkkkkk.',
            '.kLwwwwwwwwwwLk.',
            '.kwLwwwwwwwwLwk.',
            '.kwwLwwwwwwLwwk.',
            '.kwwwLwwwwLwwwk.',
            '.kwwwwLwwLwwwwk.',
            '.kwwwwwLLwwwwwk.',
            '.kwwwwwwwwwwwwk.',
            '.kwwwwwwwwwwwwk.',
            '.kwwwwwwwwwwwwk.',
            '.kkkkkkkkkkkkkk.',
            '................',
            '................'
        ],
        email_open: [
            '.......kk.......',
            '.....kkwwkk.....',
            '...kkwwwwwwkk...',
            '.kkwwkkkkkkwwkk.',
            '.kLwkwwwwwwkwLk.',
            '.kwLkwRRwRRkLwk.',
            '.kwwkwRRRRRkwwk.',
            '.kwwkwwRRRwkwwk.',
            '.kwwLwwwRwwLwwk.',
            '.kwwwLwwwwLwwwk.',
            '.kwwwwLwwLwwwwk.',
            '.kwwwwwLLwwwwwk.',
            '.kwwwwwwwwwwwwk.',
            '.kkkkkkkkkkkkkk.',
            '................',
            '................'
        ],
        instagram: [
            '.VVVVVVVVVVVVVV.',
            'VVVVVVVVVVVVVVVV',
            'VVwwwwwwwwwwwwVV',
            'VVwVVVVVVVVVVwVV',
            'XXwXXXXXXXXwXwXX',
            'XXwXXXwwwwXXXwXX',
            'XXwXXwXXXXwXXwXX',
            'XXwXXwXXXXwXXwXX',
            'YYwYYwYYYYwYYwYY',
            'YYwYYwYYYYwYYwYY',
            'YYwYYYwwwwYYYwYY',
            'YYwYYYYYYYYYYwYY',
            'ZZwZZZZZZZZZZwZZ',
            'ZZwwwwwwwwwwwwZZ',
            'ZZZZZZZZZZZZZZZZ',
            '.ZZZZZZZZZZZZZZ.'
        ],
        phone: [
            '................',
            '..kkk......kkk..',
            '.kRRRk....kRRRk.',
            '.kRRRRkkkkRRRRk.',
            '.kkRRRRRRRRRRkk.',
            '..kkkkRRRRkkkk..',
            '.....kRRRRk.....',
            '....kRRkkRRk....',
            '...kRRkwwkRRk...',
            '...kRkwkkwkRk...',
            '...kRkwkkwkRk...',
            '...kRRkwwkRRk...',
            '..kRRRRkkRRRRk..',
            '..kRRRRRRRRRRk..',
            '..kkkkkkkkkkkk..',
            '................'
        ]
    };
    const ICON_COLORS = {
        I: '#0a66c2',
        V: '#833ab4',
        X: '#c13584',
        Y: '#e1306c',
        Z: '#f77737'
    };

    function shift(rows, dx) {
        return rows.map(row => (dx > 0 ? '.'.repeat(dx) + row.slice(0, -dx) : row.slice(-dx) + '.'.repeat(-dx)));
    }

    const ICON_FRAMES = {
        email: n => (n % 6 < 4 ? ICONS.email_open : ICONS.email),
        phone: n => {
            const beat = n % 6;
            return beat === 0 ? shift(ICONS.phone, -1) : beat === 1 ? shift(ICONS.phone, 1) : beat === 2 ? shift(ICONS.phone, -1) : ICONS.phone;
        },
        instagram: n => (n % 5 === 0 ? ICONS.instagram.map(row => row.replace(/[VXYZ]/g, ch => (ch === 'V' ? 'w' : ch))) : ICONS.instagram),
        github: n => (n % 8 === 3 ? ICONS.github.map((row, y) => (y === 6 ? row.replace('wwkwwwwkww', 'wwwwwwwwww') : row)) : ICONS.github),
        linkedin: n => (n % 4 < 2 ? ICONS.linkedin : ICONS.linkedin.map(row => row.replace(/I/g, 'b')))
    };

    function iconCanvas(name) {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        canvas.className = 'contact-pixel-icon';
        canvas.setAttribute('aria-hidden', 'true');
        const ctx = canvas.getContext('2d');
        const draw = rows => paint(ctx, rows, 0, 0, ICON_COLORS);
        draw(ICONS[name]);
        const frames = ICON_FRAMES[name];
        const anim = frames ? animate(canvas, n => frames(n)) : null;
        if (anim) {
            // animate() paints with the base palette only; wrap it so brand colors survive
            anim.step = n => redraw(canvas, c => paint(c, frames(n), 0, 0, ICON_COLORS));
            const baseStop = anim.stop;
            anim.stop = () => {
                baseStop();
                redraw(canvas, c => paint(c, ICONS[name], 0, 0, ICON_COLORS));
            };
        }
        return { canvas, anim };
    }

    function initIcons() {
        section.querySelectorAll('.contact-link').forEach(link => {
            const name = ['linkedin', 'github', 'email', 'instagram', 'phone'].find(key => link.classList.contains(`contact-link--${key}`));
            const img = link.querySelector('img');
            if (!name || !img) return;
            const { canvas, anim } = iconCanvas(name);
            img.replaceWith(canvas);
            if (!anim) return;
            link.addEventListener('pointerenter', () => anim.start());
            link.addEventListener('pointerleave', () => anim.stop());
            link.addEventListener('focus', () => anim.start());
            link.addEventListener('blur', () => anim.stop());
        });
    }

    // ------------------------------------------------------------------
    //  Boston skyline
    // ------------------------------------------------------------------
    const PHASES = {
        dawn: {
            label: 'sunrise',
            sky: ['#29366f', '#5d275d', '#b13e53', '#ef7d57', '#ffcd75'],
            far: '#5d4a78', near: '#3b3553', trim: '#6b5a8a', off: '#4a4366', water: ['#5b4a7a', '#b86f7c'], window: 0.18, stars: false, glow: '#ffcd75'
        },
        day: {
            label: 'daytime',
            sky: ['#3b8ee6', '#41a6f6', '#5cc3f8', '#73eff7', '#b9f6fb'],
            far: '#94b0c2', near: '#566c86', trim: '#b7c8d6', off: '#7d95ab', water: ['#3b7fc4', '#6fb6e8'], window: 0, stars: false, glow: null
        },
        dusk: {
            label: 'sunset',
            sky: ['#29366f', '#3b5dc9', '#5d275d', '#b13e53', '#ef7d57'],
            far: '#4a3a6a', near: '#2b2440', trim: '#5a4a7a', off: '#3a3252', water: ['#3a2f5a', '#8a4a6a'], window: 0.45, stars: false, glow: '#ef7d57'
        },
        night: {
            label: 'night',
            sky: ['#0d0f1c', '#141729', '#1a1c2c', '#222744', '#29366f'],
            far: '#262b44', near: '#1a1c2c', trim: '#333c57', off: null, water: ['#141a33', '#1f2a4f'], window: 0.62, stars: true, glow: '#ffcd75'
        }
    };
    const PHASE_ORDER = ['dawn', 'day', 'dusk', 'night'];

    function bostonHour() {
        try {
            const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
            const h = Number(parts.find(p => p.type === 'hour').value);
            const m = Number(parts.find(p => p.type === 'minute').value);
            return h + m / 60;
        } catch (error) {
            return new Date().getHours();
        }
    }

    function phaseForHour(hour) {
        if (hour >= 5.5 && hour < 7.5) return 'dawn';
        if (hour >= 7.5 && hour < 17.5) return 'day';
        if (hour >= 17.5 && hour < 20) return 'dusk';
        return 'night';
    }

    // deterministic pseudo-random so the skyline is the same every visit
    function rng(seed) {
        let s = seed >>> 0;
        return () => {
            s = (s * 1664525 + 1013904223) >>> 0;
            return s / 4294967296;
        };
    }

    const NOAH = {
        idle: [
            '..kkk..',
            '.kkkkk.',
            'kkkkkkk',
            'kkmmmkk',
            'kkkmkkk',
            '.mmmmm.',
            '.kkkkk.',
            '..kkk..',
            '.nnnnn.',
            'mnnnnnm',
            '.nnnnn.',
            '.DD.DD.',
            '.DD.DD.',
            '.kk.kk.'
        ],
        wave: [
            '..kkk.m',
            '.kkkkkm',
            'kkkkkkn',
            'kkmmmkn',
            'kkkmkkn',
            '.mmmmmn',
            '.kkkkkn',
            '..kkk.n',
            '.nnnnnn',
            'mnnnnn.',
            '.nnnnn.',
            '.DD.DD.',
            '.DD.DD.',
            '.kk.kk.'
        ],
        wave2: [
            '..kkk..m',
            '.kkkkk.m',
            'kkkkkkkn',
            'kkmmmkkn',
            'kkkmkkn.',
            '.mmmmmn.',
            '.kkkkkn.',
            '..kkk.n.',
            '.nnnnnn.',
            'mnnnnn..',
            '.nnnnn..',
            '.DD.DD..',
            '.DD.DD..',
            '.kk.kk..'
        ]
    };
    const BOAT = [
        '...w....',
        '...ww...',
        '...wwk..',
        '...wwwk.',
        '...wwww.',
        '...k....',
        'RRRRRRRR',
        '.RRRRRR.'
    ];
    const PLANE = [
        'w.......',
        'wwww....',
        '.wwwwww.',
        '.wLLwwww',
        '..LL....'
    ];

    function initSkyline() {
        const host = section.querySelector('[data-skyline]');
        if (!host) return;
        const canvas = host.querySelector('canvas');
        const label = host.querySelector('[data-skyline-label]');
        const cycleBtn = host.querySelector('[data-skyline-cycle]');
        const noahBtn = host.querySelector('[data-skyline-noah]');
        const bubble = host.querySelector('[data-skyline-bubble]');
        const ctx = canvas.getContext('2d');

        const H = 84;
        const WATER_TOP = 52;
        const BANK_Y = 72; // top of the Cambridge-side walkway in the foreground
        let W = 320;
        let scale = 4;
        let phaseKey = phaseForHour(bostonHour());
        let manualPhase = false;
        let staticLayer = null; // sky + skyline, redrawn when size/phase changes
        let windows = [];       // [{x, y, lit, flicker}]
        let stars = [];
        let boats = [];
        let noah = { x: 40, waveUntil: 0 };
        let planes = [];
        let frame = 0;
        let running = false;
        let visible = false;
        let lastTick = 0;

        function landmarks() {
            // positions scale with the width so the skyline reads well at any size
            return {
                citgo: Math.round(W * 0.2),
                pru: Math.round(W * 0.48),
                hancock: Math.round(W * 0.6),
                bridge: Math.round(W * 0.84)
            };
        }

        function buildStatic() {
            const phase = PHASES[phaseKey];
            staticLayer = document.createElement('canvas');
            staticLayer.width = W;
            staticLayer.height = H;
            const g = staticLayer.getContext('2d');
            const rand = rng(1947);
            windows = [];

            // sky: dithered bands (the classic 16-color look)
            const bands = phase.sky;
            const bandH = WATER_TOP / bands.length;
            for (let y = 0; y < WATER_TOP; y += 1) {
                const t = y / bandH;
                const i = Math.min(bands.length - 1, Math.floor(t));
                const frac = t - i;
                for (let x = 0; x < W; x += 1) {
                    const next = Math.min(bands.length - 1, i + 1);
                    // 2x2 ordered dither toward the next band near the band edge
                    const threshold = [0.2, 0.6, 0.8, 0.4][(x & 1) + ((y & 1) << 1)];
                    g.fillStyle = frac > 0.55 && frac - 0.55 > threshold * 0.45 ? bands[next] : bands[i];
                    g.fillRect(x, y, 1, 1);
                }
            }

            // sun / moon
            if (phaseKey === 'night') {
                g.fillStyle = '#f4f4f4';
                g.fillRect(W - 34, 7, 5, 5);
                g.fillRect(W - 35, 8, 7, 3);
                g.fillStyle = bands[1];
                g.fillRect(W - 32, 6, 4, 5);
            } else if (phase.glow) {
                const sx = phaseKey === 'dawn' ? Math.round(W * 0.34) : Math.round(W * 0.74);
                const sy = 26;
                g.fillStyle = phase.glow;
                g.globalAlpha = 0.35;
                g.fillRect(sx - 7, sy - 3, 15, 13);
                g.globalAlpha = 1;
                g.fillRect(sx - 3, sy, 7, 7);
                g.fillRect(sx - 4, sy + 1, 9, 5);
                g.fillStyle = '#fff6d8';
                g.fillRect(sx - 1, sy + 2, 3, 3);
            } else {
                g.fillStyle = '#ffcd75';
                g.fillRect(W - 40, 8, 6, 6);
                g.fillRect(W - 41, 9, 8, 4);
                g.fillStyle = '#fff6d8';
                g.fillRect(W - 39, 9, 3, 3);
            }

            // clouds (day / dawn)
            if (phaseKey === 'day' || phaseKey === 'dawn') {
                const cloud = phaseKey === 'day' ? '#f4f4f4' : '#f2c9a0';
                [[0.12, 10], [0.4, 6], [0.78, 14]].forEach(([fx, cy]) => {
                    const cx = Math.round(W * fx);
                    g.fillStyle = cloud;
                    g.fillRect(cx, cy, 14, 2);
                    g.fillRect(cx + 3, cy - 2, 7, 2);
                    g.fillRect(cx - 2, cy + 1, 18, 2);
                });
            }

            // far skyline silhouette
            g.fillStyle = phase.far;
            let x = 0;
            while (x < W) {
                const w = 4 + Math.floor(rand() * 7);
                const h = 5 + Math.floor(rand() * 9);
                g.fillRect(x, WATER_TOP - h - 4, w, h + 4);
                x += w;
            }

            const lm = landmarks();
            const near = phase.near;
            const trim = phase.trim;
            const addWindows = (bx, by, bw, bh, stepX = 2, stepY = 3) => {
                for (let yy = by + 2; yy < by + bh - 1; yy += stepY) {
                    for (let xx = bx + 1; xx < bx + bw - 1; xx += stepX) {
                        const lit = rand() < phase.window;
                        windows.push({ x: xx, y: yy, lit, flicker: rand() < 0.08 });
                        if (!lit && phase.off) {
                            g.fillStyle = phase.off;
                            g.fillRect(xx, yy, 1, 1);
                        }
                    }
                }
            };
            const building = (bx, bw, bh, color = near) => {
                g.fillStyle = color;
                g.fillRect(bx, WATER_TOP - bh, bw, bh);
                g.fillStyle = trim;
                g.fillRect(bx, WATER_TOP - bh, bw, 1);
                addWindows(bx, WATER_TOP - bh, bw, bh);
            };

            // Back Bay rowhouses + mid-rises along the river
            x = 0;
            while (x < W) {
                const isNearLandmark = Object.values(lm).some(pos => Math.abs(pos - x) < 12);
                const w = 5 + Math.floor(rand() * 6);
                const h = isNearLandmark ? 4 + Math.floor(rand() * 3) : 6 + Math.floor(rand() * 9);
                building(x, w, h);
                x += w + (rand() < 0.2 ? 1 : 0);
            }

            // Prudential Tower: square shaft, crown, antenna
            const pru = lm.pru;
            building(pru, 9, 34);
            g.fillStyle = trim;
            g.fillRect(pru + 1, WATER_TOP - 36, 7, 2);
            g.fillStyle = near;
            g.fillRect(pru + 4, WATER_TOP - 44, 1, 8);
            g.fillStyle = phaseKey === 'night' || phaseKey === 'dusk' ? '#e0433f' : trim;
            g.fillRect(pru + 4, WATER_TOP - 45, 1, 1);

            // 200 Clarendon (Hancock): slim glass slab that mirrors the sky
            const han = lm.hancock;
            for (let yy = WATER_TOP - 40; yy < WATER_TOP; yy += 1) {
                const band = Math.min(bands.length - 1, Math.floor(((yy - (WATER_TOP - 40)) / 40) * bands.length));
                g.fillStyle = bands[band];
                g.fillRect(han, yy, 7, 1);
            }
            g.fillStyle = phaseKey === 'day' ? '#e8f7ff' : trim;
            g.fillRect(han + 1, WATER_TOP - 40, 1, 40);
            g.fillStyle = near;
            g.fillRect(han + 3, WATER_TOP - 41, 1, 1);
            g.fillStyle = phaseKey === 'day' ? '#3b5dc9' : near;
            g.fillRect(han + 6, WATER_TOP - 40, 1, 40);

            // Citgo sign on its Kenmore Square building (glows after dark)
            const cit = lm.citgo;
            building(cit - 2, 14, 12);
            const lit = phaseKey !== 'day';
            g.fillStyle = '#1a1c2c';
            g.fillRect(cit - 1, WATER_TOP - 24, 12, 11);
            g.fillStyle = lit ? '#29366f' : '#3b5dc9';
            g.fillRect(cit, WATER_TOP - 23, 10, 9);
            g.fillStyle = lit ? '#ff4d4d' : '#e0433f';
            for (let r = 0; r < 6; r += 1) g.fillRect(cit + 5 - Math.floor(r / 1.3), WATER_TOP - 22 + r, 1 + Math.floor(r * 1.4), 1);
            g.fillStyle = lit ? '#f4f4f4' : '#94b0c2';
            g.fillRect(cit + 1, WATER_TOP - 15, 8, 1);
            g.fillStyle = near;
            g.fillRect(cit + 1, WATER_TOP - 13, 1, 1);
            g.fillRect(cit + 8, WATER_TOP - 13, 1, 1);

            // Longfellow Bridge: arches + the "salt and pepper" towers
            const br = lm.bridge;
            g.fillStyle = trim;
            g.fillRect(br - 26, WATER_TOP - 2, 52, 2);
            g.fillStyle = near;
            for (let a = -24; a < 26; a += 8) g.fillRect(br + a, WATER_TOP, 2, 3);
            [[br - 6, 0], [br + 4, 1]].forEach(([tx]) => {
                g.fillStyle = trim;
                g.fillRect(tx, WATER_TOP - 9, 3, 7);
                g.fillRect(tx - 1, WATER_TOP - 10, 5, 1);
                g.fillStyle = near;
                g.fillRect(tx + 1, WATER_TOP - 12, 1, 2);
            });

            // Esplanade trees along the Boston bank
            const leaf = phaseKey === 'night' ? '#1f3b36' : phaseKey === 'day' ? '#38b764' : '#2f4f45';
            const leafDark = phaseKey === 'night' ? '#15282a' : phaseKey === 'day' ? '#257179' : '#223a36';
            for (let tx = 3; tx < W; tx += 9 + Math.floor(rand() * 7)) {
                if (Object.values(lm).some(pos => tx > pos - 6 && tx < pos + 16)) continue;
                g.fillStyle = leafDark;
                g.fillRect(tx, WATER_TOP - 5, 5, 4);
                g.fillStyle = leaf;
                g.fillRect(tx + 1, WATER_TOP - 6, 3, 3);
            }
            // riverbank wall
            g.fillStyle = trim;
            g.fillRect(0, WATER_TOP - 1, W, 1);

            // stars
            stars = [];
            if (phase.stars) {
                for (let i = 0; i < Math.round(W / 9); i += 1) {
                    stars.push({ x: Math.floor(rand() * W), y: Math.floor(rand() * 26), phase: Math.floor(rand() * 6) });
                }
            }
        }

        function resetBoats() {
            boats = [
                { x: W * 0.16, y: WATER_TOP + 4, speed: 0.05 },
                { x: W * 0.62, y: WATER_TOP + 10, speed: 0.035 },
                { x: W * 0.9, y: WATER_TOP + 7, speed: 0.028 }
            ];
        }

        function layout() {
            const width = host.clientWidth || 800;
            scale = width < 520 ? 3 : 4;
            W = Math.max(120, Math.ceil(width / scale));
            canvas.width = W;
            canvas.height = H;
            noah.x = Math.round(W * (width < 520 ? 0.14 : 0.1));
            buildStatic();
            resetBoats();
            draw();
        }

        function drawWater(phase) {
            const [deep, light] = phase.water;
            ctx.fillStyle = deep;
            ctx.fillRect(0, WATER_TOP, W, BANK_Y - WATER_TOP);
            // reflection: the skyline mirrored and broken into shimmering strips
            for (let y = WATER_TOP; y < BANK_Y; y += 1) {
                const srcY = WATER_TOP - 1 - (y - WATER_TOP) * 2;
                if (srcY < 0) break;
                const wobble = reducedMotion ? 0 : Math.round(Math.sin((y + frame * 0.35) * 0.9) * 1.2);
                ctx.globalAlpha = 0.42 - (y - WATER_TOP) * 0.025;
                ctx.drawImage(staticLayer, 0, srcY, W, 1, wobble, y, W, 1);
                ctx.globalAlpha = 1;
            }
            // glints
            ctx.fillStyle = light;
            for (let i = 0; i < W; i += 11) {
                const gx = (i * 7 + frame * (reducedMotion ? 0 : 0.6)) % W;
                const gy = WATER_TOP + 2 + ((i * 13) % (BANK_Y - WATER_TOP - 3));
                if ((i + frame) % 23 < 16) ctx.fillRect(Math.round(gx), gy, 3, 1);
            }
        }

        function drawBank() {
            const night = phaseKey === 'night';
            ctx.fillStyle = night ? '#1f2a1f' : phaseKey === 'day' ? '#38b764' : '#2f4a3a';
            ctx.fillRect(0, BANK_Y, W, 2);
            ctx.fillStyle = night ? '#333c57' : phaseKey === 'day' ? '#94b0c2' : '#566c86';
            ctx.fillRect(0, BANK_Y + 2, W, H - BANK_Y - 2);
            ctx.fillStyle = night ? '#262b44' : '#566c86';
            for (let x = 0; x < W; x += 6) ctx.fillRect(x, BANK_Y + 5, 3, 1);
            // lampposts along the Cambridge path (in the foreground, below the waterline)
            for (let x = 30; x < W; x += 64) {
                ctx.fillStyle = '#1a1c2c';
                ctx.fillRect(x, BANK_Y + 3, 1, H - BANK_Y - 3);
                ctx.fillRect(x - 1, BANK_Y + 2, 3, 1);
                if (phaseKey !== 'day') {
                    ctx.fillStyle = '#ffcd75';
                    ctx.fillRect(x - 1, BANK_Y + 3, 3, 1);
                    ctx.globalAlpha = 0.22;
                    ctx.fillRect(x - 4, BANK_Y + 4, 9, 3);
                    ctx.globalAlpha = 1;
                }
            }
        }

        function draw() {
            if (!staticLayer) return;
            const phase = PHASES[phaseKey];
            ctx.clearRect(0, 0, W, H);
            ctx.drawImage(staticLayer, 0, 0);

            // twinkling stars and lit windows
            stars.forEach(star => {
                if ((frame + star.phase) % 9 === 0) return;
                ctx.fillStyle = (frame + star.phase) % 5 === 0 ? '#94b0c2' : '#f4f4f4';
                ctx.fillRect(star.x, star.y, 1, 1);
            });
            ctx.fillStyle = '#ffcd75';
            windows.forEach(win => {
                if (!win.lit) return;
                if (win.flicker && (frame + win.x) % 17 < 3) return;
                ctx.fillRect(win.x, win.y, 1, 1);
            });

            drawWater(phase);

            boats.forEach(boat => {
                paint(ctx, BOAT, Math.round(boat.x), Math.round(boat.y), phaseKey === 'night' ? { w: '#94b0c2', R: '#b13e53' } : null);
            });

            drawBank();

            // pixel Noah on the riverbank
            const waving = performance.now() < noah.waveUntil;
            const sprite = waving ? (frame % 4 < 2 ? NOAH.wave : NOAH.wave2) : NOAH.idle;
            paint(ctx, sprite, noah.x, BANK_Y - 12, phaseKey === 'night' ? { n: '#29366f' } : null);

            // paper planes
            planes.forEach(plane => paint(ctx, PLANE, Math.round(plane.x), Math.round(plane.y)));
        }

        function step() {
            frame += 1;
            boats.forEach(boat => {
                boat.x += boat.speed * 3;
                if (boat.x > W + 10) boat.x = -10;
            });
            planes = planes.filter(plane => {
                plane.t += 1;
                plane.x += 2.2;
                plane.y = plane.y0 - plane.t * 0.9 + Math.sin(plane.t / 4) * 1.5;
                return plane.x < W + 12 && plane.y > -8;
            });
        }

        function loop(now) {
            if (!running) return;
            if (now - lastTick >= 90) {
                lastTick = now;
                step();
                draw();
            }
            requestAnimationFrame(loop);
        }

        function start() {
            if (running || reducedMotion || !visible || document.hidden) return;
            running = true;
            requestAnimationFrame(loop);
        }

        function stop() {
            running = false;
        }

        function setPhase(key, { manual = false } = {}) {
            phaseKey = key;
            manualPhase = manual || manualPhase;
            buildStatic();
            draw();
            updateLabel();
        }

        function updateLabel() {
            if (!label) return;
            label.textContent = `${manualPhase ? 'Previewing' : 'Boston right now'} · ${PHASES[phaseKey].label}`;
            host.dataset.phase = phaseKey;
        }

        function wave() {
            noah.waveUntil = performance.now() + 2200;
            if (bubble) {
                bubble.classList.remove('is-visible');
                void bubble.offsetWidth;
                bubble.classList.add('is-visible');
                clearTimeout(wave.timer);
                wave.timer = setTimeout(() => bubble.classList.remove('is-visible'), 2400);
            }
            if (reducedMotion) draw();
        }

        function launchPlane() {
            planes.push({ x: noah.x + 4, y0: BANK_Y - 14, y: BANK_Y - 14, t: 0 });
            wave();
            if (reducedMotion) draw();
        }

        cycleBtn?.addEventListener('click', () => {
            const next = PHASE_ORDER[(PHASE_ORDER.indexOf(phaseKey) + 1) % PHASE_ORDER.length];
            setPhase(next, { manual: true });
        });
        noahBtn?.addEventListener('click', wave);

        // position the invisible "Noah" hit area over the sprite
        function placeNoahButton() {
            if (!noahBtn) return;
            const cssScale = host.clientWidth / W;
            noahBtn.style.left = `${(noah.x - 2) * cssScale}px`;
            noahBtn.style.width = `${11 * cssScale}px`;
            noahBtn.style.top = `${(BANK_Y - 13) * cssScale}px`;
            noahBtn.style.height = `${16 * cssScale}px`;
            if (bubble) {
                bubble.style.left = `${(noah.x + 3) * cssScale}px`;
                bubble.style.top = `${(BANK_Y - 14) * cssScale}px`;
            }
        }

        // reaching out sends a paper plane over the Charles
        document.addEventListener('click', event => {
            if (event.target.closest('#contact .contact-link, #contact [data-copy-email], #contact .composer__send, #contact [data-composer-copy]')) {
                launchPlane();
            }
        });

        let resizeTimer = null;
        const relayout = () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                layout();
                placeNoahButton();
            }, 120);
        };
        if ('ResizeObserver' in window) new ResizeObserver(relayout).observe(host);
        else window.addEventListener('resize', relayout);

        if ('IntersectionObserver' in window) {
            new IntersectionObserver(entries => {
                visible = entries[0].isIntersecting;
                if (visible) start();
                else stop();
            }, { threshold: 0.05 }).observe(host);
        } else {
            visible = true;
        }
        document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

        // keep following Boston time (unless the visitor picked a phase)
        setInterval(() => {
            if (manualPhase) return;
            const next = phaseForHour(bostonHour());
            if (next !== phaseKey) setPhase(next);
        }, 60000);

        layout();
        placeNoahButton();
        updateLabel();
        start();

        // expose for the automated checks
        host.__skyline = { setPhase, launchPlane, get phase() { return phaseKey; }, get planes() { return planes.length; } };
    }

    initIcons();
    initSkyline();
})();
