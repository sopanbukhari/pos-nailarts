import React from 'react';
import {
  Sparkles,
  ShoppingBag,
  CalendarDays,
  Layers,
  Users,
  Package,
  UserCheck,
  BarChart3,
  LogOut,
  Flower2,
  Crown,
  Gem,
  Heart,
  Paintbrush,
  Star,
  Settings,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useSalonStore, SalonIconType } from '../../store/salonStore';

export type NavTab = 'pos' | 'booking' | 'catalog' | 'customers' | 'inventory' | 'staff' | 'reports' | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { user, logout } = useAuthStore();
  const { settings } = useSalonStore();

  const navItems = [
    { id: 'pos', label: 'Kasir POS', icon: ShoppingBag, roles: ['ADMIN', 'CASHIER'] },
    { id: 'booking', label: 'Jadwal & Booking', icon: CalendarDays, roles: ['ADMIN', 'CASHIER', 'ARTIST'] },
    { id: 'catalog', label: 'Katalog Layanan', icon: Layers, roles: ['ADMIN', 'CASHIER', 'ARTIST'] },
    { id: 'customers', label: 'Pelanggan CRM', icon: Users, roles: ['ADMIN', 'CASHIER', 'ARTIST'] },
    { id: 'inventory', label: 'Stok & Inventaris', icon: Package, roles: ['ADMIN', 'CASHIER'] },
    { id: 'staff', label: 'Artis & Komisi', icon: UserCheck, roles: ['ADMIN', 'ARTIST'] },
    { id: 'reports', label: 'Laporan Omzet', icon: BarChart3, roles: ['ADMIN'] },
    { id: 'settings', label: 'Pengaturan Salon', icon: Settings, roles: ['ADMIN'] },
  ];

  const filteredNavItems = navItems.filter((item) => {
    if (!user) return true;
    return item.roles.includes(user.role);
  });

  const getSalonIcon = (iconType: SalonIconType) => {
    switch (iconType) {
      case 'sparkles':
        return <Sparkles size={20} />;
      case 'crown':
        return <Crown size={20} />;
      case 'gem':
        return <Gem size={20} />;
      case 'heart':
        return <Heart size={20} />;
      case 'brush':
        return <Paintbrush size={20} />;
      case 'star':
        return <Star size={20} />;
      case 'flower':
      default:
        return <Flower2 size={20} className="animate-spin-slow" />;
    }
  };

  const getThemeGradient = (theme: string) => {
    switch (theme) {
      case 'purple':
        return 'from-purple-600 to-pink-500 shadow-purple-200';
      case 'emerald':
        return 'from-emerald-600 to-teal-400 shadow-emerald-200';
      case 'amber':
        return 'from-amber-500 to-yellow-400 shadow-amber-200';
      case 'blue':
        return 'from-sky-600 to-indigo-500 shadow-sky-200';
      case 'slate':
        return 'from-slate-900 to-slate-700 shadow-slate-200';
      case 'blush':
      default:
        return 'from-blush-600 to-rose-400 shadow-blush-200';
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col h-screen sticky top-0 select-none">
      {/* Brand Logo */}
      <div className="p-4 border-b border-slate-100 flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${getThemeGradient(
            settings.colorTheme
          )} flex items-center justify-center text-white shadow-md overflow-hidden flex-shrink-0`}
        >
          {settings.customLogoUrl ? (
            <img
              src={settings.customLogoUrl}
              alt="Logo"
              className="w-full h-full object-cover"
            />
          ) : (
            getSalonIcon(settings.icon)
          )}
        </div>
        <div className="truncate">
          <h1 className="font-extrabold text-base tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent truncate">
            {settings.name}
          </h1>
          <p className="text-[11px] font-medium text-blush-600 tracking-wider uppercase truncate">
            {settings.tagline}
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        <p className="px-3 pt-2 pb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
          Menu Utama
        </p>
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id as NavTab)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 text-left ${
                isActive
                  ? 'bg-gradient-to-r from-blush-600 to-rose-500 text-white shadow-md shadow-blush-200 font-semibold'
                  : 'text-slate-600 hover:bg-rose-50/60 hover:text-blush-700'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
              <span>{item.label}</span>
              {item.id === 'pos' && (
                <span className="ml-auto flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Current User & Logout */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/60">
        <div className="p-3 bg-white rounded-xl border border-slate-200/60 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 rounded-full bg-blush-100 text-blush-700 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
              {user?.name?.slice(0, 2) || 'NA'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-800 truncate">{user?.name || 'Tamu'}</p>
              <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                {user?.role || 'User'}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            title="Keluar"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
