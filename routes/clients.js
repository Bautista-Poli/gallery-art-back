// routes/clients.js
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { getPool } from '../db.js';
import { requireAuth } from '../auth/middleware.js';

const storage = multer.memoryStorage();
const upload  = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

async function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'art-gallery/clients', resource_type: 'image' },
      (err, result) => err ? reject(err) : resolve(result)
    );
    stream.end(buffer);
  });
}

async function destroyFromCloudinary(publicId) {
  if (!publicId) return;
  try { await cloudinary.uploader.destroy(publicId); }
  catch (err) { console.error('Error borrando imagen de Cloudinary:', err); }
}

const SELECT_COLS = `
  id,
  client_name          AS "clientName",
  home_photo           AS "homePhoto",
  home_photo_public_id AS "homePhotoPublicId",
  artwork_name         AS "artworkName",
  location,
  year,
  display_order        AS "displayOrder",
  active,
  created_at           AS "createdAt"
`;

export function registerClientsRoutes(app) {

  // ── GET /api/clients ───────────────────────────────────────
  app.get('/api/clients', async (_req, res) => {
    try {
      const { rows } = await getPool().query(`
        SELECT ${SELECT_COLS}
        FROM clients
        WHERE active = TRUE
        ORDER BY display_order ASC, id ASC
      `);
      res.json(rows);
    } catch (err) {
      console.error('GET /api/clients error:', err);
      res.status(500).json({ error: 'No se pudieron obtener los clientes.' });
    }
  });

  // ── POST /api/clients ──────────────────────────────────────
  app.post('/api/clients', requireAuth, upload.single('homePhoto'), async (req, res) => {
    const { clientName, artworkName, location, year } = req.body;

    if (!clientName || !artworkName) {
      return res.status(400).json({ error: 'clientName y artworkName son obligatorios.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Se requiere una foto (homePhoto).' });
    }

    try {
      const { rows: ordenRows } = await getPool().query(
        'SELECT COALESCE(MAX(display_order), 0) AS max_order FROM clients'
      );
      const nextOrder = parseInt(ordenRows[0].max_order, 10) + 1;

      const uploaded = await uploadToCloudinary(req.file.buffer);

      const { rows } = await getPool().query(`
        INSERT INTO clients
          (client_name, home_photo, home_photo_public_id, artwork_name, location, year, display_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING ${SELECT_COLS}
      `, [
        clientName,
        uploaded.secure_url,
        uploaded.public_id,
        artworkName,
        location || null,
        year ? parseInt(year, 10) : null,
        nextOrder,
      ]);

      res.status(201).json(rows[0]);
    } catch (err) {
      console.error('POST /api/clients error:', err);
      res.status(500).json({ error: 'Error al crear el cliente.' });
    }
  });

  // ── PUT /api/clients/:id ───────────────────────────────────
  app.put('/api/clients/:id', requireAuth, upload.single('homePhoto'), async (req, res) => {
    const { id } = req.params;
    const { clientName, artworkName, location, year, active } = req.body;

    try {
      const { rows: existing } = await getPool().query(
        `SELECT ${SELECT_COLS} FROM clients WHERE id = $1`, [id]
      );
      if (!existing.length) {
        return res.status(404).json({ error: 'Cliente no encontrado.' });
      }

      let homePhoto         = existing[0].homePhoto;
      let homePhotoPublicId = existing[0].homePhotoPublicId;

      if (req.file) {
        const uploaded = await uploadToCloudinary(req.file.buffer);
        await destroyFromCloudinary(homePhotoPublicId);
        homePhoto         = uploaded.secure_url;
        homePhotoPublicId = uploaded.public_id;
      }

      const { rows } = await getPool().query(`
        UPDATE clients SET
          client_name          = COALESCE($1, client_name),
          artwork_name         = COALESCE($2, artwork_name),
          home_photo           = $3,
          home_photo_public_id = $4,
          location             = COALESCE($5, location),
          year                 = COALESCE($6, year),
          active               = COALESCE($7, active)
        WHERE id = $8
        RETURNING ${SELECT_COLS}
      `, [
        clientName  || null,
        artworkName || null,
        homePhoto,
        homePhotoPublicId,
        location    || null,
        year ? parseInt(year, 10) : null,
        active !== undefined ? active === 'true' : null,
        id,
      ]);

      res.json(rows[0]);
    } catch (err) {
      console.error(`PUT /api/clients/${id} error:`, err);
      res.status(500).json({ error: 'Error al actualizar el cliente.' });
    }
  });

  // ── DELETE /api/clients/:id ────────────────────────────────
  app.delete('/api/clients/:id', requireAuth, async (req, res) => {
    const { id } = req.params;

    try {
      const { rows } = await getPool().query(
        `SELECT ${SELECT_COLS} FROM clients WHERE id = $1`, [id]
      );
      if (!rows.length) return res.status(404).json({ error: 'Cliente no encontrado.' });

      await destroyFromCloudinary(rows[0].homePhotoPublicId);
      await getPool().query('DELETE FROM clients WHERE id = $1', [id]);

      res.status(204).send();
    } catch (err) {
      console.error(`DELETE /api/clients/${id} error:`, err);
      res.status(500).json({ error: 'Error al eliminar el cliente.' });
    }
  });
}