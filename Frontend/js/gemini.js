const API_KEY = "AIzaSyAwzGk3_n0qByhEqxAA8zxezAyy6UYaVs0"; // Reemplázala con tu clave de API

// Función para generar resumen con Gemini
async function generarResumen(texto) {
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro-001:generateContent?key=${API_KEY}`;

    const requestBody = {
        contents: [{ parts: [{ text: `Resume este texto en un máximo de 8 líneas:\n\n${texto}` }] }]
    };

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "No se pudo generar el resumen.";
}

async function extraerPalabrasClave(texto) {
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro-001:generateContent?key=${API_KEY}`;


    const requestBody = {
        contents: [{
          parts: [{
            text: `Extrae las palabras clave más relevantes del siguiente texto. Para cada palabra clave, genera cinco sinónimos y, si la palabra contiene acento, añade su versión sin acento, tambien ingresa el autor y datos similares como fecha del documento, ademas agrega palabras clave segun el nombre del documento. Devuelve únicamente un bloque de texto en el que todas las palabras se encuentren separadas por comas, sin ningún formato, etiqueta o encabezado adicional.El minimo de palabras clave a generar son 60 y el maximo 150.
            
      Texto:
      ${texto}`
          }]
        }]
      };
      

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text.split(",").map(word => word.trim());
    } else {
        return ["No se pudieron extraer palabras clave"];
    }
}


// Exportamos las funciones
export { generarResumen, extraerPalabrasClave };
