import { supabase } from "./supabase.js";

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("reset-form");
    const emailInput = document.getElementById("email");
    const statusMessage = document.createElement("p"); // Crear un mensaje de estado
    form.appendChild(statusMessage); // Añadir el mensaje de estado al formulario

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = emailInput.value.trim();

        if (!email) {
            statusMessage.textContent = "❌ Por favor ingresa un correo electrónico válido.";
            statusMessage.style.color = "red";
            return;
        }

        try {
            // Enviar solicitud de recuperación de contraseña con Supabase
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: "https://leximargimenez23.github.io/Digitalizaci-n-de-archivos/Frontend/cambiarcontrasena.html?access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2JrZG5pZHpsdnN6eG9rYXNybW9sLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI0ODI0OWJkYy05MzQ4LTQzZjgtOThkZi00NTY4YmY4Nzg3YmMiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzQyOTM0NTIxLCJpYXQiOjE3NDI5MzA5MjEsImVtYWlsIjoibGV4aW1hcmdpbWVuZXpAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YXRhY3QiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6ImxleGltYXJnaW1lbmV6QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInN1YiI6IjQ4MjQ5YmRjLTkzNDgtNDNmOC05OGRmLTQ1NjhiZjg3ODdiYyJ9.FfXHBlAi3SPdmEbNReitK6mIVq0GRfLkX-ktGN1hI4o"
            });

            if (error) {
                statusMessage.textContent = `❌ Error al enviar el correo: ${error.message}`;
                statusMessage.style.color = "red";
            } else {
                statusMessage.textContent = "✅ Te hemos enviado un correo con instrucciones para restablecer tu contraseña.";
                statusMessage.style.color = "green";
            }
        } catch (err) {
            console.error("Error inesperado:", err);
            statusMessage.textContent = `❌ Error inesperado: ${err.message}`;
            statusMessage.style.color = "red";
        }
    });
});
