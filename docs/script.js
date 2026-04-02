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
    { id: 'skills', label: '/ skills' },
    { id: 'education-experience', label: '/ edex' },
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

// ====================
//  Skills Grid (3D cubes)
// ====================

const skillFaces = ['front', 'back', 'right', 'left', 'top', 'bottom'];
const projectEntries = [
    {
        title: "Master's Thesis",
        description: 'Current thesis work. Final title, visuals, summary, and links unlock once the project is complete.',
        upcoming: {
            label: 'Thesis in progress',
            note: 'This block stays locked until the thesis is finished.',
            placeholderMark: '?'
        },
        links: []
    },
    {
        title: 'TrashformerPro',
        description: 'Next-stage smart waste-sorting system currently under active development. Full visuals and write-up unlock after the project is complete.',
        upcoming: {
            label: 'Build in progress',
            note: 'The repo is public now; the rest stays locked until release.',
            placeholderMark: 'TFP'
        },
        links: [
            { label: 'Repository', href: 'https://github.com/nhathout/TrashformerPro' }
        ]
    },
    {
        title: 'BROS2',
        description: 'Electron desktop app to visually compose ROS 2 graphs, auto-generate packages/launch files, and run them in a managed Docker workspace with live introspection.',
        image: 'assets/clips/ec601-demo-HD720p-ezgif.com-video-speed.mov',
        award: {
            title: 'BU Best Project Award',
            season: 'Fall 2025'
        },
        links: [
            { label: 'Repository', href: 'https://github.com/nhathout/BROS2' }
        ]
    },
    {
        title: 'PixelPose',
        description: 'Camera pose regression research project currently in proposal stage. Final summary, media, and results unlock once the work is ready to publish.',
        upcoming: {
            label: 'Proposal stage',
            note: 'The concept is set; public details stay locked for now.',
            placeholderMark: 'POSE'
        },
        links: []
    },
    {
        title: 'TiltGolf',
        description: 'Tilt-controlled mini golf on BeagleBone Black; IMU driver streams tilt to a Qt arcade UI with real-time physics.',
        image: 'assets/clips/TiltGolfFinalProjectofEC535BostonUniversity_Open-SourceIMUMiniGolfonBeagleBone-ezgif.com-speed.gif',
        links: [
            { label: 'Report', href: 'https://github.com/nhathout/TiltGolf/blob/main/tiltgolf-final-report.pdf' },
            { label: 'Repository', href: 'https://github.com/nhathout/TiltGolf' }
        ]
    },
    {
        title: 'Trashformer',
        description: 'Open-source 3D-printed tabletop sorting arm with vision-driven classification and trajectory planning to sort waste.',
        image: 'assets/images/trashformer.png',
        links: [
            { label: 'Report', href: 'assets/files/EK505_Transformer_Final_Report__2_.pdf' },
            { label: 'Repository', href: 'https://github.com/nhathout/trashformer' }
        ]
    },
    {
        title: 'Pollux',
        description: 'An autonomous countertop-cleaning robot with reinforcement learning to avoid cliffs and obstacles.',
        image: 'assets/clips/pollux.gif',
        links: [
            { label: 'Repository', href: 'https://github.com/nhathout/pollux-AMR' }
        ]
    },
    {
        title: 'SuperTuxSmart',
        description: 'Optimized pySuperTuxKart racing performance via computer vision + RL. Full write-up included.',
        image: 'assets/images/supertuxsmart.png',
        links: [
            { label: 'Report', href: 'https://github.com/nhathout/EC418-Final-Project/blob/main/FinalReport.pdf' },
            { label: 'Repository', href: 'https://github.com/nhathout/EC418-Final-Project' }
        ]
    },
    {
        title: 'Detectron2 Attention Tracker',
        description: 'Meta’s Detectron2 reworked for facial attention tracking, blending COCO instance segmentation and custom training.',
        image: 'assets/images/dl_final_project.png',
        links: [
            { label: 'Report', href: 'https://docs.google.com/document/d/1jopVcW5oSQAM1AiB77bWeUELJqZ4IWX0DPezHU_gHWk/edit?usp=sharing' },
            { label: 'Repository', href: 'https://github.com/nhathout/AreYoutTrieulyPayingAttentionOrJustJoshingNoahmNotButHilarioIsNET' }
        ]
    },
    {
        title: 'Smart Home API',
        description: 'Python API to orchestrate houses, rooms, and devices with strong validation + testing.',
        image: 'assets/images/smarthome.png',
        links: [
            { label: 'Repository', href: 'https://github.com/nhathout/smart-home-api' }
        ]
    },
    {
        title: 'PIRA · Personal Indoor Robot Assistant',
        description: 'Optitrack navigation, WASD teleop, Node.js coordination, and Streamlit visualization for multi-robot control.',
        image: 'assets/images/pira.png',
        links: [
            { label: 'Repository', href: 'https://github.com/nhathout/PIRA' }
        ]
    },
    {
        title: 'ChatSheets AI',
        description: 'Upload a CSV, chat through your dataset, and generate SQL/plots in real time.',
        image: 'assets/images/chatsheets.png',
        links: [
            { label: 'Repository', href: 'https://github.com/nhathout/ChatSheetsAI' }
        ]
    },
    {
        title: 'PyP2PChat',
        description: 'Peer-to-peer terminal chat where each node doubles as client/server, racing to establish consensus.',
        image: 'assets/images/pyp2pchat.png',
        links: [
            { label: 'Repository', href: 'https://github.com/nhathout/PyP2PChat' }
        ]
    },
    {
        title: 'FitCat · Network of Smart Cat Collars',
        description: 'Hardware + cloud dashboard for cat activity monitoring with LoRa and predictive analytics.',
        image: 'assets/images/fitcat.png',
        links: [
            { label: 'Repository', href: 'https://github.com/nhathout/Fit-Cat' }
        ]
    },
    {
        title: 'SmartPill · Ingestible Sensor',
        description: 'ESP32 ingestible sensor logging biometrics along a simulated digestive tract—proof-of-concept diagnostics.',
        image: 'assets/images/smartpill.png',
        links: [
            { label: 'Repository', href: 'https://github.com/nhathout/SmartPill-Ingestible-Sensor' }
        ]
    },
    {
        title: 'elect-A-leader',
        description: 'Distributed, fault-tolerant e-voting system with IR fob authentication and leader election.',
        image: 'assets/images/election.png',
        links: [
            { label: 'Repository', href: 'https://github.com/nhathout/elect-A-leader' }
        ]
    },
    {
        title: 'Personal Portfolio',
        description: 'The site you’re browsing.',
        image: 'assets/images/PixelMe.jpg',
        links: [
            { label: 'Repository', href: 'https://github.com/nhathout/portfolio' }
        ]
    },
    {
        title: 'Mia’s Art Portfolio',
        description: 'Custom site for my sister’s artwork. Live at miasportfolio.art.',
        image: 'assets/images/mia.png',
        links: [
            { label: 'Live', href: 'https://miasportfolio.art/' },
            { label: 'Repository', href: 'https://github.com/nhathout/mias-portfolio' }
        ]
    },
    {
        title: 'Huffman Code Generator',
        description: 'C++ encoder/decoder using Huffman trees and priority queues for compression + restore.',
        image: 'assets/images/huffman.png',
        links: [
            { label: 'Repository', href: 'https://github.com/nhathout/AppliedAlgorithms/tree/main/huffman-code-generator' }
        ]
    }
];
const skillCategories = [
    { id: 'software', label: 'Programming & AI' },
    { id: 'hardware', label: 'Embedded & Robotics' },
    { id: 'platforms', label: 'Platforms & Operating Systems' }
];
const skillsData = [
    { name: 'Python', category: 'software', href: 'https://www.python.org/', img: 'assets/images/python_logo.png' },
    { name: 'C', category: 'software', href: 'https://en.cppreference.com/w/c', img: 'assets/images/c_logo.png' },
    { name: 'C++', category: 'software', href: 'https://isocpp.org/', img: 'assets/images/cplus_logo.png' },
    { name: 'C#', category: 'software', href: 'https://dotnet.microsoft.com/en-us/languages/csharp', img: 'assets/images/csharp_logo.png' },
    { name: 'TensorFlow', category: 'software', href: 'https://www.tensorflow.org/', img: 'assets/images/tensorflow.png' },
    { name: 'PyTorch', category: 'software', href: 'https://pytorch.org/', img: 'assets/images/pytorch.png' },
    { name: 'MATLAB', category: 'software', href: 'https://www.mathworks.com/products/matlab.html', img: 'assets/images/matlab.png' },
    { name: 'JavaScript', category: 'software', href: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript', img: 'assets/images/javascript.png' },
    { name: 'SQLite', category: 'software', href: 'https://sqlite.org/', img: 'assets/images/sqlite_logo.png' },
    { name: 'FastAPI', category: 'software', href: 'https://fastapi.tiangolo.com/', img: 'assets/images/fastapi_logo.png' },
    { name: 'HTML', category: 'software', href: 'https://developer.mozilla.org/en-US/docs/Web/HTML', img: 'assets/images/html_logo.png' },
    { name: 'CSS', category: 'software', href: 'https://developer.mozilla.org/en-US/docs/Web/CSS', img: 'assets/images/css_logo.png' },
    { name: 'Java', category: 'software', href: 'https://www.java.com/', img: 'assets/images/java_logo.png' },
    { name: 'Arduino', category: 'hardware', href: 'https://www.arduino.cc/', img: 'assets/images/arduino.png' },
    { name: 'Raspberry Pi', category: 'hardware', href: 'https://www.raspberrypi.org/', img: 'assets/images/raspi_logo.png' },
    { name: 'Espressif (ESP)', category: 'hardware', href: 'https://www.espressif.com/', img: 'assets/images/espressif.png' },
    { name: 'NVIDIA', category: 'hardware', href: 'https://learn.nvidia.com/courses/course-detail?course_id=course-v1:DLI+S-FX-01+V1', img: 'assets/images/nvidia.png' },
    { name: 'Universal Robots', category: 'hardware', href: 'https://www.universal-robots.com/', img: 'assets/images/ur_logo.png' },
    { name: 'ROS', category: 'hardware', href: 'https://www.ros.org/', img: 'assets/images/ros1_logo.png' },
    { name: 'ROS2', category: 'hardware', href: 'https://www.ros.org/', img: 'assets/images/ros_logo.png' },
    { name: 'Intel', category: 'hardware', href: 'https://www.intelrealsense.com/sdk-2/', img: 'assets/images/intel_logo.png' },
    { name: 'Orbbec', category: 'hardware', href: 'https://www.orbbec.com/developers/orbbec-sdk/', img: 'assets/images/orbbec_logo.png' },
    { name: 'BeagleBone', category: 'hardware', href: 'https://www.beagleboard.org/', img: 'assets/images/beaglebone_logo.png' },
    { name: 'GitHub', category: 'platforms', href: 'https://github.com/nhathout', img: 'assets/images/github_logo.png' },
    { name: 'Git', category: 'platforms', href: 'https://git-scm.com/', img: 'assets/images/git_logo.png' },
    { name: 'Docker', category: 'platforms', href: 'https://www.docker.com/', img: 'assets/images/docker_logo.png' },
    { name: 'Onshape', category: 'platforms', href: 'https://www.onshape.com/', img: 'assets/images/onshape.png' },
    { name: 'Bambu Lab', category: 'platforms', href: 'https://bambulab.com/en-us', img: 'assets/images/bambulablogo.png' },
    { name: 'Ubuntu', category: 'platforms', href: 'https://ubuntu.com/', img: 'assets/images/ubuntu_logo.png' },
    { name: 'Unreal Engine 5', category: 'platforms', href: 'https://www.unrealengine.com/en-US/unreal-engine-5', img: 'assets/images/ur5.png' },
    { name: 'Windows', category: 'platforms', href: 'https://www.microsoft.com/windows', img: 'assets/images/windows_logo.png' },
    { name: 'macOS', category: 'platforms', href: 'https://www.apple.com/macos/', img: 'assets/images/macos_logo.png' },
    { name: 'Linux', category: 'platforms', href: 'https://www.kernel.org/', img: 'assets/images/linux_logo.png' }
];

let activeSkillCategoryIndex = 0;
let skillsGridEl;
let skillsTabsEl;
let skillsActiveLabelEl;
let skillsPrevBtn;
let skillsNextBtn;
let skillTabButtons = [];
let skillsWheelLock = 0;
let skillsAutoCycleTimer;
let skillPreviewLink = null;
let skillPreviewTimer = null;
let skillPreviewHandlersBound = false;

function isCoarsePointer() {
    return Boolean(coarsePointerMedia?.matches) || 'ontouchstart' in window;
}

function setSkillPreview(link) {
    if (!link) return;
    if (skillPreviewLink === link) {
        resetSkillPreviewTimer();
        return;
    }
    clearSkillPreview();
    skillPreviewLink = link;
    link.classList.add('is-preview');
    resetSkillPreviewTimer();
}

function resetSkillPreviewTimer() {
    if (skillPreviewTimer) {
        clearTimeout(skillPreviewTimer);
    }
    if (!skillPreviewLink) return;
    skillPreviewTimer = window.setTimeout(() => {
        clearSkillPreview();
    }, 5000);
}

function clearSkillPreview() {
    if (skillPreviewLink) {
        skillPreviewLink.classList.remove('is-preview');
        skillPreviewLink = null;
    }
    if (skillPreviewTimer) {
        clearTimeout(skillPreviewTimer);
        skillPreviewTimer = null;
    }
}

function handleSkillLinkPreview(event) {
    if (!isCoarsePointer()) return;
    const link = event.target.closest('.skill-link');
    if (!link) return;
    if (!link.classList.contains('is-preview')) {
        event.preventDefault();
        setSkillPreview(link);
    } else {
        clearSkillPreview();
    }
}

function handleOutsideSkillClick(event) {
    if (!skillPreviewLink) return;
    const clickedLink = event.target.closest('.skill-link');
    if (clickedLink === skillPreviewLink) return;
    clearSkillPreview();
}

function handleSkillScrollClear() {
    if (!skillPreviewLink || !isCoarsePointer()) return;
    clearSkillPreview();
}

function initSkillLinkPreviewHandling() {
    if (!skillsGridEl || skillPreviewHandlersBound) return;
    skillsGridEl.addEventListener('click', handleSkillLinkPreview);
    document.addEventListener('click', handleOutsideSkillClick);
    window.addEventListener('scroll', handleSkillScrollClear, { passive: true });
    skillPreviewHandlersBound = true;
}

if (coarsePointerMedia) {
    const pointerChangeHandler = event => {
        if (!event.matches) {
            clearSkillPreview();
        }
    };
    if (typeof coarsePointerMedia.addEventListener === 'function') {
        coarsePointerMedia.addEventListener('change', pointerChangeHandler);
    } else if (typeof coarsePointerMedia.addListener === 'function') {
        coarsePointerMedia.addListener(pointerChangeHandler);
    }
}

function initSkillsSection() {
    skillsGridEl = document.getElementById('skillsGrid');
    skillsTabsEl = document.getElementById('skillsTabs');
    skillsActiveLabelEl = document.getElementById('skillsActiveLabel');
    skillsPrevBtn = document.getElementById('skillsPrev');
    skillsNextBtn = document.getElementById('skillsNext');

    if (!skillsGridEl || !skillsTabsEl) return;

    initSkillLinkPreviewHandling();
    buildSkillsTabs();
    renderSkillsGrid(skillCategories[activeSkillCategoryIndex].id);
    updateSkillsNav();

    skillsPrevBtn?.addEventListener('click', () => {
        cycleSkillCategory(-1);
        restartSkillsAutoCycle();
    });
    skillsNextBtn?.addEventListener('click', () => {
        cycleSkillCategory(1);
        restartSkillsAutoCycle();
    });
    skillsGridEl.addEventListener('wheel', event => {
        handleSkillsWheel(event);
        restartSkillsAutoCycle();
    }, { passive: false });
}

function buildSkillsTabs() {
    skillsTabsEl.innerHTML = '';
    skillTabButtons = [];

    skillCategories.forEach((category, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'skills-tab';
        button.textContent = category.label;
        button.addEventListener('click', () => setSkillCategory(index));
        skillsTabsEl.appendChild(button);
        skillTabButtons.push(button);
    });
}

function renderSkillsGrid(categoryId) {
    if (!skillsGridEl) return;
    clearSkillPreview();
    skillsGridEl.innerHTML = '';

    const fragment = document.createDocumentFragment();
    skillsData
        .filter(skill => skill.category === categoryId)
        .forEach(skill => {
            const wrapper = document.createElement('div');
            wrapper.className = 'flex justify-center';

            const link = document.createElement('a');
            link.href = skill.href;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.className = 'skill-link';
            link.setAttribute('aria-label', skill.name);
            link.title = skill.name;

            const cube = document.createElement('div');
            cube.className = 'skill-cube';

            skillFaces.forEach(face => {
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

            link.appendChild(cube);
            link.appendChild(label);
            wrapper.appendChild(link);
            fragment.appendChild(wrapper);
        });

    skillsGridEl.appendChild(fragment);
}

function setSkillCategory(nextIndex, { animate = true } = {}) {
    if (!skillCategories.length) return;
    const normalizedIndex = (nextIndex + skillCategories.length) % skillCategories.length;
    if (normalizedIndex === activeSkillCategoryIndex) return;

    const updateCategory = () => {
        activeSkillCategoryIndex = normalizedIndex;
        renderSkillsGrid(skillCategories[activeSkillCategoryIndex].id);
        updateSkillsNav();
    };

    if (!animate || !skillsGridEl) {
        updateCategory();
        return;
    }

    skillsGridEl.classList.add('skills-grid--exit');
    setTimeout(() => {
        updateCategory();
        skillsGridEl.classList.remove('skills-grid--exit');
        skillsGridEl.classList.add('skills-grid--enter');
        setTimeout(() => skillsGridEl.classList.remove('skills-grid--enter'), 400);
    }, 200);
}

function cycleSkillCategory(direction) {
    setSkillCategory(activeSkillCategoryIndex + direction);
}

function updateSkillsNav() {
    if (skillsActiveLabelEl) {
        skillsActiveLabelEl.textContent = skillCategories[activeSkillCategoryIndex].label;
    }
    skillTabButtons.forEach((btn, index) => {
        btn.classList.toggle('is-active', index === activeSkillCategoryIndex);
    });
}

function handleSkillsWheel(event) {
    if (!skillsGridEl) return;
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
    if (Math.abs(event.deltaX) < 15) return;
    const now = Date.now();
    if (now - skillsWheelLock < 600) return;
    event.preventDefault();
    cycleSkillCategory(event.deltaX > 0 ? 1 : -1);
    skillsWheelLock = now;
}

function restartSkillsAutoCycle() {
    if (skillsAutoCycleTimer) clearInterval(skillsAutoCycleTimer);
    skillsAutoCycleTimer = setInterval(() => cycleSkillCategory(1), 20000);
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

function createProjectMedia(project) {
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

    const isVideo = project.image && /\.(mp4|mov|webm)$/i.test(project.image);
    if (isVideo) {
        const video = document.createElement('video');
        video.src = project.image;
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.setAttribute('aria-label', project.title);
        media.appendChild(video);
    } else if (project.image) {
        const img = document.createElement('img');
        img.src = project.image;
        img.alt = project.title;
        media.appendChild(img);
    }

    if (project.award) {
        media.appendChild(createProjectAwardBadge());
    }

    return media;
}

function buildProjectsGrid() {
    if (!projectsGrid) return;
    projectsGrid.innerHTML = '';
    const fragment = document.createDocumentFragment();
    projectEntries.forEach(project => {
        const card = document.createElement('article');
        card.className = 'project-card';
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
        title.textContent = project.title;
        const description = document.createElement('p');
        description.textContent = project.description;

        const linksContainer = document.createElement('div');
        linksContainer.className = 'project-links';
        project.links.forEach(link => {
            const anchor = document.createElement('a');
            anchor.href = link.href;
            anchor.target = '_blank';
            anchor.rel = 'noopener noreferrer';
            anchor.textContent = `${link.label} ↗`;
            linksContainer.appendChild(anchor);
        });

        content.appendChild(title);
        if (project.award) {
            content.appendChild(createProjectAwardNote(project.award));
        }
        if (project.upcoming) {
            content.appendChild(createProjectUpcomingNote(project.upcoming));
        }
        content.appendChild(description);
        if (project.links?.length) {
            content.appendChild(linksContainer);
        }

        card.appendChild(media);
        card.appendChild(content);
        fragment.appendChild(card);
    });
    projectsGrid.appendChild(fragment);
}

document.addEventListener('DOMContentLoaded', () => {
    initCopyrightYear();
    initEdexSection();
    initSkillsSection();
    restartSkillsAutoCycle();
    buildProjectsGrid();
    initResumePopover();
});

(() => {
// ====================
//  Breakout Game Vars
// ====================

const startBtn = document.getElementById('startBtn');
const resetLeaderboardBtn = document.getElementById('resetLeaderboardBtn'); 
const gameCanvas = document.getElementById('gameCanvas');
const startScreen = document.getElementById('start-screen');
const leaderboardEl = document.getElementById('leaderboard');

const isCoarsePointer = coarsePointerMedia?.matches;

if (!startBtn || !resetLeaderboardBtn || !gameCanvas || !startScreen || !leaderboardEl || isCoarsePointer) {
    return;
}

window.addEventListener('load', loadLeaderboardFromServer);

resetLeaderboardBtn.addEventListener('click', resetLeaderboard);
const ctx = gameCanvas.getContext('2d');
const GAME_WIDTH = 680;
const GAME_HEIGHT = 400;

function configureGameCanvas() {
    const dpr = window.devicePixelRatio || 1;
    gameCanvas.width = Math.round(GAME_WIDTH * dpr);
    gameCanvas.height = Math.round(GAME_HEIGHT * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
}

configureGameCanvas();
window.addEventListener('resize', configureGameCanvas);

let score = 0;
let lives = 2;

// Shared leaderboard array loaded from server
let leaderboard = [];

// Game states
let isGameOver = false;
let isPaused = false;
let isNotStarted = true;  // Ball not launched yet, attached to paddle
let isLaunched = false;   // Ball launched after space press

// Game settings
const paddleHeight = 18;
const paddleWidth = 108;
const paddleBottomOffset = 18;
let paddleX = (GAME_WIDTH - paddleWidth) / 2;
let rightPressed = false;
let leftPressed = false;
const paddleSpeed = 9;

const ballRadius = 9;
const initialVelocity = { x: 2.8, y: -3.4 };
let x = GAME_WIDTH / 2;
let y = getPaddleY() - ballRadius - 32;
let dx = initialVelocity.x;
let dy = initialVelocity.y;

const courseDeck = [
    { title: 'Vis, Rob & Plan', code: 'SE740', tone: '#0f766e', fill: '#dff7f1' },
    { title: 'Intro to R&AS', code: 'EK505', tone: '#0f766e', fill: '#ddf5ef' },
    { title: 'Product Design in ECE', code: 'EC601', tone: '#b45309', fill: '#fff0d9' },
    { title: 'Image/Video Computing', code: 'CS585', tone: '#2563eb', fill: '#e1efff' },
    { title: 'Smart/Embedded Systems', code: 'EC444/535', tone: '#7c3aed', fill: '#f0e8ff' },
    { title: 'Robot Learning', code: 'EC518', tone: '#0f766e', fill: '#dff7f1' },
    { title: 'M.S. Thesis', code: 'ME954', tone: '#be123c', fill: '#ffe4ea' },
    { title: 'ML', code: 'EC414', tone: '#1d4ed8', fill: '#e2ecff' },
    { title: 'DL', code: 'EC523', tone: '#0f766e', fill: '#dff7f1' },
    { title: 'RL', code: 'EC418', tone: '#b45309', fill: '#fff0d9' }
];
const activeBrickCount = courseDeck.length;
const brickColumnCount = 5;
const brickRowCount = Math.ceil(activeBrickCount / brickColumnCount);
const brickPadding = 12;
const brickOffsetTop = 58;
const brickOffsetLeft = 18;
const brickHeight = 68;
const brickWidth = Math.floor((GAME_WIDTH - (brickOffsetLeft * 2) - (brickPadding * (brickColumnCount - 1))) / brickColumnCount);
const gameBoardTheme = {
    backgroundTop: '#f8fbfb',
    backgroundBottom: '#dff1ed',
    grid: 'rgba(15, 118, 110, 0.08)',
    hudFill: 'rgba(255, 255, 255, 0.82)',
    hudStroke: 'rgba(15, 118, 110, 0.16)',
    hudInk: '#0f172a',
    statusFill: 'rgba(5, 59, 54, 0.92)',
    statusInk: '#f8fafc',
    paddleStart: '#053b36',
    paddleEnd: '#0f766e',
    paddleGlow: 'rgba(5, 59, 54, 0.28)',
    ball: '#fac123',
    ballCore: '#fff7d6',
    boardGlow: 'rgba(250, 193, 35, 0.18)'
};

let bricks = createBrickGrid();

const MAX_LEADERBOARD_NAME_LENGTH = 4;

function getPaddleY() {
    return GAME_HEIGHT - paddleHeight - paddleBottomOffset;
}

function createBrickGrid() {
    const nextBricks = [];
    for (let c = 0; c < brickColumnCount; c++) {
        nextBricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            const courseIndex = (r * brickColumnCount) + c;
            const course = courseDeck[courseIndex];
            nextBricks[c][r] = course ? {
                x: 0,
                y: 0,
                status: 1,
                course: course.title,
                code: course.code,
                tone: course.tone,
                fill: course.fill
            } : {
                x: 0,
                y: 0,
                status: 0,
                course: '',
                code: '',
                tone: '#0f172a',
                fill: '#ffffff'
            };
        }
    }
    return nextBricks;
}

function sanitizeLeaderboardName(value) {
    return String(value ?? '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, MAX_LEADERBOARD_NAME_LENGTH);
}

function isValidLeaderboardName(value) {
    return Boolean(sanitizeLeaderboardName(value));
}

function normalizeLeaderboardEntries(entries) {
    if (!Array.isArray(entries)) return [];
    return entries
        .map(entry => ({
            initials: sanitizeLeaderboardName(entry?.initials),
            score: Number.parseInt(entry?.score, 10) || 0
        }))
        .filter(entry => entry.initials)
        .sort((left, right) => right.score - left.score || left.initials.localeCompare(right.initials));
}

// ===============================
//  Leaderboard Server Integration
// ===============================

const SERVER_URL = "https://portfolio-xoe6.onrender.com";

// Load from server
async function loadLeaderboardFromServer() {
    try {
        const res = await fetch(`${SERVER_URL}/api/leaderboard`);
        leaderboard = normalizeLeaderboardEntries(await res.json());
        updateLeaderboard();
    } catch (err) {
        console.error("Failed to load leaderboard from server:", err);
        leaderboard = [];
        updateLeaderboard();
    }
}

// Save a new score
async function saveScoreToServer(initials, newScore) {
    const safeInitials = sanitizeLeaderboardName(initials);
    if (!safeInitials) return;

    try {
        const res = await fetch(`${SERVER_URL}/api/leaderboard`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initials: safeInitials, score: newScore })
        });
        if (!res.ok) {
            throw new Error(`Leaderboard save failed with status ${res.status}`);
        }
        const data = await res.json();
        if (data.leaderboard) {
            leaderboard = normalizeLeaderboardEntries(data.leaderboard);
        }
        await loadLeaderboardFromServer();
    } catch (err) {
        console.error("Failed to save score:", err);
    }
}

// Reset on server
async function resetLeaderboardOnServer(passkey) {
    try {
        const res = await fetch(`${SERVER_URL}/api/leaderboard/reset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ passkey })
        });
        const data = await res.json();
        if (data.error) {
            alert(data.error);
        } else {
            // success
            alert("reset the leaderboard");
            leaderboard = [];
            updateLeaderboard();
        }
    } catch (err) {
        console.error("Failed to reset leaderboard:", err);
    }
}

// ====================================================
//  Generic Drawing Functions for the Breakout Elements
// ====================================================

function drawRoundedRect(x, y, width, height, radius, fillColor, options = {}) {
    const {
        strokeColor = null,
        strokeWidth = 1,
        shadowColor = null,
        shadowBlur = 0,
        shadowOffsetX = 0,
        shadowOffsetY = 0
    } = options;

    ctx.save();
    if (shadowColor) {
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = shadowBlur;
        ctx.shadowOffsetX = shadowOffsetX;
        ctx.shadowOffsetY = shadowOffsetY;
    }
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.fillStyle = fillColor;
    ctx.fill();
    if (strokeColor) {
        ctx.shadowColor = 'transparent';
        ctx.lineWidth = strokeWidth;
        ctx.strokeStyle = strokeColor;
        ctx.stroke();
    }
    ctx.closePath();
    ctx.restore();
}

function wrapTextLines(text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (ctx.measureText(testLine).width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    });

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines;
}

function drawBoardBackground() {
    ctx.save();

    const background = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    background.addColorStop(0, gameBoardTheme.backgroundTop);
    background.addColorStop(0.58, '#eff8f7');
    background.addColorStop(1, gameBoardTheme.backgroundBottom);
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const glow = ctx.createRadialGradient(GAME_WIDTH * 0.82, 48, 0, GAME_WIDTH * 0.82, 48, 180);
    glow.addColorStop(0, gameBoardTheme.boardGlow);
    glow.addColorStop(1, 'rgba(250, 193, 35, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.strokeStyle = gameBoardTheme.grid;
    ctx.lineWidth = 1;
    for (let gridX = 18; gridX < GAME_WIDTH; gridX += 28) {
        ctx.beginPath();
        ctx.moveTo(gridX, 0);
        ctx.lineTo(gridX, GAME_HEIGHT);
        ctx.stroke();
    }
    for (let gridY = 18; gridY < GAME_HEIGHT; gridY += 28) {
        ctx.beginPath();
        ctx.moveTo(0, gridY);
        ctx.lineTo(GAME_WIDTH, gridY);
        ctx.stroke();
    }

    drawRoundedRect(10, 10, GAME_WIDTH - 20, 36, 18, 'rgba(255, 255, 255, 0.74)', {
        strokeColor: gameBoardTheme.hudStroke
    });

    ctx.restore();
}

function drawHudBadge(text, x, y, { align = 'left', fill = gameBoardTheme.hudFill, stroke = gameBoardTheme.hudStroke, color = gameBoardTheme.hudInk } = {}) {
    ctx.save();
    ctx.font = "700 11px 'Courier New', monospace";
    const badgePaddingX = 12;
    const badgeWidth = ctx.measureText(text).width + (badgePaddingX * 2);
    let badgeX = x;

    if (align === 'right') {
        badgeX = x - badgeWidth;
    } else if (align === 'center') {
        badgeX = x - (badgeWidth / 2);
    }

    drawRoundedRect(badgeX, y, badgeWidth, 24, 12, fill, {
        strokeColor: stroke
    });

    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, badgeX + badgePaddingX, y + 13);
    ctx.restore();
}

function drawBricks() {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];
            if (b.status === 1) {
                let brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
                let brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
                b.x = brickX;
                b.y = brickY;

                const brickFill = ctx.createLinearGradient(brickX, brickY, brickX, brickY + brickHeight);
                brickFill.addColorStop(0, 'rgba(255, 255, 255, 0.96)');
                brickFill.addColorStop(1, b.fill);

                drawRoundedRect(brickX, brickY, brickWidth, brickHeight, 12, brickFill, {
                    strokeColor: 'rgba(255, 255, 255, 0.85)',
                    shadowColor: 'rgba(15, 23, 42, 0.16)',
                    shadowBlur: 12,
                    shadowOffsetY: 8
                });
                drawRoundedRect(brickX + 9, brickY + 8, brickWidth - 18, 8, 4, b.tone);

                ctx.font = "700 10px 'Courier New', monospace";
                const codeWidth = Math.max(56, ctx.measureText(b.code).width + 20);
                const codeX = brickX + ((brickWidth - codeWidth) / 2);
                drawRoundedRect(codeX, brickY + 18, codeWidth, 18, 9, 'rgba(255, 255, 255, 0.94)', {
                    strokeColor: 'rgba(15, 23, 42, 0.08)'
                });
                ctx.fillStyle = b.tone;
                ctx.fillText(b.code, brickX + (brickWidth / 2), brickY + 28);

                ctx.font = "700 11px 'Courier New', monospace";
                const lines = wrapTextLines(b.course, brickWidth - 20).slice(0, 3);
                const lineHeight = 12;
                const titleBlockHeight = lines.length * lineHeight;
                const titleAreaTop = brickY + 40;
                const titleAreaHeight = brickHeight - 46;
                const startY = titleAreaTop + ((titleAreaHeight - titleBlockHeight) / 2) + (lineHeight / 2);

                ctx.fillStyle = b.tone;
                lines.forEach((line, index) => {
                    ctx.fillText(line, brickX + (brickWidth / 2), startY + (index * lineHeight));
                });
            }
        }
    }
    ctx.restore();
}

function drawBall() {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI*2);
    ctx.shadowColor = 'rgba(250, 193, 35, 0.4)';
    ctx.shadowBlur = 16;
    ctx.fillStyle = gameBoardTheme.ball;
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.arc(x - 2, y - 2, ballRadius * 0.48, 0, Math.PI * 2);
    ctx.fillStyle = gameBoardTheme.ballCore;
    ctx.fill();
    ctx.closePath();
    ctx.restore();
}

function drawPaddle() {
    const paddleY = getPaddleY();
    const paddleGradient = ctx.createLinearGradient(paddleX, paddleY, paddleX, paddleY + paddleHeight);
    paddleGradient.addColorStop(0, gameBoardTheme.paddleEnd);
    paddleGradient.addColorStop(1, gameBoardTheme.paddleStart);

    drawRoundedRect(paddleX, paddleY, paddleWidth, paddleHeight, paddleHeight / 2, paddleGradient, {
        strokeColor: 'rgba(255, 255, 255, 0.38)',
        shadowColor: gameBoardTheme.paddleGlow,
        shadowBlur: 14,
        shadowOffsetY: 6
    });
    drawRoundedRect(paddleX + 12, paddleY + 4, paddleWidth - 24, 4, 2, 'rgba(255, 255, 255, 0.35)');
}

function drawScore() {
    drawHudBadge(`SCORE ${score}`, 16, 16);
}

function drawLives() {
    drawHudBadge(`LIVES ${lives}`, GAME_WIDTH - 16, 16, { align: 'right' });
}

function drawStatusBadge() {
    const statusText = isPaused
        ? 'PAUSED · SPACE TO RESUME'
        : isNotStarted
            ? 'SPACE TO LAUNCH'
            : 'COURSEOUT';
    drawHudBadge(statusText, GAME_WIDTH / 2, 16, {
        align: 'center',
        fill: gameBoardTheme.statusFill,
        stroke: 'rgba(255, 255, 255, 0.16)',
        color: gameBoardTheme.statusInk
    });
}

// =======================
//  Collision & Game Logic
// =======================

function collisionDetection() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            let b = bricks[c][r];
            if (b.status === 1) {
                if (
                    x + ballRadius > b.x &&
                    x - ballRadius < b.x + brickWidth &&
                    y + ballRadius > b.y &&
                    y - ballRadius < b.y + brickHeight
                ) {
                    // Collided
                    b.status = 0;
                    score++;

                    // Figure out which side we hit
                    let ballCenterNextX = x + dx;
                    let ballCenterNextY = y + dy;
                    const distLeft   = Math.abs(ballCenterNextX - b.x);
                    const distRight  = Math.abs(ballCenterNextX - (b.x + brickWidth));
                    const distTop    = Math.abs(ballCenterNextY - b.y);
                    const distBottom = Math.abs(ballCenterNextY - (b.y + brickHeight));
                    const minDist = Math.min(distLeft, distRight, distTop, distBottom);

                    if (minDist === distLeft) {
                        dx = -Math.abs(dx);
                        x = b.x - ballRadius - 1;
                    } else if (minDist === distRight) {
                        dx = Math.abs(dx);
                        x = b.x + brickWidth + ballRadius + 1;
                    } else if (minDist === distTop) {
                        dy = -Math.abs(dy);
                        y = b.y - ballRadius - 1;
                    } else {
                        dy = Math.abs(dy);
                        y = b.y + brickHeight + ballRadius + 1;
                    }

                    // Win check
                    if (score === activeBrickCount) {
                        endGame(true);
                    }
                }
            }
        }
    }
}

function endGame(won) {
    isGameOver = true;
    cancelAnimationFrame(animationId);

    let initials = '';
    while (true) {
        const response = prompt(
            won
                ? "You won! Enter a 1-4 character name or initials:"
                : "Game over. Enter a 1-4 character name or initials:"
        );
        if (response === null) break;
        initials = sanitizeLeaderboardName(response);
        if (initials) {
            saveScoreToServer(initials, score);
            break;
        }
        alert('A name is required. Symbols-only entries are not allowed.');
    }

    gameCanvas.style.display = 'none';
    startScreen.style.display = 'block';
}

function updateLeaderboard() {
    leaderboardEl.innerHTML = "";
    const normalizedEntries = normalizeLeaderboardEntries(leaderboard);

    if (!normalizedEntries.length) {
        const emptyState = document.createElement('p');
        emptyState.className = 'game-leaderboard-empty';
        emptyState.textContent = 'No scores yet. Clear the courses and take the top spot.';
        leaderboardEl.appendChild(emptyState);
        return;
    }

    const ul = document.createElement('ul');
    ul.className = 'game-leaderboard';

    for (let i = 0; i < normalizedEntries.length; i++) {
        const entry = normalizedEntries[i];
        const li = document.createElement('li');
        li.className = 'game-leaderboard__item';

        const initials = document.createElement('span');
        initials.textContent = `#${i + 1} ${entry.initials}`;

        const entryScore = document.createElement('strong');
        entryScore.textContent = entry.score;

        li.appendChild(initials);
        li.appendChild(entryScore);
        ul.appendChild(li);
    }

    leaderboardEl.appendChild(ul);
    leaderboard = normalizedEntries;
}

function resetLeaderboard() {
    let passkey = prompt("if you know, you know:");
    if (!passkey) return;

    // Instead of localStorage, reset on server
    resetLeaderboardOnServer(passkey);
}

// =======================
//  Paddle & Ball Movement
// =======================

// Key listeners
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
document.addEventListener("keydown", pauseHandler, false);

// Prevent spacebar from scrolling the page
window.addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
        e.preventDefault();
    }
}, false);

function keyDownHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") {
        rightPressed = true;
    } else if (e.key === "Left" || e.key === "ArrowLeft") {
        leftPressed = true;
    }
}

function keyUpHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") {
        rightPressed = false;
    } else if (e.key === "Left" || e.key === "ArrowLeft") {
        leftPressed = false;
    }
}

function pauseHandler(e) {
    // Press Esc to pause
    if (e.key === "Escape" && isLaunched && !isPaused && !isGameOver) {
        isPaused = true;
    }
    // Spacebar to resume if paused
    else if (e.key === " " && isPaused && !isGameOver) {
        isPaused = false;
    }
    // Spacebar to launch if not started
    else if (e.key === " " && isNotStarted && !isGameOver) {
        isNotStarted = false;
        isLaunched = true;
    }
}

let animationId;
function draw() {
    if (isGameOver) return;

    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    drawBoardBackground();

    // Ball stuck to paddle if not launched
    if (isNotStarted) {
        x = paddleX + paddleWidth / 2;
        y = getPaddleY() - ballRadius;
    }

    drawBricks();
    drawPaddle();
    drawScore();
    drawLives();
    drawStatusBadge();

    if (!isPaused) {
        drawBall();
        collisionDetection();

        // If launched, update ball position
        if (isLaunched) {
            // Side walls
            if (x + dx > GAME_WIDTH - ballRadius || x + dx < ballRadius) {
                dx = -dx;
            }
            // Top
            if (y + dy < ballRadius) {
                dy = -dy;
            }
            // Bottom area -> check paddle
            else if (y + dy > getPaddleY() - ballRadius) {
                if (x > paddleX && x < paddleX + paddleWidth) {
                    // More dynamic angles
                    const paddleCenter = paddleX + paddleWidth / 2;
                    const distFromCenter = x - paddleCenter;
                    dx = distFromCenter * 0.15;  // tweak factor

                    // Flip vertical dir
                    dy = -Math.abs(dy);

                    // Speed up ball
                    dx *= 1.1;
                    dy *= 1.3;
                } else {
                    lives--;
                    if (!lives) {
                        endGame(false);
                        return;
                    } else {
                        // Reset ball above paddle but keep game going
                        x = GAME_WIDTH / 2;
                        y = getPaddleY() - ballRadius - 32;
                        dx = initialVelocity.x;
                        dy = initialVelocity.y;
                        isNotStarted = true; 
                        isLaunched = false;
                    }
                }
            }

            // Move paddle
            if (rightPressed && paddleX < GAME_WIDTH - paddleWidth) {
                paddleX += paddleSpeed;
            } else if (leftPressed && paddleX > 0) {
                paddleX -= paddleSpeed;
            }

            if (!isNotStarted) {
                x += dx;
                y += dy;
            } else {
                // Ball stuck
                x = paddleX + paddleWidth/2;
                y = getPaddleY() - ballRadius;
            }

        } else {
            // Not launched yet
            if (rightPressed && paddleX < GAME_WIDTH - paddleWidth) {
                paddleX += paddleSpeed;
            } else if (leftPressed && paddleX > 0) {
                paddleX -= paddleSpeed;
            }
            x = paddleX + paddleWidth/2;
            y = getPaddleY() - ballRadius;
            drawBall();
        }

    } else {
        const centerX = GAME_WIDTH / 2;
        const centerY = GAME_HEIGHT / 2;

        drawRoundedRect(centerX - 118, centerY - 40, 236, 80, 18, 'rgba(15, 23, 42, 0.72)', {
            strokeColor: 'rgba(255, 255, 255, 0.14)'
        });
        ctx.save();
        ctx.fillStyle = '#f8fafc';
        ctx.font = "700 18px 'Courier New', monospace";
        ctx.textAlign = 'center';
        ctx.fillText('Paused', centerX, centerY - 6);
        ctx.font = "600 11px 'Courier New', monospace";
        ctx.fillStyle = 'rgba(248, 250, 252, 0.78)';
        ctx.fillText('press space to resume', centerX, centerY + 18);
        ctx.restore();
    }

    animationId = requestAnimationFrame(draw);
}

function startGame() {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }

    score = 0;
    lives = 2;
    paddleX = (GAME_WIDTH - paddleWidth) / 2;
    x = GAME_WIDTH / 2;
    y = getPaddleY() - ballRadius - 32;
    dx = initialVelocity.x;
    dy = initialVelocity.y;

    isGameOver = false;
    isPaused = false;
    isNotStarted = true;
    isLaunched = false;

    bricks = createBrickGrid();
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            bricks[c][r].status = bricks[c][r].course ? 1 : 0;
        }
    }

    startScreen.style.display = 'none';
    gameCanvas.style.display = 'block';
    draw();
}

startBtn.addEventListener('click', startGame);
})();
