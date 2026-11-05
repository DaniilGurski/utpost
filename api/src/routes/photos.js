import { Router } from 'express';
import { config } from '../config.js';
import { pool } from '../db/client.js';

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

photosRouter.post('/', async (req, res) => {
  const started = Date.now();
  const { tourId, filename, width, height } = req.body;

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
});

photosRouter.get('/tour/:tourId', async (req, res) => {
  const result = await pool.query('select * from photos where tour_id = $1', [req.params.tourId]);
  res.json(result.rows);
});
