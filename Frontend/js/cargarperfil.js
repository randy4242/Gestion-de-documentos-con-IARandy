import { supabase } from "./supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
  const contenedor = document.getElementById("contenedor-avatar");
  if (!contenedor) return;

  // Carga el HTML del avatar
  const html = await fetch("avatar.html").then(res => res.text());
  contenedor.innerHTML = html;

  // Obtener el usuario actual
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Obtener perfil
  const { data: perfil, error } = await supabase
    .from("perfiles")
    .select("nombre, avatar_url")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("❌ Error cargando perfil:", error.message);
    return;
  }

  // Mostrar nombre y avatar
  document.getElementById("profile-name").textContent = perfil.nombre;
  document.getElementById("profile-avatar").src = perfil.avatar_url || "imagenes/default-avatar.png";

  // Cerrar sesión
  const logoutButton = document.getElementById("logout-button");
  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      const { error } = await supabase.auth.signOut();
      if (!error) {
        localStorage.clear();
        window.location.href = "login.html";
      } else {
        alert("❌ Error al cerrar sesión");
      }
    });
  }
});
