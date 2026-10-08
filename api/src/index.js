import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { pool } from "./db/client.js";
import { getMongo } from "./db/mongo.js";
import { authRouter } from "./routes/auth.js";
import { guidesRouter } from "./routes/guides.ts";
import { toursRouter } from "./routes/tours.js";
import { photosRouter } from "./routes/photos.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.get("/api/health", async (req, res) => {
  const [pg, mongo] = await Promise.allSettled([
    pool.query("select 1"),
    getMongo().then((db) => db.command({ ping: 1 })),
  ]);
  const status = {
    postgres: pg.status === "fulfilled" ? "ok" : "error",
    mongodb: mongo.status === "fulfilled" ? "ok" : "error",
  };
  const healthy = Object.values(status).every((s) => s === "ok");
  res.status(healthy ? 200 : 503).json(status);
});

app.use("/api/auth", authRouter);
app.use("/api/guides", guidesRouter);
app.use("/api/tours", toursRouter);
app.use("/api/photos", photosRouter);

app.listen(config.port, () => {
  console.log(`API lyssnar på http://localhost:${config.port}`);
});

// Servern dog i produktion en fredag när någon skrev in ett ogiltigt id.
// Det här håller den vid liv. Anropet får inget svar, men resten funkar. /marcus 2022-09-02
process.on("unhandledRejection", (err) => {
  console.error("Ohanterat fel:", err.message);
});
