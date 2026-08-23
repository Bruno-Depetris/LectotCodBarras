import { BrowserMultiFormatReader } from
    "https://cdn.jsdelivr.net/npm/@zxing/browser@0.1.5/+esm";
import { BarcodeFormat, DecodeHintType } from
    "https://cdn.jsdelivr.net/npm/@zxing/library@0.20.0/+esm";

const video = document.getElementById("camara");
const resultado = document.getElementById("resultado");
const estado = document.getElementById("estado");
const botonIniciar = document.getElementById("botonIniciar");
const botonDetener = document.getElementById("botonDetener");
const campoSesion = document.getElementById("campoSesion");
const botonEnviar = document.getElementById("botonEnviar");
const estadoEnvio = document.getElementById("estadoEnvio");

const API_POR_DEFECTO = "https://mandiraapirest.up.railway.app";
const CLAVE_SESION = "mandira.lector.sesion";

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
let codigoParaEnviar = "";
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
                codigoParaEnviar = ultimoCodigo;
                habilitarEnvio();
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
    if (!audio) {
        return;
    }

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

function obtenerApiUrl() {
    const parametros = new URLSearchParams(window.location.search);
    const desdeUrl = parametros.get("api");

    if (desdeUrl) {
        return desdeUrl.replace(/\/+$/, "");
    }

    return API_POR_DEFECTO;
}

function recuperarSesionGuardada() {
    const parametros = new URLSearchParams(window.location.search);
    const desdeUrl = parametros.get("sesion");

    if (desdeUrl) {
        campoSesion.value = desdeUrl.trim();
        guardarSesion();
        return;
    }

    try {
        const guardada = localStorage.getItem(CLAVE_SESION);

        if (guardada) {
            campoSesion.value = guardada;
        }
    } catch (error) {
        console.warn("No se pudo leer la sesion guardada:", error);
    }
}

function guardarSesion() {
    try {
        localStorage.setItem(CLAVE_SESION, campoSesion.value.trim());
    } catch (error) {
        console.warn("No se pudo guardar la sesion:", error);
    }
}

function habilitarEnvio() {
    const hayCodigo = codigoParaEnviar !== "";
    const haySesion = campoSesion.value.trim() !== "";

    botonEnviar.disabled = !hayCodigo || !haySesion;
}

function mostrarEstadoEnvio(mensaje, clase) {
    estadoEnvio.textContent = mensaje;
    estadoEnvio.className = "estado_envio " + clase;
}

function enviarAlPanel() {
    const sesion = campoSesion.value.trim();

    if (codigoParaEnviar === "" || sesion === "") {
        return;
    }

    botonEnviar.disabled = true;
    mostrarEstadoEnvio("Enviando...", "");

    fetch(obtenerApiUrl() + "/api/Escaneos/" + encodeURIComponent(sesion), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: codigoParaEnviar })
    })
        .then(function (respuesta) {
            if (respuesta.ok) {
                mostrarEstadoEnvio("Enviado a la sesion " + sesion + ".", "ok");
                emitirSonido();
                return;
            }

            return respuesta.json()
                .catch(function () {
                    return null;
                })
                .then(function (datos) {
                    const detalle = datos && datos.detail ? datos.detail : "estado " + respuesta.status;
                    mostrarEstadoEnvio("No se pudo enviar: " + detalle, "mal");
                });
        })
        .catch(function (error) {
            console.error("Fallo el envio:", error);
            mostrarEstadoEnvio("No se pudo contactar la API.", "mal");
        })
        .then(function () {
            habilitarEnvio();
        });
}

campoSesion.addEventListener("input", function () {
    guardarSesion();
    habilitarEnvio();
});

botonEnviar.addEventListener("click", enviarAlPanel);
botonIniciar.addEventListener("click", iniciarLector);
botonDetener.addEventListener("click", detenerLector);

recuperarSesionGuardada();
habilitarEnvio();
