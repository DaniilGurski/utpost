import { pool } from '../db/client.js';

// Enda stället som läser och skriver turer. REST-routerna och GraphQL-resolvrarna
// går båda hit, så M5:s TOURS_SOURCE-växel (Postgres/Mongo) byts på ett ställe.

export const listTours = async (limit) => {
  const result = await pool.query('select * from tours order by started_at desc limit $1', [limit]);
  return result.rows;
};

export const getTour = async (id) => {
  const result = await pool.query('select * from tours where id = $1', [id]);
  return result.rows[0] ?? null;
};

export const getTourLogs = async (tourId) => {
  const result = await pool.query('select * from tour_logs where tour_id = $1 order by recorded_at', [tourId]);
  return result.rows;
};

export const getTourPhotos = async (tourId) => {
  const result = await pool.query('select * from photos where tour_id = $1', [tourId]);
  return result.rows;
};

export const createTour = async ({ userId, guideId, title, startedAt, distanceM, notes }) => {
  const result = await pool.query(
    `insert into tours (user_id, guide_id, title, started_at, distance_m, notes)
     values ($1,$2,$3,$4,$5,$6) returning *`,
    [userId, guideId || null, title, startedAt, distanceM, notes],
  );
  return result.rows[0];
};

export const deleteTour = async (id) => {
  await pool.query('delete from tour_logs where tour_id = $1', [id]);
  await pool.query('delete from tours where id = $1', [id]);
};
