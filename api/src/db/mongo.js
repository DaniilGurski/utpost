import { MongoClient } from "mongodb";
import { config } from "../config.js";

export const mongoClient = new MongoClient(config.mongoUrl, {
  serverSelectionTimeoutMS: 3000,
});

export const getMongo = async () => {
  await mongoClient.connect();
  return mongoClient.db("utpost");
};
