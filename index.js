import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";
import dayjs from 'dayjs';

dotenv.config();

let now = dayjs();

let db;
const mongoClient = new MongoClient(process.env.MONGO_URI);
mongoClient.connect(() => {
  db = mongoClient.db("bate-papo");
});

const app = express();
const userSchema = joi.object({
    name: joi.string().required(),
    lastStatus: joi.number().required()
});
app.use(express.json());
app.use(cors());

app.post('/participants', async (req, res) => {
    const { name } = req.body;
    const newName = {name: name, lastStatus: Date.now()};

    const validation = userSchema.validate(newName, {abortEarly: false});

    if(validation.error){
        const erros = validation.error.details.map(detail => detail.message);
        res.status(422).send(erros);
        return;
    }

    try{
        const usedName = await db.collection('participants').findOne({name: name});
        if(usedName === newName.name){
            res.sendStatus(409);
            return;
        } 

        await db.collection('participants').insertOne(newName);

        await db.collection('message').insertOne({
            from: name,
            to: 'Todos',
            text: 'entra na sala...',
            type: 'status',
            time: now.format("HH:mm:ss")
        });

        res.sendStatus(201);

    } catch (err) {
        res.sendStatus(500);
    }
});

// app.get('/participants', async (req, res) => {
//     try{
//         const getParticipants = await db.collection('participants').find().toArray(); 

//         res.send(getParticipants);

//     } catch (err) {
//         res.sendStatus(500);
//     }
// });

app.listen(5000, () => console.log("Listening on port 5000"));
