// Importación de librerías necesarias
import { clasificacionActiva } from './custom_tercera.js';
import { supabase } from "./supabase.js"; // Para conectar con Supabase
import { generarResumen, extraerPalabrasClave } from "./gemini.js"; // Conexión con las funciones de Gemini para IA

// Configuración de las librerías PDF.js y Tesseract.js
const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = '//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';
Tesseract.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/2.1.1/worker.min.js';

async function pdfToTextoYImagen(pdfData) {
    console.log("Procesando PDF...");
    const loadingTask = pdfjsLib.getDocument({ data: pdfData });
    const pdf = await loadingTask.promise;
    let texto = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        console.log(`Leyendo página ${pageNum} de ${pdf.numPages}...`);
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        let pageText = textContent.items.map(item => item.str).join(' ').trim();

        if (pageText.length < 10) {
            console.log("No se encontró texto en la página, aplicando OCR...");
            const scale = 2;
            const viewport = page.getViewport({ scale });
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const renderTask = page.render({ canvasContext: context, viewport });
            await renderTask.promise;
            const imageDataUrl = canvas.toDataURL("image/png");
            const { data: { text: ocrText } } = await Tesseract.recognize(imageDataUrl, 'spa');
            texto += ocrText + '\n';
        } else {
            texto += pageText + '\n';
        }
    }
    return texto;
}

async function imagenAOCR(dataUrl) {
    const { data: { text } } = await Tesseract.recognize(dataUrl, 'spa');
    return text;
}

async function extraerTextoDocx(arrayBuffer) {
    return new Promise((resolve) => {
        mammoth.convertToHtml({ arrayBuffer }).then(async (result) => {
            const container = document.createElement("div");
            container.innerHTML = result.value;
            let texto = container.innerText;
            const imgs = container.querySelectorAll("img");
            for (let img of imgs) {
                const ocrText = await imagenAOCR(img.src);
                texto += "\n" + ocrText;
            }
            resolve(texto);
        }).catch(() => resolve(""));
    });
}

async function extraerTexto(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (event) => {
            const fileType = file.type;
            console.log("Tipo de archivo detectado:", fileType);

            try {
                if (fileType === "text/plain") {
                    resolve(event.target.result);
                } else if (fileType === "application/pdf") {
                    const pdfData = new Uint8Array(event.target.result);
                    const texto = await pdfToTextoYImagen(pdfData);
                    resolve(texto);
                } else if (fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
                    const texto = await extraerTextoDocx(event.target.result);
                    resolve(texto);
                } else if (fileType.startsWith("image/")) {
                    const texto = await imagenAOCR(event.target.result);
                    resolve(texto);
                } else {
                    reject("Formato de archivo no soportado.");
                }
            } catch (error) {
                reject("Error al leer el archivo: " + error.message);
            }
        };

        reader.onerror = (error) => reject(error);

        if (file.type.startsWith("image/")) {
            reader.readAsDataURL(file);
        } else if (file.type === "application/pdf" || file.name.endsWith(".docx")) {
            reader.readAsArrayBuffer(file);
        } else {
            reader.readAsText(file);
        }
    });
}

async function subirArchivo() {
    const fileInput = document.getElementById("fileInput");
    const fileNameInput = document.getElementById("file-name").value.trim();
    const fileFormat = document.getElementById("file-format").value;
    const file = fileInput.files[0];
    const btnSubir = document.getElementById("btnSubir");

    if (!file) return alert("Selecciona un archivo para subir.");
    if (!fileNameInput) return alert("Ingresa un nombre para el archivo.");

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        alert("Debes iniciar sesión para subir archivos.");
        return;
    }

    if (!clasificacionActiva) {
        const continuar = confirm("⚠️ No has seleccionado una clasificación. ¿Deseas continuar?");
        if (!continuar) return;
    }

    btnSubir.disabled = true;

    // ⬇️ Mostrar ícono de carga en summary-text
    document.getElementById("summary-text").innerHTML = `
      <div style="text-align:center;">
        <img src="imagenes/cargando.gif" alt="Cargando..." style="width:35px;">
        <p><em>Procesando documento con IA...</em></p>
      </div>
    `;

    const safeFileName = file.name
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w.-]/g, "_")
        .replace(/\s+/g, "_");

    const filePath = `uploads/${safeFileName}`;
    const { data: publicUrlData } = supabase.storage.from("documentos").getPublicUrl(filePath);
    const fileUrl = publicUrlData.publicUrl;

    const { error: uploadError } = await supabase.storage.from("documentos").upload(filePath, file, { upsert: true });
    if (uploadError) {
        console.error("❌ Error al subir archivo:", uploadError.message);
        alert("Error al subir el archivo.");
        btnSubir.disabled = false;
        return;
    }

    let contenidoTexto = "";
    try {
        contenidoTexto = await extraerTexto(file);
        if (!contenidoTexto || contenidoTexto.length < 20) throw new Error("Texto extraído insuficiente.");
    } catch (err) {
        console.error("❌ Error al extraer texto:", err.message);
        alert("No se pudo extraer texto del archivo.");
        btnSubir.disabled = false;
        return;
    }

    let resumen = "", palabrasClave = [];
    try {
        resumen = await generarResumen(contenidoTexto);
        palabrasClave = await extraerPalabrasClave(contenidoTexto);
        if (!Array.isArray(palabrasClave) || palabrasClave.length === 0) {
            palabrasClave = ["Sin palabras clave"];
        }
    } catch (err) {
        console.error("⚠️ Error con Gemini:", err.message);
        alert("Error al generar resumen o palabras clave. Intenta de nuevo.");
        btnSubir.disabled = false;
        return;
    }

    const { error: dbError } = await supabase.from("documentos_meta").insert([{
        nombre: fileNameInput,
        tipo: fileFormat,
        url: fileUrl,
        resumen,
        palabras_clave: palabrasClave,
        clasificacion_id: clasificacionActiva || null,
        user_id: user.id
    }]);

    if (dbError) {
        console.error("❌ Error al guardar en la base de datos:", dbError.message);
        alert("Error al guardar el documento.");
    } else {
        alert("✅ Documento subido correctamente.");
        document.getElementById("summary-text").innerText = resumen;
    }

    btnSubir.disabled = false;
}

async function listarArchivos() {
    const lista = document.getElementById("listaArchivos");
    lista.innerHTML = "";

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        console.error("No se pudo obtener el usuario actual:", userError?.message);
        return;
    }

    const { data, error } = await supabase
        .from("documentos_meta")
        .select("*")
        .eq("user_id", user.id);

    if (error) {
        console.error("Error al listar archivos:", error);
        return;
    }

    data.forEach((doc) => {
        const li = document.createElement("li");
        li.innerHTML = `<a href="${doc.url}" target="_blank">${doc.nombre}</a> - <em>${doc.tipo}</em>`;
        lista.appendChild(li);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    listarArchivos();
});

document.getElementById("btnSubir").addEventListener("click", subirArchivo);
