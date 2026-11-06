/**
 * Format angka ke format Rupiah Indonesia (Rp xx.xxx)
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

/**
 * Format tanggal Indonesia yang ramah
 */
export function formatDate(dateString: string | Date): string {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatDateOnly(dateString: string | Date): string {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

/**
 * Normalisasi nomor telepon ke format internasional WhatsApp (628xxxx)
 */
export function formatWhatsAppNumber(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

/**
 * Format pesan struk digital yang rapi dan elegan untuk dikirim via WhatsApp
 */
export function generateReceiptWhatsAppText(transaction: any): string {
  const line = '━━━━━━━━━━━━━━━━━━━━━━';
  const header =
    `🌸 *STRUK DIGITAL - NAILART STUDIO SALON* 🌸\n` +
    `Jl. Senopati Raya No. 42, Kebayoran Baru, Jakarta Selatan\n` +
    `Telp: 0812-3456-7890\n` +
    `${line}\n` +
    `🧾 *No. Invoice:* ${transaction.invoiceNumber}\n` +
    `📅 *Waktu:* ${formatDate(transaction.createdAt)}\n` +
    `💼 *Kasir:* ${transaction.cashier?.name || 'Kasir'}\n` +
    (transaction.customer ? `👤 *Pelanggan:* ${transaction.customer.name}\n` : '') +
    (transaction.artist ? `💅 *Nail Artist:* ${transaction.artist.name}\n` : '') +
    `${line}\n` +
    `📋 *RINCIAN LAYANAN:*\n`;

  let itemsText = '';
  transaction.items?.forEach((item: any) => {
    itemsText += `• *${item.quantity}x ${item.serviceName}* (${formatRupiah(item.totalPrice)})\n`;
    if (item.addonsJson) {
      try {
        const addons = JSON.parse(item.addonsJson);
        addons.forEach((a: any) => {
          itemsText += `   └ _+ ${a.name}_ (${formatRupiah(a.price)})\n`;
        });
      } catch (e) {}
    }
  });

  const totals =
    `${line}\n` +
    `💵 Subtotal: ${formatRupiah(transaction.subtotal)}\n` +
    (transaction.discount > 0 ? `🏷️ Diskon: -${formatRupiah(transaction.discount)}\n` : '') +
    (transaction.tax > 0 ? `🏛️ PPN: +${formatRupiah(transaction.tax)}\n` : '') +
    `✨ *TOTAL BAYAR:* *${formatRupiah(transaction.total)}*\n` +
    `💳 *Metode Pembayaran:* ${transaction.paymentMethod}\n` +
    `${line}\n` +
    `Terima kasih telah mempercantik kuku Anda di NailArt Studio Salon! 💖💅\n` +
    `_Kuku cantik & terawat adalah kebahagiaan kami._\n` +
    `📸 Instagram: @nailart.studio`;

  return header + itemsText + totals;
}
