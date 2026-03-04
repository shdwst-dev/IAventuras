// ==========================================
// IA-venturas — Fruit Ninja IA (OPTIMIZADO)
// ==========================================

// Referencias al DOM (cacheadas una sola vez)
const videoElement = document.querySelector('.input_video');
const drawingCanvas = document.querySelector('.drawing_canvas');
const drawingCtx = drawingCanvas.getContext('2d', { alpha: true });
const uiCanvas = document.querySelector('.ui_canvas');
const uiCtx = uiCanvas.getContext('2d', { alpha: true });
const modeBadge = document.getElementById('current-mode');

const scoreDisplay = document.getElementById('score-display');
const livesDisplay = document.getElementById('lives-display');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreDisplay = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');

// ==========================================
// Tamaños de Canvas — usar resolución más baja para rendimiento
// ==========================================
let canvasWidth = 960;
let canvasHeight = 540;
drawingCanvas.width = canvasWidth;
drawingCanvas.height = canvasHeight;
uiCanvas.width = canvasWidth;
uiCanvas.height = canvasHeight;

// ==========================================
// Estado del Juego
// ==========================================
let score = 0;
let lives = 3;
let isGameOver = false;
let isGameStarted = false;

// ==========================================
// Pools de objetos — evitar creación/destrucción constante
// ==========================================
const MAX_FRUITS = 20;
const MAX_PARTICLES = 100;
const MAX_TRAIL_LENGTH = 12;

// Pre-alocar arrays con objetos reutilizables
const fruits = [];
const particlePool = [];
let activeParticles = 0;
const trail = [];

let handPosition = null;
let previousHandPosition = null;

// Throttle para actualizar el DOM
let lastDomUpdate = 0;
const DOM_UPDATE_INTERVAL = 100; // ms

// Throttle para spawn
let lastSpawnTime = 0;
const BASE_SPAWN_INTERVAL = 800; // ms

// emojis de frutas
const FRUIT_TYPES = ['🍎', '🍌', '🍉', '🍇', '🍓', '🍍'];
const BOMB_EMOJI = '💣';

// ==========================================
// Clase Fruit (optimizada)
// ==========================================
class Fruit {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.gravity = 0.35;
        this.radius = 35;
        this.isBomb = false;
        this.emoji = '';
        this.active = false;
        this.rotation = 0;
        this.rotationSpeed = 0;
    }

    init() {
        this.x = Math.random() * (canvasWidth - 100) + 50;
        this.y = canvasHeight + this.radius;
        this.vx = (Math.random() - 0.5) * 7;
        this.vy = -Math.random() * 8 - 15;
        this.gravity = 0.35;
        this.isBomb = Math.random() < 0.15;
        this.emoji = this.isBomb ? BOMB_EMOJI : FRUIT_TYPES[(Math.random() * FRUIT_TYPES.length) | 0];
        this.active = true;
        this.rotation = Math.random() * 6.28;
        this.rotationSpeed = (Math.random() - 0.5) * 0.15;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.rotation += this.rotationSpeed;

        if (this.y > canvasHeight + 80 && this.vy > 0) {
            this.active = false;
            if (!this.isBomb) {
                loseLife();
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        // Sin shadowBlur para rendimiento — usamos glow CSS en el canvas
        ctx.font = '50px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, 0, 0);
        ctx.restore();
    }
}

// ==========================================
// Clase Particle (pool reutilizable)
// ==========================================
class Particle {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.life = 0;
        this.decay = 0;
        this.color = '';
        this.active = false;
    }

    init(x, y, color) {
        const angle = Math.random() * 6.28;
        const speed = Math.random() * 6 + 2;
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1.0;
        this.decay = Math.random() * 0.06 + 0.03;
        this.color = color;
        this.active = true;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.15;
        this.life -= this.decay;
        if (this.life <= 0) {
            this.active = false;
        }
    }

    draw(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - 2, this.y - 2, 4, 4); // fillRect más rápido que arc
    }
}

// Pre-crear pool de partículas
for (let i = 0; i < MAX_PARTICLES; i++) {
    particlePool.push(new Particle());
}

// Pre-crear pool de frutas
for (let i = 0; i < MAX_FRUITS; i++) {
    fruits.push(new Fruit());
}

// ==========================================
// Funciones del juego
// ==========================================
function spawnFruit() {
    if (isGameOver) return;

    const now = performance.now();
    // Intervalo dinámico según score, pero con mínimo
    const interval = Math.max(300, BASE_SPAWN_INTERVAL - score * 5);
    if (now - lastSpawnTime < interval) return;
    lastSpawnTime = now;

    // Buscar fruta inactiva en el pool
    for (let i = 0; i < MAX_FRUITS; i++) {
        if (!fruits[i].active) {
            fruits[i].init();
            return;
        }
    }
}

function getParticle() {
    for (let i = 0; i < MAX_PARTICLES; i++) {
        if (!particlePool[i].active) {
            return particlePool[i];
        }
    }
    return null;
}

function createExplosion(x, y, isBomb) {
    const color = isBomb ? '#ff3333' : '#00ffcc';
    const numParticles = isBomb ? 15 : 8; // Reducido significativamente
    for (let i = 0; i < numParticles; i++) {
        const p = getParticle();
        if (p) p.init(x, y, color);
    }
}

function loseLife() {
    lives--;
    needsDomUpdate = true;
    if (lives <= 0) {
        gameOver();
    }
}

let needsDomUpdate = true;

function gameOver() {
    isGameOver = true;
    gameOverScreen.classList.remove('hidden');
    finalScoreDisplay.textContent = score;
}

function resetAndStartGame() {
    score = 0;
    lives = 3;
    isGameOver = false;
    isGameStarted = true;
    // Desactivar todas las frutas y partículas
    for (let i = 0; i < MAX_FRUITS; i++) fruits[i].active = false;
    for (let i = 0; i < MAX_PARTICLES; i++) particlePool[i].active = false;
    trail.length = 0;
    handPosition = null;
    previousHandPosition = null;
    gameOverScreen.classList.add('hidden');
    startScreen.classList.add('hidden');
    needsDomUpdate = true;
}

startBtn.addEventListener('click', resetAndStartGame);
restartBtn.addEventListener('click', resetAndStartGame);

function updateStatsDOM() {
    scoreDisplay.textContent = score;
    let hearts = '';
    for (let i = 0; i < 3; i++) {
        hearts += i < lives ? '❤️' : '🖤';
    }
    livesDisplay.textContent = hearts;
}

// ==========================================
// Bucle principal — optimizado
// ==========================================
let lastResize = 0;

function gameLoop() {
    requestAnimationFrame(gameLoop);

    // Resize solo cada 500ms (no cada frame)
    const now = performance.now();
    if (now - lastResize > 500) {
        lastResize = now;
        const w = videoElement.clientWidth;
        const h = videoElement.clientHeight;
        if (w > 0 && (drawingCanvas.width !== w || drawingCanvas.height !== h)) {
            canvasWidth = w;
            canvasHeight = h;
            drawingCanvas.width = canvasWidth;
            drawingCanvas.height = canvasHeight;
            uiCanvas.width = canvasWidth;
            uiCanvas.height = canvasHeight;
        }
    }

    drawingCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    uiCtx.clearRect(0, 0, canvasWidth, canvasHeight);

    if (isGameOver || !isGameStarted) return;

    // Spawn
    spawnFruit();

    // Actualizar y dibujar Frutas (sin splice, iterar el pool)
    for (let i = 0; i < MAX_FRUITS; i++) {
        const f = fruits[i];
        if (!f.active) continue;
        f.update();
        if (f.active) f.draw(drawingCtx);
    }

    // Actualizar y dibujar Partículas (sin splice, pool fijo)
    drawingCtx.save();
    for (let i = 0; i < MAX_PARTICLES; i++) {
        const p = particlePool[i];
        if (!p.active) continue;
        p.update();
        if (p.active) p.draw(drawingCtx);
    }
    drawingCtx.globalAlpha = 1;
    drawingCtx.restore();

    // Trail y colisiones
    if (handPosition) {
        trail.push({ x: handPosition.x, y: handPosition.y });
        if (trail.length > MAX_TRAIL_LENGTH) {
            trail.shift();
        }
        drawTrail(uiCtx, trail);
        checkCollisions();
    } else if (trail.length > 0) {
        trail.shift();
        if (trail.length > 1) drawTrail(uiCtx, trail);
    }

    // Actualizar DOM solo cuando necesario y no cada frame
    if (needsDomUpdate && now - lastDomUpdate > DOM_UPDATE_INTERVAL) {
        updateStatsDOM();
        needsDomUpdate = false;
        lastDomUpdate = now;
    }
}

gameLoop();

// ==========================================
// Trail — simplificado sin shadowBlur
// ==========================================
function drawTrail(ctx, points) {
    if (points.length < 2) return;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
        const xc = (points[i].x + points[i - 1].x) / 2;
        const yc = (points[i].y + points[i - 1].y) / 2;
        ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);

    // Estilo neón sin shadowBlur (mucho más rápido)
    // Borde grueso translúcido primero
    ctx.strokeStyle = 'rgba(0, 170, 255, 0.3)';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Línea central blanca
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();
}

// ==========================================
// Colisiones — optimizado
// ==========================================
function dist2(v, w) { return (v.x - w.x) ** 2 + (v.y - w.y) ** 2; }

function distToSegment(p, v, w) {
    const l2 = dist2(v, w);
    if (l2 === 0) return Math.sqrt(dist2(p, v));
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.sqrt(dist2(p, { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) }));
}

function checkCollisions() {
    if (trail.length < 2 || isGameOver) return;

    const p1 = trail[trail.length - 2];
    const p2 = trail[trail.length - 1];

    for (let i = 0; i < MAX_FRUITS; i++) {
        const f = fruits[i];
        if (!f.active) continue;

        const dist = distToSegment(f, p1, p2);

        if (dist < f.radius + 15) {
            f.active = false;
            createExplosion(f.x, f.y, f.isBomb);

            if (f.isBomb) {
                // Flash rojo (sin save/restore extra)
                uiCtx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                uiCtx.fillRect(0, 0, canvasWidth, canvasHeight);
                loseLife();
            } else {
                score += 10;
                needsDomUpdate = true;

                // Animación score con CSS en vez de setTimeout
                scoreDisplay.style.transform = 'scale(1.5)';
                scoreDisplay.style.color = '#fff';
                clearTimeout(scoreDisplay._timeout);
                scoreDisplay._timeout = setTimeout(() => {
                    scoreDisplay.style.transform = 'scale(1)';
                    scoreDisplay.style.color = '#ffcc00';
                }, 200);
            }
        }
    }
}


// ==========================================
// CONFIGURACIÓN DE IA (MediaPipe Hands) — OPTIMIZADA
// ==========================================
const hands = new Hands({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`;
    }
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 0,          // 🔑 CAMBIO CLAVE: 0 en vez de 1 (mucho más rápido)
    minDetectionConfidence: 0.5,  // Bajado para mejor detección en más condiciones
    minTrackingConfidence: 0.4    // Bajado para menos re-detecciones
});

// Badge update throttle
let lastBadgeUpdate = 0;
let lastBadgeState = '';

hands.onResults((results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];

        // ❌ ELIMINADO: drawConnectors — costoso y puramente decorativo
        // drawConnectors(uiCtx, landmarks, HAND_CONNECTIONS, ...)

        const indexTip = landmarks[8];
        const newPos = {
            x: indexTip.x * canvasWidth,
            y: indexTip.y * canvasHeight
        };

        // 🟢 Indicador visual de dónde se detecta la mano
        uiCtx.save();
        uiCtx.fillStyle = '#00ff88';
        uiCtx.shadowColor = '#00ff88';
        uiCtx.shadowBlur = 15;
        uiCtx.beginPath();
        uiCtx.arc(newPos.x, newPos.y, 12, 0, Math.PI * 2);
        uiCtx.fill();
        uiCtx.restore();

        previousHandPosition = handPosition;
        handPosition = newPos;

        // Actualizar badge solo cuando cambie el estado
        const now = performance.now();
        if (lastBadgeState !== 'playing' && now - lastBadgeUpdate > 500) {
            modeBadge.textContent = "¡Juega cortando la fruta!";
            modeBadge.style.boxShadow = "0 0 15px rgba(0, 170, 255, 0.5)";
            modeBadge.style.borderColor = "var(--accent)";
            lastBadgeState = 'playing';
            lastBadgeUpdate = now;
        }

    } else {
        handPosition = null;
        previousHandPosition = null;

        const now = performance.now();
        if (lastBadgeState !== 'searching' && now - lastBadgeUpdate > 500) {
            modeBadge.textContent = "Buscando mano en cámara...";
            modeBadge.style.boxShadow = "none";
            modeBadge.style.borderColor = "var(--glass-border)";
            lastBadgeState = 'searching';
            lastBadgeUpdate = now;
        }
    }
});

const camera = new Camera(videoElement, {
    onFrame: async () => {
        try {
            await hands.send({ image: videoElement });
        } catch (e) {
            console.warn('Error procesando frame:', e);
        }
    },
    width: 640,    // 🔑 Reducido de 1280 — la mitad de píxeles = mucho más rápido
    height: 480    // 🔑 Reducido de 720
});

camera.start()
    .then(() => {
        console.log('✅ Cámara iniciada correctamente');
        modeBadge.textContent = "Cámara lista. ¡Muestra tu mano! 🖐️";
    })
    .catch(err => {
        console.error("❌ Error al acceder a la cámara:", err);
        modeBadge.textContent = "❌ Error: Por favor permite el acceso a la cámara.";
        modeBadge.style.color = "#ff4d4d";
    });
