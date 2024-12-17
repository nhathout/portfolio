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

// Simple Breakout Game Logic with Course Names on Bricks

const startBtn = document.getElementById('startBtn');
const resetLeaderboardBtn = document.getElementById('resetLeaderboardBtn'); 
const gameCanvas = document.getElementById('gameCanvas');
const ctx = gameCanvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const leaderboardEl = document.getElementById('leaderboard');

let score = 0;
let lives = 2;

// Load leaderboard from localStorage
let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
updateLeaderboard();

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
    "AI", "Robotics", "ML", "Data Structures", 
    "Signals", "Systems", "OS", "Circuits", 
    "Controls", "Electronics", "Probability", "Computer Arch."
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

// Event listeners
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
resetLeaderboardBtn.addEventListener('click', resetLeaderboard);

// Prevent spacebar from scrolling the page:
window.addEventListener('keydown', function(e) {
    // If space is pressed
    if (e.code === 'Space') {
        e.preventDefault();
    }
}, false);

document.addEventListener("keydown", pauseHandler, false);

function keyDownHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") {
        rightPressed = true;
    } else if (e.key === "Left" || e.key === "ArrowLeft") {
        leftPressed = true;
    }
}

function pauseHandler(e) {
    // Press Esc to pause if game is running (launched and not paused/not over)
    if (e.key === "Escape" && isLaunched && !isPaused && !isGameOver) {
        isPaused = true;
    } else if (e.key === " " && isPaused && !isGameOver) {
        // Spacebar to resume if paused
        isPaused = false;
    } else if (e.key === " " && isNotStarted && !isGameOver) {
        // Start the ball if not started
        isNotStarted = false;
        isLaunched = true;
    }
}

function keyUpHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") {
        rightPressed = false;
    } else if (e.key === "Left" || e.key === "ArrowLeft") {
        leftPressed = false;
    }
}

function drawBricks() {
    ctx.font = "12px Arial";
    ctx.textBaseline = 'top';

    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];
            if (b.status === 1) {
                let brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
                let brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
                b.x = brickX;
                b.y = brickY;
                drawRoundedRect(brickX, brickY, brickWidth, brickHeight, 5, b.color);
                ctx.fillStyle = "#fff";
                ctx.fillText(b.course, brickX + 8, brickY + 10);
            }
        }
    }
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
    ctx.fillText("Score: " + score, 8, 8);
}

function drawLives() {
    ctx.font = "16px Arial";
    ctx.fillStyle = "#fff";
    ctx.fillText("Lives: " + lives, gameCanvas.width - 85, 8);
}

function collisionDetection() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            let b = bricks[c][r];
            if (b.status === 1) {
                if (x > b.x && x < b.x+brickWidth && y > b.y && y < b.y+brickHeight) {
                    dy = -dy;
                    b.status = 0;
                    score++;
                    if (dy < 0) {
                        y = b.y - ballRadius - 1;
                    } else {
                        y = b.y + brickHeight + ballRadius + 1;
                    }

                    if (score === brickRowCount*brickColumnCount) {
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
    let initials = prompt(won ? "You won! Enter your initials:" : "Game Over! Enter your initials:");
    if (!initials) initials = "???";
    // Limit to 4 characters
    initials = initials.substring(0,4);
    leaderboard.push({ initials, score });
    leaderboard.sort((a,b) => b.score - a.score);
    // Keep top 20 scores
    leaderboard = leaderboard.slice(0,20);
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
    updateLeaderboard();
    gameCanvas.style.display = 'none';
    startScreen.style.display = 'inline-block';
}

function updateLeaderboard() {
    // Clear existing
    leaderboardEl.innerHTML = "";

    // We want 5 columns and up to 20 scores.
    // We'll arrange them in a grid: top-left to right, then next line.
    // For 20 scores, that's 4 rows x 5 columns if full.

    // Create a single UL
    const ul = document.createElement('ul');
    ul.style.fontSize = "10px"; // Smaller font
    ul.style.listStyleType = 'none';
    ul.style.margin = '0';
    ul.style.padding = '0';
    ul.style.display = 'grid';
    ul.style.gridTemplateColumns = 'repeat(5, auto)';
    ul.style.gap = '20px'; // Keep the spacing similar
    ul.style.alignItems = 'start'; // Align top

    // Populate the UL with up to 20 entries, already sorted
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
    const correctPasskey = "8008"; // Set your own passkey here

    if (passkey === correctPasskey) {
        localStorage.removeItem('leaderboard');
        leaderboard = [];
        updateLeaderboard();
        alert("reset the leaderboard");
    } else {
        alert("hmmm... seems you're not my creator, \nnice try but i'm not resetting the leaderboard.");
    }
}

let animationId;
function draw() {
    if (isGameOver) return;

    ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

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
            // Bounce off side walls
            if (x + dx > gameCanvas.width - ballRadius || x + dx < ballRadius) {
                dx = -dx;
            }
            // Bounce off top
            if (y + dy < ballRadius) {
                dy = -dy;
            } else if (y + dy > gameCanvas.height - ballRadius - paddleHeight - 10) {
                // Ball at bottom area, check paddle
                if (x > paddleX && x < paddleX + paddleWidth) {
                    dy = -dy;
                    // Increase ball speed more noticeably every time it hits the paddle
                    dx *= 1.15;
                    dy *= 1.15;
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

            // Move paddle with arrow keys only
            if (rightPressed && paddleX < gameCanvas.width - paddleWidth) {
                paddleX += paddleSpeed;
            } else if (leftPressed && paddleX > 0) {
                paddleX -= paddleSpeed;
            }

            if (!isNotStarted) {
                x += dx;
                y += dy;
            } else {
                // Ball stuck to paddle
                x = paddleX + paddleWidth/2;
                y = gameCanvas.height - paddleHeight - 10 - ballRadius;
            }

        } else {
            // Not launched, ball stuck to paddle
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
        // Game is paused: draw pause symbol in the center
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
