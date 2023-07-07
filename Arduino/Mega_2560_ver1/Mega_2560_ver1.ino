const byte ROWS = 16;
const byte COLS = 12;

const int c0 = A0;
const int c1 = A2;
const int c2 = A5; // some mistake made on pin connected, so this one is A5, 
const int c3 = A6;
const int c4 = A8;
const int c5 = A10;
const int c6 = A1;
const int c7 = A3;
const int c8 = A4; // some mistake made on pin connected, so this one is A4
const int c9 = A7;
const int c10 = A9;
const int c11 = A11;


const int r0 = 2;
const int r1 = 4;
const int r2 = 6;
const int r3 = 8;
const int r4 = 10;
const int r5 = 12;
const int r6 = 14;
const int r7 = 16;
const int r8 = 18;
const int r9 = 20;
const int r10 = 22;
const int r11 = 24;
const int r12 = 26;
const int r13 = 28;
const int r14 = 30;
const int r15 = 31;

const int btn_1 = 37;
const int btn_2 = 39;

byte rowPins[ROWS] = { r0, r1, r2, r3, r4, r5, r6, r7, r8, r9, \
                       r10, r11, r12, r13, r14, r15
                     };
byte colPins[COLS] = { c0, c1, c2, c3, c4, c5, c6, c7, c8, c9, \
                       c10, c11
                     };

int analog[COLS];
float matrix_array[ROWS][COLS];


String find_bracket_video[1];
String find_bracket_figure[2];
String find_bracket_text[2];
String store_bracket_video[1];
String store_bracket_figure[2];
String store_bracket_text[2];
int video_bracket_num = 0;
int text_bracket_num = 0;
int figure_bracket_num = 0;
int total_bracket_num = 0;
int store_video_bracket_num = 0;
int store_text_bracket_num = 0;
int store_figure_bracket_num = 0;
int store_total_bracket_num = 0;

String user_input = "";
String text_bracket_info[10];
String find_text_info[2];
String store_text_info[2];
int num_text_brackets = 0;
int first_text_x = 0;
int first_text_y = 0;
int second_text_x = 0;
int second_text_y = 0;
bool swapped = false;


//HashMap<Integer, String> text_bracket_info = new HashMap<Integer, String>();

// -----------------------------------------------------------------------//
// Notes: Row 10, Column 11 pin is broken, Here I force it to be correct data (180), 
//        so that block only can read figure bracket information. 


void setup() {
  Serial.begin(9600);
  while (!Serial);
  // put your setup code here, to run once:
  for (int i = 0; i < ROWS; i++) {
    pinMode(rowPins[i], OUTPUT);
  }

  pinMode(btn_1, INPUT);
  pinMode(btn_2, INPUT);
  digitalWrite(btn_1, HIGH);
  digitalWrite(btn_2, HIGH);
}

void loop() {
  // put your main code here, to run repeatedly:
  reset_parameters();
  detect();
  show_matrix();  // Test Code
  process_data();
  // Serial.println("----------Send brackets ---------");
  send_data();
  // Serial.println("----------DEL brackets ----------");
  delete_data();
  store_data();
  show_bracket();  // Test Code
  delay(1500);
}


// -----------------------------------------------------------------//
// Debug Section----------------------------------------------------//
void show_matrix() {
  for (int i = 0; i < ROWS; i++) {
    for ( int n = 0; n < COLS; n++) {
      Serial.print (matrix_array[i][n]);
      Serial.print(" - ");
    }
    Serial.println();
  }
  Serial.println("---matrix ends---");
}

void show_bracket() {
  Serial.println("----------Find brackets ----------");
  Serial.println(find_bracket_text[0]);
  Serial.println(find_bracket_text[1]);
  Serial.println(find_bracket_figure[0]);
  Serial.println(find_bracket_figure[1]);
  Serial.println(find_bracket_video[0]);
  Serial.println("---------------- End -------------");
}







//-------------------Reset Section----------------------------- //
void reset_parameters() {
  reset_find_array_bracket();
  reset_current_onboard_num();
  resetdigitalPins();
  resetTextInfo();
}

void  reset_find_array_bracket() {
  find_bracket_video[0] = "";
  find_bracket_figure[0] = "";
  find_bracket_figure[1] = "";
  find_bracket_text[0] = "";
  find_bracket_text[1] = "";
}

void reset_current_onboard_num() {
  video_bracket_num = 0;
  text_bracket_num = 0;
  figure_bracket_num = 0;
}

void resetdigitalPins() {
  digitalWrite(rowPins[0], LOW);
  digitalWrite(rowPins[1], LOW);
  digitalWrite(rowPins[2], LOW);
  digitalWrite(rowPins[3], LOW);
  digitalWrite(rowPins[4], LOW);
  digitalWrite(rowPins[5], LOW);
  digitalWrite(rowPins[6], LOW);
  digitalWrite(rowPins[7], LOW);
  digitalWrite(rowPins[8], LOW);
  digitalWrite(rowPins[9], LOW);
  digitalWrite(rowPins[10], LOW);
  digitalWrite(rowPins[11], LOW);
  digitalWrite(rowPins[12], LOW);
  digitalWrite(rowPins[13], LOW);
  digitalWrite(rowPins[14], LOW);
  digitalWrite(rowPins[15], LOW);
}

void resetTextInfo() {
  user_input = "";
}

//-------------------End Reset Section------------------------- //








// ------------------Detect Function--------------------------- //
void detect() {
  for (int i = 0; i < ROWS; i++) {
    //===================Reading Voltage===============================
    digitalWrite(rowPins[i], HIGH);
    analog[0] = analogRead(c0);
    analog[1] = analogRead(c1);
    analog[2] = analogRead(c2);
    analog[3] = analogRead(c3);
    analog[4] = analogRead(c4);
    analog[5] = analogRead(c5);
    analog[6] = analogRead(c6);
    analog[7] = analogRead(c7);
    analog[8] = analogRead(c8);
    analog[9] = analogRead(c9);
    analog[10] = analogRead(c10);
    analog[11] = analogRead(c11);
    resetdigitalPins(); //Reset GPIO, TURN OFF
    //=================================================================

    //===================Fill Matrix===================================
    for (int n = 0; n < COLS; n++) {
      matrix_array[i][n] = analog[n];
    }
  }
  //Here is the solve code!!!! If board has been fixed remember to delete this!!!
  matrix_array[9][9] = 180;
  //-------------------------------------------------------------
}

//--------------------------End of Detect-----------------------//







//--------------------------Process Data------------------------//
void process_data() {
  for (int i = 0; i < ROWS; i++) {
    for (int n = 0; n < COLS; n++) {
      if (matrix_array[i][n] > 10) {
        find_video(i, n);
        find_text(i, n);
        find_figure(i, n);
      }
    }
  }
}

void find_text(int i, int n) {
  if (matrix_array[i][n] > 75 && matrix_array[i][n] < 125) {
    int i2;
    int n2;
    int temp_row_number = i + 1;
    int temp_col_number = n + 1;
    matrix_array[i][n] = 0;                                        // Make location to Zero, prevent double counting
    String temp_bracket = "";
    String bracket_text = "";
    String temp = "";

    for (n2 = n + 1; n2 < COLS; n2++) {                            //Find same row second location
      if (matrix_array[i][n2] > 75 && matrix_array[i][n2] < 125) {
        int temp_row_length = n2 - n + 1;                                //Calculate row length
        matrix_array[i][n2] = 0;                                    // Make location to Zero, prevent double counting
        for ( i2 = i + 1; i2 < ROWS; i2++) {                             //Find same col third location
          if (matrix_array[i2][n] > 75 && matrix_array[i2][n] < 125) {
            int temp_col_length = i2 - i + 1;                                                       //Caculate col length
            matrix_array[i2][n] = 0;                                                          // Make location to Zero, prevent double counting
            if (matrix_array[i2][n2] > 75 && matrix_array[i2][n2] < 125) {                        //Check all four corners are correct
              matrix_array[i2][n2] = 0;



              if (text_bracket_info[text_bracket_num] == "") {
                // Prompt user for input and store it in the bracket
                Serial.println("Enter text:");
                while (Serial.available() == 0) {
                  // Wait for user input
                }
                String text_input = Serial.readString();
                text_input.trim();
                text_bracket_info[text_bracket_num] = text_input;

                // Save position of first text bracket
                if (num_text_brackets == 0) {
                  first_text_x = temp_row_number;
                  first_text_y = temp_col_number;
                }

                // Save position of second text bracket
                if (num_text_brackets == 1) {
                  second_text_x = temp_row_number;
                  second_text_y = temp_col_number;
                }
                
                // Runs when the second text bracket is iterated throuogh first
                if ((num_text_brackets > 1) && (swapped == false)) {
                  if ((first_text_x > second_text_x) || ((first_text_x == second_text_x) && (first_text_y > second_text_y))) {
                    temp = text_bracket_info[0];
                    text_bracket_info[0] = text_bracket_info[1];
                    text_bracket_info[1] = temp;
                    swapped = true;
                  }
                }

                temp_bracket = "{\"type\":\"add\",\"bracket\":\"text\",\"x\":" + String(temp_row_number) + ",\"y\":" + \
                                      String(temp_col_number) + ",\"h\":" + String(temp_col_length) + ",\"w\":" + \
                                      String(temp_row_length) + ",\"text_input\":\"" + text_input + "}";
                bracket_text = text_input;
              } else {
                temp_bracket = "{\"type\":\"add\",\"bracket\":\"text\",\"x\":" + String(temp_row_number) + ",\"y\":" + \
                                      String(temp_col_number) + ",\"h\":" + String(temp_col_length) + ",\"w\":" + \
                                      String(temp_row_length) + ",\"text_input\":\"" + text_bracket_info[text_bracket_num] + "}";
                bracket_text = text_bracket_info[text_bracket_num];
              }               


              num_text_brackets = num_text_brackets + 1;
              text_bracket_num = text_bracket_num + 1;
              if (text_bracket_num == 1) {
                find_bracket_text[0] = temp_bracket;
                find_text_info[0] = bracket_text;
                break;
              }
              else if (text_bracket_num == 2) {
                find_bracket_text[1] = temp_bracket;
                find_text_info[1] = bracket_text;
                break;
              }
              else {
                Serial.println("GG, find text part something wrong!!!");
                break;
              }
            }
          }
        }
        break;
      }
    }
  }
}

void find_figure(int i, int n) {
  if (matrix_array[i][n] > 170 && matrix_array[i][n] < 190) {
    int i2;
    int n2;
    int temp_row_number = i + 1;
    int temp_col_number = n + 1;
    matrix_array[i][n] = 0;                                        // Make location to Zero, prevent double counting

    for (n2 = n + 1; n2 < COLS; n2++) {                            //Find same row second location
      if (matrix_array[i][n2] > 170 && matrix_array[i][n2] < 190) {
        int temp_row_length = n2 - n + 1;                                //Calculate row length
        matrix_array[i][n2] = 0;                                    // Make location to Zero, prevent double counting
        for ( i2 = i + 1; i2 < ROWS; i2++) {                             //Find same col third location
          if (matrix_array[i2][n] > 170 && matrix_array[i2][n] < 190) {
            int temp_col_length = i2 - i + 1;                                                       //Caculate col length
            matrix_array[i2][n] = 0;                                                          // Make location to Zero, prevent double counting
            if (matrix_array[i2][n2] > 170 && matrix_array[i2][n2] < 190) {                        //Check all four corners are correct
              matrix_array[i2][n2] = 0;
              String temp_bracket = "{\"type\":\"add\",\"bracket\":\"figure\",\"x\":" + String(temp_row_number) + ",\"y\":" + \
                                    String(temp_col_number) + ",\"h\":" + String(temp_col_length) + ",\"w\":" + \
                                    String(temp_row_length) + "}";
              figure_bracket_num = figure_bracket_num + 1;
              if (figure_bracket_num == 1) {
                find_bracket_figure[0] = temp_bracket;
                break;
              }
              else if (figure_bracket_num == 2) {
                find_bracket_figure[1] = temp_bracket;
                break;
              }
              else {
                Serial.println("GG, find figure part something wrong!!!");
                break;
              }
            }
          }
        }
        break;
      }
    }
  }
}

void find_video(int i, int n) {
  if (matrix_array[i][n] > 650 && matrix_array[i][n] < 680) {
    int i2;
    int n2;
    int temp_row_number = i + 1;
    int temp_col_number = n + 1;
    matrix_array[i][n] = 0;                                        // Make location to Zero, prevent double counting

    for (n2 = n + 1; n2 < COLS; n2++) {                            //Find same row second location
      if (matrix_array[i][n2] > 635 && matrix_array[i][n2] < 685) {
        int temp_row_length = n2 - n + 1;                                //Calculate row length
        matrix_array[i][n2] = 0;                                    // Make location to Zero, prevent double counting
        for ( i2 = i + 1; i2 < ROWS; i2++) {                             //Find same col third location
          if (matrix_array[i2][n] > 635 && matrix_array[i2][n] < 685) {
            int temp_col_length = i2 - i + 1;                                                       //Caculate col length
            matrix_array[i2][n] = 0;                                                          // Make location to Zero, prevent double counting
            if (matrix_array[i2][n2] > 635 && matrix_array[i2][n2] < 680) {                        //Check all four corners are correct
              matrix_array[i2][n2] = 0;
              String temp_bracket = "{\"type\":\"add\",\"bracket\":\"video\",\"x\":" + String(temp_row_number) + ",\"y\":" + \
                                    String(temp_col_number) + ",\"h\":" + String(temp_col_length) + ",\"w\":" + \
                                    String(temp_row_length) + "}";
              video_bracket_num = video_bracket_num + 1;
              if (video_bracket_num > 1) {
                Serial.println("GG, find video part something wrong!!!");
              }
              find_bracket_video[0] = temp_bracket;
            }
          }
        }
        break;
      }
    }
  }
}
//--------------------------End of Process Data-----------------//






//--------------------------Store Data--------------------------//
void store_data() {
  store_bracket_video[0] = find_bracket_video[0];
  store_bracket_figure[0] = find_bracket_figure[0];
  store_bracket_figure[1] = find_bracket_figure[1];
  store_bracket_text[0] = find_bracket_text[0];
  store_bracket_text[1] = find_bracket_text[1];
  store_video_bracket_num = video_bracket_num;
  store_text_bracket_num = text_bracket_num;
  store_figure_bracket_num = figure_bracket_num;
  store_total_bracket_num = total_bracket_num;

  store_text_info[0] = find_text_info[0];
  store_text_info[1] = find_text_info[1];

}
//--------------------------End of Store Data-------------------//






//--------------------------Send Data--------------------------//
void send_data() {
  send_video();
  send_figure();
  send_text();
}

void send_video() {
  switch (video_bracket_num) {
    case 1:
      if (store_bracket_video[0] != find_bracket_video[0]) {
        Serial.println(find_bracket_video[0]);
      }
      break;
    default:
      break;
  }
}

void send_figure() {
  switch (figure_bracket_num) {
    case 1:
      if ((store_bracket_figure[0] != find_bracket_figure[0]) && (store_bracket_figure[1] != find_bracket_figure[0])) {
        Serial.println(find_bracket_figure[0]);
      }
      break;
    case 2:
      if ((store_bracket_figure[0] != find_bracket_figure[0]) && (store_bracket_figure[1] != find_bracket_figure[0])) {
        Serial.println(find_bracket_figure[0]);
      }
      if ((store_bracket_figure[0] != find_bracket_figure[1]) && (store_bracket_figure[1] != find_bracket_figure[1])) {
        Serial.println(find_bracket_figure[1]);
      }
      break;
    default:
      break;

  }
}

void send_text() {
  switch (text_bracket_num) {
    case 1:
      if ((store_bracket_text[0] != find_bracket_text[0]) && (store_bracket_text[1] != find_bracket_text[0])) {
        Serial.println(find_bracket_text[0]);
      }
      break;
    case 2:
      if ((store_bracket_text[0] != find_bracket_text[0]) && (store_bracket_text[1] != find_bracket_text[0])) {
        Serial.println(find_bracket_text[0]);
      }
      if ((store_bracket_text[0] != find_bracket_text[1]) && (store_bracket_text[1] != find_bracket_text[1])) {
        Serial.println(find_bracket_text[1]);
      }
      break;
    default:
      break;
  }
}

//--------------------------End of Store Data-------------------//

//--------------------------Delete Data--------------------------//
void delete_data() {
  delete_video();
  delete_figure();
  delete_text();
}

void delete_video() {
  if (store_video_bracket_num > video_bracket_num) {
    store_bracket_video[0].replace("add", "del" );
    Serial.println(store_bracket_video[0]);
  }
}

void delete_figure() {
  if (store_figure_bracket_num > figure_bracket_num) {
    switch (figure_bracket_num) {
      case 1:
        if (store_bracket_figure[0] == find_bracket_figure[0]) {
          store_bracket_figure[1].replace("add", "del" );
          Serial.println(store_bracket_figure[1]);
        }
        else if (store_bracket_figure[1] == find_bracket_figure[0]) {
          store_bracket_figure[0].replace("add", "del" );
          Serial.println(store_bracket_figure[0]);
        }
        else {
          Serial.println("Something wrong in delete figure section.(case 1)");
        }
        break;
      case 0:
        store_bracket_figure[0].replace("add", "del" );
        Serial.println(store_bracket_figure[0]);
        break;
      default:
        Serial.println("Something wrong in delete figure section.");
        break;
    }
  }
}

void delete_text() {
  if (store_text_bracket_num > text_bracket_num) {
    switch (text_bracket_num) {
      case 1:
        if (store_bracket_text[0] == find_bracket_text[0]) { // second bracket got deleted //
          store_bracket_text[1].replace("add", "del" );
          find_bracket_text[1].replace(find_text_info[1], "");
          store_bracket_text[1].replace(find_text_info[1], "");
          find_bracket_text[1].replace(find_text_info[0], "");
          store_bracket_text[1].replace(find_text_info[0], "");
          if (swapped) {
            text_bracket_info[0] = text_bracket_info[1];
            text_bracket_info[1] = "";
          } else {
            text_bracket_info[1] = "";
          }
          Serial.println(store_bracket_text[1]);
        }
        else if (store_bracket_text[1] == find_bracket_text[0]) { // first bracket got deleted // 
          store_bracket_text[0].replace("add", "del" );
          find_bracket_text[0].replace(find_text_info[0], "");
          store_bracket_text[0].replace(find_text_info[0], "");
          find_bracket_text[0].replace(find_text_info[1], "");
          store_bracket_text[0].replace(find_text_info[1], "");
          if (swapped) {
            text_bracket_info[1] = "";
          } else {
            text_bracket_info[0] = text_bracket_info[1];
            text_bracket_info[1] = "";
          }
          Serial.println(store_bracket_text[0]);
        }
        else {
          Serial.println("Something wrong in delete text section.(case 1)");
        }
        break;
      case 0:
        store_bracket_text[0].replace("add", "del" );
        find_bracket_text[0].replace(find_text_info[0], "");
        store_bracket_text[0].replace(find_text_info[0], "");
        text_bracket_info[0] = "";
        Serial.println(store_bracket_text[0]);
        break;
      default:
        Serial.println("Something wrong in delete text section.");
        break;
    }
  }
}
//--------------------------End of Delete Data-------------------//
