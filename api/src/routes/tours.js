import { Router } from 'express';
import { requireUser } from '../lib/auth.js';
import { validate } from '../lib/validate.js';
import { wrap } from '../lib/wrap.js';
import { createTourSchema, idParam } from '../lib/schemas.js';
import { listTours, getTour, getTourLogs, getTourPhotos, createTour, deleteTour } from '../data/tours.js';
import { getUserById } from '../data/users.js';
import { getGuideById } from '../data/guides.js';

export const toursRouter = Router();

toursRouter.get('/', wrap(async (req, res) => {
  const tours = await listTours(50);

  const out = [];
  for (const tour of tours) {
    const user = await getUserById(tour.user_id);
    const guide = tour.guide_id ? await getGuideById(tour.guide_id) : null;
    const photos = await getTourPhotos(tour.id);
    const logs = await getTourLogs(tour.id);
    out.push({ ...tour, user, guide, photos, logs });
  }

  res.json(out);
}));

toursRouter.get('/latest', wrap(async (req, res) => {
  res.json(await listTours(5));
}));

toursRouter.get('/:id', wrap(async (req, res) => {
  const id = idParam.safeParse(req.params.id);
  if (!id.success) return res.status(400).json({ error: 'ogiltigt id' });
  const tour = await getTour(id.data);
  if (!tour) return res.status(404).json({ error: 'hittades inte' });
  const logs = await getTourLogs(id.data);
  const photos = await getTourPhotos(id.data);
  res.json({ ...tour, logs, photos });
}));

toursRouter.post('/', requireUser, validate(createTourSchema), wrap(async (req, res) => {
  const { title, guideId, startedAt, distanceM, notes } = req.body;
  res.status(201).json(await createTour({ userId: req.user.id, guideId, title, startedAt, distanceM, notes }));
}));

// M8 (A01): inloggad räcker inte. Ägarkontrollen görs mot raden i databasen och req.user ur
// token – aldrig mot ett id som klienten skickar. 404 om turen saknas, 403 om den inte är din
// (redaktören får ta bort alla).
toursRouter.delete('/:id', requireUser, wrap(async (req, res) => {
  const id = idParam.safeParse(req.params.id);
  if (!id.success) return res.status(400).json({ error: 'ogiltigt id' });
  const tour = await getTour(id.data);
  if (!tour) return res.status(404).json({ error: 'hittades inte' });
  if (tour.user_id !== req.user.id && req.user.role !== 'editor') {
    return res.status(403).json({ error: 'inte din tur' });
  }
  await deleteTour(id.data);
  res.json({ ok: true });
}));
