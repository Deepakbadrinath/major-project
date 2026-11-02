import React, { useState } from 'react';
import { Cpu, Award, Check } from 'lucide-react';

interface SettingsPageProps {
  systemState: any;
  onTimeoutChange: (minutes: number) => Promise<void>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ systemState, onTimeoutChange }) => {
  const [timeout, setTimeoutVal] = useState(systemState?.motion_timeout_minutes || 5.0);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSaveTimeout = async () => {
    await onTimeoutChange(timeout);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const gpioAssignments = [
    { peripheral: 'Front Row PIR (Row 1)', pin: 'GPIO 13', type: 'Digital Input', function: 'Motion detection for desks 1–5' },
    { peripheral: 'Middle Row PIR (Row 2)', pin: 'GPIO 12', type: 'Digital Input', function: 'Motion detection for desks 6–10' },
    { peripheral: 'Rear Row PIR (Row 3)', pin: 'GPIO 14', type: 'Digital Input', function: 'Motion detection for desks 11–15' },
    { peripheral: 'DHT22 Sensor', pin: 'GPIO 4', type: 'Digital Bidirectional', function: 'Indoor Temperature & Relative Humidity' },
    { peripheral: 'LDR Daylight Sensor', pin: 'GPIO 34', type: 'Analog Input (ADC1_CH6)', function: 'Ambient Solar Lux Measurement' },
    { peripheral: 'Fan Relay 1 (Front)', pin: 'GPIO 15', type: 'Digital Output (Active LOW)', function: 'Ceiling Fan Row 1 (42W)' },
    { peripheral: 'Fan Relay 2 (Middle)', pin: 'GPIO 2', type: 'Digital Output (Active LOW)', function: 'Ceiling Fan Row 2 (42W)' },
    { peripheral: 'Fan Relay 3 (Rear)', pin: 'GPIO 16', type: 'Digital Output (Active LOW)', function: 'Ceiling Fan Row 3 (42W)' },
    { peripheral: 'Light Relay 1 (Front)', pin: 'GPIO 17', type: 'Digital Output (Active LOW)', function: 'LED Array Row 1 (28W)' },
    { peripheral: 'Light Relay 2 (Middle)', pin: 'GPIO 5', type: 'Digital Output (Active LOW)', function: 'LED Array Row 2 (28W)' },
    { peripheral: 'Light Relay 3 (Rear)', pin: 'GPIO 18', type: 'Digital Output (Active LOW)', function: 'LED Array Row 3 (28W)' }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">System Configuration &amp; Hardware Pinouts</h2>
          <p className="text-xs text-gray-500 mt-1">
            ESP32 micro-controller mappings, timeouts, and university project specifications
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-xs font-bold text-teal-800">
          <Cpu className="w-4 h-4 text-teal-600" />
          ESP32-WROOM-32 Pinout Confirmed
        </div>
      </div>

      {/* Hardware Pin Assignments Table */}
      <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
        <h3 className="text-base font-bold text-gray-900 mb-1">Authoritative ESP32 GPIO Pin Assignments</h3>
        <p className="text-xs text-gray-500 mb-5">
          Configured in accordance with the university physical breadboard and relay module wiring.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-400 uppercase font-bold text-[10px] tracking-wider">
                <th className="pb-3 px-2">Hardware Peripheral</th>
                <th className="pb-3 px-2">GPIO Pin</th>
                <th className="pb-3 px-2">Signal Type</th>
                <th className="pb-3 px-2">System Function</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {gpioAssignments.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50/70 transition">
                  <td className="py-3 px-2 font-semibold text-gray-900">{row.peripheral}</td>
                  <td className="py-3 px-2">
                    <span className="font-mono bg-slate-100 text-teal-700 font-bold px-2 py-0.5 rounded border border-slate-200">
                      {row.pin}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-gray-600">{row.type}</td>
                  <td className="py-3 px-2 text-gray-500">{row.function}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Automation Parameters */}
      <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
        <h3 className="text-base font-bold text-gray-900 mb-4">Automation Parameters</h3>

        <div className="max-w-md space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Motion Auto-Off Timeout (Minutes)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0.5"
                max="30"
                step="0.5"
                value={timeout}
                onChange={(e) => setTimeoutVal(parseFloat(e.target.value))}
                className="w-32 px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-800 focus:outline-none focus:border-teal-500"
              />
              <button
                onClick={handleSaveTimeout}
                className="px-4 py-1.5 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {savedNotice ? <Check className="w-3.5 h-3.5" /> : null}
                {savedNotice ? 'Saved!' : 'Update Timeout'}
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Duration without motion before relays automatically open to conserve power.
            </p>
          </div>
        </div>
      </section>

      {/* Project Credits Card */}
      <section className="bg-gradient-to-br from-teal-900 to-slate-900 text-white p-6 rounded-3xl shadow-md">
        <div className="flex items-center gap-3 mb-3">
          <Award className="w-6 h-6 text-amber-400" />
          <h3 className="text-base font-bold text-white">Project Identity</h3>
        </div>
        <p className="text-sm font-semibold text-teal-200">Smart Classroom of Kishkinda University</p>
        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
          IoT-Based Smart Classroom Energy Monitoring and Automatic Control System — Final-Year CSE Project.
        </p>
        <div className="mt-4 pt-3 border-t border-slate-700/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
          <span>Kishkinda University • Department of Computer Science &amp; Engineering</span>
          <span className="font-mono text-teal-300">ESP32 Firmware: v2.4.1-node-LH204</span>
        </div>
      </section>
    </div>
  );
};
