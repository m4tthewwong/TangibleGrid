const express = require("express");
const cors = require("cors");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const { MongoClient, ServerApiVersion } = require("mongodb");

/* ------------------------------------------------------------- Serial Port ------------------------------------------------------------- */

const app = express();
app.use(cors());
const port = 3001;

const serialPort = new SerialPort({ path: "COM3", baudRate: 9600 });
// const serialPort = new SerialPort({ path: "/dev/tty.usbserial-0001", baudRate: 9600 });
const parser = new ReadlineParser();
serialPort.pipe(parser);

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

/* ------------------------------------------------------------- MongoDB Connection ------------------------------------------------------------- */

const uri = "mongodb+srv://jsli:tangibleSite_password@tangiblesite-cluster-0.xlksc.mongodb.net/?retryWrites=true&w=majority&appName=TangibleSite-Cluster-0";

const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
});

/* ------------------------------------------------------------- MongoDB Clear Database ------------------------------------------------------------- */

// Clears the database
try {
    client.connect().then((value) => {
        const database = client.db("tangibleSite");
        const collection = database.collection("Brackets");
        collection.deleteMany({});
    });
} finally {
}

/* ------------------------------------------------------------- Receiving data from Arduino ------------------------------------------------------------- */

// Updates the database when there is a new update from the arduino
parser.on("data", async (line) => {
    console.log("Received:", line);
    try {
        await client.connect();
        const database = client.db("tangibleSite");
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
    }
});

/* ------------------------------------------------------------- APIs ------------------------------------------------------------- */

// API to get all brackets in the database on startup
app.post("/api/init", async (req, resp) => {
    try {
        var output = [];
        await client.connect();
        const database = client.db("tangibleSite");
        const collection = database.collection("Brackets");
        var docCount = await collection.find({});
        for await (const doc of docCount) {
            output.push(doc);
        }

        return resp.json(output);
    } finally {
    }
});

// API to modify the content of a specific bracket on the database
// Encode Content before passing in as param
app.post("/api/modify/id/:id/content/:content", async (req, resp) => {
    try {
        await client.connect();
        const database = client.db("tangibleSite");
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
    }
});

// API to watch for changes on the database
app.post("/api/watch", async (req, resp) => {
    try {
        await client.connect();
        const database = client.db("tangibleSite");
        const collection = database.collection("Brackets");
        const changeStream = collection.watch([], {
            fullDocument: "updateLookup",
        });
        for await (const change of changeStream) {
            return resp.json(change.fullDocument);
        }
        changeStream.close();
    } finally {
    }
});
