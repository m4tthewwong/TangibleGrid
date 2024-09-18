#include <ArduinoJson.h>
#include "tangibleSite.h"
#include "i2cBus.h"


void setup() {
  Serial.begin(9600);
  delay(100);
  Wire.begin();
  // put your setup code here, to run once:
  init_brackets_array();
  init_matrix_updated();
  init_matrix_prev();
  init_matrix_curr();
  init_pin_mode();
  init_brackets_array();
  //init_touch_sensor();
  

}

/*
void loop() {
  scanning();
  //touch_scan_1_8();
  detect();
  delay(1000);
}*/


void scanning() {
  for (int i = 0; i < ROWS; i++) {
    //===================Reading Voltage===============================
    digitalWrite(rowPins[i], HIGH);
    analogReadValue[0] = analogRead(c0);
    analogReadValue[1] = analogRead(c1);
    analogReadValue[2] = analogRead(c2);
    analogReadValue[3] = analogRead(c3);
    analogReadValue[4] = analogRead(c4);
    analogReadValue[5] = analogRead(c5);
    analogReadValue[6] = analogRead(c6);
    analogReadValue[7] = analogRead(c7);
    analogReadValue[8] = analogRead(c8);
    analogReadValue[9] = analogRead(c9);
    analogReadValue[10] = analogRead(10);
    analogReadValue[11] = analogRead(c11);
    //===================Fill Matrix===================================
    for (int n = 0; n < COLS; n++) {
      matrix_array_updated[i][n] = analogReadValue[n];
    }
    resetdigitalPins();  //Reset GPIO, TURN OFF
    delay(50);
  }
  // show_matrix_updated();
  clean_ghost_value();
  // show_matrix_updated();
}


void clean_ghost_value() {
  for (int i = 0; i < ROWS; i++) {
    for (int n = 0; n < COLS; n++) {
      if (matrix_array_updated[i][n] < 300) {  // change here to avoid ghost value
        matrix_array_updated[i][n] = 0;
      }
    }
  }
}


void detect() {
  // Checking if the new matrix has any qualified changes compared to the current matrix
  if (are_different() && check_nonzero_count() % 4 == 0) {
    // Setting previous matrix state to the new one
    memcpy(matrix_array_prev, matrix_array_curr, sizeof(matrix_array_curr));  // memcpy  used for copying the 2nd parameter into 1st parameter
    memcpy(matrix_array_curr, matrix_array_updated, sizeof(matrix_array_updated));

    // Find new rectangle change
    find_rect();

    // Update the change into bracket map
    update_map(curr_bracket.id);

    // Produce updated JSON from new map data
    current_json = update_json();
    Serial.println(current_json);
  }
}

// Check if the new matrix has changed with any nonzero resistance values
int check_nonzero_count() {
  int count = 0;
  for (int i = 0; i < ROWS; i++) {
    for (int n = 0; n < COLS; n++) {
      if (matrix_array_updated[i][n] >= 300) {  // change here to avoid ghost value
        count += 1;
      }
    }
  }
  return count;
}

// Check if the updated matrix and curr matrix are different
bool are_different() {
  for (int i = 0; i < ROWS; i++) {
    for (int n = 0; n < COLS; n++) {
      if (abs(matrix_array_updated[i][n] - matrix_array_curr[i][n]) > 300) {  // Use abs value of difference to create a filter that aims to debounce the differences of analogRead values.
        return true;
      }
    }
  }
  return false;
}



// Findes the changed bracket and updates the current bracket variable
void find_rect() {
  int points[6];
  int diff_value = 0;
  int index = 0;

  for (int i = 0; i < ROWS; i++) {
    for (int n = 0; n < COLS; n++) {
      int diff = matrix_array_curr[i][n] - matrix_array_prev[i][n];
      if ((abs(diff) > 300) && (index < 6)) {
        points[index] = i;
        points[index + 1] = n;
        index += 2;
        diff_value = diff;
      }
    }
    if (index == 6) {
      break;
    }
  }

  if (index == 6) {
    int sign = diff_value / abs(diff_value);
    curr_bracket.resistance = abs(diff_value);
    curr_bracket.top_left_row = points[0];
    curr_bracket.top_left_col = points[1];
    curr_bracket.width = points[3] - points[1];
    curr_bracket.length = points[4] - points[0];

    for (int i = 0; i < NUM_BRACKETS + 1; i++) {
      if (in_range(curr_bracket.resistance, ranges[i], ranges[i + 1])) {
        curr_bracket.id = i;
        if (i >= 0 && i < 3) {
          curr_bracket.type = bracket_types[0];  // 0, 1, 2 will be text bracket
        } else if (i > 2 && i < 6) {
          curr_bracket.type = bracket_types[1];  // 3, 4, 5 will be image
        } else {
          curr_bracket.type = bracket_types[2];  // 6, 7, 8, ....all will be video
        }
        break;
      }
    }

    if (sign > 0 && bracket_map[curr_bracket.id].id == -1) {
      curr_bracket.status = "Added";
    } else if (sign < 0) {
      curr_bracket.status = "Removed";
    } else if (sign > 0) {
      curr_bracket.status = "Modified";
    }
  }
}



bool in_range(int val, int minimum, int maximum) {
  return ((minimum <= val) && (val < maximum));
}



// Updates map entry for current bracket
void update_map(int key) {
  bracket_map[key].id = curr_bracket.id;
  bracket_map[key].top_left_row = curr_bracket.top_left_row;
  bracket_map[key].top_left_col = curr_bracket.top_left_col;
  bracket_map[key].length = curr_bracket.length;
  bracket_map[key].width = curr_bracket.width;
  bracket_map[key].status = curr_bracket.status;
}

// Prints a specific in the map, printf is not supported on Arduino AVR
// void print_bracket_at(int key) {
//   bracket temp = bracket_map[key];
//   Serial.printf("id = %d \nresistance = %d \ntype = %s \ntop_left_row = %d \ntop_left_col = %d \nlength = %d \nwidth = %d \nstatus = %s \n", temp.id, temp.resistance, temp.type, temp.top_left_row, temp.top_left_col, temp.length, temp.width, temp.status);
// }

// Saves new JSON from the current map state
String update_json() {
  JsonDocument doc;
  JsonObject block = doc.add<JsonObject>();
  block["id"] = curr_bracket.id;
  block["resistance"] = curr_bracket.resistance;
  block["type"] = curr_bracket.type;
  block["top_left_row"] = curr_bracket.top_left_row;
  block["top_left_col"] = curr_bracket.top_left_col;
  block["length"] = curr_bracket.length;
  block["width"] = curr_bracket.width;
  block["status"] = curr_bracket.status;
  // block["touch"] = curr_bracket.touch;
  block["content"] = "";

  String output;

  doc.shrinkToFit();

  serializeJson(doc, output);

  return output;
}



// Basical funcation call out section =========================
void resetdigitalPins() {
  for (int i = 0; i < ROWS; i++) {
    digitalWrite(rowPins[i], LOW);
  }
}






















// Debug code funcations =======================================
void show_matrix_updated() {
  Serial.println("---Updated matrix---");
  for (int i = 0; i < ROWS; i++) {
    for (int n = 0; n < COLS; n++) {
      Serial.print(matrix_array_updated[i][n]);
      Serial.print(" - ");
    }
    Serial.println();
  }
  Serial.println("---matrix ends---");
}

void show_matrix_curr() {
  Serial.println("---Current matrix---");
  for (int i = 0; i < ROWS; i++) {
    for (int n = 0; n < COLS; n++) {
      Serial.print(matrix_array_curr[i][n]);
      Serial.print(" - ");
    }
    Serial.println();
  }
  Serial.println("---matrix ends---");
}

void show_matrix_prev() {
  Serial.println("---Previous matrix---");
  for (int i = 0; i < ROWS; i++) {
    for (int n = 0; n < COLS; n++) {
      Serial.print(matrix_array_prev[i][n]);
      Serial.print(" - ");
    }
    Serial.println();
  }
  Serial.println("---matrix ends---");
}



// Add Bracket 1
void set_bracket_1() {
matrix_array_updated[0][0] = 650;
matrix_array_updated[0][11] = 650;
matrix_array_updated[2][0] = 650;
matrix_array_updated[2][11] = 650;
}

// Add Bracket 2
void set_bracket_2() {
matrix_array_updated[3][0] = 350;
matrix_array_updated[3][6] = 350;
matrix_array_updated[4][0] = 350;
matrix_array_updated[4][6] = 350;
}

// Add Bracket 3
void set_bracket_3_1() {
matrix_array_updated[5][0] = 450;
matrix_array_updated[5][5] = 450;
matrix_array_updated[7][0] = 450;
matrix_array_updated[7][5] = 450;
}

void set_bracket_3_1_remove() {
matrix_array_updated[5][0] = 0;
matrix_array_updated[5][5] = 0;
matrix_array_updated[7][0] = 0;
matrix_array_updated[7][5] = 0;
}

// Add Bracket 3
void set_bracket_3_final() {
matrix_array_updated[5][0] = 450;
matrix_array_updated[5][5] = 450;
matrix_array_updated[8][0] = 450;
matrix_array_updated[8][5] = 450;
}

// Add Bracket 4
void set_bracket_4_1() {
matrix_array_updated[5][6] = 750;
matrix_array_updated[5][9] = 750;
matrix_array_updated[8][6] = 750;
matrix_array_updated[8][9] = 750;
}

// Add Bracket 4
void set_bracket_4_1_remove() {
matrix_array_updated[5][6] = 0;
matrix_array_updated[5][9] = 0;
matrix_array_updated[8][6] = 0;
matrix_array_updated[8][9] = 0;
}

// Add Bracket 4
void set_bracket_4_final() {
matrix_array_updated[5][6] = 750;
matrix_array_updated[5][11] = 750;
matrix_array_updated[8][6] = 750;
matrix_array_updated[8][11] = 750;
}

// Add Bracket 5
void set_bracket_5_1() {
matrix_array_updated[10][2] = 550;
matrix_array_updated[10][5] = 550;
matrix_array_updated[11][2] = 550;
matrix_array_updated[11][5] = 550;
}

void set_bracket_5_1_remove() {
matrix_array_updated[10][2] = 0;
matrix_array_updated[10][5] = 0;
matrix_array_updated[11][2] = 0;
matrix_array_updated[11][5] = 0;
}

void set_bracket_5_2() {
matrix_array_updated[10][0] = 550;
matrix_array_updated[10][5] = 550;
matrix_array_updated[11][0] = 550;
matrix_array_updated[11][5] = 550;
}

void set_bracket_5_2_remove() {
matrix_array_updated[10][0] = 0;
matrix_array_updated[10][5] = 0;
matrix_array_updated[11][0] = 0;
matrix_array_updated[11][5] = 0;
}

// Add Bracket 5
void set_bracket_5_3() {
matrix_array_updated[9][0] = 550;
matrix_array_updated[9][5] = 550;
matrix_array_updated[12][0] = 550;
matrix_array_updated[12][5] = 550;
}

// Add Bracket 6
void set_bracket_6_1() {
matrix_array_updated[9][6] = 850;
matrix_array_updated[9][11] = 850;
matrix_array_updated[12][6] = 850;
matrix_array_updated[12][11] = 850;
}

// Add Bracket 7
void set_bracket_7() {
matrix_array_updated[13][3] = 950;
matrix_array_updated[13][8] = 950;
matrix_array_updated[15][3] = 950;
matrix_array_updated[15][8] = 950;
}

// Add Bracket 5
void set_bracket_5_3_remove() {
matrix_array_updated[9][0] = 0;
matrix_array_updated[9][5] = 0;
matrix_array_updated[12][0] = 0;
matrix_array_updated[12][5] = 0;
}

// Add Bracket 6
void set_bracket_6_1_remove() {
matrix_array_updated[9][6] = 0;
matrix_array_updated[9][11] = 0;
matrix_array_updated[12][6] = 0;
matrix_array_updated[12][11] = 0;
}

void set_bracket_6_final() {
matrix_array_updated[9][0] = 850;
matrix_array_updated[9][5] = 850;
matrix_array_updated[12][0] = 850;
matrix_array_updated[12][5] = 850;
}

void set_bracket_5_final() {
matrix_array_updated[9][6] = 550;
matrix_array_updated[9][11] = 550;
matrix_array_updated[12][6] = 550;
matrix_array_updated[12][11] = 550;
}


//   This code is used for testing software without physical baseboard.
void loop() {
  delay(5000);


  set_bracket_1();
  delay(1000);
  detect();
  delay(40000);

  set_bracket_2();
  delay(1000);
  detect();
  delay(60000);

  set_bracket_3_1();
  delay(1000);
  detect();
  delay(60000);

  set_bracket_3_1_remove();
  delay(1000);
  detect();
  delay(20000);

  set_bracket_3_final();
  delay(1000);
  detect();
  delay(40000);

  set_bracket_4_1();
  delay(1000);
  detect();
  delay(40000);

  set_bracket_4_1_remove();
  delay(1000);
  detect();
  delay(20000);

  set_bracket_4_final();
  delay(1000);
  detect();
  delay(40000);
  
  set_bracket_5_1();
  delay(1000);
  detect();
  delay(40000);

  set_bracket_5_1_remove();
  delay(1000);
  detect();
  delay(20000);

  set_bracket_5_2();
  delay(1000);
  detect();
  delay(40000);

  set_bracket_5_2_remove();
  delay(1000);
  detect();
  delay(20000);

  set_bracket_5_3();
  delay(1000);
  detect();
  delay(40000);

  set_bracket_6_1();
  delay(1000);
  detect();
  delay(60000);

  set_bracket_7();
  delay(1000);
  detect();
  delay(40000);

  set_bracket_5_3_remove();
  delay(1000);
  detect();
  delay(20000);

  set_bracket_6_1_remove();
  delay(1000);
  detect();
  delay(20000);

  set_bracket_6_final();
  delay(1000);
  detect();
  delay(40000);

  set_bracket_5_final();
  delay(1000);
  detect();
  delay(40000);

  delay(10000000);
}


