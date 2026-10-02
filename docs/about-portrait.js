// About portrait: a pixel-art diorama that stands in for the photo deck.
// Me in a straw hat on a cliff over the sea at golden hour, with Mt. Fuji, a
// floating torii, a sakura tree, a stone lantern, my robot buddy and a certain
// pirate ship on the horizon. Everything is drawn in code on a 240x300 canvas
// (no image files) and scaled up with image-rendering: pixelated.
// Tap the sky for hanabi, the sea for ripples, or me / the robot to say hi.
(() => {
    const root = document.getElementById('aboutPortrait');
    const canvas = root?.querySelector('[data-portrait-canvas]');
    if (!root || !canvas?.getContext || root.closest('[hidden]') || !window.PixelKit?.art) return;

    const W = 240;
    const H = 300;
    const SEA = 170;   // horizon row
    const M = 12;      // spare columns on each side of the layers that move with parallax
    const { reducedMotion } = window.PixelKit;

    // -----------------------------------------------------------------
    //  Palettes: one per time of day. Ramps run dark -> light.
    // -----------------------------------------------------------------
    const MODES = {
        dusk: {
            caption: '夕焼け · golden hour',
            sky: ['#1b1838', '#272150', '#3a2a62', '#56316e', '#7c3a72', '#a64470', '#cf576c', '#ea7665', '#f79b63', '#fdc173', '#ffe39b'],
            skyCurve: 1.45,
            rays: true,
            orb: { x: 190.5, y: 119.5, r: 17, colors: ['#fffbe8', '#fff1bd', '#ffe08f', '#ffc76e'], glow: 2.8, glowR: 64 },
            stars: 18, starTop: 58, starColors: ['#7f73b8', '#a99bd6'],
            cloud: ['#35285a', '#4f3066', '#763b6e', '#a64a6e', '#d6666a', '#f68f68', '#ffc184', '#ffe7a8'],
            cloudLight: 'below',
            fuji: ['#1e1840', '#281e4c', '#342458', '#432b62', '#58336b', '#73406f'],
            snow: ['#5e5390', '#7d6eaa', '#a090c4', '#c9a8cf', '#f2bfbf', '#ffdcc6', '#fff2dc'],
            tint: '#1b1236', tintFar: 0.12, tintNear: 0.58,
            glint: ['#fff7d6', '#ffdc8c', '#f7956a'],
            horizon: '#ffe6a6',
            torii: { k: '#150b17', K: '#4a2432', d: '#3f1124', r: '#7c2236', R: '#b23746', h: '#f47d5e', g: '#e2a44e' },
            toriiLit: false,
            ship: { k: '#1c1022', m: '#3a1f2a', M: '#572c32', w: '#ffd2a8', W: '#f39a7c', y: '#ffd26b' },
            ground: ['#0d0a18', '#140f22', '#1d152c', '#281c36', '#352340', '#4a2c48'],
            grass: ['#2b2040', '#5a3352', '#c3586a', '#ff9a72'],
            stone: ['#120d1c', '#1d1628', '#2a1f34', '#3a2a40', '#a3566a', '#f08a6c'],
            lamp: ['#ffb45a', '#ffd88a', '#fff3c6'], lampGlow: 0.28,
            bark: ['#110a16', '#1d1220', '#2c1a2a', '#3f2433', '#7a3b4a', '#d0645e'],
            bloom: ['#4b1c45', '#6f2652', '#9a3462', '#c64d74', '#ea7896', '#ffa7b6', '#ffd3d6'],
            petal: ['#ff9fb4', '#ffd0d6', '#d65c7e'],
            fig: {
                o: '#0b0710', J: '#3e2420', j: '#77492a', H: '#b27a3a', h: '#e3aa55', l: '#ffd88a',
                B: '#8c2a34', b: '#561a26',
                a: '#0a0609', A: '#1a1013', q: '#38221f', Q: '#b4604a',
                s: '#7b4a36', S: '#4f2e26', z: '#d98a5a', e: '#ffd56e',
                C: '#0a1f27', c: '#123a43', X: '#1b5258', x: '#e3836a'
            },
            robot: { o: '#0b0812', D: '#1f1a2c', G: '#3a3348', L: '#5a5068', w: '#f4a07c', c: '#73eff7', C: '#2a9fb0', y: '#ffd26b', k: '#07060c' },
            bird: '#2a1a38',
            fireflies: false
        },
        night: {
            caption: '夜祭り · festival night',
            sky: ['#060818', '#0a0f26', '#0e1533', '#131c40', '#19244c', '#202d58', '#283863', '#33466e', '#415678'],
            skyCurve: 1.7,
            orb: { x: 182.5, y: 58.5, r: 11, colors: ['#fffdf2', '#f8f3dc', '#e9e2c4', '#d8cfae'], glow: 2.1, glowR: 46 },
            stars: 150, starTop: 150, starColors: ['#8d9ac8', '#c8d2f0', '#fff4d6', '#ffffff'],
            milky: true,
            boats: true,
            cloud: ['#0b1028', '#121a38', '#1b2748', '#28385c', '#3c4f74', '#61779c', '#9aaed0'],
            cloudLight: 'above',
            fuji: ['#070b1e', '#0b1126', '#10172f', '#151e38', '#1b2742', '#24324e'],
            snow: ['#2c3762', '#3f4c7a', '#566694', '#7686b0', '#9aa9cc', '#c3cfe6', '#e6edf8'],
            tint: '#03061a', tintFar: 0.2, tintNear: 0.62,
            glint: ['#fbf8ea', '#c8d4ee', '#7d8db8'],
            horizon: '#6a7aa4',
            torii: { k: '#100608', K: '#5a2a20', d: '#4a1018', r: '#a02a2a', R: '#e04e36', h: '#ffb062', g: '#ffd27a' },
            toriiLit: true,
            ship: { k: '#05060e', m: '#0e1220', M: '#1a2032', w: '#8f9cc4', W: '#5e6b98', y: '#ffd26b' },
            ground: ['#03040a', '#06070f', '#0a0c17', '#0f1220', '#15192b', '#1e2338'],
            grass: ['#0c1020', '#1b2238', '#3e4c78', '#6474a6'],
            stone: ['#05060c', '#0a0c16', '#11141f', '#191d2b', '#2e3858', '#56669a'],
            lamp: ['#ff9a40', '#ffcf70', '#fff1c0'], lampGlow: 0.55,
            bark: ['#030308', '#07070f', '#0d0c18', '#151424', '#262c48', '#46527e'],
            bloom: ['#1a1030', '#2a1640', '#40205a', '#5e3474', '#87508e', '#b47cae', '#dcb0cc'],
            petal: ['#d7a2c4', '#f2d2e2', '#8a5a8e'],
            fig: {
                o: '#030308', J: '#2a1e18', j: '#4a3828', H: '#77623e', h: '#a88a52', l: '#ffc77a',
                B: '#6a1e26', b: '#40121c',
                a: '#030204', A: '#0b080c', q: '#211a20', Q: '#c0704a',
                s: '#4a3026', S: '#2c1a16', z: '#e8925a', e: '#ffd56e',
                C: '#04121a', c: '#0a2630', X: '#123a44', x: '#ff9e62'
            },
            robot: { o: '#030308', D: '#0d0f1c', G: '#1d2236', L: '#323a52', w: '#ffb06a', c: '#73eff7', C: '#2a9fb0', y: '#ffd26b', k: '#020206' },
            bird: null,
            fireflies: true
        }
    };

    const HANABI = [
        ['#fff6d0', '#ffd27a', '#ef7d57'],
        ['#ffe8f4', '#ff97cc', '#c4487a'],
        ['#eaffff', '#73eff7', '#3b7de0'],
        ['#f6ffe8', '#b6f07a', '#38b764'],
        ['#fff0ee', '#ff7a6a', '#b13e53']
    ];

    const {
        hexRgb, u32, u32Map, expand, mixU32, bitmap, BAYER, th, pick,
        hash, noise, fbm, clamp, rng, stamp, paintGlow, crispWidth, loop
    } = window.PixelKit.art;

    // -----------------------------------------------------------------
    //  Sky, sun / moon, stars
    // -----------------------------------------------------------------
    // the Milky Way: a soft diagonal band (0..1)
    const milkyWay = (x, y) => {
        const d = ((x - 96) * 0.5 - y) / 1.118;
        return Math.exp(-(d * d) / 150);
    };

    function skyValue(P, x, y) {
        const n = P.sky.length - 1;
        let v = n * Math.pow(y / (SEA - 1), P.skyCurve);
        const dx = x - P.orb.x;
        const dy = (y - P.orb.y) * 1.35;
        v += P.orb.glow * Math.exp(-(dx * dx + dy * dy) / (P.orb.glowR * P.orb.glowR));
        if (P.rays) {
            // soft crepuscular rays fanning out of the sun
            const r = Math.hypot(x - P.orb.x, y - P.orb.y);
            const ang = Math.atan2(y - P.orb.y, x - P.orb.x);
            const ray = Math.max(0, Math.sin(ang * 11 + noise(ang * 2.5, 0, 44) * 5) - 0.3) / 0.7;
            v += ray * 0.9 * Math.exp(-r / 95) * clamp((r - P.orb.r - 4) / 24, 0, 1);
        }
        return v;
    }

    const milkyTone = u32('#6f7cb8');

    function paintSky(P) {
        const L = bitmap(W, SEA);
        const ramp = expand(P.sky, 3).map(u32);
        for (let y = 0; y < SEA; y++) {
            for (let x = 0; x < W; x++) {
                let col = pick(ramp, skyValue(P, x, y) * 3, x, y);
                if (P.milky) {
                    // the Milky Way: blend toward a pale violet in dithered steps, with dark dust lanes
                    const dust = noise(x * 0.09, y * 0.16, 43) > 0.62 ? 0.45 : 1;
                    const q = clamp(milkyWay(x, y) * (0.2 + fbm(x * 0.07, y * 0.1, 41) * 0.75) * dust, 0, 0.62) * 6;
                    const lvl = Math.floor(q) + (q - Math.floor(q) > th(x, y) ? 1 : 0);
                    if (lvl) col = mixU32(col, milkyTone, lvl / 6);
                }
                L.set(x, y, col);
            }
        }
        const { x: ox, y: oy, r } = P.orb;
        const oc = P.orb.colors.map(u32);
        for (let y = Math.floor(oy - r); y <= oy + r; y++) {
            for (let x = Math.floor(ox - r); x <= ox + r; x++) {
                const d = Math.hypot(x + 0.5 - ox, y + 0.5 - oy) / r;
                if (d > 1) continue;
                let v = d * d * (oc.length - 1);
                if (P.milky) {
                    // moon: a few soft maria
                    const m = noise((x - ox) * 0.32, (y - oy) * 0.32, 77);
                    if (m > 0.58) v += 1.3;
                }
                L.set(x, y, pick(oc, v, x, y));
            }
        }
        return L.done();
    }

    function makeStars(P) {
        const rnd = rng(P.stars * 7 + 3);
        const stars = [];
        for (let i = 0; i < P.stars * 3 && stars.length < P.stars; i++) {
            const y = Math.floor(Math.pow(rnd(), 1.5) * P.starTop);
            const x = Math.floor(rnd() * W);
            if (Math.hypot(x - P.orb.x, y - P.orb.y) < P.orb.r + 5) continue;
            // at night, crowd them into the Milky Way
            if (P.milky && rnd() > 0.35 + milkyWay(x, y) * 0.65) continue;
            stars.push({ x, y, b: rnd(), p: rnd() * 6.28, c: P.starColors[Math.floor(rnd() * P.starColors.length)] });
        }
        return stars;
    }

    // -----------------------------------------------------------------
    //  Clouds: flat-bottomed bands lit from below at dusk, from above at night
    // -----------------------------------------------------------------
    const CLOUDS = {
        back: [
            { x: 132, y: 34, w: 96, h: 9, speed: 0.12 },
            { x: 176, y: 52, w: 60, h: 7, speed: 0.18 },
            { x: 10, y: 92, w: 70, h: 10, speed: 0.1 },
            { x: 150, y: 98, w: 104, h: 13, speed: 0.16 }
        ],
        front: [
            { x: 120, y: 123, w: 132, h: 7, speed: 0 },
            { x: -26, y: 138, w: 118, h: 15, speed: 0.22 },
            { x: 150, y: 145, w: 100, h: 11, speed: 0.3 }
        ]
    };

    function paintCloud(P, spec, seed) {
        const { w, h } = spec;
        const L = bitmap(w, h);
        const rnd = rng(seed);
        const blobs = [[w / 2, h * 0.7, w / 2, h * 0.3]];
        const k = Math.max(2, Math.round(w / 11));
        for (let i = 0; i < k; i++) {
            const bx = w * (0.1 + 0.8 * rnd());
            const mid = 1 - Math.abs(bx / w - 0.5) * 2;
            const br = h * (0.22 + 0.42 * mid * (0.55 + 0.45 * rnd()));
            blobs.push([bx, h * 0.72 - br * 0.35, br * (1.7 + rnd() * 1.4), br]);
        }
        const inside = (x, y) => y < Math.floor(h * 0.94) && blobs.some(([cx, cy, rx, ry]) => {
            const dx = (x + 0.5 - cx) / rx;
            const dy = (y + 0.5 - cy) / ry;
            return dx * dx + dy * dy <= 1;
        });
        const ramp = P.cloud.map(u32);
        const n = ramp.length - 1;
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                if (!inside(x, y)) continue;
                const gx = spec.x + x;
                const gy = spec.y + y;
                const ly = y / h;
                const sd = Math.hypot(gx - P.orb.x, (gy - P.orb.y) * 1.4);
                const sun = Math.exp(-(sd * sd) / (68 * 68));
                let v;
                if (P.cloudLight === 'below') {
                    v = n * (0.1 + 0.55 * Math.pow(ly, 1.5)) + sun * n * 0.55;
                    if (!inside(x, y + 1)) v += 1.4 + sun * 1.5;
                } else {
                    v = n * (0.5 - 0.4 * ly) + sun * n * 0.35;
                    if (!inside(x, y - 1)) v += 1.1 + sun * 2;
                }
                v += (noise(gx * 0.18, gy * 0.4, 5) - 0.5) * 1.3;
                L.set(x, y, pick(ramp, v, gx, gy));
            }
        }
        return { c: L.done(), ...spec };
    }

    // -----------------------------------------------------------------
    //  Mt. Fuji
    // -----------------------------------------------------------------
    const FUJI = { cx: 112, top: 84, R: 168, p: 1.55, crater: 5 };

    function fujiTop(x) {
        const d = Math.abs(x + 0.5 - FUJI.cx);
        const dd = Math.max(0, d - FUJI.crater);
        const h = (SEA - FUJI.top) * Math.pow(Math.max(0, 1 - dd / FUJI.R), FUJI.p);
        let y = Math.round(SEA - h);
        if (d < FUJI.crater + 1 && hash(x, 3) > 0.55) y += 1;
        return y;
    }

    function paintFuji(P) {
        const L = bitmap(W + M * 2, SEA);
        const body = P.fuji.map(u32);
        const snow = P.snow.map(u32);
        const sky = expand(P.sky, 3).map(u32);
        for (let x = 0; x < L.w; x++) {
            const gx = x - M;
            const top = fujiTop(gx);
            const d = gx + 0.5 - FUJI.cx;
            const lit = clamp(d / 30, -1, 1);
            for (let y = top; y < SEA; y++) {
                const a = d / (y - FUJI.top + 9);
                const ridge = noise(a * 8, 0, 11) - 0.5 + (noise(a * 21, y * 0.04, 12) - 0.5) * 0.7;
                const fall = Math.max(0, 1 - Math.abs(d) / 96);
                const snowLine = FUJI.top + 14 + Math.max(0, noise(a * 6.5, 0, 21) - 0.32) * 48 * fall + (noise(a * 30, 0, 22) - 0.5) * 3;
                const edge = y - top;
                let col;
                if (y < snowLine) {
                    let v = 2.4 + lit * 2 + ridge * 2.6;
                    if (edge < 1 && d > -2) v += 1.6;
                    col = pick(snow, v, gx, y);
                } else {
                    let v = 1.5 + lit * 1.3 + ridge * 1.8 - (y - snowLine) * 0.012;
                    if (edge < 1 && d > 0) v += 1.6;
                    if (y - snowLine < 2 && th(gx, y) < 0.3) v += 1;
                    col = pick(body, v, gx, y);
                    // mist at the foot of the mountain: blend toward the sky in eight dithered steps
                    const haze = clamp((y - (SEA - 40)) / 40, 0, 1);
                    if (haze > 0) {
                        const q = Math.pow(haze, 1.3) * 0.9 * 8;
                        const lvl = Math.floor(q) + (q - Math.floor(q) > th(gx, y) ? 1 : 0);
                        col = mixU32(col, pick(sky, (skyValue(P, gx, y) - 0.5) * 3, gx, y), lvl / 8);
                    }
                }
                L.set(x, y, col);
            }
        }
        return L.done();
    }

    // -----------------------------------------------------------------
    //  Floating torii (Itsukushima style), lit from the right
    // -----------------------------------------------------------------
    const TORII = { x: 44, y: 139, w: 60, h: 64 };   // its pillars meet the water at y = 202

    function paintTorii(P) {
        const L = bitmap(TORII.w, TORII.h);
        const c = u32Map(P.torii);
        const fill = (x0, y0, x1, y1, col) => {
            for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) L.set(x, y, col);
        };
        // at night floodlights at the waterline light the pillars from below
        const lift = y => (P.toriiLit ? clamp((y - 20) / 40, 0, 1) : 0);
        const pillar = (x0, y0, y1, wide) => {
            for (let y = y0; y <= y1; y++) {
                const g = lift(y);
                for (let i = 0; i < wide; i++) {
                    let col = i === 0 ? c.d : i === wide - 1 ? c.h : i === wide - 2 ? c.R : c.r;
                    if (g > th(i, y) * 1.4 && i > 0 && i < wide - 1) col = c.R;
                    L.set(x0 + i, y, col);
                }
            }
        };
        // side legs and their tie beams (the ryobu frame that lets it stand in the sea)
        pillar(5, 33, 63, 3);
        pillar(52, 33, 63, 3);
        fill(5, 35, 16, 36, c.r);
        fill(43, 35, 54, 36, c.r);
        fill(5, 37, 16, 37, c.d);
        fill(43, 37, 54, 37, c.d);
        // main pillars
        pillar(12, 7, 63, 5);
        pillar(43, 7, 63, 5);
        // nuki (lower beam), poking out past the pillars
        fill(2, 15, 57, 15, c.R);
        fill(2, 16, 57, 16, c.r);
        fill(2, 17, 57, 17, c.d);
        fill(57, 15, 57, 17, c.h);
        // gakuzuka strut + name plaque
        fill(27, 8, 32, 14, c.r);
        fill(32, 8, 32, 14, c.h);
        fill(25, 9, 34, 13, c.k);
        fill(26, 10, 33, 12, c.g);
        fill(27, 11, 32, 11, c.d);
        // shimaki under the top beam
        fill(5, 6, 54, 6, c.r);
        fill(5, 7, 54, 7, c.d);
        // kasagi: the black top beam with swept-up ends
        for (let x = 0; x < TORII.w; x++) {
            const e = Math.abs(x + 0.5 - TORII.w / 2);
            const up = Math.round(3.4 * Math.pow(Math.max(0, (e - 14) / 16), 2));
            const t0 = 3 - up;
            const t1 = 5 - Math.round(up * 0.45);
            for (let y = t0; y <= t1; y++) L.set(x, y, y === t0 ? c.K : c.k);
        }
        return L.done();
    }

    // -----------------------------------------------------------------
    //  The ship on the horizon (straw hat on the jolly roger, naturally)
    // -----------------------------------------------------------------
    const SHIP_ROWS = [
        '...........kk.........',
        '...........kkk........',
        '...........k..........',
        '.......wwwwwwwwww.....',
        '.......wwWWwwwwwW.....',
        '.......wwwyyyywwW.....',
        '.......wwwkkkkwwW.....',
        '.......wwwkwkwwwW.....',
        '.......wwwwkkwwwW.....',
        '.......wwwkwwkwwW.....',
        '........wwwwwwwW......',
        '...........k......k...',
        'ww.........k......k...',
        'wwmmmmmmmmmmmmmmmmmmm.',
        '.mMMMMMyMMMMMyMMMMMMm.',
        '..mMMMMMMMMMMMMMMMMm..',
        '...mmmmmmmmmmmmmmmm...'
    ];

    function paintShip(P) {
        const L = bitmap(SHIP_ROWS[0].length, SHIP_ROWS.length);
        stamp(L, SHIP_ROWS, 0, 0, u32Map(P.ship));
        return L.done();
    }

    // -----------------------------------------------------------------
    //  Cliff-top ground with grass and fallen petals
    // -----------------------------------------------------------------
    const GROUND_TOP = 236;

    function edgeY(gx) {
        let y = 262 + Math.round((noise(gx * 0.07, 0, 31) - 0.5) * 5);
        if (gx < 52) y -= Math.round((52 - gx) * 0.3);
        return y;
    }

    function paintGround(P) {
        const L = bitmap(W + M * 2, H - GROUND_TOP + 4);
        const g = P.ground.map(u32);
        const grass = P.grass.map(u32);
        const petal = P.petal.map(u32);
        for (let x = 0; x < L.w; x++) {
            const gx = x - M;
            const top = edgeY(gx);
            const lit = clamp((gx - 40) / 200, 0, 1);
            // grass blades poking up over the sea
            if (hash(gx, 9) > 0.45) {
                const tall = 1 + Math.floor(hash(gx, 10) * (hash(gx, 11) > 0.8 ? 6 : 3));
                for (let k = 1; k <= tall; k++) L.set(x, top - k - GROUND_TOP, k === tall ? grass[2 + (lit > 0.5 ? 1 : 0)] : grass[1]);
            }
            for (let y = top; y < H + 4; y++) {
                const depth = y - top;
                let v = 3.6 - depth * 0.14 + (fbm(gx * 0.11, y * 0.2, 33) - 0.5) * 2.2 + lit * 0.6;
                let col = pick(g, v, gx, y);
                if (depth === 0) col = pick(grass, 1.6 + lit * 1.6, gx, y);
                else if (depth === 1 && th(gx, y) < 0.5) col = grass[1];
                if (depth > 2 && hash(gx, y, 34) > 0.993) col = petal[hash(gx, y, 35) > 0.5 ? 0 : 2];
                if (depth > 2 && hash(gx - 1, y, 34) > 0.993 && hash(gx, y, 36) > 0.4) col = petal[2];
                L.set(x, y - GROUND_TOP, col);
            }
        }
        return L.done();
    }

    // -----------------------------------------------------------------
    //  Stone lantern (toro). The fire box glows.
    // -----------------------------------------------------------------
    const LANTERN = { x: 199, y: 205, w: 28, h: 60 };

    function paintLantern(P) {
        const L = bitmap(LANTERN.w, LANTERN.h);
        const s = P.stone.map(u32);
        const lamp = P.lamp.map(u32);
        // a stone block: shaded left -> right, rim on the lit right edge
        const block = (x0, y0, x1, y1, topLit = true) => {
            for (let y = y0; y <= y1; y++) {
                for (let x = x0; x <= x1; x++) {
                    const u = (x - x0) / Math.max(1, x1 - x0);
                    let v = 1 + u * 2 + (noise(x * 0.5, y * 0.5, 51) - 0.5) * 1.2;
                    if (x === x1) v = 4.2;
                    if (topLit && y === y0) v += 0.8;
                    L.set(x, y, pick(s, v, x, y));
                }
            }
        };
        const cx = 14;
        // hoju finial
        block(cx - 1, 0, cx, 0);
        block(cx - 2, 1, cx + 1, 2);
        block(cx - 1, 3, cx, 3);
        // kasa roof with upturned corners
        for (let y = 4; y <= 11; y++) {
            const t = (y - 4) / 7;
            const half = Math.round(3 + t * t * 10);
            block(cx - half, y, cx + half - 1, y, y === 4);
        }
        block(cx - 14, 9, cx - 13, 9);
        block(cx + 12, 9, cx + 13, 9);
        for (let x = cx - 12; x < cx + 12; x++) L.set(x, 12, s[0]);
        // fire box with a glowing window
        block(cx - 7, 13, cx + 6, 22);
        for (let y = 15; y <= 20; y++) {
            for (let x = cx - 4; x <= cx + 3; x++) {
                const d = Math.hypot(x + 0.5 - cx, y - 17.5) / 4;
                L.set(x, y, lamp[clamp(2 - Math.floor(d * 2.2), 0, 2)]);
            }
        }
        for (let y = 15; y <= 20; y++) L.set(cx - 1, y, s[1]);
        // platform, shaft with a node ring, base
        block(cx - 9, 23, cx + 8, 25);
        block(cx - 3, 26, cx + 2, 44);
        block(cx - 4, 34, cx + 3, 35);
        block(cx - 8, 45, cx + 7, 49);
        block(cx - 10, 50, cx + 9, 55);
        // a little moss
        [[cx - 6, 45], [cx - 5, 45], [cx - 9, 50], [cx - 8, 50], [cx - 2, 26]].forEach(([x, y]) => L.set(x, y, pick(P.grass.map(u32), 1, x, y)));
        return L.done();
    }

    // -----------------------------------------------------------------
    //  Me: sitting on the edge, back to you, straw hat on
    // -----------------------------------------------------------------
    const FIG = { x: 104, y: 196, w: 64, h: 74, ax: 32, ay: 70 };   // ax/ay: where I sit, inside the sprite

    function paintFigure(P, pose = 0) {
        const L = bitmap(FIG.w, FIG.h);
        const c = u32Map(P.fig);
        const put = (x, y, col) => L.set(FIG.ax + x, FIG.ay + y, col);
        const thick = (x0, y0, x1, y1, r, shade) => {
            const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2);
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const px = x0 + (x1 - x0) * t;
                const py = y0 + (y1 - y0) * t;
                for (let y = Math.floor(py - r); y <= py + r; y++) {
                    for (let x = Math.floor(px - r); x <= px + r; x++) {
                        const dx = x + 0.5 - px;
                        const dy = y + 0.5 - py;
                        if (dx * dx + dy * dy <= r * r) put(x, y, shade(dx / r, dy / r, t));
                    }
                }
            }
        };
        const onLine = (x, y, x0, y0, x1, y1) => {
            const t = clamp(((x - x0) * (x1 - x0) + (y - y0) * (y1 - y0)) / ((x1 - x0) ** 2 + (y1 - y0) ** 2), 0, 1);
            return Math.hypot(x - (x0 + (x1 - x0) * t), y - (y0 + (y1 - y0) * t)) < 0.6;
        };

        // left arm, propped on the ground behind me
        thick(-13, -29, -20.5, -3, 3.1, (u, v) => (u < -0.45 ? c.C : v < -0.5 && u > -0.2 ? c.X : c.c));
        [[-23, -2, 'S'], [-22, -2, 's'], [-21, -2, 's'], [-20, -2, 'z'], [-23, -1, 'S'], [-22, -1, 'S'], [-21, -1, 's'], [-20, -1, 's'], [-22, 0, 'S'], [-21, 0, 'S']]
            .forEach(([x, y, k]) => put(x, y, c[k]));

        // torso: hoodie, shadowed on the left, sky-lit shoulders, warm rim on the right
        const hwAt = t => {
            let hw = t < 6 ? 7 + Math.sqrt(t / 6) * 7.2 : 14.2 - (t - 6) * 0.07;
            if (t > 29) hw += (t - 29) * 0.45;
            return hw;
        };
        const topOf = x => {
            for (let t = 0; t < 34; t++) if (Math.abs(x + 0.5) < hwAt(t)) return t;
            return 34;
        };
        for (let y = -34; y <= 0; y++) {
            const t = y + 34;
            const hw = hwAt(t);
            for (let x = -Math.round(hw); x <= Math.round(hw) - 1; x++) {
                const u = (x + 0.5) / hw;
                const fromTop = t - topOf(x);
                let col = c.c;
                if (u < -0.5) col = c.C;
                if (x === -Math.round(hw) && y > -28) col = c.o;   // my side against the arm behind
                if (fromTop < 2 && u > -0.55) col = c.X;
                if (u > 0.7) col = c.X;
                if (u > 0.88) col = c.x;
                // folds running down from under the arms
                if (onLine(x, y, 9, -27, 4, -12) || onLine(x, y, -9, -26, -6, -11) || onLine(x, y, 4, -12, 3, -8)) col = c.C;
                if (onLine(x, y, 10, -27, 5, -12) && u < 0.7) col = c.X;
                // ribbed hem
                if (y === -4) col = u > 0.86 ? c.x : c.X;
                if (y === -3 || y === -2) col = u > 0.86 ? c.X : (x & 1) ? c.C : c.c;
                put(x, y, col);
            }
        }
        // hood down on my back
        for (let y = -36; y <= -22; y++) {
            for (let x = -10; x <= 9; x++) {
                const dx = (x + 0.5) / 9.4;
                const dy = (y + 29) / 6;
                const d = dx * dx + dy * dy;
                if (d > 1) {
                    if (dy > 0.6 && d < 1.35 && Math.abs(dx) < 0.85) put(x, y, c.C);
                    continue;
                }
                let col = dy < -0.35 ? c.X : c.c;
                if (dx > 0.62) col = d > 0.8 ? c.x : c.X;
                if (dx < -0.55 && dy > -0.3) col = c.C;
                if (d > 0.82 && dy > 0.3) col = c.X;
                put(x, y, col);
            }
        }
        for (let x = -6; x <= 5; x++) {
            put(x, -33, c.C);
            if (Math.abs(x + 0.5) < 4.5) put(x, -32, c.C);
        }

        // right arm, resting forward on my knee (or waving)
        if (pose === 0) {
            thick(13.2, -29, 16.2, -10, 3.2, u => (u > 0.5 ? c.x : u > -0.1 ? c.X : c.c));
        } else {
            const swing = pose === 1 ? -2 : 2;
            thick(13.2, -29, 21, -40, 3, u => (u > 0.45 ? c.x : c.X));
            thick(21, -40, 22 + swing, -52, 2.6, u => (u > 0.45 ? c.x : c.X));
            for (let y = -58; y <= -53; y++) {
                for (let x = 20; x <= 24; x++) {
                    if ((y === -58 && (x === 20 || x === 24)) || (y < -55 && x === 22 && swing < 0)) continue;
                    put(x + swing, y, x === 24 ? c.z : x === 20 ? c.S : c.s);
                }
            }
        }

        // neck
        for (let y = -40; y <= -33; y++) for (let x = -4; x <= 4; x++) put(x, y, x < -2 ? c.S : x === 4 ? c.z : c.s);

        // curls under the brim, poking out at the back and sides
        for (let y = -50; y <= -34; y++) {
            for (let x = -14; x <= 10; x++) {
                const dx = (x + 0.5 + 1.5) / 12.6;
                const dy = (y + 43) / 7.6;
                const ang = Math.atan2(dy, dx);
                const bump = 1 + Math.sin(ang * 11 + 1.3) * 0.07 + Math.sin(ang * 6) * 0.05;
                if (dx * dx + dy * dy > bump * bump) continue;
                if (x >= 9 && y > -43) continue;
                // each curl is a small ring, lit on its upper right
                const row = Math.floor((y + 60) / 3);
                const cx = (((x + 60 + (row & 1 ? 1 : 0) * 1.5) % 3) + 3) % 3;
                const cy = (((y + 60) % 3) + 3) % 3;
                let col = c.A;
                if (cx >= 1.5 && cy < 1) col = x > 4 ? c.Q : c.q;
                else if (cx < 1 && cy >= 2) col = c.a;
                else if (hash(x, y, 71) > 0.86) col = c.q;
                if (dy > 0.6 && hash(x, y, 72) > 0.35) col = c.a;
                if (dx > 0.85 && cy < 2) col = c.Q;
                put(x, y, col);
            }
        }
        [[-15, -44, 'A'], [-15, -42, 'q'], [-15, -41, 'A'], [-14, -38, 'a'], [-13, -37, 'A'], [9, -38, 'A'],
            [-8, -35, 'a'], [-5, -34, 'A'], [-1, -35, 'a'], [3, -34, 'A'], [6, -35, 'a']].forEach(([x, y, k]) => put(x, y, c[k]));

        // my right ear peeking out of the curls, a gold hoop, the edge of the beard
        [[9, -43, 'S'], [10, -43, 's'], [11, -43, 'z'], [9, -42, 's'], [10, -42, 'z'], [11, -42, 'z'], [9, -41, 'S'], [10, -41, 's'], [11, -41, 'z'], [10, -40, 'S']]
            .forEach(([x, y, k]) => put(x, y, c[k]));
        put(11, -39, c.e);
        put(11, -38, c.e);
        put(10, -37, c.e);
        [[9, -40], [8, -39], [9, -39], [8, -38], [9, -38], [8, -37], [9, -37], [7, -36], [8, -36]].forEach(([x, y]) => put(x, y, c.A));
        put(9, -38, c.q);

        // straw hat: brim, then the crown, then the red band
        const ramp = [c.J, c.j, c.H, c.h, c.l];
        const brim = { x: 0.5, y: -48.5, rx: 20.5, ry: 6.3 };
        for (let y = Math.floor(brim.y - brim.ry); y <= brim.y + brim.ry; y++) {
            for (let x = Math.floor(brim.x - brim.rx); x <= brim.x + brim.rx; x++) {
                const ex = (x + 0.5 - brim.x) / brim.rx;
                const ey = (y + 0.5 - brim.y) / brim.ry;
                const rr = Math.sqrt(ex * ex + ey * ey);
                if (rr > 1) continue;
                let v = 1.75 + ex * 1.15 - ey * 0.35 + ((Math.floor(rr * 10) & 1) ? 0.35 : -0.25);
                if (ex < -0.1 && ey > -0.1 && rr < 0.75) v -= 0.5;   // the crown's shadow
                if (rr > 0.86 && ey > 0.2) v = ey > 0.62 ? -0.4 : 0.35;
                if (rr > 0.88 && ey < 0 && ex > 0.1) v = 3.6;
                if (rr > 0.9 && ey < 0 && ex <= 0.1) v += 0.8;
                put(x, y, pick(ramp, v, x + 64, y + 64));
            }
        }
        for (let y = -61; y <= -49; y++) {
            const t = (y + 61) / 12;
            const hw = 9.8 * Math.pow(Math.sin(Math.min(1, t * 1.3) * Math.PI / 2), 0.5);
            for (let x = Math.floor(-hw); x < hw; x++) {
                const u = (x + 0.5) / hw;
                let v = 1.55 + u * 1.35 + (1 - t) * 0.5 + ((y & 1) ? 0.22 : -0.22);
                if (u > 0.8) v = 4;
                else if (t < 0.15 && u > -0.3) v = 3.4;
                let col = pick(ramp, v, x + 64, y + 64);
                if (y >= -53 && y <= -50) col = y === -50 || u < -0.5 ? c.b : u > 0.8 ? c.x : c.B;
                put(x, y, col);
            }
        }
        // selective outline: a dark edge on the shadowed left of every shape
        const edge = [];
        for (let y = 0; y < FIG.h; y++) {
            for (let x = 0; x < FIG.w - 1; x++) {
                if (!L.has(x, y) && L.has(x + 1, y)) edge.push([x, y]);
            }
        }
        edge.forEach(([x, y]) => L.set(x, y, c.o));
        return L.done();
    }

    // my controller, left on the grass (the light blinks)
    const PAD = { x: 88, y: 260 };
    const PAD_ROWS = [
        '.oooo.oooo.',
        'oGLLLoLLLwo',
        'oGkGLLLsLRo',
        'oDGGDDDGGLo',
        '.oDo...oDo.'
    ];

    function paintPad(P) {
        const L = bitmap(PAD_ROWS[0].length, PAD_ROWS.length);
        stamp(L, PAD_ROWS, 0, 0, { ...u32Map(P.robot), s: u32('#73eff7'), R: u32('#e0433f') });
        return L.done();
    }

    // -----------------------------------------------------------------
    //  Robot buddy (looking at the sunset with me)
    // -----------------------------------------------------------------
    const ROBOT = { x: 167, y: 240, w: 17, h: 23 };
    const ROBOT_ROWS = [
        '........y........',
        '.......yoy.......',
        '........o........',
        '........o........',
        '...ooooooooooo...',
        '..oGGGLLLLLLLwo..',
        '..oGGLLLLLLLLLwo.',
        '..oDGGkkkkkkkkkwo',
        '..oDGkkkkkkkcckco',
        '..oDGkkkkkkkcCkco',
        '..oDGGkkkkkkkkkko',
        '..oDDGGGGGGGGGLo.',
        '...ooooooooooooo.',
        '......ooDGGoo....',
        '....oooGGGGLooo..',
        '...oDGGGGGLLLLwo.',
        '...oDGGGyyGLLLLo.',
        '...oDGGGyyGLLLLo.',
        '...oDDGGGGGGGGLo.',
        '...oooooooooooo..',
        '..okkkkkkkkkkkko.',
        '..okDkDkDkDkDkko.',
        '...ooooooooooooo.'
    ];
    function paintRobot(P, blink) {
        const L = bitmap(ROBOT.w, ROBOT.h);
        const pal = u32Map(P.robot);
        if (blink) {
            pal.c = pal.k;
            pal.C = pal.k;
            pal.y = u32('#ff6a6a');
        }
        stamp(L, ROBOT_ROWS, 0, 0, pal);
        return L.done();
    }

    // -----------------------------------------------------------------
    //  Sakura tree framing the left side
    // -----------------------------------------------------------------
    const BRANCHES = [
        [[16, 312, 6.2], [19, 276, 5.2], [25, 240, 4.6], [23, 206, 4], [30, 172, 3.5], [40, 138, 3], [52, 106, 2.5], [70, 76, 2], [92, 50, 1.6], [118, 28, 1.3], [146, 12, 1]],
        [[24, 214, 3], [12, 176, 2.4], [4, 140, 2], [-6, 108, 1.5]],
        [[40, 142, 2.6], [28, 100, 2.2], [24, 62, 1.8], [32, 26, 1.4], [42, -6, 1.1]],
        [[52, 108, 2], [70, 102, 1.6], [86, 106, 1.3], [96, 114, 1]],
        [[70, 78, 1.6], [64, 44, 1.4], [76, 12, 1.1]],
        [[92, 52, 1.3], [112, 50, 1.1], [130, 44, 0.9]],
        [[30, 176, 2], [46, 164, 1.5], [58, 166, 1.1]]
    ];
    // [x, y, radius, depth]: depth 0 is the far side of the canopy
    const BLOSSOMS = [
        [4, 4, 17, 0], [30, -2, 15, 0], [58, 4, 13, 0], [86, 2, 12, 0], [112, 4, 11, 0], [138, 0, 10, 0],
        [-4, 34, 15, 0], [20, 30, 14, 1], [46, 26, 13, 1], [72, 24, 11, 1], [98, 22, 10, 1], [124, 20, 9, 1], [150, 8, 8, 1],
        [-6, 62, 14, 1], [18, 58, 12, 2], [42, 54, 10, 2], [66, 50, 9, 2], [86, 40, 8, 2],
        [-8, 92, 13, 1], [10, 88, 10, 2], [-6, 122, 11, 2], [6, 116, 8, 3],
        [36, 82, 8, 3], [58, 76, 7, 3], [60, 103, 6, 2], [68, 99, 5.5, 3], [76, 101, 5, 3], [84, 105, 4.5, 3], [91, 110, 4, 3],
        [14, 10, 10, 3], [40, 12, 9, 3], [64, 30, 7, 3], [108, 30, 7, 3], [132, 22, 6, 3],
        [-2, 150, 9, 2], [10, 144, 7, 3], [40, 167, 5, 3], [47, 163, 5, 3], [54, 165, 4.5, 3], [59, 168, 3.5, 3], [28, 128, 6, 3]
    ];

    // The tree's shape and shading don't depend on the palette, so they're worked
    // out once: per pixel, which ramp (1 bark, 2 blossom) and where on it (a float).
    let treeShape = null;
    function shapeTree() {
        if (treeShape) return treeShape;
        const w = W + M * 2;
        const kind = new Uint8Array(w * H);
        const val = new Float32Array(w * H);
        const put = (x, y, k, v) => {
            const i = y * w + x + M;
            if (x + M >= 0 && x + M < w && y >= 0 && y < H) {
                kind[i] = k;
                val[i] = v;
            }
        };

        BRANCHES.forEach((pts, bi) => {
            for (let s = 0; s < pts.length - 1; s++) {
                const [x0, y0, r0] = pts[s];
                const [x1, y1, r1] = pts[s + 1];
                const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2);
                for (let i = 0; i <= steps; i++) {
                    const t = i / steps;
                    const px = x0 + (x1 - x0) * t + Math.sin((s + t) * 2.4 + bi) * 0.8;
                    const py = y0 + (y1 - y0) * t;
                    const r = r0 + (r1 - r0) * t;
                    for (let y = Math.floor(py - r); y <= py + r; y++) {
                        for (let x = Math.floor(px - r); x <= px + r; x++) {
                            const dx = x + 0.5 - px;
                            const dy = y + 0.5 - py;
                            if (dx * dx + dy * dy > r * r) continue;
                            const u = dx / Math.max(r, 0.8);
                            let v = 1.4 + u * 1.6 + (noise(x * 0.3, y * 0.9, 81) - 0.5) * 1.2;
                            if (u > 0.62 && r > 1.2) v = 4.6;
                            // sakura bark has horizontal lenticels
                            if (r > 3 && hash(Math.floor(x / 3), y, 82) > 0.86 && Math.abs(u) < 0.6) v += 1.2;
                            put(x, y, 1, v);
                        }
                    }
                }
            }
        });

        // blossoms: the clusters melt into one canopy (a metaball field), shaded by
        // the field's normal, with lumpy sub-clusters and loose flowers at the rim
        const X0 = -M;
        const X1 = 176;
        const Y1 = 182;
        const CELL = 8;
        const cols = Math.ceil((X1 - X0) / CELL);
        const cells = Array.from({ length: cols * Math.ceil(Y1 / CELL) }, () => []);
        BLOSSOMS.forEach(b => {
            const reach = b[2] * 1.62;
            for (let cy = Math.max(0, Math.floor((b[1] - reach) / CELL)); cy <= Math.floor((b[1] + reach) / CELL) && cy * CELL < Y1; cy++) {
                for (let cx = Math.max(0, Math.floor((b[0] - reach - X0) / CELL)); cx <= Math.floor((b[0] + reach - X0) / CELL) && cx < cols; cx++) cells[cy * cols + cx].push(b);
            }
        });
        const lumps = new Float32Array((X1 - X0) * (Y1 + 4));
        for (let y = -2; y < Y1 + 2; y++) for (let x = X0; x < X1; x++) lumps[(y + 2) * (X1 - X0) + x - X0] = noise(x / 4.2, y / 4.2, 95);
        const lump = (x, y) => lumps[(y + 2) * (X1 - X0) + x - X0];
        const light = { x: 0.78, y: -0.42 };
        for (let y = 0; y < Y1; y++) {
            for (let x = X0; x < X1; x++) {
                const near = cells[Math.floor(y / CELL) * cols + Math.floor((x - X0) / CELL)];
                if (!near.length) continue;
                let f = 0;
                let depth = 0;
                let nx = 0;
                let ny = 0;
                for (const [bx, by, br, d] of near) {
                    const dx = x + 0.5 - bx;
                    const dy = y + 0.5 - by;
                    const q = (dx * dx + dy * dy) / (br * br);
                    if (q > 2.6) continue;
                    const wgt = Math.exp(-q * 1.7);
                    f += wgt;
                    depth += d * wgt;
                    nx += (dx / br) * wgt;
                    ny += (dy / br) * wgt;
                }
                if (f < 0.05) continue;
                const edge = 0.3 + (noise(x * 0.32, y * 0.32, 90) - 0.5) * 0.3 + (noise(x * 0.85, y * 0.85, 94) - 0.5) * 0.2;
                if (f < edge) {
                    // loose blossoms floating just outside the canopy
                    if (f > edge * 0.55 && hash(x, y, 96) > 0.9) put(x, y, 2, hash(x, y, 97) > 0.5 ? 4 : 3);
                    continue;
                }
                if (f < edge + 0.12 && noise(x * 0.7, y * 0.7, 91) > 0.64) continue;
                depth /= f;
                const nl = Math.hypot(nx, ny) || 1;
                const lit = ((nx / nl) * light.x + (ny / nl) * light.y) * Math.min(1, nl / f);
                const top = (lump(x, y + 2) - lump(x, y - 2)) * 3.4;
                let v = 1.3 + depth * 0.55 + lit * 1.7 + top + (lump(x, y) - 0.5) * 1.2 + (noise(x * 0.6, y * 0.6, 92) - 0.5) * 0.9;
                if (f < edge + 0.1 && lit > 0.1) v += 1.3;
                const h = hash(x, y, 93);
                if (h > 0.95) v += 1.6;
                else if (h < 0.035) v -= 1.6;
                put(x, y, 2, v);
            }
        }
        treeShape = { kind, val, w };
        return treeShape;
    }

    function paintTree(P) {
        const { kind, val, w } = shapeTree();
        const L = bitmap(w, H);
        const ramps = [null, P.bark.map(u32), P.bloom.map(u32)];
        for (let i = 0; i < kind.length; i++) {
            if (kind[i]) L.buf[i] = pick(ramps[kind[i]], val[i], (i % w) - M, Math.floor(i / w));
        }
        return L.done();
    }

    // -----------------------------------------------------------------
    //  Sea tint: a dithered darkening that deepens toward the shore
    // -----------------------------------------------------------------
    function paintTint(P) {
        const L = bitmap(W, H - SEA);
        const [r, g, b] = hexRgb(P.tint);
        const levels = [0, 0.33, 0.66, 1].map(k => {
            const a = Math.round((P.tintFar + (P.tintNear - P.tintFar) * k) * 255);
            return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;
        });
        for (let y = 0; y < L.h; y++) {
            const v = Math.pow(y / (L.h - 1), 0.7) * 3;
            for (let x = 0; x < W; x++) L.set(x, y, pick(levels, v, x, y));
        }
        return L.done();
    }

    // vermilion seal in the corner: ノア (Noah) in katakana
    function paintSeal() {
        const rows = [
            'rrrrrrrrr',
            'r.......r',
            'r.....w.r',
            'r....w..r',
            'r....w..r',
            'r...w...r',
            'r.ww....r',
            'r.......r',
            'r.wwwww.r',
            'r.....w.r',
            'r...ww..r',
            'r...w...r',
            'r...w...r',
            'r..w....r',
            'r.......r',
            'rrrrrrrrr'
        ].map(row => row.replace(/\./g, 'r').replace(/w/g, '.'));
        const L = bitmap(9, 16);
        stamp(L, rows, 0, 0, { r: u32('#c8362f') });
        [[0, 0], [8, 15], [8, 6], [0, 11]].forEach(([x, y]) => L.set(x, y, 0));
        return L.done();
    }

    // -----------------------------------------------------------------
    //  Build (and cache) every static layer for a mode
    // -----------------------------------------------------------------
    const built = {};
    function layersFor(mode) {
        if (built[mode]) return built[mode];
        const P = MODES[mode];
        const seed = mode === 'dusk' ? 11 : 23;
        built[mode] = {
            P,
            sky: paintSky(P),
            stars: makeStars(P),
            back: CLOUDS.back.map((s, i) => paintCloud(P, s, seed + i)),
            front: CLOUDS.front.map((s, i) => paintCloud(P, s, seed + 40 + i)),
            fuji: paintFuji(P),
            torii: paintTorii(P),
            ship: paintShip(P),
            ground: paintGround(P),
            lantern: paintLantern(P),
            lampGlow: paintGlow(26, P.lamp[1], P.lampGlow),
            figure: [0, 1, 2].map(pose => paintFigure(P, pose)),
            robot: [paintRobot(P, false), paintRobot(P, true)],
            pad: paintPad(P),
            tree: paintTree(P),
            tint: paintTint(P),
            petal: P.petal
        };
        return built[mode];
    }
    const seal = paintSeal();
    const flash = paintGlow(14, '#fff2d0', 0.7);

    // -----------------------------------------------------------------
    //  Live state: particles, pointer, the time of day
    // -----------------------------------------------------------------
    const ctx = canvas.getContext('2d');
    const upper = document.createElement('canvas');
    upper.width = W;
    upper.height = SEA;
    const uctx = upper.getContext('2d');
    const fadeCanvas = document.createElement('canvas');
    fadeCanvas.width = W;
    fadeCanvas.height = H;
    const fctx = fadeCanvas.getContext('2d');
    // 4x4 Bayer tiles (as patterns) for the dither-dissolve between modes
    const masks = [];
    const maskFor = k => {
        if (!masks[k]) {
            const L = bitmap(4, 4);
            for (let i = 0; i < 16; i++) if (BAYER[i] < k) L.set(i & 3, i >> 2, 0xff000000);
            masks[k] = fctx.createPattern(L.done(), 'repeat');
        }
        return masks[k];
    };

    const state = {
        mode: 'dusk',
        fade: null,
        t: 0,
        px: 0,
        py: 0,
        tx: 0,
        ty: 0,
        petals: [],
        shells: [],
        sparks: [],
        flashes: [],
        ripples: [],
        wave: 0,
        robotBeep: 0,
        meteor: null,
        nextMeteor: 3,
        nextAutoHanabi: 4
    };
    const rnd = rng(2026);

    const flies = Array.from({ length: 16 }, (_, i) => ({ x: 20 + rnd() * 200, y: 196 + rnd() * 90, p: rnd() * 6.28, s: 0.4 + rnd() * 0.6, i }));
    const birds = Array.from({ length: 4 }, (_, i) => ({ x: 150 + i * 17 + rnd() * 8, y: 66 + rnd() * 18, p: rnd() * 6.28, s: 3 + rnd() * 1.5 }));

    function spawnPetal(anywhere) {
        const b = BLOSSOMS[Math.floor(rnd() * BLOSSOMS.length)];
        state.petals.push({
            x: anywhere ? rnd() * W : b[0] + (rnd() - 0.5) * b[2],
            y: anywhere ? rnd() * H : b[1] + (rnd() - 0.5) * b[2],
            vx: 0,
            vy: 0,
            p: rnd() * 6.28,
            k: rnd() > 0.7 ? 1 : 0
        });
    }
    for (let i = 0; i < 26; i++) spawnPetal(true);

    function launch(x, y) {
        const colors = HANABI[Math.floor(rnd() * HANABI.length)];
        state.shells.push({ x, y: SEA - 1, ty: y, colors, vy: -(SEA - y) * 1.5 - 40 });
    }

    // kiku (chrysanthemum) bursts with trails, or botan (peony) bursts of dots,
    // each with a smaller heart in a second color
    function burst(shell) {
        const { x, ty: y, colors } = shell;
        const kiku = rnd() > 0.4;
        const count = 54 + Math.floor(rnd() * 20);
        const speed = 56 + rnd() * 26;
        for (let i = 0; i < count; i++) {
            const a = (i / count) * Math.PI * 2 + rnd() * 0.06;
            const s = speed * (kiku ? 0.9 + rnd() * 0.14 : 0.55 + rnd() * 0.5);
            state.sparks.push({ x, y, trail: [], vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0, max: 1.5 + rnd() * 0.7, colors, kiku });
        }
        const inner = HANABI[Math.floor(rnd() * HANABI.length)];
        for (let i = 0; i < 22; i++) {
            const a = (i / 22) * Math.PI * 2;
            state.sparks.push({ x, y, trail: [], vx: Math.cos(a) * speed * 0.42, vy: Math.sin(a) * speed * 0.42, life: 0, max: 1, colors: inner, kiku: false });
        }
        state.flashes.push({ x, y, age: 0, color: colors[1] });
    }

    // -----------------------------------------------------------------
    //  One frame
    // -----------------------------------------------------------------
    const off = depth => Math.round(-state.px * 5 * depth);
    const offY = depth => Math.round(-state.py * 2 * depth);

    function drawScene(c, layers, dt) {
        const { P } = layers;
        const t = state.t;

        // --- above the horizon (also the source of the sea reflection)
        uctx.drawImage(layers.sky, 0, 0);
        layers.stars.forEach(s => {
            const tw = 0.5 + 0.5 * Math.sin(t * (0.8 + s.b * 2.4) + s.p);
            if (tw < 0.2) return;
            uctx.globalAlpha = 0.35 + tw * 0.65 * (0.4 + s.b * 0.6);
            uctx.fillStyle = s.c;
            uctx.fillRect(s.x, s.y, 1, 1);
            if (s.b > 0.86 && tw > 0.8) {
                uctx.globalAlpha *= 0.5;
                uctx.fillRect(s.x - 1, s.y, 3, 1);
                uctx.fillRect(s.x, s.y - 1, 1, 3);
            }
        });
        uctx.globalAlpha = 1;
        if (state.meteor) {
            // a shooting star: bright head, fading tail
            const m = state.meteor;
            const k = m.age / 0.8;
            for (let i = 0; i < 14; i++) {
                uctx.globalAlpha = (1 - i / 14) * (k < 0.75 ? 1 : (1 - k) * 4);
                uctx.fillStyle = i < 2 ? '#ffffff' : '#c8d4ee';
                uctx.fillRect(Math.round(m.x - m.vx * i * 0.012), Math.round(m.y - m.vy * i * 0.012), 1, 1);
            }
            uctx.globalAlpha = 1;
        }
        const drift = (cl, depth) => {
            const span = W + cl.w + 40;
            const x = ((((cl.x + 20 + cl.w + t * cl.speed) % span) + span) % span) - cl.w - 20 + off(depth);
            uctx.drawImage(cl.c, Math.round(x), cl.y);
        };
        layers.back.forEach(cl => drift(cl, 0.12));
        uctx.drawImage(layers.fuji, -M + off(0.2), 0);
        layers.front.forEach(cl => drift(cl, 0.3));
        if (P.bird) {
            uctx.fillStyle = P.bird;
            birds.forEach(b => {
                const x = Math.round(((b.x - t * b.s) % 300 + 300) % 300 - 30 + off(0.25));
                const y = Math.round(b.y + Math.sin(t * 0.7 + b.p) * 2);
                const up = Math.sin(t * 7 + b.p) > 0;
                uctx.fillRect(x, y + (up ? 0 : 1), 1, 1);
                uctx.fillRect(x + 1, y + 1, 1, 1);
                uctx.fillRect(x + 2, y + (up ? 0 : 1), 1, 1);
                if (up) {
                    uctx.fillRect(x - 1, y - 1, 1, 1);
                    uctx.fillRect(x + 3, y - 1, 1, 1);
                }
            });
        }
        // hanabi
        state.shells.forEach(s => {
            uctx.fillStyle = s.colors[0];
            uctx.fillRect(Math.round(s.x), Math.round(s.y), 1, 2);
            uctx.globalAlpha = 0.5;
            uctx.fillStyle = s.colors[1];
            uctx.fillRect(Math.round(s.x), Math.round(s.y) + 2, 1, 3);
            uctx.globalAlpha = 1;
        });
        state.flashes.forEach(f => {
            const k = f.age / 0.25;
            uctx.globalCompositeOperation = 'lighter';
            uctx.globalAlpha = (1 - k) * 0.9;
            uctx.drawImage(flash, Math.round(f.x) - 14, Math.round(f.y) - 14);
            uctx.globalCompositeOperation = 'source-over';
        });
        state.sparks.forEach(p => {
            const k = p.life / p.max;
            if (k > 0.72 && hash(Math.floor(p.x * 7), Math.floor(t * 20), 5) > 0.5) return;   // crackle
            const fade = k < 0.7 ? 1 : (1 - k) / 0.3;
            if (p.kiku) {
                p.trail.forEach(([x, y], i) => {
                    uctx.globalAlpha = fade * (0.25 + (i / p.trail.length) * 0.5);
                    uctx.fillStyle = p.colors[2];
                    uctx.fillRect(x, y, 1, 1);
                });
            }
            uctx.globalAlpha = fade;
            uctx.fillStyle = p.colors[k < 0.3 ? 0 : k < 0.65 ? 1 : 2];
            uctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
        });
        uctx.globalAlpha = 1;

        c.drawImage(upper, 0, 0);

        // --- the sea: mirrored rows of the sky, rippling more toward the shore
        for (let y = SEA; y < H; y++) {
            const k = (y - SEA) / (H - SEA);
            const src = Math.max(0, 2 * SEA - y - 1);
            const dx = Math.round(Math.sin(y * 0.9 + t * 1.9) * (0.35 + k * 2.4) + Math.sin(y * 0.31 - t * 1.2) * k * 1.6);
            c.drawImage(upper, 0, src, W, 1, dx, y, W, 1);
            if (dx > 0) c.drawImage(upper, 0, src, dx, 1, 0, y, dx, 1);
            if (dx < 0) c.drawImage(upper, W + dx, src, -dx, 1, W + dx, y, -dx, 1);
        }
        c.drawImage(layers.tint, 0, SEA);
        c.fillStyle = P.horizon;
        c.globalAlpha = 0.55;
        c.fillRect(0, SEA, W, 1);
        c.globalAlpha = 1;

        // wave texture: short dark troughs with a lit crest, drifting slowly
        for (let i = 0; i < 36; i++) {
            const y = SEA + 3 + Math.floor(Math.pow(hash(i, 1, 61), 0.8) * 86);
            const k = (y - SEA) / 92;
            const len = 3 + Math.floor(hash(i, 2, 61) * (4 + k * 14));
            const span = W + 40;
            const x = Math.round((((hash(i, 3, 61) * span + t * (1.2 + k * 2.4) * (i & 1 ? 1 : -1)) % span) + span) % span) - 20;
            c.globalAlpha = 0.3 + k * 0.25;
            c.fillStyle = P.tint;
            c.fillRect(x, y, len, 1);
            c.globalAlpha = 0.16 + k * 0.16;
            c.fillStyle = P.glint[2];
            c.fillRect(x + 1, y - 1, Math.max(1, len - 2), 1);
        }
        c.globalAlpha = 1;

        // fishing boats' lights far out at night
        if (P.boats) {
            [[8, 0], [64, 1], [134, 0], [158, 1], [229, 1]].forEach(([bx, low], i) => {
                const x = bx + off(0.4);
                c.fillStyle = '#ffd27a';
                c.globalAlpha = Math.sin(t * 1.3 + i * 2.1) > -0.6 ? 1 : 0.45;
                c.fillRect(x, SEA - 1 + low, 1, 1);
                c.globalAlpha = 0.4;
                for (let r = 2; r < 10; r += 2) c.fillRect(x + Math.round(Math.sin(t * 2 + r) * 0.6), SEA + low + r, 1, 1);
            });
            c.globalAlpha = 1;
        }

        // glitter path under the sun / moon
        const ox = P.orb.x + off(0.05);
        for (let y = SEA + 1; y < 262; y++) {
            const k = (y - SEA) / 92;
            if (hash(y, 0, 3) < 0.35) continue;
            const spread = 3 + k * 30;
            const n = noise(y * 0.5, t * 0.7, 4) - 0.5;
            const x = Math.round(ox + n * spread * 1.6);
            const len = 1 + Math.floor(noise(y * 0.8, t * 1.3, 6) * (2 + k * 7));
            const flicker = Math.sin(t * 4 + y * 1.7);
            if (flicker < -0.3) continue;
            c.fillStyle = P.glint[flicker > 0.6 ? 0 : 1];
            c.fillRect(x - (len >> 1), y, len, 1);
            if (k > 0.3 && hash(y, Math.floor(t * 3), 8) > 0.55) {
                c.fillStyle = P.glint[2];
                c.fillRect(Math.round(ox + (hash(y, 1, 9) - 0.5) * spread * 3.4), y, 2, 1);
            }
        }

        // ripples from taps on the water
        state.ripples.forEach(r => {
            const k = r.age / 1.6;
            [0, 0.35].forEach(lag => {
                const kk = k - lag;
                if (kk <= 0 || kk >= 1) return;
                const rx = 2 + kk * 22;
                const ry = rx * 0.28;
                c.globalAlpha = (1 - kk) * 0.9;
                c.fillStyle = P.glint[1];
                for (let a = 0; a < 64; a++) {
                    const ang = (a / 64) * Math.PI * 2;
                    c.fillRect(Math.round(r.x + Math.cos(ang) * rx), Math.round(r.y + Math.sin(ang) * ry), 1, 1);
                }
            });
            c.globalAlpha = 1;
        });

        // --- torii, its reflection, foam at its feet
        const tx = TORII.x + off(0.5);
        const base = TORII.y + TORII.h;
        c.globalAlpha = P.toriiLit ? 0.62 : 0.5;
        for (let r = 0; r < TORII.h; r++) {
            const y = base + r;
            if (y >= H) break;
            const dx = Math.round(Math.sin(y * 0.55 + t * 1.6) * (0.3 + r * 0.022) + Math.sin(y * 1.7 - t * 2.4) * 0.35);
            c.drawImage(layers.torii, 0, TORII.h - 1 - r, TORII.w, 1, tx + dx, y, TORII.w, 1);
        }
        c.globalAlpha = 1;
        c.drawImage(layers.torii, tx, TORII.y);
        c.fillStyle = P.glint[1];
        [[6, 3], [12, 5], [43, 5], [52, 3]].forEach(([x, w], i) => {
            const wob = Math.round(Math.sin(t * 2.2 + i * 1.7) * 1.2);
            c.globalAlpha = 0.65;
            c.fillRect(tx + x - 1 + wob, base, w + 2, 1);
            c.globalAlpha = 0.35;
            c.fillRect(tx + x - 2 - wob, base + 2, w + 4, 1);
        });
        c.globalAlpha = 1;

        // --- the ship, sailing right to left along the horizon
        const sx = Math.round(((250 - t * 2.4) % 320 + 320) % 320 - 40 + off(0.4));
        const sy = SEA - 13 + Math.round(Math.sin(t * 1.4) * 0.5);
        c.globalAlpha = 0.4;
        for (let r = 0; r < 6; r++) c.drawImage(layers.ship, 0, 16 - r, 22, 1, sx + Math.round(Math.sin(t * 2 + r) * 0.7), sy + 17 + r, 22, 1);
        c.globalAlpha = 1;
        c.drawImage(layers.ship, sx, sy);

        // --- foreground
        const gx = off(0.85);
        const gy = offY(0.85);
        c.drawImage(layers.ground, -M + gx, GROUND_TOP + gy);
        c.globalCompositeOperation = 'lighter';
        const glowPulse = 0.85 + Math.sin(t * 3.1) * 0.08 + Math.sin(t * 7.3) * 0.05;
        c.globalAlpha = glowPulse;
        c.drawImage(layers.lampGlow, LANTERN.x + 14 - 26 + gx, LANTERN.y + 18 - 26 + gy);
        c.globalAlpha = 1;
        c.globalCompositeOperation = 'source-over';
        c.drawImage(layers.lantern, LANTERN.x + gx, LANTERN.y + gy);

        const breathe = Math.sin(t * 1.6) > 0.7 ? -1 : 0;
        const pose = state.wave > 0 ? 1 + (Math.floor(state.wave * 6) & 1) : 0;
        c.drawImage(layers.pad, PAD.x + gx, PAD.y + gy);
        if (Math.sin(t * 2.6) > 0.4) {
            c.fillStyle = '#a7f070';
            c.fillRect(PAD.x + 5 + gx, PAD.y + 1 + gy, 1, 1);
        }
        c.drawImage(layers.robot[state.robotBeep > 0 && Math.floor(state.robotBeep * 8) & 1 ? 1 : 0], ROBOT.x + gx, ROBOT.y + gy - (state.robotBeep > 0.5 ? 1 : 0));
        if (breathe && pose === 0) {
            // breathing: lift everything above the waist by a pixel
            c.drawImage(layers.figure[0], 0, 0, FIG.w, FIG.ay - 6, FIG.x + gx, FIG.y + gy - 1, FIG.w, FIG.ay - 6);
            c.drawImage(layers.figure[0], 0, FIG.ay - 6, FIG.w, FIG.h - FIG.ay + 6, FIG.x + gx, FIG.y + gy + FIG.ay - 6, FIG.w, FIG.h - FIG.ay + 6);
        } else {
            c.drawImage(layers.figure[pose], FIG.x + gx, FIG.y + gy);
        }

        // fireflies at night
        if (P.fireflies) {
            flies.forEach(f => {
                const glow = Math.pow(Math.max(0, Math.sin(t * f.s * 1.8 + f.p)), 3);
                if (glow < 0.05) return;
                const x = Math.round(f.x + Math.sin(t * 0.37 * f.s + f.p) * 14 + gx);
                const y = Math.round(f.y + Math.sin(t * 0.53 * f.s + f.i) * 8 + gy);
                c.globalAlpha = glow * 0.35;
                c.fillStyle = '#c8ff6a';
                c.fillRect(x - 1, y, 3, 1);
                c.fillRect(x, y - 1, 1, 3);
                c.globalAlpha = glow;
                c.fillStyle = '#f2ffb0';
                c.fillRect(x, y, 1, 1);
            });
            c.globalAlpha = 1;
        }

        c.drawImage(layers.tree, -M + off(1.15), offY(1.1));

        // petals drifting on the breeze
        state.petals.forEach(p => {
            const spin = Math.sin(p.p + t * 3.2);
            c.fillStyle = layers.petal[p.k ? 1 : spin > 0.2 ? 0 : 2];
            const x = Math.round(p.x + off(1.3));
            const y = Math.round(p.y);
            if (spin > 0.55) c.fillRect(x, y, 2, 1);
            else if (spin < -0.55) c.fillRect(x, y, 1, 2);
            else c.fillRect(x, y, 1, 1);
        });

        c.drawImage(seal, W - 15, H - 23);
    }

    function step(dt) {
        state.t += dt;
        state.px += (state.tx - state.px) * Math.min(1, dt * 4);
        state.py += (state.ty - state.py) * Math.min(1, dt * 4);
        state.wave = Math.max(0, state.wave - dt);
        state.robotBeep = Math.max(0, state.robotBeep - dt);

        const wind = 7 + Math.sin(state.t * 0.4) * 4;
        if (state.petals.length < 40 && rnd() < dt * 2.2) spawnPetal(false);
        state.petals = state.petals.filter(p => {
            p.vx += (wind - p.vx) * dt * 1.5;
            p.vy += (9 - p.vy) * dt * 1.5;
            if (pointer.inside) {
                const dx = p.x - pointer.x;
                const dy = p.y - pointer.y;
                const d2 = dx * dx + dy * dy;
                if (d2 < 400) {
                    const f = (1 - d2 / 400) * 120 * dt;
                    const d = Math.sqrt(d2) || 1;
                    p.vx += (dx / d) * f * 6;
                    p.vy += (dy / d) * f * 6;
                }
            }
            p.x += (p.vx + Math.sin(state.t * 2.3 + p.p) * 6) * dt;
            p.y += p.vy * dt;
            return p.x < W + 8 && p.y < H + 4 && p.x > -20;
        });

        state.shells = state.shells.filter(s => {
            s.y += s.vy * dt;
            s.vy += 30 * dt;
            if (s.y <= s.ty || s.vy >= 0) {
                burst(s);
                return false;
            }
            return true;
        });
        state.flashes = state.flashes.filter(f => (f.age += dt) < 0.25);
        state.sparks = state.sparks.filter(p => {
            p.life += dt;
            if (p.kiku) {
                const last = p.trail[p.trail.length - 1];
                const x = Math.round(p.x);
                const y = Math.round(p.y);
                if (!last || last[0] !== x || last[1] !== y) p.trail.push([x, y]);
                if (p.trail.length > 5) p.trail.shift();
            }
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vx *= 1 - dt * 2.1;
            p.vy = p.vy * (1 - dt * 2.1) + 16 * dt;
            return p.life < p.max;
        });
        state.ripples = state.ripples.filter(r => (r.age += dt) < 2.2);

        if (state.meteor) {
            const m = state.meteor;
            m.age += dt;
            m.x += m.vx * dt;
            m.y += m.vy * dt;
            if (m.age > 0.8) state.meteor = null;
        }
        if (state.mode === 'night' && runner.visible) {
            state.nextMeteor -= dt;
            if (state.nextMeteor <= 0) {
                const dir = rnd() > 0.5 ? 1 : -1;
                state.meteor = { x: 110 + rnd() * 110, y: 6 + rnd() * 40, vx: dir * (110 + rnd() * 60), vy: 45 + rnd() * 30, age: 0 };
                state.nextMeteor = 5 + rnd() * 9;
            }
            state.nextAutoHanabi -= dt;
            if (state.nextAutoHanabi <= 0) {
                launch(70 + rnd() * 150, 30 + rnd() * 70);
                state.nextAutoHanabi = 3.5 + rnd() * 5;
            }
        }
    }

    function render(dt = 0) {
        step(dt);
        const now = layersFor(state.mode);
        drawScene(ctx, now, dt);
        if (state.fade) {
            // dither-dissolve from the old palette to the new one
            const k = (performance.now() - state.fade.start) / 650;
            if (k >= 1) {
                state.fade = null;
            } else {
                fctx.globalCompositeOperation = 'source-over';
                fctx.clearRect(0, 0, W, H);
                drawScene(fctx, layersFor(state.fade.from), 0);
                fctx.globalCompositeOperation = 'destination-in';
                fctx.fillStyle = maskFor(Math.round((1 - k) * 16));
                fctx.fillRect(0, 0, W, H);
                ctx.drawImage(fadeCanvas, 0, 0);
            }
        }
    }

    // -----------------------------------------------------------------
    //  Loop: ~30 fps while on screen, still under reduced motion
    // -----------------------------------------------------------------
    let started = false;   // layers are only built once the portrait nears the viewport
    const runner = loop(canvas, render, {
        margin: '300px',
        onVisible() {
            started = true;
            // build the other time of day while the browser is idle, so the switch is instant
            const later = window.requestIdleCallback || (fn => setTimeout(fn, 1500));
            later(() => layersFor(state.mode === 'dusk' ? 'night' : 'dusk'));
            if (reducedMotion) render(0);
        }
    });
    function nudge() {
        // one-off redraw for reduced motion (a tap, a mode switch)
        if (reducedMotion) render(0);
    }
    // reduced motion: nothing animates, but a tap still leaves a still frame of what it set off
    function still(seconds) {
        for (let i = 0; i < seconds * 30; i++) step(1 / 30);
        render(0);
    }

    // -----------------------------------------------------------------
    //  Crisp sizing: whole device pixels per art pixel when that fits
    // -----------------------------------------------------------------
    const frameEl = root.querySelector('[data-portrait-frame]') || canvas.parentElement;
    function fit() {
        const avail = root.clientWidth;
        if (avail) frameEl.style.width = `${crispWidth(avail, W)}px`;
    }
    fit();
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(root);
    else window.addEventListener('resize', fit);

    // -----------------------------------------------------------------
    //  Interaction
    // -----------------------------------------------------------------
    const pointer = { x: -99, y: -99, inside: false };
    const bubble = root.querySelector('[data-portrait-bubble]');
    const caption = root.querySelector('[data-portrait-caption]');
    const lines = [
        'いい景色だね… nice view, right?',
        'Tap the sky. I brought fireworks 🎆',
        'One day I’ll find the One Piece.',
        'Next stop: Tokyo 🗼',
        'こんにちは! I’m Noah 👋',
        'Robots by day, anime by night.'
    ];
    let lineIndex = 0;
    let bubbleTimer = 0;

    function toArt(event) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: ((event.clientX - rect.left) / rect.width) * W,
            y: ((event.clientY - rect.top) / rect.height) * H
        };
    }

    function say(text, ax, ay) {
        if (!bubble) return;
        bubble.textContent = text;
        // keep the bubble inside the frame; the tail still points at the speaker
        const fw = frameEl.clientWidth;
        const px = (ax / W) * fw;
        const half = bubble.offsetWidth / 2;
        const left = clamp(px, half + 6, fw - half - 6);
        bubble.style.left = `${left}px`;
        bubble.style.top = `${(ay / H) * 100}%`;
        bubble.style.setProperty('--tail', `${clamp(px - left + half, 10, half * 2 - 10)}px`);
        bubble.classList.add('is-on');
        clearTimeout(bubbleTimer);
        bubbleTimer = setTimeout(() => bubble.classList.remove('is-on'), 2600);
    }

    const hit = (p, box, pad = 2) => p.x >= box.x - pad && p.x <= box.x + box.w + pad && p.y >= box.y - pad && p.y <= box.y + box.h + pad;
    const noahBox = { x: FIG.x + 6, y: FIG.y + 6, w: FIG.w - 12, h: FIG.h - 6 };

    canvas.addEventListener('pointermove', event => {
        const p = toArt(event);
        pointer.x = p.x;
        pointer.y = p.y;
        pointer.inside = true;
        if (event.pointerType === 'mouse') {
            state.tx = clamp((p.x / W - 0.5) * 2, -1, 1);
            state.ty = clamp((p.y / H - 0.5) * 2, -1, 1);
        }
        canvas.style.cursor = hit(p, noahBox) || hit(p, ROBOT) || p.y < SEA - 6 || p.y < 262 ? 'pointer' : 'default';
    });
    canvas.addEventListener('pointerleave', () => {
        pointer.inside = false;
        state.tx = 0;
        state.ty = 0;
    });
    canvas.addEventListener('click', event => {
        const p = toArt(event);
        if (hit(p, noahBox)) {
            if (!reducedMotion) state.wave = 1.6;
            say(lines[lineIndex++ % lines.length], FIG.x + FIG.ax, FIG.y + 4);
        } else if (hit(p, ROBOT, 3)) {
            if (!reducedMotion) state.robotBeep = 1;
            say('ピピッ! beep boop', ROBOT.x + 7, ROBOT.y - 4);
        } else if (p.y < SEA - 6) {
            launch(clamp(p.x, 8, W - 8), clamp(p.y, 16, SEA - 24));
            if (reducedMotion) still(1);
        } else if (p.y < 260) {
            state.ripples.push({ x: p.x, y: p.y, age: 0 });
            if (reducedMotion) still(0.5);
        }
    });

    const modeButtons = Array.from(root.querySelectorAll('[data-portrait-mode]'));
    function setMode(mode, animate = true) {
        if (!MODES[mode]) return;
        if (mode !== state.mode) {
            state.fade = animate && !reducedMotion ? { from: state.mode, start: performance.now() } : null;
            state.mode = mode;
            state.nextAutoHanabi = 1.2;
        }
        modeButtons.forEach(btn => btn.setAttribute('aria-pressed', String(btn.dataset.portraitMode === mode)));
        if (caption) caption.textContent = MODES[mode].caption;
        root.dataset.mode = mode;
        if (started) nudge();
    }
    modeButtons.forEach(btn => btn.addEventListener('click', () => setMode(btn.dataset.portraitMode)));
    root.querySelector('[data-portrait-hanabi]')?.addEventListener('click', () => {
        if (reducedMotion) {
            for (let i = 0; i < 3; i++) launch(60 + rnd() * 160, 26 + rnd() * 80);
            still(1);
            return;
        }
        for (let i = 0; i < 3; i++) setTimeout(() => launch(60 + rnd() * 160, 26 + rnd() * 80), i * 260);
    });

    // the sky follows the site theme: dusk in light mode, night in dark mode
    const html = document.documentElement;
    let dark = html.classList.contains('darkmode');
    new MutationObserver(() => {
        const now = html.classList.contains('darkmode');
        if (now === dark) return;
        dark = now;
        setMode(dark ? 'night' : 'dusk');
    }).observe(html, { attributes: true, attributeFilter: ['class'] });
    setMode(dark ? 'night' : 'dusk', false);
})();
