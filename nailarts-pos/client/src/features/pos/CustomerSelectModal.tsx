import React, { useState } from 'react';
import { Search, UserPlus, Check, Sparkles } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Customer } from '../../types';
import api from '../../lib/axios';

interface CustomerSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  selectedCustomerId?: string | null;
  onSelectCustomer: (customer: Customer) => void;
  onCustomerCreated: (customer: Customer) => void;
}

export const CustomerSelectModal: React.FC<CustomerSelectModalProps> = ({
  isOpen,
  onClose,
  customers,
  selectedCustomerId,
  onSelectCustomer,
  onCustomerCreated,
}) => {
  const [search, setSearch] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // New customer form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [nailShape, setNailShape] = useState('Almond');
  const [colorPref, setColorPref] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.post('/customers', {
        name,
        phone,
        nailShapePreference: nailShape,
        colorPreferences: colorPref,
      });

      if (res.data.success) {
        onCustomerCreated(res.data.data);
        onSelectCustomer(res.data.data);
        setIsCreatingNew(false);
        setName('');
        setPhone('');
        setColorPref('');
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan data pelanggan baru.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCreatingNew ? 'Daftarkan Pelanggan Baru' : 'Pilih Pelanggan Salon'}
      subtitle={isCreatingNew ? 'Catat preferensi bentuk kuku dan kontak' : 'Cari berdasarkan nama atau no. handphone'}
      maxWidth="md"
    >
      {isCreatingNew ? (
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
              {error}
            </div>
          )}

          <Input
            label="Nama Lengkap"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Chelsea Olivia"
            required
          />

          <Input
            label="Nomor WhatsApp / HP"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Contoh: 08123456789"
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Preferensi Bentuk Kuku (Nail Shape):
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
            label="Preferensi Warna / Catatan Tambahan"
            value={colorPref}
            onChange={(e) => setColorPref(e.target.value)}
            placeholder="Contoh: Suka warna Nude, alergi lem aseton tajam"
          />

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setIsCreatingNew(false)}
            >
              Kembali ke Daftar
            </Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan & Pilih'}
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-3">
          {/* Search bar & Add new button */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama / nomor telp..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blush-500/20"
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="flex items-center gap-1.5 text-xs font-bold"
              onClick={() => setIsCreatingNew(true)}
            >
              <UserPlus size={14} />
              <span>Baru</span>
            </Button>
          </div>

          {/* Customer list */}
          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {filtered.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-6">
                Tidak ada data pelanggan yang cocok.
              </p>
            ) : (
              filtered.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    onSelectCustomer(c);
                    onClose();
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedCustomerId === c.id
                      ? 'border-blush-500 bg-rose-50/60 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-800">{c.name}</p>
                      {c.nailShapePreference && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                          {c.nailShapePreference}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">{c.phone}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-amber-600">
                      ⭐ {c.loyaltyPoints} pts
                    </span>
                    {selectedCustomerId === c.id && (
                      <Check size={16} className="text-blush-600 font-bold" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};
