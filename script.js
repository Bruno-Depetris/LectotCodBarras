const video = document.getElementById("camara");
const resultado = document.getElementById("resultado");
const estado = document.getElementById("estado");
const botonIniciar = document.getElementById("botonIniciar");
const botonDetener = document.getElementById("botonDetener");

let detector = null;
let imagenes = null;
let camaraActiva = false;
let ultimoCodigo = "";
let ultimaLectura = 0;
let audio = null;

async function iniciarLector() {
    if (!("BarcodeDetector" in window)) {
        estado.textContent = "Tu navegador no es compatible con BarcodeDetector.";
        return;
    }

    try {
        estado.textContent = "Pidiendo permiso para usar la cámara...";

        const transmision = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
            audio: false
        });

        video.srcObject = transmision;
        await video.play();

        detector = new BarcodeDetector();
        camaraActiva = true;
        ultimoCodigo = "";
        crearSonido();

        botonIniciar.disabled = true;
        botonDetener.disabled = false;
        estado.textContent = "Apunta la cámara al código de barras.";

        buscarCodigo();
    } catch (error) {
        mostrarError(error);
    }
}

async function buscarCodigo() {
    if (!camaraActiva) {
        return;
    }

    try {
        const codigos = await detector.detect(video);

        if (codigos.length > 0) {
            const codigo = codigos[0].rawValue;
            const ahora = Date.now();

            if (codigo !== ultimoCodigo || ahora - ultimaLectura > 2000) {
                resultado.textContent = codigo;
                estado.textContent = "Código encontrado.";
                emitirSonido();
                ultimoCodigo = codigo;
                ultimaLectura = ahora;
            }
        }
    } catch (error) {
        console.error("Error leyendo el código:", error);
    }

    imagenes = requestAnimationFrame(buscarCodigo);
}

function detenerLector() {
    camaraActiva = false;

    if (imagenes) {
        cancelAnimationFrame(imagenes);
        imagenes = null;
    }

    if (video.srcObject) {
        video.srcObject.getTracks().forEach(function (pista) {
            pista.stop();
        });
        video.srcObject = null;
    }

    botonIniciar.disabled = false;
    botonDetener.disabled = true;
    estado.textContent = "Cámara detenida.";
}

function crearSonido() {
    const ConstructorAudio = window.AudioContext || window.webkitAudioContext;
    audio = new ConstructorAudio();
}

function emitirSonido() {
    const oscilador = audio.createOscillator();
    const volumen = audio.createGain();

    oscilador.frequency.value = 880;
    volumen.gain.value = 0.15;
    oscilador.connect(volumen);
    volumen.connect(audio.destination);

    oscilador.start();
    oscilador.stop(audio.currentTime + 0.15);
}

function mostrarError(error) {
    console.error("No se pudo iniciar la cámara:", error);

    if (error.name === "NotAllowedError") {
        estado.textContent = "Debes permitir el acceso a la cámara.";
        return;
    }

    estado.textContent = "No se pudo iniciar la cámara.";
}

botonIniciar.addEventListener("click", iniciarLector);
botonDetener.addEventListener("click", detenerLector);
