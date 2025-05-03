// --- 📄 Función para mostrar vista previa del documento ---
export async function mostrarVistaPrevia(file) {
    const previewBox = document.querySelector('.preview-box');
    previewBox.innerHTML = ""; // Limpiar cualquier contenido anterior

    const fileType = file.type;

    if (fileType === "application/pdf") {
        const fileReader = new FileReader();
        fileReader.onload = async function(event) {
            const pdfData = new Uint8Array(event.target.result);
            const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
            const page = await pdf.getPage(1);

            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");

            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({ canvasContext: context, viewport }).promise;
            previewBox.appendChild(canvas);
        };
        fileReader.readAsArrayBuffer(file);
    }
    else if (fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const reader = new FileReader();
        reader.onload = async function(event) {
            const arrayBuffer = event.target.result;
            const result = await mammoth.convertToHtml({ arrayBuffer });
            const container = document.createElement("div");
            container.innerHTML = result.value;

            const firstText = container.querySelector("p")?.innerText || "Vista previa no disponible.";
            const previewText = document.createElement("p");
            previewText.textContent = firstText;
            previewText.style.color = "white";
            previewBox.appendChild(previewText);
        };
        reader.readAsArrayBuffer(file);
    }
    else if (fileType.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = document.createElement("img");
            img.src = event.target.result;
            img.style.maxWidth = "100%";
            img.style.maxHeight = "100%";
            previewBox.appendChild(img);
        };
        reader.readAsDataURL(file);
    }
    else if (fileType === "text/plain") {
        const reader = new FileReader();
        reader.onload = function(event) {
            const text = event.target.result;
            const lines = text.split("\n").slice(0, 5).join("\n");
            const previewText = document.createElement("pre");
            previewText.textContent = lines;
            previewText.style.color = "white";
            previewBox.appendChild(previewText);
        };
        reader.readAsText(file);
    }
    else {
        previewBox.innerHTML = "<p>Vista previa no disponible para este tipo de archivo.</p>";
    }
}

// --- 🧠 Asociar automáticamente al input cuando cargue la página ---
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', async function () {
            const file = this.files[0];
            if (file) {
                await mostrarVistaPrevia(file);
            }
        });
    }
});
