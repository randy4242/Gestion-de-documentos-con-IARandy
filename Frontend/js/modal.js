document.getElementById("btnCrearClasificacion").addEventListener("click", () => {
    document.getElementById("modalClasificacion").style.display = "flex";
});

document.querySelector(".cerrar").addEventListener("click", () => {
    document.getElementById("modalClasificacion").style.display = "none";
});

// Manejo de selección de iconos
document.querySelectorAll(".icono").forEach(icono => {
    icono.addEventListener("click", () => {
        document.querySelectorAll(".icono").forEach(i => i.classList.remove("seleccionado"));
        icono.classList.add("seleccionado");
    });
});

document.getElementById("btnAgregarClasificacion").addEventListener("click", () => {
    const contenedorClasificaciones = document.getElementById("contenedor-clasificaciones");
    const mensajeSinClasificacion = document.getElementById("mensajeSinClasificacion");

    // Simulación de lista de clasificaciones (vacía por ahora)
    const clasificaciones = []; // 🔹 En un futuro, se llenará con la base de datos

    contenedorClasificaciones.innerHTML = ""; // Limpiar lista previa

    if (clasificaciones.length === 0) {
        mensajeSinClasificacion.style.display = "block";
    } else {
        mensajeSinClasificacion.style.display = "none";
        clasificaciones.forEach(clasificacion => {
            const div = document.createElement("div");
            div.textContent = clasificacion;
            div.classList.add("opcion-clasificacion");
            contenedorClasificaciones.appendChild(div);
        });
    }

    document.getElementById("modalAgregarClasificacion").style.display = "flex";
});

document.querySelector("#modalAgregarClasificacion .cerrar").addEventListener("click", () => {
    document.getElementById("modalAgregarClasificacion").style.display = "none";
});
