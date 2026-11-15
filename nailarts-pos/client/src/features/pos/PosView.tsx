import React, { useState, useEffect } from 'react';
import { Search, Sparkles, AlertCircle, ShoppingBag, Layers, Package, Plus, Check } from 'lucide-react';
import { ServiceCard } from './ServiceCard';
import { AddonModal } from './AddonModal';
import { CartPanel } from './CartPanel';
import { CheckoutModal } from './CheckoutModal';
import { ReceiptModal } from './ReceiptModal';
import { CustomerSelectModal } from './CustomerSelectModal';
import { Category, Customer, Product, Service, ServiceAddon, Transaction, User } from '../../types';
import { useCartStore } from '../../store/cartStore';
import { formatRupiah } from '../../utils/format';
import { Badge } from '../../components/ui/Badge';
import api from '../../lib/axios';

export const PosView: React.FC = () => {
  const [catalogMode, setCatalogMode] = useState<'SERVICES' | 'PRODUCTS'>('SERVICES');
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
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

  const { addItem, addProduct, setCustomer, selectedCustomer } = useCartStore();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, srvRes, prodRes, custRes, staffRes] = await Promise.all([
        api.get('/catalog/categories'),
        api.get('/catalog/services'),
        api.get('/inventory'),
        api.get('/customers'),
        api.get('/staff?role=ARTIST'),
      ]);

      if (catRes.data.success) setCategories(catRes.data.data);
      if (srvRes.data.success) setServices(srvRes.data.data);
      if (prodRes.data.success) setProducts(prodRes.data.data);
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
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Filter products that have retail price or can be sold in retail
  const retailProducts = products.filter((p) => (p.retailPrice || 0) > 0);
  const filteredProducts = retailProducts.filter((p) => {
    const matchesCategory = activeCategoryId === 'all' || p.category === activeCategoryId;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const productCategories = Array.from(new Set(retailProducts.map((p) => p.category))).filter(Boolean);

  const handleServiceClick = (service: Service) => {
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
    // Refresh products stock after checkout
    api.get('/inventory').then((res) => {
      if (res.data.success) setProducts(res.data.data);
    });
  };

  return (
    <div className="flex gap-6 h-full items-start">
      {/* Katalog Layanan / Produk (Kiri) */}
      <div className="flex-1 flex flex-col min-w-0 space-y-4">
        {/* Toggle Mode & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-3 shadow-xs">
          {/* Mode Switcher: Layanan vs Produk Retail */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => {
                setCatalogMode('SERVICES');
                setActiveCategoryId('all');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                catalogMode === 'SERVICES'
                  ? 'bg-white text-blush-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers size={15} />
              <span>💅 Layanan Seni Kuku ({services.length})</span>
            </button>
            <button
              onClick={() => {
                setCatalogMode('PRODUCTS');
                setActiveCategoryId('all');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                catalogMode === 'PRODUCTS'
                  ? 'bg-white text-blush-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package size={15} />
              <span>🛍️ Produk Retail & Perawatan ({retailProducts.length})</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder={
                catalogMode === 'SERVICES'
                  ? 'Cari layanan (contoh: Russian Manicure, Gel Polish, Nail Art...)'
                  : 'Cari produk retail (contoh: Cuticle Oil, Press-on Nails, Top Coat...)'
              }
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
              Semua {catalogMode === 'SERVICES' ? 'Layanan' : 'Produk'}
            </button>

            {catalogMode === 'SERVICES'
              ? categories.map((cat) => (
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
                ))
              : productCategories.map((catName) => (
                  <button
                    key={catName}
                    onClick={() => setActiveCategoryId(catName)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      activeCategoryId === catName
                        ? 'bg-blush-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {catName}
                  </button>
                ))}
          </div>
        </div>

        {/* Content Grid */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              Memuat katalog nail arts...
            </div>
          ) : catalogMode === 'SERVICES' ? (
            /* Services Grid */
            filteredServices.length === 0 ? (
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
            )
          ) : (
            /* Retail Products Grid */
            filteredProducts.length === 0 ? (
              <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-400">
                <Package size={28} className="mx-auto text-rose-300 mb-2" />
                <p className="font-semibold text-slate-700">Tidak ada produk retail yang sesuai</p>
                <p className="text-xs text-slate-400 mt-1">
                  Tambahkan harga retail pada menu Stok & Inventaris agar produk muncul di kasir.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredProducts.map((prod) => {
                  const isOutOfStock = prod.stockQuantity <= 0;
                  const isLowStock = prod.stockQuantity > 0 && prod.stockQuantity <= prod.minStockAlert;

                  return (
                    <div
                      key={prod.id}
                      className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:shadow-md hover:border-blush-300 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                            {prod.sku}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isOutOfStock
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : isLowStock
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {isOutOfStock
                              ? 'Habis'
                              : isLowStock
                              ? `Sisa ${prod.stockQuantity} ${prod.unit}`
                              : `Stok: ${prod.stockQuantity} ${prod.unit}`}
                          </span>
                        </div>

                        <h4 className="font-bold text-sm text-slate-800 leading-snug">{prod.name}</h4>
                        <span className="text-xs text-slate-400 block mt-0.5">{prod.category}</span>
                      </div>

                      <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-sm font-black text-blush-700">
                          {formatRupiah(prod.retailPrice)}
                        </span>

                        <button
                          disabled={isOutOfStock}
                          onClick={() => addProduct(prod)}
                          className="px-3 py-1.5 bg-blush-600 hover:bg-blush-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-all shadow-xs active:scale-95 cursor-pointer"
                        >
                          <Plus size={14} />
                          <span>+ Keranjang</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
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
