// Referencias a los elementos de la página
const videoElement = document.querySelector('.input_video');
const drawingCanvas = document.querySelector('.drawing_canvas');
const drawingCtx = drawingCanvas.getContext('2d');
const uiCanvas = document.querySelector('.ui_canvas');
const uiCtx = uiCanvas.getContext('2d');
const modeBadge = document.getElementById('current-mode');

// Controles
const colorButtons = document.querySelectorAll('.color-btn');
const clearBtn = document.getElementById('clear-btn');
const brushSizeInput = document.getElementById('brush-size');
const thicknessDisplay = document.getElementById('thickness-display');

// Variables de estado del pincel
let canvasWidth = 1280;
let canvasHeight = 720;
drawingCanvas.width = canvasWidth;
drawingCanvas.height = canvasHeight;
uiCanvas.width = canvasWidth;
uiCanvas.height = canvasHeight;

let isDrawing = false;
let lastX = 0;
let lastY = 0;
let currentColor = '#00ffcc';
let brushSize = parseInt(brushSizeInput.value);
let clearHoverStartTime = 0;

// Configurar los botones de colores
colorButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remover clase active de todos y dejarla solo en el clickeado
        colorButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentColor = btn.dataset.color;
        
        // Actualizar la bolita en los botones al color seleccionado
        brushSizeInput.style.accentColor = currentColor;
    });
});

// Configurar el slider de grosor
brushSizeInput.addEventListener('input', (e) => {
    brushSize = parseInt(e.target.value);
    thicknessDisplay.textContent = brushSize;
});

// Función para limpiar la pantalla manualmente o por gesto
function clearScreen() {
    drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    modeBadge.textContent = "✨ ¡Lienzo mágico limpio!";
    modeBadge.style.color = "#ff4d4d";
    modeBadge.style.boxShadow = "0 0 30px rgba(255, 77, 77, 0.8)";
    
    // Restaurar estilo normal después de un segundo
    setTimeout(() => {
        modeBadge.style.color = "white";
        modeBadge.style.boxShadow = "none";
    }, 1500);
}

clearBtn.addEventListener('click', clearScreen);

// ==========================================
// CONFIGURACIÓN DE IA (MediaPipe Hands)
// ==========================================
const hands = new Hands({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }
});

hands.setOptions({
    maxNumHands: 1, // Solo detectaremos 1 mano a la vez para este proyecto
    modelComplexity: 1, // 0 es el más rápido, 1 es equilibrado
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
});

// onResults es la función que se llama cada vez que la cámara procesa una imagen
hands.onResults(onResults);

// Inicializar la cámara para que envíe fotogramas al modelo de manos
const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({ image: videoElement });
    },
    width: 1280,
    height: 720
});

camera.start()
    .then(() => {
        modeBadge.textContent = "Cámara lista. ¡Muestra tu mano!";
    })
    .catch(err => {
        console.error("Error al acceder a la cámara:", err);
        modeBadge.textContent = "Error: Por favor permite el acceso a la cámara.";
        modeBadge.style.color = "#ff4d4d";
    });

// Convierte las coordenadas que nos da la IA entre 0.0 y 1.0 a píxeles exactos del Canvas
function getPixelCoords(landmark) {
    return {
        // En un dispositivo espejo interactivo, la posición visual de MediaPipe 
        // multiplicada por el ancho encaja perfectamente con un Canvas que tiene CSS transform: scaleX(-1)
        x: landmark.x * canvasWidth, 
        y: landmark.y * canvasHeight
    };
}

// ==========================================
// LÓGICA PRINCIPAL DEL PROYECTO
// ==========================================
function onResults(results) {
    // 1. Asegurarnos que el Canvas ocupa todo el espacio de su contenedor responsivo
    if (drawingCanvas.width !== videoElement.clientWidth && videoElement.clientWidth > 0) {
        // Solo recalcular al cambiar tamaño de la ventana
        const oldImage = drawingCtx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height);
        
        canvasWidth = videoElement.clientWidth;
        canvasHeight = videoElement.clientHeight;
        drawingCanvas.width = canvasWidth;
        drawingCanvas.height = canvasHeight;
        uiCanvas.width = canvasWidth;
        uiCanvas.height = canvasHeight;
        
        drawingCtx.putImageData(oldImage, 0, 0); // Preservar el dibujo
    }

    // 2. Limpiar el lienzo de UI animada (donde mostramos puntos y cursores)
    uiCtx.clearRect(0, 0, uiCanvas.width, uiCanvas.height);

    // 3. Analizar la mano detectada
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];

        // Dibujar un esqueleto futurista transparente sobre la mano (Le da credibilidad tipo "Feria de Ciencias")
        drawConnectors(uiCtx, landmarks, HAND_CONNECTIONS, { color: 'rgba(255, 255, 255, 0.2)', lineWidth: 2 });
        drawLandmarks(uiCtx, landmarks, { color: 'rgba(255,255,255,0.4)', lineWidth: 1, radius: 2 });

        // Identificar los dedos
        const indexTip = landmarks[8];
        const indexPip = landmarks[6];  // Nudillo medio del índice
        const middleTip = landmarks[12];
        const middlePip = landmarks[10];
        const ringTip = landmarks[16];
        const ringPip = landmarks[14];
        const pinkyTip = landmarks[20];
        const pinkyPip = landmarks[18];

        // Regla matemática: si la y de la punta del dedo es MENOR a la de su nudillo, el dedo está "arriba"
        const isIndexUp = indexTip.y < indexPip.y;
        const isMiddleUp = middleTip.y < middlePip.y;
        const isRingUp = ringTip.y < ringPip.y;
        const isPinkyUp = pinkyTip.y < pinkyPip.y;

        const coords = getPixelCoords(indexTip);

        // -- MÁQUINA DE ESTADOS (Gestos) --

        // ESTADO 1: Borrador Mágico (Los 4 dedos principales arriba: mano abierta)
        if (isIndexUp && isMiddleUp && isRingUp && isPinkyUp) {
            modeBadge.textContent = "🖐️ Borrador mágico (Mantén para borrar)...";
            modeBadge.style.boxShadow = "0 0 20px rgba(255, 77, 77, 0.8)";
            isDrawing = false;
            
            // Animación de carga para borrar
            uiCtx.beginPath();
            uiCtx.arc(coords.x, coords.y, 40, 0, 2 * Math.PI);
            uiCtx.fillStyle = "rgba(255, 77, 77, 0.4)";
            uiCtx.fill();

            if (clearHoverStartTime === 0) {
                clearHoverStartTime = Date.now();
            } else if (Date.now() - clearHoverStartTime > 1500) { 
                // Si la mano estuvo abierta en pantalla por 1.5 segundos
                clearScreen();
                clearHoverStartTime = 0;
            }
        } 
        // ESTADO 2: Modo Dibujo (Solo Índice y Medio arriba)
        else if (isIndexUp && isMiddleUp && !isRingUp) {
            clearHoverStartTime = 0;
            modeBadge.textContent = "✌️ Dibujando";
            modeBadge.style.boxShadow = `0 0 25px ${currentColor}`;

            // Dibujar el punto donde estamos dibujando en tiempo real
            uiCtx.beginPath();
            uiCtx.arc(coords.x, coords.y, brushSize, 0, 2 * Math.PI);
            uiCtx.fillStyle = currentColor;
            uiCtx.fill();

            if (!isDrawing) {
                // Acabamos de subir el dedo medio, empezar trazo
                isDrawing = true;
                lastX = coords.x;
                lastY = coords.y;
            } else {
                // Ya estábamos dibujando, continuar el trazo conectando con una línea
                drawingCtx.beginPath();
                drawingCtx.moveTo(lastX, lastY);
                drawingCtx.lineTo(coords.x, coords.y);
                
                // Estilo "Premium / Neón"
                drawingCtx.strokeStyle = currentColor;
                drawingCtx.lineWidth = brushSize * 2;
                drawingCtx.lineCap = 'round';
                drawingCtx.lineJoin = 'round';
                drawingCtx.shadowBlur = Math.min(25, brushSize * 3);
                drawingCtx.shadowColor = currentColor;
                
                drawingCtx.stroke();

                // Actualizar posiciones
                lastX = coords.x;
                lastY = coords.y;
            }
        } 
        // ESTADO 3: Modo Puntero (Solo Índice arriba)
        else if (isIndexUp && !isMiddleUp && !isRingUp) {
            clearHoverStartTime = 0;
            modeBadge.textContent = "☝️ Apuntando";
            modeBadge.style.boxShadow = "0 0 15px rgba(255, 255, 255, 0.5)";
            isDrawing = false; // Levantamos la "pluma"

            // Dibujar un puntero "holográfico" vacío indicando mira/hover
            uiCtx.beginPath();
            uiCtx.arc(coords.x, coords.y, 10, 0, 2 * Math.PI);
            uiCtx.strokeStyle = "white";
            uiCtx.lineWidth = 2;
            uiCtx.stroke();
            uiCtx.beginPath();
            uiCtx.arc(coords.x, coords.y, 4, 0, 2 * Math.PI);
            uiCtx.fillStyle = currentColor;
            uiCtx.fill();
        } 
        // OTROS ESTADOS (Puño cerrado, posturas sin definir)
        else {
            clearHoverStartTime = 0;
            isDrawing = false;
            modeBadge.textContent = "✊ Pausado";
            modeBadge.style.boxShadow = "none";
        }
    } else {
        // No hay manos en la pantalla
        isDrawing = false;
        clearHoverStartTime = 0;
        modeBadge.textContent = "Buscando mano en cámara...";
        modeBadge.style.boxShadow = "none";
        modeBadge.style.color = "var(--text-muted)";
    }
}
