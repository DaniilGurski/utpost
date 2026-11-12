import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { pool } from "./db/client.js";
import { getMongo } from "./db/mongo.js";
import { authRouter } from "./routes/auth.js";
import { guidesRouter } from "./routes/guides.ts";
import { toursRouter } from "./routes/tours.js";
import { photosRouter } from "./routes/photos.js";
import { ZodError } from "zod";
import { yoga, trackQueries } from "./graphql/server.js";
import { wrap } from "./lib/wrap.js";

export const app = express();

app.use(yoga.graphqlEndpoint, trackQueries, yoga);

// M8: 1 MB räcker – bilderna skickas inte hit, bara måtten. (cors() tas bort i steg 4, fredagens hål.)
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", wrap(async (req, res) => {
  const [pg, mongo] = await Promise.allSettled([
    pool.query("select 1"),
    getMongo().then((db) => db.command({ ping: 1 })),
  ]);
  const status = {
    postgres: pg.status === "fulfilled" ? "ok" : "error",
    mongodb: mongo.status === "fulfilled" ? "ok" : "error",
    sha: config.gitSha,
  };
  const healthy = [pg, mongo].every((r) => r.status === "fulfilled");
  res.status(healthy ? 200 : 503).json(status);
}));

app.use("/api/auth", authRouter);
app.use("/api/guides", guidesRouter);
app.use("/api/tours", toursRouter);
app.use("/api/photos", photosRouter);

// M8: felhanteraren, sist. Ett fel blir ett svar – aldrig ett anrop som hänger. 400 när det är
// anroparens fel (ogiltig indata, trasig JSON), 413 för en för stor request, annars 500 utan
// detaljer: loggen får detaljerna, inte den som anropar. Ersätter process.on('unhandledRejection'),
// som höll servern vid liv men lät anropet vänta för evigt.
app.use((err, req, res, next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "ogiltig indata",
      issues: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "ogiltig JSON" });
  if (err.type === "entity.too.large") return res.status(413).json({ error: "för stor request" });
  console.error(`${req.method} ${req.originalUrl}: ${err.message}`);
  res.status(500).json({ error: "internt fel" });
});
