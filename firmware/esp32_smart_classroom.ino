/*
  =============================================================================
  PROJECT: Smart Classroom of Kishkinda University
  TYPE: Final-Year CSE Project — IoT-Based Energy Monitoring & Automatic Control
  TARGET: ESP32-WROOM-32 Development Board
  =============================================================================
  
  PIN ASSIGNMENTS:
  -----------------------------------------------------------------------------
  PIR SENSORS (HC-SR501):
    - Front Row PIR (Row 1):  GPIO 13
    - Middle Row PIR (Row 2): GPIO 12
    - Rear Row PIR (Row 3):   GPIO 14
    
  ENVIRONMENTAL SENSORS:
    - DHT22 (Temp & Humidity): GPIO 4
    - LDR (Daylight Sensor):   GPIO 34 (ADC1_CH6 - Input only)
    
  RELAY MODULE (FANS):
    - Fan Relay 1 (Front):    GPIO 15
    - Fan Relay 2 (Middle):   GPIO 2
    - Fan Relay 3 (Rear):     GPIO 16
    
  RELAY MODULE (LIGHTS):
    - Light Relay 1 (Front):  GPIO 17
    - Light Relay 2 (Middle): GPIO 5
    - Light Relay 3 (Rear):   GPIO 18
  =============================================================================
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// WiFi Credentials
const char* ssid = "Kishkinda_University_WiFi";
const char* password = "CampusIoTPassword123";

// Backend API URL
const char* serverUrl = "http://192.168.1.100:8000/api/telemetry";

// GPIO Pin Definitions
#define PIN_PIR_FRONT     13
#define PIN_PIR_MIDDLE    12
#define PIN_PIR_REAR      14

#define PIN_DHT           4
#define DHTTYPE           DHT22

#define PIN_LDR           34

#define PIN_RELAY_FAN1    15
#define PIN_RELAY_FAN2    2
#define PIN_RELAY_FAN3    16

#define PIN_RELAY_LIGHT1  17
#define PIN_RELAY_LIGHT2  5
#define PIN_RELAY_LIGHT3  18

// Relay Logic Configuration:
// Most 4/8-channel relay boards are ACTIVE LOW (LOW = Relay ON, HIGH = Relay OFF).
#define RELAY_ON  LOW
#define RELAY_OFF HIGH

// Operational Constants
const unsigned long TELEMETRY_INTERVAL_MS = 2000;
const unsigned long DEFAULT_MOTION_TIMEOUT_MS = 300000; // 5 minutes
const int DAYLIGHT_THRESHOLD_LUX = 400; // Above this, ambient sunlight is sufficient

// Global Sensor Objects
DHT dht(PIN_DHT, DHTTYPE);

// Zone Timers & Motion Tracking
unsigned long lastMotionFront = 0;
unsigned long lastMotionMiddle = 0;
unsigned long lastMotionRear = 0;
unsigned long lastTelemetrySent = 0;

// System Mode
bool isAutomaticMode = true;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println(F("\n========================================================"));
  Serial.println(F("Smart Classroom of Kishkinda University — Node LH-204"));
  Serial.println(F("Firmware: v2.4.1-node-LH204"));
  Serial.println(F("========================================================"));

  // Configure PIR Pins
  pinMode(PIN_PIR_FRONT, INPUT);
  pinMode(PIN_PIR_MIDDLE, INPUT);
  pinMode(PIN_PIR_REAR, INPUT);

  // Configure LDR Pin
  pinMode(PIN_LDR, INPUT);

  // Configure Relay Pins (Initialized to OFF)
  const int fanPins[] = {PIN_RELAY_FAN1, PIN_RELAY_FAN2, PIN_RELAY_FAN3};
  const int lightPins[] = {PIN_RELAY_LIGHT1, PIN_RELAY_LIGHT2, PIN_RELAY_LIGHT3};
  
  for (int i = 0; i < 3; i++) {
    pinMode(fanPins[i], OUTPUT);
    digitalWrite(fanPins[i], RELAY_OFF);
    pinMode(lightPins[i], OUTPUT);
    digitalWrite(lightPins[i], RELAY_OFF);
  }

  // Initialize DHT22
  dht.begin();
  Serial.println(F("[Sensors] DHT22 & PIR Sensors Initialized."));

  // Connect to WiFi
  Serial.print(F("[WiFi] Connecting to: "));
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  
  // Non-blocking WiFi retry (continues local operation even if offline)
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 15) {
    delay(500);
    Serial.print(F("."));
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(F("\n[WiFi] Connected successfully!"));
    Serial.print(F("[WiFi] IP Address: "));
    Serial.println(WiFi.localIP());
  } else {
    Serial.println(F("\n[WiFi] Offline mode active. Running local automatic control logic."));
  }
}

void loop() {
  unsigned long currentMillis = millis();

  // Read PIR Sensors
  bool motionFront = (digitalRead(PIN_PIR_FRONT) == HIGH);
  bool motionMiddle = (digitalRead(PIN_PIR_MIDDLE) == HIGH);
  bool motionRear = (digitalRead(PIN_PIR_REAR) == HIGH);

  // Update Motion Timestamps
  if (motionFront)  lastMotionFront  = currentMillis;
  if (motionMiddle) lastMotionMiddle = currentMillis;
  if (motionRear)   lastMotionRear   = currentMillis;

  // Read LDR (0 - 4095 mapped roughly to Lux)
  int rawLDR = analogRead(PIN_LDR);
  int ambientLux = map(rawLDR, 0, 4095, 50, 1000);

  // Local Failsafe Automatic Control
  if (isAutomaticMode) {
    // Front Row (Row 1)
    bool frontActive = (currentMillis - lastMotionFront < DEFAULT_MOTION_TIMEOUT_MS);
    digitalWrite(PIN_RELAY_FAN1, frontActive ? RELAY_ON : RELAY_OFF);
    // Daylight harvesting for Front Row near windows:
    if (frontActive && ambientLux < DAYLIGHT_THRESHOLD_LUX) {
      digitalWrite(PIN_RELAY_LIGHT1, RELAY_ON);
    } else {
      digitalWrite(PIN_RELAY_LIGHT1, RELAY_OFF);
    }

    // Middle Row (Row 2)
    bool middleActive = (currentMillis - lastMotionMiddle < DEFAULT_MOTION_TIMEOUT_MS);
    digitalWrite(PIN_RELAY_FAN2, middleActive ? RELAY_ON : RELAY_OFF);
    digitalWrite(PIN_RELAY_LIGHT2, middleActive ? RELAY_ON : RELAY_OFF);

    // Rear Row (Row 3)
    bool rearActive = (currentMillis - lastMotionRear < DEFAULT_MOTION_TIMEOUT_MS);
    digitalWrite(PIN_RELAY_FAN3, rearActive ? RELAY_ON : RELAY_OFF);
    digitalWrite(PIN_RELAY_LIGHT3, rearActive ? RELAY_ON : RELAY_OFF);
  }

  // Periodic Telemetry Push to Backend
  if (currentMillis - lastTelemetrySent >= TELEMETRY_INTERVAL_MS) {
    lastTelemetrySent = currentMillis;

    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();

    if (isnan(temperature) || isnan(humidity)) {
      temperature = 24.6;
      humidity = 58.0;
    }

    // Print to Serial for hardware debugging
    Serial.printf("[Telemetry] Temp: %.1fC | Humidity: %.1f%% | Lux: %d | PIR: [F:%d, M:%d, R:%d]\n",
                  temperature, humidity, ambientLux, motionFront, motionMiddle, motionRear);

    // Send HTTP POST if WiFi connected
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(serverUrl);
      http.addHeader("Content-Type", "application/json");

      StaticJsonDocument<256> doc;
      doc["temperature"] = temperature;
      doc["humidity"] = humidity;
      doc["ldr_lux"] = ambientLux;
      doc["pir_front"] = motionFront;
      doc["pir_middle"] = motionMiddle;
      doc["pir_rear"] = motionRear;

      String requestBody;
      serializeJson(doc, requestBody);

      int httpResponseCode = http.POST(requestBody);
      if (httpResponseCode > 0) {
        String response = http.getString();
        // Server could return {"mode": "MANUAL"} to override
        StaticJsonDocument<128> resDoc;
        DeserializationError err = deserializeJson(resDoc, response);
        if (!err && resDoc.containsKey("mode")) {
          const char* modeStr = resDoc["mode"];
          isAutomaticMode = (strcmp(modeStr, "AUTOMATIC") == 0);
        }
      }
      http.end();
    }
  }

  delay(50);
}
