import React, { useState } from 'react';
import {
  Banknote,
  QrCode,
  CreditCard,
  Split,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useCartStore } from '../../store/cartStore';
import { formatRupiah } from '../../utils/format';
import { Transaction } from '../../types';
import api from '../../lib/axios';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (transaction: Transaction) => void;
}

type PaymentType = 'CASH' | 'QRIS' | 'CARD' | 'SPLIT';

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {
    items,
    selectedCustomer,
    selectedArtistId,
    discount,
    discountPercent,
    taxPercent,
    getSubtotal,
    getDiscountAmount,
    getTaxAmount,
    getTotal,
    clearCart,
  } = useCartStore();

  const total = getTotal();

  const [paymentMethod, setPaymentMethod] = useState<PaymentType>('CASH');
  const [cashGiven, setCashGiven] = useState<number>(total);
  const [cardRef, setCardRef] = useState<string>('');
  const [splitCash, setSplitCash] = useState<number>(Math.round(total / 2));
  const [splitQris, setSplitQris] = useState<number>(total - Math.round(total / 2));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync default cash given when total changes
  React.useEffect(() => {
    setCashGiven(total);
    setSplitCash(Math.round(total / 2));
    setSplitQris(total - Math.round(total / 2));
  }, [total]);

  if (!isOpen) return null;

  const change = Math.max(0, cashGiven - total);

  // Quick cash buttons
  const cashPresets = [
    total,
    Math.ceil(total / 50000) * 50000 || 50000,
    Math.ceil(total / 100000) * 100000 || 100000,
  ].filter((v, idx, arr) => arr.indexOf(v) === idx && v >= total);

  const handleCheckout = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      let paymentDetails: any = {};

      if (paymentMethod === 'CASH') {
        if (cashGiven < total) {
          setError('Jumlah uang tunai kurang dari total tagihan.');
          setIsSubmitting(false);
          return;
        }
        paymentDetails = {
          cashAmount: cashGiven,
          changeAmount: change,
        };
      } else if (paymentMethod === 'CARD') {
        paymentDetails = { cardRef: cardRef || `EDC-${Date.now().toString().slice(-6)}` };
      } else if (paymentMethod === 'QRIS') {
        paymentDetails = { qrisRef: `QRIS-BCA-${Date.now().toString().slice(-8)}` };
      } else if (paymentMethod === 'SPLIT') {
        if (splitCash + splitQris !== total) {
          setError('Jumlah kombinasi split bill harus persis sama dengan total tagihan.');
          setIsSubmitting(false);
          return;
        }
        paymentDetails = {
          splitDetails: [
            { method: 'CASH', amount: splitCash },
            { method: 'QRIS', amount: splitQris },
          ],
        };
      }

      const payload = {
        customerId: selectedCustomer?.id,
        artistId: selectedArtistId || items[0]?.artistId,
        items: items.map(it => ({
          serviceId: it.serviceId,
          serviceName: it.serviceName,
          basePrice: it.basePrice,
          addons: it.addons,
          quantity: it.quantity,
          artistId: it.artistId,
        })),
        discount: getDiscountAmount(),
        tax: taxPercent,
        paymentMethod,
        paymentDetails,
      };

      const res = await api.post('/pos/checkout', payload);
      if (res.data.success) {
        clearCart();
        onClose();
        onSuccess(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memproses transaksi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pembayaran Transaksi POS"
      subtitle={`Total Tagihan: ${formatRupiah(total)}`}
      maxWidth="lg"
    >
      <div className="space-y-5">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Payment Methods Selector Tabs */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Metode Pembayaran:
          </label>
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('CASH')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold ${
                paymentMethod === 'CASH'
                  ? 'border-blush-500 bg-rose-50/70 text-blush-700 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
              }`}
            >
              <Banknote size={20} />
              <span>Tunai (Cash)</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('QRIS')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold ${
                paymentMethod === 'QRIS'
                  ? 'border-blush-500 bg-rose-50/70 text-blush-700 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
              }`}
            >
              <QrCode size={20} />
              <span>QRIS</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('CARD')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold ${
                paymentMethod === 'CARD'
                  ? 'border-blush-500 bg-rose-50/70 text-blush-700 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
              }`}
            >
              <CreditCard size={20} />
              <span>Kartu / EDC</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('SPLIT')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold ${
                paymentMethod === 'SPLIT'
                  ? 'border-blush-500 bg-rose-50/70 text-blush-700 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
              }`}
            >
              <Split size={20} />
              <span>Split Bill</span>
            </button>
          </div>
        </div>

        {/* Detail Per Metode */}
        {paymentMethod === 'CASH' && (
          <div className="space-y-3 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Uang Diterima dari Pelanggan:
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                <input
                  type="number"
                  value={cashGiven || ''}
                  onChange={(e) => setCashGiven(Number(e.target.value))}
                  className="w-full pl-10 pr-3 py-2 bg-white rounded-xl border border-slate-200 font-bold text-base text-slate-800 focus:outline-none focus:ring-2 focus:ring-blush-500/20"
                />
              </div>
            </div>

            {/* Quick cash suggestions */}
            <div className="flex gap-2">
              {cashPresets.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setCashGiven(val)}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:border-blush-400"
                >
                  {val === total ? 'Uang Pas' : formatRupiah(val)}
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Kembalian:</span>
              <span
                className={`text-base font-extrabold ${
                  cashGiven >= total ? 'text-emerald-600' : 'text-rose-500'
                }`}
              >
                {formatRupiah(change)}
              </span>
            </div>
          </div>
        )}

        {paymentMethod === 'QRIS' && (
          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 flex flex-col items-center text-center space-y-3">
            <div className="w-36 h-36 bg-slate-100 border border-slate-200 rounded-xl p-2 flex items-center justify-center">
              {/* Dynamic QRIS Placeholder */}
              <div className="w-full h-full bg-slate-900 rounded-lg p-2 text-white flex flex-col items-center justify-center">
                <QrCode size={80} className="text-white" />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Scan QRIS BCA / ShopeePay / GoPay</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Pastikan nominal yang ditransfer pas {formatRupiah(total)}
              </p>
            </div>
          </div>
        )}

        {paymentMethod === 'CARD' && (
          <div className="space-y-3 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80">
            <Input
              label="Nomor Ref / Approval Code EDC"
              value={cardRef}
              onChange={(e) => setCardRef(e.target.value)}
              placeholder="Contoh: REF-88129031"
            />
            <p className="text-[11px] text-slate-400">
              Gesek atau tap kartu debit/kredit pelanggan pada mesin EDC salon.
            </p>
          </div>
        )}

        {paymentMethod === 'SPLIT' && (
          <div className="space-y-3 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80">
            <p className="text-xs font-medium text-slate-600">
              Bagi pembayaran antara Tunai (Cash) dan QRIS:
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Porsi Cash:</label>
                <input
                  type="number"
                  value={splitCash}
                  onChange={(e) => {
                    const c = Number(e.target.value);
                    setSplitCash(c);
                    setSplitQris(total - c);
                  }}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Porsi QRIS:</label>
                <input
                  type="number"
                  value={splitQris}
                  onChange={(e) => {
                    const q = Number(e.target.value);
                    setSplitQris(q);
                    setSplitCash(total - q);
                  }}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between pt-1">
              <span>Total Porsi: {formatRupiah(splitCash + splitQris)}</span>
              <span className={splitCash + splitQris === total ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}>
                {splitCash + splitQris === total ? '✓ Seimbang' : '✕ Tidak Seimbang'}
              </span>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2.5 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>
            Kembali
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleCheckout}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Memproses Transaksi...' : `Selesaikan & Cetak Struk`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
