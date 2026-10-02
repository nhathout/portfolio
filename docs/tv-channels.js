// NJPH·TV: the CRT in Contact plays pixel-art channels drawn in code (168x126).
// Tap the screen to flip: Giza (walking like an Egyptian with my robot and a
// camel), Roma (a Vespa past the Colosseum), an attract loop of [Course]out,
// and the test card.
(() => {
    const kit = window.PixelKit;
    const screen = document.querySelector('[data-crt-screen]');
    const canvas = screen?.querySelector('[data-crt-canvas]');
    if (!kit?.art || !canvas) return;
    const { u32, u32Map, expand, bitmap, pick, hash, clamp, stamp, loop } = kit.art;
    const { reducedMotion } = kit;
    const W = 168;
    const H = 126;
    const ctx = canvas.getContext('2d');
    const label = screen.querySelector('[data-crt-channel]');

    // -----------------------------------------------------------------
    //  3x5 pixel font
    // -----------------------------------------------------------------
    const GLYPHS = {
        A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
        F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010',
        K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010',
        P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
        U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010',
        Z: '111001010100111', 0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110',
        4: '101101111001001', 5: '111100110001110', 6: '011100111101111', 7: '111001010010010', 8: '111101111101111',
        9: '111101111001110', ':': '000010000010000', '.': '000000000000010', '-': '000000111000000', '!': '010010010000010',
        '[': '110100100100110', ']': '011001001001011', '·': '000000010000000', ' ': '000000000000000'
    };
    const textWidth = str => str.length * 4 - 1;
    function text(c, str, x, y, color) {
        c.fillStyle = color;
        [...str.toUpperCase()].forEach((ch, i) => {
            const g = GLYPHS[ch] || GLYPHS[' '];
            for (let k = 0; k < 15; k++) if (g[k] === '1') c.fillRect(x + i * 4 + (k % 3), y + Math.floor(k / 3), 1, 1);
        });
    }

    const sprite = (rows, pal, flip = false) => {
        const L = bitmap(rows[0].length, rows.length);
        stamp(L, rows, 0, 0, u32Map(pal), flip);
        return L.done();
    };
    const gradient = (L, y0, y1, ramp, x0 = 0, x1 = W) => {
        const r = expand(ramp, 3).map(u32);
        for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) L.set(x, y, pick(r, ((y - y0) / Math.max(1, y1 - y0 - 1)) * (r.length - 1), x, y));
    };

    // -----------------------------------------------------------------
    //  Shared cast: me (curls, shades, teal tee) and my robot buddy
    // -----------------------------------------------------------------
    const ME = { a: '#120b0d', A: '#3a2722', s: '#b8754d', S: '#7e4a30', k: '#0b0b12', K: '#5fa8c8', t: '#1f8f86', T: '#14615c', p: '#1d2540', b: '#e9e4d8', w: '#f4f1ea' };
    // the Egyptian walk: front arm up and forward, back arm down and back
    const WALK = [
        [
            '....aAaa.......',
            '...aaAaAaa.....',
            '..aaaaaaaaa....',
            '..aaaasssss....',
            '..aaasKkkkk....',
            '..aaassssss....',
            '...aaassss.....',
            '....aaaaa......',
            '.....sss....s..',
            '...tttttt...s..',
            '..tttttttssss..',
            's.tTttttt......',
            's.TTtttt.......',
            'ssTTtttt.......',
            '...Ttttt.......',
            '...ppppp.......',
            '...pp..pp......',
            '..pp....pp.....',
            '..pp....pp.....',
            '.bb.....bb.....'
        ],
        [
            '.....aAaa......',
            '....aaAaAaa....',
            '...aaaaaaaaa...',
            '...aaaasssss...',
            '...aaasKkkkk...',
            '...aaassssss...',
            '....aaassss....',
            '.....aaaaa.....',
            '.....sss....s..',
            '...tttttt...s..',
            '..tttttttssss..',
            's.tTttttt......',
            's.TTtttt.......',
            'ssTTtttt.......',
            '...Ttttt.......',
            '...ppppp.......',
            '....ppp........',
            '....pp.p.......',
            '....pp.p.......',
            '...bbb.bb......'
        ]
    ];
    const BOT = { o: '#0b0812', D: '#2b3348', G: '#56607a', L: '#8a94ac', c: '#73eff7', y: '#ffd26b', r: '#ff6a6a' };
    const BOT_WALK = [
        [
            '....y.....',
            '....o.....',
            '.oooooo...',
            '.oLLLLLo..',
            '.oGkkcco..',
            '.oGkkkko..',
            '..oooooo..',
            '...oGo..o.',
            'o.oGGGoooo',
            'oooGyGo...',
            '..oGGGo...',
            '..oDDDo...',
            '..o...o...',
            '.oo...oo..'
        ],
        [
            '....r.....',
            '....o.....',
            '.oooooo...',
            '.oLLLLLo..',
            '.oGkkcco..',
            '.oGkkkko..',
            '..oooooo..',
            '...oGo..o.',
            'o.oGGGoooo',
            'oooGyGo...',
            '..oGGGo...',
            '..oDDDo...',
            '...o.o....',
            '..oo.oo...'
        ]
    ].map(rows => rows.map(r => r.replace(/k/g, 'D')));
    const CAMEL = { o: '#4a2a12', c: '#c58d4c', C: '#9a6630', h: '#e6b574', k: '#120a06', r: '#c8362f', y: '#ffd26b' };
    const CAMEL_WALK = [
        [
            '.......................oo...',
            '......................ohho..',
            '.....................ohccko.',
            '.....................occccco',
            '.....................occooco',
            '...........ooo......occo....',
            '.........oohhhoo....occo....',
            '........ohhcccccoo..occo....',
            '.......ohccccccccco.occo....',
            '...ooooccccccccccccoccco....',
            '..ohhhhcccccccccccccccco....',
            '.ohcccrryrryrryrrcccccCo....',
            'o.occcrryrryrryrrccccCo.....',
            '..oCCcrrrrrrrrrrrcCCCo......',
            '...oCCCCCCCCCCCCCCCCo.......',
            '....oCo.oCo...oCo.oCo.......',
            '....oCo.oCo...oCo.oCo.......',
            '...oCo...oCo.oCo...oCo......',
            '...oCo...oCo.oCo...oCo......',
            '..ooo....ooo.ooo...ooo......'
        ],
        [
            '.......................oo...',
            '......................ohho..',
            '.....................ohccko.',
            '.....................occccco',
            '.....................occooco',
            '...........ooo......occo....',
            '.........oohhhoo....occo....',
            '........ohhcccccoo..occo....',
            '.......ohccccccccco.occo....',
            '...ooooccccccccccccoccco....',
            '..ohhhhcccccccccccccccco....',
            '.ohcccrryrryrryrrcccccCo....',
            'o.occcrryrryrryrrccccCo.....',
            '..oCCcrrrrrrrrrrrcCCCo......',
            '...oCCCCCCCCCCCCCCCCo.......',
            '....oCo.oCo...oCo.oCo.......',
            '.....oCooCo....oCooCo.......',
            '.....oCooCo....oCooCo.......',
            '.....oCooCo....oCooCo.......',
            '....ooo.ooo...ooo.ooo.......'
        ]
    ];

    // -----------------------------------------------------------------
    //  CH 03 · Giza
    // -----------------------------------------------------------------
    function pyramid(L, ax, ay, baseY, lit, shade, line, cap) {
        const slope = 0.92;
        for (let y = ay; y <= baseY; y++) {
            const half = Math.round((y - ay) * slope);
            for (let x = ax - half; x <= ax + half; x++) {
                let col = x <= ax ? shade : lit;
                if ((y - ay) % 3 === 2) col = x <= ax ? line[0] : line[1];   // stone courses
                if (cap && y - ay < 7) col = x <= ax ? cap[0] : cap[1];      // what's left of the casing
                L.set(x, y, col);
            }
        }
    }

    const giza = {
        name: 'CH 03 · GIZA',
        start: 8,   // tune in with the conga line already on screen
        paint() {
            const L = bitmap(W, H);
            gradient(L, 0, 92, ['#2a74d0', '#3f8de2', '#5aa6ee', '#86c3f6', '#bfe2fa']);
            // far dunes
            for (let x = 0; x < W; x++) {
                const top = 84 + Math.round(Math.sin(x * 0.05) * 2 + Math.sin(x * 0.13 + 1) * 1);
                for (let y = top; y < 92; y++) L.set(x, y, u32(y === top ? '#f3d08a' : '#e6b867'));
            }
            pyramid(L, 146, 62, 90, u32('#e8b460'), u32('#b47c3a'), [u32('#9a6a30'), u32('#cf9a4e')]);
            pyramid(L, 58, 30, 92, u32('#f0c06a'), u32('#bb8440'), [u32('#a06e32'), u32('#d6a256')], [u32('#d8c8a8'), u32('#f6ead0')]);
            pyramid(L, 108, 44, 92, u32('#ecba64'), u32('#b8803c'), [u32('#9c6c30'), u32('#d29e52')]);
            // sand, with wind ripples
            gradient(L, 92, H, ['#f2c470', '#e8b05a', '#dc9c48', '#cf8a3e']);
            for (let y = 96; y < H; y += 4) {
                for (let x = 0; x < W; x++) if (Math.sin(x * 0.18 + y * 0.9) > 0.55) L.set(x, y, u32('#f6d48c'));
            }
            // a date palm on the left
            for (let y = 60; y < 100; y++) L.set(12 + Math.round(Math.sin(y * 0.08) * 1.2), y, u32(y % 3 ? '#7a4e26' : '#5a3818'));
            for (let i = 0; i < 6; i++) {
                const a = -Math.PI / 2 + (i - 2.5) * 0.55;
                for (let r = 0; r < 14; r++) {
                    const x = 12 + Math.cos(a) * r * 1.1;
                    const y = 60 + Math.sin(a) * r * 0.55 + (r * r) / 22;
                    L.set(x, y, u32(r % 4 === 3 ? '#4f9a3c' : '#2f7a2c'));
                    L.set(x, y + 1, u32('#1f5a20'));
                }
            }
            return L.done();
        },
        frame(c, t) {
            // the sun and its turning rays
            const sx = 132;
            const sy = 20;
            for (let i = 0; i < 12; i++) {
                const a = (i / 12) * Math.PI * 2 + t * 0.6;
                const len = i % 2 ? 4 : 7;
                c.fillStyle = i % 2 ? '#ffe28a' : '#ffd23f';
                for (let r = 10; r < 10 + len; r++) c.fillRect(Math.round(sx + Math.cos(a) * r), Math.round(sy + Math.sin(a) * r), 1, 1);
            }
            c.fillStyle = '#ffb627';
            c.beginPath();
            for (let y = -7; y <= 7; y++) {
                const half = Math.round(Math.sqrt(49 - y * y));
                c.fillRect(sx - half, sy + y, half * 2 + 1, 1);
            }
            c.fillStyle = '#ffe066';
            for (let y = -5; y <= 5; y++) {
                const half = Math.round(Math.sqrt(25 - y * y));
                c.fillRect(sx - half, sy + y, half * 2 + 1, 1);
            }
            // the conga line: camel, robot, me, walking like an Egyptian
            const f = Math.floor(t * 4) % 2;
            const lead = ((t * 16) % (W + 110)) - 30;
            c.drawImage(cast.camel[f], Math.round(lead - 76), 93);
            c.drawImage(cast.bot[f], Math.round(lead - 38), 99);
            c.drawImage(cast.me[f], Math.round(lead - 16), 93 + (f ? 0 : 1));
        }
    };

    // -----------------------------------------------------------------
    //  CH 04 · Roma
    // -----------------------------------------------------------------
    const VESPA = {
        a: '#120b0d', A: '#3a2722', s: '#b8754d', k: '#0b0b12', K: '#5fa8c8', t: '#1f8f86', T: '#14615c', p: '#1d2540',
        r: '#d6362f', R: '#9c2420', h: '#ff8a7a', g: '#20242c', G: '#8a909c', w: '#f4f1ea', y: '#ffd26b', m: '#c9ced8'
    };
    const VESPA_ROWS = [
        [
            '.......aAaa.............',
            '......aaAaAa............',
            '.....aaaaaaaa...........',
            '.....aaasssss...........',
            '.....aasKkkkk...........',
            '.....aaassss.........m..',
            '......aassss........mm..',
            '.......ssss.........m...',
            '.....tttttt.ssss...rr...',
            '....tttttttt....s.rrr...',
            '....tTttttt......rrhr...',
            '....tTTtttt.....rrrhr...',
            '...rrrrppppppp.rrrrrr...',
            '..rrhhhhrrrrrpprrrrrrr..',
            '.rrrrrrrrrrrrrrrrrrrRR..',
            '.RRrrrrrrrrrrrrrrrrRRy..',
            '..ggg..RRRRRRRR...ggg...',
            '.gGGGg...........gGGGg..',
            '.gGgGg...........gGgGg..',
            '..ggg.............ggg...'
        ]
    ];
    VESPA_ROWS.push(VESPA_ROWS[0].map((row, y) => (y === 17 || y === 18 ? row.replace(/gGGGg/g, 'gGgGg').replace(/gGgGg(?=.*gGgGg)/, 'gGGGg') : row)));
    VESPA_ROWS[1][17] = '.gGgGg...........gGgGg..';
    VESPA_ROWS[1][18] = '.gGGGg...........gGGGg..';

    function colosseum(L) {
        const travertine = ['#7a4a2c', '#9c6440', '#c08454', '#dca46c', '#efc28a'].map(u32);
        const dark = u32('#3a2016');
        const glow = u32('#ff9a4a');
        const x0 = 22;
        const x1 = 146;
        const top = x => (x > 92 ? 30 : x > 84 ? 30 + (92 - x) * 2 : 46 + Math.round(Math.sin(x * 0.7) * 1.2));
        for (let x = x0; x <= x1; x++) {
            const u = (x - x0) / (x1 - x0);
            const light = 2.6 - Math.abs(u - 0.32) * 2.2;   // a drum lit from the low sun on the left
            for (let y = top(x); y <= 96; y++) {
                let v = light;
                const tier = y < 44 ? 3 : y < 60 ? 2 : y < 77 ? 1 : 0;
                const bandTop = [77, 60, 44, 30][tier];
                const ax = ((x - x0) % 9 + 9) % 9;
                // ledges between the tiers
                if (y === 44 || y === 60 || y === 77 || y === 45 || y === 61 || y === 78) v += y % 2 ? -0.6 : 0.8;
                else if (tier === 3) {
                    if (ax >= 3 && ax <= 5 && y > bandTop + 4 && y < bandTop + 9) v = -9;   // attic windows
                } else {
                    const archTop = bandTop + 3;
                    const archBot = tier === 0 ? 97 : bandTop + 15;
                    const inArch = ax >= 2 && ax <= 7 && y >= archTop && y <= archBot && !(y === archTop && (ax === 2 || ax === 7));
                    if (inArch) v = hash(Math.floor((x - x0) / 9), tier, 4) > 0.72 ? -8 : -9;
                    if (ax === 0 || ax === 8) v += 0.5;   // half-columns
                }
                let col = pick(travertine, v, x, y);
                if (v === -9) col = dark;
                if (v === -8) col = glow;
                L.set(x, y, col);
            }
        }
    }

    const roma = {
        name: 'CH 04 · ROMA',
        start: 2.6,
        paint() {
            const L = bitmap(W, H);
            gradient(L, 0, 100, ['#3a2a6e', '#7a3a7c', '#c4547a', '#f0806a', '#ffb56e', '#ffd896']);
            // the sun going down behind the city
            for (let y = 64; y < 100; y++) for (let x = 6; x < 40; x++) if (Math.hypot(x - 22, y - 80) < 12) L.set(x, y, u32(y % 4 === 0 && y > 76 ? '#ffb56e' : '#fff0c0'));
            // far rooftops
            for (let x = 0; x < W; x++) {
                const top = 86 + Math.round(hash(Math.floor(x / 7), 0, 3) * 6);
                for (let y = top; y < 100; y++) L.set(x, y, u32('#7a3a4c'));
            }
            colosseum(L);
            // cypresses
            [[6, 44, 1], [150, 40, 1], [160, 52, 0]].forEach(([cx, ty]) => {
                for (let y = ty; y < 100; y++) {
                    const half = Math.round(Math.sin(((y - ty) / (100 - ty)) * Math.PI * 0.85 + 0.15) * 4);
                    for (let x = cx - half; x <= cx + half; x++) L.set(x, y, u32(x > cx ? '#2f5a2a' : '#1c3a1c'));
                }
            });
            // the street
            gradient(L, 100, H, ['#5a4a52', '#4a3c46', '#3a2e38']);
            for (let x = 0; x < W; x++) L.set(x, 100, u32('#d8a878'));
            for (let x = 0; x < W; x += 12) for (let k = 0; k < 6; k++) L.set(x + k, 115, u32('#e8d8b0'));
            return L.done();
        },
        frame(c, t) {
            // pigeons
            c.fillStyle = '#2a1a2e';
            for (let i = 0; i < 3; i++) {
                const x = Math.round((((t * (10 + i * 3) + i * 60) % (W + 20)) + W + 20) % (W + 20)) - 10;
                const y = 18 + i * 9 + Math.round(Math.sin(t * 2 + i) * 2);
                const up = Math.sin(t * 9 + i * 2) > 0;
                c.fillRect(x, y + (up ? 0 : 1), 1, 1);
                c.fillRect(x + 1, y + 1, 1, 1);
                c.fillRect(x + 2, y + (up ? 0 : 1), 1, 1);
            }
            // a flag over the arena
            const wave = Math.floor(t * 6) % 2;
            [['#1f8a4a', 0], ['#f4f1ea', 3], ['#d6362f', 6]].forEach(([col, dx]) => {
                c.fillStyle = col;
                c.fillRect(124 + dx, 19 + (dx === 3 ? wave : 0), 3, 5);
            });
            c.fillStyle = '#3a2016';
            c.fillRect(123, 18, 1, 13);
            // me on a Vespa, bumping along the cobbles
            const x = Math.round(((t * 28) % (W + 60)) - 30);
            const f = Math.floor(t * 10) % 2;
            c.drawImage(cast.vespa[f], x, 92 + (Math.sin(t * 13) > 0.6 ? -1 : 0));
        }
    };

    // -----------------------------------------------------------------
    //  CH 05 · Arcade: [Course]out playing itself
    // -----------------------------------------------------------------
    const arcade = (() => {
        const ROWS = ['#e0433f', '#ef7d57', '#ffcd75', '#a7f070', '#41a6f6', '#9a6cff'];
        const COLS = 12;
        const state = { bricks: [], ball: { x: 84, y: 90, vx: 52, vy: -58 }, paddle: 84, score: 0 };
        const reset = () => {
            state.bricks = [];
            for (let r = 0; r < ROWS.length; r++) for (let k = 0; k < COLS; k++) state.bricks.push({ r, k, on: true });
        };
        reset();
        const brickRect = b => ({ x: 12 + b.k * 12, y: 22 + b.r * 6, w: 11, h: 5 });
        return {
            name: 'CH 05 · ARCADE',
            paint() {
                const L = bitmap(W, H);
                for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) L.set(x, y, u32((x + y) % 2 ? '#05060c' : '#07080f'));
                for (let x = 6; x < W - 6; x++) {
                    L.set(x, 14, u32('#56607a'));
                    L.set(x, 15, u32('#2b3348'));
                }
                for (let y = 14; y < H; y++) {
                    L.set(6, y, u32('#56607a'));
                    L.set(W - 7, y, u32('#56607a'));
                }
                return L.done();
            },
            step(dt) {
                const b = state.ball;
                b.x += b.vx * dt;
                b.y += b.vy * dt;
                if (b.x < 8 || b.x > W - 9) {
                    b.vx *= -1;
                    b.x = clamp(b.x, 8, W - 9);
                }
                if (b.y < 16) {
                    b.vy = Math.abs(b.vy);
                }
                // the paddle plays a little imperfectly
                state.paddle += clamp(b.x + Math.sin(b.y * 0.1) * 6 - state.paddle, -70 * dt, 70 * dt);
                state.paddle = clamp(state.paddle, 18, W - 19);
                if (b.y > 112 && b.y < 116 && Math.abs(b.x - state.paddle) < 13 && b.vy > 0) {
                    b.vy = -Math.abs(b.vy);
                    b.vx = clamp(b.vx + (b.x - state.paddle) * 3, -80, 80);
                }
                if (b.y > H) {
                    Object.assign(b, { x: state.paddle, y: 108, vx: (Math.random() > 0.5 ? 1 : -1) * 50, vy: -58 });
                }
                for (const br of state.bricks) {
                    if (!br.on) continue;
                    const r = brickRect(br);
                    if (b.x >= r.x - 1 && b.x <= r.x + r.w && b.y >= r.y - 1 && b.y <= r.y + r.h) {
                        br.on = false;
                        b.vy *= -1;
                        state.score += (ROWS.length - br.r) * 10;
                        break;
                    }
                }
                if (state.bricks.every(br => !br.on)) reset();
            },
            frame(c, t) {
                text(c, `SCORE ${String(state.score).padStart(5, '0')}`, 8, 5, '#f4f4f4');
                text(c, '[COURSE]OUT', (W - textWidth('[COURSE]OUT')) >> 1, 5, '#73eff7');
                state.bricks.forEach(br => {
                    if (!br.on) return;
                    const r = brickRect(br);
                    c.fillStyle = ROWS[br.r];
                    c.fillRect(r.x, r.y, r.w, r.h);
                    c.fillStyle = 'rgba(255,255,255,0.35)';
                    c.fillRect(r.x, r.y, r.w, 1);
                    c.fillStyle = 'rgba(0,0,0,0.3)';
                    c.fillRect(r.x, r.y + r.h - 1, r.w, 1);
                });
                c.fillStyle = '#f4f4f4';
                c.fillRect(Math.round(state.paddle) - 12, 115, 24, 3);
                c.fillStyle = '#94b0c2';
                c.fillRect(Math.round(state.paddle) - 12, 117, 24, 1);
                c.fillStyle = '#ffffff';
                c.fillRect(Math.round(state.ball.x) - 1, Math.round(state.ball.y) - 1, 2, 2);
                if (Math.floor(t * 1.6) % 2) text(c, 'INSERT COIN', (W - textWidth('INSERT COIN')) >> 1, 96, '#ffcd75');
            }
        };
    })();

    // -----------------------------------------------------------------
    //  CH 06 · Test card
    // -----------------------------------------------------------------
    const testCard = {
        name: 'CH 06 · TEST',
        paint() {
            const L = bitmap(W, H);
            const bars = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0'];
            const bw = W / bars.length;
            for (let y = 0; y < 84; y++) for (let x = 0; x < W; x++) L.set(x, y, u32(bars[Math.floor(x / bw)]));
            const rev = ['#0000c0', '#131313', '#c000c0', '#131313', '#00c0c0', '#131313', '#c0c0c0'];
            for (let y = 84; y < 94; y++) for (let x = 0; x < W; x++) L.set(x, y, u32(rev[Math.floor(x / bw)]));
            const low = [['#00214c', 30], ['#ffffff', 30], ['#32006a', 30], ['#131313', 78]];
            let x0 = 0;
            low.forEach(([col, w]) => {
                for (let y = 94; y < H; y++) for (let x = x0; x < x0 + w; x++) L.set(x, y, u32(col));
                x0 += w;
            });
            // the station badge
            for (let y = 28; y < 58; y++) {
                for (let x = 44; x < 124; x++) {
                    const edge = y === 28 || y === 57 || x === 44 || x === 123;
                    L.set(x, y, u32(edge ? '#f4f4f4' : '#101018'));
                }
            }
            return L.done();
        },
        frame(c, t) {
            text(c, 'NJPH·TV', (W - textWidth('NJPH·TV')) >> 1, 34, '#73eff7');
            text(c, 'PLEASE STAND BY', (W - textWidth('PLEASE STAND BY')) >> 1, 44, '#f4f4f4');
            if (Math.floor(t * 2) % 2) {
                c.fillStyle = '#e0433f';
                c.fillRect(50, 34, 3, 3);
            }
            // a slow rolling bar of interference
            const y = Math.floor((t * 22) % (H + 20)) - 10;
            c.fillStyle = 'rgba(255,255,255,0.08)';
            c.fillRect(0, y, W, 6);
        }
    };

    // -----------------------------------------------------------------
    //  Tuning
    // -----------------------------------------------------------------
    const CHANNELS = [giza, roma, arcade, testCard];
    const cast = {
        me: WALK.map(rows => sprite(rows, ME)),
        bot: BOT_WALK.map(rows => sprite(rows, BOT)),
        camel: CAMEL_WALK.map(rows => sprite(rows, CAMEL)),
        vespa: VESPA_ROWS.map(rows => sprite(rows, VESPA))
    };
    const backgrounds = new Map();
    let index = 0;
    let t = CHANNELS[0].start || 0;

    function draw() {
        const ch = CHANNELS[index];
        if (!backgrounds.has(ch)) backgrounds.set(ch, ch.paint());
        ctx.drawImage(backgrounds.get(ch), 0, 0);
        ch.frame(ctx, t);
    }

    const runner = loop(canvas, dt => {
        t += dt;
        CHANNELS[index].step?.(dt);
        draw();
    }, { fps: 24 });
    draw();

    screen.addEventListener('click', () => {
        screen.classList.remove('is-flipping');
        void screen.offsetWidth;   // restart the static burst
        screen.classList.add('is-flipping');
        setTimeout(() => {
            index = (index + 1) % CHANNELS.length;
            t = CHANNELS[index].start || 0;
            if (label) label.textContent = CHANNELS[index].name;
            draw();
        }, reducedMotion ? 0 : 160);
        setTimeout(() => screen.classList.remove('is-flipping'), 520);
    });
    if (label) label.textContent = CHANNELS[index].name;
    return runner;
})();
