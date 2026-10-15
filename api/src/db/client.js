import pkg from 'pg';
import { AsyncLocalStorage } from 'node:async_hooks';
import { drizzle } from 'drizzle-orm/node-postgres';
import { config } from '../config.js';
import * as schema from './schema.js';

const { Pool } = pkg;

export const pool = new Pool({ connectionString: config.databaseUrl });
export const db = drizzle(pool, { schema });

// Räknar och loggar SQL-frågor för allt som körs inuti queryLog.run(...).
// Används för att mäta N+1 i GraphQL-resolvrarna (M4), inte för att lösa det.
export const queryLog = new AsyncLocalStorage();

export const query = (text, params) => {
  const log = queryLog.getStore();
  if (log) {
    log.count++;
    console.log(`[sql] ${text.replace(/\s+/g, ' ')}`, params ?? []);
  }
  return pool.query(text, params);
};
