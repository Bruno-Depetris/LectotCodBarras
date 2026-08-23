import { BrowserMultiFormatReader } from
    "https://cdn.jsdelivr.net/npm/@zxing/browser@0.1.5/+esm";

const video = document.getElementById("camara");
const resultado = document.getElementById("resultado");
const estado = document.getElementById("estado");
const botonIniciar = document.getElementById("botonIniciar");
const botonDetener = document.getElementById("botonDetener");

const lector = new BrowserMultiFormatReader();
let controles = null;

function iniciarLector() {
    estado.textContent = "Pidiendo permiso para usar la cámara...";

    lector.decodeFromConstraints(
        {
            video: {
                facingMode: "environment"
            },
            audio: false
        },
        video,
        function (codigo) {
            if (codigo) {
                resultado.textContent = codigo.getText();
                estado.textContent = "Código encontrado.";
            }
        }
    )
        .then(function (resultadoControles) {
            controles = resultadoControles;
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
    estado.textContent = "Cámara detenida.";
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
