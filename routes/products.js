// routes/products.js
import { getPool } from '../db.js';

export function registerProductRoutes(app) {

  // ── GET /api/products ────────────────────────────────────────
  app.get('/api/products', async (req, res) => {
    const { cat } = req.query;
    try {
      const conditions = ['p.active = true'];
      const values     = [];

      if (cat && cat !== 'all') {
        values.push(cat);
        conditions.push(`p.cat = $${values.length}`);
      }

      const { rows } = await getPool().query(`
        SELECT
          p.id,
          p.name,
          p.cat,
          p.price,
          p.original_price  AS "originalPrice",   -- ← agregar
          p.is_new          AS "isNew",           -- ← agregar
          p.is_sale         AS "isSale",          -- ← agregar
          p.description,
          p.images,
          p.year,
          p.dimensions,
          p.technique,
          p.sold,
          p.featured,
          p.active,
          p.created_at AS "createdAt"
        FROM products p
        WHERE ${conditions.join(' AND ')}
        ORDER BY p.created_at DESC
      `, values);

      res.json(rows);
    } catch (err) {
      console.error('GET /api/products error:', err);
      res.status(500).json({ error: 'No se pudieron obtener las obras.' });
    }
  });

  // ── GET /api/products/:id ────────────────────────────────────
  app.get('/api/products/:id', async (req, res) => {
    try {
      const { rows } = await getPool().query(`
        SELECT
          p.id,
          p.name,
          p.cat,
          p.price,
          p.original_price  AS "originalPrice",
          p.is_new          AS "isNew",
          p.is_sale         AS "isSale",
          p.description,
          p.images,
          p.year,
          p.dimensions,
          p.technique,
          p.sold,
          p.featured,
          p.active,
          p.created_at AS "createdAt"
        FROM products p
        WHERE p.id = $1 AND p.active = true
      `, [req.params.id]);

      if (!rows.length) return res.status(404).json({ error: 'Obra no encontrada.' });
      res.json(rows[0]);
    } catch (err) {
      console.error('GET /api/products/:id error:', err);
      res.status(500).json({ error: 'Error al obtener la obra.' });
    }
  });

  // ── POST /api/products ───────────────────────────────────────
  app.post('/api/products', async (req, res) => {
    const {
      id, name, cat,
      price, description, images,
      year, dimensions, technique,
      sold = false, featured = false,
    } = req.body;

    if (!id || !name) {
      return res.status(400).json({ error: 'Faltan campos obligatorios (id, name).' });
    }

    try {
      const { rows } = await getPool().query(`
        INSERT INTO products (
          id, name, cat,
          price, original_price, is_new, is_sale,
          description, images, active,
          year, dimensions, technique, sold, featured
        ) VALUES (
          $1, $2, $3,
          $4, $4, false, false,
          $5, $6, true,
          $7, $8, $9, $10, $11
        )
        RETURNING
          id, name, cat, price, description, images,
          year, dimensions, technique, sold, featured, active
      `, [
        id,
        name,
        cat || 'Otro',
        Number(price ?? 0),
        description || null,
        images ?? [],
        year || null,
        dimensions || null,
        technique || null,
        !!sold,
        !!featured,
      ]);

      res.status(201).json(rows[0]);
    } catch (err) {
      if (err.code === '23505') {
        return res.status(409).json({ error: `Ya existe una obra con id "${id}".` });
      }
      console.error('POST /api/products error:', err);
      res.status(500).json({ error: 'Error al crear la obra.' });
    }
  });

  // ── PUT /api/products/:id ────────────────────────────────────
  app.put('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    const {
      name, cat, price, description, images,
      year, dimensions, technique, sold, featured, active,
    } = req.body;

    try {
      const { rows } = await getPool().query(`
        UPDATE products SET
          name        = COALESCE($1,  name),
          cat         = COALESCE($2,  cat),
          price       = COALESCE($3,  price),
          description = COALESCE($4,  description),
          images      = COALESCE($5,  images),
          year        = COALESCE($6,  year),
          dimensions  = COALESCE($7,  dimensions),
          technique   = COALESCE($8,  technique),
          sold        = COALESCE($9,  sold),
          featured    = COALESCE($10, featured),
          active      = COALESCE($11, active)
        WHERE id = $12
        RETURNING
          id, name, cat, price, description, images,
          year, dimensions, technique, sold, featured, active
      `, [
        name        ?? null,
        cat         ?? null,
        price != null ? Number(price) : null,
        description ?? null,
        images      ?? null,
        year        ?? null,
        dimensions  ?? null,
        technique   ?? null,
        sold        ?? null,
        featured    ?? null,
        active      ?? null,
        id,
      ]);

      if (!rows.length) return res.status(404).json({ error: 'Obra no encontrada.' });
      res.json(rows[0]);
    } catch (err) {
      console.error('PUT /api/products/:id error:', err);
      res.status(500).json({ error: 'Error al actualizar la obra.' });
    }
  });

  // ── DELETE /api/products/:id ─────────────────────────────────
  app.delete('/api/products/:id', async (req, res) => {
    try {
      const { rowCount } = await getPool().query(
        'DELETE FROM products WHERE id = $1',
        [req.params.id]
      );
      if (!rowCount) return res.status(404).json({ error: 'Obra no encontrada.' });
      res.status(204).send();
    } catch (err) {
      console.error('DELETE /api/products/:id error:', err);
      res.status(500).json({ error: 'Error al eliminar la obra.' });
    }
  });
}