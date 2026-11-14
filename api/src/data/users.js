import { query } from '../db/client.js';

export const getUserById = async (id) => {
  // M8: aldrig select * på users – password_hash får inte följa med in i ett svar (turlistan bäddar in raden).
  const result = await query('select id, display_name, role, created_at from users where id = $1', [id]);
  return result.rows[0] ?? null;
};
