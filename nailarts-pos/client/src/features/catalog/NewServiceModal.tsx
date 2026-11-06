import React, { useState } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Category } from '../../types';
import api from '../../lib/axios';

interface NewServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onServiceCreated: () => void;
}

export const NewServiceModal: React.FC<NewServiceModalProps> = ({
  isOpen,
  onClose,
  categories,
  onServiceCreated,
}) => {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [basePrice, setBasePrice] = useState<number>(100000);
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [description, setDescription] = useState('');
  const [addons, setAddons] = useState<Array<{ name: string; price: number; extraMinutes: number }>>([
    { name: '', price: 30000, extraMinutes: 15 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddAddonRow = () => {
    setAddons([...addons, { name: '', price: 25000, extraMinutes: 15 }]);
  };

  const handleRemoveAddonRow = (idx: number) => {
    setAddons(addons.filter((_, i) => i !== idx));
  };

  const handleUpdateAddon = (idx: number, field: string, val: any) => {
    const updated = [...addons];
    (updated[idx] as any)[field] = val;
    setAddons(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !categoryId || !basePrice) {
      setError('Nama layanan, kategori, dan harga dasar wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const validAddons = addons.filter(a => a.name.trim().length > 0);
      const res = await api.post('/catalog/services', {
        name,
        categoryId,
        basePrice,
        durationMinutes,
        description,
        addons: validAddons,
      });

      if (res.data.success) {
        onServiceCreated();
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menambahkan layanan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tambah Layanan Salon Baru"
      subtitle="Konfigurasi harga dasar, durasi treatment, dan add-on"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <Input
          label="Nama Layanan"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Contoh: Russian Manicure + Gel Ombre"
          required
        />

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Kategori:
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blush-500/20"
              required
            >
              <option value="">-- Pilih --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Harga Dasar (Rp):
            </label>
            <input
              type="number"
              value={basePrice || ''}
              onChange={(e) => setBasePrice(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Durasi (Menit):
            </label>
            <input
              type="number"
              value={durationMinutes || ''}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Deskripsi Layanan:
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Penjelasan detail bahan atau teknik..."
            rows={2}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blush-500/20"
          />
        </div>

        {/* Dynamic Addons Config */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Pilihan Add-on / Aksesoris Kuku Tambahan:
            </label>
            <button
              type="button"
              onClick={handleAddAddonRow}
              className="text-xs font-bold text-blush-600 hover:text-blush-700 flex items-center gap-1"
            >
              <Plus size={14} />
              <span>+ Add-on</span>
            </button>
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {addons.map((addon, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nama add-on (cth: Chrome finish)"
                  value={addon.name}
                  onChange={(e) => handleUpdateAddon(idx, 'name', e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
                <input
                  type="number"
                  placeholder="Harga"
                  value={addon.price}
                  onChange={(e) => handleUpdateAddon(idx, 'price', Number(e.target.value))}
                  className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
                <input
                  type="number"
                  placeholder="Mnt"
                  value={addon.extraMinutes}
                  onChange={(e) => handleUpdateAddon(idx, 'extraMinutes', Number(e.target.value))}
                  className="w-16 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-center"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveAddonRow(idx)}
                  className="p-1.5 text-slate-400 hover:text-rose-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2.5 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" variant="primary" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : 'Simpan Layanan'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
