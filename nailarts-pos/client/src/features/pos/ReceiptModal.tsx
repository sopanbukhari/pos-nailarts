import React, { useState, useEffect, useRef } from 'react';
import {
  Printer,
  CheckCircle,
  MessageCircle,
  Send,
  Download,
  Copy,
  Check,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Transaction } from '../../types';
import { formatDate, formatRupiah, formatWhatsAppNumber } from '../../utils/format';

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
  const receiptRef = useRef<HTMLDivElement>(null);
  const [phone, setPhone] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);

  useEffect(() => {
    if (transaction?.customer?.phone) {
      setPhone(transaction.customer.phone);
    } else {
      setPhone('');
    }
    setImageCopied(false);
  }, [transaction]);

  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  /**
   * Helper untuk mengonversi elemen struk thermal ke Canvas PNG resolusi tinggi
   */
  const captureReceiptCanvas = async (): Promise<HTMLCanvasElement | null> => {
    if (!receiptRef.current) return null;
    return await html2canvas(receiptRef.current, {
      scale: 3, // Skala tinggi agar teks sangat tajam & jelas dibaca di HP
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    });
  };

  /**
   * Unduh struk sebagai file gambar PNG
   */
  const handleDownloadImage = async () => {
    setIsGenerating(true);
    try {
      const canvas = await captureReceiptCanvas();
      if (!canvas) return;

      const link = document.createElement('a');
      link.download = `Struk-${transaction.invoiceNumber}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Gagal mengunduh gambar struk:', err);
      alert('Terjadi kesalahan saat mengunduh gambar struk.');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Salin gambar struk langsung ke Clipboard (bisa langsung Ctrl+V di WhatsApp Web)
   */
  const handleCopyImage = async () => {
    setIsGenerating(true);
    try {
      const canvas = await captureReceiptCanvas();
      if (!canvas) return;

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          setImageCopied(true);
          setTimeout(() => setImageCopied(false), 3000);
        } catch (clipErr) {
          console.error('Clipboard write image failed:', clipErr);
          // Fallback download if clipboard image copy not permitted
          handleDownloadImage();
        }
      }, 'image/png');
    } catch (err) {
      console.error('Gagal menyalin gambar:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Kirim gambar struk via WhatsApp
   * Mendukung Web Share API (mobile/tablet) atau otomatis salin gambar + download + buka chat WA (desktop)
   */
  const handleSendWhatsAppImage = async () => {
    const targetPhone = formatWhatsAppNumber(phone);
    if (!targetPhone) {
      alert('Silakan masukkan nomor WhatsApp pelanggan terlebih dahulu.');
      return;
    }

    setIsGenerating(true);
    try {
      const canvas = await captureReceiptCanvas();
      if (!canvas) return;

      const defaultCaption = `Halo Kak ${transaction.customer?.name || ''}, ini struk pembayaran resmi dari NailArt Studio Salon (No. Invoice: ${transaction.invoiceNumber}). Terima kasih telah mempercantik kuku Anda bersama kami! 💅✨`;

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `Struk-${transaction.invoiceNumber}.png`, { type: 'image/png' });

        // Cek jika browser mendukung kirim file langsung via Web Share API
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `Struk ${transaction.invoiceNumber}`,
              text: defaultCaption,
            });
            return;
          } catch (shareErr) {
            console.log('Share dialog closed', shareErr);
          }
        }

        // Desktop Fallback:
        // 1. Salin gambar ke clipboard agar kasir bisa langsung tekan Ctrl+V di chat WhatsApp
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          setImageCopied(true);
          setTimeout(() => setImageCopied(false), 4000);
        } catch (clipErr) {
          console.log('Clipboard image not supported, downloading file');
        }

        // 2. Unduh otomatis file gambar
        const link = document.createElement('a');
        link.download = `Struk-${transaction.invoiceNumber}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        // 3. Buka WhatsApp chat dengan nomor pelanggan
        const waUrl = `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(defaultCaption)}`;
        window.open(waUrl, '_blank');
      }, 'image/png');
    } catch (err) {
      console.error('Gagal memproses struk gambar:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transaksi Berhasil!"
      subtitle="Struk pembayaran siap dicetak atau dibagikan sebagai gambar"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Success Alert Banner */}
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs font-semibold">
          <CheckCircle size={18} className="text-emerald-600 flex-shrink-0" />
          <span>Pembayaran sukses diverifikasi & komisi telah dicatat!</span>
        </div>

        {/* WhatsApp & Gambar Digital Receipt Card */}
        <div className="p-4 bg-emerald-50/70 border border-emerald-200/90 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs">
              <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <ImageIcon size={14} />
              </div>
              <span>Kirim Struk Digital Berupa Gambar ke WhatsApp</span>
            </div>
            <span className="text-[10px] bg-emerald-100/90 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              Format Gambar PNG
            </span>
          </div>

          {/* Input Nomor Telepon */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="No. WhatsApp (contoh: 081234567890)"
                className="w-full text-xs py-2.5 px-3 pl-8 bg-white border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-800 placeholder:text-slate-400 shadow-2xs"
              />
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">📱</span>
            </div>

            {/* Tombol Kirim Gambar ke WhatsApp */}
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleSendWhatsAppImage}
              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs active:scale-95"
            >
              {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              <span>Kirim Gambar WA</span>
            </button>
          </div>

          {/* Opsi Tambahan Gambar: Unduh & Salin Gambar */}
          <div className="flex items-center gap-2 pt-1 border-t border-emerald-200/60">
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleDownloadImage}
              className="flex-1 py-1.5 px-2.5 bg-white hover:bg-slate-50 border border-emerald-300/80 text-emerald-800 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <Download size={13} className="text-emerald-600" />
              <span>Unduh Gambar (.PNG)</span>
            </button>

            <button
              type="button"
              disabled={isGenerating}
              onClick={handleCopyImage}
              className="flex-1 py-1.5 px-2.5 bg-white hover:bg-slate-50 border border-emerald-300/80 text-emerald-800 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              {imageCopied ? (
                <>
                  <Check size={13} className="text-emerald-600" />
                  <span className="text-emerald-700">Gambar Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy size={13} className="text-slate-500" />
                  <span>Salin Gambar (Ctrl+V)</span>
                </>
              )}
            </button>
          </div>

          {imageCopied && (
            <p className="text-[11px] text-emerald-800 font-medium bg-emerald-100/70 p-2 rounded-lg border border-emerald-200 flex items-center gap-1.5">
              <Check size={14} className="text-emerald-600 flex-shrink-0" />
              <span>Gambar struk telah disalin ke clipboard! Tekan <b>Ctrl + V</b> di chat WhatsApp Web untuk mengirim.</span>
            </p>
          )}
        </div>

        {/* Thermal Receipt Paper Layout (Element ini yang dikonversi ke gambar PNG) */}
        <div
          ref={receiptRef}
          id="thermal-receipt"
          className="bg-white p-6 rounded-xl border border-dashed border-slate-300 font-mono text-xs text-slate-800 space-y-3.5 shadow-inner"
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
