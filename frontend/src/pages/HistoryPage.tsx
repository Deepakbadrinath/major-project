import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface HistoryPageProps {
  systemState: any;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ systemState }) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const activities = systemState?.recent_activities || [
    { time: '09:24:10 AM', type: 'motion', msg: 'Motion detected in Row 2', status: 'active' },
    { time: '09:24:05 AM', type: 'fan', msg: 'Fan 2 turned ON', status: 'active' },
    { time: '09:23:59 AM', type: 'light', msg: 'Light 3 set to Auto Mode', status: 'pending' },
    { time: '09:22:15 AM', type: 'solar', msg: 'Solar Lux > 400: Front Row lights OFF', status: 'saving' },
    { time: '09:20:00 AM', type: 'system', msg: 'ESP32 Node-LH204 synchronized with backend', status: 'connected' },
    { time: '09:15:30 AM', type: 'motion', msg: 'Motion timeout expired in Row 3', status: 'inactive' },
    { time: '09:10:00 AM', type: 'fan', msg: 'Fan 1 speed adjusted to adaptive level 3', status: 'active' },
    { time: '09:00:00 AM', type: 'system', msg: 'System initialized in AUTOMATIC AI mode', status: 'connected' }
  ];

  const filtered = activities.filter((act: any) => {
    const matchesFilter = filterType === 'all' || act.type === filterType;
    const matchesSearch = act.msg.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Activity &amp; Actuation Audit Log</h2>
          <p className="text-xs text-gray-500 mt-1">
            Real-time chronological events, motion triggers, and relay state logs
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search activity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-teal-500 w-44"
            />
          </div>

          {/* Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 cursor-pointer focus:outline-none"
          >
            <option value="all">All Events</option>
            <option value="motion">Motion</option>
            <option value="fan">Fan Actuation</option>
            <option value="light">Lighting</option>
            <option value="solar">Daylight Saving</option>
            <option value="system">System Status</option>
          </select>
        </div>
      </div>

      {/* Events Table / Timeline */}
      <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
        <div className="space-y-3">
          {filtered.map((item: any, idx: number) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-gray-50/60 border border-gray-100 flex items-center justify-between hover:bg-gray-100/60 transition"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    item.status === 'active' || item.status === 'connected'
                      ? 'bg-teal-500'
                      : item.status === 'pending'
                      ? 'bg-amber-500'
                      : item.status === 'saving'
                      ? 'bg-emerald-500'
                      : 'bg-slate-400'
                  }`}
                />
                <div>
                  <p className="text-xs font-semibold text-gray-900">{item.msg}</p>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5 capitalize">Event: {item.type}</p>
                </div>
              </div>
              <span className="text-xs font-mono font-medium text-gray-500 bg-white px-2.5 py-1 rounded-lg border border-gray-200/80">
                {item.time}
              </span>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="p-8 text-center text-xs text-gray-400">
              No matching activity events found.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
