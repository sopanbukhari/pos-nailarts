import React, { useState, useEffect } from 'react';
import { Clock, Store, Bell, Sparkles } from 'lucide-react';
import { useSalonStore } from '../../store/salonStore';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, actions }) => {
  const { settings } = useSalonStore();
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Salon Branch & Live Time */}
        <div className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-slate-50 border border-slate-200/70 rounded-xl text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-medium">
            <Store size={14} className="text-blush-600" />
            <span>{settings.branchName}</span>
          </div>
          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
          <div className="flex items-center gap-1.5 text-slate-500">
            <Clock size={14} />
            <span>{time}</span>
          </div>
        </div>

        {actions}
      </div>
    </header>
  );
};
