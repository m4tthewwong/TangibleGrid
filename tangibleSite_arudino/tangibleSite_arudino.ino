#include <ArduinoJson.h>
#include "tangibleSite.h"


void setup() {
  // put your setup code here, to run once:
  init_brackets_array();
  init_matrix_updated();
  init_matrix_prev();
  init_matrix_curr();
  init_pin_mode();
  Serial.begin(9600);
}

/*
void loop() {
  show_matrix_prev();
  scanning();
  show_matrix_curr();
  detect();
  delay(1000);
}
*/


void resetdigitalPins() {
  for (int i = 0; i < ROWS; i++) {
    digitalWrite(rowPins[i], LOW);
  }
}


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
}



void detect() {
  // Checking if the new matrix has any qualified changes compared to the current matrix
  if (check_nonzero_count() % 4 == 0 && are_different()) {
    // Setting previous matrix state to the new one
    clean_ghost_value();
    memcpy(matrix_array_prev, matrix_array_curr, sizeof(matrix_array_curr));
    memcpy(matrix_array_curr, matrix_array_updated, sizeof(matrix_array_updated));

    // memcpy  used for copying the 2nd parameter into 1st parameter
    // should have one function to clean the ghost value to zero so that it won't pollute the current real baseboard martix

    // Find new rectangle change
    find_rect();

    // Update the change into bracket map
    update_map(curr_bracket.id);

    // Produce updated JSON from new map data
    current_json = update_json();
    Serial.println(current_json);
  }
}


void clean_ghost_value() {
  for (int i = 0; i < ROWS; i++) {
    for (int n = 0; n < COLS; n++) {
      if (matrix_array_updated[i][n] < 450) {  // change here to avoid ghost value
        matrix_array_updated[i][n] = 0;
      }
    }
  }
}

// Check if the new matrix has changed with any nonzero resistance values
int check_nonzero_count() {
  int count = 0;
  for (int i = 0; i < ROWS; i++) {
    for (int n = 0; n < COLS; n++) {
      if (matrix_array_updated[i][n] > 100) {  // change here to avoid ghost value
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
      if (matrix_array_updated[i][n] - matrix_array_curr[i][n] != 0) {
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
    if (index == 6) {
      break;
    }
    for (int n = 0; n < COLS; n++) {
      int diff = matrix_array_curr[i][n] - matrix_array_prev[i][n];
      if (diff > 100 && index < 6) {  // change it to ignore the ghost value
        points[index] = i;
        points[index + 1] = n;
        index += 2;
        diff_value = diff;
      }
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
        if (i >= 0 && i < 4) {
          curr_bracket.type = bracket_types[0];  // 0, 1, 2, 3 will be text bracket
        } else if (i > 3 && i < 7) {
          curr_bracket.type = bracket_types[1];  // 4, 5, 6 will be image
        } else {
          curr_bracket.type = bracket_types[2];  // 7, 9, ....all will be video
        }
        //curr_bracket.type = bracket_types[i / 3];
        // 0, 1, 2 will be text bracket
        // 3, 4, 5 will be image
        // 6, 7, 8 will be video
        // 9, 10, 11 will be text again
        break;
      }
    }

    curr_bracket.touch = (curr_bracket.type == "Text");  // Set touch to true for text brackets (test simulation)

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
  block["touch"] = curr_bracket.touch;
  block["content"] = "";

  String output;

  doc.shrinkToFit();

  serializeJson(doc, output);

  return output;
}





// Debug code funcations =======================================
void show_matrix_updated() {
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
  // Serial.println("---Previous matrix---");
  for (int i = 0; i < ROWS; i++) {
    for (int n = 0; n < COLS; n++) {
      Serial.print(matrix_array_prev[i][n]);
      Serial.print(" - ");
    }
    Serial.println();
  }
  Serial.println("---matrix ends---");
}



// Add Picture Bracket 1
void set_banner_bracket() {
  matrix_array_updated[0][1] = 900;
  matrix_array_updated[0][11] = 900;
  matrix_array_updated[2][1] = 900;
  matrix_array_updated[2][11] = 900;
}

// Add Text Bracket 2
void set_text_bracket_1() {
  matrix_array_updated[3][1] = 500;
  matrix_array_updated[3][5] = 500;
  matrix_array_updated[6][1] = 500;
  matrix_array_updated[6][5] = 500;
}

// Add picture Bracket 3
void set_picture_bracket() {
  matrix_array_updated[3][6] = 1000;
  matrix_array_updated[3][11] = 1000;
  matrix_array_updated[6][6] = 1000;
  matrix_array_updated[6][11] = 1000;
}

// Add Text Bracket 4
void set_text_bracket_2() {
  matrix_array_updated[7][1] = 600;
  matrix_array_updated[7][11] = 600;
  matrix_array_updated[10][1] = 600;
  matrix_array_updated[10][11] = 600;
}




//   This code is used for testing software without physical baseboard.
void loop() {
  delay(3000);
  // Adding first bracket
  set_banner_bracket();
  delay(1000);
  detect();
  delay(5000);

  // Adding second bracket
  set_text_bracket_1();
  delay(1000);
  detect();
  delay(5000);

  //
  set_picture_bracket();
  delay(1000);
  detect();
  delay(5000);

  set_text_bracket_2();
  delay(1000);
  detect();
  delay(5000);


  delay(10000000);
}
