void setup() {
  // put your setup code here, to run once:
  Serial.begin(9600);
}

void loop() {
  // put your main code here, to run repeatedly:
  Serial.println("{\"ID\":\"1\",\"type\":\"add\",\"bracket\":\"text\",\"x\":\"1\",\"y\":\"1\",\"h\":\"3\",\"w\":\"3\",\"touch\":\"Yes\"}");
  delay(2000); // 2 second delay

  Serial.println("{\"ID\":\"2\",\"type\":\"add\",\"bracket\":\"figure\",\"x\":\"1\",\"y\":\"6\",\"h\":\"3\",\"w\":\"3\",\"touch\":\"Yes\"}");
  delay(2000); // 2 second delay

  Serial.println("{\"ID\":\"3\",\"type\":\"add\",\"bracket\":\"text\",\"x\":\"7\",\"y\":\"7\",\"h\":\"3\",\"w\":\"3\",\"touch\":\"Yes\"}");
  delay(2000); // 2 second delay

  Serial.println("{\"ID\":\"4\",\"type\":\"add\",\"bracket\":\"video\",\"x\":\"7\",\"y\":\"1\",\"h\":\"3\",\"w\":\"3\",\"touch\":\"Yes\"}");
  delay(2000); // 2 second delay

  Serial.println("{\"ID\":\"1\",\"type\":\"delete\",\"bracket\":\"text\",\"x\":\"1\",\"y\":\"1\",\"h\":\"3\",\"w\":\"3\",\"touch\":\"Yes\"}");
  delay(2000); // 2 second delay

  Serial.println("{\"ID\":\"2\",\"type\":\"delete\",\"bracket\":\"figure\",\"x\":\"1\",\"y\":\"6\",\"h\":\"3\",\"w\":\"3\",\"touch\":\"Yes\"}");
  delay(2000); // 2 second delay

  Serial.println("{\"ID\":\"4\",\"type\":\"delete\",\"bracket\":\"video\",\"x\":\"7\",\"y\":\"1\",\"h\":\"3\",\"w\":\"3\",\"touch\":\"Yes\"}");
  delay(2000); // 2 second delay

  Serial.println("{\"ID\":\"1\",\"type\":\"add\",\"bracket\":\"text\",\"x\":\"1\",\"y\":\"1\",\"h\":\"3\",\"w\":\"3\",\"touch\":\"Yes\"}");
  delay(60000); // 1 min delay
}
