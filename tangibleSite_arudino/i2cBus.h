#include "Wire.h"
#include "Adafruit_MPR121.h"

#define MPR121 0x5A
#define MPR121_1 0x5B
#define MPR121_2 0x5C
#define MPR121_3 0x5D
#define touchBus_1 0x70
#define touchBus_2 0x71
#define vibrationBus_1 0x72
#define vibrationBus_1 0x73

Adafruit_MPR121 touch_sensor_0 = Adafruit_MPR121();
Adafruit_MPR121 touch_sensor_1 = Adafruit_MPR121();
Adafruit_MPR121 touch_sensor_2 = Adafruit_MPR121();
Adafruit_MPR121 touch_sensor_3 = Adafruit_MPR121();
Adafruit_MPR121 touch_sensor_4 = Adafruit_MPR121();
Adafruit_MPR121 touch_sensor_5 = Adafruit_MPR121();
Adafruit_MPR121 touch_sensor_6 = Adafruit_MPR121();
Adafruit_MPR121 touch_sensor_7 = Adafruit_MPR121();
Adafruit_MPR121 touch_sensor_8 = Adafruit_MPR121();
Adafruit_MPR121 touch_sensor_9 = Adafruit_MPR121();
Adafruit_MPR121 touch_sensor_10 = Adafruit_MPR121();
Adafruit_MPR121 touch_sensor_11 = Adafruit_MPR121();
Adafruit_MPR121 touch_sensor_12 = Adafruit_MPR121();
Adafruit_MPR121 touch_sensor_13 = Adafruit_MPR121();
Adafruit_MPR121 touch_sensor_14 = Adafruit_MPR121();
Adafruit_MPR121 touch_sensor_15 = Adafruit_MPR121();

void tcaselect(uint8_t bus, uint8_t port) {
  if (port > 7) return;
  Wire.beginTransmission(bus);
  Wire.write(1 << port);
  Wire.endTransmission();
}

void init_touch_sensor() {
  tcaselect(touchBus_1, 3);
  if (!touch_sensor_0.begin(MPR121)) {
    Serial.println("MPR121 not found, check wiring?");
  } else {
    Serial.println("Row 1 found touch sensor");
  }
  tcaselect(touchBus_1, 2);
  if (!touch_sensor_1.begin(MPR121)) {
    Serial.println("MPR121 not found, check wiring?");
  } else {
    Serial.println("Row 2 found touch sensor");
  }
  tcaselect(touchBus_1, 1);
  if (!touch_sensor_2.begin(MPR121)) {
    Serial.println("MPR121 not found, check wiring?");
  } else {
    Serial.println("Row 3 Found touch sensor");
  }
  tcaselect(touchBus_1, 0);
  if (!touch_sensor_3.begin(MPR121)) {
    Serial.println("MPR121 not found, check wiring?");
  } else {
    Serial.println("Row 4 Found touch sensor");
  }
  tcaselect(touchBus_1, 7);
  if (!touch_sensor_4.begin(MPR121)) {
    Serial.println("MPR121 not found, check wiring?");
  } else {
    Serial.println("Row 5 Found touch sensor");
  }
  if (!touch_sensor_5.begin(MPR121_1)) {
    Serial.println("MPR121 not found, check wiring?");
  } else {
    Serial.println("Row 6 Found touch sensor");
  }
  if (!touch_sensor_6.begin(MPR121_2)) {
    Serial.println("MPR121 not found, check wiring?");
  } else {
    Serial.println("Row 7 Found touch sensor");
  }
  if (!touch_sensor_7.begin(MPR121_3)) {
    Serial.println("MPR121 not found, check wiring?");
  } else {
    Serial.println("Row 8 Found touch sensor");
  }
}


void touch_scan_1_8() {
  tcaselect(touchBus_1, 3);
  for (uint8_t i = 0; i < 12; i++) {
    Serial.print(touch_sensor_0.filteredData(i));
    Serial.print("\t");
  }
  Serial.println();


  // tcaselect(touchBus_1, 2);
  // //touch_sensor_1.begin(MPR121_0);
  // for (uint8_t i = 0; i < 12; i++) {
  //   Serial.print(touch_sensor_1.filteredData(i));
  //   Serial.print("\t");
  // }
  // Serial.println();

  // tcaselect(touchBus_1, 1);
  // //touch_sensor_2.begin(MPR121_0);
  // for (uint8_t i = 0; i < 12; i++) {
  //   Serial.print(touch_sensor_2.filteredData(i));
  //   Serial.print("\t");
  // }
  // Serial.println();

  // tcaselect(touchBus_1, 0);
  // //touch_sensor_3.begin(MPR121_0);
  // for (uint8_t i = 0; i < 12; i++) {
  //   Serial.print(touch_sensor_3.filteredData(i));
  //   Serial.print("\t");
  // }
  // Serial.println();

  // tcaselect(touchBus_1, 7);
  // touch_sensor_4.begin(MPR121_0);
  // for (uint8_t i = 0; i < 12; i++) {
  //   Serial.print(touch_sensor_4.filteredData(i));
  //   Serial.print("\t");
  // }
  // Serial.println();
  // touch_sensor_5.begin(MPR121_1);
  // for (uint8_t i = 0; i < 12; i++) {
  //   Serial.print(touch_sensor_5.filteredData(i));
  //   Serial.print("\t");
  // }
  // Serial.println();
  // touch_sensor_6.begin(MPR121_2);
  // for (uint8_t i = 0; i < 12; i++) {
  //   Serial.print(touch_sensor_6.filteredData(i));
  //   Serial.print("\t");
  // }
  // Serial.println();
  // touch_sensor_7.begin(MPR121_3);
  // for (uint8_t i = 0; i < 12; i++) {
  //   Serial.print(touch_sensor_7.filteredData(i));
  //   Serial.print("\t");
  // }
  // Serial.println();
}