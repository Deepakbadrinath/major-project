"""
Smart Classroom of Kishkinda University
Backend API & Telemetry Server (FastAPI + WebSockets)
IoT-Based Smart Classroom Energy Monitoring and Automatic Control System
"""

import asyncio
import datetime
import json
import logging
import math
import random
import time
from typing import Dict, List, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SmartClassroom")

app = FastAPI(
    title="Smart Classroom of Kishkinda University API",
    description="IoT Energy Monitoring and Automated Actuator Control System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Hardware GPIO Pin Configuration matching ESP32 firmware
GPIO_MAP = {
    "pir_front": 13,
    "pir_middle": 12,
    "pir_rear": 14,
    "dht22": 4,
    "ldr": 34,
    "fan_row1": 15,
    "fan_row2": 2,
    "fan_row3": 16,
    "light_row1": 17,
    "light_row2": 5,
    "light_row3": 18
}

# State Store
class SystemState:
    def __init__(self):
        self.mode: str = "AUTOMATIC"  # "AUTOMATIC" or "MANUAL"
        self.motion_timeout_minutes: float = 5.0
        self.daylight_threshold_lux: int = 400
        self.esp32_connected: bool = True
        self.last_hardware_ping: float = time.time()
        self.firmware_version: str = "v2.4.1-node-LH204"
        self.wifi_rssi: int = -62
        
        # Environmental Sensors
        self.temperature: float = 24.6
        self.humidity: float = 58.0
        self.ambient_lux: int = 420
        
        # Zone States: 1 (Front: desks 1-5), 2 (Middle: desks 6-10), 3 (Rear: desks 11-15)
        self.zones = {
            1: {
                "name": "Row 1 – Front",
                "desks": [1, 2, 3, 4, 5],
                "occupied_desks": [1, 2, 3, 4],
                "pir_pin": 13,
                "motion": True,
                "last_motion_ts": time.time() - 60,
                "fan_pin": 15,
                "fan_state": True,
                "fan_load_w": 42.0,
                "light_pin": 17,
                "light_state": False, # Solar daylight harvesting
                "light_load_w": 28.0,
                "state_label": "ACTIVE",
                "expiring_countdown": 0
            },
            2: {
                "name": "Row 2 – Middle",
                "desks": [6, 7, 8, 9, 10],
                "occupied_desks": [6, 7, 8, 9, 10],
                "pir_pin": 12,
                "motion": True,
                "last_motion_ts": time.time() - 30,
                "fan_pin": 2,
                "fan_state": True,
                "fan_load_w": 42.0,
                "light_pin": 5,
                "light_state": True,
                "light_load_w": 28.0,
                "state_label": "ACTIVE",
                "expiring_countdown": 0
            },
            3: {
                "name": "Row 3 – Rear",
                "desks": [11, 12, 13, 14, 15],
                "occupied_desks": [11, 12, 13, 14],
                "pir_pin": 14,
                "motion": False,
                "last_motion_ts": time.time() - 296,
                "fan_pin": 16,
                "fan_state": True,
                "fan_load_w": 42.0,
                "light_pin": 18,
                "light_state": True,
                "light_load_w": 28.0,
                "state_label": "EXPIRING",
                "expiring_countdown": 4 # 4 seconds left
            }
        }
        
        # Energy Metrics
        self.unmanaged_baseline_kw: float = 1.20
        self.tariff_per_kwh: float = 8.50 # INR
        self.recent_activities = [
            {"time": "09:24:10 AM", "type": "motion", "msg": "Motion detected in Row 2", "status": "active"},
            {"time": "09:24:05 AM", "type": "fan", "msg": "Fan 2 turned ON", "status": "active"},
            {"time": "09:23:59 AM", "type": "light", "msg": "Light 3 set to Auto Mode", "status": "pending"},
            {"time": "09:22:15 AM", "type": "solar", "msg": "Solar Lux > 400: Front Row lights OFF", "status": "saving"},
            {"time": "09:20:00 AM", "type": "system", "msg": "ESP32 Node-LH204 synchronized", "status": "connected"}
        ]

state = SystemState()

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()

# Background Simulation Task
async def simulation_loop():
    """Simulates realistic sensor drift, occupancy changes and relay automation when hardware is not overriding."""
    while True:
        try:
            now = time.time()
            
            # Subtle environmental drift
            state.temperature = round(24.4 + 0.3 * math.sin(now / 40.0) + random.uniform(-0.05, 0.05), 1)
            state.humidity = round(57.5 + 1.2 * math.cos(now / 50.0), 1)
            state.ambient_lux = int(410 + 20 * math.sin(now / 30.0))
            
            # Handle automatic timeout logic for Row 3 expiration demo
            if state.mode == "AUTOMATIC":
                for z_id, zone in state.zones.items():
                    elapsed = now - zone["last_motion_ts"]
                    timeout_sec = state.motion_timeout_minutes * 60
                    
                    if zone["motion"]:
                        zone["state_label"] = "ACTIVE"
                        zone["expiring_countdown"] = 0
                        zone["fan_state"] = True
                        # Daylight harvesting
                        if state.ambient_lux >= state.daylight_threshold_lux and z_id == 1:
                            zone["light_state"] = False
                        else:
                            zone["light_state"] = True
                    else:
                        remaining = max(0, int(timeout_sec - elapsed))
                        zone["expiring_countdown"] = remaining
                        if remaining <= 15 and remaining > 0:
                            zone["state_label"] = "EXPIRING"
                        elif remaining == 0:
                            zone["state_label"] = "INACTIVE"
                            zone["fan_state"] = False
                            zone["light_state"] = False
                        else:
                            zone["state_label"] = "ACTIVE"
                            
            # Calculate instantaneous power
            active_power_w = 0.0
            for z in state.zones.values():
                if z["fan_state"]:
                    active_power_w += z["fan_load_w"]
                if z["light_state"]:
                    active_power_w += z["light_load_w"]
            # Add base electronics load (ESP32 + display + sensors ~ 12W)
            current_power_w = round(active_power_w + 12.0, 1)
            
            # Calculate savings
            baseline_w = state.unmanaged_baseline_kw * 1000.0
            savings_pct = round(((baseline_w - current_power_w) / baseline_w) * 100.0, 1)
            
            telemetry_payload = {
                "type": "telemetry_update",
                "timestamp": datetime.datetime.now().strftime("%I:%M:%S %p"),
                "mode": state.mode,
                "esp32_connected": state.esp32_connected,
                "wifi_rssi": state.wifi_rssi,
                "firmware_version": state.firmware_version,
                "motion_timeout_minutes": state.motion_timeout_minutes,
                "daylight_threshold_lux": state.daylight_threshold_lux,
                "sensors": {
                    "temperature": state.temperature,
                    "humidity": state.humidity,
                    "ambient_lux": state.ambient_lux,
                    "dht_pin": GPIO_MAP["dht22"],
                    "ldr_pin": GPIO_MAP["ldr"]
                },
                "zones": state.zones,
                "energy": {
                    "current_power_w": current_power_w,
                    "baseline_power_w": baseline_w,
                    "savings_pct": savings_pct,
                    "estimated_savings_kwh": 3.42,
                    "estimated_savings_inr": 29.07,
                    "tariff_per_kwh": state.tariff_per_kwh
                }
            }
            
            await manager.broadcast(telemetry_payload)
        except Exception as e:
            logger.error(f"Error in simulation loop: {e}")
            
        await asyncio.sleep(2.0)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(simulation_loop())

# REST API Models
class RelayToggleRequest(BaseModel):
    zone_id: int
    device_type: str  # "fan" or "light"
    state: bool

class ModeChangeRequest(BaseModel):
    mode: str  # "AUTOMATIC" or "MANUAL"

class TimeoutChangeRequest(BaseModel):
    minutes: float

class ESP32TelemetryRequest(BaseModel):
    temperature: float
    humidity: float
    ldr_lux: int
    pir_front: bool
    pir_middle: bool
    pir_rear: bool

# Endpoints
@app.get("/api/status")
async def get_status():
    """Return complete system state for initial dashboard hydration."""
    active_power_w = sum(
        (z["fan_load_w"] if z["fan_state"] else 0) + (z["light_load_w"] if z["light_state"] else 0)
        for z in state.zones.values()
    ) + 12.0
    baseline_w = state.unmanaged_baseline_kw * 1000.0
    savings_pct = round(((baseline_w - active_power_w) / baseline_w) * 100.0, 1)

    return {
        "mode": state.mode,
        "esp32_connected": state.esp32_connected,
        "wifi_rssi": state.wifi_rssi,
        "firmware_version": state.firmware_version,
        "gpio_config": GPIO_MAP,
        "motion_timeout_minutes": state.motion_timeout_minutes,
        "daylight_threshold_lux": state.daylight_threshold_lux,
        "sensors": {
            "temperature": state.temperature,
            "humidity": state.humidity,
            "ambient_lux": state.ambient_lux,
            "dht_pin": GPIO_MAP["dht22"],
            "ldr_pin": GPIO_MAP["ldr"]
        },
        "zones": state.zones,
        "energy": {
            "current_power_w": active_power_w,
            "baseline_power_w": baseline_w,
            "savings_pct": savings_pct,
            "estimated_savings_kwh": 3.42,
            "estimated_savings_inr": 29.07,
            "tariff_per_kwh": state.tariff_per_kwh
        },
        "recent_activities": state.recent_activities
    }

@app.post("/api/mode")
async def set_operating_mode(req: ModeChangeRequest):
    """Switch between AUTOMATIC and MANUAL mode."""
    if req.mode not in ["AUTOMATIC", "MANUAL"]:
        raise HTTPException(status_code=400, detail="Mode must be AUTOMATIC or MANUAL")
    state.mode = req.mode
    
    activity = {
        "time": datetime.datetime.now().strftime("%I:%M:%S %p"),
        "type": "mode",
        "msg": f"System switched to {req.mode} mode",
        "status": "active"
    }
    state.recent_activities.insert(0, activity)
    if len(state.recent_activities) > 10:
        state.recent_activities.pop()
        
    return {"status": "success", "mode": state.mode}

@app.post("/api/relays")
async def toggle_relay(req: RelayToggleRequest):
    """Manual relay actuation control."""
    if req.zone_id not in state.zones:
        raise HTTPException(status_code=404, detail="Zone not found")
        
    zone = state.zones[req.zone_id]
    if req.device_type == "fan":
        zone["fan_state"] = req.state
        dev_label = f"Fan (Row {req.zone_id}, GPIO {zone['fan_pin']})"
    elif req.device_type == "light":
        zone["light_state"] = req.state
        dev_label = f"Light (Row {req.zone_id}, GPIO {zone['light_pin']})"
    else:
        raise HTTPException(status_code=400, detail="device_type must be 'fan' or 'light'")
        
    action_label = "turned ON" if req.state else "turned OFF"
    activity = {
        "time": datetime.datetime.now().strftime("%I:%M:%S %p"),
        "type": req.device_type,
        "msg": f"{dev_label} {action_label}",
        "status": "active" if req.state else "inactive"
    }
    state.recent_activities.insert(0, activity)
    if len(state.recent_activities) > 10:
        state.recent_activities.pop()
        
    return {
        "status": "success",
        "zone_id": req.zone_id,
        "device_type": req.device_type,
        "state": req.state,
        "relay_pin": zone["fan_pin"] if req.device_type == "fan" else zone["light_pin"]
    }

@app.post("/api/timeout")
async def set_motion_timeout(req: TimeoutChangeRequest):
    """Configure motion auto-off timeout duration in minutes."""
    if req.minutes < 0.5 or req.minutes > 30.0:
        raise HTTPException(status_code=400, detail="Timeout must be between 0.5 and 30 minutes")
    state.motion_timeout_minutes = req.minutes
    return {"status": "success", "motion_timeout_minutes": state.motion_timeout_minutes}

@app.post("/api/telemetry")
async def receive_hardware_telemetry(data: ESP32TelemetryRequest):
    """Endpoint called by the physical ESP32 to push real sensor measurements."""
    state.esp32_connected = True
    state.last_hardware_ping = time.time()
    state.temperature = data.temperature
    state.humidity = data.humidity
    state.ambient_lux = data.ldr_lux
    
    # Update PIR statuses
    pir_map = {1: data.pir_front, 2: data.pir_middle, 3: data.pir_rear}
    for z_id, detected in pir_map.items():
        if detected:
            state.zones[z_id]["motion"] = True
            state.zones[z_id]["last_motion_ts"] = time.time()
        else:
            state.zones[z_id]["motion"] = False
            
    return {"status": "acknowledged", "mode": state.mode}

@app.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    """Real-time streaming telemetry channel for frontend dashboard."""
    await manager.connect(websocket)
    try:
        while True:
            # Keep-alive receive
            data = await websocket.receive_text()
            try:
                cmd = json.loads(data)
                if cmd.get("action") == "ping":
                    await websocket.send_json({"type": "pong"})
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
