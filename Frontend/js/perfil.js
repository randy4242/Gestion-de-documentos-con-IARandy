import { supabase } from "./supabase.js";

document.addEventListener("DOMContentLoaded", async function () {
    const profileForm = document.getElementById("profile-form");
    const fileInput = document.getElementById("avatar_file");

    // Obtener usuario autenticado
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        alert("No estás logueado. Redirigiendo a la página de inicio de sesión.");
        window.location.href = "login.html";
        return;
    }

    // Cargar los datos del perfil del usuario desde Supabase
    const { data: perfil } = await supabase
        .from("perfiles")
        .select("nombre, avatar_url")
        .eq("id", user.id)
        .single();  // Seleccionamos solo un perfil

    // Verificamos si el elemento existe antes de intentar modificarlo
    const profileNameElement = document.getElementById("profile-name");
    const profileAvatarElement = document.getElementById("profile-avatar");

    if (profileNameElement && perfil) {
        profileNameElement.textContent = perfil.nombre;
    } else {
        console.error("No se encontró el elemento con id 'profile-name' o el perfil no existe.");
    }

    if (profileAvatarElement && perfil) {
        profileAvatarElement.src = perfil.avatar_url || "default-avatar.png";
    } else {
        console.error("No se encontró el elemento con id 'profile-avatar' o el perfil no tiene avatar.");
    }

    // Manejo del cierre de sesión
    const logoutButton = document.getElementById("logout-button");
    if (logoutButton) {
        logoutButton.addEventListener("click", async function () {
            try {
                await supabase.auth.signOut();
                alert("Sesión cerrada exitosamente");
                window.location.href = "login.html"; // Redirigir al login
            } catch (error) {
                console.error("Error al cerrar sesión:", error.message);
                alert("Error al cerrar sesión: " + error.message);
            }
        });
    }

    // Formulario de actualización de perfil
    profileForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const nombre = document.getElementById("nombre").value.trim();

        if (!nombre) {
            alert("El nombre es obligatorio.");
            return;
        }

        let avatarUrl = null;

        // Si el usuario sube un archivo, lo guardamos en Supabase Storage
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const filePath = `avatars/${user.id}/${file.name}`;

            const { data, error } = await supabase.storage.from("avatars").upload(filePath, file, {
                cacheControl: "3600",
                upsert: true,
            });

            if (error) {
                console.error("Error al subir imagen:", error.message);
                alert("Error al subir la imagen.");
                return;
            }

            // Generamos la URL pública de la imagen subida
            const { data: publicURL } = supabase.storage.from("avatars").getPublicUrl(filePath);
            avatarUrl = publicURL.publicUrl;
        }

        try {
            // Verificar si ya tiene un perfil
            const { data: perfilExistente } = await supabase
                .from("perfiles")
                .select("id")
                .eq("id", user.id)
                .single();

            if (perfilExistente) {
                // Si ya tiene perfil, actualizamos la información
                const { error } = await supabase
                    .from("perfiles")
                    .update({ nombre, avatar_url: avatarUrl || null })
                    .eq("id", user.id);

                if (error) {
                    console.error("Error al actualizar perfil:", error.message);
                    alert("Error al actualizar perfil.");
                    return;
                }

                alert("Perfil actualizado exitosamente.");
            } else {
                // Si no tiene perfil, lo creamos
                const { error } = await supabase
                    .from("perfiles")
                    .insert([{ id: user.id, nombre, avatar_url: avatarUrl || null }]);

                if (error) {
                    console.error("Error al crear perfil:", error.message);
                    alert("Error al crear perfil.");
                    return;
                }

                alert("Perfil creado exitosamente.");
            }

            window.location.href = "index.html"; // Redirige a la página principal
        } catch (err) {
            console.error("Error inesperado:", err.message);
            alert("Ocurrió un error. Intenta de nuevo.");
        }
    });
});
