import { pool } from "./client.js";
import { mongoClient, toursCollection } from "./mongo.js";

// Flyttar turloggarna till MongoDB (beslutet från M3): ett dokument per tur,
// med loggpunkterna inbäddade i `logs`. Samma dokumentform som mongo-smoke.js.
// tour_logs i Postgres ligger kvar, REST och den gamla klienten läser den.
//
// Går att köra om: replaceOne med upsert på tour_id + unikt index på tour_id.
// Verifierar sig själv och avslutar med felkod om antalen inte stämmer.

const toDoc = (tour, logs) => ({
  tour_id: tour.id,
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
});

export const run = async () => {
  const tours = (await pool.query("select * from tours order by id")).rows;
  const logRows = (
    await pool.query("select * from tour_logs order by tour_id, recorded_at")
  ).rows;

  const logsByTour = new Map();
  for (const l of logRows) {
    if (!logsByTour.has(l.tour_id)) logsByTour.set(l.tour_id, []);
    logsByTour.get(l.tour_id).push(l);
  }

  await mongoClient.connect();
  const collection = toursCollection();
  await collection.createIndex({ tour_id: 1 }, { unique: true });

  const result = await collection.bulkWrite(
    tours.map((tour) => ({
      replaceOne: {
        filter: { tour_id: tour.id },
        replacement: toDoc(tour, logsByTour.get(tour.id) ?? []),
        upsert: true,
      },
    })),
  );

  console.log(
    `Postgres: ${tours.length} turer, ${logRows.length} rader i tour_logs`,
  );
  console.log(
    `MongoDB: ${result.upsertedCount} nya dokument, ${result.matchedCount} ersatta`,
  );

  const docCount = await collection.countDocuments();
  const [{ points = 0 } = {}] = await collection
    .aggregate([
      { $group: { _id: null, points: { $sum: { $size: "$logs" } } } },
    ])
    .toArray();

  console.log(
    `MongoDB: ${docCount} dokument, ${points} loggpunkter i tours-samlingen`,
  );

  if (docCount !== tours.length || points !== logRows.length) {
    throw new Error(
      `Stämmer inte: ${docCount}/${tours.length} dokument, ${points}/${logRows.length} loggpunkter`,
    );
  }

  console.log("Verifierat");
};

run()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => Promise.all([pool.end(), mongoClient.close()]));
