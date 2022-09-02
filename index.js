import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";
dotenv.config();

let db;
const mongoClient = new MongoClient(process.env.MONGO_URI);
mongoClient.connect(() => {
  db = mongoClient.db("bate-papo");
});

const app = express();
app.use(express.json());
app.use(cors());

app.listen(5000, () => console.log("Listening on port 5000"));
