export const config = {
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgres://utpost:utpost@localhost:5433/utpost",
  mongoUrl:
    process.env.MONGO_URL ?? "mongodb://localhost:27017/?authSource=admin",
  jwtSecret: process.env.JWT_SECRET ?? "utpost-dev-secret",
  port: Number(process.env.PORT ?? 4000),
  gitSha: process.env.GIT_SHA ?? "dev",
  uploadDir: "./uploads",
};
