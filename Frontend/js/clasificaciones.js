import { supabase } from "./supabase.js";

// Referencias a los contenedores
const listaClasificaciones = document.getElementById('lista-clasificaciones');
const contenedorDocumentos = document.getElementById('contenedor-documentos');
const listaDocumentos = document.getElementById('lista-documentos');
const tituloClasificacion = document.getElementById('titulo-clasificacion');
const mensajeVacio = document.getElementById('mensaje-vacio');
const btnVolver = document.getElementById('btn-volver');

// Función para cargar todas las clasificaciones
async function cargarClasificaciones() {
  listaClasificaciones.innerHTML = ''; // Limpiar antes
  const { data, error } = await supabase
    .from('clasificaciones')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error cargando clasificaciones:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    mensajeVacio.style.display = 'block';
    return;
  }

  mensajeVacio.style.display = 'none';

  data.forEach(clasificacion => {
    const card = document.createElement('div');
    card.className = 'clasificacion-card';
    card.innerHTML = `
      <div class="icono-clasificacion">${clasificacion.icono}</div>
      <div class="nombre-clasificacion">${clasificacion.nombre}</div>
    `;

    // Evento click para ver documentos de la clasificación
    card.addEventListener('click', () => {
      mostrarDocumentosDeClasificacion(clasificacion.id, clasificacion.nombre);
    });

    listaClasificaciones.appendChild(card);
  });
}

// Función para mostrar documentos de una clasificación
async function mostrarDocumentosDeClasificacion(clasificacionId, nombreClasificacion) {
  listaDocumentos.innerHTML = '';
  contenedorDocumentos.style.display = 'block';
  listaClasificaciones.style.display = 'none';
  tituloClasificacion.innerHTML = `Documentos en <span id="nombre-clasificacion-activa">${nombreClasificacion}</span>`;

  const { data, error } = await supabase
    .from('documentos')
    .select('*')
    .eq('clasificacion_id', clasificacionId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error cargando documentos:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    listaDocumentos.innerHTML = '<li>No hay documentos en esta clasificación.</li>';
    return;
  }

  data.forEach(doc => {
    const li = document.createElement('li');
    li.innerHTML = `
      <strong>${doc.nombre}</strong> (${doc.formato}) 
      - <a href="${doc.url}" target="_blank">Ver Documento 📄</a>
    `;
    listaDocumentos.appendChild(li);
  });
}

// Botón para volver a las clasificaciones
btnVolver.addEventListener('click', () => {
  contenedorDocumentos.style.display = 'none';
  listaClasificaciones.style.display = 'grid';
  cargarClasificaciones();
});

// Cuando la página carga
cargarClasificaciones();
