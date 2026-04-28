// routes/exposiciones.js
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { getPool } from '../db.js';

const storage = multer.memoryStorage();
const upload  = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

async function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'art-gallery/exposiciones', resource_type: 'image' },
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
  id, titulo, tipo, venue, anio, descripcion,
  imagen_url       AS "imagenUrl",
  imagen_public_id AS "imagenPublicId",
  orden,
  fecha,
  link_entradas    AS "linkEntradas",
  created_at       AS "createdAt"
`;

export function registerExposicionRoutes(app) {

  // ── GET /api/exposiciones ──────────────────────────────────
  app.get('/api/exposiciones', async (_req, res) => {
    try {
      const { rows } = await getPool().query(
        `SELECT ${SELECT_COLS} FROM exposiciones ORDER BY anio DESC, orden ASC, id DESC`
      );
      res.json(rows);
    } catch (err) {
      console.error('GET /api/exposiciones error:', err);
      res.status(500).json({ error: 'No se pudieron obtener las exposiciones.' });
    }
  });

  // ── GET /api/exposiciones/:id ──────────────────────────────
  app.get('/api/exposiciones/:id', async (req, res) => {
    try {
      const { rows } = await getPool().query(
        `SELECT ${SELECT_COLS} FROM exposiciones WHERE id = $1`, [req.params.id]
      );
      if (!rows.length) return res.status(404).json({ error: 'Exposición no encontrada.' });
      res.json(rows[0]);
    } catch (err) {
      console.error('GET /api/exposiciones/:id error:', err);
      res.status(500).json({ error: 'Error al obtener la exposición.' });
    }
  });

  // ── POST /api/exposiciones ─────────────────────────────────
  app.post('/api/exposiciones', upload.single('imagen'), async (req, res) => {
    const {
      titulo, tipo, venue, anio,
      descripcion = '', orden = 0,
      fecha = null, linkEntradas = null,
    } = req.body;

    if (!titulo || !tipo || !venue || !anio)
      return res.status(400).json({ error: 'Faltan campos obligatorios (titulo, tipo, venue, anio).' });
    if (!['individual', 'colectiva'].includes(tipo))
      return res.status(422).json({ error: "tipo debe ser 'individual' o 'colectiva'." });

    let imagenUrl = null, imagenPublicId = null;
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer);
        imagenUrl = result.secure_url; imagenPublicId = result.public_id;
      } catch (err) {
        console.error('Cloudinary upload error:', err);
        return res.status(500).json({ error: 'Error al subir la imagen.' });
      }
    }

    try {
      const { rows } = await getPool().query(`
        INSERT INTO exposiciones
          (titulo, tipo, venue, anio, descripcion, imagen_url, imagen_public_id, orden, fecha, link_entradas)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        RETURNING ${SELECT_COLS}
      `, [titulo, tipo, venue, Number(anio), descripcion, imagenUrl, imagenPublicId,
          Number(orden), fecha || null, linkEntradas || null]);

      res.status(201).json(rows[0]);
    } catch (err) {
      await destroyFromCloudinary(imagenPublicId);
      console.error('POST /api/exposiciones error:', err);
      res.status(500).json({ error: 'Error al crear la exposición.' });
    }
  });

  // ── PUT /api/exposiciones/:id ──────────────────────────────
  app.put('/api/exposiciones/:id', upload.single('imagen'), async (req, res) => {
    const { id } = req.params;
    const { titulo, tipo, venue, anio, descripcion, orden, fecha, linkEntradas } = req.body;

    if (tipo && !['individual', 'colectiva'].includes(tipo))
      return res.status(422).json({ error: "tipo debe ser 'individual' o 'colectiva'." });

    try {
      const { rows: existing } = await getPool().query(
        'SELECT imagen_public_id FROM exposiciones WHERE id = $1', [id]
      );
      if (!existing.length) return res.status(404).json({ error: 'Exposición no encontrada.' });

      let imagenUrl = null, imagenPublicId = null;
      if (req.file) {
        const result = await uploadToCloudinary(req.file.buffer);
        imagenUrl = result.secure_url; imagenPublicId = result.public_id;
        await destroyFromCloudinary(existing[0].imagen_public_id);
      }

      const { rows } = await getPool().query(`
        UPDATE exposiciones SET
          titulo           = COALESCE($1,  titulo),
          tipo             = COALESCE($2,  tipo),
          venue            = COALESCE($3,  venue),
          anio             = COALESCE($4,  anio),
          descripcion      = COALESCE($5,  descripcion),
          imagen_url       = COALESCE($6,  imagen_url),
          imagen_public_id = COALESCE($7,  imagen_public_id),
          orden            = COALESCE($8,  orden),
          fecha            = $9,
          link_entradas    = $10,
          updated_at       = CURRENT_TIMESTAMP
        WHERE id = $11
        RETURNING ${SELECT_COLS}
      `, [
        titulo      ?? null,
        tipo        ?? null,
        venue       ?? null,
        anio   != null ? Number(anio)  : null,
        descripcion ?? null,
        imagenUrl      || null,
        imagenPublicId || null,
        orden  != null ? Number(orden) : null,
        fecha          || null,
        linkEntradas   || null,
        id,
      ]);

      res.json(rows[0]);
    } catch (err) {
      console.error('PUT /api/exposiciones/:id error:', err);
      res.status(500).json({ error: 'Error al actualizar la exposición.' });
    }
  });

  // ── DELETE /api/exposiciones/:id ───────────────────────────
  app.delete('/api/exposiciones/:id', async (req, res) => {
    try {
      const { rows } = await getPool().query(
        'SELECT imagen_public_id FROM exposiciones WHERE id = $1', [req.params.id]
      );
      if (!rows.length) return res.status(404).json({ error: 'Exposición no encontrada.' });
      await destroyFromCloudinary(rows[0].imagen_public_id);
      await getPool().query('DELETE FROM exposiciones WHERE id = $1', [req.params.id]);
      res.status(204).send();
    } catch (err) {
      console.error('DELETE /api/exposiciones/:id error:', err);
      res.status(500).json({ error: 'Error al eliminar la exposición.' });
    }
  });
}