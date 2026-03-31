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
const RESUME_STORAGE_KEY = null;

function initResumePopover() {
    if (!resumePopover) return;
    setTimeout(() => resumePopover.classList.add('is-visible'), 1200);
    resumePopoverClose?.addEventListener('click', () => {
        resumePopover.classList.remove('is-visible');
    });
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
const paddleHeight = 20;
const paddleWidth = 75;
let paddleX = (gameCanvas.width - paddleWidth) / 2;
let rightPressed = false;
let leftPressed = false;
const paddleSpeed = 7;

const ballRadius = 10;
let x = gameCanvas.width / 2;
let y = gameCanvas.height - paddleHeight - 10 - 50;
let dx = 2;
let dy = -2;

const courses = [
    "Deep Learning", "Machine Learning", "Embedded Systems", "Reinforcem. Learning", 
    "Signals & Systems", "Software Design", "Logic Design", "Circuits", 
    "Controls", "Probability, Stats & DS", "Computer Arch.", "CAD"
];
let brickRowCount = 3;
let brickColumnCount = 4;
let brickWidth = 100;
let brickHeight = 40;
let brickPadding = 15;
let brickOffsetTop = 30;
let brickOffsetLeft = 15;

// More saturated purple colors
const brickColors = [
    "#8A2BE2", "#9400D3", "#9932CC", "#BA55D3",
    "#800080", "#8B008B", "#4B0082", "#7B68EE",
    "#6A5ACD", "#9370DB", "#5D3FD3", "#663399"
];

gameCanvas.style.backgroundColor = "#333"; 

let bricks = [];
for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickRowCount; r++) {
        const courseIndex = c * brickRowCount + r;
        bricks[c][r] = { 
            x: 0, 
            y: 0, 
            status: 1, 
            course: courses[courseIndex], 
            color: brickColors[courseIndex % brickColors.length] || "#8A2BE2"
        };
    }
}

const paddleImg = new Image();
paddleImg.src = "assets/images/paddle.png"; // Provide your own paddle image

// ===============================
//  Leaderboard Server Integration
// ===============================

const SERVER_URL = "https://portfolio-xoe6.onrender.com";

// Load from server
async function loadLeaderboardFromServer() {
    try {
        const res = await fetch(`${SERVER_URL}/api/leaderboard`);
        leaderboard = await res.json(); // array of {initials, score}
        updateLeaderboard();
    } catch (err) {
        console.error("Failed to load leaderboard from server:", err);
        leaderboard = [];
        updateLeaderboard();
    }
}

// Save a new score
async function saveScoreToServer(initials, newScore) {
    try {
        const res = await fetch(`${SERVER_URL}/api/leaderboard`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initials, score: newScore })
        });
        const data = await res.json();
        if (data.leaderboard) {
            leaderboard = data.leaderboard;
            updateLeaderboard();
        }
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

function drawRoundedRect(x, y, width, height, radius, fillColor) {
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
    ctx.closePath();
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let currentLine = '';
    
    for (let i = 0; i < words.length; i++) {
        const testLine = currentLine + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        
        if (testWidth > maxWidth) {
            ctx.fillText(currentLine, x, y);
            currentLine = words[i] + ' ';
            y += lineHeight;
        } else {
            currentLine = testLine;
        }
    }
    // Draw whatever remains
    ctx.fillText(currentLine, x, y);
}

function drawBricks() {
    ctx.save();
    ctx.font = "14px Arial";
    ctx.textBaseline = "top";

    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];
            if (b.status === 1) {
                let brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
                let brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
                b.x = brickX;
                b.y = brickY;

                // Draw the brick
                drawRoundedRect(brickX, brickY, brickWidth, brickHeight, 5, b.color);

                // Text color
                ctx.fillStyle = "#fff";
                drawWrappedText(
                    ctx,
                    b.course,
                    brickX + 8,
                    brickY + 8,
                    brickWidth - 16,
                    16
                );
            }
        }
    }
    ctx.restore();
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI*2);
    ctx.fillStyle = "#e6e6fa";
    ctx.fill();
    ctx.closePath();
}

function drawPaddle() {
    if (paddleImg.complete && paddleImg.width > 0) {
        ctx.drawImage(paddleImg, paddleX, gameCanvas.height - paddleHeight - 10, paddleWidth, paddleHeight);
    } else {
        drawRoundedRect(paddleX, gameCanvas.height - paddleHeight - 10, paddleWidth, paddleHeight, 5, "#9370DB");
    }
}

function drawScore() {
    ctx.font = "16px Arial";
    ctx.fillStyle = "#fff";
    ctx.fillText("Score: " + score, 8, 24);
}

function drawLives() {
    ctx.font = "16px Arial";
    ctx.fillStyle = "#fff";
    ctx.fillText("Lives: " + lives, gameCanvas.width - 85, 24);
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
                    if (score === brickRowCount * brickColumnCount) {
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

    let initials = prompt(
      won ? "You won! Enter your initials:" : "Game Over! Enter your initials:"
    );
    if (!initials) initials = "???";
    initials = initials.substring(0,4);

    // Instead of localStorage, send to server
    saveScoreToServer(initials, score);

    gameCanvas.style.display = 'none';
    startScreen.style.display = 'inline-block';
}

function updateLeaderboard() {
    // Clear existing
    leaderboardEl.innerHTML = "";

    // Up to 20 entries
    // We'll arrange them in a 5-column grid
    const ul = document.createElement('ul');
    ul.style.fontSize = "10px";
    ul.style.listStyleType = 'none';
    ul.style.margin = '0';
    ul.style.padding = '0';
    ul.style.display = 'grid';
    ul.style.gridTemplateColumns = 'repeat(5, auto)';
    ul.style.gap = '20px';
    ul.style.alignItems = 'start';

    for (let i = 0; i < leaderboard.length; i++) {
        const entry = leaderboard[i];
        const li = document.createElement('li');
        li.textContent = `${entry.initials}: ${entry.score}`;
        ul.appendChild(li);
    }

    leaderboardEl.appendChild(ul);
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

    ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

    // Ball stuck to paddle if not launched
    if (isNotStarted) {
        x = paddleX + paddleWidth / 2;
        y = gameCanvas.height - paddleHeight - 10 - ballRadius;
    }

    drawBricks();
    drawPaddle();
    drawScore();
    drawLives();

    if (!isPaused) {
        drawBall();
        collisionDetection();

        // If launched, update ball position
        if (isLaunched) {
            // Side walls
            if (x + dx > gameCanvas.width - ballRadius || x + dx < ballRadius) {
                dx = -dx;
            }
            // Top
            if (y + dy < ballRadius) {
                dy = -dy;
            }
            // Bottom area -> check paddle
            else if (y + dy > gameCanvas.height - ballRadius - paddleHeight - 10) {
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
                        x = gameCanvas.width/2;
                        y = gameCanvas.height - paddleHeight - 10 - 50;
                        dx = 2;
                        dy = -2;
                        isNotStarted = true; 
                        isLaunched = false;
                    }
                }
            }

            // Move paddle
            if (rightPressed && paddleX < gameCanvas.width - paddleWidth) {
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
                y = gameCanvas.height - paddleHeight - 10 - ballRadius;
            }

        } else {
            // Not launched yet
            if (rightPressed && paddleX < gameCanvas.width - paddleWidth) {
                paddleX += paddleSpeed;
            } else if (leftPressed && paddleX > 0) {
                paddleX -= paddleSpeed;
            }
            x = paddleX + paddleWidth/2;
            y = gameCanvas.height - paddleHeight - 10 - ballRadius;
            drawBall();
        }

    } else {
        // Game is paused -> draw pause symbol
        const pauseWidth = 10;
        const pauseHeight = 40;
        const gap = 10;
        const centerX = gameCanvas.width / 2;
        const centerY = gameCanvas.height / 2;

        drawRoundedRect(centerX - pauseWidth - gap/2, centerY - pauseHeight/2, pauseWidth, pauseHeight, 3, "#ffffff");
        drawRoundedRect(centerX + gap/2, centerY - pauseHeight/2, pauseWidth, pauseHeight, 3, "#ffffff");
    }

    animationId = requestAnimationFrame(draw);
}

function startGame() {
    score = 0;
    lives = 2;
    x = gameCanvas.width/2;
    y = gameCanvas.height - paddleHeight - 10 - 50;
    dx = 2;
    dy = -2;

    isGameOver = false;
    isPaused = false;
    isNotStarted = true;
    isLaunched = false;

    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            bricks[c][r].status = 1;
        }
    }

    startScreen.style.display = 'none';
    gameCanvas.style.display = 'block';
    draw();
}

startBtn.addEventListener('click', startGame);
})();
