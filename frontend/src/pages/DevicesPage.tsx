import React from 'react';
import { Fan, Lightbulb, Power } from 'lucide-react';

interface DevicesPageProps {
  systemState: any;
  onToggleRelay: (zoneId: number, deviceType: 'fan' | 'light', newState: boolean) => Promise<void>;
  mode: string;
}

export const DevicesPage: React.FC<DevicesPageProps> = ({ systemState, onToggleRelay, mode }) => {
  const zones = systemState?.zones || {
    1: { name: 'Row 1 – Front', fan_pin: 15, fan_state: true, fan_load_w: 42, light_pin: 17, light_state: false, light_load_w: 28 },
    2: { name: 'Row 2 – Middle', fan_pin: 2, fan_state: true, fan_load_w: 42, light_pin: 5, light_state: true, light_load_w: 28 },
    3: { name: 'Row 3 – Rear', fan_pin: 16, fan_state: true, fan_load_w: 42, light_pin: 18, light_state: true, light_load_w: 28 }
  };

  const fanList = [
    { zoneId: 1, name: 'Ceiling Fan #1 (Front Row)', pin: zones[1]?.fan_pin || 15, state: zones[1]?.fan_state, load: zones[1]?.fan_load_w || 42 },
    { zoneId: 2, name: 'Ceiling Fan #2 (Middle Row)', pin: zones[2]?.fan_pin || 2, state: zones[2]?.fan_state, load: zones[2]?.fan_load_w || 42 },
    { zoneId: 3, name: 'Ceiling Fan #3 (Rear Row)', pin: zones[3]?.fan_pin || 16, state: zones[3]?.fan_state, load: zones[3]?.fan_load_w || 42 }
  ];

  const lightList = [
    { zoneId: 1, name: 'LED Array #1 (Front Row)', pin: zones[1]?.light_pin || 17, state: zones[1]?.light_state, load: zones[1]?.light_load_w || 28, note: 'Solar harvesting managed' },
    { zoneId: 2, name: 'LED Array #2 (Middle Row)', pin: zones[2]?.light_pin || 5, state: zones[2]?.light_state, load: zones[2]?.light_load_w || 28, note: 'PIR motion triggered' },
    { zoneId: 3, name: 'LED Array #3 (Rear Row)', pin: zones[3]?.light_pin || 18, state: zones[3]?.light_state, load: zones[3]?.light_load_w || 28, note: 'Pending timeout dim' }
  ];

  const totalLoad = Object.values(zones).reduce(
    (acc: number, z: any) => acc + (z.fan_state ? z.fan_load_w : 0) + (z.light_state ? z.light_load_w : 0),
    12.0
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Devices &amp; Relay Actuators</h2>
          <p className="text-xs text-gray-500 mt-1">
            6 Optocoupled Relays connected directly to ESP32-WROOM GPIO Pins
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-teal-50 border border-teal-200/80 rounded-2xl px-4 py-2 text-right">
            <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">Current Load</span>
            <span className="text-lg font-bold text-teal-900 font-mono">{totalLoad.toFixed(1)} W</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 text-right">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Operating Mode</span>
            <span className="text-sm font-bold text-slate-800">{mode}</span>
          </div>
        </div>
      </div>

      {/* Ceiling Fan Cluster */}
      <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
        <div className="flex items-center gap-3 mb-5 pb-3 border-b border-gray-100">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Fan className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Ceiling Fans (42W Induction Load)</h3>
            <p className="text-xs text-gray-400">GPIO 15, GPIO 2, GPIO 16 via 5V Relay Channels</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {fanList.map((f) => (
            <div
              key={f.zoneId}
              className={`p-4 rounded-2xl border transition-all ${
                f.state ? 'bg-teal-50/50 border-teal-200 shadow-xs' : 'bg-slate-50 border-slate-200 opacity-80'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-900">{f.name}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    f.state ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {f.state ? 'ENERGIZED' : 'OFF'}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-mono mb-3">ESP32 Pin: GPIO {f.pin} • {f.load}W</p>
              <button
                onClick={() => onToggleRelay(f.zoneId, 'fan', !f.state)}
                className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  f.state
                    ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200'
                    : 'bg-teal-600 text-white hover:bg-teal-700 shadow-xs'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                {f.state ? 'Turn Fan OFF' : 'Turn Fan ON'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* LED Lighting Cluster */}
      <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
        <div className="flex items-center gap-3 mb-5 pb-3 border-b border-gray-100">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">LED Lighting Arrays (28W High-CRI Luminaire)</h3>
            <p className="text-xs text-gray-400">GPIO 17, GPIO 5, GPIO 18 with Ambient Daylight Compensation</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {lightList.map((l) => (
            <div
              key={l.zoneId}
              className={`p-4 rounded-2xl border transition-all ${
                l.state ? 'bg-amber-50/50 border-amber-200 shadow-xs' : 'bg-slate-50 border-slate-200 opacity-80'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-900">{l.name}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    l.state ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {l.state ? 'ILLUMINATING' : 'SAVING MODE'}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-mono mb-1">ESP32 Pin: GPIO {l.pin} • {l.load}W</p>
              <p className="text-[10px] text-gray-400 mb-3">{l.note}</p>
              <button
                onClick={() => onToggleRelay(l.zoneId, 'light', !l.state)}
                className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  l.state
                    ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200'
                    : 'bg-amber-500 text-white hover:bg-amber-600 shadow-xs'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                {l.state ? 'Turn Light OFF' : 'Turn Light ON'}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
