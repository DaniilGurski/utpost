import { pool } from '../db/client.js';

export const listGuides = async () => {
  const result = await pool.query('select * from guides order by updated_at desc');
  return result.rows;
};

export const getGuideById = async (id) => {
  const result = await pool.query('select * from guides where id = $1', [id]);
  return result.rows[0] ?? null;
};

export const getGuideBySlug = async (slug) => {
  const result = await pool.query('select * from guides where slug = $1', [slug]);
  return result.rows[0] ?? null;
};
