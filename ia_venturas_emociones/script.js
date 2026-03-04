// Referencias al DOM
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const statusIndicator = document.getElementById('current-mode');

// Referencias a UI
const mainEmotionEmoji = document.querySelector('.emoji-circle');
const mainEmotionText = document.querySelector('.emotion-text');
const emotionDisplayBox = document.getElementById('main-emotion');
const joyLvlBar = document.getElementById('joy-lvl');
const surpriseLvlBar = document.getElementById('surprise-lvl');

// Variables para distancias base (calibración simple)
let initialMouthWidth = null;
let initialMouthHeight = null;

// Función para calcular la distancia EUCLIDEANA entre 2 puntos
function calculateDistance(point1, point2) {
    return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
}

// Analizar la expresión facial basado en métricas
function analyzeExpression(landmarks) {
    // Puntos anatómicos importantes en la red Face Mesh
    // 61: Comisura boca izquierda, 291: Comisura boca derecha (Ancho de sonrisa)
    // 13: Labio superior (centro), 14: Labio inferior (centro) (Apertura de boca)
    // 159: Ojoizq párpado superior, 145: Ojoizq párpado inferior (Apertura de ojo, futuro uso)

    const mouthLeft = landmarks[61];
    const mouthRight = landmarks[291];
    const mouthTop = landmarks[13];
    const mouthBot = landmarks[14];
    const nose = landmarks[1]; // Referencia para normalizar distancia por escala de rostro
    const chin = landmarks[152];

    const faceScale = calculateDistance(nose, chin); // escalar porqué tan cerca está la persona

    // Distancias brutas
    const mouthWidth = calculateDistance(mouthLeft, mouthRight) / faceScale;
    const mouthHeight = calculateDistance(mouthTop, mouthBot) / faceScale;

    // Calibrar la primera vez que vemos el rostro
    if (!initialMouthWidth) initialMouthWidth = mouthWidth;
    if (!initialMouthHeight) initialMouthHeight = mouthHeight;

    // Calcular índices relativos
    // Si la boca es más ancha que su estado relajado (neutro), está sonriendo
    // Si la boca está muy abierta verticalmente, está sorprendido
    let joyIndex = Math.max(0, (mouthWidth - initialMouthWidth) * 15);
    let surpriseIndex = Math.max(0, (mouthHeight - 0.05) * 12); // .05 es umbral boca cerrada

    // Limitar valores entre 0 y 1
    joyIndex = Math.min(1, joyIndex);
    surpriseIndex = Math.min(1, surpriseIndex);

    updateUI(joyIndex, surpriseIndex);
}

// Actualizar Dashboard visualmente
function updateUI(joyLvl, surpriseLvl) {
    // Actualizar barras
    joyLvlBar.style.width = (joyLvl * 100) + '%';
    surpriseLvlBar.style.width = (surpriseLvl * 100) + '%';

    // Determinar la emoción dominante
    if (surpriseLvl > 0.4) {
        mainEmotionEmoji.textContent = "😲";
        mainEmotionText.textContent = "Sorpresa";
        mainEmotionText.style.color = "#f59e0b";
        emotionDisplayBox.className = "emotion-display surprised";
        mainEmotionEmoji.style.transform = "scale(1.2)";
    } else if (joyLvl > 0.3) {
        mainEmotionEmoji.textContent = "😁";
        mainEmotionText.textContent = "Alegría";
        mainEmotionText.style.color = "#10b981";
        emotionDisplayBox.className = "emotion-display joyful";
        mainEmotionEmoji.style.transform = "scale(1.1) rotate(5deg)";
    } else {
        mainEmotionEmoji.textContent = "😐";
        mainEmotionText.textContent = "Neutro";
        mainEmotionText.style.color = "#8b5cf6";
        emotionDisplayBox.className = "emotion-display";
        mainEmotionEmoji.style.transform = "scale(1)";
    }
}

// Evento disparado cada vez que MediaPipe procesa un nuevo frame
function onResults(results) {
    // Actualizar tamaño de canvas al tamaño real de video para dibujar encima correctamente
    if (canvasElement.width !== videoElement.videoWidth) {
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
    }

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // Dibujar la imagen de la cámara
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        // Encontramos una cara
        const landmarks = results.multiFaceLandmarks[0];

        // Efecto visual: solo ojos y labios (TESSELATION removido por rendimiento)
        drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYE, { color: 'rgba(16, 185, 129, 0.4)' });
        drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYE, { color: 'rgba(16, 185, 129, 0.4)' });
        drawConnectors(canvasCtx, landmarks, FACEMESH_LIPS, { color: 'rgba(236, 72, 153, 0.8)' });

        // Analizar e interpretar puntos clave
        analyzeExpression(landmarks);
    } else {
        // No hay rostro y resetear estado inicial si el usuario sale en marco
        initialMouthWidth = null;
        initialMouthHeight = null;
    }
    canvasCtx.restore();
}

// Configurar MediaPipe Face Mesh
const faceMesh = new FaceMesh({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
    }
});

faceMesh.setOptions({
    maxNumFaces: 1, // Solo procesamos a la persona que vemos de cerca
    refineLandmarks: true, // Mejor precisión en labios y ojos
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

faceMesh.onResults(onResults);

// Inicializar y vincular la cámara al FaceMesh
const camera = new Camera(videoElement, {
    onFrame: async () => {
        await faceMesh.send({ image: videoElement });
    },
    width: 640,
    height: 480
});

// Arrancar proceso y quitar indicador de carga
camera.start().then(() => {
    statusIndicator.textContent = "👁️ IA Lista (Rastreando Rostro)";
    statusIndicator.className = "mode-badge";
    statusIndicator.style.background = "rgba(16, 185, 129, 0.8)";
}).catch(err => {
    console.error("Error de cámara:", err);
    statusIndicator.textContent = "❌ Error: Permite la cámara";
    statusIndicator.className = "mode-badge loading";
});
