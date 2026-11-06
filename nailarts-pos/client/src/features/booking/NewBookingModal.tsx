import React, { useState } from 'react';
import { Calendar, Clock, User, Check, Sparkles, AlertCircle } from 'lucide-react';
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
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedService = services.find(s => s.id === selectedServiceId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !artistId || !selectedServiceId) {
      setError('Mohon lengkapi data pelanggan, nail artist, dan layanan.');
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
        notes,
        items: [
          {
            serviceId: selectedService?.id,
            price: selectedService?.basePrice,
            durationMinutes: selectedService?.durationMinutes,
          },
        ],
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
      subtitle="Jadwalkan treatment kuku untuk pelanggan"
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
            Pelanggan:
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
                {c.name} ({c.phone}) - Preferensi: {c.nailShapePreference || 'Standard'}
              </option>
            ))}
          </select>
        </div>

        {/* Pilih Nail Artist & Waktu */}
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
              {['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'].map((t) => (
                <option key={t} value={t}>
                  {t} WIB
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pilih Layanan */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Layanan Nail Art:
          </label>
          <select
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blush-500/20"
            required
          >
            <option value="">-- Pilih Layanan Salon --</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.durationMinutes} mnt) - {formatRupiah(s.basePrice)}
              </option>
            ))}
          </select>
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
