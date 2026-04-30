import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';


export function registerAuthRoutes(app) {
  app.post('/api/auth/login', async (req, res) => {
    const { user, pass } = req.body;

    const validUser = user === process.env.ADMIN_USER;
    const validPass = await bcrypt.compare(pass, process.env.ADMIN_PASS_HASH);

    if (!validUser || !validPass) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = jwt.sign(
      { user },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token });
  });
}