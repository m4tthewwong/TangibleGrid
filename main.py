from flask import Flask, render_template
from flask_cors import CORS
from flask_socketio import SocketIO
from flask_socketio import send, emit
import serial
import json
import time
import pyttsx3
from threading import Thread

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins='*')
#socketio = SocketIO(app, cors_allowed_origins='*', logger=True, engineio_logger=True)
# COMMENT FOR FAKE SERIAL ----------------------------------------------------------------
serialPort = "COM4"
ser = serial.Serial(serialPort, baudrate=9600, timeout=0.5)
# COMMENT FOR FAKE SERIAL ----------------------------------------------------------------
engine = pyttsx3.init()
# engine.say("System initialize")
engine.runAndWait()
engine.stop()

# dictionaries mapping {bracket ID : bracket info}
text_information = {}
figure_information = {}
video_information = {}

# Existing brackets
existing = set()

@app.route('/')
def index():
    print("System launch!")
    return render_template('index.html')

@socketio.on('web connected')
def handle_my_custom_event(message):
    print(str(message))

@socketio.on('get data')
def send_data():
    print("Receive data request from web.")
    
    while ser.is_open:
        raw_data = ser.readline()
        line = str(raw_data, encoding='utf-8')
        if line:
            data = json.loads(line)
            print(data)
            if data["touch"]: # bracket being touched meaning it will be added/deleted/moved
                # Get data
                id = data["ID"]
                type = data["type"]
                bracket = data["bracket"]
                x = data["x"]
                y = data["y"]
                h = data["h"]
                w = data["w"]
                touch = data["touch"]
                if type == "add":
                    # code to add bracket
                    if bracket == "text":
                        if id in existing:
                            return
                        socketio.emit("data transmit", {
                            "id": id,
                            "type": type,
                            "bracket": bracket,
                            "x": x,
                            "y": y,
                            "h": h,
                            "w": w,
                            "touch": touch,
                        })
                        existing.add(id)
                    elif bracket == "figure":
                        if id in figure_information: # figure bracket used to exist
                            return # fix later
                        else:
                            if id in existing:
                                return
                            socketio.emit("data transmit", {
                                "id": id,
                                "type": type,
                                "bracket": bracket,
                                "x": x,
                                "y": y,
                                "h": h,
                                "w": w,
                                "touch": touch,
                            })
                            existing.add(id)
                    elif bracket == "video":
                        if id in video_information: # video bracket used to exist
                            return # fix later
                        else:
                            if id in existing:
                                return
                            socketio.emit("data transmit", {
                                "id": id,
                                "type": type,
                                "bracket": bracket,
                                "x": x,
                                "y": y,
                                "h": h,
                                "w": w,
                                "touch": touch,
                            })
                            existing.add(id)
                else: # type == "delete"
                    # save information about bracket
                    if bracket == "text":
                        text_information[id] = "" # change later to actual text
                    elif bracket == "figure":
                        figure_information[id] = "" # change later to actual figure
                    else: # video
                        video_information[id] = "" # change later to actual video
                    emit("data transmit", {
                        "id": id,
                        "type": type,
                        "bracket": bracket,
                        "x": x,
                        "y": y,
                        "h": h,
                        "w": w,
                        "touch": touch,
                    })
                    existing.remove(id)
            else: # not touched
                return # fix later
        else: # waiting for response from arduino
            print("Waiting for response from arduino")
        #time.sleep(2)

if __name__ == '__main__':
    socketio.run(app)
