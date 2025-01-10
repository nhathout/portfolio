// Mobile menu toggle
const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');
menuToggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
});

// Hide/Show top nav on scroll
let lastScrollTop = 0;
const topNav = document.getElementById('topNav');

window.addEventListener('scroll', () => {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop > lastScrollTop) {
        // Scrolling down - hide nav
        topNav.style.transform = 'translateY(-100%)';
    } else {
        // Scrolling up - show nav
        topNav.style.transform = 'translateY(0)';
    }
    lastScrollTop = Math.max(scrollTop, 0);
});

// Resume box shaking logic
const resumeBox = document.getElementById('resumeBox');

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
//  Breakout Game Vars
// ====================

const startBtn = document.getElementById('startBtn');
const resetLeaderboardBtn = document.getElementById('resetLeaderboardBtn'); 
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
    