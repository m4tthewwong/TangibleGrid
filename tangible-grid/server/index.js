const express = require("express");
const cors = require("cors");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const { MongoClient, ServerApiVersion } = require("mongodb");

// MongoDB Credentials
const credentials = "../../MongoDB.pem";

const client = new MongoClient(
    "mongodb+srv://bracketscluster.tnpze91.mongodb.net/?authSource=%24external&authMechanism=MONGODB-X509&retryWrites=true&w=majority&appName=BracketsCluster",
    {
        tlsCertificateKeyFile: credentials,
        serverApi: ServerApiVersion.v1,
    }
);

const app = express();
app.use(cors());
const port = 3001;

const serialPort = new SerialPort({ path: "COM3", baudRate: 9600 });
const parser = new ReadlineParser();
serialPort.pipe(parser);

let messages = []; // Store messages in an array

parser.on("data", (line) => {
    console.log(`> ${line}`);
    messages.push(line); // Push new lines to the messages array
});

// Endpoint to get data since lastId
app.get("/api/data", (req, res) => {
    const lastId = parseInt(req.query.lastId) || 0;
    const newMessages = messages.slice(lastId); // Send all new messages
    res.json({ data: newMessages, lastId: lastId + newMessages.length });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

app.post("/api/init", async (req, resp) => {
    try {
        var output = [];
        await client.connect();
        const database = client.db("TangibleGrid");
        const collection = database.collection("Brackets");
        var docCount = await collection.find({});
        for await (const doc of docCount) {
            output.push(doc);
        }

        resp.json(output);
        // perform actions using client
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
});

// Encode Content before passing in as param
app.post("/api/modify/id/:id/content/:content", async (req, resp) => {
    try {
        await client.connect();
        const database = client.db("TangibleGrid");
        const collection = database.collection("Brackets");
        var doc = await collection.updateOne(
            { id: parseInt(req.params["id"]) },
            {
                $set: {
                    content: decodeURIComponent(req.params["content"]),
                },
            }
        );
        resp.json(doc);
        // perform actions using client
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
});

app.post("/api/watch", async (req, resp) => {
    try {
        await client.connect();
        const database = client.db("TangibleGrid");
        const collection = database.collection("Brackets");
        const changeStream = collection.watch([], {
            fullDocument: "updateLookup",
        });
        for await (const change of changeStream) {
            resp.json(change.fullDocument);
        }
        changeStream.close();
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
});
