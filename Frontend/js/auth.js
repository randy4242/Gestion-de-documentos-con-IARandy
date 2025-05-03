import { supabase, registerUser, createUserProfile, loginUser, logoutUser } from "./supabase.js";

document.addEventListener("DOMContentLoaded", function () {
    // 🔹 Manejo del formulario de registro
    const registerForm = document.getElementById("register-form");
    if (registerForm) {
        registerForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const nombre = document.getElementById("nombre").value.trim();
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value.trim();
            const confirmPassword = document.getElementById("confirm-password").value.trim();

            if (!nombre || !email || !password || !confirmPassword) {
                alert("⚠️ Todos los campos son obligatorios.");
                return;
            }

            if (password !== confirmPassword) {
                alert("⚠️ Las contraseñas no coinciden.");
                return;
            }

            try {
                // 🔹 Crear usuario en Supabase Auth
                const user = await registerUser(email, password);
                if (!user) throw new Error("No se pudo registrar el usuario.");

                // 🔹 Crear perfil en la tabla `perfiles`
                await createUserProfile(user.id, nombre);

                alert("✅ Registro exitoso. Verifica tu correo electrónico.");
                window.location.href = "login.html";
            } catch (error) {
                console.error("❌ Error en el registro:", error.message);
                alert("Error en el registro: " + error.message);
            }
        });
    }

    // 🔹 Manejo del formulario de inicio de sesión
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value.trim();

            if (!email || !password) {
                alert("⚠️ Debes llenar ambos campos.");
                return;
            }

            try {
                await loginUser(email, password);
                alert("✅ Sesión iniciada correctamente.");
                window.location.href = "index.html";
            } catch (error) {
                console.error("❌ Error al iniciar sesión:", error.message);
                alert("Error: " + error.message);
            }
        });
    }

    // 🔹 Manejo del cierre de sesión
    const logoutButton = document.getElementById("logout-button");
    if (logoutButton) {
        logoutButton.addEventListener("click", async function () {
            try {
                await logoutUser();
                alert("✅ Sesión cerrada exitosamente.");
                window.location.href = "login.html";
            } catch (error) {
                console.error("❌ Error al cerrar sesión:", error.message);
                alert("Error al cerrar sesión: " + error.message);
            }
        });
    }
});

