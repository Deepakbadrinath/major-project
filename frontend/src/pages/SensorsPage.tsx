import React from 'react';
import { Radio, Thermometer, Droplets, Sun } from 'lucide-react';

interface SensorsPageProps {
  systemState: any;
}

export const SensorsPage: React.FC<SensorsPageProps> = ({ systemState }) => {
  const sensors = systemState?.sensors || {
    temperature: 24.6,
    humidity: 58.0,
    ambient_lux: 420,
    dht_pin: 4,
    ldr_pin: 34
  };

  const zones = systemState?.zones || {
    1: { name: 'Row 1 – Front', pir_pin: 13, motion: true, state_label: 'ACTIVE' },
    2: { name: 'Row 2 – Middle', pir_pin: 12, motion: true, state_label: 'ACTIVE' },
    3: { name: 'Row 3 – Rear', pir_pin: 14, motion: false, state_label: 'EXPIRING' }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Sensors &amp; Telemetry Stream</h2>
          <p className="text-xs text-gray-500 mt-1">
            Real-time environmental, illuminance, and occupancy telemetry inputs
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          5 Active Sensing Channels
        </div>
      </div>

      {/* Environmental Sensors Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* DHT22 Temperature */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Thermometer className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
              GPIO {sensors.dht_pin || 4}
            </span>
          </div>
          <span className="text-xs font-semibold text-gray-500">Air Temperature (DHT22)</span>
          <div className="text-3xl font-extrabold text-gray-900 mt-1 font-mono">
            {sensors.temperature?.toFixed(1) || '24.6'} °C
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-gray-100">
            <span className="text-gray-400">Target Range:</span>
            <span className="text-emerald-600 font-semibold">22°C – 26°C</span>
          </div>
        </div>

        {/* DHT22 Humidity */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Droplets className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
              GPIO {sensors.dht_pin || 4}
            </span>
          </div>
          <span className="text-xs font-semibold text-gray-500">Relative Humidity (DHT22)</span>
          <div className="text-3xl font-extrabold text-gray-900 mt-1 font-mono">
            {Math.round(sensors.humidity || 58)} %
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-gray-100">
            <span className="text-gray-400">Comfort Band:</span>
            <span className="text-sky-600 font-semibold">40% – 60%</span>
          </div>
        </div>

        {/* LDR Ambient Lux */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sun className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
              GPIO {sensors.ldr_pin || 34}
            </span>
          </div>
          <span className="text-xs font-semibold text-gray-500">Daylight Sensor (LDR)</span>
          <div className="text-3xl font-extrabold text-gray-900 mt-1 font-mono">
            {sensors.ambient_lux || 420} lx
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-gray-100">
            <span className="text-gray-400">Solar Threshold:</span>
            <span className="text-amber-600 font-semibold">&gt; 400 lx (Sufficient)</span>
          </div>
        </div>
      </div>

      {/* HC-SR501 PIR Cluster */}
      <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
        <div className="flex items-center gap-3 mb-5 pb-3 border-b border-gray-100">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">HC-SR501 Passive Infrared (PIR) Cluster</h3>
            <p className="text-xs text-gray-400">Detects occupant kinetic movement across designated rows</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((zId) => {
            const z = zones[zId];
            return (
              <div
                key={zId}
                className={`p-4 rounded-2xl border transition-all ${
                  z.motion
                    ? 'bg-teal-50/60 border-teal-200'
                    : z.state_label === 'EXPIRING'
                    ? 'bg-amber-50/60 border-amber-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-900">{z.name}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      z.motion
                        ? 'bg-teal-600 text-white'
                        : z.state_label === 'EXPIRING'
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {z.motion ? 'MOTION HIGH' : z.state_label === 'EXPIRING' ? 'EXPIRING' : 'IDLE / LOW'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 font-mono">Pin: GPIO {z.pir_pin}</p>
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      z.motion ? 'bg-teal-500 animate-ping' : 'bg-slate-400'
                    }`}
                  />
                  <span className="text-gray-600 text-[11px]">
                    {z.motion
                      ? 'Student presence actively maintained'
                      : 'No recent motion — countdown active'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
