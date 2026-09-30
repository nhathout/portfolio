// Featured Wirepup panel:
//   1. demo video + screenshot tabs, with a theater ("lights off") view and a
//      draggable pop-out mini-player
//   2. a tiny Wirepup playground: draggable blocks, typed ports, wires, Run/Stop,
//      live values, a live plot, problems, topics, and generated launch code
//   3. the early-access waitlist (tally lives on the Render API in server.js)
(() => {
    const panel = document.getElementById('featured-bros2');
    if (!panel) return;

    const root = document.documentElement;
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const API_BASE = 'https://portfolio-xoe6.onrender.com';
    const CONTACT_EMAIL = 'nhathout@bu.edu';

    const ICONS = {
        expand: 'M4 9V4h5v2H6v3H4Zm11-5h5v5h-2V6h-3V4ZM4 15h2v3h3v2H4v-5Zm14 3v-3h2v5h-5v-2h3Z',
        popout: 'M5 5h7v2H7v10h10v-5h2v7H5V5Zm9 0h5v5h-2V8.4l-5.3 5.3-1.4-1.4L15.6 7H14V5Z',
        close: 'M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4 6.4 5Z',
        play: 'M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z',
        stop: 'M7 6h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z'
    };

    const icon = (name, className = '') => `<svg aria-hidden="true" class="${className}" viewBox="0 0 24 24"><path d="${ICONS[name]}"/></svg>`;

    function dialogOpenCleanup() {
        if (!document.querySelector('dialog[open]')) {
            root.classList.remove('dialog-open', 'lights-off');
        }
    }

    // =====================================================================
    //  1. Media: lazy demo video, screenshot tabs, theater + pop-out
    // =====================================================================
    function initFeatureMedia() {
        const screen = document.getElementById('featureScreen');
        const caption = document.getElementById('featureCaption');
        const windowEl = panel.querySelector('.feature-window');
        const windowTitle = panel.querySelector('[data-feature-window-title]');
        const tabs = Array.from(panel.querySelectorAll('.feature-tab'));
        const video = screen?.querySelector('[data-feature-video]');
        const expandBtn = panel.querySelector('[data-feature-expand]');
        const popoutBtn = panel.querySelector('[data-feature-popout]');
        if (!screen || !video || !tabs.length) return;

        let videoReady = false;
        let screenVisible = false;
        let showingVideo = true;
        let still = null;
        let mode = 'inline'; // 'inline' | 'theater' | 'popout'
        let theater = null;
        let pip = null;
        let placeholder = null;

        const ensureVideoSource = () => {
            if (videoReady) return;
            const source = video.querySelector('source[data-src]');
            if (source) {
                source.src = source.dataset.src;
                video.load();
            }
            videoReady = true;
        };

        const syncPlayback = () => {
            const wanted = mode === 'inline' ? (showingVideo && screenVisible) : true;
            if (wanted && !reducedMotion) {
                ensureVideoSource();
                video.play().catch(() => {});
            } else if (!video.paused) {
                video.pause();
            }
        };

        if (reducedMotion) {
            video.controls = true;
            video.addEventListener('play', ensureVideoSource, { once: true });
            video.addEventListener('click', ensureVideoSource, { once: true });
        }

        if ('IntersectionObserver' in window) {
            new IntersectionObserver(entries => {
                screenVisible = entries[0].isIntersecting;
                syncPlayback();
            }, { threshold: 0.25 }).observe(screen);
        } else {
            screenVisible = true;
            syncPlayback();
        }

        // first time the window scrolls into view it "lands" from a zoomed-in state
        if (!reducedMotion && windowEl && 'IntersectionObserver' in window) {
            const entrance = new IntersectionObserver(entries => {
                if (!entries[0].isIntersecting) return;
                entrance.disconnect();
                windowEl.classList.add('is-entering');
                windowEl.addEventListener('animationend', () => windowEl.classList.remove('is-entering'), { once: true });
            }, { threshold: 0.35 });
            entrance.observe(windowEl);
        }

        const moveVideoTo = (container, { prepend = false } = {}) => {
            const time = video.currentTime;
            if (prepend) container.prepend(video);
            else container.appendChild(video);
            if (time && Math.abs(video.currentTime - time) > 0.25) video.currentTime = time;
        };

        const syncScreen = () => {
            const videoAway = mode !== 'inline';
            video.hidden = videoAway ? false : !showingVideo;
            if (showingVideo && videoAway) {
                if (!placeholder) {
                    placeholder = document.createElement('button');
                    placeholder.type = 'button';
                    placeholder.className = 'feature-screen__away';
                    placeholder.innerHTML = `${icon('popout')}<span>The demo is playing in the mini-player.</span><strong>Bring it back</strong>`;
                    placeholder.addEventListener('click', () => {
                        if (mode === 'popout') closePip();
                    });
                }
                placeholder.hidden = false;
                screen.appendChild(placeholder);
            } else if (placeholder) {
                placeholder.hidden = true;
            }
            if (popoutBtn) popoutBtn.hidden = !showingVideo;
        };

        const selectTab = (tab, { focus = false } = {}) => {
            tabs.forEach(entry => {
                const active = entry === tab;
                entry.classList.toggle('is-active', active);
                entry.setAttribute('aria-selected', String(active));
                entry.tabIndex = active ? 0 : -1;
            });
            if (focus) tab.focus();
            if (caption) caption.textContent = tab.dataset.caption || '';
            if (windowTitle) windowTitle.textContent = `Wirepup · ${tab.dataset.title || tab.textContent.trim()}`;

            showingVideo = tab.dataset.kind === 'video';
            screen.classList.add('is-swapping');
            window.setTimeout(() => {
                if (showingVideo) {
                    still?.remove();
                    still = null;
                } else {
                    if (!still) {
                        still = document.createElement('img');
                        still.decoding = 'async';
                        screen.appendChild(still);
                    }
                    still.src = tab.dataset.src;
                    still.alt = `Wirepup screenshot: ${tab.dataset.caption || tab.textContent.trim()}`;
                }
                syncScreen();
                syncPlayback();
                screen.classList.remove('is-swapping');
            }, reducedMotion ? 0 : 160);
        };

        tabs.forEach((tab, index) => {
            tab.tabIndex = tab.classList.contains('is-active') ? 0 : -1;
            tab.addEventListener('click', () => selectTab(tab));
            tab.addEventListener('keydown', event => {
                const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
                if (step) {
                    event.preventDefault();
                    selectTab(tabs[(index + step + tabs.length) % tabs.length], { focus: true });
                } else if (event.key === 'Home' || event.key === 'End') {
                    event.preventDefault();
                    selectTab(tabs[event.key === 'Home' ? 0 : tabs.length - 1], { focus: true });
                }
            });
        });

        // ---- theater ("lights off") --------------------------------------
        const buildTheater = () => {
            const dialog = document.createElement('dialog');
            dialog.className = 'bros2-theater';
            dialog.setAttribute('aria-label', 'Wirepup demo, theater view');
            dialog.innerHTML = `
                <div class="bros2-theater__frame">
                    <div class="bros2-theater__bar">
                        <span aria-hidden="true" class="bros2-theater__dots"><i></i><i></i><i></i></span>
                        <span class="bros2-theater__title" data-theater-title></span>
                        <button type="button" class="bros2-theater__close" data-theater-close aria-label="Close theater view">${icon('close')}<span>Esc</span></button>
                    </div>
                    <div class="bros2-theater__screen" data-theater-screen></div>
                    <p class="bros2-theater__caption" data-theater-caption></p>
                </div>`;
            document.body.appendChild(dialog);
            dialog.querySelector('[data-theater-close]').addEventListener('click', () => dialog.close());
            dialog.addEventListener('click', event => {
                if (event.target === dialog) dialog.close();
            });
            dialog.addEventListener('close', () => {
                const slot = dialog.querySelector('[data-theater-screen]');
                if (mode === 'theater') {
                    moveVideoTo(screen, { prepend: true });
                    video.controls = reducedMotion;
                    mode = 'inline';
                }
                slot.innerHTML = '';
                syncScreen();
                syncPlayback();
                dialogOpenCleanup();
                expandBtn?.focus({ preventScroll: true });
            });
            return dialog;
        };

        const openTheater = () => {
            if (!theater) theater = buildTheater();
            if (theater.open) return;
            const slot = theater.querySelector('[data-theater-screen]');
            slot.innerHTML = '';
            const useVideo = showingVideo || mode === 'popout';
            if (mode === 'popout') closePip({ returnVideo: false });
            if (useVideo) {
                moveVideoTo(slot);
                video.hidden = false;
                video.controls = true;
                mode = 'theater';
            } else if (still) {
                const img = document.createElement('img');
                img.src = still.src;
                img.alt = still.alt;
                slot.appendChild(img);
            }
            theater.querySelector('[data-theater-title]').textContent = useVideo ? 'Wirepup · Build & drive' : (windowTitle?.textContent || 'Wirepup');
            theater.querySelector('[data-theater-caption]').textContent = useVideo ? (tabs[0].dataset.caption || '') : (caption?.textContent || '');
            syncScreen();
            if (typeof theater.showModal === 'function') {
                theater.showModal();
            } else {
                theater.setAttribute('open', '');
            }
            root.classList.add('dialog-open', 'lights-off');
            syncPlayback();
        };

        // ---- pop-out mini-player -------------------------------------------
        const PIP_MARGIN = 16;
        let pipCorner = 'bl';

        const pipBounds = () => {
            const header = document.getElementById('topNav');
            const top = (header ? header.getBoundingClientRect().bottom : 0) + PIP_MARGIN;
            return { top, left: PIP_MARGIN, right: window.innerWidth - PIP_MARGIN, bottom: window.innerHeight - PIP_MARGIN };
        };

        const placePip = (corner, { animate = true } = {}) => {
            if (!pip) return;
            pipCorner = corner;
            const b = pipBounds();
            const w = pip.el.offsetWidth;
            const h = pip.el.offsetHeight;
            const x = corner.endsWith('r') ? b.right - w : b.left;
            const y = corner.startsWith('t') ? b.top : b.bottom - h;
            pip.el.classList.toggle('is-snapping', animate && !reducedMotion);
            pip.el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
            pip.x = x;
            pip.y = y;
        };

        const buildPip = () => {
            const el = document.createElement('div');
            el.className = 'bros2-pip';
            el.hidden = true;
            el.setAttribute('role', 'region');
            el.setAttribute('aria-label', 'Wirepup demo mini-player');
            el.innerHTML = `
                <div class="bros2-pip__bar" data-pip-handle title="Drag me">
                    <span aria-hidden="true" class="bros2-pip__grip"></span>
                    <span class="bros2-pip__title">Wirepup demo</span>
                    <button type="button" class="bros2-pip__btn" data-pip-expand aria-label="Expand to theater view">${icon('expand')}</button>
                    <button type="button" class="bros2-pip__btn" data-pip-close aria-label="Close mini-player and put the video back">${icon('close')}</button>
                </div>
                <div class="bros2-pip__screen" data-pip-screen></div>`;
            document.body.appendChild(el);
            const state = { el, screen: el.querySelector('[data-pip-screen]'), x: 0, y: 0 };

            el.querySelector('[data-pip-close]').addEventListener('click', () => closePip());
            el.querySelector('[data-pip-expand]').addEventListener('click', openTheater);
            state.screen.addEventListener('click', () => {
                if (video.controls) return;
                if (video.paused) video.play().catch(() => {});
                else video.pause();
            });

            const handle = el.querySelector('[data-pip-handle]');
            let drag = null;
            handle.addEventListener('pointerdown', event => {
                if (event.target.closest('button')) return;
                event.preventDefault();
                handle.setPointerCapture(event.pointerId);
                el.classList.remove('is-snapping');
                el.classList.add('is-dragging');
                drag = { id: event.pointerId, sx: event.clientX, sy: event.clientY, ox: state.x, oy: state.y };
            });
            handle.addEventListener('pointermove', event => {
                if (!drag || event.pointerId !== drag.id) return;
                const b = pipBounds();
                const x = Math.min(Math.max(drag.ox + event.clientX - drag.sx, b.left), b.right - el.offsetWidth);
                const y = Math.min(Math.max(drag.oy + event.clientY - drag.sy, b.top), b.bottom - el.offsetHeight);
                state.x = x;
                state.y = y;
                el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
            });
            const endDrag = event => {
                if (!drag || event.pointerId !== drag.id) return;
                drag = null;
                el.classList.remove('is-dragging');
                const cx = state.x + el.offsetWidth / 2;
                const cy = state.y + el.offsetHeight / 2;
                placePip(`${cy < window.innerHeight / 2 ? 't' : 'b'}${cx < window.innerWidth / 2 ? 'l' : 'r'}`);
            };
            handle.addEventListener('pointerup', endDrag);
            handle.addEventListener('pointercancel', endDrag);
            window.addEventListener('resize', () => {
                if (!el.hidden) placePip(pipCorner, { animate: false });
            });
            return state;
        };

        const openPip = () => {
            if (mode === 'popout') return;
            if (!pip) pip = buildPip();
            moveVideoTo(pip.screen);
            video.hidden = false;
            video.controls = reducedMotion;
            mode = 'popout';
            pip.el.hidden = false;
            placePip(pipCorner, { animate: false });
            pip.el.classList.add('is-arriving');
            requestAnimationFrame(() => requestAnimationFrame(() => pip.el.classList.remove('is-arriving')));
            syncScreen();
            syncPlayback();
        };

        function closePip({ returnVideo = true } = {}) {
            if (!pip || mode !== 'popout') return;
            pip.el.hidden = true;
            if (returnVideo) {
                moveVideoTo(screen, { prepend: true });
                video.controls = reducedMotion;
                mode = 'inline';
                syncScreen();
                syncPlayback();
            }
        }

        expandBtn?.addEventListener('click', openTheater);
        popoutBtn?.addEventListener('click', openPip);
        screen.addEventListener('dblclick', openTheater);
    }

    // =====================================================================
    //  2. Playground: a tiny Wirepup in the browser
    // =====================================================================
    function initPlayground() {
        const host = panel.querySelector('[data-playground]');
        if (!host) return;

        const BLOCKS = {
            signal: {
                title: 'Signal Generator', kind: 'Source', tag: 'ROS', accent: '#60a5fa', icon: 'wave',
                params: 'Sine · 0.5 Hz · amp 1.0', inputs: [], outputs: [{ id: 'signal', type: 'f64' }],
                hint: 'Sources publish on a real ROS 2 topic.'
            },
            slider: {
                title: 'Noise', kind: 'Slider', tag: 'APP', accent: '#818cf8', icon: 'sliders',
                params: 'Minimum 0 · Maximum 1', inputs: [], outputs: [{ id: 'value', type: 'f64' }], control: true,
                hint: 'Tune while it runs: drag it and the running node updates.'
            },
            noise: {
                title: 'Add Noise', kind: 'Processing', tag: 'ROS', accent: '#2dd4bf', icon: 'bolt',
                params: 'Gaussian · std_dev from input', inputs: [{ id: 'in', type: 'f64' }, { id: 'std_dev', type: 'f64', optional: true }],
                outputs: [{ id: 'out', type: 'f64' }], hint: 'Every block is a real ROS 2 node.'
            },
            threshold: {
                title: 'Threshold', kind: 'Logic', tag: 'ROS', accent: '#f472b6', icon: 'toggle',
                params: 'true when in > 0.5', inputs: [{ id: 'in', type: 'f64' }], outputs: [{ id: 'out', type: 'bool' }],
                hint: 'Typed ports: a bool output can’t feed an f64 input.'
            },
            filter: {
                title: 'Low-pass Filter', kind: 'Processing', tag: 'ROS', accent: '#2dd4bf', icon: 'funnel',
                params: 'Exponential · α 0.12', inputs: [{ id: 'in', type: 'f64' }], outputs: [{ id: 'out', type: 'f64' }],
                hint: 'Smooths a noisy signal. Generated as a readable rclpy node.'
            },
            plot: {
                title: 'Live Plot', kind: 'Visualization', tag: 'APP', accent: '#fb923c', icon: 'chart',
                params: 'Time window 6 s', inputs: [{ id: 'in', type: 'f64' }], outputs: [], plot: true,
                hint: 'Live widgets subscribe to the running topics.'
            }
        };
        const ORDER = ['signal', 'slider', 'noise', 'threshold', 'filter', 'plot'];
        const START_EDGES = [
            ['signal.signal', 'noise.in'],
            ['slider.value', 'noise.std_dev'],
            ['noise.out', 'plot.in']
        ];
        const LAYOUTS = {
            wide: {
                w: 920, h: 400, nodeW: 190, plotW: 200,
                pos: { signal: [16, 22], slider: [16, 214], noise: [256, 104], threshold: [496, 14], filter: [496, 244], plot: [712, 96] }
            },
            narrow: {
                w: 370, h: 812, nodeW: 158, plotW: 342,
                pos: { signal: [14, 12], slider: [14, 196], noise: [198, 34], threshold: [198, 238], filter: [14, 396], plot: [14, 580] }
            }
        };
        const NAMES = { signal: 'signal_generator', slider: 'noise_slider', noise: 'add_noise', threshold: 'threshold', filter: 'low_pass_filter', plot: 'live_plot' };
        const PARAMS = {
            signal: [['frequency', '0.5'], ['amplitude', '1.0']],
            noise: [['std_dev', '0.3']],
            threshold: [['threshold', '0.5']],
            filter: [['alpha', '0.12']]
        };
        const QUESTS = [
            { id: 'filter', title: 'Wire in the Low-pass Filter', text: 'Route Add Noise → Low-pass Filter → Live Plot: drag from an output ● to an input ●.', tag: 'Blocks are ROS 2 nodes' },
            { id: 'tune', title: 'Tune it while it runs', text: 'Press Run, then drag the Noise slider.', tag: 'Tune while it runs' },
            { id: 'types', title: 'Try to break the types', text: 'Wire Threshold’s bool output into any f64 input.', tag: 'Type-checked graphs' },
            { id: 'code', title: 'Peek at the code', text: 'Open the Code tab: that is the launch file Wirepup writes.', tag: 'Real code out' }
        ];
        const NODE_ICONS = {
            wave: 'M2 12c2-6 4-6 5 0s3 6 5 0 3-6 5 0 3 6 5 0',
            sliders: 'M21 5h-7M10 5H3M21 12h-9M8 12H3M21 19h-5M12 19H3M14 3v4M8 10v4M16 17v4',
            bolt: 'M13 2 4 14h7l-1 8 9-12h-7l1-8Z',
            toggle: 'M8 7h8a5 5 0 0 1 0 10H8A5 5 0 0 1 8 7Zm8 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z',
            funnel: 'M3 5h18l-7 8v5l-4 2v-7L3 5Z',
            chart: 'M3 3v18h18M7 15l4-4 3 3 5-7'
        };

        const state = {
            layoutName: null,
            scale: 1,
            pos: {},
            edges: [],
            running: false,
            visible: false,
            runStartedAt: 0,
            simT: 0,
            values: {},
            filterY: null,
            plot: [],
            plotRange: { min: -1.5, max: 1.5 },
            slider: 0.35,
            selectedEdge: null,
            armed: null,
            problems: [],
            quests: { filter: false, tune: false, types: false, code: false },
            tab: 'problems',
            z: 10
        };

        // ---------- DOM ---------------------------------------------------
        const questItems = QUESTS.map(quest => `
            <li class="pg-quest" data-quest="${quest.id}">
                <span class="pg-quest__check" aria-hidden="true"></span>
                <div>
                    <strong>${quest.title}</strong>
                    <small>${quest.text}</small>
                    <em>${quest.tag}</em>
                </div>
            </li>`).join('');

        host.innerHTML = `
            <div class="pg-bar">
                <div class="pg-bar__doc">
                    <img alt="" height="22" src="assets/opt/bros2/mark.svg" width="22"/>
                    <strong>Signal Lab</strong>
                    <span class="pg-chip">demo</span>
                </div>
                <div class="pg-bar__run">
                    <button class="pg-run" data-pg-run type="button">${icon('play')}<span>Run</span></button>
                    <span class="pg-status" data-pg-status><i aria-hidden="true"></i><span>Ready to run</span></span>
                </div>
                <div class="pg-bar__tools">
                    <button class="pg-tool" data-pg-autowire type="button">Wire it for me</button>
                    <button class="pg-tool" data-pg-reset type="button">Reset</button>
                </div>
            </div>
            <div class="pg-viewport" data-pg-viewport>
                <div class="pg-stage" data-pg-stage role="group" aria-label="Playground canvas with blocks and wires. Drag blocks by their header; drag or press an output port, then an input port, to connect.">
                    <svg class="pg-wires" data-pg-wires aria-hidden="true"></svg>
                </div>
            </div>
            <aside class="pg-side" aria-label="Things to try">
                <p class="pg-side__title">Try this</p>
                <ol class="pg-quests">${questItems}</ol>
                <div class="pg-done" data-pg-done hidden>
                    <strong>That’s Wirepup in a nutshell.</strong>
                    <p>The real app turns graphs like this into a colcon-built ROS 2 package and runs it on your laptop or your robot.</p>
                    <button class="pg-done__cta" data-pg-waitlist type="button">Request early access →</button>
                </div>
            </aside>
            <div class="pg-dock">
                <div class="pg-tabs" role="tablist" aria-label="Playground panels">
                    <button class="pg-tab is-active" data-pg-tab="problems" role="tab" aria-selected="true" type="button">Problems <span class="pg-count" data-pg-count>0</span></button>
                    <button class="pg-tab" data-pg-tab="topics" role="tab" aria-selected="false" type="button">Topics</button>
                    <button class="pg-tab" data-pg-tab="code" role="tab" aria-selected="false" type="button">Code</button>
                </div>
                <div class="pg-pane" data-pg-pane="problems" role="tabpanel"></div>
                <div class="pg-pane" data-pg-pane="topics" role="tabpanel" hidden></div>
                <div class="pg-pane pg-pane--code" data-pg-pane="code" role="tabpanel" hidden>
                    <div class="pg-code__bar"><span>launch/signal_lab.launch.py</span><button class="pg-code__copy" data-pg-copy type="button">Copy</button></div>
                    <pre class="pg-code"><code data-pg-code></code></pre>
                </div>
            </div>
            <p class="pg-sr" aria-live="polite" data-pg-live></p>`;

        const viewport = host.querySelector('[data-pg-viewport]');
        const stage = host.querySelector('[data-pg-stage]');
        const wiresSvg = host.querySelector('[data-pg-wires]');
        const runBtn = host.querySelector('[data-pg-run]');
        const statusEl = host.querySelector('[data-pg-status]');
        const liveEl = host.querySelector('[data-pg-live]');
        const countEl = host.querySelector('[data-pg-count]');
        const panes = {
            problems: host.querySelector('[data-pg-pane="problems"]'),
            topics: host.querySelector('[data-pg-pane="topics"]'),
            code: host.querySelector('[data-pg-pane="code"]')
        };
        const codeEl = host.querySelector('[data-pg-code]');
        const doneEl = host.querySelector('[data-pg-done]');

        const nodeEls = {};
        const portEls = {};
        const valueEls = {};
        let plotCanvas = null;
        let sliderInput = null;
        let sliderOutput = null;

        const svgNodeIcon = name => `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${NODE_ICONS[name]}"/></svg>`;

        ORDER.forEach(id => {
            const b = BLOCKS[id];
            const el = document.createElement('div');
            el.className = 'pg-node';
            el.dataset.node = id;
            el.tabIndex = 0;
            el.setAttribute('role', 'group');
            el.setAttribute('aria-label', `${b.title} block, ${b.tag}. Arrow keys move it.`);
            el.title = b.hint;
            el.style.setProperty('--accent', b.accent);
            if (b.plot) el.classList.add('pg-node--plot');

            const rows = [];
            b.inputs.forEach(port => {
                rows.push(`<div class="pg-row pg-row--in">
                    <button class="pg-port pg-port--in" data-port="${id}.${port.id}" data-type="${port.type}" type="button" aria-label="${b.title} input ${port.id}, ${port.type}"></button>
                    <code class="pg-type" data-type="${port.type}">${port.type}</code><span class="pg-row__name">${port.id}</span>
                </div>`);
            });
            b.outputs.forEach(port => {
                rows.push(`<div class="pg-row pg-row--out">
                    <code class="pg-type" data-type="${port.type}">${port.type}</code><span class="pg-row__name">${port.id}</span>
                    <span class="pg-val" data-val="${id}.${port.id}">—</span>
                    <button class="pg-port pg-port--out" data-port="${id}.${port.id}" data-type="${port.type}" type="button" aria-label="${b.title} output ${port.id}, ${port.type}"></button>
                </div>`);
            });

            el.innerHTML = `
                <div class="pg-node__head">
                    <span class="pg-node__icon">${svgNodeIcon(b.icon)}</span>
                    <span class="pg-node__names"><strong>${b.title}</strong><small>${b.kind}</small></span>
                    <span class="pg-node__tag">${b.tag}</span>
                </div>
                <p class="pg-node__params">${b.params}</p>
                ${b.control ? `<label class="pg-slider"><span class="pg-sr">Noise amount</span><input type="range" min="0" max="1" step="0.01" value="${state.slider}"/><output>${state.slider.toFixed(2)}</output></label>` : ''}
                <div class="pg-node__ports">${rows.join('')}</div>
                ${b.plot ? '<div class="pg-plot"><canvas aria-label="Live plot of the incoming signal" role="img"></canvas><span class="pg-plot__empty">Press Run ▶</span></div>' : ''}`;

            stage.appendChild(el);
            nodeEls[id] = el;
            el.querySelectorAll('.pg-port').forEach(port => { portEls[port.dataset.port] = port; });
            el.querySelectorAll('.pg-val').forEach(val => { valueEls[val.dataset.val] = val; });
            if (b.plot) plotCanvas = el.querySelector('canvas');
            if (b.control) {
                sliderInput = el.querySelector('input[type="range"]');
                sliderOutput = el.querySelector('output');
            }
        });

        // ---------- graph helpers ------------------------------------------
        const nodeOf = ref => ref.split('.')[0];
        const portName = ref => ref.split('.')[1];
        const portInfo = ref => {
            const b = BLOCKS[nodeOf(ref)];
            return [...b.inputs, ...b.outputs].find(port => port.id === portName(ref));
        };
        const isOutput = ref => BLOCKS[nodeOf(ref)].outputs.some(port => port.id === portName(ref));
        const portType = ref => portInfo(ref)?.type;
        const edgeInto = ref => state.edges.find(edge => edge.to === ref) || null;
        const edgesFrom = ref => state.edges.filter(edge => edge.from === ref);
        const isValid = edge => portType(edge.from) === portType(edge.to);
        const isWired = id => state.edges.some(edge => nodeOf(edge.from) === id || nodeOf(edge.to) === id);
        const label = ref => `${BLOCKS[nodeOf(ref)].title} · ${portName(ref)}`;
        const topicOf = ref => `/${NAMES[nodeOf(ref)]}/${portName(ref)}`;

        const announce = text => {
            liveEl.textContent = '';
            window.setTimeout(() => { liveEl.textContent = text; }, 30);
        };

        const createsCycle = (from, to) => {
            const target = nodeOf(from);
            const seen = new Set();
            const stack = [nodeOf(to)];
            while (stack.length) {
                const current = stack.pop();
                if (current === target) return true;
                if (seen.has(current)) continue;
                seen.add(current);
                state.edges.forEach(edge => {
                    if (nodeOf(edge.from) === current) stack.push(nodeOf(edge.to));
                });
            }
            return false;
        };

        const topoOrder = () => {
            const indeg = {};
            ORDER.forEach(id => { indeg[id] = 0; });
            const valid = state.edges.filter(isValid);
            valid.forEach(edge => { indeg[nodeOf(edge.to)] += 1; });
            const queue = ORDER.filter(id => indeg[id] === 0);
            const out = [];
            while (queue.length) {
                const id = queue.shift();
                out.push(id);
                valid.filter(edge => nodeOf(edge.from) === id).forEach(edge => {
                    const next = nodeOf(edge.to);
                    indeg[next] -= 1;
                    if (indeg[next] === 0) queue.push(next);
                });
            }
            return out;
        };

        // ---------- layout + scale ------------------------------------------
        const layout = () => LAYOUTS[state.layoutName];

        const applyPositions = () => {
            const L = layout();
            ORDER.forEach(id => {
                const el = nodeEls[id];
                const p = state.pos[id];
                el.style.width = `${id === 'plot' ? L.plotW : L.nodeW}px`;
                el.style.left = `${p.x}px`;
                el.style.top = `${p.y}px`;
            });
        };

        const resetPositions = () => {
            const L = layout();
            ORDER.forEach(id => {
                const [x, y] = L.pos[id];
                state.pos[id] = { x, y };
            });
            applyPositions();
        };

        const sizePlotCanvas = () => {
            if (!plotCanvas) return;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const cssW = plotCanvas.clientWidth || 180;
            const cssH = plotCanvas.clientHeight || 64;
            plotCanvas.width = Math.round(cssW * dpr * state.scale);
            plotCanvas.height = Math.round(cssH * dpr * state.scale);
            drawPlot();
        };

        const fit = () => {
            const width = viewport.clientWidth;
            if (!width) return;
            const nextLayout = width < 620 ? 'narrow' : 'wide';
            if (nextLayout !== state.layoutName) {
                state.layoutName = nextLayout;
                host.dataset.layout = nextLayout;
                resetPositions();
            }
            const L = layout();
            state.scale = Math.min(width / L.w, nextLayout === 'wide' ? 1.12 : 1.2);
            stage.style.width = `${L.w}px`;
            stage.style.height = `${L.h}px`;
            stage.style.transform = `scale(${state.scale})`;
            viewport.style.height = `${Math.round(L.h * state.scale)}px`;
            wiresSvg.setAttribute('viewBox', `0 0 ${L.w} ${L.h}`);
            wiresSvg.setAttribute('width', L.w);
            wiresSvg.setAttribute('height', L.h);
            sizePlotCanvas();
            renderWires();
        };

        const toStage = event => {
            const rect = stage.getBoundingClientRect();
            return { x: (event.clientX - rect.left) / state.scale, y: (event.clientY - rect.top) / state.scale };
        };

        const portCenter = ref => {
            const btn = portEls[ref];
            const node = nodeEls[nodeOf(ref)];
            let x = btn.offsetWidth / 2;
            let y = btn.offsetHeight / 2;
            let el = btn;
            while (el && el !== node) {
                x += el.offsetLeft;
                y += el.offsetTop;
                el = el.offsetParent;
            }
            const p = state.pos[nodeOf(ref)];
            return { x: p.x + node.clientLeft + x, y: p.y + node.clientTop + y };
        };

        // ---------- wires -----------------------------------------------------
        // Forward wires (output left of input) get the usual horizontal S.
        // Backward wires get a tight S that stays inside the canvas instead of
        // looping out past its edges.
        const bezier = (a, b) => {
            let c1;
            let c2;
            if (b.x >= a.x - 8) {
                const dx = Math.max(40, (b.x - a.x) * 0.5);
                c1 = { x: a.x + dx, y: a.y };
                c2 = { x: b.x - dx, y: b.y };
            } else {
                const k = 30;
                const dy = b.y - a.y;
                c1 = { x: a.x + k, y: a.y + dy * 0.3 };
                c2 = { x: b.x - k, y: b.y - dy * 0.3 };
            }
            const f = n => n.toFixed(1);
            return {
                d: `M${f(a.x)} ${f(a.y)} C${f(c1.x)} ${f(c1.y)}, ${f(c2.x)} ${f(c2.y)}, ${f(b.x)} ${f(b.y)}`,
                mid: {
                    x: 0.125 * a.x + 0.375 * c1.x + 0.375 * c2.x + 0.125 * b.x,
                    y: 0.125 * a.y + 0.375 * c1.y + 0.375 * c2.y + 0.125 * b.y
                }
            };
        };

        let tempWire = null;

        function renderWires() {
            const parts = state.edges.map(edge => {
                const { d, mid } = bezier(portCenter(edge.from), portCenter(edge.to));
                const valid = isValid(edge);
                const classes = ['pg-wire'];
                if (!valid) classes.push('is-bad');
                if (state.running && valid) classes.push('is-live');
                if (state.selectedEdge === edge.id) classes.push('is-selected');
                if (edge.fresh) classes.push('is-fresh');
                const tint = valid ? (portType(edge.from) === 'bool' ? 'bool' : 'f64') : 'bad';
                let extra = '';
                if (!valid) {
                    extra += `<g class="pg-wire__warn" transform="translate(${mid.x.toFixed(1)} ${mid.y.toFixed(1)})"><circle r="9"></circle><text y="4" text-anchor="middle">!</text></g>`;
                }
                if (state.selectedEdge === edge.id) {
                    extra += `<g class="pg-wire__del" data-edge-delete="${edge.id}" transform="translate(${mid.x.toFixed(1)} ${(mid.y - (valid ? 0 : 22)).toFixed(1)})"><title>Delete wire</title><circle r="10"></circle><path d="M-3.6 -3.6 L3.6 3.6 M3.6 -3.6 L-3.6 3.6"></path></g>`;
                }
                return `<g class="${classes.join(' ')}" data-edge="${edge.id}" data-tint="${tint}">
                    <path class="pg-wire__hit" d="${d}"></path>
                    <path class="pg-wire__glow" d="${d}"></path>
                    <path class="pg-wire__line" d="${d}"></path>
                    ${extra}
                </g>`;
            });
            if (tempWire) {
                parts.push(`<path class="pg-wire__temp${tempWire.bad ? ' is-bad' : ''}" d="${bezier(tempWire.a, tempWire.b).d}"></path>`);
            }
            wiresSvg.innerHTML = parts.join('');
        }

        const syncPorts = () => {
            Object.entries(portEls).forEach(([ref, btn]) => {
                const connected = isOutput(ref) ? edgesFrom(ref).length > 0 : Boolean(edgeInto(ref));
                btn.classList.toggle('is-connected', connected);
                btn.classList.toggle('is-armed', state.armed === ref);
            });
            const hint = !state.quests.filter;
            portEls['noise.out'].classList.toggle('is-hint', hint && !edgesFrom('noise.out').some(edge => edge.to === 'filter.in'));
            portEls['filter.in'].classList.toggle('is-hint', hint && !edgeInto('filter.in'));
            portEls['filter.out'].classList.toggle('is-hint', hint && Boolean(edgeInto('filter.in')) && !edgesFrom('filter.out').length);
            stage.classList.toggle('is-arming', Boolean(state.armed));
        };

        // ---------- problems / topics / code --------------------------------
        const computeProblems = () => {
            const list = [];
            state.edges.forEach(edge => {
                if (!isValid(edge)) {
                    list.push({
                        level: 'error',
                        edge: edge.id,
                        text: `${BLOCKS[nodeOf(edge.from)].title} → ${BLOCKS[nodeOf(edge.to)].title}: ‘${portName(edge.from)}’ publishes ${portType(edge.from)}, but ‘${portName(edge.to)}’ expects ${portType(edge.to)}.`
                    });
                }
            });
            ORDER.forEach(id => {
                if (!isWired(id)) return;
                BLOCKS[id].inputs.forEach(port => {
                    if (!port.optional && !edgeInto(`${id}.${port.id}`)) {
                        list.push({ level: 'warn', text: `${BLOCKS[id].title}: input ‘${port.id}’ isn’t connected, so it won’t publish anything.` });
                    }
                });
            });
            state.problems = list;
            ORDER.forEach(id => {
                const bad = list.some(problem => problem.edge && (nodeOf(problem.edge.split('>')[0]) === id || nodeOf(problem.edge.split('>')[1]) === id));
                nodeEls[id].classList.toggle('has-error', bad);
            });
        };

        const errors = () => state.problems.filter(problem => problem.level === 'error');

        const renderProblems = () => {
            const errs = errors().length;
            const warns = state.problems.length - errs;
            countEl.textContent = String(state.problems.length);
            countEl.dataset.level = errs ? 'error' : (warns ? 'warn' : 'ok');
            const pane = panes.problems;
            pane.innerHTML = '';
            if (!state.problems.length) {
                pane.innerHTML = state.running
                    ? '<p class="pg-empty"><span class="pg-ok" aria-hidden="true">✓</span> No problems. The graph type-checks and is running.</p>'
                    : '<p class="pg-empty"><span class="pg-ok" aria-hidden="true">✓</span> No problems. The graph type-checks. Press <strong>Run</strong>.</p>';
                return;
            }
            const list = document.createElement('ul');
            list.className = 'pg-problems';
            state.problems.forEach(problem => {
                const item = document.createElement('li');
                item.className = `pg-problem pg-problem--${problem.level}`;
                const badge = document.createElement('span');
                badge.className = 'pg-problem__badge';
                badge.textContent = problem.level === 'error' ? 'error' : 'warning';
                const text = document.createElement('span');
                text.textContent = problem.text;
                item.append(badge, text);
                if (problem.edge) {
                    const fix = document.createElement('button');
                    fix.type = 'button';
                    fix.className = 'pg-problem__fix';
                    fix.textContent = 'Remove wire';
                    fix.addEventListener('click', () => removeEdge(problem.edge));
                    item.appendChild(fix);
                }
                list.appendChild(item);
            });
            pane.appendChild(list);
        };

        const renderTopics = () => {
            const sources = [...new Set(state.edges.filter(isValid).map(edge => edge.from))];
            const pane = panes.topics;
            if (!sources.length) {
                pane.innerHTML = '<p class="pg-empty">No topics yet. Wire an output into an input.</p>';
                return;
            }
            const rows = sources.map(ref => {
                const subs = edgesFrom(ref).filter(isValid).length;
                const value = state.values[ref];
                return `<tr>
                    <td><code>${topicOf(ref)}</code></td>
                    <td><code class="pg-type" data-type="${portType(ref)}">${portType(ref)}</code></td>
                    <td>${subs} sub${subs === 1 ? '' : 's'}</td>
                    <td>${state.running ? '30 Hz' : 'idle'}</td>
                    <td class="pg-topic__val">${formatValue(value)}</td>
                </tr>`;
            }).join('');
            pane.innerHTML = `<table class="pg-topics"><thead><tr><th>Topic</th><th>Type</th><th>Subscribers</th><th>Rate</th><th>Last</th></tr></thead><tbody>${rows}</tbody></table>`;
        };

        const generateCode = () => {
            const ros = topoOrder().filter(id => BLOCKS[id].tag === 'ROS' && isWired(id));
            const apps = ORDER.filter(id => BLOCKS[id].tag === 'APP' && isWired(id));
            const lines = [];
            const errs = errors().length;
            if (errs) lines.push(`# Build blocked: fix ${errs} type error${errs === 1 ? '' : 's'} in Problems first.`);
            lines.push(
                '# Launch file generated by Wirepup for the "Signal Lab" workspace.',
                '# Run with: ros2 launch bros2_signal_lab signal_lab.launch.py',
                'from launch import LaunchDescription',
                'from launch_ros.actions import Node',
                '',
                '',
                'def generate_launch_description():',
                '    return LaunchDescription(['
            );
            if (!ros.length) lines.push('        # Wire some ROS blocks together to generate nodes.');
            ros.forEach(id => {
                const b = BLOCKS[id];
                const remaps = [];
                b.inputs.forEach(port => {
                    const edge = edgeInto(`${id}.${port.id}`);
                    if (edge && isValid(edge)) remaps.push(`('${port.id}', '${topicOf(edge.from)}')`);
                });
                b.outputs.forEach(port => {
                    if (edgesFrom(`${id}.${port.id}`).length) remaps.push(`('${port.id}', '${topicOf(`${id}.${port.id}`)}')`);
                });
                const params = (PARAMS[id] || []).filter(([key]) => !(id === 'noise' && key === 'std_dev' && edgeInto('noise.std_dev')));
                lines.push(
                    '        Node(',
                    "            package='bros2_signal_lab',",
                    `            executable='${NAMES[id]}',`,
                    `            name='${NAMES[id]}',`
                );
                if (params.length) lines.push(`            parameters=[{${params.map(([key, value]) => `'${key}': ${value}`).join(', ')}}],`);
                if (remaps.length) {
                    lines.push('            remappings=[');
                    remaps.forEach(remap => lines.push(`                ${remap},`));
                    lines.push('            ],');
                }
                lines.push('        ),');
            });
            lines.push('    ])');
            if (apps.length) {
                lines.push('', `# In-app blocks (${apps.map(id => BLOCKS[id].title).join(', ')}) talk to these`, '# nodes over rosbridge, so they are not launched here.');
            }
            return lines.join('\n');
        };

        const escapeHtml = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const highlight = code => escapeHtml(code).replace(
            /(#.*$)|('(?:[^'\\\n]|\\.)*')|\b(from|import|def|return)\b|\b(\d+(?:\.\d+)?)\b/gm,
            (match, comment, string, keyword, number) => {
                if (comment) return `<span class="c">${comment}</span>`;
                if (string) return `<span class="s">${string}</span>`;
                if (keyword) return `<span class="k">${keyword}</span>`;
                return `<span class="n">${number}</span>`;
            }
        );

        let lastCode = '';
        const renderCode = () => {
            lastCode = generateCode();
            codeEl.innerHTML = highlight(lastCode);
        };

        // ---------- status + quests ---------------------------------------------
        const formatValue = value => {
            if (typeof value === 'boolean') return value ? 'true' : 'false';
            if (typeof value === 'number' && Number.isFinite(value)) return value.toFixed(3);
            return '—';
        };

        const runningNodeCount = () => ORDER.filter(id => BLOCKS[id].tag === 'ROS' && state.edges.some(edge => isValid(edge) && (nodeOf(edge.from) === id || nodeOf(edge.to) === id))).length;

        let lastStatus = '';
        const updateStatus = () => {
            let tone = 'idle';
            let text = 'Ready to run';
            const errs = errors().length;
            const warns = state.problems.length - errs;
            if (state.running) {
                const secs = Math.floor((performance.now() - state.runStartedAt) / 1000);
                const n = runningNodeCount();
                tone = 'live';
                text = `Running ${n} node${n === 1 ? '' : 's'} · ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
            } else if (errs) {
                tone = 'error';
                text = `Build blocked · ${errs} problem${errs === 1 ? '' : 's'}`;
            } else if (warns) {
                tone = 'warn';
                text = `Ready · ${warns} warning${warns === 1 ? '' : 's'}`;
            }
            const key = `${tone}|${text}`;
            if (key === lastStatus) return;
            lastStatus = key;
            statusEl.dataset.tone = tone;
            statusEl.querySelector('span').textContent = text;
            if (runBtn.classList.contains('is-running') !== state.running || !runBtn.dataset.ready) {
                runBtn.dataset.ready = '1';
                runBtn.classList.toggle('is-running', state.running);
                runBtn.innerHTML = state.running ? `${icon('stop')}<span>Stop</span>` : `${icon('play')}<span>Run</span>`;
                runBtn.setAttribute('aria-label', state.running ? 'Stop the graph' : 'Run the graph');
            }
        };

        const completeQuest = id => {
            if (state.quests[id]) return;
            state.quests[id] = true;
            const item = host.querySelector(`[data-quest="${id}"]`);
            item?.classList.add('is-done');
            const quest = QUESTS.find(entry => entry.id === id);
            announce(`Nice: ${quest.title}.`);
            if (Object.values(state.quests).every(Boolean)) {
                doneEl.hidden = false;
                requestAnimationFrame(() => doneEl.classList.add('is-visible'));
            }
            syncPorts();
        };

        const checkGraphQuests = () => {
            const toFilter = edgeInto('filter.in');
            const fromFilter = edgeInto('plot.in');
            if (toFilter && toFilter.from === 'noise.out' && fromFilter && fromFilter.from === 'filter.out') completeQuest('filter');
            if (state.edges.some(edge => !isValid(edge) && portType(edge.from) === 'bool')) completeQuest('types');
        };

        function afterGraphChange() {
            computeProblems();
            renderWires();
            syncPorts();
            renderProblems();
            renderTopics();
            renderCode();
            checkGraphQuests();
            if (state.running && errors().length) {
                stopRun();
                setTab('problems');
                announce('Build blocked: the graph has a type error. Stopped.');
            }
            ORDER.forEach(id => nodeEls[id].classList.toggle('is-live', state.running && isWired(id)));
            updateStatus();
        }

        // ---------- editing ----------------------------------------------------
        const connect = (from, to) => {
            if (!isOutput(from) || isOutput(to)) return false;
            if (nodeOf(from) === nodeOf(to)) {
                announce('A block can’t feed itself.');
                return false;
            }
            const existing = edgeInto(to);
            if (existing && existing.from === from) return true;
            const withoutOld = state.edges.filter(edge => edge.to !== to);
            const saved = state.edges;
            state.edges = withoutOld;
            if (createsCycle(from, to)) {
                state.edges = saved;
                announce('That would make a loop. This demo keeps graphs acyclic.');
                flashStage('is-rejected');
                return false;
            }
            const edge = { id: `${from}>${to}`, from, to, fresh: true };
            state.edges.push(edge);
            window.setTimeout(() => {
                edge.fresh = false;
                renderWires();
            }, 700);
            state.selectedEdge = null;
            afterGraphChange();
            announce(isValid(edge)
                ? `Connected ${label(from)} to ${label(to)}.`
                : `Type mismatch: ${portType(from)} can’t feed ${portType(to)}. See Problems.`);
            if (!isValid(edge)) setTab('problems');
            return true;
        };

        function removeEdge(id) {
            const before = state.edges.length;
            state.edges = state.edges.filter(edge => edge.id !== id);
            if (state.edges.length === before) return;
            if (state.selectedEdge === id) state.selectedEdge = null;
            afterGraphChange();
            announce('Wire removed.');
        }

        const selectEdge = id => {
            state.selectedEdge = id;
            renderWires();
            if (id) announce('Wire selected. Press Delete, or the × on the wire, to remove it.');
        };

        const arm = ref => {
            state.armed = ref;
            syncPorts();
            markCandidates(ref);
            announce(`Picked ${label(ref)}. Now choose an input port.`);
        };

        const cancelArm = () => {
            if (!state.armed) return;
            state.armed = null;
            syncPorts();
            markCandidates(null);
        };

        function markCandidates(fromRef) {
            Object.entries(portEls).forEach(([ref, btn]) => {
                const input = !isOutput(ref);
                const candidate = Boolean(fromRef) && input && nodeOf(ref) !== nodeOf(fromRef);
                btn.classList.toggle('is-candidate', candidate && portType(ref) === portType(fromRef));
                btn.classList.toggle('is-mismatch', candidate && portType(ref) !== portType(fromRef));
            });
        }

        function flashStage(className) {
            stage.classList.remove(className);
            void stage.offsetWidth;
            stage.classList.add(className);
            window.setTimeout(() => stage.classList.remove(className), 500);
        }

        const activatePort = ref => {
            if (isOutput(ref)) {
                if (state.armed === ref) cancelArm();
                else arm(ref);
                return;
            }
            if (state.armed) {
                const from = state.armed;
                cancelArm();
                connect(from, ref);
                return;
            }
            const existing = edgeInto(ref);
            if (existing) selectEdge(existing.id);
            else announce('Choose an output port first, then this input.');
        };

        // ---------- pointer interaction ------------------------------------------
        let suppressClick = false;
        let drag = null;

        const nearestInput = (point, fromRef) => {
            let best = null;
            let bestDist = 30;
            Object.keys(portEls).forEach(ref => {
                if (isOutput(ref) || nodeOf(ref) === nodeOf(fromRef)) return;
                const c = portCenter(ref);
                const dist = Math.hypot(c.x - point.x, c.y - point.y);
                if (dist < bestDist) {
                    best = ref;
                    bestDist = dist;
                }
            });
            return best;
        };

        stage.addEventListener('pointerdown', event => {
            if (event.pointerType === 'mouse' && event.button !== 0) return;
            const port = event.target.closest('.pg-port');
            if (port) {
                const ref = port.dataset.port;
                drag = { kind: 'wire', id: event.pointerId, start: toStage(event), ref, moved: false };
                port.setPointerCapture(event.pointerId);
                return;
            }
            const node = event.target.closest('.pg-node');
            if (!node) return;
            if (event.target.closest('input, label.pg-slider, button')) return;
            if (event.pointerType !== 'mouse' && !event.target.closest('.pg-node__head')) return;
            event.preventDefault();
            const id = node.dataset.node;
            drag = { kind: 'node', id: event.pointerId, node: id, start: toStage(event), origin: { ...state.pos[id] }, moved: false };
            node.setPointerCapture(event.pointerId);
            node.style.zIndex = String(++state.z);
        });

        stage.addEventListener('pointermove', event => {
            if (!drag || event.pointerId !== drag.id) return;
            const p = toStage(event);
            const dx = p.x - drag.start.x;
            const dy = p.y - drag.start.y;
            if (!drag.moved && Math.hypot(dx, dy) < 4) return;

            if (drag.kind === 'node') {
                drag.moved = true;
                const L = layout();
                const el = nodeEls[drag.node];
                el.classList.add('is-dragging');
                state.pos[drag.node] = {
                    x: Math.min(Math.max(drag.origin.x + dx, 0), L.w - el.offsetWidth),
                    y: Math.min(Math.max(drag.origin.y + dy, 0), L.h - el.offsetHeight)
                };
                el.style.left = `${state.pos[drag.node].x}px`;
                el.style.top = `${state.pos[drag.node].y}px`;
                renderWires();
                return;
            }

            // wire drag
            if (!drag.moved) {
                drag.moved = true;
                cancelArm();
                if (isOutput(drag.ref)) {
                    drag.from = drag.ref;
                } else {
                    const existing = edgeInto(drag.ref);
                    if (!existing) {
                        drag.cancelled = true;
                        return;
                    }
                    // pick the wire up by its input end
                    drag.from = existing.from;
                    state.edges = state.edges.filter(edge => edge.id !== existing.id);
                    afterGraphChange();
                }
                markCandidates(drag.from);
                stage.classList.add('is-wiring');
            }
            if (drag.cancelled) return;
            const target = nearestInput(p, drag.from);
            const b = target ? portCenter(target) : p;
            tempWire = { a: portCenter(drag.from), b, bad: Boolean(target) && portType(target) !== portType(drag.from) };
            Object.entries(portEls).forEach(([ref, btn]) => btn.classList.toggle('is-target', ref === target));
            renderWires();
        });

        const finishDrag = event => {
            if (!drag || event.pointerId !== drag.id) return;
            const current = drag;
            drag = null;
            if (current.kind === 'node') {
                nodeEls[current.node].classList.remove('is-dragging');
                if (current.moved) suppressClick = true;
                return;
            }
            if (!current.moved) return; // plain click: handled by the click listener
            suppressClick = true;
            stage.classList.remove('is-wiring');
            markCandidates(null);
            Object.values(portEls).forEach(btn => btn.classList.remove('is-target'));
            tempWire = null;
            if (current.cancelled) {
                renderWires();
                return;
            }
            const target = event.type === 'pointerup' ? nearestInput(toStage(event), current.from) : null;
            if (target) {
                connect(current.from, target);
            } else {
                renderWires();
                if (!isOutput(current.ref)) announce('Wire removed.');
            }
        };
        stage.addEventListener('pointerup', finishDrag);
        stage.addEventListener('pointercancel', finishDrag);

        stage.addEventListener('click', event => {
            if (suppressClick) {
                suppressClick = false;
                return;
            }
            const del = event.target.closest('[data-edge-delete]');
            if (del) {
                removeEdge(del.dataset.edgeDelete);
                return;
            }
            const port = event.target.closest('.pg-port');
            if (port) {
                activatePort(port.dataset.port);
                return;
            }
            const wire = event.target.closest('.pg-wire');
            if (wire) {
                selectEdge(state.selectedEdge === wire.dataset.edge ? null : wire.dataset.edge);
                return;
            }
            if (!event.target.closest('.pg-node')) {
                cancelArm();
                if (state.selectedEdge) selectEdge(null);
            }
        });

        stage.addEventListener('keydown', event => {
            if (event.target.matches('input')) return;
            if (event.key === 'Escape') {
                if (state.armed || state.selectedEdge) {
                    event.preventDefault();
                    cancelArm();
                    selectEdge(null);
                }
                return;
            }
            if ((event.key === 'Delete' || event.key === 'Backspace') && state.selectedEdge) {
                event.preventDefault();
                removeEdge(state.selectedEdge);
                return;
            }
            const node = event.target.closest('.pg-node');
            if (!node || event.target !== node) return;
            const step = event.shiftKey ? 40 : 10;
            const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[event.key];
            if (!delta) return;
            event.preventDefault();
            const id = node.dataset.node;
            const L = layout();
            state.pos[id] = {
                x: Math.min(Math.max(state.pos[id].x + delta[0], 0), L.w - node.offsetWidth),
                y: Math.min(Math.max(state.pos[id].y + delta[1], 0), L.h - node.offsetHeight)
            };
            node.style.left = `${state.pos[id].x}px`;
            node.style.top = `${state.pos[id].y}px`;
            renderWires();
        });

        // ---------- slider --------------------------------------------------------
        sliderInput?.addEventListener('input', () => {
            state.slider = Number(sliderInput.value);
            sliderOutput.textContent = state.slider.toFixed(2);
            if (!state.running) {
                valueEls['slider.value'].textContent = state.slider.toFixed(3);
            } else {
                completeQuest('tune');
            }
        });

        // ---------- simulation --------------------------------------------------------
        const randn = () => {
            let u = 0;
            let v = 0;
            while (u === 0) u = Math.random();
            while (v === 0) v = Math.random();
            return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
        };

        const PLOT_POINTS = 180;

        const step = dt => {
            state.simT += dt;
            const vals = {};
            const inputOf = (id, port) => {
                const edge = edgeInto(`${id}.${port}`);
                return edge && isValid(edge) ? vals[edge.from] : undefined;
            };
            topoOrder().forEach(id => {
                if (!isWired(id) && id !== 'slider') return;
                switch (id) {
                    case 'signal':
                        vals['signal.signal'] = Math.sin(2 * Math.PI * 0.5 * state.simT);
                        break;
                    case 'slider':
                        vals['slider.value'] = state.slider;
                        break;
                    case 'noise': {
                        const input = inputOf('noise', 'in');
                        const std = inputOf('noise', 'std_dev');
                        vals['noise.out'] = typeof input === 'number' ? input + randn() * (typeof std === 'number' ? std : 0.3) : undefined;
                        break;
                    }
                    case 'filter': {
                        const input = inputOf('filter', 'in');
                        if (typeof input === 'number') {
                            state.filterY = state.filterY === null ? input : state.filterY + 0.12 * (input - state.filterY);
                            vals['filter.out'] = state.filterY;
                        }
                        break;
                    }
                    case 'threshold': {
                        const input = inputOf('threshold', 'in');
                        vals['threshold.out'] = typeof input === 'number' ? input > 0.5 : undefined;
                        break;
                    }
                    case 'plot': {
                        const input = inputOf('plot', 'in');
                        state.plot.push(typeof input === 'number' ? input : null);
                        if (state.plot.length > PLOT_POINTS) state.plot.shift();
                        break;
                    }
                    default:
                        break;
                }
            });
            state.values = vals;
        };

        const renderValues = () => {
            Object.entries(valueEls).forEach(([ref, el]) => {
                const text = formatValue(state.values[ref]);
                if (el.textContent !== text) el.textContent = text;
                el.classList.toggle('is-true', state.values[ref] === true);
            });
        };

        function drawPlot() {
            if (!plotCanvas) return;
            const ctx = plotCanvas.getContext('2d');
            const w = plotCanvas.width;
            const h = plotCanvas.height;
            ctx.clearRect(0, 0, w, h);
            const unit = h / 64;
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
            ctx.lineWidth = Math.max(1, unit * 0.8);
            for (let i = 1; i < 4; i += 1) {
                const y = Math.round((h * i) / 4) + 0.5;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
                ctx.stroke();
            }
            const numbers = state.plot.filter(value => typeof value === 'number');
            plotCanvas.parentElement.classList.toggle('has-data', numbers.length > 1);
            if (numbers.length < 2) return;

            const lo = Math.min(...numbers);
            const hi = Math.max(...numbers);
            const pad = Math.max(0.2, (hi - lo) * 0.12);
            const targetMin = lo - pad;
            const targetMax = hi + pad;
            state.plotRange.min += (targetMin - state.plotRange.min) * 0.08;
            state.plotRange.max += (targetMax - state.plotRange.max) * 0.08;
            const { min, max } = state.plotRange;
            const toY = value => h - ((value - min) / (max - min || 1)) * h;
            const stepX = w / (PLOT_POINTS - 1);
            const offset = PLOT_POINTS - state.plot.length;

            const points = [];
            state.plot.forEach((value, index) => {
                if (typeof value === 'number') points.push([(index + offset) * stepX, toY(value)]);
            });
            if (points.length < 2) return;

            const gradient = ctx.createLinearGradient(0, 0, 0, h);
            gradient.addColorStop(0, 'rgba(34, 195, 182, 0.28)');
            gradient.addColorStop(1, 'rgba(34, 195, 182, 0)');
            ctx.beginPath();
            ctx.moveTo(points[0][0], h);
            points.forEach(([x, y]) => ctx.lineTo(x, y));
            ctx.lineTo(points[points.length - 1][0], h);
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();

            ctx.beginPath();
            points.forEach(([x, y], index) => (index ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
            ctx.strokeStyle = '#2dd4bf';
            ctx.lineWidth = Math.max(1.5, unit * 1.6);
            ctx.lineJoin = 'round';
            ctx.stroke();

            const [lx, ly] = points[points.length - 1];
            ctx.fillStyle = '#e6fffb';
            ctx.beginPath();
            ctx.arc(lx - unit * 2, ly, unit * 2.4, 0, Math.PI * 2);
            ctx.fill();
        }

        let rafId = 0;
        let lastTick = 0;
        let lastTopicsRender = 0;

        const loop = now => {
            rafId = requestAnimationFrame(loop);
            if (now - lastTick < 32) return;
            const dt = Math.min(0.1, (now - lastTick) / 1000);
            lastTick = now;
            step(dt);
            renderValues();
            drawPlot();
            updateStatus();
            if (state.tab === 'topics' && now - lastTopicsRender > 500) {
                lastTopicsRender = now;
                renderTopics();
            }
        };

        const syncLoop = () => {
            const shouldRun = state.running && state.visible && !document.hidden;
            if (shouldRun && !rafId) {
                lastTick = performance.now();
                rafId = requestAnimationFrame(loop);
            } else if (!shouldRun && rafId) {
                cancelAnimationFrame(rafId);
                rafId = 0;
            }
        };

        const startRun = () => {
            if (errors().length) {
                setTab('problems');
                runBtn.classList.remove('is-shaking');
                void runBtn.offsetWidth;
                runBtn.classList.add('is-shaking');
                announce(`Build blocked: fix ${errors().length} problem${errors().length === 1 ? '' : 's'} first.`);
                return;
            }
            if (!state.edges.length) {
                announce('Nothing to run yet. Wire some blocks together first.');
                flashStage('is-rejected');
                return;
            }
            state.running = true;
            state.runStartedAt = performance.now();
            state.simT = 0;
            state.filterY = null;
            state.plot = [];
            host.classList.add('is-running');
            afterGraphChange();
            renderProblems();
            syncLoop();
            announce(`Running ${runningNodeCount()} nodes.`);
        };

        function stopRun() {
            state.running = false;
            host.classList.remove('is-running');
            ORDER.forEach(id => nodeEls[id].classList.remove('is-live'));
            syncLoop();
            renderWires();
            renderTopics();
            renderProblems();
            updateStatus();
        }

        runBtn.addEventListener('click', () => {
            if (state.running) {
                stopRun();
                announce('Stopped.');
            } else {
                startRun();
            }
        });

        // ---------- dock tabs -----------------------------------------------------
        const tabButtons = Array.from(host.querySelectorAll('.pg-tab'));
        function setTab(name) {
            state.tab = name;
            tabButtons.forEach(button => {
                const active = button.dataset.pgTab === name;
                button.classList.toggle('is-active', active);
                button.setAttribute('aria-selected', String(active));
                button.tabIndex = active ? 0 : -1;
            });
            Object.entries(panes).forEach(([key, pane]) => { pane.hidden = key !== name; });
            if (name === 'topics') renderTopics();
            if (name === 'code') completeQuest('code');
        }
        tabButtons.forEach((button, index) => {
            button.tabIndex = button.classList.contains('is-active') ? 0 : -1;
            button.addEventListener('click', () => setTab(button.dataset.pgTab));
            button.addEventListener('keydown', event => {
                const move = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
                if (!move) return;
                event.preventDefault();
                const next = tabButtons[(index + move + tabButtons.length) % tabButtons.length];
                setTab(next.dataset.pgTab);
                next.focus();
            });
        });

        const copyBtn = host.querySelector('[data-pg-copy]');
        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(lastCode);
                copyBtn.textContent = 'Copied!';
            } catch (error) {
                copyBtn.textContent = 'Select + copy';
            }
            window.setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1600);
        });

        // ---------- toolbar -------------------------------------------------------
        host.querySelector('[data-pg-autowire]').addEventListener('click', () => {
            connect('noise.out', 'filter.in');
            connect('filter.out', 'plot.in');
            announce('Wired Add Noise → Low-pass Filter → Live Plot.');
            if (!state.running) window.setTimeout(startRun, reducedMotion ? 0 : 450);
        });

        const reset = ({ quiet = false } = {}) => {
            if (state.running) stopRun();
            state.edges = START_EDGES.map(([from, to]) => ({ id: `${from}>${to}`, from, to }));
            state.selectedEdge = null;
            state.armed = null;
            state.values = {};
            state.plot = [];
            state.filterY = null;
            state.slider = 0.35;
            if (sliderInput) {
                sliderInput.value = String(state.slider);
                sliderOutput.textContent = state.slider.toFixed(2);
            }
            if (state.layoutName) resetPositions();
            markCandidates(null);
            afterGraphChange();
            renderValues();
            valueEls['slider.value'].textContent = state.slider.toFixed(3);
            drawPlot();
            if (!quiet) announce('Playground reset.');
        };
        host.querySelector('[data-pg-reset]').addEventListener('click', () => reset());

        host.querySelector('[data-pg-waitlist]').addEventListener('click', () => {
            panel.dispatchEvent(new CustomEvent('bros2:waitlist-open'));
        });

        // ---------- lifecycle -----------------------------------------------------
        if ('ResizeObserver' in window) {
            new ResizeObserver(() => fit()).observe(viewport);
        } else {
            window.addEventListener('resize', fit);
        }
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(entries => {
                state.visible = entries[0].isIntersecting;
                syncLoop();
            }, { threshold: 0.05 }).observe(host);
        } else {
            state.visible = true;
        }
        document.addEventListener('visibilitychange', syncLoop);

        fit();
        reset({ quiet: true });
    }

    // =====================================================================
    //  3. Early-access waitlist
    // =====================================================================
    function initWaitlist() {
        const cta = panel.querySelector('[data-waitlist-open]');
        const form = panel.querySelector('[data-waitlist]');
        const proof = panel.querySelector('[data-waitlist-proof]');
        const success = panel.querySelector('[data-waitlist-success]');
        if (!cta || !form) return;

        const API = `${API_BASE}/api/bros2/interest`;
        const STORAGE_KEY = 'bros2-waitlist';
        const PROOF_MIN = 5;
        const emailInput = form.querySelector('input[type="email"]');
        const submitBtn = form.querySelector('[data-waitlist-submit]');
        const message = form.querySelector('[data-waitlist-msg]');
        const honeypot = form.querySelector('input[name="website"]');
        const ctaLabel = cta.textContent.trim();

        const readJoined = () => {
            try {
                return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
            } catch (error) {
                return null;
            }
        };
        const saveJoined = email => {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify({ email, at: new Date().toISOString() }));
            } catch (error) {}
        };

        const fetchJson = async (url, options = {}, timeout = 20000) => {
            const controller = new AbortController();
            const timer = window.setTimeout(() => controller.abort(), timeout);
            try {
                const response = await fetch(url, { ...options, signal: controller.signal });
                let data = null;
                try {
                    data = await response.json();
                } catch (error) {
                    data = null;
                }
                return { status: response.status, ok: response.ok, data };
            } finally {
                window.clearTimeout(timer);
            }
        };

        const showProof = count => {
            if (!proof || !Number.isFinite(count) || count < PROOF_MIN) return;
            proof.querySelector('strong').textContent = String(count);
            proof.hidden = false;
        };

        const mailtoHref = (email, role) => {
            const body = [
                'Hi Noah,',
                '',
                'I’d like early access to Wirepup.',
                '',
                email ? `Email: ${email}` : '',
                role ? `I’m a: ${role}` : ''
            ].filter((line, index, lines) => line || lines[index - 1]).join('\n');
            return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Wirepup early access')}&body=${encodeURIComponent(body)}`;
        };

        const setMessage = (text, tone = 'info', fallback = null) => {
            message.textContent = text;
            message.dataset.tone = tone;
            if (fallback) {
                const link = document.createElement('a');
                link.href = fallback;
                link.className = 'waitlist__fallback';
                link.textContent = 'Email me instead →';
                message.append(' ', link);
            }
        };

        const markJoinedCta = () => {
            cta.textContent = 'You’re on the list ✓';
            cta.classList.add('is-joined');
        };

        const showSuccess = ({ alreadyJoined = false, count = null } = {}) => {
            form.hidden = true;
            form.classList.remove('is-open');
            cta.setAttribute('aria-expanded', 'false');
            if (!success) return;
            success.querySelector('[data-waitlist-success-title]').textContent = alreadyJoined ? 'You’re already on the list.' : 'You’re on the list! 🎉';
            success.querySelector('[data-waitlist-success-text]').textContent = Number.isFinite(count) && count >= PROOF_MIN
                ? `You’re one of ${count} builders waiting. I’ll email you when early access opens.`
                : 'Thanks! I’ll email you when early access opens.';
            success.hidden = false;
            success.focus({ preventScroll: true });
            markJoinedCta();
            if (Number.isFinite(count)) showProof(count);
        };

        const openForm = ({ scroll = false } = {}) => {
            const joined = readJoined();
            if (joined) {
                showSuccess({ alreadyJoined: true });
            } else {
                form.hidden = false;
                cta.setAttribute('aria-expanded', 'true');
                requestAnimationFrame(() => form.classList.add('is-open'));
            }
            if (scroll) {
                const top = cta.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.35;
                window.scrollTo({ top, behavior: reducedMotion ? 'auto' : 'smooth' });
            }
            if (!joined) window.setTimeout(() => emailInput.focus({ preventScroll: true }), scroll ? 450 : 0);
        };

        const closeForm = () => {
            form.classList.remove('is-open');
            form.hidden = true;
            cta.setAttribute('aria-expanded', 'false');
        };

        cta.addEventListener('click', event => {
            event.preventDefault();
            if (!form.hidden) {
                closeForm();
                return;
            }
            openForm();
        });
        panel.addEventListener('bros2:waitlist-open', () => openForm({ scroll: true }));

        if (readJoined()) markJoinedCta();

        // Fetch the tally once the panel is on screen. It doubles as a wake-up
        // call for the free-tier server before anyone hits "Join".
        if ('IntersectionObserver' in window) {
            const watcher = new IntersectionObserver(entries => {
                if (!entries[0].isIntersecting) return;
                watcher.disconnect();
                fetchJson(API, {}, 45000)
                    .then(result => {
                        if (result.ok && result.data) showProof(Number(result.data.count));
                    })
                    .catch(() => {});
            }, { threshold: 0.1 });
            watcher.observe(panel);
        }

        let submitting = false;
        form.addEventListener('submit', async event => {
            event.preventDefault();
            if (submitting) return;
            const email = emailInput.value.trim();
            const role = form.querySelector('input[name="role"]:checked')?.value || '';
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
                setMessage('That email doesn’t look right. Mind checking it?', 'error');
                emailInput.setAttribute('aria-invalid', 'true');
                emailInput.focus();
                return;
            }
            emailInput.removeAttribute('aria-invalid');

            submitting = true;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Joining…';
            setMessage('');
            const slowTimer = window.setTimeout(() => {
                setMessage('Waking up the server. The free tier naps, so this can take a few seconds…', 'info');
            }, 3500);

            try {
                const result = await fetchJson(API, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, role, website: honeypot?.value || '' })
                }, 40000);
                window.clearTimeout(slowTimer);
                if (result.ok && result.data?.ok) {
                    saveJoined(email);
                    setMessage('');
                    showSuccess({ alreadyJoined: Boolean(result.data.alreadyJoined), count: Number(result.data.count) });
                } else if (result.status === 400) {
                    setMessage(result.data?.error || 'That email doesn’t look right.', 'error');
                } else if (result.status === 429) {
                    setMessage('Too many tries from this network. Give it a few minutes, or', 'error', mailtoHref(email, role));
                } else {
                    setMessage('The waitlist server isn’t answering right now.', 'error', mailtoHref(email, role));
                }
            } catch (error) {
                window.clearTimeout(slowTimer);
                setMessage('Couldn’t reach the waitlist server.', 'error', mailtoHref(email, role));
            } finally {
                submitting = false;
                submitBtn.disabled = false;
                submitBtn.textContent = 'Join';
            }
        });

        cta.dataset.label = ctaLabel;
    }

    initFeatureMedia();
    initPlayground();
    initWaitlist();
})();
