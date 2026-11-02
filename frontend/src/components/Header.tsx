import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  GraduationCap,
  ChevronDown,
  Sparkles,
  Sliders,
  Check,
  CheckCheck,
  Settings,
  Clock,
  LayoutDashboard,
  ShieldCheck,
  Radio,
  Fan,
  Lightbulb,
  Sun,
  X
} from 'lucide-react';
import type { NavTab } from './Sidebar';

export interface HeaderProps {
  mode: string;
  onModeToggle: () => void;
  esp32Connected: boolean;
  recentActivities?: Array<{
    time: string;
    type?: string;
    msg: string;
    status?: string;
  }>;
  onNavigateTab?: (tab: NavTab) => void;
  firmwareVersion?: string;
}

interface NotificationItem {
  id: string;
  msg: string;
  time: string;
  type: string;
  read: boolean;
  target?: NavTab;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  onModeToggle,
  esp32Connected,
  recentActivities,
  onNavigateTab,
  firmwareVersion = 'v1.0.0'
}) => {
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // References for outside click detection
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Initial notifications state derived from recent activities or defaults
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      msg: 'Motion detected in Row 2 — Desks 6–10 Active',
      time: '09:24:10 AM',
      type: 'motion',
      read: false,
      target: 'live_classroom'
    },
    {
      id: 'notif-2',
      msg: 'Ceiling Fan #2 automatically turned ON (42W load)',
      time: '09:24:05 AM',
      type: 'fan',
      read: false,
      target: 'devices'
    },
    {
      id: 'notif-3',
      msg: 'Solar Lux > 400: Front Row lights turned OFF to harvest daylight',
      time: '09:22:15 AM',
      type: 'solar',
      read: true,
      target: 'sensors'
    },
    {
      id: 'notif-4',
      msg: 'ESP32 Node-LH204 synchronized with telemetry server',
      time: '09:20:00 AM',
      type: 'system',
      read: true,
      target: 'settings'
    }
  ]);

  // Sync when recentActivities change from backend
  useEffect(() => {
    if (recentActivities && recentActivities.length > 0) {
      setNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n.msg));
        const newOnes: NotificationItem[] = [];

        recentActivities.slice(0, 5).forEach((act, idx) => {
          if (!existingIds.has(act.msg)) {
            newOnes.push({
              id: `act-${Date.now()}-${idx}`,
              msg: act.msg,
              time: act.time,
              type: act.type || 'system',
              read: false,
              target: act.type === 'fan' || act.type === 'light' ? 'devices' : 'live_classroom'
            });
          }
        });

        if (newOnes.length > 0) {
          return [...newOnes, ...prev].slice(0, 10);
        }
        return prev;
      });
    }
  }, [recentActivities]);

  // Date and Time ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      };
      setCurrentDateTime(now.toLocaleDateString('en-US', options).replace(/,/g, ' •'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close menus on outside click or Escape key press
  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        notificationRef.current &&
        !notificationRef.current.contains(target)
      ) {
        setIsNotificationsOpen(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(target)
      ) {
        setIsProfileOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsNotificationsOpen(false);
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleNotifications = () => {
    setIsNotificationsOpen((prev) => !prev);
    setIsProfileOpen(false);
  };

  const toggleProfile = () => {
    setIsProfileOpen((prev) => !prev);
    setIsNotificationsOpen(false);
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = (item: NotificationItem) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
    if (item.target && onNavigateTab) {
      onNavigateTab(item.target);
      setIsNotificationsOpen(false);
    }
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'motion':
        return <Radio className="w-3.5 h-3.5 text-teal-600" />;
      case 'fan':
        return <Fan className="w-3.5 h-3.5 text-teal-600" />;
      case 'light':
        return <Lightbulb className="w-3.5 h-3.5 text-amber-500" />;
      case 'solar':
        return <Sun className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />;
    }
  };

  return (
    <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 relative z-30" data-purpose="top-header">
      <div>
        <h1 className="text-2xl lg:text-[26px] font-bold text-[#172033] tracking-tight">
          Smart Classroom of Kishkinda University
        </h1>
        <p className="text-xs lg:text-sm font-medium text-slate-500 mt-0.5">
          IoT-Based Smart Classroom Energy Monitoring and Automatic Control System
        </p>
      </div>

      <div className="flex items-center flex-wrap gap-2.5">
        {/* Room Selector Dropdown */}
        <button
          onClick={() => onNavigateTab && onNavigateTab('live_classroom')}
          className="inline-flex items-center gap-2 bg-white border border-gray-200/90 rounded-full px-4 py-2 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 transition cursor-pointer"
          title="Switch Room or View Live Twin"
        >
          <GraduationCap className="w-4 h-4 text-teal-600" />
          <span>Lecture Hall LH-204</span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-0.5" />
        </button>

        {/* Global Mode Switcher Pill */}
        <div className="flex items-center bg-white p-1 rounded-full border border-gray-200/90 shadow-xs">
          <button
            onClick={onModeToggle}
            className={`px-3 py-1 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
              mode === 'AUTOMATIC'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AUTOMATIC (AI)
          </button>
          <button
            onClick={onModeToggle}
            className={`px-3 py-1 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
              mode === 'MANUAL'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            MANUAL OVERRIDE
          </button>
        </div>

        {/* Live Status Pill */}
        <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/80 rounded-full px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          {esp32Connected ? 'Live' : 'Simulated'}
        </div>

        {/* Date & Time */}
        <div className="hidden xl:flex items-center text-xs font-medium text-gray-500 px-2 font-mono">
          {currentDateTime || 'Mon, Apr 28, 2025 • 09:24 AM'}
        </div>

        <div className="h-4 w-px bg-gray-300 mx-1 hidden sm:block" />

        {/* Notification Bell Container */}
        <div className="relative" ref={notificationRef}>
          <button
            id="notification-bell-button"
            type="button"
            aria-label="System Notifications"
            aria-haspopup="true"
            aria-expanded={isNotificationsOpen}
            onClick={toggleNotifications}
            className={`relative p-2 rounded-full border transition cursor-pointer ${
              isNotificationsOpen
                ? 'bg-teal-50 border-teal-300 text-teal-700 shadow-sm ring-2 ring-teal-100'
                : 'bg-white border-gray-200 text-gray-600 hover:text-gray-900 shadow-xs'
            }`}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown Popover */}
          {isNotificationsOpen && (
            <div
              role="region"
              aria-label="Notifications Panel"
              className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 py-3 px-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    System Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-teal-50 text-teal-700 font-bold px-2 py-0.5 rounded-full border border-teal-200">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="text-[11px] font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer transition"
                      title="Mark all as read"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={clearAllNotifications}
                      className="text-[11px] font-semibold text-gray-400 hover:text-gray-600 p-1 rounded transition"
                      title="Clear all notifications"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Notification List */}
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-50 my-1">
                {notifications.length > 0 ? (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      className={`p-2.5 rounded-xl transition cursor-pointer flex items-start gap-3 ${
                        item.read ? 'hover:bg-gray-50' : 'bg-teal-50/40 hover:bg-teal-50/70'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-white border border-gray-100 shadow-xs flex items-center justify-center shrink-0 mt-0.5">
                        {getNotificationIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs leading-snug ${item.read ? 'text-gray-700 font-normal' : 'text-gray-900 font-semibold'}`}>
                          {item.msg}
                        </p>
                        <span className="text-[10px] text-gray-400 font-mono mt-1 block">
                          {item.time}
                        </span>
                      </div>
                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0 mt-1.5" />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-gray-400 flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Check className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-gray-700">You're all caught up.</span>
                    <span className="text-[11px] text-gray-400">No pending alerts or hardware warnings.</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              {onNavigateTab && (
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateTab('history');
                      setIsNotificationsOpen(false);
                    }}
                    className="text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1 cursor-pointer transition w-full justify-center py-1"
                  >
                    View All Activity History →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Profile Container */}
        <div className="relative" ref={profileRef}>
          <button
            id="profile-dropdown-button"
            type="button"
            aria-label="User Profile Menu"
            aria-haspopup="true"
            aria-expanded={isProfileOpen}
            onClick={toggleProfile}
            className={`flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border transition cursor-pointer ${
              isProfileOpen
                ? 'bg-teal-50 border-teal-300 ring-2 ring-teal-100'
                : 'bg-white border-transparent hover:border-gray-200'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-teal-50 border-2 border-teal-600 flex items-center justify-center text-teal-800 font-bold text-xs shadow-xs">
              KU
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-500 hidden sm:block transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileOpen && (
            <div
              role="menu"
              aria-label="User Menu"
              className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-3.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
            >
              {/* Profile Card Header */}
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                  KU
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-gray-900 truncate">
                    Kishkinda University
                  </h4>
                  <p className="text-[11px] text-gray-500 truncate">
                    Campus Administrator
                  </p>
                  <span className="text-[10px] font-mono font-medium text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded mt-0.5 inline-block border border-teal-100">
                    LH-204 Supervisor
                  </span>
                </div>
              </div>

              {/* Navigation Options */}
              <div className="py-2 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    onNavigateTab && onNavigateTab('overview');
                    setIsProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-teal-700 transition cursor-pointer text-left"
                >
                  <LayoutDashboard className="w-4 h-4 text-gray-400" />
                  <span>Overview Dashboard</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onNavigateTab && onNavigateTab('live_classroom');
                    setIsProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-teal-700 transition cursor-pointer text-left"
                >
                  <GraduationCap className="w-4 h-4 text-gray-400" />
                  <span>Live Classroom Twin</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onNavigateTab && onNavigateTab('settings');
                    setIsProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-teal-700 transition cursor-pointer text-left"
                >
                  <Settings className="w-4 h-4 text-gray-400" />
                  <span>Settings &amp; Pinouts</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onNavigateTab && onNavigateTab('history');
                    setIsProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-teal-700 transition cursor-pointer text-left"
                >
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>Activity Logs</span>
                </button>
              </div>

              {/* System Metadata Footer */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
                <span className="font-mono">Firmware: {firmwareVersion}</span>
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {esp32Connected ? 'Online' : 'Simulated'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
