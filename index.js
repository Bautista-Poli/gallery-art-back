import dotenv from 'dotenv';
dotenv.config();

const { registerProductRoutes } = await import('./routes/products.js');
const { registerUploadRoutes }  = await import('./routes/imageUpload.js');

import express from 'express';
import cors from 'cors';

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      process.env.FRONTEND_URL,
      'http://localhost:4200',
      'http://localhost:4201',
    ].filter(Boolean);
    if (!origin || allowed.includes(origin)) callback(null, true);
    else callback(new Error(`CORS bloqueado para: ${origin}`));
  }
}));

registerProductRoutes(app);
registerUploadRoutes(app);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`🚀 Servidor en http://localhost:${PORT}`));