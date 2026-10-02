// Hero art: my PixelMe portrait at the top of the page (a 52px sprite that
// throws up a peace sign on hover) and the landscape behind the hero copy,
// which follows the site theme: a misty morning in light mode, an aurora
// night in dark mode.
(() => {
    const kit = window.PixelKit;
    if (!kit?.art) return;
    const { u32, u32Map, mixU32, expand, bitmap, th, pick, hash, noise, clamp, rng, crispNear, loop } = kit.art;
    const { reducedMotion } = kit;
    const html = document.documentElement;
    const isDark = () => html.classList.contains('darkmode');

    // =================================================================
    //  Pixel me: my original PixelMe redrawn at 52px (lighter skin, coiled
    //  curls). The shades catch a glint now and then; hover (or tap) and I
    //  throw up a peace sign while they shine. The static copies elsewhere
    //  are this same sprite exported (assets/opt/PixelMe.webp and friends).
    // =================================================================
    function initPortrait() {
        const img = document.querySelector('.hero-panel .pixel-portrait');
        if (!img) return;
        const S = 52;
        const PAL = {
            '.': '#9df4fe',
            x: '#100c09', h: '#1d1813', H: '#2c251e', L: '#41362b', Y: '#5e4c3b',
            k: '#000000', w: '#f3f0e3', g: '#d3e3b8',
            s: '#c08050', m: '#a5683f', S: '#86502f', n: '#ec9a5e', d: '#5e3a26',
            r: '#ad4943', i: '#5a3420', p: '#120a08'
        };
        const FACE = [
            '....................................................',
            '............................HYL.....................',
            '.........................HHhHHY.....................',
            '........................HLYHHHHxhHLH................',
            '.....................HYHHhHYhHxxhHhL................',
            '.................HLYxHhLhHHhHLHhhhHHHLh.............',
            '.................HhLxHHhxxxhxhHhHLhhhxHhHL..........',
            '................HHhhHHLxhxxxhhxhxHhLhhxhhHh.........',
            '...............HhLHxhhHhHLxhLhxxhxhxHHHLhh..........',
            '...............hHHHxhhhhxhhxxHxxhLxxhhhHxxx..hH.....',
            '............HLHxxhxhLxxxxxxxhhxxxhxxxxhxxhLYxHHH....',
            '...........xHhLxhHLhxhxxhLxxxxxhxxxxhLHxxHhHxhHh....',
            '...........xhhHxhxHxhhLhhxhxxxhhLxxxHhLxxxhHxxH.....',
            '...........HYHxxxxxxxhxHhhxxhLxxhxhHhhHhHLxxxhHL....',
            '..........HHHYxxHxxHLHxhhhhxxhhxxxHHHhxhhHxxHHHHh...',
            '..........hhhHxHHLxhhLxxxhHhxhxhhxhHhxhHhxxHHYhYH...',
            '.........HHLhYHhhHxhhhxxxxxHxxxhhLxxxxHHHhHhhhHHLH..',
            '.........HLYHhLHhhxxhxhhxhhxxxxhxhhhxxhHxHLHhxhhHH..',
            '.........HhLHHhHLxhHLhhHhhHhxHLHxhHLhhhxxhhHhHhhH...',
            '.........xHHHHhhHLhhHLxhhxhHxxhhxhxhhhHhxhhxHHHx....',
            '..........xhHYHhHHSShhxSSShxSShhSSxhhxhHxhhxhHHHLH..',
            '...........HhhLhhxSShHSSSSLhSShYSSxxhhhxxhHLxxhhHL..',
            '...........xhHhxxhLxhxSSSxxhhLHhLxxxhHLxxhxhxxhhHh..',
            '............xxxxhxhhxhSSxhxhxhhhhxxxhxhxxxhxxxxhx...',
            '..............kkkxhxxHSSkkkkkkkkkkkkshxhLHxhHh......',
            '..............kkkkkxHHSkkkkkkkkkkkkkssxhhLxhxH......',
            '..............kkwwkkhhkkkkwwkkkkkkkkssmmxHHHxx......',
            '..............kkwwkkxhkkkkwwkkkkkkkkksmmmhHLHx......',
            '..............kkkkkkkknnkkkkkkkkkkmmkkmmmhhhHx......',
            '...............kkkkkknnnnkkkkkkkkkmmkkmmmmhhh.......',
            '...............kkkkkknnnnkkkkkkkkssskkmmmwHLx.......',
            '.................kkknnnnnnnkkkkssssskkmmwwHY........',
            '..................mmnnnnssnnsssssssskkmmSShH........',
            '..................mmnnnnssnnssssssskkkmmmSxh........',
            '..................mmkkkkkkkkssssssskkksmmm..........',
            '..................mkmkkkkkkkksssskkkkkssmm..........',
            '..................kmmmSSSSmkksssskkkkkssHHw.........',
            '...................kmmSSSSmmkksskkkkksssHwww........',
            '...................kkkrrrrsskkkkkkkkksswwwwmhhh.....',
            '....................kkkrrrsskkkkkkkssswwwmmhhhhh....',
            '....................kkkkkksskkkkkkkssdggmmmhhhhh....',
            '....................kkkkkksskkkkkssdddggmhhhhhhhh...',
            '....................kkkkkkkkkkkkkssdddwwhhhhhhhhh...',
            '.....................kkkkkkkkkkksdddddwhhhhhhhhhhhh.',
            '.....................kkkkkkkkkkddddwgghhhhhhhhkkkkhh',
            '.......................kkkkkkdddddwwghhhhhhhhkkkkkkh',
            '..........................ssddddHHwwhhhhhhhhkkhhhhhk',
            '..........................ssdddHHHwhhhhhhhhhkkhhhhkk',
            '..........................ssddHHHdhhhkkkkkhhhhhkkkkk',
            '..........................sdddHHdhhkkkkkkkhhhhkkkkkk',
            '..........................dddwgghhhkkkkkkhhhhkkkkkkk',
            '..........................ddwwgghhkkkkkkhhhhkkkkkkkk'
        ];
        // where the shades are, so a glint only crosses the lenses
        const LENS = [
            'kkk.......kkkkkkkkkkkk.',
            'kkkkk....kkkkkkkkkkkkk.',
            'kkwwkk..kkkkwwkkkkkkkk.',
            'kkwwkk..kkkkwwkkkkkkkkk',
            'kkkkkkkk..kkkkkkkkkk...',
            '.kkkkkk....kkkkkkkkk...',
            '.kkkkkk....kkkkkkkk....',
            '...kkk.......kkkk......'
        ];
        const LENS_AT = { x: 14, y: 24 };
        const PEACE = [
            '.SS.......SS.',
            'SnsS.....SnsS',
            'SnsS.....SnsS',
            '.SnsS...SnsS.',
            '.SnsS...SnsS.',
            '.SnssS.SnssS.',
            '..SnsS.SnsS..',
            '..SnssSnssS..',
            '...SnsSnsS...',
            '..SSmssssSS..',
            '.SmmSmmmSmmS.',
            '.SmmmmmmmmmsS',
            'SsmmmmmmmssS.',
            'SssssmmsssssS',
            '.SsssssssssS.',
            '.SsssssssssS.',
            '..SsssssssS..',
            '..kkkkkkkkk..',
            '.kkkkkkkkkkk.',
            '.kkddkkkkkkk.',
            '.kkkkkkkkkkk.',
            '.kkkkkkkkkkk.'
        ];

        const canvas = document.createElement('canvas');
        canvas.width = S;
        canvas.height = S;
        canvas.className = `${img.className} hero-me`;
        canvas.setAttribute('role', 'img');
        canvas.setAttribute('aria-label', img.alt || 'Pixel-art portrait of Noah');
        const ctx = canvas.getContext('2d');
        const pal = u32Map(PAL);
        const face = bitmap(S, S);
        face.buf.fill(pal['.']);   // '.' is the sky here, not transparency
        kit.art.stamp(face, FACE, 0, 0, pal);
        const faceCanvas = face.done();
        const hand = bitmap(PEACE[0].length, PEACE.length);
        kit.art.stamp(hand, PEACE, 0, 0, pal);
        const handCanvas = hand.done();
        const lens = [];
        LENS.forEach((row, y) => [...row].forEach((k, x) => k === 'k' && lens.push([LENS_AT.x + x, LENS_AT.y + y])));

        const state = { hand: 0, target: 0, glint: -1, nextGlint: 2.5, sparkle: 0 };
        // ease out with a little overshoot, so the hand pops up
        const pop = p => 1 + 2.2 * (p - 1) ** 3 + 1.2 * (p - 1) ** 2;

        function draw() {
            ctx.drawImage(faceCanvas, 0, 0);
            if (state.hand > 0.01) ctx.drawImage(handCanvas, 2, S - PEACE.length + Math.round((1 - pop(state.hand)) * (PEACE.length + 2)));
            if (state.glint >= 0) {
                const g = -6 + state.glint * 36;
                ctx.fillStyle = 'rgba(190, 236, 255, 0.6)';
                lens.forEach(([x, y]) => {
                    const d = x - LENS_AT.x + (y - LENS_AT.y) * 0.6 - g;
                    if (d >= 0 && d < 2) ctx.fillRect(x, y, 1, 1);
                });
            }
            if (state.sparkle > 0) {
                // a four-point twinkle on the right lens
                ctx.fillStyle = '#ffffff';
                const big = state.sparkle > 0.25;
                ctx.fillRect(33, 25, 1, 1);
                ctx.fillRect(32, 25, big ? 3 : 1, 1);
                ctx.fillRect(33, big ? 23 : 24, 1, big ? 5 : 3);
            }
        }

        function step(dt) {
            const speed = state.target > state.hand ? 4.5 : 6;
            state.hand = clamp(state.hand + Math.sign(state.target - state.hand) * dt * speed, 0, 1);
            state.sparkle = Math.max(0, state.sparkle - dt);
            if (state.glint >= 0) {
                state.glint += dt * 1.4;
                if (state.glint > 1) state.glint = -1;
            } else if ((state.nextGlint -= dt) <= 0) {
                state.glint = 0;
                state.nextGlint = 4 + Math.random() * 4;
            }
            draw();
        }

        img.replaceWith(canvas);
        const size = () => {
            // shrinks a step on short laptop screens so the hero still fits
            const target = window.matchMedia('(max-width: 768px)').matches
                ? 124
                : Math.min(156, Math.max(112, window.innerHeight * 0.17));
            const css = crispNear(target, S);
            canvas.style.width = `${css}px`;
            canvas.style.height = `${css}px`;
        };
        size();
        window.addEventListener('resize', size);
        loop(canvas, step, { fps: 30 });
        draw();

        let tapTimer = 0;
        const peace = on => {
            state.target = on ? 1 : 0;
            if (on) {
                state.glint = 0;
                state.sparkle = 0.6;
            }
            if (reducedMotion) {
                state.hand = state.target;
                state.glint = -1;
                draw();
            }
        };
        canvas.addEventListener('pointerenter', event => {
            if (event.pointerType === 'mouse') peace(true);
        });
        canvas.addEventListener('pointerleave', event => {
            if (event.pointerType === 'mouse') peace(false);
        });
        canvas.addEventListener('click', () => {
            peace(true);
            clearTimeout(tapTimer);
            tapTimer = setTimeout(() => peace(canvas.matches(':hover')), 1800);
        });
    }

    // =================================================================
    //  The landscape behind the hero: layered ridges in a V so the copy
    //  sits over open sky, pines, drifting mist and clouds by day, an
    //  aurora and stars by night. My robot buddy patrols the near ridge
    //  (follow the cursor, tap it). Tap the sky for a paper plane or a
    //  shooting star.
    // =================================================================
    function initScene() {
        const panel = document.querySelector('.hero-panel');
        if (!panel) return;
        const canvas = document.createElement('canvas');
        canvas.className = 'hero-scene';
        canvas.setAttribute('aria-hidden', 'true');
        panel.prepend(canvas);
        panel.classList.add('has-scene');
        const ctx = canvas.getContext('2d');
        const M = 10;   // spare columns either side for parallax

        const THEMES = {
            light: {
                sky: ['#b9e2e8', '#cbeaec', '#dcf1ee', '#e9f5ee', '#f3f6ea', '#f8f4e4'],
                orb: { x: 0.8, y: 0.16, r: 0, glow: '#fffbe8', glowR: 0.32 },
                ridges: [
                    { base: 0.65, amp: 0.09, freq: 70, side: 0.13, ramp: ['#a9cdd2', '#b8d8db', '#c7e1e2'], snow: '#eef8f8', depth: 0.12 },
                    { base: 0.715, amp: 0.065, freq: 52, side: 0.11, ramp: ['#8fbfba', '#a1cbc4', '#b3d6ce'], depth: 0.25, dome: 0.17 },
                    { base: 0.78, amp: 0.045, freq: 40, side: 0.08, ramp: ['#6aa699', '#7cb3a5', '#8fc0b1'], pines: 0.34, depth: 0.45 },
                    { base: 0.84, amp: 0.03, freq: 30, side: 0.05, ramp: ['#46877a', '#559486', '#66a293'], pines: 0.44, depth: 0.7 },
                    { base: 0.9, amp: 0.016, freq: 26, side: 0.025, ramp: ['#2c6a5e', '#357466', '#418072'], grass: true, depth: 1 }
                ],
                mist: '#f1f8f3',
                cloud: ['#c9dfe6', '#dbeaee', '#ecf5f5', '#fbfdfb'],
                bird: '#56707a',
                dome: ['#f6f9f8', '#c2d2d0', '#a7bcba'],
                window: null
            },
            dark: {
                sky: ['#03060f', '#050b1a', '#081227', '#0c1b35', '#112842', '#17354f'],
                orb: { x: 0.8, y: 0.17, r: 9, glow: '#6f92d8', glowR: 0.13, moon: ['#fdfaf0', '#e8e2c8', '#cfc6a6'] },
                ridges: [
                    { base: 0.65, amp: 0.09, freq: 70, side: 0.13, ramp: ['#0f2140', '#132849', '#173052'], snow: '#2b4874', depth: 0.12 },
                    { base: 0.715, amp: 0.065, freq: 52, side: 0.11, ramp: ['#0c1a34', '#10203c', '#142744'], depth: 0.25, dome: 0.17 },
                    { base: 0.78, amp: 0.045, freq: 40, side: 0.08, ramp: ['#09142a', '#0c1931', '#0f1f39'], pines: 0.34, depth: 0.45 },
                    { base: 0.84, amp: 0.03, freq: 30, side: 0.05, ramp: ['#060e20', '#091327', '#0c182e'], pines: 0.44, depth: 0.7 },
                    { base: 0.9, amp: 0.016, freq: 26, side: 0.025, ramp: ['#040a18', '#060d1d', '#081122'], grass: true, depth: 1 }
                ],
                mist: '#1a3a5c',
                cloud: ['#0b1428', '#121f3a', '#1b2c4c', '#2a4064'],
                bird: null,
                dome: ['#2b3c5e', '#1b2744', '#152037'],
                window: '#ffd27a',
                aurora: true
            }
        };

        // art grid: about 3 CSS px per art pixel, snapped to whole device pixels
        let W = 0;
        let H = 0;
        let unit = 3;
        let scene = null;
        const cache = new Map();

        const ridgeY = (R, x, w, h, seed) => {
            const u = x / w;
            const side = (Math.abs(u - 0.5) * 2) ** 2;
            const n = noise(x / R.freq, 0, seed) * 0.65 + noise(x / (R.freq * 0.37), 0, seed + 9) * 0.35;
            return Math.round(h * (R.base - R.amp * n - R.side * side));
        };

        function build(theme) {
            const T = THEMES[theme];
            const key = `${theme}:${W}x${H}`;
            if (cache.has(key)) return cache.get(key);
            const sky = bitmap(W, H);
            const ramp = expand(T.sky, 4).map(u32);
            const glow = u32(T.orb.glow);
            const ox = T.orb.x * W;
            const oy = T.orb.y * H;
            const gr = T.orb.glowR * Math.max(W, H);
            for (let y = 0; y < H; y++) {
                for (let x = 0; x < W; x++) {
                    let col = pick(ramp, (y / (H * 0.8)) * (ramp.length - 1), x, y);
                    const d = Math.hypot(x - ox, (y - oy) * 1.2) / gr;
                    if (d < 1) {
                        const q = (1 - d) ** 2 * 12 * (T.orb.moon ? 0.42 : 0.6);
                        const lvl = Math.floor(q) + (q - Math.floor(q) > th(x, y) ? 1 : 0);
                        if (lvl) col = mixU32(col, glow, lvl / 12);
                    }
                    sky.set(x, y, col);
                }
            }
            if (T.orb.moon) {
                // a crescent moon: a lit disc with a shadow disc taken out of it
                const mr = T.orb.r;
                const mc = T.orb.moon.map(u32);
                for (let y = Math.floor(oy - mr); y <= oy + mr; y++) {
                    for (let x = Math.floor(ox - mr); x <= ox + mr; x++) {
                        const d = Math.hypot(x + 0.5 - ox, y + 0.5 - oy) / mr;
                        const cut = Math.hypot(x + 0.5 - ox + mr * 0.55, y + 0.5 - oy - mr * 0.2) / (mr * 0.92);
                        if (d > 1 || cut < 1) continue;
                        sky.set(x, y, mc[d > 0.82 ? 2 : d > 0.55 ? 1 : 0]);
                    }
                }
            }

            const ridges = T.ridges.map((R, i) => {
                const L = bitmap(W + M * 2, H);
                const tones = R.ramp.map(u32);
                const mist = u32(T.mist);
                const crest = new Int16Array(W + M * 2);
                const seed = 40 + i * 7;
                for (let x = 0; x < L.w; x++) crest[x] = ridgeY(R, x - M, W, H, seed);
                for (let x = 0; x < L.w; x++) {
                    const top = crest[x];
                    const slope = (crest[Math.min(L.w - 1, x + 1)] - crest[Math.max(0, x - 1)]) / 2;
                    for (let y = Math.max(0, top); y < H; y++) {
                        // slopes facing the light (the upper right) are a tone brighter
                        let v = 1 - slope * 0.9 + (y - top < 1 ? 0.6 : 0);
                        let col = pick(tones, v, x, y);
                        if (R.snow && y - top < 1 + noise(x * 0.3, 0, seed + 3) * 2.6 && top < H * (R.base - R.amp * 0.5 - R.side * 0.3)) col = u32(R.snow);
                        // mist pooling at the foot of each ridge
                        const fog = (y - top) / (H * 0.12);
                        if (fog > 0.25 && i < 4) {
                            const q = clamp((fog - 0.25) * 0.9, 0, 0.75) * 6;
                            const lvl = Math.floor(q) + (q - Math.floor(q) > th(x, y) ? 1 : 0);
                            if (lvl) col = mixU32(col, mist, lvl / 6 * (theme === 'dark' ? 0.55 : 1));
                        }
                        L.set(x, y, col);
                    }
                }
                // pines along the crest, lit on the right
                if (R.pines) {
                    const dark = tones[0];
                    const lit = tones[2];
                    for (let x = 2; x < L.w - 2; x++) {
                        if (hash(x, i, 61) > R.pines * 0.5) continue;
                        const h = 4 + Math.floor(hash(x, i, 62) * (6 + i * 2));
                        const top = crest[x] + 1 - h;
                        for (let k = 0; k < h; k++) {
                            const t = k / h;
                            const half = Math.floor(t * h * 0.32 + ((k & 1) ? 0 : 0.6));
                            for (let dx = -half; dx <= half; dx++) L.set(x + dx, top + k, dx === half && half > 0 ? lit : dark);
                        }
                    }
                }
                // grass tufts on the near ridge
                if (R.grass) {
                    for (let x = 0; x < L.w; x++) {
                        if (hash(x, 3, 71) > 0.55) L.set(x, crest[x] - 1, tones[hash(x, 4, 71) > 0.5 ? 2 : 1]);
                        if (hash(x, 5, 71) > 0.88) L.set(x, crest[x] - 2, tones[2]);
                    }
                }
                // a little observatory on one ridge, its slit lit at night
                if (R.dome) {
                    const ox0 = Math.round(R.dome * W) + M;
                    const base = Math.min(crest[ox0 - 4], crest[ox0], crest[ox0 + 4]);
                    const [lit, shade, wall] = T.dome.map(u32);
                    for (let y = -3; y <= 1; y++) for (let x = -4; x <= 4; x++) L.set(ox0 + x, base + y, x > 1 ? shade : wall);
                    for (let y = -8; y <= -4; y++) {
                        for (let x = -5; x <= 5; x++) {
                            if (Math.hypot(x, (y + 3.5) * 1.15) > 5.2) continue;
                            L.set(ox0 + x, base + y, x > 1 ? shade : lit);
                        }
                    }
                    const slit = T.window ? u32(T.window) : tones[0];
                    for (let y = -8; y <= -5; y++) L.set(ox0 + 1, base + y, slit);
                    if (T.window) L.set(ox0 - 2, base - 1, slit);
                }
                return { c: L.done(), crest, depth: R.depth };
            });

            // clouds (day only): round puffs on a flat base, three clean tones lit from the upper right
            const cloudTones = T.cloud.map(u32);
            const r = rng(theme === 'dark' ? 5 : 9);
            const clouds = theme === 'dark' ? [] : Array.from({ length: 6 }, () => {
                const w = Math.round(22 + r() * 26);
                const h = Math.round(w * 0.42);
                const L = bitmap(w, h);
                const puffs = [];
                const n = 3 + Math.floor(r() * 3);
                for (let k = 0; k < n; k++) {
                    const u = (k + 0.5) / n;
                    const pr = h * (0.3 + 0.38 * Math.sin(u * Math.PI) * (0.75 + r() * 0.35));
                    puffs.push([w * (0.12 + 0.76 * u), h - pr * 0.85 - 1, pr]);
                }
                for (let y = 0; y < h; y++) {
                    for (let x = 0; x < w; x++) {
                        let best = null;
                        puffs.forEach(([px, py, pr]) => {
                            const d = Math.hypot(x + 0.5 - px, y + 0.5 - py) / pr;
                            if (d <= 1 && (!best || d < best.d)) best = { d, nx: (x + 0.5 - px) / pr, ny: (y + 0.5 - py) / pr };
                        });
                        if (!best || y > h - 2) continue;
                        const lit = best.nx * 0.55 - best.ny * 0.85;
                        let v = 1.6 + lit * 1.4 + (noise(x * 0.4, y * 0.4, 21) - 0.5) * 0.6;
                        if (y > h - 4) v -= 1;
                        L.set(x, y, cloudTones[clamp(Math.round(v), 0, 3)]);
                    }
                }
                return { c: L.done(), x: r() * W, y: Math.round(H * (0.06 + r() * 0.3)), speed: 0.6 + r() * 1.1, w };
            });

            const stars = theme === 'dark' ? Array.from({ length: Math.round((W * H) / 520) }, () => ({
                x: Math.floor(r() * W),
                y: Math.floor(Math.pow(r(), 1.4) * H * 0.62),
                b: r(),
                p: r() * 6.28
            })) : [];

            // mist ribbons that drift between the ridges by day
            const mist = theme === 'light' ? [0.7, 0.77, 0.845].map((fy, i) => {
                const w = W + 80;
                const h = 6;
                const L = bitmap(w, h);
                const [mr, mg, mb] = [0xf6, 0xfb, 0xf8];
                for (let y = 0; y < h; y++) {
                    for (let x = 0; x < w; x++) {
                        const k = Math.sin((y / (h - 1)) * Math.PI) * (0.4 + noise(x * 0.04, i, 81) * 0.8);
                        const q = clamp(k, 0, 1) * 4;
                        const lvl = Math.floor(q) + (q - Math.floor(q) > th(x, y) ? 1 : 0);
                        if (lvl) L.set(x, y, (((lvl * 28) << 24) | (mb << 16) | (mg << 8) | mr) >>> 0);
                    }
                }
                return { c: L.done(), y: Math.round(H * fy), speed: 1.2 + i * 0.8, w };
            }) : [];

            const veil = bitmap(W, H);
            {
                const [vr, vg, vb] = kit.art.hexRgb(theme === 'dark' ? '#071120' : '#f3f8f4');
                for (let y = 0; y < H; y++) {
                    for (let x = 0; x < W; x++) {
                        const d = Math.hypot((x + 0.5 - W / 2) / (W * 0.3), (y + 0.5 - H * 0.6) / (H * 0.3));
                        if (d >= 1) continue;
                        const q = (1 - d * d) * 5;
                        const lvl = Math.floor(q) + (q - Math.floor(q) > th(x, y) ? 1 : 0);
                        if (lvl) veil.set(x, y, ((Math.round(lvl * (theme === 'dark' ? 0.09 : 0.1) * 255) << 24) | (vb << 16) | (vg << 8) | vr) >>> 0);
                    }
                }
            }
            const built = { T, theme, sky: sky.done(), ridges, clouds, stars, mist, veil: veil.done(), aurora: T.aurora ? bitmap(W, Math.round(H * 0.6)) : null };
            cache.set(key, built);
            return built;
        }

        // robot buddy, side view (faces right; flipped when heading left)
        const ROVER = [
            '.....y.......',
            '.....o.......',
            '..ooooooo....',
            '.oGLLLLLwo...',
            '.oGkkkkcco...',
            '.oGkkkkkko...',
            '..ooooooo....',
            '...oDGGo.....',
            '.ooGGGGLwoo..',
            'okkkkkkkkkko.',
            'okDkDkDkDkko.',
            '.oooooooooo..'
        ];
        const ROVER_B = ROVER.map((row, y) => (y === 10 ? 'okkDkDkDkDko.' : row));
        const roverPal = theme => u32Map(theme === 'dark'
            ? { o: '#02040a', D: '#141a2c', G: '#26304a', L: '#3a4766', w: '#7fe3ef', k: '#05070e', c: '#73eff7', y: '#ffd26b' }
            : { o: '#163a34', D: '#3e5a66', G: '#5f7c88', L: '#8fa9b2', w: '#e9fffb', k: '#1e2c34', c: '#73eff7', y: '#ffb84a' });
        const roverSprites = {};
        const rover = theme => (roverSprites[theme] ||= [ROVER, ROVER_B].flatMap(rows => [false, true].map(flip => {
            const L = bitmap(13, 12);
            kit.art.stamp(L, rows, 0, 0, roverPal(theme), flip);
            return L.done();
        })));

        const state = {
            t: 0, px: 0, tx: 0, scroll: 0,
            bot: { x: 0.3, vx: 0, target: 0.62, face: 1, hop: 0, idle: 2 },
            planes: [], meteors: [], birds: null, nextBirds: 6, nextMeteor: 4,
            fade: null
        };
        const pointer = { x: -1, active: false };
        const rnd = rng(77);

        function resize() {
            const dpr = window.devicePixelRatio || 1;
            const k = Math.max(2, Math.round(3 * dpr));
            unit = k / dpr;
            const rect = panel.getBoundingClientRect();
            const w = Math.ceil(rect.width / unit);
            const h = Math.ceil(rect.height / unit);
            if (w === W && h === H) return;
            W = w;
            H = h;
            canvas.width = W;
            canvas.height = H;
            canvas.style.width = `${W * unit}px`;
            canvas.style.height = `${H * unit}px`;
            cache.clear();
            scene = build(isDark() ? 'dark' : 'light');
            draw();
        }

        function drawAurora(S) {
            // curtains of light: a wandering lower edge with rays shimmering up from it
            const A = S.aurora;
            A.buf.fill(0);
            const t = state.t;
            const ah = A.h;
            for (let x = 0; x < W; x++) {
                const u = x / W;
                const edge = ah * (0.56 + Math.sin(u * 5.2 + t * 0.07) * 0.12 + (noise(u * 6 + t * 0.05, 1, 91) - 0.5) * 0.22);
                const height = ah * (0.28 + noise(u * 4, 2, 92) * 0.3);
                const rays = 0.45 + 0.55 * noise(x * 0.16 + t * 0.35, t * 0.12, 93);
                const env = (0.35 + 0.65 * clamp(Math.abs(u - 0.5) / 0.32, 0, 1)) * (0.55 + 0.45 * noise(u * 3 - t * 0.04, 3, 94));
                const strength = rays * env;
                for (let y = Math.max(0, Math.floor(edge - height)); y < Math.min(ah, edge + 2); y++) {
                    const k = (edge - y) / height;   // 0 at the lower edge, 1 at the top
                    let a = k < 0 ? 1 + k * 2 : (1 - k) ** 1.6;
                    if (k >= 0 && k < 0.12) a *= 1 + (0.12 - k) * 6;   // the bright fringe along the bottom
                    a *= strength;
                    const q = clamp(a, 0, 1) * 5;
                    const lvl = Math.floor(q) + (q - Math.floor(q) > th(x, y) ? 1 : 0);
                    if (!lvl) continue;
                    // green at the bottom, teal, then violet at the top
                    const [r, g, b] = k < 0.35 ? [70, 240, 170] : k < 0.7 ? [46, 214, 214] : [130, 120, 240];
                    const alpha = Math.round(lvl * 0.06 * 255);
                    A.buf[y * W + x] = ((alpha << 24) | (b << 16) | (g << 8) | r) >>> 0;
                }
            }
            A.done();
            ctx.globalCompositeOperation = 'lighter';
            ctx.drawImage(A.c, 0, Math.round(H * 0.02));
            ctx.globalCompositeOperation = 'source-over';
        }

        function render(c, S) {
            const t = state.t;
            const par = depth => Math.round(-state.px * 7 * depth);
            const sink = depth => Math.round((state.scroll / unit) * (1 - depth) * 0.35);
            c.drawImage(S.sky, 0, 0);
            S.stars.forEach(s => {
                const tw = 0.5 + 0.5 * Math.sin(t * (0.6 + s.b * 2) + s.p);
                c.globalAlpha = (0.25 + 0.75 * tw) * (0.35 + s.b * 0.65);
                c.fillStyle = s.b > 0.8 ? '#ffffff' : '#bcd0f0';
                c.fillRect(s.x, s.y + sink(0.05), 1, 1);
            });
            c.globalAlpha = 1;
            if (S.aurora && c === ctx) drawAurora(S);
            S.clouds.forEach(cl => {
                const span = W + cl.w * 2;
                const x = ((((cl.x + t * cl.speed) % span) + span) % span) - cl.w + par(0.08);
                c.drawImage(cl.c, Math.round(x), cl.y + sink(0.1));
            });
            // shooting stars
            state.meteors.forEach(m => {
                for (let i = 0; i < 12; i++) {
                    c.globalAlpha = (1 - i / 12) * Math.min(1, (1 - m.age / m.life) * 3);
                    c.fillStyle = i < 2 ? '#ffffff' : '#bfe3ff';
                    c.fillRect(Math.round(m.x - m.vx * i * 0.014), Math.round(m.y - m.vy * i * 0.014), 1, 1);
                }
            });
            c.globalAlpha = 1;
            // birds by day
            if (state.birds && S.T.bird) {
                c.fillStyle = S.T.bird;
                state.birds.forEach(b => {
                    const x = Math.round(b.x);
                    const y = Math.round(b.y + Math.sin(t * 2 + b.p) * 1.5);
                    const up = Math.sin(t * 9 + b.p) > 0;
                    c.fillRect(x, y + (up ? 0 : 1), 1, 1);
                    c.fillRect(x + 1, y + 1, 1, 1);
                    c.fillRect(x + 2, y + (up ? 0 : 1), 1, 1);
                    if (up) {
                        c.fillRect(x - 1, y - 1, 1, 1);
                        c.fillRect(x + 3, y - 1, 1, 1);
                    }
                });
            }
            S.ridges.forEach((R, i) => {
                c.drawImage(R.c, -M + par(R.depth), sink(R.depth));
                const m = S.mist[i - 1];
                if (m) {
                    const x = -(((t * m.speed) % 80) + 80) % 80 + par(R.depth);
                    c.drawImage(m.c, Math.round(x) - 40, m.y + sink(R.depth));
                }
            });
            c.drawImage(S.veil, 0, 0);
            // paper planes by day
            state.planes.forEach(p => {
                c.fillStyle = '#ffffff';
                const x = Math.round(p.x);
                const y = Math.round(p.y);
                c.fillRect(x, y, 4, 1);
                c.fillRect(x + 1, y + 1, 3, 1);
                c.fillStyle = '#9fb8c4';
                c.fillRect(x + 2, y + 2, 2, 1);
                c.fillRect(x - 2, y, 1, 1);
            });
            // the robot on the near ridge
            const near = S.ridges[S.ridges.length - 1];
            const bx = Math.round(state.bot.x * W);
            const crest = near.crest[clamp(bx + M - par(1), 0, near.crest.length - 1)];
            const frame = (Math.floor(t * 8) & 1) && Math.abs(state.bot.vx) > 0.002 ? 2 : 0;
            const sprites = rover(S.theme);
            const hop = Math.round(Math.sin(Math.min(1, state.bot.hop) * Math.PI) * 6);
            const by = crest - 12 + sink(1) - hop;
            if (S.theme === 'dark') {
                // headlight
                c.globalAlpha = 0.28;
                c.fillStyle = '#9ff6ff';
                for (let i = 1; i < 9; i++) c.fillRect(bx + (state.bot.face > 0 ? 9 + i : 3 - i), by + 4 - Math.floor(i / 3), 1, 1 + Math.floor(i / 2.5));
                c.globalAlpha = 1;
            }
            c.drawImage(sprites[frame + (state.bot.face > 0 ? 0 : 1)], bx, by);
            if (Math.sin(t * 3) > 0.5) {
                c.fillStyle = S.theme === 'dark' ? '#ff6a6a' : '#ff8a3a';
                c.fillRect(bx + (state.bot.face > 0 ? 5 : 7), by, 1, 1);
            }
        }

        // 4x4 Bayer tiles for the dissolve when the theme flips
        const fadeCanvas = document.createElement('canvas');
        const fctx = fadeCanvas.getContext('2d');
        const masks = [];
        const maskFor = k => {
            if (!masks[k]) {
                const L = bitmap(4, 4);
                kit.art.BAYER.forEach((b, i) => {
                    if (b < k) L.set(i & 3, i >> 2, 0xff000000);
                });
                masks[k] = fctx.createPattern(L.done(), 'repeat');
            }
            return masks[k];
        };

        function draw() {
            if (!scene) return;
            render(ctx, scene);
            if (state.fade) {
                const k = (performance.now() - state.fade.start) / 600;
                if (k >= 1 || state.fade.from.sky.width !== W) {
                    state.fade = null;
                    return;
                }
                fadeCanvas.width = W;
                fadeCanvas.height = H;
                render(fctx, state.fade.from);
                fctx.globalCompositeOperation = 'destination-in';
                fctx.fillStyle = maskFor(Math.round((1 - k) * 16));
                fctx.fillRect(0, 0, W, H);
                fctx.globalCompositeOperation = 'source-over';
                ctx.drawImage(fadeCanvas, 0, 0);
            }
        }

        function step(dt) {
            state.t += dt;
            state.px += (state.tx - state.px) * Math.min(1, dt * 3);
            // the robot heads for the cursor, or wanders when you're not around
            const bot = state.bot;
            if (pointer.active) bot.target = clamp(pointer.x, 0.04, 0.94);
            else {
                bot.idle -= dt;
                if (bot.idle <= 0) {
                    bot.target = 0.06 + rnd() * 0.86;
                    bot.idle = 5 + rnd() * 7;
                }
            }
            const gap = bot.target - bot.x;
            const want = Math.abs(gap) < 0.01 ? 0 : Math.sign(gap) * Math.min(0.045, Math.abs(gap) * 1.5 + 0.01);
            bot.vx += (want - bot.vx) * Math.min(1, dt * 4);
            bot.x += bot.vx * dt;
            if (Math.abs(bot.vx) > 0.004) bot.face = Math.sign(bot.vx);
            if (bot.hop > 0) bot.hop = bot.hop >= 1 ? 0 : bot.hop + dt * 2.2;

            state.planes = state.planes.filter(p => {
                p.age += dt;
                p.x += p.vx * dt;
                p.y += Math.sin(p.age * 2.4) * 4 * dt + 3 * dt;
                return p.x < W + 10 && p.x > -10 && p.age < 12;
            });
            state.meteors = state.meteors.filter(m => {
                m.age += dt;
                m.x += m.vx * dt;
                m.y += m.vy * dt;
                return m.age < m.life;
            });
            if (scene?.theme === 'dark') {
                state.nextMeteor -= dt;
                if (state.nextMeteor <= 0) {
                    meteor(W * (0.15 + rnd() * 0.7), H * (0.05 + rnd() * 0.2));
                    state.nextMeteor = 6 + rnd() * 10;
                }
            } else {
                state.nextBirds -= dt;
                if (state.nextBirds <= 0 && !state.birds) {
                    const dir = rnd() > 0.5 ? 1 : -1;
                    const y = H * (0.12 + rnd() * 0.22);
                    state.birds = Array.from({ length: 4 + Math.floor(rnd() * 3) }, (_, i) => ({
                        x: dir > 0 ? -10 - i * 6 - rnd() * 4 : W + 10 + i * 6 + rnd() * 4,
                        y: y + (i % 2) * 4 + rnd() * 3,
                        vx: dir * (9 + rnd() * 2),
                        p: rnd() * 6
                    }));
                    state.nextBirds = 16 + rnd() * 14;
                }
            }
            if (state.birds) {
                state.birds.forEach(b => {
                    b.x += b.vx * dt;
                });
                if (state.birds.every(b => b.x < -20 || b.x > W + 20)) state.birds = null;
            }
            draw();
        }

        function meteor(x, y) {
            const dir = x > W / 2 ? -1 : 1;
            state.meteors.push({ x, y, vx: dir * (90 + rnd() * 50), vy: 35 + rnd() * 25, age: 0, life: 0.9 });
        }

        resize();
        const runner = loop(panel, step, { fps: 30, margin: '0px' });
        let resizeTimer = 0;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(resize, 150);
        });
        if ('ResizeObserver' in window) new ResizeObserver(() => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(resize, 150);
        }).observe(panel);
        window.addEventListener('scroll', () => {
            state.scroll = Math.min(window.scrollY, panel.offsetHeight);
            if (reducedMotion) return;
            if (!runner.visible) return;
        }, { passive: true });

        let dark = isDark();
        new MutationObserver(() => {
            if (isDark() === dark) return;
            dark = isDark();
            const from = scene;
            scene = build(dark ? 'dark' : 'light');
            state.fade = reducedMotion ? null : { from, start: performance.now() };
            state.birds = null;
            draw();
        }).observe(html, { attributes: true, attributeFilter: ['class'] });

        // interaction: listen on the panel, ignore anything clickable
        const toArt = event => {
            const r = canvas.getBoundingClientRect();
            return { x: (event.clientX - r.left) / unit, y: (event.clientY - r.top) / unit };
        };
        panel.addEventListener('pointermove', event => {
            const p = toArt(event);
            pointer.x = p.x / W;
            pointer.active = event.pointerType === 'mouse';
            if (event.pointerType === 'mouse') state.tx = clamp((p.x / W - 0.5) * 2, -1, 1);
        });
        panel.addEventListener('pointerleave', () => {
            pointer.active = false;
            state.tx = 0;
        });
        panel.addEventListener('click', event => {
            if (event.target.closest('a, button, canvas.hero-me, .hero-now, .hero-socials')) return;
            const p = toArt(event);
            const bx = state.bot.x * W;
            const near = scene.ridges[scene.ridges.length - 1];
            const crest = near.crest[clamp(Math.round(bx) + M, 0, near.crest.length - 1)];
            if (Math.abs(p.x - (bx + 6)) < 10 && Math.abs(p.y - (crest - 6)) < 12) {
                if (!reducedMotion) state.bot.hop = 0.001;
                return;
            }
            if (reducedMotion || p.y > H * 0.6) return;
            if (scene.theme === 'dark') meteor(p.x, p.y);
            else state.planes.push({ x: p.x, y: p.y, vx: p.x > W / 2 ? -26 : 26, age: 0 });
        });
    }

    initScene();
    initPortrait();
})();
