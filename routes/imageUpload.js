import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

const storage = multer.memoryStorage();
const imageFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  allowed.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error('Solo se permiten imágenes JPEG, PNG, WEBP o GIF'));
};
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: imageFilter });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


export function registerUploadRoutes(app) {
  app.get('/api/uploads/', (_req, res) => res.json({ status: 'ok' }));

  // POST /api/uploads/product
  app.post('/api/uploads/product', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Se requiere un archivo.' });
    try {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'art-gallery/products', resource_type: 'image' },
          (err, result) => err ? reject(err) : resolve(result)
        );
        stream.end(req.file.buffer);
      });
      res.json({ url: result.secure_url, publicId: result.public_id });
    } catch (err) {
      console.error('Upload product error:', err);
      res.status(500).json({ error: 'Error al subir imagen.' });
    }
  });

  // POST /api/uploads/drop
  app.post('/api/uploads/drop', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Se requiere un archivo.' });
    try {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'art-gallery/drops', resource_type: 'image' },
          (err, result) => err ? reject(err) : resolve(result)
        );
        stream.end(req.file.buffer);
      });
      res.json({ url: result.secure_url, publicId: result.public_id });
    } catch (err) {
      console.error('Upload drop error:', err);
      res.status(500).json({ error: 'Error al subir imagen.' });
    }
  });

  // DELETE /api/uploads
  app.delete('/api/uploads', async (req, res) => {
    const { publicId } = req.body;
    if (!publicId) return res.status(400).json({ error: 'publicId requerido' });
    try {
      await cloudinary.uploader.destroy(publicId);
      res.json({ ok: true });
    } catch (err) {
      console.error('Delete image error:', err);
      res.status(500).json({ error: 'Error al borrar imagen.' });
    }
  });
}