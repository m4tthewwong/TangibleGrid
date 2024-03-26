const express = require("express");
const cors = require("cors");
const SerialPort = require("serialport");
const Readline = require("@serialport/parser-readline");

const app = express();
app.use(cors());
const port = 3001;

const serialPort = new SerialPort("COM4", { baudRate: 9600 });
const parser = new Readline();
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
