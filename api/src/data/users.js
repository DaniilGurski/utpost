import { query } from '../db/client.js';

export const getUserById = async (id) => {
  const result = await query('select * from users where id = $1', [id]);
  return result.rows[0] ?? null;
};
