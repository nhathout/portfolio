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

    window.PixelKit = { PALETTE, paint, canvasFor, redraw, animate, reducedMotion };
})();
