import { Router, type Request, type Response } from 'express';
import { pool } from '../db/client.js';
import type { Guide } from '@utpost/shared';
import { validate } from '../lib/validate.js';
import { wrap } from '../lib/wrap.js';
import { searchSchema } from '../lib/schemas.js';

export const guidesRouter = Router();

guidesRouter.get('/', wrap(async (req: Request, res: Response<Guide[]>) => {
  const result = await pool.query('select * from guides order by updated_at desc');
  res.json(result.rows);
}));

guidesRouter.get('/regions', wrap(async (req: Request, res: Response<string[]>) => {
  const result = await pool.query('select distinct region from guides order by region');
  res.json(result.rows.map((r) => r.region));
}));

guidesRouter.get('/popular', wrap(async (req: Request, res: Response<Guide[]>) => {
  const result = await pool.query('select * from guides where published = true order by id desc limit 6');
  res.json(result.rows);
}));

// M8 (A05): sökordet skickas som ett värde ($1), aldrig som en del av SQL-frågan. validate lägger
// det validerade värdet i req.validQuery (req.query går inte att skriva över i Express 4).
guidesRouter.get(
  '/search',
  validate(searchSchema, 'query'),
  wrap(async (req: Request, res: Response<Guide[]>) => {
    const { q } = (req as Request & { validQuery: { q: string } }).validQuery;
    const result = await pool.query<Guide>(
      'select * from guides where title ilike $1 or region ilike $1 order by updated_at desc',
      [`%${q}%`],
    );
    res.json(result.rows);
  }),
);

guidesRouter.get('/:slug', wrap(async (req: Request, res: Response<Guide | { error: string }>) => {
  const result = await pool.query('select * from guides where slug = $1', [req.params.slug]);
  if (!result.rows[0]) return res.status(404).json({ error: 'hittades inte' });
  res.json(result.rows[0]);
}));

guidesRouter.put('/:id', async (req, res: Response<Guide>) => {
  const { title, region, difficulty, lengthKm, bodyHtml, published } = req.body;
  const result = await pool.query(
    `update guides set title=$1, region=$2, difficulty=$3, length_km=$4, body_html=$5,
     published=$6, updated_at=now() where id=$7 returning *`,
    [title, region, difficulty, lengthKm, bodyHtml, published, req.params.id],
  );
  res.json(result.rows[0]);
});
