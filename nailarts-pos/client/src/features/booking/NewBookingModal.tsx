import React, { useState } from 'react';
import { Calendar, Clock, User, Check, Sparkles, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Customer, Service, User as ArtistUser } from '../../types';
import { formatRupiah } from '../../utils/format';
import api from '../../lib/axios';

interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  artists: ArtistUser[];
  services: Service[];
  onBookingCreated: () => void;
}

export const NewBookingModal: React.FC<NewBookingModalProps> = ({
  isOpen,
  onClose,
  customers,
  artists,
  services,
  onBookingCreated,
}) => {
  const [customerId, setCustomerId] = useState('');
  const [artistId, setArtistId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('11:00');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [downPaymentAmount, setDownPaymentAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleService = (sId: string) => {
    if (selectedServiceIds.includes(sId)) {
      setSelectedServiceIds(selectedServiceIds.filter((id) => id !== sId));
    } else {
      setSelectedServiceIds([...selectedServiceIds, sId]);
    }
  };

  const selectedServices = services.filter((s) => selectedServiceIds.includes(s.id));
  const totalDuration = selectedServices.reduce((acc, s) => acc + (s.durationMinutes || 45), 0);
  const totalPrice = selectedServices.reduce((acc, s) => acc + (s.basePrice || 0), 0);

  // Quick calculate estimated end time
  const [startH, startM] = startTime.split(':').map(Number);
  const endMinutesTotal = startH * 60 + (startM || 0) + totalDuration;
  const endH = Math.floor(endMinutesTotal / 60) % 24;
  const endM = endMinutesTotal % 60;
  const calculatedEndTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !artistId || selectedServiceIds.length === 0) {
      setError('Mohon lengkapi data pelanggan, nail artist, dan minimal 1 layanan kuku.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.post('/bookings', {
        customerId,
        artistId,
        date,
        startTime,
        downPaymentAmount: Number(downPaymentAmount) || 0,
        notes: notes.trim() || undefined,
        items: selectedServices.map((s) => ({
          serviceId: s.id,
          price: s.basePrice,
          durationMinutes: s.durationMinutes,
        })),
      });

      if (res.data.success) {
        onBookingCreated();
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menjadwalkan booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Buat Janji Temu (Booking Baru)"
      subtitle="Jadwalkan treatment kuku untuk pelanggan dengan sistem anti double-booking"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Pilih Pelanggan */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Pelanggan (Customer):
          </label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blush-500/20"
            required
          >
            <option value="">-- Pilih Pelanggan --</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone}) - {c.nailShapePreference ? `Preferensi: ${c.nailShapePreference}` : 'Umum'}
              </option>
            ))}
          </select>
        </div>

        {/* Pilih Nail Artist, Tanggal & Jam */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nail Artist:
            </label>
            <select
              value={artistId}
              onChange={(e) => setArtistId(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blush-500/20"
              required
            >
              <option value="">-- Pilih Artis --</option>
              {artists.map((a) => (
                <option key={a.id} value={a.id}>
                  💅 {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tanggal:
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Jam Mulai:
            </label>
            <select
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium"
            >
              {[
                '09:00',
                '10:00',
                '11:00',
                '12:00',
                '13:00',
                '14:00',
                '15:00',
                '16:00',
                '17:00',
                '18:00',
                '19:00',
              ].map((t) => (
                <option key={t} value={t}>
                  {t} WIB
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pilih Layanan (Multi-Service Support) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Pilih Layanan Seni Kuku ({selectedServices.length} dipilih):
            </label>
            {totalDuration > 0 && (
              <span className="text-[11px] font-bold text-blush-700">
                Total Estimasi: {totalDuration} menit (s/d {calculatedEndTime} WIB)
              </span>
            )}
          </div>

          <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1 bg-slate-50/50">
            {services.map((s) => {
              const isChecked = selectedServiceIds.includes(s.id);
              return (
                <label
                  key={s.id}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all text-xs ${
                    isChecked
                      ? 'bg-rose-50 border border-blush-300 text-blush-950 font-bold'
                      : 'hover:bg-slate-100/80 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleService(s.id)}
                      className="rounded text-blush-600 focus:ring-blush-500"
                    />
                    <span>{s.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      ({s.durationMinutes} mnt)
                    </span>
                  </div>
                  <span className="font-semibold">{formatRupiah(s.basePrice)}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Down Payment (DP) & Ringkasan */}
        <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              Uang Muka / Down Payment (DP):
            </label>
            <span className="text-[10px] text-amber-700">
              *Akan dipotongkan otomatis saat checkout POS
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">Rp</span>
              <input
                type="number"
                value={downPaymentAmount || ''}
                onChange={(e) => setDownPaymentAmount(Number(e.target.value))}
                placeholder="0"
                min="0"
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Quick DP presets */}
            {[0, 50000, 100000].map((dpVal) => (
              <button
                key={dpVal}
                type="button"
                onClick={() => setDownPaymentAmount(dpVal)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  downPaymentAmount === dpVal
                    ? 'bg-amber-600 text-white'
                    : 'bg-white border border-amber-200 text-amber-800 hover:bg-amber-100'
                }`}
              >
                {dpVal === 0 ? 'Tanpa DP' : formatRupiah(dpVal)}
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-amber-200/60 flex justify-between text-xs text-amber-950">
            <span>Estimasi Total: <strong>{formatRupiah(totalPrice)}</strong></span>
            <span>
              Sisa Saat Treatment:{' '}
              <strong className="text-rose-700">
                {formatRupiah(Math.max(0, totalPrice - downPaymentAmount))}
              </strong>
            </span>
          </div>
        </div>

        {/* Catatan / Request Khusus */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Catatan Tambahan / Desain Kuku yang Diinginkan:
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contoh: Bawa referensi foto nail art dari Pinterest, kuku minta dipendekkan sedikit..."
            rows={2}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blush-500/20"
          />
        </div>

        <div className="flex gap-2.5 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" variant="primary" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? 'Menjadwalkan...' : 'Konfirmasi Booking'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
