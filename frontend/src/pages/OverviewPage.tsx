import React, { useState } from 'react';
import {
  Thermometer,
  Droplets,
  Users,
  Leaf,
  Maximize2,
  Zap,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Fan,
  Lightbulb,
  Radio
} from 'lucide-react';
import { Classroom3DScene } from '../components/Classroom3DScene';

interface OverviewPageProps {
  systemState: any;
  onSelectZone: (zoneId: number) => void;
  onNavigateToLive: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  systemState,
  onSelectZone,
  onNavigateToLive
}) => {
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h');
  const [selectedZoneInternal, setSelectedZoneInternal] = useState(2);

  const zones = systemState?.zones || {
    1: { name: 'Row 1 – Front', motion: true, fan_state: true, light_state: false, state_label: 'ACTIVE', expiring_countdown: 0 },
    2: { name: 'Row 2 – Middle', motion: true, fan_state: true, light_state: true, state_label: 'ACTIVE', expiring_countdown: 0 },
    3: { name: 'Row 3 – Rear', motion: false, fan_state: true, light_state: true, state_label: 'EXPIRING', expiring_countdown: 4 }
  };

  const handleZoneClick = (zId: number) => {
    setSelectedZoneInternal(zId);
    onSelectZone(zId);
  };

  // Count active zones
  const activeZonesCount = Object.values(zones).filter((z: any) => z.motion || z.state_label === 'ACTIVE' || z.state_label === 'EXPIRING').length;

  return (
    <div className="space-y-6">
      {/* BEGIN: Top 4 KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-purpose="kpi-metrics-row">
        {/* Card 1: Temperature */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex items-center gap-4 transition hover:shadow-md">
          <div className="w-13 h-13 rounded-2xl bg-teal-50 text-teal-600 p-3 flex items-center justify-center shrink-0">
            <Thermometer className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-gray-500">Temperature</div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold text-gray-900">
                {systemState?.sensors?.temperature?.toFixed(1) || '24.6'} °C
              </span>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                ▲ +0.2
              </span>
            </div>
            <div className="text-[11px] text-gray-400 mt-1">DHT22 (GPIO 4)</div>
          </div>
        </div>

        {/* Card 2: Humidity */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex items-center gap-4 transition hover:shadow-md">
          <div className="w-13 h-13 rounded-2xl bg-sky-50 text-sky-600 p-3 flex items-center justify-center shrink-0">
            <Droplets className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-gray-500">Humidity</div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold text-gray-900">
                {Math.round(systemState?.sensors?.humidity || 58)}%
              </span>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                ▲ +1%
              </span>
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Comfort: 40 – 60%</div>
          </div>
        </div>

        {/* Card 3: Zones with Recent Motion */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex items-center gap-4 transition hover:shadow-md">
          <div className="w-13 h-13 rounded-2xl bg-emerald-50 text-emerald-600 p-3 flex items-center justify-center shrink-0">
            <Users className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-gray-500">Zones with Recent Motion</div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold text-gray-900">{activeZonesCount} of 3</span>
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Last: 1 min ago</div>
          </div>
        </div>

        {/* Card 4: Energy Savings */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex items-center gap-4 transition hover:shadow-md">
          <div className="w-13 h-13 rounded-2xl bg-green-50 text-green-600 p-3 flex items-center justify-center shrink-0">
            <Leaf className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-gray-500">Energy Savings</div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold text-gray-900">
                {systemState?.energy?.savings_pct || '18.4'}%
              </span>
              <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                Demo Estimate
              </span>
            </div>
            <div className="text-[11px] text-gray-400 mt-1">
              ₹{systemState?.energy?.estimated_savings_inr?.toFixed(2) || '29.07'} saved today
            </div>
          </div>
        </div>
      </section>
      {/* END: Top KPI Cards */}

      {/* BEGIN: Middle Section (3D Classroom Centerpiece + Right Status Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: 3D Isometric Classroom Activity (8 cols) */}
        <section
          className="lg:col-span-8 bg-white rounded-3xl p-5 border border-gray-100 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between"
          data-purpose="isometric-classroom-card"
        >
          {/* Top bar of Classroom Card */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-teal-600" />
              <h2 className="text-base font-bold text-gray-900">Classroom Activity</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live View
              </span>
              <button
                onClick={onNavigateToLive}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                title="Open Dedicated Live Classroom View"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 3D Architectural Scene Canvas Viewport */}
          <div className="relative w-full h-[440px] my-2 rounded-2xl overflow-hidden bg-slate-900">
            <Classroom3DScene
              zones={zones}
              selectedZone={selectedZoneInternal}
              onSelectZone={handleZoneClick}
              isCompact={false}
            />
          </div>

          {/* Legend at bottom */}
          <div className="flex items-center justify-center gap-6 pt-3 border-t border-gray-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-teal-500" />
              <span className="font-medium text-gray-700">Active</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="font-medium text-gray-700">Expiring</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-400" />
              <span className="font-medium text-gray-700">Inactive</span>
            </div>
          </div>
        </section>

        {/* RIGHT: Zone Status & Recent Activity (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Zone Status Card */}
          <section
            className="bg-white rounded-3xl p-5 border border-gray-100 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.05)]"
            data-purpose="zone-status-card"
          >
            <div className="flex items-center gap-2 mb-4">
              <Radio className="w-5 h-5 text-teal-600" />
              <h2 className="text-base font-bold text-gray-900">Zone Status</h2>
            </div>
            <div className="space-y-3">
              {/* Row 1 */}
              <div
                onClick={() => handleZoneClick(1)}
                className={`p-3.5 rounded-2xl bg-[#F8FAFC] border-l-4 border-l-teal-500 border border-gray-100/80 cursor-pointer transition ${
                  selectedZoneInternal === 1 ? 'ring-2 ring-teal-400 shadow-xs' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-gray-900">Row 1 – Front</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Motion: <span className="text-teal-600 font-semibold">{zones[1]?.motion ? 'Yes' : 'No'}</span> • 1 min ago
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[11px] font-medium text-gray-700">
                      <Fan className={`w-3.5 h-3.5 ${zones[1]?.fan_state ? 'text-teal-600 animate-spin-fast' : 'text-gray-400'}`} />
                      <span>Fan: <strong className={zones[1]?.fan_state ? 'text-teal-700' : 'text-gray-500'}>{zones[1]?.fan_state ? 'ON' : 'OFF'}</strong></span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-medium text-gray-700">
                      <Lightbulb className={`w-3.5 h-3.5 ${zones[1]?.light_state ? 'text-amber-500' : 'text-gray-400'}`} />
                      <span>Light: <span className={zones[1]?.light_state ? 'text-teal-700 font-bold' : 'text-gray-500'}>{zones[1]?.light_state ? 'ON' : 'OFF (Solar)'}</span></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2 */}
              <div
                onClick={() => handleZoneClick(2)}
                className={`p-3.5 rounded-2xl bg-[#F8FAFC] border-l-4 border-l-teal-500 border border-gray-100/80 cursor-pointer transition ${
                  selectedZoneInternal === 2 ? 'ring-2 ring-teal-400 shadow-xs' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-gray-900">Row 2 – Middle</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Motion: <span className="text-teal-600 font-semibold">{zones[2]?.motion ? 'Yes' : 'No'}</span> • 30 sec ago
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[11px] font-medium text-gray-700">
                      <Fan className={`w-3.5 h-3.5 ${zones[2]?.fan_state ? 'text-teal-600 animate-spin-fast' : 'text-gray-400'}`} />
                      <span>Fan: <strong className={zones[2]?.fan_state ? 'text-teal-700' : 'text-gray-500'}>{zones[2]?.fan_state ? 'ON' : 'OFF'}</strong></span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-medium text-gray-700">
                      <Lightbulb className={`w-3.5 h-3.5 ${zones[2]?.light_state ? 'text-amber-500' : 'text-gray-400'}`} />
                      <span>Light: <strong className={zones[2]?.light_state ? 'text-teal-700' : 'text-gray-500'}>{zones[2]?.light_state ? 'ON' : 'OFF'}</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3 */}
              <div
                onClick={() => handleZoneClick(3)}
                className={`p-3.5 rounded-2xl bg-[#F8FAFC] border-l-4 border-l-amber-500 border border-gray-100/80 cursor-pointer transition ${
                  selectedZoneInternal === 3 ? 'ring-2 ring-amber-400 shadow-xs' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-gray-900">Row 3 – Rear</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Motion: <span className="text-amber-600 font-semibold">Expiring • {zones[3]?.expiring_countdown || 4}s</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[11px] font-medium text-gray-700">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Row: <span className="text-amber-600 font-medium">Pending</span></span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-medium text-gray-700">
                      <Lightbulb className={`w-3.5 h-3.5 ${zones[3]?.light_state ? 'text-amber-500' : 'text-gray-400'}`} />
                      <span>Light: <strong className={zones[3]?.light_state ? 'text-teal-700' : 'text-gray-500'}>{zones[3]?.light_state ? 'ON' : 'OFF'}</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Recent Activity Card */}
          <section
            className="bg-white rounded-3xl p-5 border border-gray-100 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.05)] flex-1"
            data-purpose="recent-activity-card"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-600" />
                <h2 className="text-base font-bold text-gray-900">Recent Activity</h2>
              </div>
              <button
                onClick={onNavigateToLive}
                className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer transition"
              >
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-3.5">
              {(systemState?.recent_activities || [
                { time: '09:24:10 AM', msg: 'Motion detected in Row 2', status: 'active' },
                { time: '09:24:05 AM', msg: 'Fan 2 turned ON', status: 'active' },
                { time: '09:23:59 AM', msg: 'Light 3 set to Auto Mode', status: 'pending' },
                { time: '09:22:15 AM', msg: 'Solar Lux > 400: Front Row lights OFF', status: 'saving' }
              ]).slice(0, 4).map((act: any, idx: number) => (
                <div key={idx} className="flex items-center text-xs">
                  <span
                    className={`w-2.5 h-2.5 rounded-full mr-3 shrink-0 ${
                      act.status === 'active'
                        ? 'bg-teal-500'
                        : act.status === 'pending'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                  <span className="font-medium text-gray-400 w-24 shrink-0 font-mono text-[11px]">{act.time}</span>
                  <span className="font-medium text-gray-800 truncate">{act.msg}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
      {/* END: Middle Section */}

      {/* BEGIN: Bottom Section (Energy Consumption Trend + Energy Summary) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bottom Left: Energy Consumption Trend Chart (8 cols) */}
        <section
          className="lg:col-span-8 bg-white rounded-3xl p-5 border border-gray-100 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.05)]"
          data-purpose="energy-trend-chart-card"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-teal-600" />
              <h2 className="text-base font-bold text-gray-900">Energy Consumption Trend</h2>
            </div>
            {/* Time Range Selector Buttons */}
            <div className="inline-flex p-1 bg-gray-100 rounded-xl text-xs font-semibold">
              {(['1h', '6h', '24h', '7d'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    timeRange === r
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Legend indicators */}
          <div className="flex items-center justify-center sm:justify-end gap-6 text-xs mb-3 font-medium">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-teal-500" />
              <span className="text-gray-700 font-semibold">Smart Classroom</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-0.5 border-t-2 border-dashed border-gray-400" />
              <span className="text-gray-500">Unmanaged (1.20 kW)</span>
            </div>
          </div>

          {/* Smooth SVG Area/Line Chart */}
          <div className="relative w-full h-44">
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 700 160">
              <defs>
                <linearGradient id="smartGradient" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#0D9488" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#0D9488" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Horizontal Grid lines */}
              <line stroke="#F1F5F9" strokeWidth="1.5" x1="45" x2="690" y1="20" y2="20" />
              <line stroke="#F1F5F9" strokeWidth="1.5" x1="45" x2="690" y1="55" y2="55" />
              <line stroke="#F1F5F9" strokeWidth="1.5" x1="45" x2="690" y1="90" y2="90" />
              <line stroke="#F1F5F9" strokeWidth="1.5" x1="45" x2="690" y1="125" y2="125" />
              <line stroke="#E2E8F0" strokeWidth="1.5" x1="45" x2="690" y1="145" y2="145" />

              {/* Y Axis labels */}
              <text className="text-[10px] fill-gray-400 font-medium" textAnchor="end" x="38" y="24">1.2kW</text>
              <text className="text-[10px] fill-gray-400 font-medium" textAnchor="end" x="38" y="59">900W</text>
              <text className="text-[10px] fill-gray-400 font-medium" textAnchor="end" x="38" y="94">600W</text>
              <text className="text-[10px] fill-gray-400 font-medium" textAnchor="end" x="38" y="129">300W</text>
              <text className="text-[10px] fill-gray-400 font-medium" textAnchor="end" x="38" y="148">0W</text>

              {/* Baseline Reference line (dashed unmanaged) */}
              <line stroke="#94A3B8" strokeDasharray="6,4" strokeWidth="1.8" x1="45" x2="690" y1="20" y2="20" />

              {/* Smart Energy Area Fill */}
              <path
                d="M 45 130 
                   C 100 130, 140 120, 180 120 
                   C 220 120, 260 100, 300 95 
                   C 340 90, 380 75, 420 85 
                   C 460 95, 500 110, 540 120 
                   C 580 125, 620 135, 690 138 
                   L 690 145 L 45 145 Z"
                fill="url(#smartGradient)"
              />

              {/* Smart Energy Line Curve */}
              <path
                d="M 45 130 
                   C 100 130, 140 120, 180 120 
                   C 220 120, 260 100, 300 95 
                   C 340 90, 380 75, 420 85 
                   C 460 95, 500 110, 540 120 
                   C 580 125, 620 135, 690 138"
                fill="none"
                stroke="#0D9488"
                strokeLinecap="round"
                strokeWidth="2.5"
              />
            </svg>
          </div>

          {/* X-Axis Timestamps */}
          <div className="flex justify-between pl-10 pr-2 pt-1 text-[11px] text-gray-400 font-semibold font-mono">
            <span>12AM</span>
            <span>4AM</span>
            <span>8AM</span>
            <span>12PM</span>
            <span>4PM</span>
            <span>8PM</span>
            <span>12AM</span>
          </div>
        </section>

        {/* Bottom Right: Energy Summary (4 cols) */}
        <section
          className="lg:col-span-4 bg-white rounded-3xl p-5 border border-gray-100 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between"
          data-purpose="energy-summary-card"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-gray-900">Energy Summary</h2>
          </div>

          {/* 3 Columns Metric breakdown */}
          <div className="grid grid-cols-3 gap-2 py-3 border-y border-gray-100 text-center">
            {/* Column 1: Estimated Consumption */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-1">
                ⚡
              </div>
              <span className="text-[10px] text-gray-400 font-medium">Estimated Consumption</span>
              <span className="text-sm font-bold text-gray-900 mt-1 font-mono">
                {systemState?.energy?.current_power_w?.toFixed(1) || '222.0'} W
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                ▼ 84.5% vs baseline
              </span>
            </div>

            {/* Column 2: Estimated Savings */}
            <div className="flex flex-col items-center border-x border-gray-100 px-1">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
                🍃
              </div>
              <span className="text-[10px] text-gray-400 font-medium">Estimated Savings</span>
              <span className="text-sm font-bold text-gray-900 mt-1 font-mono">
                {systemState?.energy?.estimated_savings_kwh || '3.42'} kWh
              </span>
              <span className="text-[10px] text-gray-500 font-medium mt-0.5">
                ≈ ₹{systemState?.energy?.estimated_savings_inr?.toFixed(2) || '29.07'}
              </span>
            </div>

            {/* Column 3: Tariff */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-1">
                🪙
              </div>
              <span className="text-[10px] text-gray-400 font-medium">Tariff</span>
              <span className="text-sm font-bold text-gray-900 mt-1 font-mono">₹8.50/kWh</span>
              <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-semibold mt-0.5">
                Demo Data
              </span>
            </div>
          </div>

          <div className="pt-3 text-[11px] text-gray-400 flex items-center justify-between">
            <span>Dynamic power telemetry calculated per active relay load.</span>
          </div>
        </section>
      </div>
      {/* END: Bottom Section */}
    </div>
  );
};
