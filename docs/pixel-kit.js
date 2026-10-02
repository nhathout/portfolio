// Shared pixel-art helpers (the same palette the About section uses).
// A sprite is an array of equal-length strings; each character is a palette
// key and '.' is transparent. Draw at 1px per pixel and scale with CSS
// (image-rendering: pixelated) so edges stay crisp.
(() => {
    const PALETTE = {
        k: '#1a1c2c', D: '#333c57', G: '#566c86', L: '#94b0c2', w: '#f4f4f4',
        r: '#b13e53', o: '#ef7d57', y: '#ffcd75', l: '#a7f070', g: '#38b764',
        t: '#257179', n: '#29366f', b: '#3b5dc9', s: '#41a6f6', c: '#73eff7',
        p: '#5d275d', P: '#9ad9bd', Q: '#5fae93', q: '#2f6f5e', m: '#b86f3c',
        M: '#6e3b1f', e: '#e9b27a', R: '#e0433f', z: '#c98a4b', h: '#f2c9a0'
    };

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    // Paint rows at (dx, dy). `swap` maps palette keys to other keys or raw colors.
    function paint(ctx, rows, dx = 0, dy = 0, swap = null) {
        for (let y = 0; y < rows.length; y += 1) {
            const row = rows[y];
            for (let x = 0; x < row.length; x += 1) {
                let key = row[x];
                if (key === '.') continue;
                if (swap && swap[key]) key = swap[key];
                if (key === '.') continue;
                ctx.fillStyle = PALETTE[key] || key;
                ctx.fillRect(dx + x, dy + y, 1, 1);
            }
        }
    }

    function canvasFor(rows, className = '') {
        const canvas = document.createElement('canvas');
        canvas.width = rows[0].length;
        canvas.height = rows.length;
        if (className) canvas.className = className;
        canvas.setAttribute('aria-hidden', 'true');
        paint(canvas.getContext('2d'), rows);
        return canvas;
    }

    function redraw(canvas, draw) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        draw(ctx);
    }

    // Frame-by-frame sprite animation on a slow shared ticker. `frames` is a
    // function (frameNumber) -> rows. Returns { start(), stop() }; stop()
    // restores frame 0. Nothing runs under prefers-reduced-motion.
    const active = new Set();
    let timer = null;
    let tickCount = 0;
    function tick() {
        tickCount += 1;
        active.forEach(anim => anim.step(tickCount));
        if (!active.size) {
            clearInterval(timer);
            timer = null;
        }
    }
    function animate(canvas, frames) {
        const anim = {
            step: n => redraw(canvas, ctx => paint(ctx, frames(n))),
            start() {
                if (reducedMotion || active.has(anim)) return;
                active.add(anim);
                if (!timer) timer = setInterval(tick, 140);
            },
            stop() {
                active.delete(anim);
                redraw(canvas, ctx => paint(ctx, frames(0)));
            }
        };
        return anim;
    }

    // -----------------------------------------------------------------
    //  Painting toolkit for the larger code-drawn scenes (About portrait,
    //  hero, TV): dithered ramps, value noise, bitmaps, glows, a loop.
    // -----------------------------------------------------------------
    const hexRgb = hex => {
        const n = parseInt(hex.slice(1), 16);
        return [n >> 16, (n >> 8) & 255, n & 255];
    };
    const u32 = hex => {
        const [r, g, b] = hexRgb(hex);
        return ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0;
    };
    const u32Map = obj => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, u32(v)]));
    const mixHex = (a, b, f) => {
        const ca = hexRgb(a);
        const cb = hexRgb(b);
        return '#' + ca.map((v, i) => Math.round(v + (cb[i] - v) * f).toString(16).padStart(2, '0')).join('');
    };
    // insert in-between shades so long gradients dither finely
    const expand = (ramp, k = 2) => ramp.flatMap((hex, i) => (i === ramp.length - 1 ? [hex] : Array.from({ length: k }, (_, j) => mixHex(hex, ramp[i + 1], j / k))));
    const mixU32 = (a, b, f) => {
        const r = (a & 255) + (((b & 255) - (a & 255)) * f);
        const g = ((a >> 8) & 255) + ((((b >> 8) & 255) - ((a >> 8) & 255)) * f);
        const bl = ((a >> 16) & 255) + ((((b >> 16) & 255) - ((a >> 16) & 255)) * f);
        return ((255 << 24) | (Math.round(bl) << 16) | (Math.round(g) << 8) | Math.round(r)) >>> 0;
    };

    // A canvas plus a 32-bit view of its pixels; done() pushes the pixels to the canvas.
    function bitmap(w, h) {
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d');
        const img = ctx.createImageData(w, h);
        const buf = new Uint32Array(img.data.buffer);
        return {
            c, w, h, buf,
            set(x, y, col) {
                x = Math.floor(x);
                y = Math.floor(y);
                if (x >= 0 && y >= 0 && x < w && y < h) buf[y * w + x] = col;
            },
            has(x, y) {
                x = Math.floor(x);
                y = Math.floor(y);
                return x >= 0 && y >= 0 && x < w && y < h && buf[y * w + x] !== 0;
            },
            done() {
                ctx.putImageData(img, 0, 0);
                return c;
            }
        };
    }

    // 4x4 ordered dither: pick(ramp, 2.3, x, y) mixes ramp[2] and ramp[3] 70/30.
    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    const th = (x, y) => (BAYER[((y & 3) << 2) | (x & 3)] + 0.5) / 16;
    function pick(ramp, v, x, y) {
        const n = ramp.length - 1;
        if (!(v > 0)) return ramp[0];
        if (v >= n) return ramp[n];
        const i = Math.floor(v);
        return v - i > th(x, y) ? ramp[i + 1] : ramp[i];
    }

    const hash = (x, y = 0, s = 0) => {
        let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041);
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    };
    const smooth = t => t * t * (3 - 2 * t);
    function noise(x, y = 0, s = 0) {
        const xi = Math.floor(x);
        const yi = Math.floor(y);
        const u = smooth(x - xi);
        const v = smooth(y - yi);
        const a = hash(xi, yi, s);
        const b = hash(xi + 1, yi, s);
        const c = hash(xi, yi + 1, s);
        const d = hash(xi + 1, yi + 1, s);
        return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    }
    const fbm = (x, y, s) => noise(x, y, s) * 0.6 + noise(x * 2.1, y * 2.1, s + 7) * 0.28 + noise(x * 4.3, y * 4.3, s + 13) * 0.12;
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

    function rng(seed) {
        return () => {
            seed = (seed + 0x6d2b79f5) | 0;
            let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    // Paint string sprites ('.' = transparent) into a bitmap through a palette map.
    function stamp(L, rows, dx, dy, pal, flip = false) {
        rows.forEach((row, y) => {
            for (let x = 0; x < row.length; x++) {
                const key = row[flip ? row.length - 1 - x : x];
                if (key !== '.' && pal[key] !== undefined) L.set(dx + x, dy + y, pal[key]);
            }
        });
    }

    // radial glow in five alpha steps, dithered between steps (drawn with 'lighter')
    function paintGlow(radius, hex, strength, squash = 1) {
        const size = radius * 2 + 1;
        const L = bitmap(size, size);
        const [r, g, b] = hexRgb(hex);
        const steps = 5;
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const d = Math.hypot(x - radius, (y - radius) / squash) / radius;
                if (d >= 1) continue;
                const q = (1 - d) * (1 - d) * steps;
                const lvl = Math.floor(q) + (q - Math.floor(q) > th(x, y) ? 1 : 0);
                if (!lvl) continue;
                const a = Math.round((lvl / steps) * strength * 255);
                L.set(x, y, ((a << 24) | (b << 16) | (g << 8) | r) >>> 0);
            }
        }
        return L.done();
    }

    // The CSS width for `artW` art pixels that puts each one on whole device pixels
    // when that comes within `slack` of `avail`; otherwise just fill `avail`.
    function crispWidth(avail, artW, slack = 0.84) {
        const dpr = window.devicePixelRatio || 1;
        const k = Math.floor((avail * dpr) / artW);
        const css = (k * artW) / dpr;
        return k < 1 || css < avail * slack ? avail : css;
    }

    // The CSS width for `artW` art pixels at the whole-device-pixel scale nearest `target`.
    function crispNear(target, artW) {
        const dpr = window.devicePixelRatio || 1;
        return (Math.max(1, Math.round((target * dpr) / artW)) * artW) / dpr;
    }

    // Call frame(dt) about `fps` times a second while `el` is near the viewport
    // and the tab is visible. Never runs under reduced motion (callers paint once).
    // Returns { get visible(), start(), stop() }; onVisible fires the first time.
    function loop(el, frame, { fps = 30, margin = '200px', onVisible } = {}) {
        let visible = false;
        let raf = 0;
        let last = 0;
        let seen = false;
        const gap = 1000 / fps - 2;
        const tickFrame = now => {
            raf = 0;
            if (!visible || document.hidden) return;
            if (now - last >= gap) {
                frame(Math.min(0.1, (now - last) / 1000));
                last = now;
            }
            raf = requestAnimationFrame(tickFrame);
        };
        const api = {
            get visible() {
                return visible;
            },
            start() {
                if (reducedMotion || raf || !visible || document.hidden) return;
                last = performance.now();
                raf = requestAnimationFrame(tickFrame);
            },
            stop() {
                cancelAnimationFrame(raf);
                raf = 0;
            }
        };
        const show = on => {
            visible = on;
            if (on && !seen) {
                seen = true;
                onVisible?.();
            }
            if (on) api.start();
        };
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(entries => show(entries[0].isIntersecting), { rootMargin: margin }).observe(el);
        } else {
            show(true);
        }
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) api.start();
        });
        return api;
    }

    const art = {
        hexRgb, u32, u32Map, mixHex, expand, mixU32, bitmap, BAYER, th, pick,
        hash, noise, fbm, clamp, rng, stamp, paintGlow, crispWidth, crispNear, loop
    };

    window.PixelKit = { PALETTE, paint, canvasFor, redraw, animate, reducedMotion, art };
})();
