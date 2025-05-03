import { supabase } from "./supabase.js";

document.addEventListener("DOMContentLoaded", async function () {
    const form = document.getElementById("change-password-form");
    const mensaje = document.getElementById("mensaje");

    if (!form) {
        console.error("Error: No se encontró el formulario.");
        return;
    }

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const newPassword = document.getElementById("new-password").value;
        const confirmPassword = document.getElementById("confirm-password").value;

        // Limpiar mensajes anteriores
        mensaje.textContent = "";
        mensaje.style.color = "black";

        // Verificar que las contraseñas coincidan antes de cualquier otra operación
        if (newPassword !== confirmPassword) {
            mensaje.textContent = "❌ Las contraseñas no coinciden.";
            mensaje.style.color = "red";
            return;
        }

        // Obtener el parámetro "access_token" de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const access_token = urlParams.get('access_token');

        if (!access_token) {
            mensaje.textContent = "❌ Error: No se ha proporcionado un token válido.";
            mensaje.style.color = "red";
            return;
        }

        try {
            // Restablecer la contraseña usando el token
            const { error } = await supabase.auth.api.updateUser(access_token, {
                password: newPassword
            });

            // Verificar si hubo un error al cambiar la contraseña
            if (error) {
                mensaje.textContent = `❌ Error al cambiar la contraseña: ${error.message}`;
                mensaje.style.color = "red";
                return;
            }

            // Si no hubo errores, informar al usuario
            mensaje.textContent = "✅ Contraseña cambiada exitosamente. Redirigiendo...";
            mensaje.style.color = "green";

            // Redirigir después de 3 segundos
            setTimeout(() => {
                window.location.href = "Frontend/login.html"; // Redirige al login
            }, 3000);

        } catch (err) {
            console.error("Error inesperado:", err);
            mensaje.textContent = `❌ Error inesperado: ${err.message}`;
            mensaje.style.color = "red";
        }
    });
});
