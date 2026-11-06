import React from 'react';
import { Printer, CheckCircle, Share2, Flower2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Transaction } from '../../types';
import { formatDate, formatRupiah } from '../../utils/format';

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
  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transaksi Berhasil!"
      subtitle="Struk pembayaran siap dicetak untuk pelanggan"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Success Alert Banner */}
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs font-semibold">
          <CheckCircle size={18} className="text-emerald-600 flex-shrink-0" />
          <span>Pembayaran sukses diverifikasi & komisi telah dicatat!</span>
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
