import React, { useState } from 'react';
import { TrendingUp, Zap, Leaf, IndianRupee, Info } from 'lucide-react';

interface AnalyticsPageProps {
  systemState: any;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ systemState }) => {
  const [selectedSpan, setSelectedSpan] = useState<'today' | 'week' | 'month'>('today');

  const energy = systemState?.energy || {
    current_power_w: 222.0,
    baseline_power_w: 1200.0,
    savings_pct: 18.4,
    estimated_savings_kwh: 3.42,
    estimated_savings_inr: 29.07,
    tariff_per_kwh: 8.50
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Energy &amp; Savings Analytics</h2>
          <p className="text-xs text-gray-500 mt-1">
            Kishkinda University Campus Energy Optimization Model • Lecture Hall LH-204
          </p>
        </div>
        <div className="inline-flex p-1 bg-gray-100 rounded-2xl text-xs font-semibold">
          {(['today', 'week', 'month'] as const).map((span) => (
            <button
              key={span}
              onClick={() => setSelectedSpan(span)}
              className={`px-3 py-1.5 rounded-xl capitalize transition cursor-pointer ${
                selectedSpan === span ? 'bg-teal-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {span}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-3">
            <Zap className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium text-gray-500">Smart Power Load</span>
          <div className="text-2xl font-bold text-gray-900 mt-1 font-mono">
            {energy.current_power_w?.toFixed(1) || '222.0'} W
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            ▼ 84.5% vs unmanaged
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <Leaf className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium text-gray-500">Energy Conserved</span>
          <div className="text-2xl font-bold text-gray-900 mt-1 font-mono">
            {energy.estimated_savings_kwh || '3.42'} kWh
          </div>
          <span className="text-[11px] text-teal-600 font-semibold mt-1 block">
            ~2.8 kg CO₂ Offset
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
            <IndianRupee className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium text-gray-500">Financial Savings</span>
          <div className="text-2xl font-bold text-gray-900 mt-1 font-mono">
            ₹{energy.estimated_savings_inr?.toFixed(2) || '29.07'}
          </div>
          <span className="text-[11px] text-gray-400 mt-1 block">
            @ ₹{energy.tariff_per_kwh?.toFixed(2) || '8.50'}/kWh
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium text-gray-500">Overall Efficiency</span>
          <div className="text-2xl font-bold text-gray-900 mt-1 font-mono">
            {energy.savings_pct || '18.4'}%
          </div>
          <span className="text-[11px] text-indigo-600 font-semibold mt-1 block">
            Benchmark Achieved
          </span>
        </div>
      </div>

      {/* Comparison Analysis */}
      <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
        <h3 className="text-base font-bold text-gray-900 mb-2">Automated Control Impact Analysis</h3>
        <p className="text-xs text-gray-500 mb-6">
          Comparing an unmanaged classroom (where fans and lights remain ON continuously during open hours) against the PIR + LDR automated system.
        </p>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
              <span>Unmanaged Conventional Classroom (Continuous 1.20 kW)</span>
              <span className="font-mono text-gray-500">1,200 W (100%)</span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="w-full h-full bg-slate-400 rounded-full" />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-teal-900 mb-1">
              <span>Smart Automated Classroom (Zone-by-Zone Adaptive)</span>
              <span className="font-mono text-teal-700">
                {energy.current_power_w?.toFixed(1) || '222.0'} W (~18.5%)
              </span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(15, (energy.current_power_w / 1200) * 100))}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-2xl bg-teal-50/60 border border-teal-100 text-xs text-teal-900 flex items-start gap-3">
          <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Demonstration Transparency:</strong> Power values for each row (Fans: 42W, Lights: 28W) are calculated from nominal rating tables triggered by active relay states. Actual grid telemetry may vary slightly depending on supply voltage.
          </p>
        </div>
      </section>
    </div>
  );
};
