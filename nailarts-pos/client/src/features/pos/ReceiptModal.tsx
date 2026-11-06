import React, { useState, useEffect } from 'react';
import { Printer, CheckCircle, MessageCircle, Send, Copy, Check } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Transaction } from '../../types';
import { formatDate, formatRupiah, formatWhatsAppNumber, generateReceiptWhatsAppText } from '../../utils/format';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
}) => {
  const [phone, setPhone] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (transaction?.customer?.phone) {
      setPhone(transaction.customer.phone);
    } else {
      setPhone('');
    }
    setCopied(false);
  }, [transaction]);

  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = () => {
    const targetPhone = formatWhatsAppNumber(phone);
    if (!targetPhone) {
      alert('Mohon masukkan nomor WhatsApp pelanggan terlebih dahulu.');
      return;
    }
    const text = generateReceiptWhatsAppText(transaction);
    const url = `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCopyText = async () => {
    const text = generateReceiptWhatsAppText(transaction);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Gagal menyalin teks struk:', err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transaksi Berhasil!"
      subtitle="Struk pembayaran siap dicetak atau dikirim via WhatsApp"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Success Alert Banner */}
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs font-semibold">
          <CheckCircle size={18} className="text-emerald-600 flex-shrink-0" />
          <span>Pembayaran sukses diverifikasi & komisi telah dicatat!</span>
        </div>

        {/* WhatsApp Digital Receipt Card */}
        <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/90 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs">
              <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <MessageCircle size={14} />
              </div>
              <span>Kirim Struk Digital via WhatsApp</span>
            </div>
            <span className="text-[10px] bg-emerald-100/90 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
              Format (+62)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="No. WhatsApp (contoh: 081234567890)"
                className="w-full text-xs py-2 px-3 pl-8 bg-white border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-800 placeholder:text-slate-400 shadow-2xs"
              />
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">📱</span>
            </div>
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs active:scale-95"
            >
              <Send size={13} />
              <span>Kirim WA</span>
            </button>
            <button
              type="button"
              onClick={handleCopyText}
              title="Salin teks struk ke clipboard"
              className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              {copied ? (
                <>
                  <Check size={13} className="text-emerald-600" />
                  <span className="text-emerald-700 font-semibold text-[11px]">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy size={13} className="text-slate-500" />
                  <span className="text-[11px]">Salin</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[10px] text-emerald-700">
            Pesan struk rapi berformat otomatis akan terbuka langsung di aplikasi WhatsApp Anda.
          </p>
        </div>

        {/* Thermal Receipt Paper Layout */}
        <div
          id="thermal-receipt"
          className="bg-white p-5 rounded-xl border border-dashed border-slate-300 font-mono text-xs text-slate-800 space-y-3 shadow-inner"
        >
          {/* Header Salon */}
          <div className="text-center border-b border-dashed border-slate-300 pb-3">
            <h3 className="font-extrabold text-sm uppercase tracking-wide">NAILART STUDIO SALON</h3>
            <p className="text-[10px] text-slate-500">Jl. Senopati Raya No. 42, Kebayoran Baru</p>
            <p className="text-[10px] text-slate-500">Jakarta Selatan • Telp: 0812-3456-7890</p>
          </div>

          {/* Invoice Info */}
          <div className="text-[11px] space-y-0.5 border-b border-dashed border-slate-300 pb-2">
            <div className="flex justify-between">
              <span className="text-slate-500">No. Invoice:</span>
              <span className="font-bold">{transaction.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Waktu:</span>
              <span>{formatDate(transaction.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Kasir:</span>
              <span>{transaction.cashier?.name || 'Kasir'}</span>
            </div>
            {transaction.customer && (
              <div className="flex justify-between">
                <span className="text-slate-500">Pelanggan:</span>
                <span className="font-semibold">{transaction.customer.name}</span>
              </div>
            )}
            {transaction.artist && (
              <div className="flex justify-between">
                <span className="text-slate-500">Nail Artist:</span>
                <span className="font-semibold">{transaction.artist.name}</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3">
            {transaction.items?.map((item, idx) => {
              const addons = item.addonsJson ? JSON.parse(item.addonsJson) : [];
              return (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between font-bold">
                    <span>{item.quantity}x {item.serviceName}</span>
                    <span>{formatRupiah(item.totalPrice)}</span>
                  </div>
                  {addons.map((a: any, aIdx: number) => (
                    <div key={aIdx} className="flex justify-between text-[10px] text-slate-500 pl-3">
                      <span>+ {a.name}</span>
                      <span>{formatRupiah(a.price)}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Summary Totals */}
          <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-3">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span>{formatRupiah(transaction.subtotal)}</span>
            </div>
            {transaction.discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Diskon:</span>
                <span>-{formatRupiah(transaction.discount)}</span>
              </div>
            )}
            {transaction.tax > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Pajak (PPN):</span>
                <span>+{formatRupiah(transaction.tax)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black pt-1">
              <span>TOTAL BAYAR:</span>
              <span>{formatRupiah(transaction.total)}</span>
            </div>
            <div className="flex justify-between text-slate-600 text-[10px]">
              <span>Metode Pembayaran:</span>
              <span className="font-bold">{transaction.paymentMethod}</span>
            </div>
          </div>

          {/* Footer Receipt Note */}
          <div className="text-center text-[10px] text-slate-500 space-y-0.5 pt-1">
            <p className="font-semibold">Terima Kasih atas Kunjungan Anda!</p>
            <p>Kuku cantik & terawat adalah kebahagiaan kami 💅</p>
            <p className="text-[9px] text-slate-400">Tag us on Instagram: @nailart.studio</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2.5 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Selesai / Tutup
          </Button>
          <Button variant="primary" className="flex-1 flex items-center justify-center gap-2" onClick={handlePrint}>
            <Printer size={16} />
            <span>Cetak Struk Thermal</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
