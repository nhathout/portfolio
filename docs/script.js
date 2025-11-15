// Mobile menu toggle
const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');
const navSectionIndicator = document.getElementById('navSectionIndicator');
menuToggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
});

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

    for (const section of indicatorSections) {
        const elementTop = section.element.offsetTop - headerOffset - 60;
        const elementBottom = elementTop + section.element.offsetHeight;
        if (referenceY >= elementTop && referenceY < elementBottom) {
            activeLabel = section.label;
            break;
        }
        if (referenceY >= elementBottom) {
            activeLabel = section.label;
        }
    }

    navSectionIndicator.textContent = activeLabel;
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

// Resume box shaking logic
const resumeBox = document.getElementById('resumeBox');
const projectsGrid = document.getElementById('projectsGrid');

let shakeCyclesRun = 0; // how many times we've done the 3-shake + pause sequence this round
let totalCycles = 2;    // do it twice each time it's triggered
let inView = true;      // whether the box is currently in view

function runShakeCycle() {
    shakeCyclesRun = 0;
    startShake();
}

function startShake() {
    if (!resumeBox) return;
    resumeBox.classList.add('shake-on-load');
}

resumeBox.addEventListener('animationend', () => {
    resumeBox.classList.remove('shake-on-load');
    shakeCyclesRun++;
    if (shakeCyclesRun < totalCycles) {
        // Wait 5 seconds, then shake again
        setTimeout(() => {
            if (inView) {
                startShake();
            }
        }, 5000);
    }
});

window.addEventListener('load', () => {
    setTimeout(() => {
        runShakeCycle();
    }, 500);

    // Also load leaderboard from server on page load
    loadLeaderboardFromServer();
});

// Intersection Observer to detect visibility changes
const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            inView = true;
            runShakeCycle();
        } else {
            inView = false;
        }
    });
});

if (resumeBox) {
    observer.observe(resumeBox);
}

// ====================
//  Skills Grid (3D cubes)
// ====================

const skillFaces = ['front', 'back', 'right', 'left', 'top', 'bottom'];
const projectEntries = [
    {
        title: 'Pollux',
        description: 'An autonomous countertop-cleaning robot with reinforcement learning to avoid cliffs and obstacles.',
        image: 'assets/images/pollux.png',
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

function initSkillsSection() {
    skillsGridEl = document.getElementById('skillsGrid');
    skillsTabsEl = document.getElementById('skillsTabs');
    skillsActiveLabelEl = document.getElementById('skillsActiveLabel');
    skillsPrevBtn = document.getElementById('skillsPrev');
    skillsNextBtn = document.getElementById('skillsNext');

    if (!skillsGridEl || !skillsTabsEl) return;

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

function buildProjectsGrid() {
    if (!projectsGrid) return;
    const fragment = document.createDocumentFragment();
    projectEntries.forEach(project => {
        const card = document.createElement('article');
        card.className = 'project-card';

        const media = document.createElement('div');
        media.className = 'project-media';
        const img = document.createElement('img');
        img.src = project.image;
        img.alt = project.title;
        media.appendChild(img);

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
        content.appendChild(description);
        content.appendChild(linksContainer);

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
});

// ====================
//  Breakout Game Vars
// ====================

const startBtn = document.getElementById('startBtn');
const resetLeaderboardBtn = document.getElementById('resetLeaderboardBtn'); 
resetLeaderboardBtn.addEventListener('click', resetLeaderboard);
const gameCanvas = document.getElementById('gameCanvas');
const ctx = gameCanvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const leaderboardEl = document.getElementById('leaderboard');

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
