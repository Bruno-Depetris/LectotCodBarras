import { BrowserMultiFormatReader } from
    'https://cdn.jsdelivr.net/npm/@zxing/browser@0.1.5/+esm';

const video = document.getElementById("camara");
const resultado = document.getElementById("resultado");

const reader = new BrowserMultiFormatReader();

reader.decodeFromConstraints(
    {
        video: {
            facingMode: "environment"
        }
    },
    video,
    (result, error) => {

        if (result) {
            const codigo = result.getText();

            console.log("Código detectado:", codigo);

            resultado.textContent = codigo;
        }

    }
);