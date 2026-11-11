import { useState, useEffect, useCallback } from 'react';
import { Sidebar, type NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewPage } from './pages/OverviewPage';
import { LiveClassroomPage } from './pages/LiveClassroomPage';
import { DevicesPage } from './pages/DevicesPage';
import { SensorsPage } from './pages/SensorsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [selectedZone, setSelectedZone] = useState<number>(2);
  const [systemState, setSystemState] = useState<any>({
    mode: 'AUTOMATIC',
    esp32_connected: true,
    wifi_rssi: -62,
    firmware_version: 'v1.0.0',
    motion_timeout_minutes: 5.0,
    daylight_threshold_lux: 400,
    sensors: {
      temperature: 24.6,
      humidity: 58.0,
      ambient_lux: 420,
      dht_pin: 4,
      ldr_pin: 34
    },
    zones: {
      1: {
        name: 'Row 1 – Front',
        desks: [1, 2, 3, 4, 5],
        occupied_desks: [1, 2, 3, 4],
        pir_pin: 13,
        motion: true,
        fan_pin: 15,
        fan_state: true,
        fan_load_w: 42.0,
        light_pin: 17,
        light_state: false,
        light_load_w: 28.0,
        state_label: 'ACTIVE',
        expiring_countdown: 0
      },
      2: {
        name: 'Row 2 – Middle',
        desks: [6, 7, 8, 9, 10],
        occupied_desks: [6, 7, 8, 9, 10],
        pir_pin: 12,
        motion: true,
        fan_pin: 2,
        fan_state: true,
        fan_load_w: 42.0,
        light_pin: 5,
        light_state: true,
        light_load_w: 28.0,
        state_label: 'ACTIVE',
        expiring_countdown: 0
      },
      3: {
        name: 'Row 3 – Rear',
        desks: [11, 12, 13, 14, 15],
        occupied_desks: [11, 12, 13, 14],
        pir_pin: 14,
        motion: false,
        fan_pin: 16,
        fan_state: true,
        fan_load_w: 42.0,
        light_pin: 18,
        light_state: true,
        light_load_w: 28.0,
        state_label: 'EXPIRING',
        expiring_countdown: 4
      }
    },
    energy: {
      current_power_w: 222.0,
      baseline_power_w: 1200.0,
      savings_pct: 18.4,
      estimated_savings_kwh: 3.42,
      estimated_savings_inr: 29.07,
      tariff_per_kwh: 8.50
    },
    recent_activities: [
      { time: '09:24:10 AM', type: 'motion', msg: 'Motion detected in Row 2', status: 'active' },
      { time: '09:24:05 AM', type: 'fan', msg: 'Fan 2 turned ON', status: 'active' },
      { time: '09:23:59 AM', type: 'light', msg: 'Light 3 set to Auto Mode', status: 'pending' },
      { time: '09:22:15 AM', type: 'solar', msg: 'Solar Lux > 400: Front Row lights OFF', status: 'saving' },
      { time: '09:20:00 AM', type: 'system', msg: 'ESP32 Node-LH204 synchronized with backend', status: 'connected' }
    ]
  });

  // Fetch initial state from backend
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setSystemState((prev: any) => ({
          ...prev,
          ...data
        }));
      }
    } catch {
      // Offline fallback: systemState already has defaults
    }
  }, []);

  useEffect(() => {
    fetchStatus();

    // Connect WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/telemetry`;
    let ws: WebSocket | null = null;
    let pollInterval: any = null;

    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'telemetry_update') {
            setSystemState((prev: any) => ({
              ...prev,
              mode: msg.mode ?? prev.mode,
              esp32_connected: msg.esp32_connected ?? prev.esp32_connected,
              wifi_rssi: msg.wifi_rssi ?? prev.wifi_rssi,
              sensors: msg.sensors ?? prev.sensors,
              zones: msg.zones ?? prev.zones,
              energy: msg.energy ?? prev.energy
            }));
          }
        } catch {}
      };
      ws.onerror = () => {
        // Fallback to polling every 3s
        pollInterval = setInterval(fetchStatus, 3000);
      };
    } catch {
      pollInterval = setInterval(fetchStatus, 3000);
    }

    return () => {
      if (ws) ws.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [fetchStatus]);

  // Mode Toggle Handler
  const handleModeToggle = async () => {
    const nextMode = systemState.mode === 'AUTOMATIC' ? 'MANUAL' : 'AUTOMATIC';
    setSystemState((prev: any) => ({ ...prev, mode: nextMode }));
    try {
      await fetch('/api/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: nextMode })
      });
    } catch {}
  };

  const handleModeChange = async (newMode: 'AUTOMATIC' | 'MANUAL') => {
    setSystemState((prev: any) => ({ ...prev, mode: newMode }));
    try {
      await fetch('/api/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newMode })
      });
    } catch {}
  };

  // Relay Toggle Handler
  const handleToggleRelay = async (zoneId: number, deviceType: 'fan' | 'light', newState: boolean) => {
    // Optimistic update
    setSystemState((prev: any) => {
      const z = prev.zones[zoneId];
      if (!z) return prev;
      return {
        ...prev,
        zones: {
          ...prev.zones,
          [zoneId]: {
            ...z,
            [deviceType === 'fan' ? 'fan_state' : 'light_state']: newState
          }
        }
      };
    });

    try {
      await fetch('/api/relays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zone_id: zoneId,
          device_type: deviceType,
          state: newState
        })
      });
      fetchStatus();
    } catch {}
  };

  // Timeout Slider Handler
  const handleTimeoutChange = async (minutes: number) => {
    setSystemState((prev: any) => ({ ...prev, motion_timeout_minutes: minutes }));
    try {
      await fetch('/api/timeout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutes })
      });
    } catch {}
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F6F8FB] text-[#172033]">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        esp32Connected={systemState.esp32_connected}
        firmwareVersion={systemState.firmware_version}
      />

      {/* Main Body View */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
          {/* Top Header */}
          <Header
            activeTab={activeTab}
            mode={systemState.mode}
            onModeToggle={handleModeToggle}
            esp32Connected={systemState.esp32_connected}
            recentActivities={systemState.recent_activities}
            onNavigateTab={setActiveTab}
            firmwareVersion={systemState.firmware_version}
          />

          {/* Page Routing Switch */}
          {activeTab === 'overview' && (
            <OverviewPage
              systemState={systemState}
              onSelectZone={(zId) => {
                setSelectedZone(zId);
                setActiveTab('live_classroom');
              }}
              onNavigateToLive={() => setActiveTab('live_classroom')}
            />
          )}

          {activeTab === 'live_classroom' && (
            <LiveClassroomPage
              systemState={systemState}
              selectedZone={selectedZone}
              onSelectZone={setSelectedZone}
              onToggleRelay={handleToggleRelay}
              onModeChange={handleModeChange}
              onTimeoutChange={handleTimeoutChange}
            />
          )}

          {activeTab === 'devices' && (
            <DevicesPage
              systemState={systemState}
              onToggleRelay={handleToggleRelay}
              mode={systemState.mode}
            />
          )}

          {activeTab === 'sensors' && (
            <SensorsPage systemState={systemState} />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsPage systemState={systemState} />
          )}

          {activeTab === 'history' && (
            <HistoryPage systemState={systemState} />
          )}

          {activeTab === 'settings' && (
            <SettingsPage
              systemState={systemState}
              onTimeoutChange={handleTimeoutChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
