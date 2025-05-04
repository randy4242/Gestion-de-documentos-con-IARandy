import { supabase } from "./supabase.js";

// Estado global de la clasificación activa
export let clasificacionActiva = null;

// Obtener clasificaciones del usuario
async function cargarClasificaciones() {
    const contenedor = document.getElementById("contenedor-clasificaciones");
    const mensajeSinClasificacion = document.getElementById("mensajeSinClasificacion");

    contenedor.innerHTML = "";

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        console.error("⚠️ Usuario no autenticado");
        mensajeSinClasificacion.style.display = "block";
        return;
    }

    const { data, error } = await supabase
        .from("clasificaciones")
        .select("*")
        .eq("user_id", user.id);

    if (error) {
        console.error("❌ Error al cargar clasificaciones:", error.message);
        mensajeSinClasificacion.style.display = "block";
        return;
    }

    if (data.length === 0) {
        mensajeSinClasificacion.style.display = "block";
        return;
    }

    mensajeSinClasificacion.style.display = "none";

    data.forEach(clasif => {
        const boton = document.createElement("button");
        boton.textContent = `${clasif.icono} ${clasif.nombre}`;
        boton.classList.add("boton-clasificacion");
        boton.addEventListener("click", () => {
            clasificacionActiva = clasif.id;
            document.getElementById("clasificacion-activa").textContent = `Clasificación activa: ${clasif.nombre}`;
            cerrarModal("modalAgregarClasificacion");
        });
        contenedor.appendChild(boton);
    });
}

// Guardar nueva clasificación
async function guardarClasificacion() {
    const nombreInput = document.getElementById("nombre-clasificacion").value.trim();
    const iconoSeleccionado = document.querySelector(".icono.seleccionado");

    if (!nombreInput || !iconoSeleccionado) {
        alert("Por favor, completa todos los campos.");
        return;
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        alert("Debes iniciar sesión para crear clasificaciones.");
        return;
    }

    const { data, error: insertError } = await supabase
        .from("clasificaciones")
        .insert([{
            nombre: nombreInput,
            icono: iconoSeleccionado.textContent,
            user_id: user.id
        }])
        .select()
        .single(); // esto te devuelve la fila recién insertada

    if (insertError) {
        console.error("❌ Error al guardar clasificación:", insertError.message);
        alert("Error al guardar la clasificación.");
        return;
    }

    // Establecer como clasificación activa inmediatamente
    clasificacionActiva = data.id;
    document.getElementById("clasificacion-activa").textContent = `Clasificación activa: ${data.nombre}`;

    alert("✅ Clasificación creada correctamente.");
    cerrarModal("modalClasificacion");
    await cargarClasificaciones();
}


// Manejadores de modales
function abrirModal(id) {
    document.getElementById(id).style.display = "block";
}

function cerrarModal(id) {
    document.getElementById(id).style.display = "none";
}

// Selección de icono
document.querySelectorAll(".icono").forEach(icono => {
    icono.addEventListener("click", () => {
        document.querySelectorAll(".icono").forEach(i => i.classList.remove("seleccionado"));
        icono.classList.add("seleccionado");
    });
});

// Botones
document.getElementById("btnCrearClasificacion").addEventListener("click", () => abrirModal("modalClasificacion"));
document.getElementById("btnAgregarClasificacion").addEventListener("click", cargarClasificaciones);
document.getElementById("btnGuardarClasificacion").addEventListener("click", guardarClasificacion);

// Cerrar modales
document.querySelectorAll(".cerrar").forEach(btn => {
    btn.addEventListener("click", () => {
        btn.parentElement.parentElement.style.display = "none";
    });
});
