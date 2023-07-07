from flask import Flask, render_template
from flask_cors import CORS
from flask_socketio import SocketIO
from flask_socketio import send, emit
import serial
import json

serialPort = "COM3"
ser = serial.Serial(serialPort, baudrate=9600, timeout=0.5)
ser.flushInput()
while ser.is_open:
    raw_data = ser.readline()
    # print("raw data from arduino: ", raw_data)
    str_json = str(raw_data, encoding='utf-8')
    if str_json:
        print("string data: ", str_json)
        if "type" in str_json:
            print("in if")
        # print(str_json)
        # json_data = json.loads(str_json)
        # # print(json_data)
        # type = json_data["type"]
        # bracket = json_data["bracket"]
        # x = json_data["x"]
        # y = json_data["y"]
        # h = json_data["h"]
        # w = json_data["w"]
        ser.close()
