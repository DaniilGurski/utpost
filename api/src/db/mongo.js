import { MongoClient } from "mongodb";
import { config } from "../config.js";

export const mongoClient = new MongoClient(config.mongoUrl, {
  serverSelectionTimeoutMS: 3000,
});

export const getMongo = async () => {
  await mongoClient.connect();
  return mongoClient.db("utpost");
};

// The document model for tours (decided in M3; migration will take place in M5):
// One tour = one document, with the measurement points embedded in the `logs` array.
// Always read as a whole, written once; approximately 300 points per tour = a few tens of kB.
export const toursCollection = () =>
  mongoClient.db("utpost").collection("tours");
