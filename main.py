from flask import Flask, render_template
from flask_cors import CORS
from flask_socketio import SocketIO
from flask_socketio import send, emit
import serial
import json
import time
import pyttsx3
import speech_recognition as sr


app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins='*')
#serialPort = "/dev/cu.usbserial-14120"
#REMOVE WHEN TESTING START
#serialPort = "COM4"
#ser = serial.Serial(serialPort, baudrate=9600, timeout=0.5)
#REMOVE WHEN TESTING END
engine = pyttsx3.init()
engine.say("System initialize")
engine.runAndWait()
engine.stop()

r = sr.Recognizer()

# dictionary mapping {bracket location : bracket info}
data_list = {}

@app.route('/')
def index():  # put application's code here
    print("System launch!")
    return render_template('index.html')


@socketio.on('web connected')
def handle_my_custom_event(message):
    print(str(message))
    
@socketio.on('button pressed')
def handle_button_pressed():
    print("Button pressed. Starting audio recording...")
    r = sr.Recognizer()
    with sr.Microphone() as source:
        print("Recording...")
        audio_data = r.record(source, duration=5)  # record audio for 5 seconds
        print("Recording finished. Converting speech to text...")
        try:
            text = r.recognize_google(audio_data)
            print("Conversion finished. Text: " + text)
        except sr.UnknownValueError:
            print("Speech Recognition could not understand the audio")
            text = ""
        return text

@socketio.on('get data')
def send_data():
    print("Receive data request from web.")
    # serialPort = "/dev/cu.usbserial-14220"
    # ser = serial.Serial(serialPort, baudrate=9600, timeout=0.5)
    # while ser.is_open:
    
    # TEST CASE START
    str_json = """{"type":"add", "bracket":"text", "x":3, "y":3, "h":4, "w":4, "info":""}"""
    #{"type":"del", "bracket":"text", "x":3, "y":3, "h":4, "w":4}
    # TEST CASE END
    
    #raw_data = ser.readline()
    #print("raw data from arduino: ", raw_data)
    #str_json = str(raw_data, encoding='utf-8')
    #print("string data: ", str_json)
    if str_json:
        if "type" in str_json:
            json_data = json.loads(str_json)
            type = json_data["type"]
            bracket = json_data["bracket"]
            row_num = json_data["x"]
            col_num = json_data["y"]
            h_len = json_data["h"]
            w_len = json_data["w"]
            info = json_data["info"]
            
            if (bracket == "text") and (f"{type}, {bracket}, {row_num}, {col_num}, {h_len}, {w_len}" not in data_list):
                info = str(handle_button_pressed())
                data_list[f"{type}, {bracket}, {row_num}, {col_num}, {h_len}, {w_len}"] = info
                
            info = data_list[f"{type}, {bracket}, {row_num}, {col_num}, {h_len}, {w_len}"]
            
            emit("data transmit", {
                "type": type,
                "bracket": bracket,
                "row_num": row_num,
                "col_num": col_num,
                "h_len": h_len,
                "w_len": w_len,
                "info": info,
            })
            print(type, bracket, row_num, col_num, h_len, w_len, info)
            
            if type == "add":
                engine.setProperty('rate', 170)
                engine.say(bracket + "bracket detected" +
                           "                                                                        ," +
                            "location at" + str(col_num) + "                                        " +
                            str(row_num) +
                            "                                                                       ," +
                            "bracket row length" + "                              " + str(h_len) +
                           "                                                                       ," +
                           "bracket column length" + "                         " + str(w_len))
                engine.runAndWait()
                time.sleep(9)
            # engine.endLoop()
            # ser.close()
    else:
        emit("pause")



if __name__ == '__main__':
    socketio.run(app)

