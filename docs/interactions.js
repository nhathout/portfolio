// Site-wide interactions layered on top of script.js:
// command palette, featured-project media, scroll reveals, scroll progress,
// copy-to-clipboard + toast, stat count-ups, and a country-flag emoji fallback.
// Relies on globals from script.js (scrollToSection, projectEntries, openProjectDialog, ...).
(() => {
    const root = document.documentElement;
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
    const EMAIL = 'nhathout@bu.edu';
    const RESUME_URL = 'assets/files/noah_hathout_resume.pdf';

    // ---------------------------------------------------------------------
    //  Country flags: Windows ships no flag glyphs, so 🇺🇸 renders as "US".
    //  Detection adapted from country-flag-emoji-polyfill (MIT); the font is
    //  Twemoji Country Flags (graphics CC-BY 4.0, Twitter, Inc. and contributors),
    //  self-hosted and restricted by unicode-range so it only affects flags.
    // ---------------------------------------------------------------------
    function canRenderEmoji(emoji) {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return true;
        ctx.textBaseline = 'top';
        ctx.font = '100px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
        ctx.scale(0.01, 0.01);
        const sample = color => {
            ctx.clearRect(0, 0, 100, 100);
            ctx.fillStyle = color;
            ctx.fillText(emoji, 0, 0);
            return ctx.getImageData(0, 0, 1, 1).data.join(',');
        };
        const onWhite = sample('#fff');
        const onBlack = sample('#000');
        // a color glyph ignores fillStyle; a monochrome fallback does not
        return onWhite === onBlack && !onBlack.startsWith('0,0,0,');
    }

    function initFlagFallback() {
        try {
            if (!canRenderEmoji('\u{1F60A}') || canRenderEmoji('\u{1F1FA}\u{1F1F8}')) return;
        } catch (error) {
            return;
        }
        const style = document.createElement('style');
        style.textContent = `@font-face {
            font-family: "Twemoji Country Flags";
            unicode-range: U+1F1E6-1F1FF, U+1F3F4, U+E0062-E0063, U+E0065, U+E0067, U+E006C, U+E006E, U+E0073-E0074, U+E0077, U+E007F;
            src: url("assets/fonts/TwemojiCountryFlags.woff2") format("woff2");
            font-display: swap;
        }`;
        document.head.appendChild(style);
        root.classList.add('flag-fallback');
    }

    // ---------------------------------------------------------------------
    //  Toast + clipboard
    // ---------------------------------------------------------------------
    const toastEl = document.getElementById('toast');
    let toastTimer = null;

    function showToast(message) {
        if (!toastEl) return;
        toastEl.textContent = message;
        toastEl.classList.add('is-visible');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 2400);
    }

    async function copyText(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            const field = document.createElement('textarea');
            field.value = text;
            field.setAttribute('readonly', '');
            field.style.cssText = 'position:fixed;opacity:0;pointer-events:none;';
            document.body.appendChild(field);
            field.select();
            let ok = false;
            try {
                ok = document.execCommand('copy');
            } catch (execError) {
                ok = false;
            }
            field.remove();
            return ok;
        }
    }

    async function copyEmail(button) {
        const ok = await copyText(EMAIL);
        showToast(ok ? `Copied ${EMAIL}` : `Couldn't copy. It's ${EMAIL}`);
        const label = button?.querySelector('[data-copy-label]');
        if (ok && label) {
            const original = label.textContent;
            label.textContent = 'Copied!';
            button.classList.add('is-copied');
            setTimeout(() => {
                label.textContent = original;
                button.classList.remove('is-copied');
            }, 2000);
        }
    }

    function initCopyButtons() {
        document.querySelectorAll('[data-copy-email]').forEach(button => {
            button.addEventListener('click', () => copyEmail(button));
        });
    }

    // The floating resume card sits bottom-right, right on top of whatever is
    // down there; step it aside while an interactive area is on screen: the
    // contact card (which has its own resume button), the game, the playground.
    function initResumeTuck() {
        const popover = document.getElementById('resumePopover');
        const targets = ['contact', 'mini-game', 'bros2Playground']
            .map(id => document.getElementById(id))
            .filter(Boolean);
        if (!popover || !targets.length || !('IntersectionObserver' in window)) return;
        const onScreen = new Set();
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) onScreen.add(entry.target);
                else onScreen.delete(entry.target);
            });
            popover.classList.toggle('is-tucked', onScreen.size > 0);
        }, { threshold: 0.15 });
        targets.forEach(target => observer.observe(target));
    }

    // ---------------------------------------------------------------------
    //  Scroll progress bar
    // ---------------------------------------------------------------------
    function initScrollProgress() {
        const bar = document.getElementById('scrollProgress');
        if (!bar) return;
        let queued = false;
        const update = () => {
            queued = false;
            const max = document.documentElement.scrollHeight - window.innerHeight;
            const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
            bar.style.transform = `scaleX(${progress})`;
        };
        const schedule = () => {
            if (queued) return;
            queued = true;
            requestAnimationFrame(update);
        };
        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule);
        update();
    }

    // ---------------------------------------------------------------------
    //  Reveal-on-scroll (only for things that start below the fold, so
    //  nothing already on screen ever blinks out)
    // ---------------------------------------------------------------------
    function initReveal() {
        const items = Array.from(document.querySelectorAll('[data-reveal]'));
        if (reducedMotion || !('IntersectionObserver' in window) || !items.length) return;
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const el = entry.target;
                observer.unobserve(el);
                el.classList.add('is-revealed');
                // hand transitions back to the element's own hover styles afterwards
                setTimeout(() => el.classList.remove('reveal-pending', 'is-revealed'), 900);
            });
        }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });

        const fold = window.innerHeight * 0.95;
        items.forEach(el => {
            if (el.getBoundingClientRect().top < fold) return;
            el.classList.add('reveal-pending');
            observer.observe(el);
        });
    }

    // ---------------------------------------------------------------------
    //  Count-up stats
    // ---------------------------------------------------------------------
    function initCountUps() {
        const items = Array.from(document.querySelectorAll('[data-count-to]'));
        if (reducedMotion || !('IntersectionObserver' in window) || !items.length) return;
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const el = entry.target;
                observer.unobserve(el);
                const target = Number(el.dataset.countTo) || 0;
                const start = performance.now();
                const duration = 900;
                const tick = now => {
                    const t = Math.min(1, (now - start) / duration);
                    const eased = 1 - Math.pow(1 - t, 3);
                    el.textContent = String(Math.round(target * eased));
                    if (t < 1) requestAnimationFrame(tick);
                };
                el.textContent = '0';
                requestAnimationFrame(tick);
            });
        }, { threshold: 0.6 });
        items.forEach(el => observer.observe(el));
    }

    // ---------------------------------------------------------------------
    //  Command palette (Ctrl/⌘ + K, or "/")
    // ---------------------------------------------------------------------
    const palette = document.getElementById('commandPalette');
    const paletteInput = document.getElementById('paletteInput');
    const paletteList = document.getElementById('paletteList');
    let paletteItems = [];
    let paletteResults = [];
    let paletteActive = 0;

    function downloadResume() {
        const link = document.createElement('a');
        link.href = RESUME_URL;
        link.download = 'noahhathout_cv.pdf';
        document.body.appendChild(link);
        link.click();
        link.remove();
    }

    function openExternal(url) {
        window.open(url, '_blank', 'noopener,noreferrer');
    }

    function goTo(id) {
        if (id === 'top') {
            window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
            return;
        }
        if (typeof scrollToSection === 'function') {
            scrollToSection(id);
        } else {
            document.getElementById(id)?.scrollIntoView();
        }
    }

    function buildPaletteItems() {
        const darkOn = root.classList.contains('darkmode');
        const sections = [
            ['About', 'about', 'bio background countries'],
            ['Education & Experience', 'education-experience', 'timeline jobs work school universal robots umg boston university'],
            ['Skills', 'skills', 'stack languages tools'],
            ['Projects', 'projects', 'portfolio work'],
            ['BROS2 · coming soon', 'featured-bros2', 'bros2 ros ros2 visual builder blocks product early access'],
            ['World tour', 'aboutTour', 'countries travel map journey lived germany turkey netherlands china'],
            ['Side quests', 'aboutQuests', 'hobbies climbing tennis gaming soccer 3d printing twitch'],
            ['Awards & Affiliations', 'awards-affiliations', 'honors dean ieee'],
            ['Contact', 'contact', 'email linkedin hello hire'],
            ['Back to top', 'top', 'home hero start']
        ].map(([label, id, keywords]) => ({
            group: 'Jump to',
            label,
            keywords,
            icon: '#',
            run: () => goTo(id)
        }));

        const projects = (typeof projectEntries !== 'undefined' ? projectEntries : []).map(project => ({
            group: 'Projects',
            label: project.title,
            hint: project.upcoming ? 'locked' : (project.status === 'live' ? 'live' : ''),
            keywords: [project.subtitle, ...(project.tags || []), ...(project.categories || [])].filter(Boolean).join(' '),
            icon: '▸',
            run: () => {
                if (typeof openProjectDialog === 'function') {
                    openProjectDialog(project.id);
                }
            }
        }));

        const actions = [
            {
                label: darkOn ? 'Switch to light mode' : 'Switch to dark mode',
                keywords: 'theme dark light appearance night',
                icon: darkOn ? '☀' : '☾',
                run: () => document.querySelector('[data-theme-toggle]')?.click()
            },
            { label: 'Download resume (PDF)', keywords: 'cv resume pdf', icon: '↓', run: downloadResume },
            { label: 'Copy email address', keywords: 'email contact clipboard', icon: '⧉', run: () => copyEmail() },
            { label: 'Send an email', keywords: 'email contact mail', icon: '✉', run: () => { window.location.href = `mailto:${EMAIL}`; } },
            { label: 'Open GitHub', keywords: 'github code repos', icon: '↗', run: () => openExternal('https://github.com/nhathout') },
            { label: 'Open LinkedIn', keywords: 'linkedin profile', icon: '↗', run: () => openExternal('https://www.linkedin.com/in/noah-hathout/') }
        ];
        const gameEl = document.getElementById('mini-game');
        if (gameEl && getComputedStyle(gameEl).display !== 'none') {
            actions.push({
                label: 'Play Atari [Course]out',
                keywords: 'game breakout arcade play leaderboard',
                icon: '◆',
                run: () => {
                    const offset = (document.getElementById('topNav')?.offsetHeight || 0) + 24;
                    window.scrollTo({ top: gameEl.getBoundingClientRect().top + window.scrollY - offset, behavior: reducedMotion ? 'auto' : 'smooth' });
                    setTimeout(() => document.getElementById('startBtn')?.focus({ preventScroll: true }), 500);
                }
            });
        }

        return [
            ...sections,
            ...projects,
            ...actions.map(action => ({ group: 'Actions', ...action }))
        ];
    }

    function scorePaletteItem(item, terms) {
        const label = item.label.toLowerCase();
        const haystack = `${label} ${item.keywords || ''} ${item.group}`.toLowerCase();
        let score = 0;
        for (const term of terms) {
            const index = haystack.indexOf(term);
            if (index === -1) return -1;
            if (label.startsWith(term)) score += 6;
            else if (label.includes(` ${term}`)) score += 4;
            else if (label.includes(term)) score += 3;
            else score += 1;
        }
        return score;
    }

    function renderPalette() {
        const query = paletteInput.value.trim().toLowerCase();
        const terms = query.split(/\s+/).filter(Boolean);
        if (terms.length) {
            paletteResults = paletteItems
                .map((item, order) => ({ item, order, score: scorePaletteItem(item, terms) }))
                .filter(entry => entry.score >= 0)
                .sort((a, b) => b.score - a.score || a.order - b.order)
                .map(entry => entry.item);
        } else {
            paletteResults = paletteItems.slice();
        }
        paletteActive = Math.min(paletteActive, Math.max(0, paletteResults.length - 1));

        paletteList.innerHTML = '';
        if (!paletteResults.length) {
            const empty = document.createElement('li');
            empty.className = 'palette__empty';
            empty.textContent = 'No matches. Try “ros”, “robot”, or “resume”.';
            paletteList.appendChild(empty);
            paletteInput.setAttribute('aria-activedescendant', '');
            return;
        }

        let lastGroup = null;
        paletteResults.forEach((item, index) => {
            if (!terms.length && item.group !== lastGroup) {
                const heading = document.createElement('li');
                heading.className = 'palette__group';
                heading.setAttribute('role', 'presentation');
                heading.textContent = item.group;
                paletteList.appendChild(heading);
                lastGroup = item.group;
            }
            const option = document.createElement('li');
            option.id = `palette-option-${index}`;
            option.className = 'palette__item';
            option.setAttribute('role', 'option');
            option.dataset.index = String(index);

            const icon = document.createElement('span');
            icon.className = 'palette__icon';
            icon.setAttribute('aria-hidden', 'true');
            icon.textContent = item.icon || '•';
            const label = document.createElement('span');
            label.className = 'palette__label';
            label.textContent = item.label;
            option.append(icon, label);
            if (item.hint || terms.length) {
                const hint = document.createElement('span');
                hint.className = 'palette__hint';
                hint.textContent = item.hint || item.group;
                option.appendChild(hint);
            }
            paletteList.appendChild(option);
        });
        setPaletteActive(paletteActive, { scroll: false });
    }

    function setPaletteActive(index, { scroll = true } = {}) {
        if (!paletteResults.length) return;
        paletteActive = (index + paletteResults.length) % paletteResults.length;
        paletteList.querySelectorAll('.palette__item').forEach(option => {
            const active = Number(option.dataset.index) === paletteActive;
            option.classList.toggle('is-active', active);
            option.setAttribute('aria-selected', String(active));
            if (active) {
                paletteInput.setAttribute('aria-activedescendant', option.id);
                if (scroll) option.scrollIntoView({ block: 'nearest' });
            }
        });
    }

    function runPaletteItem(index) {
        const item = paletteResults[index];
        if (!item) return;
        closePalette();
        // let the dialog finish closing (and restore focus) before acting
        setTimeout(() => item.run(), 30);
    }

    function openPalette() {
        if (!palette || palette.open) return;
        if (typeof setMobileMenuState === 'function') setMobileMenuState(false);
        if (document.getElementById('projectDialog')?.open) {
            document.getElementById('projectDialog').close();
        }
        paletteItems = buildPaletteItems();
        paletteInput.value = '';
        paletteActive = 0;
        renderPalette();
        if (typeof palette.showModal === 'function') {
            palette.showModal();
        } else {
            palette.setAttribute('open', '');
        }
        root.classList.add('dialog-open');
        paletteInput.focus();
    }

    function closePalette() {
        if (!palette?.open) return;
        if (typeof palette.close === 'function') {
            palette.close();
        } else {
            palette.removeAttribute('open');
            root.classList.remove('dialog-open');
        }
    }

    function initPalette() {
        if (!palette || !paletteInput || !paletteList) return;
        document.querySelectorAll('[data-palette-kbd]').forEach(kbd => {
            kbd.textContent = isMac ? '⌘K' : 'Ctrl K';
        });
        document.querySelectorAll('[data-palette-open]').forEach(button => {
            button.addEventListener('click', openPalette);
        });

        palette.addEventListener('close', () => {
            if (!document.querySelector('dialog[open]')) root.classList.remove('dialog-open');
        });
        palette.addEventListener('click', event => {
            if (event.target === palette) closePalette();
        });
        paletteInput.addEventListener('input', () => {
            paletteActive = 0;
            renderPalette();
        });
        paletteInput.addEventListener('keydown', event => {
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                setPaletteActive(paletteActive + 1);
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                setPaletteActive(paletteActive - 1);
            } else if (event.key === 'Enter') {
                event.preventDefault();
                runPaletteItem(paletteActive);
            }
        });
        paletteList.addEventListener('mousemove', event => {
            const option = event.target.closest('.palette__item');
            if (option && Number(option.dataset.index) !== paletteActive) {
                setPaletteActive(Number(option.dataset.index), { scroll: false });
            }
        });
        paletteList.addEventListener('click', event => {
            const option = event.target.closest('.palette__item');
            if (option) runPaletteItem(Number(option.dataset.index));
        });

        document.addEventListener('keydown', event => {
            const key = event.key?.toLowerCase();
            if ((event.ctrlKey || event.metaKey) && key === 'k') {
                event.preventDefault();
                if (palette.open) {
                    closePalette();
                } else {
                    openPalette();
                }
                return;
            }
            if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey) {
                const typing = event.target.closest?.('input, textarea, select, [contenteditable="true"]');
                if (typing || document.querySelector('dialog[open]')) return;
                event.preventDefault();
                openPalette();
            }
        });
    }

    // ---------------------------------------------------------------------
    initFlagFallback();
    initCopyButtons();
    initResumeTuck();
    initScrollProgress();
    initReveal();
    initCountUps();
    initPalette();
})();
