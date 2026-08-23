import { BrowserMultiFormatReader } from
    "https://cdn.jsdelivr.net/npm/@zxing/browser@0.1.5/+esm";
import { BarcodeFormat, DecodeHintType } from
    "https://cdn.jsdelivr.net/npm/@zxing/library@0.20.0/+esm";

const video = document.getElementById("camara");
const resultado = document.getElementById("resultado");
const estado = document.getElementById("estado");
const botonIniciar = document.getElementById("botonIniciar");
const botonDetener = document.getElementById("botonDetener");

const formatos = [
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.CODE_93,
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.ITF,
    BarcodeFormat.CODABAR
];

const pistas = new Map();
pistas.set(DecodeHintType.POSSIBLE_FORMATS, formatos);

const lector = new BrowserMultiFormatReader(pistas, 150);
let controles = null;
let ultimoCodigo = "";
let audio = null;

function iniciarLector() {
    estado.textContent = "Pidiendo permiso para usar la cámara...";
    crearSonido();

    lector.decodeFromConstraints(
        {
            video: {
                facingMode: "environment",
                width: { ideal: 1280 },
                height: { ideal: 720 },
                frameRate: { ideal: 15, max: 24 }
            },
            audio: false
        },
        video,
        function (codigo) {
            if (codigo && codigo.getText() !== ultimoCodigo) {
                resultado.textContent = codigo.getText();
                estado.textContent = "Código encontrado.";
                emitirSonido();
                ultimoCodigo = codigo.getText();
            }
        }
    )
        .then(function (resultadoControles) {
            controles = resultadoControles;
            botonIniciar.disabled = true;
            botonDetener.disabled = false;
            estado.textContent = "Apunta la cámara al código de barras.";
        })
        .catch(function (error) {
            mostrarError(error);
        });
}

function detenerLector() {
    if (controles) {
        controles.stop();
        controles = null;
    }

    lector.reset();
    video.srcObject = null;
    botonIniciar.disabled = false;
    botonDetener.disabled = true;
    ultimoCodigo = "";
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
