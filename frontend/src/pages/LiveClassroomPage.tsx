import React, { useState } from 'react';
import {
  Fan,
  Lightbulb,
  Sparkles,
  Sliders,
  ChevronDown,
  Sun,
  Thermometer
} from 'lucide-react';
import { Classroom3DScene } from '../components/Classroom3DScene';

interface LiveClassroomPageProps {
  systemState: any;
  selectedZone: number;
  onSelectZone: (zoneId: number) => void;
  onToggleRelay: (zoneId: number, deviceType: 'fan' | 'light', newState: boolean) => Promise<void>;
  onModeChange: (newMode: 'AUTOMATIC' | 'MANUAL') => Promise<void>;
  onTimeoutChange: (minutes: number) => Promise<void>;
}

export const LiveClassroomPage: React.FC<LiveClassroomPageProps> = ({
  systemState,
  selectedZone,
  onSelectZone,
  onToggleRelay,
  onModeChange,
  onTimeoutChange
}) => {
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [timeoutValue, setTimeoutValue] = useState<number>(
    systemState?.motion_timeout_minutes || 5.0
  );

  const zones = systemState?.zones || {
    1: { name: 'Row 1 – Front', desks: [1,2,3,4,5], motion: true, fan_pin: 15, fan_state: true, light_pin: 17, light_state: false, state_label: 'ACTIVE', expiring_countdown: 0 },
    2: { name: 'Row 2 – Middle', desks: [6,7,8,9,10], motion: true, fan_pin: 2, fan_state: true, light_pin: 5, light_state: true, state_label: 'ACTIVE', expiring_countdown: 0 },
    3: { name: 'Row 3 – Rear', desks: [11,12,13,14,15], motion: false, fan_pin: 16, fan_state: true, light_pin: 18, light_state: true, state_label: 'EXPIRING', expiring_countdown: 4 }
  };

  const currentZone = zones[selectedZone] || zones[2];
  const mode = systemState?.mode || 'AUTOMATIC';

  const handleRelayToggle = async (deviceType: 'fan' | 'light') => {
    const currentState = deviceType === 'fan' ? currentZone.fan_state : currentZone.light_state;
    const actionKey = `${selectedZone}-${deviceType}`;
    setPendingAction(actionKey);
    try {
      await onToggleRelay(selectedZone, deviceType, !currentState);
    } finally {
      setPendingAction(null);
    }
  };

  const handleTimeoutSlider = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setTimeoutValue(val);
    await onTimeoutChange(val);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-100px)] min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
      {/* Top Bar inside Live Classroom */}
      <div className="h-14 bg-white border-b border-slate-200 px-5 flex items-center justify-between flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center text-xs font-medium text-slate-500">
            <span>Smart Classroom</span>
            <span className="mx-2 text-slate-300">/</span>
            <span className="font-bold text-slate-800 text-sm">Live Digital Twin</span>
          </div>

          <div className="ml-3 flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-medium text-slate-700">
            <span>Lecture Hall LH-204</span>
            <span className="text-slate-400 text-[11px]">(Cap: 45 | Current: 18)</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Telemetry Badge */}
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>ESP32 Real-Time Telemetry (100ms)</span>
          </div>

          {/* Global Mode Switch */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => onModeChange('AUTOMATIC')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                mode === 'AUTOMATIC'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              AUTOMATIC (AI)
            </button>
            <button
              onClick={() => onModeChange('MANUAL')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                mode === 'MANUAL'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              MANUAL OVERRIDE
            </button>
          </div>
        </div>
      </div>

      {/* Main Dual-Column Content: Viewport (72%) & Right Inspector (28%) */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: 3D Digital Twin Viewport (72% Width) */}
        <main
          className="w-[72%] flex flex-col bg-slate-900 relative overflow-hidden border-r border-slate-200 select-none"
          data-purpose="isometric-twin-viewport"
        >
          {/* Background subtle Grid Dot effect */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(#38bdf8 1px, transparent 1px), radial-gradient(#0d9488 1px, #0f172a 1px)',
              backgroundSize: '40px 40px',
              backgroundPosition: '0 0, 20px 20px'
            }}
          />

          {/* 3D Scene Interactive Viewport */}
          <div className="flex-1 w-full h-full relative overflow-hidden">
            <Classroom3DScene
              zones={zones}
              selectedZone={selectedZone}
              onSelectZone={onSelectZone}
              isCompact={false}
            />
          </div>

          {/* Floating Sensor Telemetry HUD (Bottom of Viewport) */}
          <footer
            className="h-14 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-6 flex items-center justify-between text-xs text-slate-300 z-10 shrink-0"
            data-purpose="telemetry-hud"
          >
            {/* DHT22 Sensor Live Telemetry */}
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-teal-900/60 text-teal-400 border border-teal-700/50">
                <Thermometer className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-white">
                  DHT22: {systemState?.sensors?.temperature?.toFixed(1) || '24.6'}°C | {Math.round(systemState?.sensors?.humidity || 58)}% RH
                </span>
                <span className="text-[11px] text-slate-400 ml-1 font-mono">(GPIO 4)</span>
              </div>
            </div>

            <div className="h-4 w-px bg-slate-800" />

            {/* LDR Light Sensor Telemetry */}
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-900/40 text-amber-400 border border-amber-700/50">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-white">
                  LDR Ambient: {systemState?.sensors?.ambient_lux || 420} lx
                </span>
                <span className="text-[11px] text-teal-400 ml-1">
                  {systemState?.sensors?.ambient_lux >= 400
                    ? 'Natural Daylight Harvesting Active in Front Row'
                    : 'Low Ambient Light • Artificial Lighting Active'}
                </span>
                <span className="text-[11px] text-slate-400 ml-1 font-mono">(GPIO 34)</span>
              </div>
            </div>

            <div className="h-4 w-px bg-slate-800" />

            {/* PIR Sensor Summary */}
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500" />
              </span>
              <div>
                <span className="font-semibold text-white">PIR Cluster:</span>
                <span className="text-teal-300 font-medium ml-1">2 Active</span>
                <span className="text-slate-400">, 1 Pending Timeout</span>
              </div>
            </div>
          </footer>
        </main>

        {/* RIGHT: Interactive Control & Telemetry Panel (28% Width) */}
        <aside
          className="w-[28%] bg-white flex flex-col overflow-y-auto border-l border-slate-200"
          data-purpose="actuator-inspector-panel"
        >
          <div className="p-5 space-y-5">
            {/* Selected Zone Inspector Header Card */}
            <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-100 shadow-xs" data-purpose="zone-inspector-card">
              <div className="flex items-center justify-between pb-3 border-b border-teal-100/80">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded">
                    Selected Zone
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    {currentZone.name} (Desks {currentZone.desks?.[0]}–{currentZone.desks?.[currentZone.desks.length - 1]})
                  </h3>
                </div>
                <span
                  className={`px-2.5 py-1 text-xs font-bold rounded-full text-white flex items-center gap-1 shadow-xs ${
                    currentZone.state_label === 'EXPIRING'
                      ? 'bg-amber-500'
                      : currentZone.state_label === 'INACTIVE'
                      ? 'bg-slate-500'
                      : 'bg-teal-600'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  {currentZone.state_label || 'ACTIVE'}
                </span>
              </div>

              {/* Motion State & PIR Sensor Details */}
              <div className="mt-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-medium">Motion Detection:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded ${
                      currentZone.motion
                        ? 'text-teal-700 bg-teal-100/60'
                        : currentZone.state_label === 'EXPIRING'
                        ? 'text-amber-700 bg-amber-100/60'
                        : 'text-slate-600 bg-slate-100'
                    }`}
                  >
                    {currentZone.motion
                      ? 'MOTION DETECTED (Active)'
                      : currentZone.state_label === 'EXPIRING'
                      ? `EXPIRING (${currentZone.expiring_countdown}s left)`
                      : 'NO RECENT MOTION'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-medium">PIR Sensor:</span>
                  <span className="font-mono text-slate-800">
                    HC-SR501 @ GPIO {currentZone.pir_pin || (selectedZone === 1 ? 13 : selectedZone === 2 ? 12 : 14)} [
                    {currentZone.motion ? 'HIGH' : 'LOW'}]
                  </span>
                </div>
              </div>
            </div>

            {/* Granular Relay Actuator Controls for the Zone */}
            <section className="space-y-3" data-purpose="relay-controls">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Zone Actuator Relays
                </h4>
                {mode === 'AUTOMATIC' && (
                  <span className="text-[10px] text-teal-600 bg-teal-50 px-2 py-0.5 rounded font-semibold border border-teal-100">
                    Auto-Managed
                  </span>
                )}
              </div>

              {/* Ceiling Fan Relay Control */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        currentZone.fan_state ? 'bg-teal-50 text-teal-600' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <Fan className={`w-4 h-4 ${currentZone.fan_state ? 'animate-spin-fast' : ''}`} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Ceiling Fan Relay</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        ESP32 GPIO {currentZone.fan_pin || 2} • 42W Load
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentZone.fan_state}
                      disabled={pendingAction === `${selectedZone}-fan`}
                      onChange={() => handleRelayToggle('fan')}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600" />
                  </label>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  <span>Speed: Auto Level 3 (Adaptive)</span>
                  <span className={`font-bold ${currentZone.fan_state ? 'text-teal-700' : 'text-slate-400'}`}>
                    {currentZone.fan_state ? 'Relay CLOSED' : 'Relay OPEN'}
                  </span>
                </div>
              </div>

              {/* LED Light Relay Control */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        currentZone.light_state ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <Lightbulb className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">LED Array Array</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        ESP32 GPIO {currentZone.light_pin || 5} • 28W Load
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentZone.light_state}
                      disabled={pendingAction === `${selectedZone}-light`}
                      onChange={() => handleRelayToggle('light')}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600" />
                  </label>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  <span>Intensity: {currentZone.light_state ? '80% (PWM active)' : '0% (Daylight Saving)'}</span>
                  <span className={`font-bold ${currentZone.light_state ? 'text-teal-700' : 'text-slate-400'}`}>
                    {currentZone.light_state ? 'Relay CLOSED' : 'Relay OPEN'}
                  </span>
                </div>
              </div>

              {/* Motion Timeout Config Slider */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-slate-700">Motion Auto-Off Timeout:</span>
                  <span className="font-bold text-teal-700 font-mono">{timeoutValue.toFixed(1)} min</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  step="0.5"
                  value={timeoutValue}
                  onChange={handleTimeoutSlider}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>1 min (Aggressive)</span>
                  <span>15 min (Relaxed)</span>
                </div>
              </div>
            </section>

            {/* Environmental Sensors (Indoor Comfort) */}
            <section className="space-y-3" data-purpose="environmental-sensors">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Environmental Sensors (Indoor Comfort)
              </h4>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-medium">Temperature</span>
                  <div className="text-lg font-bold text-slate-800 mt-0.5 font-mono">
                    {systemState?.sensors?.temperature?.toFixed(1) || '24.6'} °C
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold">Optimal Range</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-medium">Relative Humidity</span>
                  <div className="text-lg font-bold text-slate-800 mt-0.5 font-mono">
                    {Math.round(systemState?.sensors?.humidity || 58)} %
                  </div>
                  <span className="text-[10px] text-teal-600 font-semibold">Comfortable</span>
                </div>
              </div>

              {/* Daylight Harvesting Threshold Card */}
              <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/80 text-xs">
                <div className="flex items-center justify-between text-amber-900 font-bold mb-1">
                  <span className="flex items-center gap-1">
                    <Sun className="w-3.5 h-3.5 text-amber-600" />
                    Daylight Harvesting Threshold:
                  </span>
                  <span className="font-mono text-amber-800">400 Lux</span>
                </div>
                <p className="text-[11px] text-amber-800/80 leading-relaxed">
                  When outdoor daylight exceeds 400 lx, front-row LED relays automatically open to conserve grid energy.
                </p>
              </div>
            </section>
          </div>
        </aside>
      </div>
    </div>
  );
};
