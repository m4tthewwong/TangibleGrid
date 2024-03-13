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
    
# Helper function to emit data and manage existing brackets
def manage_bracket(data, action):
    bracket_id = data["id"]
    
    if action == "add":
        if bracket_id in existing:
            return False  # Already exists, no action taken
        existing.add(bracket_id)
    elif action == "delete":
        existing.discard(bracket_id)  # Remove if exists, otherwise do nothing
    
    # Emit the data to the connected client
    socketio.emit("data transmit", data)
    socketio.sleep(0)
    return True  # Action was taken

@socketio.on('get data')
def send_data():
    print("Receive data request from web.")
    while ser.is_open:
        raw_data = ser.readline()
        line = str(raw_data, encoding='utf-8').strip()
        if not line:
            print("Waiting for response from arduino")
            socketio.sleep(0)
            continue  # Skip the rest of the loop and wait for more data
        
        data = json.loads(line)
        print(data)
        bracket_id = data["ID"]
        bracket_type = data["type"]
        bracket_category = data["bracket"]
        touch_status = data["touch"]

        # Check if the bracket is being touched, indicating it should be added/deleted/moved
        if touch_status:
            # Build the data dictionary for the emit function
            emit_data = {
                "id": bracket_id,
                "type": bracket_type,
                "bracket": bracket_category,
                "x": data["x"],
                "y": data["y"],
                "h": data["h"],
                "w": data["w"],
                "touch": touch_status,
            }
            # Depending on the type of bracket, perform the action and emit data
            if bracket_type == "add":
                if not manage_bracket(emit_data, action="add"):
                    continue  # Skip to the next iteration if no action was taken
            elif bracket_type == "delete":
                # Save or update the bracket information before deleting
                if bracket_category == "text":
                    text_information[bracket_id] = ""  # Replace with actual text retrieval logic
                elif bracket_category == "figure":
                    figure_information[bracket_id] = ""  # Replace with actual figure retrieval logic
                elif bracket_category == "video":
                    video_information[bracket_id] = ""  # Replace with actual video retrieval logic
                
                manage_bracket(emit_data, action="delete")
                
        time.sleep(5)

if __name__ == '__main__':
    socketio.run(app)
