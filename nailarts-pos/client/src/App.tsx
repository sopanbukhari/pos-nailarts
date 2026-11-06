import React, { useState, useEffect } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { NavTab } from './components/layout/Sidebar';
import { useAuthStore } from './store/authStore';
import { LoginView } from './features/auth/LoginView';
import { PosView } from './features/pos/PosView';
import { BookingView } from './features/booking/BookingView';
import { CatalogView } from './features/catalog/CatalogView';
import { CustomerView } from './features/customers/CustomerView';
import { InventoryView } from './features/inventory/InventoryView';
import { StaffView } from './features/staff/StaffView';
import { ReportsView } from './features/reports/ReportsView';

export function App() {
  const { isAuthenticated, loadStoredAuth, user } = useAuthStore();
  const [currentTab, setCurrentTab] = useState<NavTab>('pos');

  useEffect(() => {
    loadStoredAuth();
  }, [loadStoredAuth]);

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const getTabTitle = () => {
    switch (currentTab) {
      case 'pos':
        return { title: 'Point of Sale (Kasir)', subtitle: 'Pilih layanan, konfigurasi add-on seni kuku & selesaikan pembayaran' };
      case 'booking':
        return { title: 'Jadwal & Janji Temu (Appointments)', subtitle: 'Kelola slot waktu reservasi dan antrian pengerjaan nail artist' };
      case 'catalog':
        return { title: 'Katalog Layanan & Seni Kuku', subtitle: 'Daftar treatment kuku, variasi add-on, durasi, dan harga salon' };
      case 'customers':
        return { title: 'Database Pelanggan CRM', subtitle: 'Preferensi bentuk kuku, warna favorit, poin loyalitas, dan histori servis' };
      case 'inventory':
        return { title: 'Stok Perlengkapan & Kuteks', subtitle: 'Monitoring sisa botol gel, base/top coat, tips, drill bits, dan alert menipis' };
      case 'staff':
        return { title: 'Manajemen Artis & Bagi Hasil Komisi', subtitle: 'Pengaturan persentase komisi, shift kerja, dan rekap payout artis' };
      case 'reports':
        return { title: 'Laporan Finansial & Omzet', subtitle: 'Analisis omzet harian/bulanan, performa layanan terlaris, dan laba kotor' };
      default:
        return { title: 'NailArt Studio POS', subtitle: 'Sistem Kasir & Salon' };
    }
  };

  const { title, subtitle } = getTabTitle();

  return (
    <AppLayout
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      title={title}
      subtitle={subtitle}
    >
      {currentTab === 'pos' && <PosView />}
      {currentTab === 'booking' && <BookingView onNavigateToPos={() => setCurrentTab('pos')} />}
      {currentTab === 'catalog' && <CatalogView />}
      {currentTab === 'customers' && <CustomerView />}
      {currentTab === 'inventory' && <InventoryView />}
      {currentTab === 'staff' && <StaffView />}
      {currentTab === 'reports' && <ReportsView />}
    </AppLayout>
  );
}

export default App;
