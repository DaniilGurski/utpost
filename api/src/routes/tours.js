import { Router } from 'express';
import { requireUser } from '../lib/auth.js';
import { listTours, getTour, getTourLogs, getTourPhotos, createTour, deleteTour } from '../data/tours.js';
import { getUserById } from '../data/users.js';
import { getGuideById } from '../data/guides.js';

export const toursRouter = Router();

toursRouter.get('/', async (req, res) => {
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
});

toursRouter.get('/latest', async (req, res) => {
  res.json(await listTours(5));
});

toursRouter.get('/:id', async (req, res) => {
  const tour = await getTour(req.params.id);
  if (!tour) return res.status(404).json({ error: 'hittades inte' });
  const logs = await getTourLogs(req.params.id);
  const photos = await getTourPhotos(req.params.id);
  res.json({ ...tour, logs, photos });
});

toursRouter.post('/', requireUser, async (req, res) => {
  const { title, guideId, startedAt, distanceM, notes } = req.body;
  res.json(await createTour({ userId: req.user.id, guideId, title, startedAt, distanceM, notes }));
});

toursRouter.delete('/:id', async (req, res) => {
  await deleteTour(req.params.id);
  res.json({ ok: true });
});
