import { Router } from 'express';
import { pool } from '../db/client.js';
import { sign, publicUser } from '../lib/auth.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { validate } from '../lib/validate.js';
import { wrap } from '../lib/wrap.js';
import { loginSchema, registerSchema } from '../lib/schemas.js';

export const authRouter = Router();

// M8 (A07): samma svar och ungefär samma tid för okänd e-post och fel lösenord – annars går
// inloggningen att använda för att ta reda på vilka konton som finns. Därför körs verifyPassword
// även när användaren saknas (mot en dummy-hash i lib/password.js).
const WRONG_CREDENTIALS = { error: 'fel e-post eller lösenord' };

authRouter.post(
  '/login',
  validate(loginSchema),
  wrap(async (req, res) => {
    const { email, password } = req.body;
    const result = await pool.query('select * from users where email = $1', [email]);
    const user = result.rows[0];
    const ok = await verifyPassword(password, user?.password_hash);
    if (!user || !ok) return res.status(401).json(WRONG_CREDENTIALS);
    res.json({ token: sign(user), user: publicUser(user) });
  }),
);

authRouter.post(
  '/register',
  validate(registerSchema),
  wrap(async (req, res) => {
    const { email, password, displayName } = req.body;
    const existing = await pool.query('select 1 from users where email = $1', [email]);
    if (existing.rows[0]) return res.status(409).json({ error: 'e-posten är redan registrerad' });
    const result = await pool.query(
      'insert into users (email, password_hash, display_name) values ($1,$2,$3) returning *',
      [email, await hashPassword(password), displayName],
    );
    res.status(201).json({ token: sign(result.rows[0]), user: publicUser(result.rows[0]) });
  }),
);
