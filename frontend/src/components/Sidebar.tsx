import React from 'react';
import {
  LayoutDashboard,
  Tv,
  Cpu,
  Wifi,
  BarChart3,
  Clock,
  Settings,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export type NavTab =
  | 'overview'
  | 'live_classroom'
  | 'devices'
  | 'sensors'
  | 'analytics'
  | 'history'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  esp32Connected: boolean;
  firmwareVersion?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  esp32Connected,
  firmwareVersion = 'v1.0.0'
}) => {
  const navItems = [
    { id: 'overview' as NavTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'live_classroom' as NavTab, label: 'Live Classroom', icon: Tv },
    { id: 'devices' as NavTab, label: 'Devices & Controls', icon: Cpu },
    { id: 'sensors' as NavTab, label: 'Sensors', icon: Wifi },
    { id: 'analytics' as NavTab, label: 'Energy Analytics', icon: BarChart3 },
    { id: 'history' as NavTab, label: 'Activity History', icon: Clock },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings }
  ];

  return (
    <aside
      className="w-64 bg-white border-r border-[#E5E9F0] flex flex-col justify-between shrink-0 h-screen sticky top-0 overflow-y-auto z-30 select-none shadow-[1px_0_10px_rgba(0,0,0,0.02)]"
      data-purpose="main-navigation"
    >
      <div className="p-5">
        {/* University Brand Emblem */}
        <div
          className="flex flex-col items-center text-center pb-6 border-b border-gray-100 cursor-pointer"
          onClick={() => onTabChange('overview')}
          data-purpose="university-logo"
        >
          <div className="w-16 h-16 mb-2 flex items-center justify-center text-teal-600 transition-transform hover:scale-105">
            <svg className="w-14 h-14" fill="none" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
              <path d="M32 6C32 6 38 16 38 24C38 28.4 35.3 32 32 32C28.7 32 26 28.4 26 24C26 16 32 6 32 6Z" fill="#F59E0B" />
              <path d="M12 28L32 38L52 28L32 18L12 28Z" stroke="#0D9488" strokeLinejoin="round" strokeWidth="2.5" />
              <path d="M16 33.5V45C16 48.5 23.2 52 32 52C40.8 52 48 48.5 48 45V33.5" stroke="#0D9488" strokeLinecap="round" strokeWidth="2.5" />
              <path d="M32 38V52" stroke="#0D9488" strokeLinecap="round" strokeWidth="2.5" />
              <path d="M50 31V43" stroke="#F59E0B" strokeLinecap="round" strokeWidth="2.5" />
              <circle cx="50" cy="45" fill="#F59E0B" r="1.5" />
            </svg>
          </div>
          <h1 className="text-base font-bold text-gray-900 leading-tight tracking-tight">
            Kishkinda<br />University
          </h1>
          <p className="text-[10px] font-medium text-gray-400 mt-1 tracking-wider uppercase">
            Knowledge • Innovation • Excellence
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="mt-6 space-y-1.5" data-purpose="nav-menu">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all text-left ${
                  isActive
                    ? 'bg-teal-50 text-teal-700 font-semibold shadow-sm border border-teal-100'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-teal-600' : 'text-gray-400'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Bottom Status & Campus Card */}
      <div className="p-4 space-y-3" data-purpose="sidebar-footer">
        {/* Hardware Status Pill Card */}
        <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              esp32Connected ? 'bg-teal-100 text-teal-700' : 'bg-rose-100 text-rose-700'
            }`}>
              {esp32Connected ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-900">
                {esp32Connected ? 'ESP32 Connected' : 'ESP32 Offline'}
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    esp32Connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                  }`}
                />
                <span className="text-[11px] text-gray-500 font-medium">
                  {esp32Connected ? 'Online' : 'Failsafe'}
                </span>
              </div>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-gray-400 bg-white px-2 py-0.5 rounded-md border border-gray-200">
            {firmwareVersion}
          </span>
        </div>

        {/* Campus Architectural Mini Preview Card */}
        <div className="relative rounded-2xl overflow-hidden shadow-xs h-28 border border-gray-200 group cursor-pointer bg-slate-900">
          <img
            alt="University Campus"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
            src="/assets/classroom_isometric_model.png"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-2.5">
            <span className="text-[11px] font-medium text-white tracking-wide flex items-center gap-1">
              <span>🏛️</span> Main Campus • Block B (LH-204)
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
