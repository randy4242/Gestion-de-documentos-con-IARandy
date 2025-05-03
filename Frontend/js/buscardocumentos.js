// Importamos la configuración de Supabase desde un archivo externo
import { supabase } from "./supabase.js";

// Función principal que se encarga de buscar documentos según filtros aplicados
export async function buscarDocumentos() {
  const palabraClave = document.getElementById("input-busqueda").value.trim().toLowerCase();
  const tipoSeleccionado = document.getElementById("select-tipo").value;
  const orden = document.getElementById("orden-fecha").value;

  // Obtener sesión actual
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  console.log("Session data:", sessionData);

  if (sessionError || !sessionData || !sessionData.session) {
    console.error("❌ Error al obtener la sesión o no hay sesión activa:", sessionError);
    return;
  }

  const usuario = sessionData.session.user;

  if (!usuario || !usuario.id) {
    console.error("❌ El usuario no está definido o su ID está vacío");
    return;
  }

  console.log("✅ Usuario autenticado, ID:", usuario.id);

  let query = supabase.from("documentos_meta").select("*").eq("user_id", usuario.id);

  if (tipoSeleccionado) {
    query = query.eq("tipo", tipoSeleccionado);
  }

  query = query.order("created_at", { ascending: orden === "asc" });

  const { data, error } = await query;

  if (error) {
    console.error("❌ Error al consultar Supabase:", error);
    return;
  }

  const resultados = palabraClave
    ? data.filter(doc =>
        (doc.palabras_clave || []).some(p =>
          p.toLowerCase().includes(palabraClave)
        )
      )
    : data;

  mostrarResultados(resultados);
}

// Función que se encarga de mostrar los resultados en el HTML
function mostrarResultados(documentos) {
  const lista = document.getElementById("lista-documentos");
  const cantidad = document.getElementById("cantidad-resultados");

  lista.innerHTML = "";
  cantidad.textContent = `Se encontraron ${documentos.length} documento(s).`;

  documentos.forEach(doc => {
    const li = document.createElement("li");
    const palabrasClave = doc.palabras_clave || [];
    const palabrasIniciales = 10; // Mostrar primeras 10 palabras
    const mostrarTodas = palabrasClave.length <= palabrasIniciales; // Mostrar todas si son pocas

    li.innerHTML = `
      <strong>${doc.nombre}</strong> - <em>${doc.tipo}</em><br>
      <a href="${doc.url}" target="_blank">Ver documento</a><br>

      <button class="btn-toggle-resumen">Ver resumen</button>
      <div class="resumen" style="display: none; margin-top: 5px;">
        <p><strong>Resumen:</strong> ${doc.resumen || "No disponible"}</p>
      </div>

      <div class="palabras-clave-container">
        <small><strong>Palabras clave (${palabrasClave.length}):</strong> 
          <span class="palabras-visibles">${mostrarTodas ? 
            palabrasClave.join(", ") : 
            palabrasClave.slice(0, palabrasIniciales).join(", ")}</span>
          ${!mostrarTodas ? `<span class="palabras-ocultas" style="display:none">, ${palabrasClave.slice(palabrasIniciales).join(", ")}</span>` : ''}
        </small>
        ${!mostrarTodas ? `<button class="btn-ver-mas" style="background:none; border:none; color:#3498db; cursor:pointer; text-decoration:underline; padding:0; margin-left:5px;">Ver ${palabrasClave.length - palabrasIniciales} más</button>` : ''}
      </div>

      <button class="btn-eliminar" data-id="${doc.id}" style="margin-top: 8px; color: red;">🗑 Eliminar</button>
      <button class="btn-editar" data-id="${doc.id}" style="margin-top: 8px; color: blue;">✏️ Editar</button>

      <div class="form-edicion" style="display:none; margin-top:10px;">
        <input type="text" placeholder="Nombre" value="${doc.nombre}" class="input-nombre" style="width:100%; margin-top:4px;" />
        <input type="text" placeholder="Tipo" value="${doc.tipo}" class="input-tipo" style="width:100%; margin-top:4px;" />
        <textarea placeholder="Resumen" class="input-resumen" style="width:100%; margin-top:4px;">${doc.resumen || ""}</textarea>
        <button class="btn-guardar-cambios" style="margin-top:4px;">💾 Guardar cambios</button>
      </div>
    `;

    // Evento para mostrar/ocultar palabras clave adicionales
    if (!mostrarTodas) {
      const btnVerMas = li.querySelector(".btn-ver-mas");
      const palabrasOcultas = li.querySelector(".palabras-ocultas");
      
      btnVerMas.addEventListener("click", () => {
        const estanOcultas = palabrasOcultas.style.display === "none";
        palabrasOcultas.style.display = estanOcultas ? "inline" : "none";
        btnVerMas.textContent = estanOcultas ? 
          "Ver menos" : 
          `Ver ${palabrasClave.length - palabrasIniciales} más`;
      });
    }

    // Evento para mostrar/ocultar resumen
    const btnResumen = li.querySelector(".btn-toggle-resumen");
    const resumenDiv = li.querySelector(".resumen");
    
    btnResumen.addEventListener("click", () => {
      const visible = resumenDiv.style.display === "block";
      resumenDiv.style.display = visible ? "none" : "block";
      btnResumen.textContent = visible ? "Ver resumen" : "Ocultar resumen";
    });

    // Evento para eliminar documento
    const btnEliminar = li.querySelector(".btn-eliminar");
    btnEliminar.addEventListener("click", async () => {
      const confirmacion = confirm("¿Estás seguro de que deseas eliminar este documento?");
      if (confirmacion) {
        await eliminarDocumento(doc.id);
        await buscarDocumentos();
      }
    });

    // Mostrar formulario de edición
    const btnEditar = li.querySelector(".btn-editar");
    const formEdicion = li.querySelector(".form-edicion");

    btnEditar.addEventListener("click", () => {
      formEdicion.style.display = formEdicion.style.display === "block" ? "none" : "block";
    });

    // Guardar cambios
    const btnGuardar = li.querySelector(".btn-guardar-cambios");
    btnGuardar.addEventListener("click", async () => {
      const nuevoNombre = li.querySelector(".input-nombre").value.trim();
      const nuevoTipo = li.querySelector(".input-tipo").value.trim();
      const nuevoResumen = li.querySelector(".input-resumen").value.trim();

      const { error } = await supabase
        .from("documentos_meta")
        .update({
          nombre: nuevoNombre,
          tipo: nuevoTipo,
          resumen: nuevoResumen
        })
        .eq("id", doc.id);

      if (error) {
        console.error("❌ Error al actualizar:", error);
        alert("Hubo un problema al actualizar el documento.");
      } else {
        alert("✅ Documento actualizado correctamente.");
        await buscarDocumentos(); // recarga actualizada
      }
    });

    lista.appendChild(li);
  });
}

// Función para eliminar un documento de la base de datos y del storage
async function eliminarDocumento(id) {
  console.log("🗑 Intentando eliminar documento con ID:", id);

  const { data: doc, error: fetchError } = await supabase
    .from("documentos_meta")
    .select("url")
    .eq("id", id)
    .single();

  if (fetchError || !doc) {
    console.error("❌ Error al obtener el documento:", fetchError);
    return;
  }

  const url = doc.url;
  const partes = url.split("/public/documentos/");
  if (partes.length < 2) {
    console.error("❌ No se pudo extraer el path del Storage desde la URL.");
    return;
  }

  const path = decodeURIComponent(partes[1]);

  const { error: storageError } = await supabase.storage
    .from("documentos")
    .remove([path]);

  if (storageError) {
    console.error("❌ Error al eliminar del Storage:", storageError);
  } else {
    console.log("✅ Archivo eliminado del Storage correctamente.");
  }

  const { error: dbError } = await supabase
    .from("documentos_meta")
    .delete()
    .eq("id", id);

  if (dbError) {
    console.error("❌ Error al eliminar de la base de datos:", dbError);
  } else {
    console.log("✅ Documento eliminado de la base de datos.");
  }
}

// Función para limpiar los filtros y recargar todos los documentos
export function limpiarFiltros() {
  document.getElementById("input-busqueda").value = "";
  document.getElementById("select-tipo").value = "";
  document.getElementById("orden-fecha").value = "desc";
  buscarDocumentos();
}

async function cargarTiposDocumento() {
  const { data, error } = await supabase
    .from("documentos_meta")
    .select("tipo");

  if (error) {
    console.error("❌ Error al cargar tipos de documentos:", error);
    return;
  }

  const tiposUnicos = [...new Set(data.map(doc => doc.tipo).filter(Boolean))];
  const select = document.getElementById("select-tipo");

  // Limpiar y agregar opción por defecto
  select.innerHTML = `<option value="">Todos</option>`;
  tiposUnicos.forEach(tipo => {
    const option = document.createElement("option");
    option.value = tipo;
    option.textContent = tipo;
    select.appendChild(option);
  });
}

// Al cargar la página, ejecutamos la búsqueda y asignamos eventos a los botones
window.addEventListener("DOMContentLoaded", () => {
  cargarTiposDocumento(); // ✅ <- esto carga los tipos
  buscarDocumentos();

  document.getElementById("btn-buscar").addEventListener("click", buscarDocumentos);
  document.getElementById("btn-limpiar").addEventListener("click", limpiarFiltros);
});