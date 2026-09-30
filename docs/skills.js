// Skills: the 3D logo cubes, dressed in the site's pixel style. Hovering, focusing,
// or tapping a cube fills an item box underneath with what the tool is and where
// it was actually used (projects, the featured product, or timeline roles).
// Nothing here rates proficiency; the "used in" links are the evidence.
(() => {
    const kit = window.PixelKit;
    const reducedMotion = kit?.reducedMotion ?? window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    // ---------------------------------------------------------------------
    //  Data
    // ---------------------------------------------------------------------
    const CATEGORIES = [
        { id: 'software', label: 'Programming & AI' },
        { id: 'hardware', label: 'Embedded & Robotics' },
        { id: 'platforms', label: 'Platforms & OS' }
    ];

    // Roles point at cards in the Education + Experience timeline.
    const ROLES = {
        urAi: { title: 'AI Engineer Intern', org: 'Universal Robots', label: 'UR · AI Engineer Intern' },
        urRd: { title: 'Research & Development Intern', org: 'Universal Robots', label: 'UR · R&D Intern ’24' },
        urAp: { title: 'Apprentice', org: 'Universal Robots', label: 'UR · Apprentice' },
        umg: { title: 'Lead Software Engineer', org: 'UMG Technologies, Inc.', label: 'UMG · Lead Software Engineer' }
    };

    // uses: 'p:<projectId>' project dialog · 'f' featured product · 'r:<role>' timeline card · 'a:<id>' page anchor
    const SKILLS = [
        { id: 'python', name: 'Python', category: 'software', type: 'Language', href: 'https://www.python.org/', img: 'assets/opt/python_logo.webp',
            blurb: 'The multitool: scripting, ML, and robot glue code.',
            uses: ['p:sunny', 'p:trashformerpro', 'p:pixelpose', 'p:supertuxsmart', 'p:detectron2-attention', 'p:chatsheets', 'p:smart-home-api', 'p:pyp2pchat', 'f', 'r:urRd'] },
        { id: 'c', name: 'C', category: 'software', type: 'Language', href: 'https://en.cppreference.com/w/c', img: 'assets/opt/c_logo.webp',
            blurb: 'Close to the metal: firmware, drivers, and embedded loops.', aliases: ['firmware', 'kernel'],
            uses: ['p:tiltgolf', 'p:pira'] },
        { id: 'cpp', name: 'C++', category: 'software', type: 'Language', href: 'https://isocpp.org/', img: 'assets/opt/cplus_logo.webp',
            blurb: 'Performance-critical code, from algorithms to robotics stacks.', aliases: ['cpp', 'qt'],
            uses: ['p:huffman', 'p:tiltgolf', 'r:urRd'] },
        { id: 'csharp', name: 'C#', category: 'software', type: 'Language', href: 'https://dotnet.microsoft.com/en-us/languages/csharp', img: 'assets/opt/csharp_logo.webp',
            blurb: 'The .NET language behind a lot of desktop and industrial software.', aliases: ['csharp', 'dotnet', '.net'],
            uses: ['r:umg'] },
        { id: 'tensorflow', name: 'TensorFlow', category: 'software', type: 'Framework', href: 'https://www.tensorflow.org/', img: 'assets/opt/tensorflow.webp',
            blurb: 'Google’s machine-learning framework.', aliases: ['ml', 'machine learning'], uses: [] },
        { id: 'pytorch', name: 'PyTorch', category: 'software', type: 'Framework', href: 'https://pytorch.org/', img: 'assets/opt/pytorch.webp',
            blurb: 'The deep-learning framework most research models are written in.', aliases: ['deep learning', 'ml'],
            uses: ['p:pixelpose', 'p:detectron2-attention'] },
        { id: 'matlab', name: 'MATLAB', category: 'software', type: 'Tool', href: 'https://www.mathworks.com/products/matlab.html', img: 'assets/opt/matlab.webp',
            blurb: 'Numerical computing for signals, control, and linear algebra.', uses: [] },
        { id: 'javascript', name: 'JavaScript', category: 'software', type: 'Language', href: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript', img: 'assets/opt/javascript.webp',
            blurb: 'The language of the web, in the browser and in Node.js.', aliases: ['js', 'node', 'web'],
            uses: ['p:personal-portfolio', 'p:editorial-portfolio', 'p:pira'] },
        { id: 'typescript', name: 'TypeScript', category: 'software', type: 'Language', href: 'https://www.typescriptlang.org/', img: 'assets/images/skills/typescript.svg',
            blurb: 'JavaScript with types, for apps that need to hold together as they grow.', aliases: ['ts', 'web'],
            uses: ['f'] },
        { id: 'react', name: 'React', category: 'software', type: 'Library', href: 'https://react.dev/', img: 'assets/images/skills/react.svg',
            blurb: 'Component-based UI library.', aliases: ['ui', 'web', 'frontend'],
            uses: ['f'] },
        { id: 'sqlite', name: 'SQLite', category: 'software', type: 'Database', href: 'https://sqlite.org/', img: 'assets/opt/sqlite_logo.webp',
            blurb: 'A whole SQL database in a single file.', aliases: ['sql', 'database'],
            uses: ['p:chatsheets'] },
        { id: 'fastapi', name: 'FastAPI', category: 'software', type: 'Framework', href: 'https://fastapi.tiangolo.com/', img: 'assets/opt/fastapi_logo.webp',
            blurb: 'Fast, typed Python web APIs.', aliases: ['api', 'backend'], uses: [] },
        { id: 'html', name: 'HTML', category: 'software', type: 'Language', href: 'https://developer.mozilla.org/en-US/docs/Web/HTML', img: 'assets/opt/html_logo.webp',
            blurb: 'The structure of every web page.', aliases: ['web'],
            uses: ['p:personal-portfolio', 'p:editorial-portfolio', 'p:mias-portfolio'] },
        { id: 'css', name: 'CSS', category: 'software', type: 'Language', href: 'https://developer.mozilla.org/en-US/docs/Web/CSS', img: 'assets/opt/css_logo.webp',
            blurb: 'Layout, color, and motion for the web.', aliases: ['web', 'design'],
            uses: ['p:personal-portfolio', 'p:editorial-portfolio', 'p:mias-portfolio'] },
        { id: 'opencv', name: 'OpenCV', category: 'software', type: 'Library', href: 'https://opencv.org/', img: 'assets/images/skills/opencv.svg',
            blurb: 'The classic computer-vision toolkit.', aliases: ['vision', 'computer vision'], uses: [] },
        { id: 'pytest', name: 'pytest', category: 'software', type: 'Tool', href: 'https://docs.pytest.org/', img: 'assets/images/skills/pytest.svg',
            blurb: 'Python’s go-to testing framework.', aliases: ['testing', 'tests'],
            uses: ['p:sunny'] },
        { id: 'java', name: 'Java', category: 'software', type: 'Language', href: 'https://www.java.com/', img: 'assets/opt/java_logo.webp',
            blurb: 'Object-oriented and everywhere, courtesy of the JVM.', uses: [] },

        { id: 'arduino', name: 'Arduino', category: 'hardware', type: 'Hardware', href: 'https://www.arduino.cc/', img: 'assets/opt/arduino.webp',
            blurb: 'Microcontroller boards for fast hardware prototypes.', aliases: ['microcontroller', 'embedded'],
            uses: ['f'] },
        { id: 'raspberrypi', name: 'Raspberry Pi', category: 'hardware', type: 'Hardware', href: 'https://www.raspberrypi.org/', img: 'assets/opt/raspi_logo.webp',
            blurb: 'Tiny Linux computers for robots and gadgets.', aliases: ['pi', 'embedded', 'sbc'],
            uses: ['p:trashformerpro', 'p:pollux', 'f'] },
        { id: 'espressif', name: 'ESP32', category: 'hardware', type: 'Hardware', href: 'https://www.espressif.com/', img: 'assets/opt/espressif.webp',
            blurb: 'Espressif microcontrollers with Wi-Fi and Bluetooth built in.', aliases: ['espressif', 'esp', 'iot', 'embedded'],
            uses: ['p:pira', 'p:smartpill'] },
        { id: 'nvidia', name: 'NVIDIA', category: 'hardware', type: 'Hardware', href: 'https://learn.nvidia.com/courses/course-detail?course_id=course-v1:DLI+S-FX-01+V1', img: 'assets/opt/nvidia.webp',
            blurb: 'GPUs, Jetson edge computers, and robotics libraries like Nvblox and cuVSLAM.', aliases: ['jetson', 'gpu', 'cuda', 'edge ai'],
            uses: ['r:urRd', 'r:urAp', 'f'] },
        { id: 'ur', name: 'Universal Robots', category: 'hardware', type: 'Robot', href: 'https://www.universal-robots.com/', img: 'assets/opt/ur_logo.webp',
            blurb: 'Collaborative robot arms (cobots).', aliases: ['cobot', 'robot arm', 'ur'],
            uses: ['r:urAi', 'r:urRd', 'r:urAp'] },
        { id: 'ros', name: 'ROS', category: 'hardware', type: 'Middleware', href: 'https://www.ros.org/', img: 'assets/opt/ros1_logo.webp',
            blurb: 'The original Robot Operating System.', aliases: ['ros1', 'robotics'], uses: [] },
        { id: 'ros2', name: 'ROS 2', category: 'hardware', type: 'Middleware', href: 'https://www.ros.org/', img: 'assets/opt/ros_logo.webp',
            blurb: 'Robot middleware: nodes, topics, and real-time messaging.', aliases: ['ros2', 'robotics'],
            uses: ['p:pollux', 'f', 'r:urRd'] },
        { id: 'intel', name: 'Intel RealSense', category: 'hardware', type: 'Sensor', href: 'https://www.intelrealsense.com/sdk-2/', img: 'assets/opt/intel_logo.webp',
            blurb: 'Depth cameras and SDK for 3D perception.', aliases: ['intel', 'depth camera', 'vision'], uses: [] },
        { id: 'orbbec', name: 'Orbbec', category: 'hardware', type: 'Sensor', href: 'https://www.orbbec.com/developers/orbbec-sdk/', img: 'assets/images/orbbec_logo.png',
            blurb: '3D depth cameras and SDK.', aliases: ['depth camera', 'vision'], uses: [] },
        { id: 'beaglebone', name: 'BeagleBone', category: 'hardware', type: 'Hardware', href: 'https://www.beagleboard.org/', img: 'assets/opt/beaglebone_logo.webp',
            blurb: 'Single-board Linux computers with real-time I/O.', aliases: ['embedded', 'sbc'],
            uses: ['p:tiltgolf'] },

        { id: 'github', name: 'GitHub', category: 'platforms', type: 'Platform', href: 'https://github.com/nhathout', img: 'assets/images/github_logo.png',
            blurb: 'Where the code lives (and where this site is hosted).', aliases: ['git', 'repos'],
            uses: ['p:personal-portfolio', 'p:editorial-portfolio', 'r:umg'] },
        { id: 'git', name: 'Git', category: 'platforms', type: 'Tool', href: 'https://git-scm.com/', img: 'assets/images/git_logo.png',
            blurb: 'Version control for everything.', aliases: ['version control'],
            uses: ['p:personal-portfolio', 'r:umg'] },
        { id: 'githubactions', name: 'GitHub Actions', category: 'platforms', type: 'CI / CD', href: 'https://github.com/features/actions', img: 'assets/images/skills/githubactions.svg',
            blurb: 'Pipelines that test and ship on every push.', aliases: ['ci', 'cd', 'automation', 'testing'],
            uses: ['f', 'p:editorial-portfolio'] },
        { id: 'docker', name: 'Docker', category: 'platforms', type: 'Tool', href: 'https://www.docker.com/', img: 'assets/images/docker_logo.png',
            blurb: 'Containers: the same environment everywhere.', aliases: ['containers', 'devops'],
            uses: ['f'] },
        { id: 'onshape', name: 'Onshape', category: 'platforms', type: 'CAD', href: 'https://www.onshape.com/', img: 'assets/opt/onshape.webp',
            blurb: 'Browser-based CAD for designing parts.', aliases: ['cad', '3d', 'design'],
            uses: ['a:aboutQuests'] },
        { id: 'bambu', name: 'Bambu Lab', category: 'platforms', type: 'Hardware', href: 'https://bambulab.com/en-us', img: 'assets/opt/bambulablogo.webp',
            blurb: 'Fast, reliable 3D printers.', aliases: ['3d printing', 'printer', 'maker'],
            uses: ['a:aboutQuests'] },
        { id: 'godot', name: 'Godot', category: 'platforms', type: 'Engine', href: 'https://godotengine.org/', img: 'assets/images/skills/godot.svg',
            blurb: 'Open-source engine for 2D and 3D games.', aliases: ['game', 'gdscript', 'gamedev'],
            uses: ['p:untitled-game'] },
        { id: 'electron', name: 'Electron', category: 'platforms', type: 'Framework', href: 'https://www.electronjs.org/', img: 'assets/images/skills/electron.svg',
            blurb: 'Desktop apps built with web technology.', aliases: ['desktop'],
            uses: ['f'] },
        { id: 'unreal', name: 'Unreal Engine 5', category: 'platforms', type: 'Engine', href: 'https://www.unrealengine.com/en-US/unreal-engine-5', img: 'assets/opt/ur5.webp',
            blurb: 'High-end real-time 3D engine.', aliases: ['ue5', 'game', 'gamedev', '3d'], uses: [] },
        { id: 'ubuntu', name: 'Ubuntu', category: 'platforms', type: 'OS', href: 'https://ubuntu.com/', img: 'assets/opt/ubuntu_logo.webp',
            blurb: 'The Linux distribution most of robotics runs on.', aliases: ['linux'], uses: [] },
        { id: 'windows', name: 'Windows', category: 'platforms', type: 'OS', href: 'https://www.microsoft.com/windows', img: 'assets/opt/windows_logo.webp',
            blurb: 'Microsoft’s desktop OS.', aliases: ['desktop'], uses: ['f'] },
        { id: 'macos', name: 'macOS', category: 'platforms', type: 'OS', href: 'https://www.apple.com/macos/', img: 'assets/opt/macos_logo.webp',
            blurb: 'Apple’s desktop OS.', aliases: ['mac', 'desktop'], uses: ['f'] },
        { id: 'linux', name: 'Linux', category: 'platforms', type: 'OS', href: 'https://www.kernel.org/', img: 'assets/opt/linux_logo.webp',
            blurb: 'The kernel under robots, servers, and single-board computers.', aliases: ['unix', 'kernel'],
            uses: ['f', 'p:tiltgolf'] }
    ];

    const ANCHORS = {
        aboutQuests: '3D printing & CAD (side quest)'
    };

    // ---------------------------------------------------------------------
    //  Helpers
    // ---------------------------------------------------------------------
    const byId = new Map(SKILLS.map(skill => [skill.id, skill]));
    const FACES = ['front', 'back', 'right', 'left', 'top', 'bottom'];
    const coarseQuery = window.matchMedia('(pointer: coarse)');
    const isCoarse = () => coarseQuery.matches || 'ontouchstart' in window;

    function productName() {
        const title = document.getElementById('featuredTitle')?.textContent.trim();
        return title || 'Tealbloc';
    }

    function getProjects() {
        return typeof projectEntries !== 'undefined' ? projectEntries : [];
    }

    function categoryLabel(id) {
        return CATEGORIES.find(category => category.id === id)?.label || '';
    }

    // Resolve a skill's `uses` into renderable entries (skipping anything missing on the page).
    function resolveUses(skill) {
        const projects = getProjects();
        const entries = [];
        (skill.uses || []).forEach(ref => {
            const [kind, key] = ref.split(':');
            if (kind === 'p') {
                const project = projects.find(entry => entry.id === key);
                if (project) entries.push({ kind: 'project', key, label: project.upcoming ? `${project.title} (locked)` : project.title });
            } else if (kind === 'f') {
                if (document.getElementById('featured-bros2')) entries.push({ kind: 'featured', key: 'featured-bros2', label: productName() });
            } else if (kind === 'r') {
                if (ROLES[key]) entries.push({ kind: 'role', key, label: ROLES[key].label });
            } else if (kind === 'a') {
                if (document.getElementById(key)) entries.push({ kind: 'anchor', key, label: ANCHORS[key] || key });
            }
        });
        return entries;
    }

    function followUse(use) {
        if (use.kind === 'project' && typeof openProjectDialog === 'function') {
            openProjectDialog(use.key);
            return;
        }
        if (use.kind === 'featured' || use.kind === 'anchor') {
            if (typeof scrollToSection === 'function') scrollToSection(use.key);
            else document.getElementById(use.key)?.scrollIntoView();
            return;
        }
        if (use.kind === 'role') {
            const role = ROLES[use.key];
            const card = Array.from(document.querySelectorAll('.edex-card'))
                .find(entry => entry.dataset.title === role.title && entry.dataset.org === role.org);
            if (!card) return;
            if (card.classList.contains('is-hidden')) {
                document.querySelector('.edex-filter[data-filter="all"]')?.click();
            }
            const top = card.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.3;
            window.scrollTo({ top, behavior: reducedMotion ? 'auto' : 'smooth' });
            card.click();
            card.classList.add('is-pinged');
            setTimeout(() => card.classList.remove('is-pinged'), 1600);
            setTimeout(() => card.focus({ preventScroll: true }), reducedMotion ? 0 : 450);
        }
    }

    // ---------------------------------------------------------------------
    //  Elements + state
    // ---------------------------------------------------------------------
    const panel = document.getElementById('skillsPanel');
    const grid = document.getElementById('skillsGrid');
    const tabsEl = document.getElementById('skillsTabs');
    const activeLabel = document.getElementById('skillsActiveLabel');
    const prevBtn = document.getElementById('skillsPrev');
    const nextBtn = document.getElementById('skillsNext');
    const info = document.getElementById('skillsInfo');
    if (!panel || !grid || !tabsEl) return;

    let activeIndex = 0;
    let tabButtons = [];
    let previewLink = null;
    let previewTimer = null;
    let wheelLock = 0;
    let shownSkill = null;
    let autoTimer = null;
    let autoStopped = reducedMotion;
    let hovering = false;
    let ignoreScrollUntil = 0;

    // ---------------------------------------------------------------------
    //  Info box: the RPG "item description" under the cubes
    // ---------------------------------------------------------------------
    function renderHint() {
        shownSkill = null;
        if (!info) return;
        info.innerHTML = '';
        const box = document.createElement('div');
        box.className = 'skills-info__box skills-info__box--hint';
        const p = document.createElement('p');
        p.className = 'skills-info__hint';
        p.textContent = isCoarse()
            ? 'Tap a cube to see where I’ve used it.'
            : 'Hover (or tab to) a cube to see where I’ve used it.';
        box.appendChild(p);
        info.appendChild(box);
    }

    function useIcon(kind) {
        return { project: '▸', featured: '★', role: '◆', anchor: '♦' }[kind] || '•';
    }

    function renderInfo(skillId) {
        const skill = byId.get(skillId);
        if (!skill || !info || shownSkill === skillId) return;
        shownSkill = skillId;
        grid.querySelectorAll('.skill-link').forEach(link => link.classList.toggle('is-shown', link.dataset.skill === skillId));

        info.innerHTML = '';
        const box = document.createElement('div');
        box.className = 'skills-info__box';

        const head = document.createElement('div');
        head.className = 'skills-info__head';
        const icon = document.createElement('span');
        icon.className = 'skills-info__icon';
        const img = document.createElement('img');
        img.src = skill.img;
        img.alt = '';
        icon.appendChild(img);
        const titles = document.createElement('div');
        titles.className = 'skills-info__titles';
        const type = document.createElement('p');
        type.className = 'skills-info__type';
        type.textContent = `${skill.type} · ${categoryLabel(skill.category)}`;
        const name = document.createElement('p');
        name.className = 'skills-info__name';
        name.textContent = skill.name;
        titles.append(type, name);
        const link = document.createElement('a');
        link.className = 'skills-info__link';
        link.href = skill.href;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        try {
            link.textContent = `${new URL(skill.href).hostname.replace(/^www\./, '')} ↗`;
        } catch (error) {
            link.textContent = 'Learn more ↗';
        }
        head.append(icon, titles, link);

        const blurb = document.createElement('p');
        blurb.className = 'skills-info__blurb';
        blurb.textContent = skill.blurb;

        const usesRow = document.createElement('div');
        usesRow.className = 'skills-info__uses';
        const label = document.createElement('span');
        label.className = 'skills-info__label';
        label.textContent = 'Used in';
        usesRow.appendChild(label);
        const uses = resolveUses(skill);
        if (uses.length) {
            uses.forEach(use => {
                const chip = document.createElement('button');
                chip.type = 'button';
                chip.className = `skills-use skills-use--${use.kind}`;
                const mark = document.createElement('span');
                mark.className = 'skills-use__mark';
                mark.setAttribute('aria-hidden', 'true');
                mark.textContent = useIcon(use.kind);
                const text = document.createElement('span');
                text.textContent = use.label;
                chip.append(mark, text);
                chip.setAttribute('aria-label', {
                    project: `Open project: ${use.label}`,
                    featured: `Go to the featured project: ${use.label}`,
                    role: `Show in the timeline: ${use.label}`,
                    anchor: `Go to: ${use.label}`
                }[use.kind]);
                chip.addEventListener('click', () => followUse(use));
                usesRow.appendChild(chip);
            });
        } else {
            const empty = document.createElement('span');
            empty.className = 'skills-info__empty';
            empty.textContent = 'Not featured in a project on this page yet.';
            usesRow.appendChild(empty);
        }

        box.append(head, blurb, usesRow);
        info.appendChild(box);
    }

    // ---------------------------------------------------------------------
    //  Cubes
    // ---------------------------------------------------------------------
    function buildTabs() {
        tabsEl.innerHTML = '';
        tabButtons = CATEGORIES.map((category, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'skills-tab';
            button.dataset.category = category.id;
            const text = document.createElement('span');
            text.textContent = category.label;
            const count = document.createElement('small');
            count.className = 'skills-tab__count';
            count.textContent = String(SKILLS.filter(skill => skill.category === category.id).length);
            button.append(text, count);
            button.addEventListener('click', () => {
                stopAutoCycle();
                setCategory(index);
            });
            tabsEl.appendChild(button);
            return button;
        });
    }

    // On narrow screens the item box slides in right under the tapped cube's row,
    // so it's on screen without covering any cube; elsewhere it sits under the grid.
    const narrowQuery = window.matchMedia('(max-width: 767px)');
    const infoHome = document.createComment('skills-info');
    info?.before(infoHome);

    function dockInfo() {
        if (info && info.parentElement === grid) infoHome.after(info);
        info?.classList.remove('is-inline');
    }

    function placeInfo(link) {
        if (!info || !link) return;
        if (!narrowQuery.matches) {
            dockInfo();
            return;
        }
        const cells = Array.from(grid.children).filter(child => child !== info);
        const cell = link.closest('.flex');
        const index = cells.indexOf(cell);
        if (index === -1) return;
        const columns = Math.max(1, getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length);
        const rowEnd = Math.min(cells.length - 1, Math.floor(index / columns) * columns + columns - 1);
        cells[rowEnd].after(info);
        info.classList.add('is-inline');
        ignoreScrollUntil = Date.now() + 900;
        requestAnimationFrame(() => info.scrollIntoView({ block: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' }));
    }

    narrowQuery.addEventListener?.('change', () => {
        if (!narrowQuery.matches) dockInfo();
    });

    function renderGrid() {
        clearPreview();
        dockInfo();
        grid.innerHTML = '';
        const categoryId = CATEGORIES[activeIndex].id;
        const fragment = document.createDocumentFragment();
        SKILLS.filter(skill => skill.category === categoryId).forEach((skill, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'flex justify-center';

            const link = document.createElement('a');
            link.href = skill.href;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.className = 'skill-link';
            link.dataset.skill = skill.id;
            link.style.setProperty('--i', index);
            const uses = resolveUses(skill);
            link.setAttribute('aria-label', `${skill.name}: ${skill.type}${uses.length ? `, used in ${uses.length} place${uses.length > 1 ? 's' : ''} on this page` : ''}. Opens ${skill.href.replace(/^https?:\/\//, '').split('/')[0]}`);
            link.setAttribute('aria-describedby', 'skillsInfo');

            const cube = document.createElement('div');
            cube.className = 'skill-cube';
            FACES.forEach(face => {
                const faceEl = document.createElement('div');
                faceEl.className = `skill-face ${face}`;
                const img = document.createElement('img');
                img.src = skill.img;
                img.alt = '';
                img.setAttribute('aria-hidden', 'true');
                faceEl.appendChild(img);
                cube.appendChild(faceEl);
            });

            const label = document.createElement('span');
            label.className = 'skill-label';
            label.textContent = skill.name;
            if (uses.length) {
                const count = document.createElement('small');
                count.className = 'skill-label__count';
                count.setAttribute('aria-hidden', 'true');
                count.textContent = `×${uses.length}`;
                label.appendChild(count);
            }

            link.append(cube, label);
            wrapper.appendChild(link);
            fragment.appendChild(wrapper);
        });
        grid.appendChild(fragment);
        if (shownSkill && byId.get(shownSkill)?.category !== categoryId) renderHint();
    }

    function updateNav() {
        if (activeLabel) activeLabel.textContent = CATEGORIES[activeIndex].label;
        tabButtons.forEach((button, index) => {
            const active = index === activeIndex;
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-pressed', String(active));
        });
    }

    function setCategory(nextIndex, { animate = true } = {}) {
        const normalized = (nextIndex + CATEGORIES.length) % CATEGORIES.length;
        if (normalized === activeIndex) return;
        const update = () => {
            activeIndex = normalized;
            renderGrid();
            updateNav();
        };
        if (!animate || reducedMotion) {
            update();
            return;
        }
        grid.classList.add('skills-grid--exit');
        setTimeout(() => {
            update();
            grid.classList.remove('skills-grid--exit');
            grid.classList.add('skills-grid--enter');
            setTimeout(() => grid.classList.remove('skills-grid--enter'), 400);
        }, 200);
    }

    // ---------------------------------------------------------------------
    //  Touch preview: first tap spins + describes, second tap follows the link
    // ---------------------------------------------------------------------
    function clearPreview() {
        previewLink?.classList.remove('is-preview');
        previewLink = null;
        clearTimeout(previewTimer);
        previewTimer = null;
    }

    function setPreview(link) {
        if (previewLink !== link) {
            clearPreview();
            previewLink = link;
            link.classList.add('is-preview');
        }
        clearTimeout(previewTimer);
        previewTimer = setTimeout(clearPreview, 6000);
    }

    grid.addEventListener('click', event => {
        const link = event.target.closest('.skill-link');
        if (!link) return;
        renderInfo(link.dataset.skill);
        placeInfo(link);
        if (!isCoarse()) return;
        if (!link.classList.contains('is-preview')) {
            event.preventDefault();
            setPreview(link);
        } else {
            clearPreview();
        }
    });
    document.addEventListener('click', event => {
        if (!previewLink) return;
        if (event.target.closest('.skill-link') === previewLink) return;
        clearPreview();
    });
    window.addEventListener('scroll', () => {
        // our own scroll-into-view of the item box shouldn't cancel the preview
        if (previewLink && isCoarse() && Date.now() > ignoreScrollUntil) clearPreview();
    }, { passive: true });

    grid.addEventListener('mouseover', event => {
        if (isCoarse()) return;
        const link = event.target.closest('.skill-link');
        if (link) renderInfo(link.dataset.skill);
    });
    grid.addEventListener('focusin', event => {
        const link = event.target.closest('.skill-link');
        if (link) renderInfo(link.dataset.skill);
    });

    // ---------------------------------------------------------------------
    //  Paging: arrows, sideways wheel/trackpad, gentle auto-advance
    // ---------------------------------------------------------------------
    prevBtn?.addEventListener('click', () => {
        stopAutoCycle();
        setCategory(activeIndex - 1);
    });
    nextBtn?.addEventListener('click', () => {
        stopAutoCycle();
        setCategory(activeIndex + 1);
    });
    grid.addEventListener('wheel', event => {
        if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) || Math.abs(event.deltaX) < 15) return;
        const now = Date.now();
        if (now - wheelLock < 600) return;
        event.preventDefault();
        stopAutoCycle();
        setCategory(activeIndex + (event.deltaX > 0 ? 1 : -1));
        wheelLock = now;
    }, { passive: false });

    // Auto-advance every 20s, but never while someone is looking at or using the
    // panel, and not at all once they've picked a tab themselves.
    function stopAutoCycle() {
        autoStopped = true;
        clearInterval(autoTimer);
        autoTimer = null;
    }

    function startAutoCycle() {
        if (autoStopped || autoTimer) return;
        autoTimer = setInterval(() => {
            if (hovering || panel.contains(document.activeElement) || document.hidden) return;
            setCategory(activeIndex + 1);
        }, 20000);
    }

    panel.addEventListener('pointerenter', () => { hovering = true; });
    panel.addEventListener('pointerleave', () => { hovering = false; });
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) startAutoCycle();
            else {
                clearInterval(autoTimer);
                autoTimer = null;
            }
        }, { threshold: 0.2 }).observe(panel);
    } else {
        startAutoCycle();
    }

    // ---------------------------------------------------------------------
    //  Pixel flair: a treasure chest that pops open the first time you arrive
    // ---------------------------------------------------------------------
    const CHEST = [
        '................',
        '................',
        '................',
        '................',
        '..DDDDDDDDDDDD..',
        '.DMmmmmmmmmmmMD.',
        '.DmzzzzzzzzzzmD.',
        '.DMMMMMyyMMMMMD.',
        '.DmmmmyDDymmmmD.',
        '.DmzzzyyyyzzzmD.',
        '.DmmmmmmmmmmmmD.',
        '.DmzzzzzzzzzzmD.',
        '.DMMMMMMMMMMMMD.',
        '.DDDDDDDDDDDDDD.'
    ];
    const CHEST_OPEN = [
        '..DDDDDDDDDDDD..',
        '.DMmmmmmmmmmmMD.',
        '.DmzzzzzzzzzzmD.',
        '.DMMMMMyyMMMMMD.',
        '.DDDDDDDDDDDDDD.',
        '.DyywyyycyyyyyD.',
        '.DykyyyyyyyykyD.',
        '.DMMMMMyyMMMMMD.',
        '.DmmmmyDDymmmmD.',
        '.DmzzzyyyyzzzmD.',
        '.DmmmmmmmmmmmmD.',
        '.DmzzzzzzzzzzmD.',
        '.DMMMMMMMMMMMMD.',
        '.DDDDDDDDDDDDDD.'
    ];

    function initChest() {
        const holder = panel.querySelector('[data-skills-chest]');
        if (!holder || !kit) return;
        const canvas = kit.canvasFor(CHEST, 'skills-chest__canvas');
        holder.appendChild(canvas);
        const open = () => {
            kit.redraw(canvas, ctx => kit.paint(ctx, CHEST_OPEN));
            holder.classList.add('is-open');
        };
        if (reducedMotion || !('IntersectionObserver' in window)) {
            open();
            return;
        }
        const observer = new IntersectionObserver(entries => {
            if (!entries[0].isIntersecting) return;
            observer.disconnect();
            setTimeout(open, 300);
        }, { threshold: 0.35 });
        observer.observe(panel);
    }

    // ---------------------------------------------------------------------
    buildTabs();
    renderGrid();
    updateNav();
    renderHint();
    initChest();
    coarseQuery.addEventListener?.('change', () => {
        clearPreview();
        if (!shownSkill) renderHint();
    });

    // the featured product may be renamed on the page; keep "used in" labels in sync
    const featuredTitle = document.getElementById('featuredTitle');
    if (featuredTitle && 'MutationObserver' in window) {
        new MutationObserver(() => {
            const current = shownSkill;
            shownSkill = null;
            if (current) renderInfo(current);
        }).observe(featuredTitle, { childList: true, characterData: true, subtree: true });
    }
})();
