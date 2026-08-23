import { BrowserMultiFormatReader } from
    'https://cdn.jsdelivr.net/npm/@zxing/browser@0.1.5/+esm';

console.log("=== lectorCodigo.js cargado ===");

const video = document.getElementById("camara");
const resultado = document.getElementById("resultado");

console.log("Elemento video:", video);
console.log("Elemento resultado:", resultado);

if (!video) {
    console.error("❌ No existe el elemento #camara");
}

if (!resultado) {
    console.error("❌ No existe el elemento #resultado");
}

const reader = new BrowserMultiFormatReader();

console.log("✓ BrowserMultiFormatReader creado");
console.log("Intentando acceder a la cámara...");

reader.decodeFromConstraints(
    {
        video: {
            facingMode: "environment"
        },
        audio: false
    },
    video,
    (result, error) => {

        // Cuando encuentra un código
        if (result) {

            const codigo = result.getText();

            console.log("================================");
            console.log("🎯 CÓDIGO DETECTADO");
            console.log("Código:", codigo);
            console.log("Formato:", result.getBarcodeFormat());
            console.log("Objeto completo:", result);
            console.log("================================");

            resultado.textContent = codigo;

            return;
        }

        // ZXing genera NotFoundException constantemente
        // mientras busca códigos. No significa necesariamente
        // que haya un problema.
        if (error) {

            console.log(
                "ZXing está analizando... Estado:",
                error.name
            );
        }

    }
)
    .then(() => {

        console.log("✓ ZXing comenzó a analizar la cámara");

    })
    .catch(error => {

        console.error("❌ ERROR iniciando ZXing");
        console.error(error);
    });