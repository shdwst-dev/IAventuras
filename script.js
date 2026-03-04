// =========================================
// IA-venturas — Main Menu Script (Kid-Friendly)
// =========================================

const canvas = document.getElementById('particles-canvas');
const ctx = canvas.getContext('2d');

let particlesArray = [];
const numberOfParticles = window.innerWidth < 768 ? 25 : 50;

// Rainbow color palette for particles
const rainbowColors = [
    '#7c3aed', '#a855f7', '#ec4899', '#06b6d4',
    '#facc15', '#34d399', '#fb923c', '#f472b6',
    '#818cf8', '#22d3ee'
];

// ========== Canvas Setup ==========
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', () => {
    resizeCanvas();
    init();
});
resizeCanvas();

// ========== Mouse interaction ==========
let mouse = { x: null, y: null, radius: 150 };

window.addEventListener('mousemove', (event) => {
    mouse.x = event.x;
    mouse.y = event.y;
});

window.addEventListener('mouseout', () => {
    mouse.x = undefined;
    mouse.y = undefined;
});

// ========== Particle Class ==========
class Particle {
    constructor(x, y, directionX, directionY, size, color) {
        this.x = x;
        this.y = y;
        this.directionX = directionX;
        this.directionY = directionY;
        this.size = size;
        this.color = color;
        this.alpha = Math.random() * 0.5 + 0.5;
        this.pulse = Math.random() * Math.PI * 2;
    }

    draw() {
        const pulseSize = this.size + Math.sin(this.pulse) * 0.5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, pulseSize, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.alpha;
        ctx.fill();
        // Glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }

    update() {
        if (this.x > canvas.width || this.x < 0) this.directionX = -this.directionX;
        if (this.y > canvas.height || this.y < 0) this.directionY = -this.directionY;

        // Mouse repulsion
        if (mouse.x != null && mouse.y != null) {
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < mouse.radius + this.size) {
                const force = (mouse.radius - distance) / mouse.radius;
                this.x -= (dx / distance) * force * 2;
                this.y -= (dy / distance) * force * 2;
            }
        }

        this.x += this.directionX;
        this.y += this.directionY;
        this.pulse += 0.03;
        this.draw();
    }
}

function init() {
    particlesArray = [];
    for (let i = 0; i < numberOfParticles; i++) {
        let size = Math.random() * 2.5 + 0.5;
        let x = Math.random() * (canvas.width - size * 4) + size * 2;
        let y = Math.random() * (canvas.height - size * 4) + size * 2;
        let directionX = (Math.random() * 0.8) - 0.4;
        let directionY = (Math.random() * 0.8) - 0.4;
        let color = rainbowColors[Math.floor(Math.random() * rainbowColors.length)];
        particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
    }
}

function connect() {
    const maxDist = 12000; // distancia fija en vez de recalcular cada frame
    for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a + 1; b < particlesArray.length; b++) {
            const dx = particlesArray[a].x - particlesArray[b].x;
            if (dx > 110 || dx < -110) continue; // salida rápida
            const dy = particlesArray[a].y - particlesArray[b].y;
            if (dy > 110 || dy < -110) continue;
            const distance = dx * dx + dy * dy;
            if (distance < maxDist) {
                const opacity = (1 - distance / maxDist) * 0.12;
                ctx.strokeStyle = `rgba(168, 85, 247, ${opacity})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                ctx.stroke();
            }
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
    }
    connect();
}

init();
animate();

// ========== Splash Screen ==========
const splash = document.getElementById('splash-screen');
if (splash) {
    setTimeout(() => {
        splash.classList.add('hidden');
        // Launch confetti after splash
        launchConfetti();
    }, 3200);
}

// ========== Confetti Effect ==========
function launchConfetti() {
    const confettiColors = ['#ec4899', '#7c3aed', '#06b6d4', '#facc15', '#34d399', '#fb923c', '#f472b6', '#818cf8'];
    const shapes = ['circle', 'square'];

    for (let i = 0; i < 60; i++) {
        setTimeout(() => {
            const piece = document.createElement('div');
            piece.classList.add('confetti-piece');
            const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
            const shape = shapes[Math.floor(Math.random() * shapes.length)];
            const size = Math.random() * 8 + 6;
            const duration = Math.random() * 2 + 2;
            const startX = Math.random() * window.innerWidth;

            piece.style.left = startX + 'px';
            piece.style.top = '-10px';
            piece.style.width = size + 'px';
            piece.style.height = size + 'px';
            piece.style.background = color;
            piece.style.borderRadius = shape === 'circle' ? '50%' : '2px';
            piece.style.animationDuration = duration + 's';
            piece.style.transform = `rotate(${Math.random() * 360}deg)`;

            document.body.appendChild(piece);

            setTimeout(() => piece.remove(), duration * 1000);
        }, i * 40);
    }
}

// ========== Sparkles ==========
function createSparkles() {
    const sparkleEmojis = ['✨', '⭐', '💫', '🌟'];
    for (let i = 0; i < 8; i++) {
        const sparkle = document.createElement('div');
        sparkle.classList.add('sparkle');
        sparkle.textContent = sparkleEmojis[Math.floor(Math.random() * sparkleEmojis.length)];
        sparkle.style.left = Math.random() * 100 + 'vw';
        sparkle.style.top = Math.random() * 100 + 'vh';
        sparkle.style.animationDelay = Math.random() * 6 + 's';
        sparkle.style.animationDuration = (Math.random() * 4 + 4) + 's';
        document.body.appendChild(sparkle);
    }
}
createSparkles();

// ========== Card Hover Sound (subtle) ==========
function createHoverSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);

        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
        // Audio not supported, silent fallback
    }
}

document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        createHoverSound();
    });
});

// ========== Mascot Click Interaction ==========
const mascot = document.getElementById('mascot');
if (mascot) {
    mascot.addEventListener('click', () => {
        mascot.style.animation = 'none';
        mascot.offsetHeight; // trigger reflow
        mascot.style.animation = 'mascotWave 0.5s ease';
        launchConfetti();
    });
}
