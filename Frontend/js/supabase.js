import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// 🔹 Configura Supabase con tus credenciales
const supabaseUrl = 'https://skytppreqzymxxuuzagi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNreXRwcHJlcXp5bXh4dXV6YWdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0NDQ2OTEsImV4cCI6MjA2MTAyMDY5MX0.AIZehuKH4JCTQliQAlx4wAYMVoRVQ7fKt7H-WcSIfW0';

export const supabase = createClient(supabaseUrl, supabaseKey);

// 🔹 Registrar usuario y devolver el objeto `user`
export async function registerUser(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(error.message);
    console.log("ID del usuario registrado:", data.user.id);
    return data.user;
}

// 🔹 Crear perfil (requiere sesión activa)
export async function createUserProfile(userId, nombre) {
    const { error } = await supabase
        .from("perfiles")
        .insert([{
            id: userId,
            nombre: nombre,
            avatar_url: null
        }]);

    if (error) {
        console.error("❌ Error al crear perfil:", error.message);
        throw new Error(error.message);
    }

    console.log("✅ Perfil creado para:", userId);
}

// 🔹 Iniciar sesión
export async function loginUser(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return data;
}

// 🔹 Cerrar sesión
export async function logoutUser() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
}

// Para debugging en consola
window.supabase = supabase;
