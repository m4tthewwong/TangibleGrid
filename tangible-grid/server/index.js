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

// Remove after testing
try {
    client.connect().then((value) => {
        const database = client.db("TangibleGrid");
        const collection = database.collection("Brackets");
        collection.deleteMany({});
    });
} finally {
}
//

const app = express();
app.use(cors());
const port = 3001;

const serialPort = new SerialPort({ path: "COM3", baudRate: 9600 });
const parser = new ReadlineParser();
serialPort.pipe(parser);

// Updates the database when there is a new update from the arduino
parser.on("data", async (line) => {
    console.log("Received:", line);
    try {
        await client.connect();
        const database = client.db("TangibleGrid");
        const collection = database.collection("Brackets");
        const data = JSON.parse(line)[0];
        // const data = JSON.parse(line);
        console.log("Parsed data:", data);
        const doc = await collection.countDocuments({
            id: parseInt(data["id"]),
        });
        if (doc == 0) {
            await collection.insertOne(data);
        } else {
            await collection.updateOne(
                { id: parseInt(data["id"]) },
                {
                    $set: {
                        top_left_row: parseInt(data["top_left_row"]),
                        top_left_col: parseInt(data["top_left_col"]),
                        length: parseInt(data["length"]),
                        width: parseInt(data["width"]),
                        status: data["status"],
                    },
                }
            );
        }
    } finally {
        // Ensures that the client will close when you finish/error
        //await client.close();
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// API to get all brackets in the database on startup
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

        return resp.json(output);
    } finally {
        // Ensures that the client will close when you finish/error
        //await client.close();
    }
});

// API to modify the content of a specific bracket on the database
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
        return resp.json(doc);
    } finally {
        // Ensures that the client will close when you finish/error
        //await client.close();
    }
});

// API to watch for changes on the database
app.post("/api/watch", async (req, resp) => {
    try {
        await client.connect();
        const database = client.db("TangibleGrid");
        const collection = database.collection("Brackets");
        const changeStream = collection.watch([], {
            fullDocument: "updateLookup",
        });
        for await (const change of changeStream) {
            return resp.json(change.fullDocument);
        }
        changeStream.close();
    } finally {
        // Ensures that the client will close when you finish/error
        //await client.close();
    }
});
