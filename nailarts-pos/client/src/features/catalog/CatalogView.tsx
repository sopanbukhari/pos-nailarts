import React, { useState, useEffect } from 'react';
import { Plus, Search, Layers, Clock, Sparkles, Check, Edit2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { NewServiceModal } from './NewServiceModal';
import { Category, Service } from '../../types';
import { formatRupiah } from '../../utils/format';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/axios';

export const CatalogView: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, srvRes] = await Promise.all([
        api.get('/catalog/categories'),
        api.get('/catalog/services'),
      ]);
      if (catRes.data.success) setCategories(catRes.data.data);
      if (srvRes.data.success) setServices(srvRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = services.filter((s) => {
    const matchCat = activeTab === 'all' || s.categoryId === activeTab;
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Filter & Add Button */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari menu layanan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blush-500/20"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'all' ? 'bg-blush-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Semua
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveTab(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === c.id ? 'bg-blush-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {isAdmin && (
          <Button
            variant="primary"
            size="md"
            className="flex items-center gap-2"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={16} />
            <span>Tambah Layanan Baru</span>
          </Button>
        )}
      </div>

      {/* Services List Table / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((service) => (
          <div
            key={service.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-blush-700 uppercase">
                  {service.category?.name || 'Katalog'}
                </span>
                <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                  <Clock size={12} />
                  {service.durationMinutes} mnt
                </span>
              </div>

              <h3 className="font-bold text-sm text-slate-800">{service.name}</h3>
              {service.description && (
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{service.description}</p>
              )}

              {/* Addons preview */}
              {service.addons && service.addons.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Pilihan Add-on:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {service.addons.map((a) => (
                      <span
                        key={a.id}
                        className="text-[10px] px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-md text-slate-600"
                      >
                        +{a.name} ({formatRupiah(a.price)})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block">Harga Dasar</span>
                <span className="text-sm font-extrabold text-slate-900">
                  {formatRupiah(service.basePrice)}
                </span>
              </div>
              <Badge variant="emerald">Aktif di POS</Badge>
            </div>
          </div>
        ))}
      </div>

      <NewServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categories={categories}
        onServiceCreated={fetchData}
      />
    </div>
  );
};
