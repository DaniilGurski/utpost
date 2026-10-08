// TODO: flytta ut det här nån gång. /marcus 2021-03-11
export const config = {
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgres://utpost:utpost@localhost:5433/utpost",
  mongoUrl:
    process.env.MONGO_URL ?? "mongodb://localhost:27017/?authSource=admin",
  jwtSecret: "utpost123",
  port: 4000,
  uploadDir: "./uploads",
};
