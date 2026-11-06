import React, { useState, useEffect } from 'react';
import { Search, Sparkles, AlertCircle } from 'lucide-react';
import { ServiceCard } from './ServiceCard';
import { AddonModal } from './AddonModal';
import { CartPanel } from './CartPanel';
import { CheckoutModal } from './CheckoutModal';
import { ReceiptModal } from './ReceiptModal';
import { CustomerSelectModal } from './CustomerSelectModal';
import { Category, Customer, Service, ServiceAddon, Transaction, User } from '../../types';
import { useCartStore } from '../../store/cartStore';
import api from '../../lib/axios';

export const PosView: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [artists, setArtists] = useState<User[]>([]);

  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedServiceForAddons, setSelectedServiceForAddons] = useState<Service | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const { addItem, setCustomer, selectedCustomer } = useCartStore();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, srvRes, custRes, staffRes] = await Promise.all([
        api.get('/catalog/categories'),
        api.get('/catalog/services'),
        api.get('/customers'),
        api.get('/staff?role=ARTIST'),
      ]);

      if (catRes.data.success) setCategories(catRes.data.data);
      if (srvRes.data.success) setServices(srvRes.data.data);
      if (custRes.data.success) setCustomers(custRes.data.data);
      if (staffRes.data.success) setArtists(staffRes.data.data);
    } catch (err) {
      console.error('Error fetching POS data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter((s) => {
    const matchesCategory = activeCategoryId === 'all' || s.categoryId === activeCategoryId;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleServiceClick = (service: Service) => {
    // If service has addons or options, open Addon modal; otherwise add directly to cart
    if (service.addons && service.addons.length > 0) {
      setSelectedServiceForAddons(service);
    } else {
      addItem(service);
    }
  };

  const handleAddonsConfirmed = (
    service: Service,
    selectedAddons: ServiceAddon[],
    artistId?: string,
    artistName?: string
  ) => {
    addItem(service, selectedAddons, artistId, artistName);
  };

  const handleCheckoutSuccess = (tx: Transaction) => {
    setLastTransaction(tx);
    setIsReceiptModalOpen(true);
  };

  return (
    <div className="flex gap-6 h-full items-start">
      {/* Katalog Layanan (Kiri) */}
      <div className="flex-1 flex flex-col min-w-0 space-y-4">
        {/* Search Bar & Kategori */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-3 shadow-xs">
          {/* Search Input */}
          <div className="relative">
            <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari layanan (contoh: Russian Manicure, Gel Polish, Polygel, dsb)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blush-500/20"
            />
          </div>

          {/* Kategori Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveCategoryId('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeCategoryId === 'all'
                  ? 'bg-blush-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Layanan ({services.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeCategoryId === cat.id
                    ? 'bg-blush-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              Memuat katalog nail arts...
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-400">
              <Sparkles size={28} className="mx-auto text-rose-300 mb-2" />
              <p className="font-semibold text-slate-700">Tidak ada layanan yang sesuai</p>
              <p className="text-xs text-slate-400 mt-1">Coba gunakan kata kunci pencarian yang lain.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onSelect={handleServiceClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart Kasir (Kanan) */}
      <CartPanel
        customers={customers}
        artists={artists}
        onOpenCustomerModal={() => setIsCustomerModalOpen(true)}
        onProceedCheckout={() => setIsCheckoutModalOpen(true)}
      />

      {/* Modals */}
      <AddonModal
        isOpen={Boolean(selectedServiceForAddons)}
        onClose={() => setSelectedServiceForAddons(null)}
        service={selectedServiceForAddons}
        artists={artists}
        onAddToCart={handleAddonsConfirmed}
      />

      <CustomerSelectModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        customers={customers}
        selectedCustomerId={selectedCustomer?.id}
        onSelectCustomer={(c) => setCustomer(c)}
        onCustomerCreated={(c) => setCustomers([c, ...customers])}
      />

      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        onSuccess={handleCheckoutSuccess}
      />

      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        transaction={lastTransaction}
      />
    </div>
  );
};
