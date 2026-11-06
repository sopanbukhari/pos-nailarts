import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Phone, Mail, Sparkles, History, Award } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Customer } from '../../types';
import { formatDate, formatRupiah } from '../../utils/format';
import api from '../../lib/axios';

export const CustomerView: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Detail & History modal
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // New customer modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [nailShape, setNailShape] = useState('Almond');
  const [colorPref, setColorPref] = useState('');
  const [allergies, setAllergies] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers');
      if (res.data.success) {
        setCustomers(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCustomerDetail = async (c: Customer) => {
    setIsDetailModalOpen(true);
    setDetailLoading(true);
    try {
      const res = await api.get(`/customers/${c.id}`);
      if (res.data.success) {
        setSelectedCustomer(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/customers', {
        name,
        phone,
        email,
        nailShapePreference: nailShape,
        colorPreferences: colorPref,
        allergies,
        notes,
      });
      setIsCreateModalOpen(false);
      setName('');
      setPhone('');
      setEmail('');
      setColorPref('');
      setNotes('');
      fetchCustomers();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.nailShapePreference && c.nailShapePreference.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top Search & Actions */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="relative flex-1 min-w-[280px]">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari pelanggan (nama, nomor HP, bentuk kuku)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blush-500/20"
          />
        </div>

        <Button
          variant="primary"
          size="md"
          className="flex items-center gap-2"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <UserPlus size={16} />
          <span>Tambah Pelanggan Baru</span>
        </Button>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <div
            key={c.id}
            onClick={() => openCustomerDetail(c)}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-blush-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-rose-50 text-blush-700 flex items-center justify-center font-black text-sm">
                    {c.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{c.name}</h3>
                    <p className="text-xs text-slate-400">{c.phone}</p>
                  </div>
                </div>

                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  ⭐ {c.loyaltyPoints} pts
                </span>
              </div>

              {/* Nail Preferences tags */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span className="text-slate-400 font-medium">Bentuk Kuku:</span>
                  <span className="font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md text-[11px]">
                    💅 {c.nailShapePreference || 'Belum dipilih'}
                  </span>
                </div>

                {c.colorPreferences && (
                  <p className="text-[11px] text-slate-500 line-clamp-1">
                    <span className="text-slate-400">Warna Favorit:</span> {c.colorPreferences}
                  </p>
                )}

                {c.allergies && (
                  <p className="text-[11px] text-rose-600 line-clamp-1 font-medium">
                    ⚠️ {c.allergies}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Klik untuk riwayat visit</span>
              <span className="font-semibold text-blush-600">Lihat Profil & Riwayat &rarr;</span>
            </div>
          </div>
        ))}
      </div>

      {/* Customer Detail & Visit History Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedCustomer?.name || 'Detail Pelanggan'}
        subtitle={`Member sejak ${formatDate(selectedCustomer?.createdAt)}`}
        maxWidth="lg"
      >
        {detailLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Memuat profil pelanggan...</div>
        ) : selectedCustomer ? (
          <div className="space-y-4">
            {/* Info Cards */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block">No. WhatsApp / Telp:</span>
                  <span className="font-bold text-slate-800">{selectedCustomer.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Loyalty Points:</span>
                  <span className="font-bold text-amber-600">⭐ {selectedCustomer.loyaltyPoints} Poin</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Preferensi Bentuk Kuku:</span>
                  <span className="font-bold text-rose-700">{selectedCustomer.nailShapePreference || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Preferensi Warna:</span>
                  <span className="font-bold text-slate-800">{selectedCustomer.colorPreferences || '-'}</span>
                </div>
              </div>

              {selectedCustomer.allergies && (
                <div className="pt-2 border-t border-slate-200 text-xs text-rose-700">
                  <span className="font-bold">Catatan Alergi:</span> {selectedCustomer.allergies}
                </div>
              )}
            </div>

            {/* Riwayat Transaksi & Treatment */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <History size={14} />
                <span>Riwayat Kunjungan & Servis Terakhir:</span>
              </h4>

              <div className="space-y-2 max-h-56 overflow-y-auto">
                {selectedCustomer.transactions?.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">Belum ada riwayat transaksi.</p>
                ) : (
                  selectedCustomer.transactions?.map((tx: any) => (
                    <div
                      key={tx.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 text-xs flex justify-between items-center"
                    >
                      <div>
                        <div className="font-bold text-slate-800">{tx.invoiceNumber}</div>
                        <div className="text-[11px] text-slate-400">{formatDate(tx.createdAt)}</div>
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          {tx.items?.map((it: any) => it.serviceName).join(', ')}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-slate-900 block">{formatRupiah(tx.total)}</span>
                        <span className="text-[10px] font-bold text-emerald-600">{tx.paymentMethod}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={() => setIsDetailModalOpen(false)}>
              Tutup
            </Button>
          </div>
        ) : null}
      </Modal>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Daftarkan Pelanggan Baru"
        subtitle="Simpan data pelanggan dan preferensi seni kuku"
        maxWidth="md"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <Input
            label="Nama Lengkap"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Valerie Thomas"
            required
          />

          <Input
            label="Nomor WhatsApp"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Contoh: 081234567890"
            required
          />

          <Input
            label="Email (Opsional)"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Bentuk Kuku Favorit (Shape):
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {['Almond', 'Coffin', 'Square', 'Stiletto', 'Oval', 'Round'].map((shape) => (
                <button
                  key={shape}
                  type="button"
                  onClick={() => setNailShape(shape)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                    nailShape === shape
                      ? 'border-blush-500 bg-rose-50 text-blush-700'
                      : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                  }`}
                >
                  {shape}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Preferensi Warna / Desain"
            value={colorPref}
            onChange={(e) => setColorPref(e.target.value)}
            placeholder="Contoh: Glazed chrome donut, soft pink"
          />

          <Input
            label="Alergi / Sensitivitas Kuku"
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            placeholder="Contoh: Sensitif terhadap aseton"
          />

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              Simpan Pelanggan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
