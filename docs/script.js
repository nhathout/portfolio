const THEME_STORAGE_KEY = 'darkmode';
const themeRoot = document.documentElement;
const themeToggleButtons = Array.from(document.querySelectorAll('[data-theme-toggle]'));
const themeToggleLabels = Array.from(document.querySelectorAll('[data-theme-toggle-label]'));

function getStoredTheme() {
    try {
        return localStorage.getItem(THEME_STORAGE_KEY);
    } catch (error) {
        return null;
    }
}

function persistTheme(isDarkMode) {
    try {
        if (isDarkMode) {
            localStorage.setItem(THEME_STORAGE_KEY, 'active');
        } else {
            localStorage.removeItem(THEME_STORAGE_KEY);
        }
    } catch (error) {}
}

function isDarkModeEnabled() {
    return themeRoot.classList.contains('darkmode');
}

function updateThemeToggleState() {
    const darkEnabled = isDarkModeEnabled();
    const nextModeLabel = darkEnabled ? 'Switch to light mode' : 'Switch to dark mode';
    const buttonLabel = darkEnabled ? 'Light mode' : 'Dark mode';

    themeToggleButtons.forEach(button => {
        button.setAttribute('aria-pressed', String(darkEnabled));
        button.setAttribute('aria-label', nextModeLabel);
        button.setAttribute('title', nextModeLabel);
    });

    themeToggleLabels.forEach(label => {
        label.textContent = buttonLabel;
    });
}

function enableDarkmode() {
    themeRoot.classList.add('darkmode');
    persistTheme(true);
    updateThemeToggleState();
}

function disableDarkmode() {
    themeRoot.classList.remove('darkmode');
    persistTheme(false);
    updateThemeToggleState();
}

function initThemeToggle() {
    if (getStoredTheme() === 'active') {
        themeRoot.classList.add('darkmode');
    }

    updateThemeToggleState();
    themeToggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (isDarkModeEnabled()) {
                disableDarkmode();
                return;
            }
            enableDarkmode();
        });
    });
}

initThemeToggle();

// Mobile navigation + indicator state
const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');
const mobileMenuClose = document.getElementById('mobileMenuClose');
const mobileMenuBackdrop = document.getElementById('mobileMenuBackdrop');
const mobileSwipeChips = Array.from(document.querySelectorAll('.mobile-swipe-chip'));
const navSectionIndicator = document.getElementById('navSectionIndicator');
const coarsePointerMedia = window.matchMedia ? window.matchMedia('(pointer: coarse)') : null;
const mobileContactAction = document.querySelector('[data-mobile-contact-action]');

let mobileActiveChipIndex = Math.max(mobileSwipeChips.findIndex(chip => chip.classList.contains('is-active')), 0);

function setMobileMenuState(nextState) {
    if (!mobileMenu) return;
    const shouldOpen = typeof nextState === 'boolean' ? nextState : !mobileMenu.classList.contains('is-open');
    mobileMenu.classList.toggle('is-open', shouldOpen);
    document.body.classList.toggle('mobile-nav-open', shouldOpen);
    mobileMenu.setAttribute('aria-hidden', String(!shouldOpen));
    menuToggle?.setAttribute('aria-expanded', String(shouldOpen));
    menuToggle?.classList.toggle('is-active', shouldOpen);
}

function highlightMobileChip(targetId, { scrollIntoView = false } = {}) {
    if (!mobileSwipeChips.length || !targetId) return;
    const normalizedId = targetId.replace(/^#/, '');
    mobileSwipeChips.forEach((chip, index) => {
        const matches = chip.dataset.target === normalizedId;
        chip.classList.toggle('is-active', matches);
        if (matches) {
            mobileActiveChipIndex = index;
            if (scrollIntoView) {
                chip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
        }
    });
}

function scrollToSection(targetId, { closeMenu = true } = {}) {
    if (!targetId) return;
    const normalizedId = targetId.replace(/^#/, '');
    const target = document.getElementById(normalizedId);
    if (!target) return;
    const offset = (topNav?.offsetHeight || 0) + 16;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
    highlightMobileChip(normalizedId, { scrollIntoView: true });
    if (closeMenu && mobileMenu?.classList.contains('is-open')) {
        setMobileMenuState(false);
    }
}

function initMobileNavigation() {
    menuToggle?.addEventListener('click', () => setMobileMenuState());
    mobileMenuClose?.addEventListener('click', () => setMobileMenuState(false));
    mobileMenuBackdrop?.addEventListener('click', () => setMobileMenuState(false));
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            setMobileMenuState(false);
        }
    });
    mobileSwipeChips.forEach(chip => {
        chip.addEventListener('click', () => scrollToSection(chip.dataset.target));
    });
    mobileContactAction?.addEventListener('click', () => scrollToSection('contact'));
}

initMobileNavigation();

// Hide/Show top nav on scroll
let lastScrollTop = 0;
const topNav = document.getElementById('topNav');
const indicatorSections = [
    { id: 'about', label: '/ about' },
    { id: 'education-experience', label: '/ edex' },
    { id: 'skills', label: '/ skills' },
    { id: 'projects', label: '/ projects' },
    { id: 'awards-affiliations', label: '/ awards' },
    { id: 'contact', label: '/ contact' }
].map(section => {
    const el = document.getElementById(section.id);
    return el ? { ...section, element: el } : null;
}).filter(Boolean);

function updateNavIndicator() {
    if (!navSectionIndicator) return;
    const referenceY = window.scrollY + window.innerHeight * 0.25;
    const headerOffset = topNav ? topNav.offsetHeight + 24 : 24;
    let activeLabel = '/ ~';
    let activeSectionId = null;

    for (const section of indicatorSections) {
        const elementTop = section.element.offsetTop - headerOffset - 60;
        const elementBottom = elementTop + section.element.offsetHeight;
        if (referenceY >= elementTop && referenceY < elementBottom) {
            activeLabel = section.label;
            activeSectionId = section.id;
            break;
        }
        if (referenceY >= elementBottom) {
            activeLabel = section.label;
            activeSectionId = section.id;
        }
    }

    navSectionIndicator.textContent = activeLabel;
    highlightMobileChip(activeSectionId);
}

window.addEventListener('scroll', () => {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop > lastScrollTop) {
        // Scrolling down - hide nav
        //topNav.style.transform = 'translateY(-100%)';
    } else {
        // Scrolling up - show nav
        //topNav.style.transform = 'translateY(0)';
    }
    lastScrollTop = Math.max(scrollTop, 0);
    updateNavIndicator();
});
window.addEventListener('resize', updateNavIndicator);
window.addEventListener('load', updateNavIndicator);

const resumePopover = document.getElementById('resumePopover');
const resumePopoverClose = document.getElementById('resumePopoverClose');
const projectsGrid = document.getElementById('projectsGrid');
const copyrightYear = document.getElementById('copyrightYear');
const edexFilters = Array.from(document.querySelectorAll('.edex-filter'));
const edexCards = Array.from(document.querySelectorAll('.edex-card'));
const edexSpotlight = {
    root: document.getElementById('edexSpotlight'),
    eyebrow: document.getElementById('edexSpotlightEyebrow'),
    title: document.getElementById('edexSpotlightTitle'),
    org: document.getElementById('edexSpotlightOrg'),
    summary: document.getElementById('edexSpotlightSummary'),
    meta: document.getElementById('edexSpotlightMeta'),
    tags: document.getElementById('edexSpotlightTags'),
    highlights: document.getElementById('edexSpotlightHighlights'),
    logo: document.getElementById('edexSpotlightLogo')
};
const RESUME_STORAGE_KEY = null;
let activeEdexCard = null;
let edexSpotlightTimer = null;

function initResumePopover() {
    if (!resumePopover) return;
    setTimeout(() => resumePopover.classList.add('is-visible'), 1200);
    resumePopoverClose?.addEventListener('click', () => {
        resumePopover.classList.remove('is-visible');
    });
    initResumePopoverFooterLift();
}

/**
 * Keep the resume card clear of the footer.
 *
 * The card is fixed to the bottom-right, which is exactly where the footer's
 * last row sits — so on the way down the page it ends up parked on top of it.
 * Instead of hiding the card, ride it upward by however much it would have
 * overlapped, so the footer is always reachable and the card stays available.
 */
function initResumePopoverFooterLift() {
    const footer = document.querySelector('footer');
    if (!footer) return;

    const REST_BOTTOM = 24;  // matches `bottom` in the .resume-popover rule
    const GAP = 14;          // breathing room between card and footer
    let queued = false;

    const apply = () => {
        queued = false;
        const footerTop = footer.getBoundingClientRect().top;
        const cardBottom = window.innerHeight - REST_BOTTOM;
        let lift = Math.max(0, cardBottom - footerTop + GAP);
        // never push it off the top of the screen on short viewports
        const maxLift = Math.max(
            0,
            window.innerHeight - resumePopover.offsetHeight - REST_BOTTOM - 8
        );
        lift = Math.min(lift, maxLift);
        resumePopover.style.setProperty('--resume-lift', `${Math.round(lift)}px`);
    };

    const schedule = () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(apply);
    };

    // tracks scroll 1:1, so it reads as the card stepping aside rather than
    // animating — no transition on `bottom` on purpose
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    apply();
}

function initCopyrightYear() {
    if (!copyrightYear) return;
    const currentYear = new Date().getFullYear();
    copyrightYear.textContent = currentYear > 2024 ? `2024-${currentYear}` : String(currentYear);
}

function renderEdexCollection(container, values, className) {
    if (!container) return;
    container.innerHTML = '';
    values.forEach(value => {
        const chip = document.createElement('span');
        chip.className = className;
        chip.textContent = value;
        container.appendChild(chip);
    });
}

function renderEdexHighlights(values) {
    if (!edexSpotlight.highlights) return;
    edexSpotlight.highlights.innerHTML = '';
    values.forEach(value => {
        const item = document.createElement('li');
        item.textContent = value;
        edexSpotlight.highlights.appendChild(item);
    });
}

function activateEdexCard(card, { animate = true } = {}) {
    if (!card || card.classList.contains('is-hidden') || !edexSpotlight.root) return;
    activeEdexCard = card;

    edexCards.forEach(entry => {
        const isActive = entry === card;
        entry.classList.toggle('is-active', isActive);
        entry.setAttribute('aria-pressed', String(isActive));
    });

    const accent = getComputedStyle(card).getPropertyValue('--edex-accent').trim() || '#0f766e';
    const accentSoft = getComputedStyle(card).getPropertyValue('--edex-accent-soft').trim() || 'rgba(15,118,110,0.16)';
    const categoryLabel = card.dataset.categoryLabel || card.dataset.category || 'Highlight';
    const phase = card.dataset.phase ? `${categoryLabel} / ${card.dataset.phase}` : categoryLabel;
    const meta = [card.dataset.period, card.dataset.location, card.dataset.mode].filter(Boolean);
    const tags = (card.dataset.tags || '').split('|').map(value => value.trim()).filter(Boolean);
    const highlights = (card.dataset.highlights || '').split('|').map(value => value.trim()).filter(Boolean);
    const logoAlt = card.querySelector('.edex-card__logo img')?.alt || `${card.dataset.org || card.dataset.title || 'Active'} logo`;

    edexSpotlight.root.style.setProperty('--spotlight-accent', accent);
    edexSpotlight.root.style.setProperty('--spotlight-accent-soft', accentSoft);
    if (edexSpotlight.eyebrow) edexSpotlight.eyebrow.textContent = phase;
    if (edexSpotlight.title) edexSpotlight.title.textContent = card.dataset.title || '';
    if (edexSpotlight.org) edexSpotlight.org.textContent = card.dataset.org || '';
    if (edexSpotlight.summary) edexSpotlight.summary.textContent = card.dataset.summary || '';
    if (edexSpotlight.logo) {
        edexSpotlight.logo.src = card.dataset.logo || edexSpotlight.logo.src;
        edexSpotlight.logo.alt = logoAlt;
    }

    renderEdexCollection(edexSpotlight.meta, meta, 'edex-meta-pill');
    renderEdexCollection(edexSpotlight.tags, tags, 'edex-tag');
    renderEdexHighlights(highlights);

    if (!animate) return;
    edexSpotlight.root.classList.add('is-swapping');
    if (edexSpotlightTimer) {
        clearTimeout(edexSpotlightTimer);
    }
    edexSpotlightTimer = window.setTimeout(() => {
        edexSpotlight.root?.classList.remove('is-swapping');
    }, 180);
}

function setEdexFilter(filter) {
    if (!edexCards.length) return;

    edexFilters.forEach(button => {
        const isActive = button.dataset.filter === filter;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
    });

    const visibleCards = edexCards.filter(card => {
        const isVisible = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('is-hidden', !isVisible);
        card.setAttribute('aria-hidden', String(!isVisible));
        return isVisible;
    });

    if (!visibleCards.length) return;
    const nextActiveCard = visibleCards.includes(activeEdexCard) ? activeEdexCard : visibleCards[0];
    activateEdexCard(nextActiveCard, { animate: false });
}

function initEdexSection() {
    if (!edexCards.length || !edexSpotlight.root) return;

    edexFilters.forEach(button => {
        button.addEventListener('click', () => setEdexFilter(button.dataset.filter || 'all'));
    });

    edexCards.forEach(card => {
        card.addEventListener('click', () => activateEdexCard(card));
        card.addEventListener('focus', () => activateEdexCard(card, { animate: false }));
        card.addEventListener('mouseenter', () => {
            if (isCoarsePointer()) return;
            activateEdexCard(card, { animate: false });
        });
        card.addEventListener('keydown', event => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            activateEdexCard(card);
        });
    });

    setEdexFilter('all');
}

// Project cards. Fields:
//   id          stable slug (used by the detail dialog + command palette)
//   categories  any of: robotics, ai, embedded, software, games (drives the filter chips)
//   status      optional pill: 'live' | 'private' | 'building'
//   image       still image; or `video` (+ `poster`) for a looping clip; or `terminal` lines for a text-art tile
//   details     bullet points shown in the detail dialog
//   upcoming    renders the card as locked (no media, no details)
const projectCategories = [
    { id: 'all', label: 'All' },
    { id: 'robotics', label: 'Robotics' },
    { id: 'ai', label: 'AI / ML' },
    { id: 'embedded', label: 'Embedded' },
    { id: 'software', label: 'Software & Web' },
    { id: 'games', label: 'Games' }
];
const projectEntries = [
    {
        id: 'thesis',
        title: "Master's Thesis",
        categories: ['robotics', 'ai'],
        description: 'Current thesis work. Final title, visuals, summary, and links unlock once the project is complete.',
        upcoming: {
            label: 'Thesis in progress',
            note: 'This block stays locked until the thesis is finished.',
            placeholderMark: '?'
        },
        links: []
    },
    {
        id: 'untitled-game',
        title: 'Untitled Game',
        categories: ['games', 'software'],
        description: 'My first video game: a 3D title in Godot 4, built with an AI-assisted workflow and its own automated test suite. The concept stays under wraps until it is ready to show.',
        tags: ['Godot 4', 'GDScript', '3D'],
        upcoming: {
            label: 'In development',
            note: 'Codename redacted. Unlocks at announcement.',
            placeholderMark: 'P1'
        },
        links: []
    },
    {
        id: 'sunny',
        title: 'Sunny',
        subtitle: 'Local-first multi-agent assistant',
        categories: ['ai', 'software'],
        status: 'private',
        description: 'A crew of AI agents that runs on my PC on a schedule: each one does a chore, files an honest report, and never acts on the outside world without my approval.',
        terminal: [
            ['07:00', 'crew wakes (task scheduler)', ''],
            ['07:01', 'backups', 'ok'],
            ['07:03', 'repo health', '2 warn'],
            ['07:09', 'research', 'report filed'],
            ['07:12', 'captain', 'digest ready'],
            ['', 'model: local · spent $0.00', '']
        ],
        details: [
            'Specialist agents wake on a schedule (Windows Task Scheduler can wake the PC from sleep), do one job each, and write a structured report; a captain agent turns them into a single daily digest.',
            'Local-first: runs on local models through Ollama by default and escalates to Claude only where it is worth it, inside a monthly budget that falls back to local models on its own.',
            'Anything that touches the outside world goes through an approval queue first.',
            'A pixel-art control room UI that only shows what the harness can actually prove from real process and file state.',
            'Python 3.12, pydantic, httpx, and the Claude Agent SDK, backed by 1,400+ pytest tests.'
        ],
        tags: ['Python', 'Multi-agent', 'Ollama', 'Claude Agent SDK', 'pytest'],
        links: []
    },
    {
        id: 'trashformerpro',
        title: 'TrashformerPro',
        categories: ['ai', 'embedded'],
        description: 'Low-cost Raspberry Pi smart-bin prototype that detects staged waste, classifies four categories with MobileNetV3-Large, and gives live feedback through a web app, LEDs, buzzer, and logs.',
        video: 'assets/opt/trashpro.mp4',
        poster: 'assets/opt/trashpro-poster.webp',
        details: [
            'Embedded waste-classification prototype on a Raspberry Pi 5 with an upward-facing camera, acrylic sorting plate, LED/buzzer feedback, a web app, and runtime logging.',
            'MobileNetV3-Large four-class classifier with empty-plate differencing and confidence-gated inference.',
            'Reached 95.3% test accuracy after on-device feedback fine-tuning.'
        ],
        tags: ['Raspberry Pi 5', 'MobileNetV3', 'Python', 'Web app'],
        links: [
            { label: 'Report', href: 'assets/files/TrashformerPro_finalreport.pdf' },
            { label: 'Repository', href: 'https://github.com/nhathout/TrashformerPro' }
        ]
    },
    {
        id: 'pixelpose',
        title: 'PixelPose',
        categories: ['ai'],
        description: '6-DoF monocular camera pose regression study comparing CNN, ViT, and DINO backbones across indoor and outdoor datasets, with Grad-CAM and patch attribution to inspect learned spatial cues.',
        image: 'assets/opt/pixelpose.webp',
        details: [
            'Benchmarked CNN, ViT, and DINO backbones for absolute pose regression on indoor (MS 7-Scenes) and outdoor (Cambridge KingsCollege) scenes.',
            'Trained per-scene models and evaluated position and orientation error.',
            'Interpreted predictions with Grad-CAM and patch-token attribution.'
        ],
        tags: ['PyTorch', 'ViT / DINO', 'Computer Vision'],
        links: [
            { label: 'Report', href: 'assets/files/IVC_Final-1.pdf' }
        ]
    },
    {
        id: 'pollux',
        title: 'Pollux',
        categories: ['robotics', 'ai', 'embedded'],
        description: 'An autonomous countertop-cleaning robot with reinforcement learning to avoid cliffs and obstacles.',
        video: 'assets/opt/pollux.mp4',
        poster: 'assets/opt/pollux-poster.webp',
        details: [
            'ROS 2 mobile robot that disinfects surfaces with UV-C LEDs while avoiding obstacles and cliffs.',
            'Custom PPO reward structure reaching 60%+ simulated coverage with zero edge violations.',
            'Ultrasonic and IMU sensing in a real-time perception stack on a Raspberry Pi 4B.'
        ],
        tags: ['ROS 2', 'PPO (RL)', 'Raspberry Pi 4B'],
        links: [
            { label: 'Repository', href: 'https://github.com/nhathout/pollux-AMR' }
        ]
    },
    {
        id: 'tiltgolf',
        title: 'TiltGolf',
        categories: ['embedded', 'games'],
        description: 'Tilt-controlled mini golf on BeagleBone Black; IMU driver streams tilt to a Qt arcade UI with real-time physics.',
        video: 'assets/opt/tiltgolf.mp4',
        poster: 'assets/opt/tiltgolf-poster.webp',
        details: [
            'Linux kernel driver for the IMU on a BeagleBone Black streams tilt data to user space.',
            'Qt arcade UI with Box2D physics turns the board into a mini-golf controller.'
        ],
        tags: ['BeagleBone', 'Kernel driver', 'Qt', 'Box2D'],
        links: [
            { label: 'Report', href: 'https://github.com/nhathout/TiltGolf/blob/main/tiltgolf-final-report.pdf' },
            { label: 'Repository', href: 'https://github.com/nhathout/TiltGolf' }
        ]
    },
    {
        id: 'trashformer',
        title: 'Trashformer',
        categories: ['robotics', 'ai'],
        description: 'Open-source 3D-printed tabletop sorting arm with vision-driven classification and trajectory planning to sort waste.',
        image: 'assets/opt/trashformer.webp',
        tags: ['3D printing', 'Computer Vision', 'Motion planning'],
        links: [
            { label: 'Report', href: 'assets/files/EK505_Transformer_Final_Report__2_.pdf' },
            { label: 'Repository', href: 'https://github.com/nhathout/trashformer' }
        ]
    },
    {
        id: 'supertuxsmart',
        title: 'SuperTuxSmart',
        categories: ['ai', 'games'],
        description: 'Optimized pySuperTuxKart racing performance via computer vision + RL. Full write-up included.',
        image: 'assets/opt/supertuxsmart.webp',
        tags: ['Reinforcement learning', 'Computer Vision', 'Python'],
        links: [
            { label: 'Report', href: 'https://github.com/nhathout/EC418-Final-Project/blob/main/FinalReport.pdf' },
            { label: 'Repository', href: 'https://github.com/nhathout/EC418-Final-Project' }
        ]
    },
    {
        id: 'detectron2-attention',
        title: 'Detectron2 Attention Tracker',
        categories: ['ai'],
        description: 'Meta’s Detectron2 reworked for facial attention tracking, blending COCO instance segmentation and custom training.',
        image: 'assets/opt/dl_final_project.webp',
        tags: ['Detectron2', 'PyTorch', 'Segmentation'],
        links: [
            { label: 'Report', href: 'https://docs.google.com/document/d/1jopVcW5oSQAM1AiB77bWeUELJqZ4IWX0DPezHU_gHWk/edit?usp=sharing' },
            { label: 'Repository', href: 'https://github.com/nhathout/AreYoutTrieulyPayingAttentionOrJustJoshingNoahmNotButHilarioIsNET' }
        ]
    },
    {
        id: 'pira',
        title: 'PIRA · Personal Indoor Robot Assistant',
        categories: ['robotics', 'embedded'],
        description: 'Optitrack navigation, WASD teleop, Node.js coordination, and Streamlit visualization for multi-robot control.',
        image: 'assets/opt/pira.webp',
        tags: ['ESP32', 'RTOS', 'OptiTrack', 'Node.js'],
        links: [
            { label: 'Repository', href: 'https://github.com/nhathout/PIRA' }
        ]
    },
    {
        id: 'chatsheets',
        title: 'ChatSheets AI',
        categories: ['ai', 'software'],
        description: 'Upload a CSV, chat through your dataset, and generate SQL/plots in real time.',
        image: 'assets/opt/chatsheets.webp',
        tags: ['LLMs', 'SQLite', 'Python'],
        links: [
            { label: 'Repository', href: 'https://github.com/nhathout/ChatSheetsAI' }
        ]
    },
    {
        id: 'editorial-portfolio',
        title: 'Vol. 1 · Editorial Portfolio',
        categories: ['software'],
        status: 'live',
        description: 'A magazine-style portfolio I designed and built for a Northeastern business & AI-governance student: a cover page with “cover lines” instead of a nav bar, chapter pages, and small interactive touches.',
        image: 'assets/opt/editorial-portfolio.webp',
        details: [
            'Cover-page layout with a masthead, cover lines, and a contents list that doubles as navigation.',
            'Chapter pages with staggered scroll reveals, tilt and flip cards, and ←/→ keyboard paging between chapters.',
            'Plain HTML, CSS, and JavaScript with no build step, deployed to GitHub Pages by a GitHub Actions workflow.'
        ],
        tags: ['HTML', 'CSS', 'JavaScript', 'GitHub Pages'],
        links: [
            { label: 'Live', href: 'https://nhathout.github.io/shunyaweb/' }
        ]
    },
    {
        id: 'mias-portfolio',
        title: 'Mia’s Art Portfolio',
        categories: ['software'],
        status: 'live',
        description: 'Custom site for my sister’s artwork. Live at miasportfolio.art.',
        image: 'assets/opt/mia.webp',
        tags: ['Web design', 'Custom domain'],
        links: [
            { label: 'Live', href: 'https://miasportfolio.art/' },
            { label: 'Repository', href: 'https://github.com/nhathout/mias-portfolio' }
        ]
    },
    {
        id: 'smart-home-api',
        title: 'Smart Home API',
        categories: ['software'],
        description: 'Python API to orchestrate houses, rooms, and devices with strong validation + testing.',
        image: 'assets/opt/smarthome.webp',
        tags: ['Python', 'API design', 'Testing'],
        links: [
            { label: 'Repository', href: 'https://github.com/nhathout/smart-home-api' }
        ]
    },
    {
        id: 'pyp2pchat',
        title: 'PyP2PChat',
        categories: ['software'],
        description: 'Peer-to-peer terminal chat where each node doubles as client/server, racing to establish consensus.',
        image: 'assets/opt/pyp2pchat.webp',
        tags: ['Python', 'Sockets', 'P2P'],
        links: [
            { label: 'Repository', href: 'https://github.com/nhathout/PyP2PChat' }
        ]
    },
    {
        id: 'fitcat',
        title: 'FitCat · Network of Smart Cat Collars',
        categories: ['embedded'],
        description: 'Hardware + cloud dashboard for cat activity monitoring with LoRa and predictive analytics.',
        image: 'assets/opt/fitcat.webp',
        tags: ['LoRa', 'IoT', 'Dashboard'],
        links: [
            { label: 'Repository', href: 'https://github.com/nhathout/Fit-Cat' }
        ]
    },
    {
        id: 'smartpill',
        title: 'SmartPill · Ingestible Sensor',
        categories: ['embedded'],
        description: 'ESP32 ingestible sensor logging biometrics along a simulated digestive tract—proof-of-concept diagnostics.',
        image: 'assets/opt/smartpill.webp',
        tags: ['ESP32', 'Sensors'],
        links: [
            { label: 'Repository', href: 'https://github.com/nhathout/SmartPill-Ingestible-Sensor' }
        ]
    },
    {
        id: 'elect-a-leader',
        title: 'elect-A-leader',
        categories: ['embedded', 'software'],
        description: 'Distributed, fault-tolerant e-voting system with IR fob authentication and leader election.',
        image: 'assets/opt/election.webp',
        tags: ['Distributed systems', 'Leader election', 'IR auth'],
        links: [
            { label: 'Repository', href: 'https://github.com/nhathout/elect-A-leader' }
        ]
    },
    {
        id: 'personal-portfolio',
        title: 'Personal Portfolio',
        categories: ['software', 'games'],
        status: 'live',
        description: 'The site you’re browsing, including a Breakout mini-game with a shared leaderboard and a command palette.',
        image: 'assets/opt/PixelMe.webp',
        pixelated: true,
        tags: ['HTML', 'CSS', 'JavaScript', 'Node.js'],
        links: [
            { label: 'Repository', href: 'https://github.com/nhathout/portfolio' }
        ]
    },
    {
        id: 'huffman',
        title: 'Huffman Code Generator',
        categories: ['software'],
        description: 'C++ encoder/decoder using Huffman trees and priority queues for compression + restore.',
        image: 'assets/opt/huffman.webp',
        tags: ['C++', 'Data structures'],
        links: [
            { label: 'Repository', href: 'https://github.com/nhathout/AppliedAlgorithms/tree/main/huffman-code-generator' }
        ]
    }
];
// Skills now live in skills.js (the pixel inventory).

function isCoarsePointer() {
    return Boolean(coarsePointerMedia?.matches) || 'ontouchstart' in window;
}

// ====================
//  Projects grid, filters + detail dialog
// ====================

const PROJECTS_COLLAPSED_COUNT = 8;
const projectStatusLabels = {
    live: 'Live',
    private: 'Private',
    building: 'In progress'
};
const projectsFiltersEl = document.getElementById('projectsFilters');
const projectsMoreBtn = document.getElementById('projectsMore');
const projectDialog = document.getElementById('projectDialog');
let activeProjectFilter = 'all';
let projectsExpanded = false;
let projectMediaObserver = null;
let dialogProjectList = [];
let dialogProjectIndex = -1;

function prefersReducedMotion() {
    return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
}

function getProjectById(projectId) {
    return projectEntries.find(project => project.id === projectId) || null;
}

function getFilteredProjects(filter = activeProjectFilter) {
    if (filter === 'all') return projectEntries;
    return projectEntries.filter(project => project.categories?.includes(filter));
}

function createProjectAwardText(award) {
    const text = document.createElement('span');
    text.className = 'project-award-text';

    const title = document.createElement('strong');
    title.textContent = award.title;

    const season = document.createElement('small');
    season.textContent = award.season;

    text.appendChild(title);
    text.appendChild(season);

    return text;
}

function createProjectAwardBadge() {
    const badge = document.createElement('div');
    badge.className = 'project-award-badge';
    badge.setAttribute('aria-hidden', 'true');

    const icon = document.createElement('span');
    icon.className = 'project-award-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = `
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 3H16L14.2 10.1C13.8 11.6 12.4 12.6 10.9 12.4L8.3 12L10 3Z" fill="#0F766E"/>
            <path d="M22 3H16L17.8 10.1C18.2 11.6 19.6 12.6 21.1 12.4L23.7 12L22 3Z" fill="#115E59"/>
            <circle cx="16" cy="16" r="8" fill="#FAC123"/>
            <circle cx="16" cy="16" r="5" fill="#FFF3C2"/>
            <path d="M16 12.8L17.3 15.4L20.2 15.8L18.1 17.8L18.6 20.7L16 19.3L13.4 20.7L13.9 17.8L11.8 15.8L14.7 15.4L16 12.8Z" fill="#B45309"/>
        </svg>
    `;

    badge.appendChild(icon);

    return badge;
}

function createProjectAwardNote(award) {
    const note = document.createElement('div');
    note.className = 'project-award-note';
    note.appendChild(createProjectAwardText(award));
    return note;
}

function createProjectUpcomingNote(upcoming) {
    const note = document.createElement('div');
    note.className = 'project-upcoming-note';

    const lock = document.createElement('span');
    lock.className = 'project-upcoming-lock';
    lock.textContent = 'Locked';

    const text = document.createElement('span');
    text.className = 'project-upcoming-text';

    const label = document.createElement('strong');
    label.textContent = upcoming.label;

    const detail = document.createElement('small');
    detail.textContent = upcoming.note;

    text.appendChild(label);
    text.appendChild(detail);
    note.appendChild(lock);
    note.appendChild(text);

    return note;
}

function createProjectStatusPill(status) {
    const label = projectStatusLabels[status];
    if (!label) return null;
    const pill = document.createElement('span');
    pill.className = `project-status project-status--${status}`;
    pill.textContent = label;
    return pill;
}

function createProjectTerminal(project) {
    const art = document.createElement('div');
    art.className = 'project-terminal';
    art.setAttribute('role', 'img');
    art.setAttribute('aria-label', `${project.title}: example morning run log`);

    const bar = document.createElement('div');
    bar.className = 'project-terminal__bar';
    bar.setAttribute('aria-hidden', 'true');
    bar.innerHTML = '<i></i><i></i><i></i>';
    const barLabel = document.createElement('small');
    barLabel.textContent = `${project.title.toLowerCase()} · crew log`;
    bar.appendChild(barLabel);

    const body = document.createElement('div');
    body.className = 'project-terminal__body';
    body.setAttribute('aria-hidden', 'true');
    project.terminal.forEach(([time, message, result], index) => {
        const row = document.createElement('p');
        row.style.setProperty('--line', index);
        const timeEl = document.createElement('span');
        timeEl.className = 'project-terminal__time';
        timeEl.textContent = time ? `[${time}]` : '>';
        const messageEl = document.createElement('span');
        messageEl.className = 'project-terminal__msg';
        messageEl.textContent = message;
        const resultEl = document.createElement('span');
        resultEl.className = 'project-terminal__result';
        resultEl.textContent = result;
        row.append(timeEl, messageEl, resultEl);
        body.appendChild(row);
    });

    art.append(bar, body);
    return art;
}

function createProjectVideo(project, { inDialog = false } = {}) {
    const video = document.createElement('video');
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('aria-label', `${project.title} demo clip`);
    if (project.poster) video.poster = project.poster;

    if (inDialog) {
        video.src = project.video;
        video.preload = 'auto';
        if (prefersReducedMotion()) {
            video.controls = true;
        } else {
            video.autoplay = true;
        }
        return video;
    }

    // grid clips load + play only while they are on screen
    video.preload = 'none';
    video.dataset.src = project.video;
    observeProjectVideo(video);
    return video;
}

function observeProjectVideo(video) {
    if (prefersReducedMotion()) return;
    if (!('IntersectionObserver' in window)) {
        video.src = video.dataset.src;
        video.play?.().catch(() => {});
        return;
    }
    if (!projectMediaObserver) {
        projectMediaObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                const clip = entry.target;
                if (entry.isIntersecting) {
                    if (!clip.getAttribute('src') && clip.dataset.src) {
                        clip.src = clip.dataset.src;
                    }
                    clip.play?.().catch(() => {});
                } else if (!clip.paused) {
                    clip.pause();
                }
            });
        }, { rootMargin: '160px 0px', threshold: 0.15 });
    }
    projectMediaObserver.observe(video);
}

function createProjectMedia(project, { inDialog = false } = {}) {
    const media = document.createElement('div');
    media.className = 'project-media';

    if (project.upcoming) {
        media.classList.add('project-media--placeholder');

        const lockBadge = document.createElement('span');
        lockBadge.className = 'project-lock-badge';
        lockBadge.textContent = 'Locked';

        const mark = document.createElement('span');
        mark.className = 'project-placeholder-mark';
        mark.setAttribute('aria-hidden', 'true');
        mark.textContent = (project.upcoming.placeholderMark || '?').toUpperCase();

        const label = document.createElement('span');
        label.className = 'project-placeholder-label';
        label.textContent = project.upcoming.label;

        media.appendChild(lockBadge);
        media.appendChild(mark);
        media.appendChild(label);

        return media;
    }

    if (project.terminal) {
        media.classList.add('project-media--terminal');
        media.appendChild(createProjectTerminal(project));
    } else if (project.video) {
        media.appendChild(createProjectVideo(project, { inDialog }));
    } else if (project.image) {
        const img = document.createElement('img');
        img.src = project.image;
        img.alt = project.title;
        img.decoding = 'async';
        if (!inDialog) img.loading = 'lazy';
        if (project.pixelated) img.classList.add('is-pixelated');
        media.appendChild(img);
    }

    const status = createProjectStatusPill(project.status);
    if (status) media.appendChild(status);

    if (project.award) {
        media.appendChild(createProjectAwardBadge());
    }

    return media;
}

function createProjectTags(tags, className = 'project-tags') {
    const list = document.createElement('ul');
    list.className = className;
    list.setAttribute('aria-label', 'Tech');
    tags.forEach(tag => {
        const item = document.createElement('li');
        item.textContent = tag;
        list.appendChild(item);
    });
    return list;
}

function createProjectLinks(project) {
    const linksContainer = document.createElement('div');
    linksContainer.className = 'project-links';

    (project.links || []).forEach(link => {
        const anchor = document.createElement('a');
        anchor.href = link.href;
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
        anchor.textContent = `${link.label} ↗`;
        linksContainer.appendChild(anchor);
    });

    return linksContainer;
}

function createProjectCard(project, index) {
    const card = document.createElement('article');
    card.className = 'project-card';
    card.dataset.projectId = project.id;
    card.style.setProperty('--card-index', index);
    if (project.award) {
        card.classList.add('project-card--awarded');
    }
    if (project.upcoming) {
        card.classList.add('project-card--upcoming');
    }
    const media = createProjectMedia(project);

    const content = document.createElement('div');
    content.className = 'project-content';
    const title = document.createElement('h3');
    const titleButton = document.createElement('button');
    titleButton.type = 'button';
    titleButton.className = 'project-title-btn';
    titleButton.dataset.projectOpen = project.id;
    titleButton.setAttribute('aria-haspopup', 'dialog');
    titleButton.textContent = project.title;
    title.appendChild(titleButton);
    const description = document.createElement('p');
    description.textContent = project.description;

    content.appendChild(title);
    if (project.subtitle) {
        const subtitle = document.createElement('p');
        subtitle.className = 'project-subtitle';
        subtitle.textContent = project.subtitle;
        content.appendChild(subtitle);
    }
    if (project.award) {
        content.appendChild(createProjectAwardNote(project.award));
    }
    if (project.upcoming) {
        content.appendChild(createProjectUpcomingNote(project.upcoming));
    }
    content.appendChild(description);
    if (project.tags?.length) {
        content.appendChild(createProjectTags(project.tags.slice(0, 4)));
    }
    if (project.links?.length) {
        content.appendChild(createProjectLinks(project));
    }

    const expandHint = document.createElement('span');
    expandHint.className = 'project-expand-hint';
    expandHint.setAttribute('aria-hidden', 'true');
    expandHint.textContent = project.upcoming ? 'Peek' : 'Details';
    media.appendChild(expandHint);

    card.appendChild(media);
    card.appendChild(content);
    return card;
}

function buildProjectFilters() {
    if (!projectsFiltersEl) return;
    projectsFiltersEl.innerHTML = '';
    projectCategories.forEach(category => {
        const count = getFilteredProjects(category.id).length;
        if (!count) return;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'projects-filter';
        button.dataset.filter = category.id;
        button.setAttribute('aria-pressed', String(category.id === activeProjectFilter));
        button.classList.toggle('is-active', category.id === activeProjectFilter);
        button.innerHTML = '<span></span><small></small>';
        button.firstChild.textContent = category.label;
        button.lastChild.textContent = String(count);
        button.addEventListener('click', () => setProjectFilter(category.id));
        projectsFiltersEl.appendChild(button);
    });
}

function setProjectFilter(filter) {
    if (filter === activeProjectFilter) return;
    activeProjectFilter = filter;
    projectsFiltersEl?.querySelectorAll('.projects-filter').forEach(button => {
        const isActive = button.dataset.filter === filter;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
    });
    buildProjectsGrid();
}

function buildProjectsGrid() {
    if (!projectsGrid) return;
    projectMediaObserver?.disconnect();
    projectsGrid.innerHTML = '';

    const filtered = getFilteredProjects();
    const collapsible = activeProjectFilter === 'all' && filtered.length > PROJECTS_COLLAPSED_COUNT;
    const visible = collapsible && !projectsExpanded ? filtered.slice(0, PROJECTS_COLLAPSED_COUNT) : filtered;

    const fragment = document.createDocumentFragment();
    visible.forEach((project, index) => fragment.appendChild(createProjectCard(project, index)));
    projectsGrid.appendChild(fragment);

    if (projectsMoreBtn) {
        projectsMoreBtn.hidden = !collapsible;
        projectsMoreBtn.setAttribute('aria-expanded', String(projectsExpanded));
        projectsMoreBtn.textContent = projectsExpanded
            ? 'Show fewer projects'
            : `Show all ${filtered.length} projects`;
    }
}

function initProjectsSection() {
    buildProjectFilters();
    buildProjectsGrid();

    projectsMoreBtn?.addEventListener('click', () => {
        const wasExpanded = projectsExpanded;
        projectsExpanded = !projectsExpanded;
        buildProjectsGrid();
        if (wasExpanded) {
            scrollToSection('projectsGridAnchor');
        } else {
            projectsGrid.children[PROJECTS_COLLAPSED_COUNT]?.querySelector('[data-project-open]')?.focus({ preventScroll: true });
        }
    });

    // the whole card opens the detail dialog; real links/buttons inside keep their own behavior
    projectsGrid?.addEventListener('click', event => {
        const opener = event.target.closest('[data-project-open]');
        if (opener) {
            openProjectDialog(opener.dataset.projectOpen, { list: getFilteredProjects() });
            return;
        }
        if (event.target.closest('a, button')) return;
        const card = event.target.closest('.project-card');
        if (card?.dataset.projectId) {
            openProjectDialog(card.dataset.projectId, { list: getFilteredProjects() });
        }
    });

    initProjectDialog();
}

function renderProjectDialog(project) {
    if (!projectDialog || !project) return;
    const mediaSlot = projectDialog.querySelector('[data-dialog-media]');
    const kicker = projectDialog.querySelector('[data-dialog-kicker]');
    const title = projectDialog.querySelector('[data-dialog-title]');
    const subtitle = projectDialog.querySelector('[data-dialog-subtitle]');
    const notes = projectDialog.querySelector('[data-dialog-notes]');
    const description = projectDialog.querySelector('[data-dialog-description]');
    const details = projectDialog.querySelector('[data-dialog-details]');
    const tagsSlot = projectDialog.querySelector('[data-dialog-tags]');
    const linksSlot = projectDialog.querySelector('[data-dialog-links]');
    const counter = projectDialog.querySelector('[data-dialog-counter]');

    mediaSlot.querySelectorAll('video').forEach(video => video.pause());
    mediaSlot.innerHTML = '';
    mediaSlot.appendChild(createProjectMedia(project, { inDialog: true }));

    const categoryLabels = (project.categories || [])
        .map(id => projectCategories.find(category => category.id === id)?.label)
        .filter(Boolean);
    const statusLabel = project.upcoming ? 'Locked' : projectStatusLabels[project.status];
    kicker.textContent = [statusLabel, ...categoryLabels].filter(Boolean).join(' · ');
    title.textContent = project.title;
    subtitle.textContent = project.subtitle || '';
    subtitle.hidden = !project.subtitle;

    notes.innerHTML = '';
    if (project.award) notes.appendChild(createProjectAwardNote(project.award));
    if (project.upcoming) notes.appendChild(createProjectUpcomingNote(project.upcoming));
    notes.hidden = !notes.childElementCount;

    description.textContent = project.description;

    details.innerHTML = '';
    (project.details || []).forEach(point => {
        const item = document.createElement('li');
        item.textContent = point;
        details.appendChild(item);
    });
    details.hidden = !details.childElementCount;

    tagsSlot.innerHTML = '';
    if (project.tags?.length) tagsSlot.appendChild(createProjectTags(project.tags));

    linksSlot.innerHTML = '';
    if (project.links?.length) {
        linksSlot.appendChild(createProjectLinks(project));
    } else if (!project.upcoming) {
        const note = document.createElement('p');
        note.className = 'project-dialog__private-note';
        note.textContent = 'Private repository. Happy to walk through it in a conversation.';
        linksSlot.appendChild(note);
    }

    if (counter) {
        counter.textContent = dialogProjectList.length > 1
            ? `${dialogProjectIndex + 1} / ${dialogProjectList.length}`
            : '';
    }
    projectDialog.querySelector('.project-dialog__scroll')?.scrollTo({ top: 0 });
}

function openProjectDialog(projectId, { list } = {}) {
    const project = getProjectById(projectId);
    if (!project || !projectDialog) return;
    dialogProjectList = (list && list.some(entry => entry.id === projectId)) ? list : projectEntries;
    dialogProjectIndex = dialogProjectList.findIndex(entry => entry.id === projectId);
    renderProjectDialog(project);
    if (!projectDialog.open) {
        if (typeof projectDialog.showModal === 'function') {
            projectDialog.showModal();
        } else {
            projectDialog.setAttribute('open', '');
        }
        document.documentElement.classList.add('dialog-open');
    }
}

function stepProjectDialog(direction) {
    if (!dialogProjectList.length) return;
    dialogProjectIndex = (dialogProjectIndex + direction + dialogProjectList.length) % dialogProjectList.length;
    renderProjectDialog(dialogProjectList[dialogProjectIndex]);
}

function closeProjectDialog() {
    if (!projectDialog?.open) return;
    if (typeof projectDialog.close === 'function') {
        projectDialog.close();
    } else {
        projectDialog.removeAttribute('open');
        projectDialog.dispatchEvent(new Event('close'));
    }
}

function initProjectDialog() {
    if (!projectDialog) return;
    projectDialog.addEventListener('close', () => {
        projectDialog.querySelectorAll('video').forEach(video => video.pause());
        projectDialog.querySelector('[data-dialog-media]').innerHTML = '';
        if (!document.querySelector('dialog[open]')) {
            document.documentElement.classList.remove('dialog-open');
        }
    });
    // clicks on the backdrop land on the <dialog> element itself
    projectDialog.addEventListener('click', event => {
        if (event.target === projectDialog) closeProjectDialog();
    });
    projectDialog.querySelectorAll('[data-dialog-close]').forEach(button => {
        button.addEventListener('click', closeProjectDialog);
    });
    projectDialog.querySelector('[data-dialog-prev]')?.addEventListener('click', () => stepProjectDialog(-1));
    projectDialog.querySelector('[data-dialog-next]')?.addEventListener('click', () => stepProjectDialog(1));
    projectDialog.addEventListener('keydown', event => {
        if (event.target.closest('input, textarea')) return;
        if (event.key === 'ArrowRight') {
            event.preventDefault();
            stepProjectDialog(1);
        } else if (event.key === 'ArrowLeft') {
            event.preventDefault();
            stepProjectDialog(-1);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initCopyrightYear();
    initEdexSection();
    initProjectsSection();
    initResumePopover();
});

// The Atari [Course]out mini-game lives in game.js.
