// Referencias al DOM
const video = document.getElementById('video');
const resultElement = document.getElementById('result');
const probabilityBar = document.getElementById('probability-bar');
const probabilityText = document.getElementById('probability');
const statusBadge = document.getElementById('status-badge');

let classifier;

// Inicializar la cámara web
async function setupCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: 640, height: 480 }
        });
        video.srcObject = stream;

        return new Promise((resolve) => {
            video.onloadedmetadata = () => {
                resolve(video);
            };
        });
    } catch (error) {
        console.error("Error al acceder a la cámara:", error);
        statusBadge.textContent = "Error de cámara";
        statusBadge.className = "mode-badge loading";
        statusBadge.style.color = "#ef4444";
        statusBadge.style.borderColor = "#ef4444";
        statusBadge.style.background = "rgba(239, 68, 68, 0.2)";
        alert("Por favor, permite el acceso a la cámara para usar el Reconocedor Visual.");
    }
}

// Cargar el modelo de Image Classification
function loadModel() {
    // Usamos MobileNet pre-entrenado
    classifier = ml5.imageClassifier('MobileNet', video, modelLoaded);
}

// Callback cuando el modelo se carga
function modelLoaded() {
    console.log('¡Modelo MobileNet cargado!');
    statusBadge.textContent = "IA Lista y Observando";
    statusBadge.className = "mode-badge ready";

    // Iniciar la clasificación continua
    classifyVideo();
}

// Función para clasificar lo que ve la cámara
function classifyVideo() {
    // Solo clasificar si el video tiene datos cargados
    if (video.readyState >= 2) {
        classifier.classify(video, gotResult);
    } else {
        // Si no está listo, intentar de nuevo en el siguiente frame
        requestAnimationFrame(classifyVideo);
    }
}

// Diccionario extenso para traducir etiquetas de MobileNet al español
const translations = {
    // === ELECTRÓNICOS Y TECNOLOGÍA ===
    "cellular telephone": "Teléfono Celular",
    "cell phone": "Teléfono Celular",
    "smartphone": "Teléfono Inteligente",
    "computer keyboard": "Teclado de Computadora",
    "keyboard": "Teclado",
    "mouse": "Ratón de Computadora",
    "laptop": "Computadora Portátil",
    "notebook": "Computadora Portátil",
    "desktop computer": "Computadora de Escritorio",
    "monitor": "Monitor",
    "screen": "Pantalla",
    "television": "Televisión",
    "tv": "Televisión",
    "remote control": "Control Remoto",
    "iPod": "Reproductor de Música",
    "headphone": "Audífonos",
    "earphone": "Audífonos",
    "speaker": "Bocina",
    "loudspeaker": "Bocina",
    "microphone": "Micrófono",
    "camera": "Cámara",
    "digital clock": "Reloj Digital",
    "analog clock": "Reloj Analógico",
    "wall clock": "Reloj de Pared",
    "calculator": "Calculadora",
    "printer": "Impresora",
    "joystick": "Control de Videojuegos",
    "hard disc": "Disco Duro",
    "modem": "Módem",
    "web site": "Página Web",
    "projector": "Proyector",

    // === OBJETOS DE ESCRITORIO Y ESCUELA ===
    "pen": "Bolígrafo",
    "pencil": "Lápiz",
    "ballpoint": "Bolígrafo",
    "fountain pen": "Pluma Fuente",
    "pencil sharpener": "Sacapuntas",
    "rubber eraser": "Borrador",
    "eraser": "Borrador",
    "ruler": "Regla",
    "scissors": "Tijeras",
    "envelope": "Sobre",
    "book": "Libro",
    "bookcase": "Librero",
    "bookshop": "Librería",
    "notebook computer": "Laptop",
    "binder": "Carpeta",
    "paper towel": "Toalla de Papel",
    "tissue": "Pañuelo",
    "stapler": "Engrapadora",
    "tape": "Cinta",
    "pencil box": "Lapicera",
    "crayon": "Crayón",
    "marker": "Marcador",

    // === ROPA Y ACCESORIOS ===
    "sunglasses": "Gafas de Sol",
    "sunglass": "Gafas de Sol",
    "glasses": "Lentes",
    "watch": "Reloj",
    "digital watch": "Reloj Digital",
    "wallet": "Billetera",
    "backpack": "Mochila",
    "purse": "Bolsa",
    "handbag": "Bolsa de Mano",
    "umbrella": "Paraguas",
    "hat": "Sombrero",
    "cap": "Gorra",
    "baseball cap": "Gorra de Béisbol",
    "cowboy hat": "Sombrero Vaquero",
    "sombrero": "Sombrero",
    "shoe": "Zapato",
    "running shoe": "Tenis",
    "sneaker": "Tenis",
    "boot": "Bota",
    "sandal": "Sandalia",
    "sock": "Calcetín",
    "shirt": "Camisa",
    "t-shirt": "Playera",
    "jersey": "Jersey",
    "jean": "Jeans",
    "jacket": "Chaqueta",
    "coat": "Abrigo",
    "suit": "Traje",
    "tie": "Corbata",
    "bow tie": "Moño",
    "scarf": "Bufanda",
    "glove": "Guante",
    "mitten": "Mitón",
    "mask": "Máscara",
    "ski mask": "Pasamontañas",
    "necklace": "Collar",
    "ring": "Anillo",
    "earring": "Arete",
    "wig": "Peluca",
    "swimsuit": "Traje de Baño",
    "bikini": "Bikini",
    "diaper": "Pañal",
    "apron": "Delantal",

    // === CASA Y MUEBLES ===
    "chair": "Silla",
    "table": "Mesa",
    "desk": "Escritorio",
    "couch": "Sofá",
    "sofa": "Sofá",
    "bed": "Cama",
    "pillow": "Almohada",
    "lamp": "Lámpara",
    "desk lamp": "Lámpara de Escritorio",
    "table lamp": "Lámpara de Mesa",
    "chandelier": "Candelabro",
    "mirror": "Espejo",
    "curtain": "Cortina",
    "window shade": "Persiana",
    "door": "Puerta",
    "window": "Ventana",
    "wardrobe": "Armario",
    "chest": "Cofre",
    "drawer": "Cajón",
    "shelf": "Estante",
    "vase": "Florero",
    "flower pot": "Maceta",
    "flowerpot": "Maceta",
    "clock": "Reloj",
    "candle": "Vela",
    "fan": "Ventilador",
    "electric fan": "Ventilador Eléctrico",
    "radiator": "Radiador",
    "toilet seat": "Inodoro",
    "bathtub": "Bañera",
    "shower curtain": "Cortina de Baño",
    "washbasin": "Lavabo",
    "soap dispenser": "Dispensador de Jabón",
    "doormat": "Tapete",
    "welcome mat": "Tapete de Bienvenida",

    // === COCINA Y COMIDA ===
    "coffee mug": "Taza de Café",
    "cup": "Taza",
    "mug": "Taza",
    "water bottle": "Botella de Agua",
    "bottle": "Botella",
    "wine bottle": "Botella de Vino",
    "beer bottle": "Botella de Cerveza",
    "beer glass": "Vaso de Cerveza",
    "wine glass": "Copa de Vino",
    "goblet": "Copa",
    "plate": "Plato",
    "bowl": "Tazón",
    "fork": "Tenedor",
    "knife": "Cuchillo",
    "spoon": "Cuchara",
    "spatula": "Espátula",
    "ladle": "Cucharón",
    "can opener": "Abrelatas",
    "corkscrew": "Sacacorchos",
    "frying pan": "Sartén",
    "pan": "Sartén",
    "pot": "Olla",
    "wok": "Wok",
    "kettle": "Tetera",
    "toaster": "Tostadora",
    "microwave": "Microondas",
    "oven": "Horno",
    "refrigerator": "Refrigerador",
    "stove": "Estufa",
    "dishwasher": "Lavavajillas",
    "mixing bowl": "Tazón para Mezclar",
    "measuring cup": "Taza Medidora",
    "banana": "Plátano",
    "apple": "Manzana",
    "orange": "Naranja",
    "lemon": "Limón",
    "strawberry": "Fresa",
    "pineapple": "Piña",
    "grapes": "Uvas",
    "watermelon": "Sandía",
    "mango": "Mango",
    "peach": "Durazno",
    "pear": "Pera",
    "cherry": "Cereza",
    "fig": "Higo",
    "pomegranate": "Granada",
    "broccoli": "Brócoli",
    "carrot": "Zanahoria",
    "corn": "Maíz",
    "ear": "Oreja",
    "mushroom": "Hongo",
    "pizza": "Pizza",
    "hamburger": "Hamburguesa",
    "cheeseburger": "Hamburguesa con Queso",
    "hot dog": "Hot Dog",
    "sandwich": "Sándwich",
    "taco": "Taco",
    "burrito": "Burrito",
    "ice cream": "Helado",
    "cake": "Pastel",
    "cookie": "Galleta",
    "chocolate": "Chocolate",
    "candy": "Dulce",
    "lollipop": "Paleta",
    "pretzel": "Pretzel",
    "dough": "Masa",
    "bread": "Pan",
    "bagel": "Bagel",
    "French loaf": "Pan Francés",
    "meat loaf": "Pastel de Carne",
    "egg": "Huevo",
    "cheese": "Queso",
    "butter": "Mantequilla",
    "milk": "Leche",
    "juice": "Jugo",
    "coffee": "Café",
    "tea": "Té",
    "food": "Comida",
    "grocery store": "Tienda de Abarrotes",
    "espresso": "Café Espresso",

    // === ANIMALES ===
    "dog": "Perro",
    "cat": "Gato",
    "bird": "Pájaro",
    "fish": "Pez",
    "goldfish": "Pez Dorado",
    "shark": "Tiburón",
    "whale": "Ballena",
    "dolphin": "Delfín",
    "turtle": "Tortuga",
    "snake": "Serpiente",
    "frog": "Rana",
    "lizard": "Lagartija",
    "spider": "Araña",
    "butterfly": "Mariposa",
    "bee": "Abeja",
    "ant": "Hormiga",
    "fly": "Mosca",
    "mosquito": "Mosquito",
    "rabbit": "Conejo",
    "hamster": "Hámster",
    "horse": "Caballo",
    "cow": "Vaca",
    "pig": "Cerdo",
    "sheep": "Oveja",
    "goat": "Cabra",
    "chicken": "Gallina",
    "rooster": "Gallo",
    "duck": "Pato",
    "eagle": "Águila",
    "owl": "Búho",
    "parrot": "Loro",
    "penguin": "Pingüino",
    "bear": "Oso",
    "lion": "León",
    "tiger": "Tigre",
    "elephant": "Elefante",
    "monkey": "Mono",
    "gorilla": "Gorila",
    "zebra": "Cebra",
    "giraffe": "Jirafa",
    "deer": "Venado",
    "wolf": "Lobo",
    "fox": "Zorro",
    "squirrel": "Ardilla",
    "mouse pad": "Alfombrilla de Ratón",
    "golden retriever": "Golden Retriever",
    "labrador": "Labrador",
    "poodle": "Caniche",
    "German shepherd": "Pastor Alemán",
    "Chihuahua": "Chihuahua",
    "tabby": "Gato Atigrado",
    "tabby cat": "Gato Atigrado",
    "Persian cat": "Gato Persa",
    "Siamese cat": "Gato Siamés",
    "Egyptian cat": "Gato Egipcio",

    // === VEHÍCULOS Y TRANSPORTE ===
    "car": "Auto",
    "bicycle": "Bicicleta",
    "motorcycle": "Motocicleta",
    "bus": "Autobús",
    "truck": "Camión",
    "airplane": "Avión",
    "helicopter": "Helicóptero",
    "boat": "Barco",
    "train": "Tren",
    "taxi": "Taxi",
    "ambulance": "Ambulancia",
    "fire engine": "Camión de Bomberos",
    "police van": "Patrulla",
    "school bus": "Camión Escolar",
    "minivan": "Minivan",
    "sports car": "Auto Deportivo",
    "convertible": "Convertible",
    "limousine": "Limosina",
    "jeep": "Jeep",
    "tractor": "Tractor",
    "shopping cart": "Carrito de Compras",
    "wheelchair": "Silla de Ruedas",
    "stroller": "Carriola",
    "scooter": "Scooter",
    "skateboard": "Patineta",
    "sled": "Trineo",
    "canoe": "Canoa",
    "sailboat": "Velero",
    "speedboat": "Lancha",

    // === DEPORTES Y JUGUETES ===
    "soccer ball": "Balón de Fútbol",
    "basketball": "Balón de Basquetbol",
    "baseball": "Pelota de Béisbol",
    "tennis ball": "Pelota de Tenis",
    "volleyball": "Balón de Voleibol",
    "football": "Balón de Fútbol Americano",
    "golf ball": "Pelota de Golf",
    "ping-pong ball": "Pelota de Ping Pong",
    "racket": "Raqueta",
    "tennis racket": "Raqueta de Tenis",
    "bat": "Bate",
    "ball": "Pelota",
    "balloon": "Globo",
    "kite": "Papalote",
    "teddy": "Oso de Peluche",
    "teddy bear": "Oso de Peluche",
    "doll": "Muñeca",
    "puzzle": "Rompecabezas",
    "toy": "Juguete",
    "Rubik's cube": "Cubo de Rubik",
    "Lego": "Lego",
    "yo-yo": "Yoyo",
    "frisbee": "Frisbee",
    "swing": "Columpio",
    "slide": "Resbaladilla",
    "trampoline": "Trampolín",
    "drum": "Tambor",
    "guitar": "Guitarra",
    "acoustic guitar": "Guitarra Acústica",
    "electric guitar": "Guitarra Eléctrica",
    "piano": "Piano",
    "violin": "Violín",
    "flute": "Flauta",
    "trumpet": "Trompeta",
    "harmonica": "Armónica",
    "organ": "Órgano",
    "saxophone": "Saxofón",
    "maraca": "Maraca",

    // === HERRAMIENTAS ===
    "hammer": "Martillo",
    "screwdriver": "Desarmador",
    "wrench": "Llave Inglesa",
    "plunger": "Destapacaños",
    "shovel": "Pala",
    "broom": "Escoba",
    "mop": "Trapeador",
    "paintbrush": "Brocha",
    "bucket": "Cubeta",
    "chain": "Cadena",
    "nail": "Clavo",
    "screw": "Tornillo",
    "drill": "Taladro",
    "saw": "Sierra",
    "tape measure": "Cinta Métrica",
    "flashlight": "Linterna",
    "torch": "Linterna",
    "lighter": "Encendedor",
    "key": "Llave",
    "keys": "Llaves",
    "lock": "Candado",
    "padlock": "Candado",
    "magnet": "Imán",

    // === NATURALEZA ===
    "flower": "Flor",
    "rose": "Rosa",
    "sunflower": "Girasol",
    "daisy": "Margarita",
    "tree": "Árbol",
    "leaf": "Hoja",
    "grass": "Pasto",
    "rock": "Piedra",
    "mountain": "Montaña",
    "ocean": "Océano",
    "beach": "Playa",
    "river": "Río",
    "lake": "Lago",
    "cloud": "Nube",
    "sun": "Sol",
    "moon": "Luna",
    "star": "Estrella",
    "rain": "Lluvia",
    "snow": "Nieve",
    "volcano": "Volcán",

    // === OTROS OBJETOS COMUNES ===
    "face": "Cara",
    "hand": "Mano",
    "person": "Persona",
    "people": "Personas",
    "baby": "Bebé",
    "boy": "Niño",
    "girl": "Niña",
    "man": "Hombre",
    "woman": "Mujer",
    "picture frame": "Marco de Foto",
    "painting": "Pintura",
    "poster": "Póster",
    "flag": "Bandera",
    "sign": "Letrero",
    "traffic light": "Semáforo",
    "mailbox": "Buzón",
    "trash can": "Bote de Basura",
    "plastic bag": "Bolsa de Plástico",
    "box": "Caja",
    "cardboard": "Cartón",
    "rope": "Cuerda",
    "string": "Hilo",
    "rubber band": "Liga",
    "safety pin": "Seguro",
    "coin": "Moneda",
    "money": "Dinero",
    "credit card": "Tarjeta de Crédito",
    "calendar": "Calendario",
    "map": "Mapa",
    "compass": "Brújula",
    "magnifying glass": "Lupa",
    "hourglass": "Reloj de Arena",
    "torch": "Linterna",
    "fire": "Fuego",
    "smoke": "Humo",
    "water": "Agua",
    "ice": "Hielo",
    "medicine": "Medicina",
    "pill": "Pastilla",
    "Band Aid": "Curita",
    "stethoscope": "Estetoscopio",
    "syringe": "Jeringa",
    "thermometer": "Termómetro",
    "soap": "Jabón",
    "toothbrush": "Cepillo de Dientes",
    "toothpaste": "Pasta de Dientes",
    "comb": "Peine",
    "hairbrush": "Cepillo de Cabello",
    "perfume": "Perfume",
    "lipstick": "Labial",
    "nail polish": "Esmalte de Uñas",
    "hand towel": "Toalla de Mano",
    "bath towel": "Toalla de Baño",
    "sleeping bag": "Bolsa de Dormir",
    "tent": "Tienda de Campaña",
    "Christmas stocking": "Bota Navideña",
    "gift": "Regalo",
    "birthday cake": "Pastel de Cumpleaños",
    "party": "Fiesta",
    "space bar": "Barra Espaciadora",
    "space shuttle": "Transbordador Espacial",
    "rocket": "Cohete",
    "robot": "Robot",
    "globe": "Globo Terráqueo"
};

function translateLabel(label) {
    // MobileNet puede devolver varias etiquetas separadas por comas (e.g. "iPod, player")
    // Tomamos la principal (antes de la primera coma) y en minúsculas para traducir
    const mainLabel = label.split(',')[0].trim().toLowerCase();

    if (translations[mainLabel]) {
        return translations[mainLabel];
    }
    return label.split(',')[0]; // Si no hay traducción, devolver la original en inglés
}

// Callback con los resultados
function gotResult(error, results) {
    if (error) {
        console.error(error);
        return;
    }

    // El resultado más probable está en la posición 0
    const topResult = results[0];

    if (topResult) {
        // Mostrar etiqueta (traducida si es posible)
        const labelText = translateLabel(topResult.label);
        resultElement.innerText = labelText;

        // Calcular porcentaje
        const prob = topResult.confidence * 100;
        const probString = prob.toFixed(1) + "%";

        // Actualizar UI
        probabilityText.innerText = probString;
        probabilityBar.style.width = probString;

        // Cambiar color de la barra según la confianza
        if (prob > 70) {
            probabilityBar.style.background = "linear-gradient(90deg, #3b82f6, #10b981)"; // Verde
            probabilityText.style.color = "#10b981";
        } else if (prob > 40) {
            probabilityBar.style.background = "linear-gradient(90deg, #3b82f6, #facc15)"; // Amarillo
            probabilityText.style.color = "#facc15";
        } else {
            probabilityBar.style.background = "linear-gradient(90deg, #ef4444, #f97316)"; // Rojo
            probabilityText.style.color = "#f97316";
        }
    }

    // Volver a clasificar el siguiente frame
    requestAnimationFrame(classifyVideo);
}

// Proceso principal de inicio
async function initApp() {
    const cam = await setupCamera();
    if (cam) {
        video.play();
        loadModel();
    }
}

// Iniciar cuando cargue la página
window.onload = initApp;
