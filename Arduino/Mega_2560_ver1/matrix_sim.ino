#include <ArduinoJson.h>

const byte ROWS = 16;
const byte COLS = 12;
const byte NUM_BRACKETS = 9;

float matrix_array_prev[ROWS][COLS];
float matrix_array_curr[ROWS][COLS];
float matrix_array_updated[ROWS][COLS];

int ranges[NUM_BRACKETS + 1] = { 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000 };
String bracket_types[3] = { "Text", "Image", "Video" };
String current_json;

// Data type defining elements important to a bracket
struct bracket {
  int id;
  int resistance;
  String type;
  int top_left_row;
  int top_left_col;
  int length;
  int width;
  String status;
};

bracket curr_bracket;
bracket bracket_map[NUM_BRACKETS];

void setup() {
  // put your setup code here, to run once:
  init_brackets_array();
  init_matrix_updated();
  init_matrix_prev();
  init_matrix_curr();
  Serial.begin(9600);
}

// Uncomment when testing with fake bracket inputs
void loop() {
  // Adding first bracket
  set_bracket_1();
  delay(1000);
  detect();
  delay(10000);

  // Adding second bracket
  set_bracket_2();
  delay(1000);
  detect();
  delay(10000);

  // Removing first bracket
  set_bracket_3();
  delay(1000);
  detect();
  delay(10000);

  // Adding third bracket
  set_bracket_4();
  delay(1000);
  detect();
  delay(10000);
}

// Uncomment when testing with the baseboard
/*
void loop() {
  detect();
}
*/

void detect() {
  // Checking if the new matrix has any qualified changes compared to the current matrix
  if (check_nonzero_count() % 4 == 0 && are_different()) {
    // Setting previous matrix state to the new one
    memcpy(matrix_array_prev, matrix_array_curr, sizeof(matrix_array_curr));
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

void init_brackets_array(){
  for(int i = 0; i < NUM_BRACKETS; i++){
    bracket_map[i].id = -1;
    bracket_map[i].resistance = -1;
    bracket_map[i].type = "None";
    bracket_map[i].top_left_row = -1;
    bracket_map[i].top_left_col = -1;
    bracket_map[i].length = -1;
    bracket_map[i].width = -1;
    bracket_map[i].status = "None";
  }
}

void init_matrix_updated() {
  for (int i = 0; i < ROWS; i++) {
    for (int n = 0; n < COLS; n++) {
      matrix_array_updated[i][n] = 0;
    }
  }
}

void init_matrix_prev() {
  for (int i = 0; i < ROWS; i++) {
    for (int n = 0; n < COLS; n++) {
      matrix_array_prev[i][n] = 0;
    }
  }
}

void init_matrix_curr() {
  for (int i = 0; i < ROWS; i++) {
    for (int n = 0; n < COLS; n++) {
      matrix_array_curr[i][n] = 0;
    }
  }
}

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
  for (int i = 0; i < ROWS; i++) {
    for (int n = 0; n < COLS; n++) {
      Serial.print(matrix_array_prev[i][n]);
      Serial.print(" - ");
    }
    Serial.println();
  }
  Serial.println("---matrix ends---");
}

// Check if the new matrix has changed with any nonzero resistance values
int check_nonzero_count() {
  int count = 0;
  for (int i = 0; i < ROWS; i++) {
    for (int n = 0; n < COLS; n++) {
      if (matrix_array_updated[i][n] != 0) {
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

// Add Text Bracket 1
void set_bracket_1() {
  matrix_array_updated[5][5] = 180;
  matrix_array_updated[1][1] = 180;
  matrix_array_updated[1][5] = 180;
  matrix_array_updated[5][1] = 180;
}

// Add Image Bracket 2
void set_bracket_2() {
  matrix_array_updated[8][3] = 500;
  matrix_array_updated[8][8] = 500;
  matrix_array_updated[10][3] = 500;
  matrix_array_updated[10][8] = 500;
}

// Remove Text Bracket 1
void set_bracket_3() {
  matrix_array_updated[5][5] = 0;
  matrix_array_updated[1][1] = 0;
  matrix_array_updated[1][5] = 0;
  matrix_array_updated[5][1] = 0;
}

// Add Video Bracket 1
void set_bracket_4() {
  matrix_array_updated[11][2] = 850;
  matrix_array_updated[11][6] = 850;
  matrix_array_updated[14][2] = 850;
  matrix_array_updated[14][6] = 850;
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
      if (diff != 0 && index < 6) {
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
    curr_bracket.length = points[3] - points[1];
    curr_bracket.width = points[4] - points[0];

    for (int i = 0; i < NUM_BRACKETS + 1; i++) {
      if (in_range(curr_bracket.resistance, ranges[i], ranges[i + 1])) {
        curr_bracket.id = i;
        curr_bracket.type = bracket_types[i / 3];
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
  block["content"] = "";

  String output;

  doc.shrinkToFit();

  serializeJson(doc, output);

  return output;
}
