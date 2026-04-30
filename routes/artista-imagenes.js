// routes/artista-imagenes.js
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { getPool } from '../db.js';
import { requireAuth } from '../auth/middleware.js';

const storage = multer.memoryStorage();
const upload  = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

async function uploadToCloudinary(buffer, slot) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'art-gallery/artista', public_id: `artista_${slot}_${Date.now()}`, resource_type: 'image' },
      (err, result) => err ? reject(err) : resolve(result)
    );
    stream.end(buffer);
  });
}

async function destroyFromCloudinary(publicId) {
  if (!publicId || publicId.startsWith('placeholder')) return;
  try { await cloudinary.uploader.destroy(publicId); }
  catch (err) { console.error('Error borrando imagen de Cloudinary:', err); }
}

const SELECT_COLS = `
  id, slot, imagen_url AS "imagenUrl",
  imagen_public_id AS "imagenPublicId",
  orden, updated_at AS "updatedAt"
`;

export function registerArtistaImagenesRoutes(app) {

  // ── GET /api/artista-imagenes ──────────────────────────────
  // Devuelve todas las imágenes ordenadas
  app.get('/api/artista-imagenes', async (_req, res) => {
    try {
      const { rows } = await getPool().query(
        `SELECT ${SELECT_COLS} FROM artista_imagenes ORDER BY orden ASC, id ASC`
      );
      res.json(rows);
    } catch (err) {
      console.error('GET /api/artista-imagenes error:', err);
      res.status(500).json({ error: 'No se pudieron obtener las imágenes.' });
    }
  });

  // ── PUT /api/artista-imagenes/:slot ────────────────────────
  // Reemplaza la imagen de un slot existente
  app.put('/api/artista-imagenes/:slot', requireAuth, upload.single('imagen'), async (req, res) => {
    const { slot } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'Se requiere una imagen.' });
    }

    try {
      // Buscar el slot existente
      const { rows: existing } = await getPool().query(
        `SELECT ${SELECT_COLS} FROM artista_imagenes WHERE slot = $1`, [slot]
      );
      if (!existing.length) {
        return res.status(404).json({ error: `Slot "${slot}" no encontrado.` });
      }

      // Subir nueva imagen
      const result = await uploadToCloudinary(req.file.buffer, slot);

      // Borrar la anterior (solo si no es placeholder)
      await destroyFromCloudinary(existing[0].imagenPublicId);

      // Actualizar en DB
      const { rows } = await getPool().query(`
        UPDATE artista_imagenes
        SET imagen_url = $1, imagen_public_id = $2, updated_at = CURRENT_TIMESTAMP
        WHERE slot = $3
        RETURNING ${SELECT_COLS}
      `, [result.secure_url, result.public_id, slot]);

      res.json(rows[0]);
    } catch (err) {
      console.error(`PUT /api/artista-imagenes/${slot} error:`, err);
      res.status(500).json({ error: 'Error al actualizar la imagen.' });
    }
  });

  // ── POST /api/artista-imagenes ─────────────────────────────
  // Agrega una imagen nueva a la galería (crea un slot gallery_N nuevo)
  app.post('/api/artista-imagenes', requireAuth, upload.single('imagen'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'Se requiere una imagen.' });
    }

    try {
      // Calcular el siguiente número de galería
      const { rows: galleryRows } = await getPool().query(`
        SELECT slot FROM artista_imagenes
        WHERE slot LIKE 'gallery_%'
        ORDER BY orden DESC LIMIT 1
      `);

      const lastNum = galleryRows.length
        ? parseInt(galleryRows[0].slot.replace('gallery_', ''), 10)
        : 0;
      const newSlot = `gallery_${lastNum + 1}`;

      // Calcular orden máximo
      const { rows: ordenRows } = await getPool().query(
        'SELECT COALESCE(MAX(orden), 0) AS max_orden FROM artista_imagenes'
      );
      const nextOrden = parseInt(ordenRows[0].max_orden, 10) + 1;

      const result = await uploadToCloudinary(req.file.buffer, newSlot);

      const { rows } = await getPool().query(`
        INSERT INTO artista_imagenes (slot, imagen_url, imagen_public_id, orden)
        VALUES ($1, $2, $3, $4)
        RETURNING ${SELECT_COLS}
      `, [newSlot, result.secure_url, result.public_id, nextOrden]);

      res.status(201).json(rows[0]);
    } catch (err) {
      console.error('POST /api/artista-imagenes error:', err);
      res.status(500).json({ error: 'Error al agregar la imagen.' });
    }
  });

  // ── DELETE /api/artista-imagenes/:slot ─────────────────────
  // Solo permite borrar slots de galería, no hero ni fullbleed
  app.delete('/api/artista-imagenes/:slot', requireAuth, async (req, res) => {
    const { slot } = req.params;

    if (slot === 'hero' || slot === 'fullbleed') {
      return res.status(400).json({
        error: 'Las imágenes hero y fullbleed no se pueden eliminar, solo reemplazar.'
      });
    }

    try {
      const { rows } = await getPool().query(
        `SELECT ${SELECT_COLS} FROM artista_imagenes WHERE slot = $1`, [slot]
      );
      if (!rows.length) return res.status(404).json({ error: 'Imagen no encontrada.' });

      await destroyFromCloudinary(rows[0].imagenPublicId);
      await getPool().query('DELETE FROM artista_imagenes WHERE slot = $1', [slot]);
      res.status(204).send();
    } catch (err) {
      console.error(`DELETE /api/artista-imagenes/${slot} error:`, err);
      res.status(500).json({ error: 'Error al eliminar la imagen.' });
    }
  });
}