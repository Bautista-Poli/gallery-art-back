import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { getPool } from '../db.js';
import { requireAuth } from '../auth/middleware.js';

const storage = multer.memoryStorage();
const mediaFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/ogg'];
  allowed.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error('Solo se permiten imágenes (JPEG, PNG, WEBP, GIF) o videos (MP4, WEBM, OGG)'));
};
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 }, fileFilter: mediaFilter });

async function uploadToCloudinary(buffer, resourceType) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'art-gallery/carousel', resource_type: resourceType },
      (err, result) => err ? reject(err) : resolve(result)
    );
    stream.end(buffer);
  });
}

async function destroyFromCloudinary(publicId, resourceType) {
  if (!publicId) return;
  try { await cloudinary.uploader.destroy(publicId, { resource_type: resourceType }); }
  catch (err) { console.error('Error borrando recurso de Cloudinary:', err); }
}

const SELECT_COLS = `
  id::text AS id,
  type,
  src,
  public_id AS "publicId",
  alt,
  orden
`;

export function registerCarouselRoutes(app) {

  // ── GET /api/itemsCarrousel ────────────────────────────────
  app.get('/api/itemsCarrousel', async (_req, res) => {
    try {
      const { rows } = await getPool().query(`
        SELECT ${SELECT_COLS}
        FROM carousel_items
        ORDER BY orden ASC, id ASC
      `);
      res.json(rows);
    } catch (err) {
      console.error('GET /api/itemsCarrousel error:', err);
      res.status(500).json({ error: 'No se pudieron obtener los items del carrusel.' });
    }
  });

  // ── POST /api/itemsCarrousel ───────────────────────────────
  // Acepta un archivo (campo "file") o una URL directa (campo "src")
  app.post('/api/itemsCarrousel', requireAuth, upload.single('file'), async (req, res) => {
    const { alt = '', orden = 0, src: srcDirect } = req.body;

    if (!req.file && !srcDirect) {
      return res.status(400).json({ error: 'Se requiere un archivo o una URL en el campo src.' });
    }

    try {
      let src, publicId, type;

      if (req.file) {
        const isVideo = req.file.mimetype.startsWith('video/');
        const resourceType = isVideo ? 'video' : 'image';
        type = isVideo ? 'video' : 'image';
        const uploaded = await uploadToCloudinary(req.file.buffer, resourceType);
        src = uploaded.secure_url;
        publicId = uploaded.public_id;
      } else {
        src = srcDirect;
        publicId = null;
        type = req.body.type || 'video';
      }

      const { rows } = await getPool().query(`
        INSERT INTO carousel_items (type, src, public_id, alt, orden)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING ${SELECT_COLS}
      `, [type, src, publicId, alt, parseInt(orden, 10)]);

      res.status(201).json(rows[0]);
    } catch (err) {
      console.error('POST /api/itemsCarrousel error:', err);
      res.status(500).json({ error: 'Error al crear el item del carrusel.' });
    }
  });

  // ── PUT /api/itemsCarrousel/:id ────────────────────────────
  app.put('/api/itemsCarrousel/:id', requireAuth, upload.single('file'), async (req, res) => {
    const { id } = req.params;
    const { alt, orden, src: srcDirect } = req.body;

    try {
      const { rows: existing } = await getPool().query(
        `SELECT ${SELECT_COLS} FROM carousel_items WHERE id = $1`, [id]
      );
      if (!existing.length) {
        return res.status(404).json({ error: 'Item no encontrado.' });
      }

      let { src, publicId, type } = existing[0];

      if (req.file) {
        const isVideo = req.file.mimetype.startsWith('video/');
        const resourceType = isVideo ? 'video' : 'image';
        const uploaded = await uploadToCloudinary(req.file.buffer, resourceType);
        await destroyFromCloudinary(publicId, existing[0].type);
        src = uploaded.secure_url;
        publicId = uploaded.public_id;
        type = isVideo ? 'video' : 'image';
      } else if (srcDirect) {
        await destroyFromCloudinary(publicId, existing[0].type);
        src = srcDirect;
        publicId = null;
        type = req.body.type || type;
      }

      const { rows } = await getPool().query(`
        UPDATE carousel_items SET
          type      = $1,
          src       = $2,
          public_id = $3,
          alt       = COALESCE($4, alt),
          orden     = COALESCE($5, orden)
        WHERE id = $6
        RETURNING ${SELECT_COLS}
      `, [
        type,
        src,
        publicId,
        alt   || null,
        orden ? parseInt(orden, 10) : null,
        id,
      ]);

      res.json(rows[0]);
    } catch (err) {
      console.error(`PUT /api/itemsCarrousel/${id} error:`, err);
      res.status(500).json({ error: 'Error al actualizar el item del carrusel.' });
    }
  });

  // ── DELETE /api/itemsCarrousel/:id ────────────────────────
  app.delete('/api/itemsCarrousel/:id', requireAuth, async (req, res) => {
    const { id } = req.params;

    try {
      const { rows } = await getPool().query(
        `SELECT ${SELECT_COLS} FROM carousel_items WHERE id = $1`, [id]
      );
      if (!rows.length) return res.status(404).json({ error: 'Item no encontrado.' });

      await destroyFromCloudinary(rows[0].publicId, rows[0].type);
      await getPool().query('DELETE FROM carousel_items WHERE id = $1', [id]);

      res.status(204).send();
    } catch (err) {
      console.error(`DELETE /api/itemsCarrousel/${id} error:`, err);
      res.status(500).json({ error: 'Error al eliminar el item del carrusel.' });
    }
  });
}
