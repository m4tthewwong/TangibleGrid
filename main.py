from flask import Flask, render_template
from flask_cors import CORS
from flask_socketio import SocketIO
from flask_socketio import send, emit
import serial
import json
import time
import pyttsx3


app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins='*')
#serialPort = "/dev/cu.usbserial-14120"
serialPort = "COM3"
ser = serial.Serial(serialPort, baudrate=9600, timeout=0.5)
engine = pyttsx3.init()
engine.say("System initialize")
engine.runAndWait()
engine.stop()


@app.route('/')
def hello_world():  # put application's code here
    print("System launch!")
    return render_template('index.html')


@socketio.on('web connected')
def handle_my_custom_event(message):
    print(str(message))


@socketio.on('get data')
def send_data():
    print("Receive data request from web.")
    # serialPort = "/dev/cu.usbserial-14220"
    # serialPort = "COM3"
    # ser = serial.Serial(serialPort, baudrate=9600, timeout=0.5)
    # while ser.is_open:
    raw_data = ser.readline()
    # print("raw data from arduino: ", raw_data)
    str_json = str(raw_data, encoding='utf-8')
    # print("string data: ", str_json)
    if str_json:
        if "type" in str_json:
            # print(str_json)
            json_data = json.loads(str_json)
            # print(json_data)
            type = json_data["type"]
            bracket = json_data["bracket"]
            row_num = json_data["x"]
            col_num = json_data["y"]
            h_len = json_data["h"]
            w_len = json_data["w"]
            text_input = json_data["text_input"] # added

            emit("data transmit", {
                "type": type,
                "bracket": bracket,
                "row_num": row_num,
                "col_num": col_num,
                "h_len": h_len,
                "w_len": w_len,
                "text_input": text_input, #added
            })
            print(type, bracket, row_num, col_num, h_len, w_len, text_input) # added last part
            
            if type == "add":
                engine.setProperty('rate', 170)
                engine.say(bracket + "bracket detected" +
                           "                                                                        ," +
                            "location at" + str(col_num) + "                                        " +
                            str(row_num) +
                            "                                                                       ," +
                            "bracket row length" + "                              " + str(h_len) +
                           "                                                                       ," +
                           "bracket column length" + "                         " + str(w_len) + 
                           "                                                                       ," +
                           "                                                                       ," +
                           "The text added is:" + str(text_input))
                engine.runAndWait()
                time.sleep(9)
            engine.endLoop()
            # ser.close()
    else:
        emit("pause")



if __name__ == '__main__':
    socketio.run(app)

