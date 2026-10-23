import DataLoader from "dataloader";
import { query, queryLog } from "../db/client.js";
import { mongoClient, toursCollection } from "../db/mongo.js";

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

    // Loggarna läses från MongoDB sedan M5 (npm run migrate:logs).
    // Punkterna mappas tillbaka till radformen så att LogPoint-resolvrarna är oförändrade.
    getLogsByTourIds: new DataLoader(async (ids) => {
      await mongoClient.connect();
      // Räknas som en databasfråga, precis som SQL-frågorna i query().
      const log = queryLog.getStore();
      if (log) log.count++;
      const docs = await toursCollection()
        .find(
          { tour_id: { $in: ids.map(Number) } },
          { projection: { tour_id: 1, logs: 1 } },
        )
        .toArray();
      const map = new Map(
        docs.map((d) => [
          d.tour_id,
          d.logs.map(({ t, ...rest }) => ({ recorded_at: t, ...rest })),
        ]),
      );
      return ids.map((id) => map.get(Number(id)) ?? []);
    }),
  };
};
