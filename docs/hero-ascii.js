// Hero ANSI layer: the pixel background re-drawn as TheDraw-style shade blocks
// (░▒▓█) inside a lens that follows the pointer, with a glowing trail and a
// block-font "NOAH" hidden in the clouds. With no pointer (touch screens, or an
// idle mouse) the lens drifts on its own. Skipped entirely for reduced motion.
(() => {
    const hero = document.querySelector('.hero-panel');
    if (!hero || !window.requestAnimationFrame) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const root = document.documentElement;
    const IMAGES = {
        light: 'assets/images/pixel-background.jpg',
        dark: 'assets/images/pixel-space-wallpaper.jpg'
    };
    // density ramp: ascii glyphs for airy areas, pixel-drawn shade blocks for dense ones
    const RAMP = ['·', ':', '+', '░', '▒', '▓', '█'];
    const SCRAMBLE = '01<>/\\|=+*#%&$@?!~^ABCDEFHKMNRSTXZ░▒▓█▀▄';
    // 5x5 block font for the hidden signature
    const FONT = {
        N: ['X...X', 'XX..X', 'X.X.X', 'X..XX', 'X...X'],
        O: ['.XXX.', 'X...X', 'X...X', 'X...X', '.XXX.'],
        A: ['.XXX.', 'X...X', 'XXXXX', 'X...X', 'X...X'],
        H: ['X...X', 'X...X', 'XXXXX', 'X...X', 'X...X']
    };
    // TheDraw "DescentSmBlu"-style ramp: light cyan at the top of each letter, deep blue at the base
    const SIGNATURE_ROWS = [
        { glyph: '▓', color: [165, 243, 252] },
        { glyph: '█', color: [103, 232, 249] },
        { glyph: '█', color: [56, 189, 248] },
        { glyph: '█', color: [37, 99, 235] },
        { glyph: '█', color: [30, 58, 138] }
    ];

    const canvas = document.createElement('canvas');
    canvas.className = 'hero-ascii';
    canvas.setAttribute('aria-hidden', 'true');
    hero.prepend(canvas);
    const ctx = canvas.getContext('2d');

    let width = 0;
    let height = 0;
    let dpr = 1;
    let cellW = 9;
    let cellH = 14;
    let cols = 0;
    let rows = 0;
    let colors = null;   // Uint8ClampedArray glyph rgb per cell
    let backs = null;    // Uint8ClampedArray cell rgb per cell
    let density = null;  // Float32Array 0..1 per cell
    let heat = null;     // Float32Array trail per cell
    let scramble = null; // Uint8Array frames of scramble left
    let lastLevel = null; // Float32Array previous intensity (to detect "entering" the lens)
    let signature = null; // Int8Array row index into SIGNATURE_ROWS, -1 if none
    let image = null;
    let imageTheme = null;
    let running = false;
    let visible = true;
    let frame = 0;

    const pointer = { x: -9999, y: -9999, active: false, lastMove: 0 };
    const lens = { x: 0, y: 0, r: 150, strength: 0 };
    let lastTrail = null;

    const isDark = () => root.classList.contains('darkmode');

    function loadImage(theme) {
        return new Promise(resolve => {
            const img = new Image();
            img.decoding = 'async';
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = IMAGES[theme];
        });
    }

    function layout() {
        const rect = hero.getBoundingClientRect();
        width = Math.max(1, Math.round(rect.width));
        height = Math.max(1, Math.round(rect.height));
        dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        const small = width < 640;
        cellW = small ? 8 : 9;
        cellH = small ? 12 : 14;
        cols = Math.ceil(width / cellW);
        rows = Math.ceil(height / cellH);
        lens.r = small ? 110 : Math.min(190, Math.max(130, width * 0.11));
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.font = `700 ${Math.round(cellH * 0.92)}px ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace`;
        heat = new Float32Array(cols * rows);
        scramble = new Uint8Array(cols * rows);
        lastLevel = new Float32Array(cols * rows);
        buildSignature();
        sample();
    }

    // Average the background image into one color per cell, using the same
    // center/cover crop the CSS background uses.
    function sample() {
        if (!image || !cols || !rows) return;
        const scale = Math.max(width / image.width, height / image.height);
        const drawnW = image.width * scale;
        const drawnH = image.height * scale;
        const offX = (width - drawnW) / 2;
        const offY = (height - drawnH) / 2;
        const off = document.createElement('canvas');
        off.width = cols;
        off.height = rows;
        const octx = off.getContext('2d', { willReadFrequently: true });
        octx.imageSmoothingEnabled = true;
        octx.imageSmoothingQuality = 'high';
        // source rect that maps onto the visible cell grid
        const sx = (0 - offX) / scale;
        const sy = (0 - offY) / scale;
        const sw = (cols * cellW) / scale;
        const sh = (rows * cellH) / scale;
        octx.drawImage(image, sx, sy, sw, sh, 0, 0, cols, rows);
        const data = octx.getImageData(0, 0, cols, rows).data;
        colors = new Uint8ClampedArray(cols * rows * 3);   // glyph (foreground) color
        backs = new Uint8ClampedArray(cols * rows * 3);    // cell (background) color
        density = new Float32Array(cols * rows);
        const dark = imageTheme === 'dark';
        const q = v => Math.min(255, Math.round(v / 28) * 28); // terminal-ish palette steps
        // piecewise-linear helper for re-creating the CSS gradients over the art
        const ramp = (t, stops) => {
            for (let k = 1; k < stops.length; k += 1) {
                if (t <= stops[k][0]) {
                    const [t0, v0] = stops[k - 1];
                    const [t1, v1] = stops[k];
                    return v0 + (v1 - v0) * ((t - t0) / (t1 - t0 || 1));
                }
            }
            return stops[stops.length - 1][1];
        };
        for (let i = 0; i < cols * rows; i += 1) {
            let r = data[i * 4];
            let g = data[i * 4 + 1];
            let b = data[i * 4 + 2];
            const cx = ((i % cols) + 0.5) / cols;
            const cy = (Math.floor(i / cols) + 0.5) / rows;
            // match what's actually on screen: the art plus the hero's overlay gradients
            if (dark) {
                const veil = ramp(cy, [[0, 0.2], [0.44, 0.62], [1, 0.98]]);
                r = r * 0.55 * (1 - veil) + 7 * veil;
                g = g * 0.55 * (1 - veil) + 17 * veil;
                b = b * 0.6 * (1 - veil) + 32 * veil;
            } else {
                const lin = ramp(cy, [[0, 0], [0.48, 0.04], [0.84, 0.46], [1, 0.9]]);
                const fade = ramp(cy, [[0, 0], [0.52, 0.08], [0.78, 0.34], [1, 1]]);
                const d = Math.hypot((cx - 0.5) / 0.3, (cy - 0.62) / 0.38) / 0.74;
                const mist = d < 1 ? 0.66 * (1 - d) : 0;
                const veil = 1 - (1 - lin) * (1 - fade) * (1 - mist);
                r = r * (1 - veil) + 246 * veil;
                g = g * (1 - veil) + 249 * veil;
                b = b * (1 - veil) + 244 * veil;
            }
            const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
            if (dark) {
                backs[i * 3] = q(r);
                backs[i * 3 + 1] = q(g);
                backs[i * 3 + 2] = q(b + 4);
                // sonar-style glyphs: cyan that brightens with whatever is out there
                const glow = Math.min(1, 0.5 + lum * 3.2);
                colors[i * 3] = 70 + 70 * glow;
                colors[i * 3 + 1] = 150 + 95 * glow;
                colors[i * 3 + 2] = 200 + 50 * glow;
                density[i] = Math.min(1, 0.12 + lum * 3.4);
            } else {
                backs[i * 3] = q(r);
                backs[i * 3 + 1] = q(g);
                backs[i * 3 + 2] = q(b);
                // glyphs go darker on light cells and lighter on dark ones
                const toward = lum > 0.42 ? 0 : 255;
                const k = lum > 0.42 ? 0.5 : 0.38;
                colors[i * 3] = r + (toward - r) * k;
                colors[i * 3 + 1] = g + (toward - g) * k;
                colors[i * 3 + 2] = b + (toward - b) * k;
                density[i] = 1 - lum;
            }
        }
    }

    function buildSignature() {
        signature = new Int8Array(cols * rows).fill(-1);
        const word = 'NOAH';
        const pxW = 2; // cells per font pixel horizontally (cells are ~2:3)
        const letterW = 5 * pxW;
        const gap = pxW;
        const totalW = word.length * letterW + (word.length - 1) * gap;
        const startCol = Math.max(1, Math.round(cols * 0.07));
        const startRow = Math.max(1, Math.round(rows * 0.14));
        if (startCol + totalW >= cols * 0.42) return; // not enough room beside the portrait
        [...word].forEach((ch, li) => {
            const glyph = FONT[ch];
            glyph.forEach((line, fy) => {
                [...line].forEach((bit, fx) => {
                    if (bit !== 'X') return;
                    for (let k = 0; k < pxW; k += 1) {
                        const c = startCol + li * (letterW + gap) + fx * pxW + k;
                        const r = startRow + fy;
                        if (c < cols && r < rows) signature[r * cols + c] = fy;
                        // drop shadow one cell down-right, TheDraw style
                        const sc = c + 1;
                        const sr = r + 1;
                        if (sc < cols && sr < rows && signature[sr * cols + sc] === -1) signature[sr * cols + sc] = 9;
                    }
                });
            });
        });
    }

    function addTrail(x0, y0, x1, y1) {
        const radius = Math.max(46, lens.r * 0.42);
        const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / (cellW * 1.5)));
        for (let s = 0; s <= steps; s += 1) {
            const t = s / steps;
            const px = x0 + (x1 - x0) * t;
            const py = y0 + (y1 - y0) * t;
            const c0 = Math.max(0, Math.floor((px - radius) / cellW));
            const c1 = Math.min(cols - 1, Math.ceil((px + radius) / cellW));
            const r0 = Math.max(0, Math.floor((py - radius) / cellH));
            const r1 = Math.min(rows - 1, Math.ceil((py + radius) / cellH));
            for (let r = r0; r <= r1; r += 1) {
                for (let c = c0; c <= c1; c += 1) {
                    const d = Math.hypot(c * cellW + cellW / 2 - px, r * cellH + cellH / 2 - py) / radius;
                    if (d >= 1) continue;
                    const i = r * cols + c;
                    heat[i] = Math.min(1, heat[i] + (1 - d) * 0.35);
                }
            }
        }
    }

    function updateLens(now) {
        const idle = !pointer.active || now - pointer.lastMove > 2600;
        let tx;
        let ty;
        if (idle) {
            // slow Lissajous drift across the sky and canopy
            const t = now / 1000;
            tx = width * (0.5 + 0.38 * Math.sin(t * 0.23));
            ty = height * (0.36 + 0.2 * Math.sin(t * 0.37 + 1.3));
        } else {
            tx = pointer.x;
            ty = pointer.y;
        }
        const follow = idle ? 0.04 : 0.22;
        lens.x += (tx - lens.x) * follow;
        lens.y += (ty - lens.y) * follow;
        const targetStrength = idle ? 0.62 : 1;
        lens.strength += (targetStrength - lens.strength) * 0.06;
        if (idle) {
            if (lastTrail) addTrail(lastTrail.x, lastTrail.y, lens.x, lens.y);
            lastTrail = { x: lens.x, y: lens.y };
        }
    }

    function paintBlock(glyph, x, y, rgb, alpha) {
        const w = cellW;
        const h = cellH;
        const hw = Math.round(w / 2);
        const hh = Math.round(h / 2);
        ctx.fillStyle = `rgba(${rgb[0] | 0}, ${rgb[1] | 0}, ${rgb[2] | 0}, ${alpha})`;
        if (glyph === '█') {
            ctx.fillRect(x, y, w, h);
        } else if (glyph === '▓') {
            ctx.fillRect(x, y, w, h);
            ctx.fillStyle = `rgba(${rgb[0] | 0}, ${rgb[1] | 0}, ${rgb[2] | 0}, ${alpha * 0.35})`;
            ctx.fillRect(x + hw, y, w - hw, hh);
        } else if (glyph === '▒') {
            ctx.fillRect(x, y, hw, hh);
            ctx.fillRect(x + hw, y + hh, w - hw, h - hh);
            ctx.fillStyle = `rgba(${rgb[0] | 0}, ${rgb[1] | 0}, ${rgb[2] | 0}, ${alpha * 0.3})`;
            ctx.fillRect(x + hw, y, w - hw, hh);
            ctx.fillRect(x, y + hh, hw, h - hh);
        } else {
            // ░: two sparse specks
            const s = Math.max(2, Math.round(w / 3));
            ctx.fillRect(x + 1, y + 2, s, s);
            ctx.fillRect(x + hw + 1, y + hh + 2, s, s);
        }
    }

    function draw(now) {
        ctx.clearRect(0, 0, width, height);
        if (!colors) return;
        const dark = imageTheme === 'dark';
        const accent = dark ? [140, 245, 230] : [0, 121, 107];
        const r2 = lens.r;
        const lc0 = Math.max(0, Math.floor((lens.x - r2) / cellW));
        const lc1 = Math.min(cols - 1, Math.ceil((lens.x + r2) / cellW));
        const lr0 = Math.max(0, Math.floor((lens.y - r2) / cellH));
        const lr1 = Math.min(rows - 1, Math.ceil((lens.y + r2) / cellH));

        for (let r = 0; r < rows; r += 1) {
            const cy = r * cellH + cellH / 2;
            for (let c = 0; c < cols; c += 1) {
                const i = r * cols + c;
                let lensLevel = 0;
                if (c >= lc0 && c <= lc1 && r >= lr0 && r <= lr1) {
                    const d = Math.hypot(c * cellW + cellW / 2 - lens.x, cy - lens.y) / r2;
                    if (d < 1) lensLevel = (1 - d * d) * lens.strength;
                }
                const h = heat[i];
                const level = Math.max(lensLevel, h * 0.9);
                if (level < 0.04) {
                    lastLevel[i] = 0;
                    continue;
                }
                if (lastLevel[i] < 0.08 && level >= 0.08) {
                    scramble[i] = 3 + ((i * 7 + frame) % 7);
                }
                lastLevel[i] = level;

                // each cell becomes one ANSI "character cell": flat scene color behind a glyph
                ctx.fillStyle = `rgba(${backs[i * 3]}, ${backs[i * 3 + 1]}, ${backs[i * 3 + 2]}, ${Math.min(0.96, level * 1.1)})`;
                ctx.fillRect(c * cellW, r * cellH, cellW, cellH);

                let glyph;
                let rC = colors[i * 3];
                let gC = colors[i * 3 + 1];
                let bC = colors[i * 3 + 2];
                const sig = signature[i];
                const alpha = Math.min(1, level * 1.25);
                const x = c * cellW;
                const y = r * cellH;
                if (sig >= 0 && sig !== 9 && level > 0.22) {
                    const row = SIGNATURE_ROWS[sig];
                    paintBlock(row.glyph, x, y, dark ? row.color : row.color.map(v => v * 0.82), alpha);
                    continue;
                }
                if (sig === 9 && level > 0.22) {
                    paintBlock('▒', x, y, dark ? [2, 6, 23] : [15, 23, 42], alpha * 0.55);
                    continue;
                }
                if (scramble[i] > 0) {
                    scramble[i] -= (frame & 1) ? 1 : 0;
                    glyph = SCRAMBLE[(i * 13 + frame * 7) % SCRAMBLE.length];
                    [rC, gC, bC] = accent;
                } else {
                    const step = Math.min(RAMP.length - 1, Math.floor(density[i] * RAMP.length));
                    glyph = RAMP[step];
                }
                // fresh trail glows in the accent color, then cools to the scene color
                const glow = Math.min(1, Math.max(0, h - lensLevel) * 1.4);
                if (glow > 0) {
                    rC += (accent[0] - rC) * glow;
                    gC += (accent[1] - gC) * glow;
                    bC += (accent[2] - bC) * glow;
                }
                if (glyph === '░' || glyph === '▒' || glyph === '▓' || glyph === '█') {
                    paintBlock(glyph, x, y, [rC, gC, bC], alpha);
                } else {
                    ctx.fillStyle = `rgba(${rC | 0}, ${gC | 0}, ${bC | 0}, ${alpha})`;
                    ctx.fillText(glyph, x + cellW / 2, cy + 1);
                }
            }
        }
    }

    let lastDraw = 0;
    function tick(now) {
        if (!running) return;
        // ~50fps is plenty for this effect, and spares battery on 120/144Hz screens
        if (now - lastDraw < 19) {
            requestAnimationFrame(tick);
            return;
        }
        lastDraw = now;
        frame += 1;
        for (let i = 0; i < heat.length; i += 1) {
            if (heat[i] > 0) heat[i] = heat[i] < 0.01 ? 0 : heat[i] * 0.972;
        }
        updateLens(now);
        draw(now);
        requestAnimationFrame(tick);
    }

    function start() {
        if (running || !visible || document.hidden || !image) return;
        running = true;
        requestAnimationFrame(tick);
    }

    function stop() {
        running = false;
    }

    async function syncTheme() {
        const theme = isDark() ? 'dark' : 'light';
        if (theme === imageTheme && image) return;
        const img = await loadImage(theme);
        if (!img) return;
        image = img;
        imageTheme = theme;
        sample();
        start();
    }

    function onPointer(clientX, clientY) {
        const rect = hero.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        if (y < 0 || y > rect.height) return;
        if (pointer.active) addTrail(pointer.x, pointer.y, x, y);
        pointer.x = x;
        pointer.y = y;
        pointer.active = true;
        pointer.lastMove = performance.now();
        lastTrail = null;
    }

    hero.addEventListener('pointermove', event => {
        if (event.pointerType === 'touch') return;
        onPointer(event.clientX, event.clientY);
    });
    hero.addEventListener('pointerleave', () => {
        pointer.active = false;
    });
    hero.addEventListener('touchmove', event => {
        const touch = event.touches[0];
        if (touch) onPointer(touch.clientX, touch.clientY);
    }, { passive: true });
    hero.addEventListener('touchstart', event => {
        const touch = event.touches[0];
        if (touch) {
            pointer.active = false;
            onPointer(touch.clientX, touch.clientY);
        }
    }, { passive: true });

    let resizeTimer = null;
    const relayout = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const rect = hero.getBoundingClientRect();
            if (Math.round(rect.width) !== width || Math.round(rect.height) !== height) layout();
        }, 150);
    };
    if ('ResizeObserver' in window) {
        new ResizeObserver(relayout).observe(hero);
    } else {
        window.addEventListener('resize', relayout);
    }

    if ('IntersectionObserver' in window) {
        new IntersectionObserver(entries => {
            visible = entries[0].isIntersecting;
            if (visible) start();
            else stop();
        }).observe(hero);
    }
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stop();
        else start();
    });
    new MutationObserver(syncTheme).observe(root, { attributes: true, attributeFilter: ['class'] });

    lens.x = window.innerWidth * 0.5;
    lens.y = window.innerHeight * 0.35;
    layout();
    syncTheme();
})();
