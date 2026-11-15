import React, { useState, useEffect } from 'react';
import {
  Banknote,
  QrCode,
  CreditCard,
  Split,
  Building,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  CalendarCheck,
  Copy,
  Check,
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

type PaymentType = 'CASH' | 'QRIS' | 'CARD' | 'TRANSFER' | 'SPLIT';

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {
    items,
    selectedCustomer,
    selectedArtistId,
    appointmentId,
    downPaymentAmount,
    discount,
    discountPercent,
    taxPercent,
    getSubtotal,
    getDiscountAmount,
    getTaxAmount,
    getTotal,
    getRemainingTotal,
    clearCart,
  } = useCartStore();

  const total = getTotal();
  const payableAmount = downPaymentAmount > 0 ? getRemainingTotal() : total;

  const [paymentMethod, setPaymentMethod] = useState<PaymentType>('CASH');
  const [cashGiven, setCashGiven] = useState<number>(payableAmount);
  const [cardRef, setCardRef] = useState<string>('');
  const [transferBank, setTransferBank] = useState<string>('BCA');
  const [transferRef, setTransferRef] = useState<string>('');
  const [splitMethod2, setSplitMethod2] = useState<'QRIS' | 'TRANSFER' | 'CARD'>('QRIS');
  const [splitCash, setSplitCash] = useState<number>(Math.round(payableAmount / 2));
  const [splitOther, setSplitOther] = useState<number>(payableAmount - Math.round(payableAmount / 2));
  const [copiedBank, setCopiedBank] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync default values when payableAmount changes
  useEffect(() => {
    setCashGiven(payableAmount);
    setSplitCash(Math.round(payableAmount / 2));
    setSplitOther(payableAmount - Math.round(payableAmount / 2));
  }, [payableAmount]);

  if (!isOpen) return null;

  const change = Math.max(0, cashGiven - payableAmount);

  // Quick cash buttons
  const cashPresets = [
    payableAmount,
    Math.ceil(payableAmount / 50000) * 50000 || 50000,
    Math.ceil(payableAmount / 100000) * 100000 || 100000,
  ].filter((v, idx, arr) => arr.indexOf(v) === idx && v >= payableAmount);

  const handleCopyBankAccount = (accNum: string) => {
    navigator.clipboard.writeText(accNum);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  const handleCheckout = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      let paymentDetails: any = {};

      if (paymentMethod === 'CASH') {
        if (cashGiven < payableAmount) {
          setError('Jumlah uang tunai kurang dari total tagihan.');
          setIsSubmitting(false);
          return;
        }
        paymentDetails = {
          cashAmount: cashGiven,
          changeAmount: change,
        };
      } else if (paymentMethod === 'CARD') {
        paymentDetails = {
          cardRef: cardRef || `EDC-${Date.now().toString().slice(-6)}`,
        };
      } else if (paymentMethod === 'QRIS') {
        paymentDetails = {
          qrisRef: `QRIS-BCA-${Date.now().toString().slice(-8)}`,
        };
      } else if (paymentMethod === 'TRANSFER') {
        paymentDetails = {
          bankName: transferBank,
          transferRef: transferRef || `TRF-${transferBank}-${Date.now().toString().slice(-6)}`,
        };
      } else if (paymentMethod === 'SPLIT') {
        if (splitCash + splitOther !== payableAmount) {
          setError('Jumlah kombinasi split payment harus persis sama dengan sisa tagihan.');
          setIsSubmitting(false);
          return;
        }
        paymentDetails = {
          splitDetails: [
            { method: 'CASH', amount: splitCash },
            { method: splitMethod2, amount: splitOther },
          ],
        };
      }

      const payload = {
        customerId: selectedCustomer?.id,
        artistId: selectedArtistId || items[0]?.artistId,
        appointmentId: appointmentId || undefined,
        downPaymentDeducted: downPaymentAmount || 0,
        items: items.map((it) => ({
          itemType: it.itemType || (it.productId ? 'PRODUCT' : 'SERVICE'),
          serviceId: it.serviceId,
          productId: it.productId,
          itemName: it.serviceName,
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
      setError(err.response?.data?.message || 'Gagal memproses transaksi kasir.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pembayaran Transaksi Kasir POS"
      subtitle={`Total yang harus dibayar: ${formatRupiah(payableAmount)}`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Down Payment Summary Notice */}
        {downPaymentAmount > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarCheck size={18} className="text-amber-600" />
              <div>
                <span className="font-bold block">DP Reservasi Diterapkan</span>
                <span className="text-[11px] text-amber-700">
                  Total Servis: {formatRupiah(total)} • DP Masuk: {formatRupiah(downPaymentAmount)}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-amber-700 uppercase font-bold block">Sisa Tagihan</span>
              <span className="font-black text-amber-950 text-sm">{formatRupiah(payableAmount)}</span>
            </div>
          </div>
        )}

        {/* Payment Methods Selector Tabs */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Pilih Metode Pembayaran:
          </label>
          <div className="grid grid-cols-5 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('CASH')}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold ${
                paymentMethod === 'CASH'
                  ? 'border-blush-500 bg-rose-50/70 text-blush-700 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
              }`}
            >
              <Banknote size={18} />
              <span>Tunai</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('QRIS')}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold ${
                paymentMethod === 'QRIS'
                  ? 'border-blush-500 bg-rose-50/70 text-blush-700 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
              }`}
            >
              <QrCode size={18} />
              <span>QRIS</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('TRANSFER')}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold ${
                paymentMethod === 'TRANSFER'
                  ? 'border-blush-500 bg-rose-50/70 text-blush-700 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
              }`}
            >
              <Building size={18} />
              <span>Transfer</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('CARD')}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold ${
                paymentMethod === 'CARD'
                  ? 'border-blush-500 bg-rose-50/70 text-blush-700 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
              }`}
            >
              <CreditCard size={18} />
              <span>Debit/EDC</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('SPLIT')}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold ${
                paymentMethod === 'SPLIT'
                  ? 'border-blush-500 bg-rose-50/70 text-blush-700 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
              }`}
            >
              <Split size={18} />
              <span>Split Bill</span>
            </button>
          </div>
        </div>

        {/* Dynamic Payment Method Forms */}
        <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
          {paymentMethod === 'CASH' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Uang Diterima dari Pelanggan:
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 font-bold text-xs text-slate-400">Rp</span>
                <input
                  type="number"
                  value={cashGiven || ''}
                  onChange={(e) => setCashGiven(Number(e.target.value))}
                  placeholder="0"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-base font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blush-500/20"
                />
              </div>

              {/* Quick Cash Suggestions */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] font-semibold text-slate-400">Uang Pas / Cepat:</span>
                {cashPresets.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCashGiven(amt)}
                    className="px-2.5 py-1 bg-white border border-slate-200 hover:border-blush-400 rounded-lg text-xs font-bold text-slate-700 transition-all"
                  >
                    {formatRupiah(amt)}
                  </button>
                ))}
              </div>

              {/* Change Display */}
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-600">Uang Kembalian:</span>
                <span
                  className={`text-base font-black ${
                    cashGiven < payableAmount ? 'text-rose-500' : 'text-emerald-600'
                  }`}
                >
                  {cashGiven < payableAmount
                    ? `Kurang ${formatRupiah(payableAmount - cashGiven)}`
                    : formatRupiah(change)}
                </span>
              </div>
            </div>
          )}

          {paymentMethod === 'QRIS' && (
            <div className="text-center py-2 space-y-2">
              <div className="w-40 h-40 mx-auto bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-center">
                <div className="text-center">
                  <QrCode size={96} className="mx-auto text-slate-800" />
                  <span className="text-[10px] font-bold text-slate-500 mt-1 block">NailArt POS QRIS</span>
                </div>
              </div>
              <p className="text-xs text-slate-600">
                Pindai QRIS menggunakan BCA Mobile, GoPay, OVO, ShopeePay, atau DANA.
              </p>
              <div className="text-xs font-bold text-blush-700">
                Nominal Tagihan: {formatRupiah(payableAmount)}
              </div>
            </div>
          )}

          {paymentMethod === 'TRANSFER' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-700">Pilih Rekening Salon:</label>
                <div className="flex gap-2">
                  {['BCA', 'Mandiri'].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setTransferBank(b)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                        transferBank === b
                          ? 'bg-blush-600 text-white border-blush-600'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Bank {transferBank} • NailArt Studio
                  </span>
                  <span className="text-sm font-mono font-bold text-slate-800">
                    {transferBank === 'BCA' ? '8820-1928-111' : '1370-0012-9988'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleCopyBankAccount(
                      transferBank === 'BCA' ? '88201928111' : '137000129988'
                    )
                  }
                  className="px-2.5 py-1 text-xs font-semibold text-blush-600 hover:bg-rose-50 rounded-lg flex items-center gap-1 border border-rose-100"
                >
                  {copiedBank ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedBank ? 'Tersalin' : 'Salin No. Rek'}</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nama Pengirim / No. Ref Transfer (Opsional):
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Transfer atas nama Sisca / Ref #1234"
                  value={transferRef}
                  onChange={(e) => setTransferRef(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>
          )}

          {paymentMethod === 'CARD' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor Otorisasi / Approval Code EDC:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: APPR-893021 atau 4 Digit Akhir Kartu"
                  value={cardRef}
                  onChange={(e) => setCardRef(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Gesek kartu Debit atau Kredit pada mesin EDC, lalu catat kode persetujuan.
              </p>
            </div>
          )}

          {paymentMethod === 'SPLIT' && (
            <div className="space-y-3">
              <span className="text-xs text-slate-500 block">
                Pecah tagihan menjadi Tunai + Non-Tunai:
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Bagian 1: Tunai (Rp)
                  </label>
                  <input
                    type="number"
                    value={splitCash}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSplitCash(val);
                      setSplitOther(Math.max(0, payableAmount - val));
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-600">Bagian 2:</label>
                    <select
                      value={splitMethod2}
                      onChange={(e) => setSplitMethod2(e.target.value as any)}
                      className="text-[10px] font-bold bg-slate-100 rounded px-1 py-0.5"
                    >
                      <option value="QRIS">QRIS</option>
                      <option value="TRANSFER">Transfer</option>
                      <option value="CARD">Kartu</option>
                    </select>
                  </div>
                  <input
                    type="number"
                    value={splitOther}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSplitOther(val);
                      setSplitCash(Math.max(0, payableAmount - val));
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="text-right text-[11px] text-slate-400">
                Total Kombinasi:{' '}
                <span className="font-bold text-slate-700">
                  {formatRupiah(splitCash + splitOther)} / {formatRupiah(payableAmount)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Batal
          </Button>
          <Button
            type="button"
            variant="primary"
            className="flex-1 shadow-md shadow-blush-200"
            disabled={isSubmitting || (paymentMethod === 'CASH' && cashGiven < payableAmount)}
            onClick={handleCheckout}
          >
            {isSubmitting ? 'Memproses...' : `Konfirmasi Pembayaran • ${formatRupiah(payableAmount)}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
