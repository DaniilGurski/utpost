import DataLoader from "dataloader";
import { query } from "../db/client.js";

function mapOne(keys, rows, getKey) {
  const map = new Map(rows.map((r) => [getKey(r), r]));
  return keys.map((k) => map.get(k) ?? null);
}

function mapMany(keys, rows, getKey) {
  const map = new Map();
  for (const r of rows) {
    const k = getKey(r);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(r);
  }
  return keys.map((k) => map.get(k) ?? []);
}

export const createLoaders = (db) => {
  return {
    getUsersByIds: new DataLoader(async (ids) => {
      const { rows } = await query("select * from users where id = any($1)", [
        ids,
      ]);
      return mapOne(ids, rows, (r) => r.id);
    }),

    getGuidesByIds: new DataLoader(async (ids) => {
      const { rows } = await query("select * from guides where id = any($1)", [
        ids,
      ]);
      return mapOne(ids, rows, (r) => r.id);
    }),

    getPhotosByTourIds: new DataLoader(async (ids) => {
      const { rows } = await query(
        "select * from photos where tour_id = any($1) order by id",
        [ids],
      );
      return mapMany(ids, rows, (r) => r.tour_id);
    }),

    getLogsByTourIds: new DataLoader(async (ids) => {
      const { rows } = await query(
        "select * from tour_logs where tour_id = any($1) order by recorded_at",
        [ids],
      );
      return mapMany(ids, rows, (r) => r.tour_id);
    }),
  };
};
