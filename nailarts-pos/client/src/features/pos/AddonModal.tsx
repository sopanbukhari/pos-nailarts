import React, { useState } from 'react';
import { Check, Clock, Plus, Sparkles } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Service, ServiceAddon, User } from '../../types';
import { formatRupiah } from '../../utils/format';

interface AddonModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
  artists: User[];
  defaultArtistId?: string | null;
  onAddToCart: (service: Service, selectedAddons: ServiceAddon[], artistId?: string, artistName?: string) => void;
}

export const AddonModal: React.FC<AddonModalProps> = ({
  isOpen,
  onClose,
  service,
  artists,
  defaultArtistId,
  onAddToCart,
}) => {
  if (!service) return null;

  const [selectedAddons, setSelectedAddons] = useState<ServiceAddon[]>([]);
  const [selectedArtistId, setSelectedArtistId] = useState<string>(defaultArtistId || '');

  const toggleAddon = (addon: ServiceAddon) => {
    if (selectedAddons.some(a => a.name === addon.name)) {
      setSelectedAddons(selectedAddons.filter(a => a.name !== addon.name));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const extraTime = selectedAddons.reduce((sum, a) => sum + (a.extraMinutes || 0), 0);
  const totalPrice = service.basePrice + addonsTotal;
  const totalDuration = service.durationMinutes + extraTime;

  const handleConfirm = () => {
    const artist = artists.find(a => a.id === selectedArtistId);
    onAddToCart(service, selectedAddons, artist?.id, artist?.name);
    setSelectedAddons([]);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={service.name}
      subtitle={`Layanan Dasar: ${formatRupiah(service.basePrice)} • ${service.durationMinutes} menit`}
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Pilih Nail Artist untuk layanan ini */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Pilih Nail Artist (Penanggung Jawab Komisi):
          </label>
          <div className="grid grid-cols-2 gap-2">
            {artists.map((artist) => (
              <button
                key={artist.id}
                type="button"
                onClick={() => setSelectedArtistId(artist.id)}
                className={`p-2.5 rounded-xl border text-xs font-medium text-left flex items-center justify-between transition-all ${
                  selectedArtistId === artist.id
                    ? 'border-blush-500 bg-rose-50/70 text-blush-800 font-semibold shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <span>💅 {artist.name}</span>
                {selectedArtistId === artist.id && <Check size={14} className="text-blush-600" />}
              </button>
            ))}
          </div>
        </div>

        {/* Pilihan Variasi & Add-ons */}
        {service.addons && service.addons.length > 0 ? (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Pilih Tambahan / Add-on Seni Kuku:
            </label>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {service.addons.map((addon) => {
                const isSelected = selectedAddons.some(a => a.name === addon.name);
                return (
                  <div
                    key={addon.id}
                    onClick={() => toggleAddon(addon)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-blush-500 bg-rose-50/50 text-slate-900 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-5 h-5 rounded-lg flex items-center justify-center border ${
                          isSelected
                            ? 'bg-blush-600 border-blush-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{addon.name}</p>
                        <p className="text-[11px] text-slate-400">+{addon.extraMinutes} menit durasi</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-blush-700">
                      +{formatRupiah(addon.price)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 text-center text-xs text-slate-500">
            Layanan ini tidak memiliki konfigurasi add-on tambahan.
          </div>
        )}

        {/* Total Summary */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 block">Total Estimasi</span>
            <span className="text-base font-extrabold text-slate-900">
              {formatRupiah(totalPrice)}
            </span>
          </div>
          <div className="text-right text-xs text-slate-500 flex items-center gap-1 font-medium">
            <Clock size={13} className="text-slate-400" />
            <span>Total Durasi: {totalDuration} mnt</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex gap-2.5 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Batal
          </Button>
          <Button variant="primary" className="flex-1" onClick={handleConfirm}>
            Tambahkan ke Keranjang
          </Button>
        </div>
      </div>
    </Modal>
  );
};
