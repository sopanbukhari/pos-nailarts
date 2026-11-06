import prisma from '../config/db';
import { CheckoutInput } from '../models/types';
import { CommissionService } from './commissionService';

export class PosService {
  /**
   * Menghasilkan Nomor Invoice unik: INV-YYMMDD-XXXX
   */
  static generateInvoiceNumber(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '');
    const randomHex = Math.floor(1000 + Math.random() * 9000).toString();
    return `INV-${dateStr}-${randomHex}`;
  }

  /**
   * Proses checkout transaksi POS
   */
  static async processCheckout(data: CheckoutInput) {
    const {
      customerId,
      cashierId,
      artistId,
      items,
      discount = 0,
      tax = 0,
      paymentMethod,
      paymentDetails,
    } = data;

    if (!items || items.length === 0) {
      throw new Error('Keranjang belanja tidak boleh kosong.');
    }

    // 1. Hitung Subtotal & Hitung Komisi Artist per Item
    let subtotal = 0;
    let totalCommission = 0;

    const processedItems: Array<{
      serviceId?: string;
      serviceName: string;
      basePrice: number;
      addonsJson?: string;
      quantity: number;
      totalPrice: number;
      artistCommission: number;
    }> = [];

    for (const item of items) {
      const addonsCost = (item.addons || []).reduce((acc, a) => acc + (a.price || 0), 0);
      const itemUnitPrice = item.basePrice + addonsCost;
      const itemTotalPrice = itemUnitPrice * item.quantity;
      subtotal += itemTotalPrice;

      // Hitung komisi untuk artist
      const commissionPerUnit = await CommissionService.calculateItemCommission(
        item.artistId || artistId,
        itemUnitPrice
      );
      const itemTotalCommission = commissionPerUnit * item.quantity;
      totalCommission += itemTotalCommission;

      processedItems.push({
        serviceId: item.serviceId,
        serviceName: item.serviceName,
        basePrice: item.basePrice,
        addonsJson: item.addons && item.addons.length > 0 ? JSON.stringify(item.addons) : undefined,
        quantity: item.quantity,
        totalPrice: itemTotalPrice,
        artistCommission: itemTotalCommission,
      });
    }

    const calculatedTax = tax > 0 ? Math.round((subtotal - discount) * (tax / 100)) : 0;
    const finalTotal = Math.max(0, subtotal - discount + calculatedTax);
    const invoiceNumber = this.generateInvoiceNumber();

    // 2. Simpan transaksi ke Database dengan Prisma
    const transaction = await prisma.transaction.create({
      data: {
        invoiceNumber,
        customerId: customerId || null,
        cashierId,
        artistId: artistId || null,
        subtotal,
        discount,
        tax: calculatedTax,
        total: finalTotal,
        paymentMethod,
        paymentDetailsJson: paymentDetails ? JSON.stringify(paymentDetails) : null,
        commissionAmount: totalCommission,
        status: 'COMPLETED',
        items: {
          create: processedItems,
        },
      },
      include: {
        items: true,
        customer: true,
        cashier: {
          select: { id: true, name: true, role: true },
        },
        artist: {
          select: { id: true, name: true, phone: true, commissionRate: true },
        },
      },
    });

    // 3. Tambah loyalty points pelanggan jika ada (1 point per Rp 10.000)
    if (customerId) {
      const earnedPoints = Math.floor(finalTotal / 10000);
      if (earnedPoints > 0) {
        await prisma.customer.update({
          where: { id: customerId },
          data: {
            loyaltyPoints: { increment: earnedPoints },
          },
        }).catch(() => null);
      }
    }

    return transaction;
  }
}
