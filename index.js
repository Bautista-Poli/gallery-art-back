import dotenv from 'dotenv';
dotenv.config();

const { registerProductRoutes }       = await import('./routes/products.js');
const { registerUploadRoutes }        = await import('./routes/imageUpload.js');
const { registerExposicionRoutes }    = await import('./routes/exposiciones.js');
const { registerArtistaImagenesRoutes } = await import('./routes/artista-imagenes.js');
const { registerAuthRoutes }          = await import('./auth/routes.js');

import express from 'express';
import cors from 'cors';

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      process.env.FRONTEND_URL,
      'https://sophievila.vercel.app',
      'http://localhost:4200',
      'http://localhost:4201',
    ].filter(Boolean);
    if (!origin || allowed.includes(origin)) callback(null, true);
    else callback(new Error(`CORS bloqueado para: ${origin}`));
  }
}));

registerAuthRoutes(app);
registerProductRoutes(app);
registerUploadRoutes(app);
registerExposicionRoutes(app);
registerArtistaImagenesRoutes(app);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`🚀 Servidor en http://localhost:${PORT}`));