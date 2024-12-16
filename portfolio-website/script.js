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
    // Run the shake 3 times, pause 5s, run again (twice total)
    shakeCyclesRun = 0;
    startShake();
}

function startShake() {
    if (!resumeBox) return;
    // Add class to start shaking
    resumeBox.classList.add('shake-on-load');
}

// When animation ends, we pause for 5 seconds and run again if cycles < totalCycles
resumeBox.addEventListener('animationend', () => {
    resumeBox.classList.remove('shake-on-load');
    shakeCyclesRun++;
    if (shakeCyclesRun < totalCycles) {
        // Wait 5 seconds, then shake again
        setTimeout(() => {
            // Only shake again if still in view
            if (inView) {
                startShake();
            }
        }, 5000);
    }
});

// Run initial shake cycle after load
window.addEventListener('load', () => {
    setTimeout(() => {
        runShakeCycle();
    }, 500);
});

// Intersection Observer to detect visibility changes
const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Box back in view
            inView = true;
            // Run the cycle again if not currently shaking or after previous ended
            // We'll run a new cycle whenever it comes back into view
            // This resets shakeCyclesRun and runs again
            runShakeCycle();
        } else {
            // Box out of view
            inView = false;
        }
    });
});

// Observe the resumeBox
if (resumeBox) {
    observer.observe(resumeBox);
}
