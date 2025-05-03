document.addEventListener("DOMContentLoaded", () => {
    const buscarInput = document.getElementById("buscar");
    const filtroTipo = document.getElementById("filtro-tipo");
    const tablaDocumentos = document.getElementById("tabla-documentos");

    // 🔥 Corrección: buscar bien cualquier contenedor válido
    const container = document.querySelector(".container, .contenido, .clasificaciones-container");

    // Cargar el menú dinámicamente
    const menuContainer = document.getElementById("menuContainer");

    fetch("menu.html")
        .then(response => response.text())
        .then(data => {
            menuContainer.innerHTML = data;
            inicializarMenu(); // ✅ Inicializar después de cargar
        })
        .catch(error => console.error("Error cargando el menú:", error));

    // Datos de prueba
    let documentos = [
        { nombre: "Informe Financiero 2024", tipo: "Financiero", fecha: "2025-03-20", resumen: "Resumen del informe", palabrasClave: "finanzas, cuentas, balance", archivo: "documento.pdf" },
        { nombre: "Inventario Q1", tipo: "Inventario", fecha: "2025-03-18", resumen: "Lista de productos en stock", palabrasClave: "almacén, stock", archivo: "inventario.xlsx" }
    ];

    // Mostrar documentos en la tabla
    function mostrarDocumentos() {
        if (!tablaDocumentos) return; // 🔥 Verificar que exista

        tablaDocumentos.innerHTML = "";
        const filtro = buscarInput?.value.toLowerCase() || "";
        const tipoSeleccionado = filtroTipo?.value || "todos";

        documentos
            .filter(doc =>
                (doc.nombre.toLowerCase().includes(filtro) || doc.palabrasClave.toLowerCase().includes(filtro)) &&
                (tipoSeleccionado === "todos" || doc.tipo === tipoSeleccionado)
            )
            .forEach(doc => {
                const fila = `<tr>
                    <td>${doc.nombre}</td>
                    <td>${doc.tipo}</td>
                    <td>${doc.fecha}</td>
                    <td>${doc.resumen}</td>
                    <td>${doc.palabrasClave}</td>
                    <td><a href="${doc.archivo}" target="_blank">📄 Ver</a></td>
                </tr>`;
                tablaDocumentos.innerHTML += fila;
            });
    }

    if (buscarInput) buscarInput.addEventListener("input", mostrarDocumentos);
    if (filtroTipo) filtroTipo.addEventListener("change", mostrarDocumentos);

    mostrarDocumentos();

    // Inicializar comportamiento del menú
    function inicializarMenu() {
        const btnMenu = document.getElementById("btnMenu");
        const menuLateral = document.getElementById("menuLateral");

        if (btnMenu && menuLateral) {
            btnMenu.addEventListener("click", () => {
                menuLateral.classList.toggle("active");

                if (container) {
                    container.style.marginLeft = menuLateral.classList.contains("active") ? "200px" : "80px";
                }
            });

            document.addEventListener("click", (event) => {
                if (!menuLateral.contains(event.target) && !btnMenu.contains(event.target)) {
                    menuLateral.classList.remove("active");
                    if (container) {
                        container.style.marginLeft = "80px";
                    }
                }
            });
        } else {
            console.error("El menú no se ha cargado correctamente.");
        }
    }
});

// ✅ Eliminamos el segundo DOMContentLoaded que ya no era necesario
// porque ahora preview.js gestiona toda la vista previa.
