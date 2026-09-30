// Upgrades for the Experience, Awards, and Contact sections. Works on top of the
// markup in index.html and the edex logic in script.js without replacing it.
(() => {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const finePointer = window.matchMedia?.('(pointer: fine)').matches ?? true;
    const EMAIL = 'nhathout@bu.edu';
    const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

    function flashToast(message) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('is-visible');
        clearTimeout(flashToast.timer);
        flashToast.timer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
    }

    function onceVisible(el, callback, threshold = 0.25) {
        if (!el) return;
        if (!('IntersectionObserver' in window)) {
            callback();
            return;
        }
        const observer = new IntersectionObserver(entries => {
            if (!entries[0].isIntersecting) return;
            observer.disconnect();
            callback();
        }, { threshold });
        observer.observe(el);
    }

    // ---------------------------------------------------------------------
    //  Experience + Education
    // ---------------------------------------------------------------------
    function parseMonth(text) {
        const match = /([a-z]{3})[a-z]*\.?\s+(\d{4})/i.exec(text || '');
        if (!match) return null;
        const month = MONTHS.indexOf(match[1].toLowerCase());
        return month < 0 ? null : { y: Number(match[2]), m: month };
    }

    // "Jun 2026 - Present" -> "4 mos"; "May 2024 - Aug 2024" -> "4 mos"
    function durationLabel(period) {
        if (!period) return '';
        const [startText, endText] = period.replace('Exp.', '').split(/\s[-–]\s/);
        const start = parseMonth(startText);
        if (!start) return '';
        const now = new Date();
        const end = /present/i.test(endText || '') ? { y: now.getFullYear(), m: now.getMonth() } : parseMonth(endText);
        if (!end) return '';
        const months = (end.y - start.y) * 12 + (end.m - start.m) + 1;
        if (months <= 0) return '';
        const years = Math.floor(months / 12);
        const rest = months % 12;
        const parts = [];
        if (years) parts.push(`${years} yr${years > 1 ? 's' : ''}`);
        if (rest) parts.push(`${rest} mo${rest > 1 ? 's' : ''}`);
        return parts.join(' ');
    }

    function animateCount(el, target, pad) {
        const format = value => String(value).padStart(pad, '0');
        if (reducedMotion) {
            el.textContent = format(target);
            return;
        }
        const start = performance.now();
        const tick = now => {
            const t = Math.min(1, (now - start) / 900);
            el.textContent = format(Math.round(target * (1 - Math.pow(1 - t, 3))));
            if (t < 1) requestAnimationFrame(tick);
        };
        el.textContent = format(0);
        requestAnimationFrame(tick);
    }

    function initEdex() {
        const shell = document.querySelector('#education-experience .edex-shell');
        const rail = document.getElementById('edexRail');
        const cards = Array.from(document.querySelectorAll('.edex-card'));
        if (!shell || !rail || !cards.length) return;

        // stats derived from the timeline itself so they never drift out of date
        const counts = [
            cards.length,
            cards.filter(card => card.dataset.category === 'education').length,
            cards.filter(card => card.dataset.category === 'experience').length,
            new Set(cards.map(card => card.dataset.location).filter(Boolean)).size
        ];
        const statEls = Array.from(shell.querySelectorAll('.edex-stat span'));
        statEls.forEach((el, index) => {
            if (counts[index] === undefined) return;
            el.textContent = String(counts[index]).padStart(2, '0');
        });
        onceVisible(shell.querySelector('.edex-stats'), () => {
            statEls.forEach((el, index) => {
                if (counts[index] !== undefined) animateCount(el, counts[index], 2);
            });
        }, 0.6);

        // durations + "current" markers
        cards.forEach(card => {
            const period = card.dataset.period || '';
            if (/present/i.test(period)) card.classList.add('is-current');
            if (card.dataset.category !== 'experience') return;
            const label = durationLabel(period);
            if (!label) return;
            card.dataset.duration = label;
            const range = card.querySelector('.edex-card__range');
            if (range && !range.querySelector('.edex-card__duration')) {
                const chip = document.createElement('span');
                chip.className = 'edex-card__duration';
                chip.textContent = label;
                range.append(' · ', chip);
            }
        });

        // spotlight: add the duration pill whenever script.js re-renders the meta row
        const meta = document.getElementById('edexSpotlightMeta');
        const addSpotlightDuration = () => {
            const active = document.querySelector('.edex-card.is-active');
            if (!meta || !active?.dataset.duration || meta.querySelector('.edex-meta-pill--duration')) return;
            const pill = document.createElement('span');
            pill.className = 'edex-meta-pill edex-meta-pill--duration';
            pill.textContent = `⏱ ${active.dataset.duration}`;
            meta.appendChild(pill);
        };
        if (meta) {
            new MutationObserver(addSpotlightDuration).observe(meta, { childList: true });
            addSpotlightDuration();
        }

        // timeline rail fills in as you scroll past each stop
        const line = rail.querySelector('.edex-rail__line');
        let progress = null;
        if (line) {
            progress = document.createElement('span');
            progress.className = 'edex-rail__progress';
            progress.setAttribute('aria-hidden', 'true');
            line.appendChild(progress);
        }
        let queued = false;
        const update = () => {
            queued = false;
            const anchor = window.innerHeight * 0.55;
            const rect = rail.getBoundingClientRect();
            const ratio = Math.min(1, Math.max(0, (anchor - rect.top) / Math.max(1, rect.height)));
            if (progress) progress.style.transform = `scaleY(${ratio})`;
            cards.forEach(card => {
                const top = card.getBoundingClientRect().top;
                card.classList.toggle('is-passed', top + 24 < anchor);
            });
        };
        const schedule = () => {
            if (queued) return;
            queued = true;
            requestAnimationFrame(update);
        };
        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule);
        update();

        // ↑ / ↓ between visible cards
        rail.addEventListener('keydown', event => {
            if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
            const visible = cards.filter(card => !card.classList.contains('is-hidden'));
            const index = visible.indexOf(document.activeElement);
            if (index === -1) return;
            event.preventDefault();
            const next = visible[index + (event.key === 'ArrowDown' ? 1 : -1)];
            next?.focus();
            next?.scrollIntoView({ block: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' });
        });
    }

    // ---------------------------------------------------------------------
    //  Awards: tilt + "achievement unlocked"
    // ---------------------------------------------------------------------
    function initTilt(selector) {
        if (reducedMotion || !finePointer) return;
        document.querySelectorAll(selector).forEach(card => {
            const glare = document.createElement('span');
            glare.className = 'tilt-glare';
            glare.setAttribute('aria-hidden', 'true');
            card.appendChild(glare);
            card.addEventListener('pointermove', event => {
                const rect = card.getBoundingClientRect();
                const x = (event.clientX - rect.left) / rect.width;
                const y = (event.clientY - rect.top) / rect.height;
                card.style.setProperty('--tilt-x', `${(0.5 - y) * 9}deg`);
                card.style.setProperty('--tilt-y', `${(x - 0.5) * 11}deg`);
                card.style.setProperty('--glare-x', `${x * 100}%`);
                card.style.setProperty('--glare-y', `${y * 100}%`);
                card.classList.add('is-tilting');
            });
            card.addEventListener('pointerleave', () => {
                card.classList.remove('is-tilting');
                card.style.removeProperty('--tilt-x');
                card.style.removeProperty('--tilt-y');
            });
        });
    }

    function initAwards() {
        const grid = document.querySelector('#awards-affiliations .award-grid');
        if (!grid) return;
        const cards = Array.from(grid.querySelectorAll('.award-card'));
        cards.forEach(card => {
            const banner = document.createElement('div');
            banner.className = 'award-unlock';
            banner.setAttribute('aria-hidden', 'true');
            banner.innerHTML = '<span class="award-unlock__icon">🏆</span><span><strong>Achievement unlocked</strong><small></small></span>';
            banner.querySelector('small').textContent = card.querySelector('.award-ribbon span')?.textContent.trim() || '';
            card.appendChild(banner);
        });
        if (!reducedMotion) {
            onceVisible(grid, () => {
                cards.forEach((card, index) => {
                    setTimeout(() => {
                        card.classList.add('is-unlocking');
                        setTimeout(() => card.classList.remove('is-unlocking'), 2300);
                    }, index * 420);
                });
            }, 0.35);
        }
        initTilt('#awards-affiliations .award-card, #awards-affiliations .affiliation-card');
    }

    // ---------------------------------------------------------------------
    //  Contact: Boston clock, CRT channels, note composer
    // ---------------------------------------------------------------------
    function initClock() {
        const clocks = Array.from(document.querySelectorAll('[data-boston-clock]'));
        if (!clocks.length) return;
        let format;
        try {
            format = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
        } catch (error) {
            return;
        }
        const render = () => {
            const now = new Date();
            const text = format.format(now);
            clocks.forEach(el => {
                el.textContent = text;
                el.dateTime = now.toISOString();
            });
        };
        render();
        setInterval(render, 30000);
    }

    function initCrt() {
        const screen = document.querySelector('[data-crt-screen]');
        if (!screen) return;
        const video = screen.querySelector('video');
        const label = screen.querySelector('[data-crt-channel]');
        const channels = [
            { name: 'CH 03', filter: 'none' },
            { name: 'CH 04 · B&W', filter: 'grayscale(1) contrast(1.15)' },
            { name: 'CH 05 · 1970', filter: 'sepia(0.85) saturate(1.2)' },
            { name: 'CH 06 · VAPOR', filter: 'hue-rotate(160deg) saturate(1.4)' },
            { name: 'CH 07 · NIGHT', filter: 'invert(1) hue-rotate(180deg)' }
        ];
        let index = 0;
        screen.addEventListener('click', () => {
            index = (index + 1) % channels.length;
            screen.classList.remove('is-flipping');
            void screen.offsetWidth; // restart the static burst
            screen.classList.add('is-flipping');
            setTimeout(() => {
                if (video) video.style.filter = channels[index].filter;
                if (label) label.textContent = channels[index].name;
            }, reducedMotion ? 0 : 160);
            setTimeout(() => screen.classList.remove('is-flipping'), 520);
        });
    }

    function initComposer() {
        const form = document.querySelector('[data-composer]');
        if (!form) return;
        const topics = Array.from(form.querySelectorAll('.composer__topic'));
        const message = form.querySelector('textarea');
        let topic = topics.find(button => button.classList.contains('is-active'))?.dataset.topic || 'Saying hi';

        topics.forEach(button => {
            button.addEventListener('click', () => {
                topic = button.dataset.topic;
                topics.forEach(entry => {
                    const active = entry === button;
                    entry.classList.toggle('is-active', active);
                    entry.setAttribute('aria-pressed', String(active));
                });
            });
        });

        const subject = () => `${topic} · via noahhathout.com`;
        form.addEventListener('submit', event => {
            event.preventDefault();
            const body = message.value.trim();
            const href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject())}${body ? `&body=${encodeURIComponent(body)}` : ''}`;
            window.location.href = href;
        });
        form.querySelector('[data-composer-copy]')?.addEventListener('click', async () => {
            const text = `To: ${EMAIL}\nSubject: ${subject()}\n\n${message.value.trim()}`;
            try {
                await navigator.clipboard.writeText(text);
                flashToast('Note copied. Paste it into any email.');
            } catch (error) {
                flashToast(`Couldn't copy. Email ${EMAIL}`);
            }
        });
    }

    initEdex();
    initAwards();
    initClock();
    initCrt();
    initComposer();
})();
