require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5000;

// Conectar a Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Middleware
app.use(cors());
app.use(express.json());

// Ruta de prueba para verificar conexión con Supabase
app.get('/test-supabase', async (req, res) => {
    const { data, error } = await supabase.from('documentos').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// Ruta de prueba para verificar el servidor
app.get('/', (req, res) => {
    res.send('¡Servidor funcionando correctamente! 🚀');
});

// 🔹 Endpoint para registrar usuario
app.post('/register', async (req, res) => {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Registro exitoso', user: data });
});

// 🔹 Endpoint para iniciar sesión
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Inicio de sesión exitoso', user: data });
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
