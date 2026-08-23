import { BrowserMultiFormatReader } from
    'https://cdn.jsdelivr.net/npm/@zxing/browser@0.1.5/+esm';

const video = document.getElementById("camara");
const resultado = document.getElementById("resultado");
const estado = document.getElementById("estado");
const selectorCamara = document.getElementById("camaraSeleccionada");
const iniciar = document.getElementById("iniciar");
const detener = document.getElementById("detener");
const limpiar = document.getElementById("limpiar");

const lector = new BrowserMultiFormatReader();
let controlesEscaneo = null;

function mostrarEstado(mensaje) {
    estado.textContent = mensaje;
}

function mostrarError(error) {
    console.error("Error del lector:", error);
    const mensajes = {
        NotAllowedError: "Permiso de cámara denegado. Permítelo en el navegador y vuelve a intentarlo.",
        NotFoundError: "No se encontró ninguna cámara disponible.",
        NotReadableError: "La cámara está siendo usada por otra aplicación.",
        SecurityError: "La cámara requiere una página segura (HTTPS o localhost)."
    };
    mostrarEstado(mensajes[error.name] || "No se pudo iniciar la cámara.");
    iniciar.disabled = false;
    detener.disabled = true;
}

async function cargarCamaras() {
    const dispositivos = await navigator.mediaDevices.enumerateDevices();
    const camaras = dispositivos.filter((dispositivo) => dispositivo.kind === "videoinput");
    selectorCamara.replaceChildren();

    camaras.forEach((camara, indice) => {
        const opcion = document.createElement("option");
        opcion.value = camara.deviceId;
        opcion.textContent = camara.label || `Cámara ${indice + 1}`;
        selectorCamara.append(opcion);
    });

    selectorCamara.disabled = camaras.length < 2;
}

function detenerEscaneo() {
    if (controlesEscaneo) {
        controlesEscaneo.stop();
        controlesEscaneo = null;
    }
    lector.reset();
    video.srcObject?.getTracks().forEach((pista) => pista.stop());
    video.srcObject = null;
    iniciar.disabled = false;
    detener.disabled = true;
}

async function iniciarEscaneo() {
    if (!navigator.mediaDevices?.getUserMedia) {
        mostrarEstado("Este navegador no permite acceder a la cámara.");
        return;
    }

    detenerEscaneo();
    iniciar.disabled = true;
    mostrarEstado("Solicitando acceso a la cámara...");

    try {
        const deviceId = selectorCamara.value;
        const restricciones = deviceId
            ? { video: { deviceId: { exact: deviceId } }, audio: false }
            : { video: { facingMode: { ideal: "environment" } }, audio: false };

        controlesEscaneo = await lector.decodeFromConstraints(
            restricciones,
            video,
            (lectura, error) => {
                if (lectura) {
                    resultado.textContent = lectura.getText();
                    mostrarEstado(`Código detectado: ${lectura.getBarcodeFormat()}`);
                } else if (error && error.name !== "NotFoundException") {
                    console.debug("ZXing continúa buscando:", error.name);
                }
            }
        );

        await cargarCamaras();
        detener.disabled = false;
        mostrarEstado("Apunta la cámara a un código de barras.");
    } catch (error) {
        mostrarError(error);
    }
}

iniciar.addEventListener("click", iniciarEscaneo);
detener.addEventListener("click", detenerEscaneo);
limpiar.addEventListener("click", () => {
    resultado.textContent = "Todavía no se ha leído ningún código.";
});
selectorCamara.addEventListener("change", iniciarEscaneo);