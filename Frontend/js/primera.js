// Importación de librerías necesarias
import { clasificacionActiva } from './custom_tercera.js';
import { supabase } from "./supabase.js"; // Para conectar con Supabase
import { generarResumen, extraerPalabrasClave } from "./gemini.js"; // Conexión con las funciones de Gemini para IA

// Configuración de las librerías PDF.js y Tesseract.js
const pdfjsLib = window['pdfjs-dist/build/pdf']; // Librería para trabajar con archivos PDF
pdfjsLib.GlobalWorkerOptions.workerSrc = '//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js'; // Worker para PDF.js
Tesseract.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/2.1.1/worker.min.js'; // Worker para Tesseract.js (OCR)

// Función que convierte un archivo PDF a texto, incluyendo OCR en caso necesario
async function pdfToTextoYImagen(pdfData) {
    console.log("Procesando PDF...");

    // Cargar el documento PDF
    const loadingTask = pdfjsLib.getDocument({ data: pdfData });
    const pdf = await loadingTask.promise; // Esperar que el PDF se cargue completamente
    let texto = '';  // Variable donde se almacenará el texto extraído

    // Iterar sobre cada página del PDF
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        console.log(`Leyendo página ${pageNum} de ${pdf.numPages}...`);
        const page = await pdf.getPage(pageNum); // Obtener la página del PDF
        const textContent = await page.getTextContent(); // Extraer el contenido textual de la página
        let pageText = textContent.items.map(item => item.str).join(' ').trim();  // Unir las cadenas de texto de la página

        // Si no se extrae texto, proceder a OCR (reconocimiento de texto
        if (pageText.length < 10) {
            console.log("No se encontró texto en la página, aplicando OCR...");
            const scale = 2; // Aumento de la escala para mejorar la calidad de la imagen
            const viewport = page.getViewport({ scale }); // Configuración de la vista
            const canvas = document.createElement("canvas"); // Crear un canvas para renderizar la imagen
            const context = canvas.getContext("2d");
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            const renderTask = page.render({ canvasContext: context, viewport }); // Renderizar la página en el canvas
            await renderTask.promise; // Esperar que se termine de renderizar

            // Convertir el canvas a una imagen en base64 y pasarla a Tesseract para hacer OCR
            const imageDataUrl = canvas.toDataURL("image/png");
            const { data: { text: ocrText } } = await Tesseract.recognize(imageDataUrl, 'spa'); // Realizar el OCR con Tesseract
            texto += ocrText + '\n'; // Concatenar el texto obtenido por OCR
        } else {
            texto += pageText + '\n'; // Si ya había texto, agregarlo directamente
        }
    }
    return texto; // Devolver todo el texto extraído del PDF
}

// 🖼️ Extraer texto desde imagen con OCR
async function imagenAOCR(dataUrl) {
    const { data: { text } } = await Tesseract.recognize(dataUrl, 'spa');
    return text;
}

// 📃 Función para procesar archivos Word con Mammoth + OCR si tiene imágenes
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
        }).catch(() => resolve("")); // En caso de error, devolver texto vacío
    });
}

// Función principal para extraer el texto de diferentes tipos de archivos (PDF, imágenes, texto)
async function extraerTexto(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader(); // Crear un lector de archivos

        reader.onload = async (event) => {
            const fileType = file.type;// Obtener el tipo de archivo
            console.log("Tipo de archivo detectado:", fileType);

            try {
                // Si el archivo es de texto, devolver el contenido directamente
                if (fileType === "text/plain") {
                    resolve(event.target.result);
                } 
                // Si el archivo es un PDF, usar la función pdfToTextoYImagen para extraer el texto
                else if (fileType === "application/pdf") {
                    const pdfData = new Uint8Array(event.target.result);// Convertir el archivo a un ArrayBuffer
                    const texto = await pdfToTextoYImagen(pdfData);// Extraer texto del PDF
                    resolve(texto);
                }
                else if (fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
                    const texto = await extraerTextoDocx(event.target.result);
                    resolve(texto);

                    // Si el archivo es una imagen, usar Tesseract para extraer texto mediante OCR
                } else if (fileType.startsWith("image/")) {
                    const texto = await imagenAOCR(event.target.result); // Realizar OCR en la imagen
                    resolve(texto);
                } 
                 // Si el archivo no es soportado, rechazar la promesa
                else {
                    reject("Formato de archivo no soportado.");
                }
            } catch (error) {
                reject("Error al leer el archivo: " + error.message);// Manejar errores de lectura
            }
        };
        // Manejo de error en la lectura del archivo
        reader.onerror = (error) => reject(error);
        // Leer el archivo dependiendo de su tipo
        if (file.type.startsWith("image/")) {
            reader.readAsDataURL(file);// Leer imágenes como DataURL
        } else if (file.type === "application/pdf" || file.name.endsWith(".docx")) {
            reader.readAsArrayBuffer(file);// Leer archivos PDF como ArrayBuffer
        } else {
            reader.readAsText(file);// Leer archivos de texto directamente
        }
    });
}

// 📤 Subir archivo, generar resumen y guardar en Supabase
async function subirArchivo() {
    const fileInput = document.getElementById("fileInput");
    const fileNameInput = document.getElementById("file-name").value.trim();
    const fileFormat = document.getElementById("file-format").value;
    const file = fileInput.files[0];
    const btnSubir = document.getElementById("btnSubir");

    // 🚫 Validación básica
    if (!file) return alert("Selecciona un archivo para subir.");
    if (!fileNameInput) return alert("Ingresa un nombre para el archivo.");

    // ✅ Verificar usuario autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        alert("Debes iniciar sesión para subir archivos.");
        return;
    }

    // ⚠️ Confirmar si no hay clasificación activa
    if (!clasificacionActiva) {
        const continuar = confirm("⚠️ No has seleccionado una clasificación. ¿Deseas continuar?");
        if (!continuar) return;
    }

    // 🕒 Desactivar botón para evitar múltiples envíos
    btnSubir.disabled = true;

    // 🧼 Normalizar el nombre del archivo
    const safeFileName = file.name
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w.-]/g, "_")
        .replace(/\s+/g, "_");

    const filePath = `uploads/${safeFileName}`;
    const fileUrl = `https://bkdnidzlvszxokasrmol.supabase.co/storage/v1/object/public/documentos/${encodeURIComponent(filePath)}`;

    // ☁️ Subir a Supabase Storage
    const { error: uploadError } = await supabase.storage.from("documentos").upload(filePath, file, { upsert: true });
    if (uploadError) {
        console.error("❌ Error al subir archivo:", uploadError.message);
        alert("Error al subir el archivo.");
        btnSubir.disabled = false;
        return;
    }

    // 🧠 Extraer texto del archivo
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

    // 🤖 Generar resumen y palabras clave con Gemini
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

    // 📝 Insertar metadatos en documentos_meta
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




// Función para listar los archivos almacenados en Supabase
async function listarArchivos() {
    const lista = document.getElementById("listaArchivos");
    lista.innerHTML = "";

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        console.error("No se pudo obtener el usuario actual:", userError?.message);
        return;
    }

    // 🔒 Obtener solo documentos del usuario actual
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

// Listar archivos al cargar la página
document.addEventListener("DOMContentLoaded", () => {
    listarArchivos();
});

// Event listener para el botón de subida de archivo
document.getElementById("btnSubir").addEventListener("click", subirArchivo);
