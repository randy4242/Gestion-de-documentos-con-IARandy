// js/menuManager.js

document.addEventListener("DOMContentLoaded", () => {
    cargarMenuLateral();
});

function cargarMenuLateral() {
    const menuContainer = document.getElementById("menuContainer");

    if (!menuContainer) {
        console.error("No se encontró #menuContainer");
        return;
    }

    fetch("menu.html")
        .then(response => response.text())
        .then(data => {
            menuContainer.innerHTML = data;
            inicializarMenu(); // 👈 Importante inicializar después de cargar
        })
        .catch(error => {
            console.error("Error cargando el menú:", error);
        });
}

function inicializarMenu() {
    const btnMenu = document.getElementById("btnMenu");
    const menuLateral = document.getElementById("menuLateral");
    const container = document.querySelector(".container") || document.querySelector(".clasificaciones-container");

    if (!btnMenu || !menuLateral) {
        console.error("No se pudo inicializar el menú.");
        return;
    }

    btnMenu.addEventListener("click", (e) => {
        e.stopPropagation();
        menuLateral.classList.toggle("active");

        if (container) {
            container.style.marginLeft = menuLateral.classList.contains("active") ? "220px" : "80px";
        }
    });

    document.addEventListener("click", (e) => {
        if (!menuLateral.contains(e.target) && e.target.id !== "btnMenu") {
            menuLateral.classList.remove("active");
            if (container) {
                container.style.marginLeft = "80px";
            }
        }
    });
}
