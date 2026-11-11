# Smart Classroom of Kishkinda University
### IoT-Based Smart Classroom Energy Monitoring and Automatic Control System
*Final-Year CSE Project — Kishkinda University*

---

## 🏛️ Project Architecture

```
e:\major project\
├── backend/
│   └── main.py                     # FastAPI REST API + WebSocket Telemetry + Simulation Engine
├── firmware/
│   └── esp32_smart_classroom.ino   # Production C++ Firmware for ESP32-WROOM
├── frontend/                       # Vite + React 19 + TypeScript + Three.js + Tailwind CSS v4
│   ├── public/assets/              # High-resolution 3D renders & Stitch UI design assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── Classroom3DScene.tsx# Interactive 3D Three.js Digital Twin (15 desks, fans, podium, lighting)
│   │   │   ├── Sidebar.tsx         # University branding, navigation, hardware status card
│   │   │   └── Header.tsx          # LH-204 selector, AI/Manual toggle, live telemetry pill
│   │   ├── pages/
│   │   │   ├── OverviewPage.tsx    # Complete Stitch Overview Dashboard
│   │   │   ├── LiveClassroomPage.tsx # Dedicated Live Digital Twin + Actuator Inspector
│   │   │   ├── DevicesPage.tsx     # Relay controls (Fans GPIO 15, 2, 16; Lights GPIO 17, 5, 18)
│   │   │   ├── SensorsPage.tsx     # DHT22 (GPIO 4), LDR (GPIO 34), PIR Cluster (GPIO 13, 12, 14)
│   │   │   ├── AnalyticsPage.tsx   # Power savings vs 1.20 kW baseline, cost (₹8.50/kWh), CO2 offset
│   │   │   ├── HistoryPage.tsx     # Chronological audit log with search & filtering
│   │   │   └── SettingsPage.tsx    # Authoritative hardware pinout & automation settings
│   │   ├── App.tsx                 # Top-level routing, WebSocket client & state store
│   │   └── index.css               # Design tokens, custom animations & typography
├── run_backend.bat                 # Launches FastAPI backend on http://127.0.0.1:8000
├── run_frontend.bat                # Launches Vite frontend on http://localhost:5173
└── run_all.bat                     # Launches both services simultaneously
```

---

## ⚡ ESP32 Hardware Pin Assignments

| Hardware Peripheral | ESP32 GPIO | Function |
| :--- | :--- | :--- |
| **Front Row PIR (Row 1)** | `GPIO 13` | Digital Motion Input (Desks 1–5) |
| **Middle Row PIR (Row 2)** | `GPIO 12` | Digital Motion Input (Desks 6–10) |
| **Rear Row PIR (Row 3)** | `GPIO 14` | Digital Motion Input (Desks 11–15) |
| **DHT22 Temperature & Humidity** | `GPIO 4` | Environmental comfort telemetry |
| **LDR Daylight Sensor** | `GPIO 34` | Ambient lux daylight harvesting threshold |
| **Fan Relay 1 (Front)** | `GPIO 15` | Active-LOW 42W Induction Load |
| **Fan Relay 2 (Middle)** | `GPIO 2` | Active-LOW 42W Induction Load |
| **Fan Relay 3 (Rear)** | `GPIO 16` | Active-LOW 42W Induction Load |
| **Light Relay 1 (Front)** | `GPIO 17` | Active-LOW 28W LED Luminaire |
| **Light Relay 2 (Middle)** | `GPIO 5` | Active-LOW 28W LED Luminaire |
| **Light Relay 3 (Rear)** | `GPIO 18` | Active-LOW 28W LED Luminaire |

---

## 🚀 How to Run the Application

### 1. Launch FastAPI Backend
```powershell
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```
### 2. Launch React Frontend
```powershell
cd frontend
npm run dev
```
run in localhost

### 3. Flash ESP32 Firmware
1. Open `firmware/esp32_smart_classroom.ino` in Arduino IDE.
2. Select Board: **ESP32 Dev Module**.
3. Set your campus Wi-Fi credentials in lines 39-40.
4. Upload to the ESP32 board.
