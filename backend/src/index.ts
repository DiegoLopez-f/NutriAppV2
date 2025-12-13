import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.routes';

// Inicializar App
const app = express();
const port = 3000;

// Configurar Middlewares
app.use(cors());
app.use(express.json());

// Usar Rutas
// Todas las rutas ahora empiezan con /api y se manejan en api.routes.ts
app.use('/api', apiRoutes);

// Iniciar servidor
app.listen(port, () => {
    console.log(`🚀 Servidor backend modular corriendo en http://localhost:${port}`);
});