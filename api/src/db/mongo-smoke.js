import { BSON } from "mongodb";
import { pool } from "./client.js";
import { mongoClient, toursCollection } from "./mongo.js";

const tourId = Number(process.argv[2]);

const run = async () => {
  const tour = (await pool.query("select * from tours where id = $1", [tourId]))
    .rows[0];

  if (!Number.isInteger(tourId))
    throw new Error("Usage: npm run mongo:smoke <tour_id>");

  if (!tour)
    throw new Error(
      `No tour with ID ${tourId} in Postgres—run npm run seed first`,
    );

  const logs = (
    await pool.query(
      "select * from tour_logs where tour_id = $1 order by recorded_at",
      [tourId],
    )
  ).rows;

  // The relational model: 1 row in `tours` + ~300 rows in `tour_logs`, linked via `tour_id`.
  // The document model: everything that is read together is grouped together.
  const doc = {
    tour_id: tour.id, // The Postgres ID will remain until the migration is complete (M5)
    user_id: tour.user_id,
    guide_id: tour.guide_id,
    title: tour.title,
    started_at: tour.started_at,
    distance_m: tour.distance_m,
    notes: tour.notes,
    logs: logs.map((l) => ({
      t: l.recorded_at,
      lat: l.lat,
      lon: l.lon,
      elevation_m: l.elevation_m,
      heart_rate: l.heart_rate,
      note: l.note,
    })),
    stats: { points: logs.length },
  };

  await mongoClient.connect();

  const tours = toursCollection();
  await tours.createIndex({ tour_id: 1 }, { unique: true });
  await tours.replaceOne({ tour_id: tour.id }, doc, { upsert: true });

  // Read back, just the first two points
  const back = await tours.findOne(
    { tour_id: tour.id },
    // { projection: { logs: { $slice: 2 } } },
  );

  if (back.logs.length !== logs.length) {
    throw new Error("Logs number from MongoDB does not match Postgres");
  }

  console.log(`Postgres: 1 row in tours, ${logs.length} rows in tour_logs`);
  console.log(
    `MongoDB: 1 document, ${(BSON.calculateObjectSize(back) / 1024).toFixed(1)} kB, ${back.logs.length} logs in tours collection`,
  );
  console.log(
    `Documents in the "tours" collection: ${await tours.countDocuments()}`,
  );
  console.log(JSON.stringify(back, null, 2));
};

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
