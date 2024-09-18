const byte ROWS = 16;
const byte COLS = 12;
const byte NUM_BRACKETS = 9;


const int c0 =  A12;  // A0 is for UART, so it's not stable for analog read.
const int c1 =  A1;
const int c2 =  A2;
const int c3 =  A3; 
const int c4 =  A4;
const int c5 =  A5;
const int c6 =  A6;
const int c7 =  A7; 
const int c8 =  A8;
const int c9 =  A9;
const int c10 = A10;
const int c11 = A11; 


const int r0 =  19;
const int r1 =  20;
const int r2 =  2;
const int r3 =  3;
const int r4 =  4;
const int r5 =  5;
const int r6 =  6;
const int r7 =  7;
const int r8 =  8;
const int r9 =  9;
const int r10 = 10;
const int r11 = 11;
const int r12 = 12;
const int r13 = 13;
const int r14 = 14;
const int r15 = 15;


byte rowPins[ROWS] = {r0, r1, r2, r3, r4, r5, r6, r7, r8, r9, r10, r11, r12, r13, r14, r15};
byte colPins[COLS] = {c0, c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11};

int analogReadValue[COLS];
float matrix_array_curr[ROWS][COLS];
float matrix_array_prev[ROWS][COLS];
float matrix_array_updated[ROWS][COLS];

int ranges[NUM_BRACKETS + 1] = { 300, 400, 500, 600, 700, 800, 900, 1000, 1250, 1350 };
                                //  390, 490, 590, 690, 790, 890, 990, 1190, 1300
String bracket_types[3] = { "Text", "Image", "Video" };
String current_json;

// Data type defining elemements important to a bracket
struct bracket {
  int id;
  int resistance;
  String type;
  int top_left_row;
  int top_left_col;
  int length;
  int width;
  String status;
  bool touch;
};

bracket curr_bracket;
bracket bracket_map[NUM_BRACKETS];



// ======= Initial Section =======
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
    bracket_map[i].touch = false;
  }
}

void init_matrix_curr() {
  for (int i = 0; i < ROWS; i++) {
    for (int n = 0; n < COLS; n++) {
      matrix_array_curr[i][n] = 0;
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

void init_matrix_updated() {
  for (int i = 0; i < ROWS; i++) {
    for (int n = 0; n < COLS; n++) {
      matrix_array_updated[i][n] = 0;
    }
  }
}

void init_pin_mode(){
  for (int i = 0; i < ROWS; i++) {
    pinMode(rowPins[i], OUTPUT);
  }
}

// ======= Initial Section =======
