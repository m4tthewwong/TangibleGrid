void setup() {
  // put your setup code here, to run once:
  Serial.begin(9600);
}

void loop() {
  // put your main code here, to run repeatedly:
  Serial.println("{\"ID\":\"1\",\"type\":\"add\",\"bracket\":\"text\",\"x\":" + String(1) + ",\"y\":" + String(1) + ",\"h\":" + String(3) + ",\"w\":" + String(3) + ",\"touch\":\"Yes\"}");
  delay(10000);

  Serial.println("{\"ID\":\"2\",\"type\":\"add\",\"bracket\":\"figure\",\"x\":" + String(1) + ",\"y\":" + String(6) + ",\"h\":" + String(3) + ",\"w\":" + String(3) + ",\"touch\":\"Yes\"}");
  delay(2000);

  Serial.println("{\"ID\":\"3\",\"type\":\"add\",\"bracket\":\"text\",\"x\":" + String(7) + ",\"y\":" + String(7) + ",\"h\":" + String(3) + ",\"w\":" + String(3) + ",\"touch\":\"Yes\"}");
  delay(2000); // 2 second delay

  Serial.println("{\"ID\":\"4\",\"type\":\"add\",\"bracket\":\"video\",\"x\":" + String(7) + ",\"y\":" + String(1) + ",\"h\":" + String(3) + ",\"w\":" + String(3) + ",\"touch\":\"Yes\"}");
  delay(2000); // 2 second delay
}
