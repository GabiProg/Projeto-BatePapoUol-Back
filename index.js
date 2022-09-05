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

const messageSchema = joi.object({
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().valid('message', 'private_message').required()
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
        const usedName = await db.collection('participants').findOne({name : name});
        if(usedName){
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

app.get('/participants', async (req, res) => {
    try{
        const getParticipants = await db.collection('participants').find().toArray(); 

        res.send(getParticipants);

    } catch (err) {
        res.sendStatus(500);
    }
});

app.post('/messages', async (req, res) => {
    const { to, text, type } = req.body;
    const { user } = req.headers;

    const validation = messageSchema.validate(req.body, {abortEarly: false});

    if(validation.error){
        const erros = validation.error.details.map(detail => detail.message);
        res.status(422).send(erros);
        return;
    }

    try {
        const alreadyAparticipant = await db.collection('participants').findOne({name: user});
        if(!alreadyAparticipant){
            res.sendStatus(422);
            return;
        }

        await db.collection('message').insertOne({
            from: user,
            to,
            text,
            type,
            time: now.format("HH:mm:ss")
        });

        res.sendStatus(201);

    } catch (err){
        res.sendStatus(500);
    }
    
});

app.get('/messages', async (req, res) => {
    const limit = parseInt(req.query.limit);
    const { user } = req.headers; 
    
    try { 
        const getMessages = await db.collection('message').find().toArray();
        
        if(limit){
            res.send([...getMessages].slice(-limit));
        } else {
            res.send(getMessages);
        }

    } catch (err) {
        res.sendStatus(500);
    }
});

app.post('/status', async (req, res) => {
    const { user } = req.headers;

    try {
        const findParticipant = await db.collection('participants').findOne({ name: user });
        if(!findParticipant){
            res.sendStatus(404);
            return;
        }

        await db.collection('participants').updateOne({ name: user }, {$set: { lastStatus: Date.now() }});

        res.sendStatus(200);

    } catch (err) {
        res.sendStatus(500);
    }
});

app.listen(5000, () => console.log("Listening on port 5000"));
