import { Router } from 'express';
import { config } from '../config.js';
import { pool } from '../db/client.js';
import { requireUser } from '../lib/auth.js';
import { validate } from '../lib/validate.js';
import { wrap } from '../lib/wrap.js';
import { photoUploadSchema, idParam } from '../lib/schemas.js';

export const photosRouter = Router();

// Utan gräns skulle en funktion som hänger låta anropet vänta i flera minuter.
// 30 s räcker med marginal för en kallstart plus bildarbetet.
const IMAGE_FUNCTION_TIMEOUT_MS = 30_000;

// M7: bildarbetet körs i funktionen (functions/src/image.js). Här väntar vi bara på svaret,
// så att tråden är ledig för alla andra anrop under tiden.
const callImageFunction = async ({ filename, width, height }) => {
  const res = await fetch(config.imageFunctionUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(config.imageFunctionKey ? { 'x-functions-key': config.imageFunctionKey } : {}),
    },
    body: JSON.stringify({ filename, width, height }),
    signal: AbortSignal.timeout(IMAGE_FUNCTION_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`svarade ${res.status}`);
  return res.json();
};

// M8 (A01): uppladdning kräver inloggning, och turen ska vara din (eller du redaktör) – samma
// kontroll som DELETE /api/tours/:id, mot raden i databasen. Måtten valideras före allt annat,
// så en orimlig bild varken sparas eller skickas till funktionen (A10).
photosRouter.post('/', requireUser, validate(photoUploadSchema), wrap(async (req, res) => {
  const started = Date.now();
  const { tourId, filename, width, height } = req.body;

  const tour = await pool.query('select id, user_id from tours where id = $1', [tourId]);
  if (!tour.rows[0]) return res.status(404).json({ error: 'turen hittades inte' });
  if (tour.rows[0].user_id !== req.user.id && req.user.role !== 'editor') {
    return res.status(403).json({ error: 'inte din tur' });
  }

  const result = await pool.query(
    'insert into photos (tour_id, filename, width, height) values ($1,$2,$3,$4) returning *',
    [tourId, filename, width, height],
  );

  let processed;
  try {
    processed = await callImageFunction({ filename, width, height });
  } catch (err) {
    console.error('Bildfunktionen svarade inte:', err.message);
    return res.status(502).json({ error: 'bildfunktionen svarar inte' });
  }

  const { variants, processingMs, coldStart, instance } = processed;
  res.json({
    ...result.rows[0],
    variants,
    processingMs,
    coldStart,
    instance,
    apiMs: Date.now() - started,
  });
}));

photosRouter.get('/tour/:tourId', wrap(async (req, res) => {
  const id = idParam.safeParse(req.params.tourId);
  if (!id.success) return res.status(400).json({ error: 'ogiltigt id' });
  const result = await pool.query('select * from photos where tour_id = $1', [id.data]);
  res.json(result.rows);
}));
