import prisma from '../config/db';
import { CheckoutInput } from '../models/types';

export class PosService {
  /**
   * Menghasilkan Nomor Invoice unik: INV-YYYYMMDD-XXXX
   */
  static generateInvoiceNumber(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = Math.floor(1000 + Math.random() * 9000).toString();
    return `INV-${dateStr}-${randomHex}`;
  }

  /**
   * Helper untuk mencari Employee ID dari User ID atau Employee ID
   */
  private static async resolveEmployeeId(artistId?: string): Promise<{ employeeId: string | null; rate: number }> {
    if (!artistId) return { employeeId: null, rate: 0.20 };

    // Cek apakah artistId adalah ID Employee
    let emp = await prisma.employee.findUnique({
      where: { id: artistId },
      include: { user: true },
    });

    if (!emp) {
      // Cek apakah artistId adalah ID User
      emp = await prisma.employee.findUnique({
        where: { userId: artistId },
        include: { user: true },
      });
    }

    if (emp) {
      return { employeeId: emp.id, rate: emp.commissionRate || 0.20 };
    }

    return { employeeId: null, rate: 0.20 };
  }

  /**
   * Proses checkout transaksi POS (Didukung Database Transaction PostgreSQL)
   */
  static async processCheckout(data: CheckoutInput) {
    const {
      customerId,
      cashierId,
      artistId,
      appointmentId,
      saleType = 'WALK_IN',
      items,
      discount = 0,
      tax = 0,
      downPaymentDeducted = 0,
      paymentMethod = 'CASH',
      paymentDetails,
      notes,
    } = data;

    if (!items || items.length === 0) {
      throw new Error('Keranjang transaksi tidak boleh kosong.');
    }

    const { employeeId: primaryEmployeeId, rate: primaryRate } = await this.resolveEmployeeId(artistId);

    // Jalankan seluruh operasi dalam atomic transaction
    return await prisma.$transaction(async (tx) => {
      // Pastikan cashierId valid di database
      let resolvedCashierId = cashierId;
      const userExists = await tx.user.findUnique({ where: { id: cashierId } });
      if (!userExists) {
        const fallbackUser = await tx.user.findFirst();
        if (fallbackUser) resolvedCashierId = fallbackUser.id;
      }

      let subtotal = 0;
      let totalCommission = 0;

      const saleItemsToCreate: Array<{
        itemType: 'SERVICE' | 'PRODUCT';
        serviceId?: string;
        productId?: string;
        itemName: string;
        basePrice: number;
        quantity: number;
        addonsJson?: string;
        totalPrice: number;
        employeeCommissionAmount: number;
        assignedEmployeeId?: string | null;
        commissionRate: number;
      }> = [];

      // Validasi dan persiapkan setiap item
      for (const item of items) {
        const itemType = item.itemType || (item.productId ? 'PRODUCT' : 'SERVICE');
        const quantity = item.quantity || 1;

        if (itemType === 'PRODUCT') {
          if (!item.productId) throw new Error(`Product ID wajib disertakan untuk item produk: ${item.itemName}`);
          
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) throw new Error(`Produk '${item.itemName}' tidak ditemukan.`);
          if (product.stockQuantity < quantity) {
            throw new Error(`Stok produk '${product.name}' tidak mencukupi (Sisa: ${product.stockQuantity}, Diminta: ${quantity}).`);
          }

          const unitPrice = item.basePrice || product.retailPrice;
          const itemTotalPrice = unitPrice * quantity;
          subtotal += itemTotalPrice;

          saleItemsToCreate.push({
            itemType: 'PRODUCT',
            productId: product.id,
            itemName: product.name,
            basePrice: unitPrice,
            quantity,
            totalPrice: itemTotalPrice,
            employeeCommissionAmount: 0, // Produk retail biasanya tidak ada komisi atau komisi 0
            commissionRate: 0,
          });

          // Potong stok produk & catat mutasi inventaris
          const newQty = product.stockQuantity - quantity;
          await tx.product.update({
            where: { id: product.id },
            data: { stockQuantity: newQty },
          });

          await tx.inventoryMovement.create({
            data: {
              productId: product.id,
              movementType: 'SALE_DEDUCTION',
              quantity: -quantity,
              beforeQuantity: product.stockQuantity,
              afterQuantity: newQty,
              referenceNumber: '', // diupdate setelah invoice number dibuat
              notes: `Penjualan kasir POS`,
            },
          });
        } else {
          // SERVICE
          const addonsCost = (item.addons || []).reduce((acc, a) => acc + (a.price || 0), 0);
          const itemUnitPrice = item.basePrice + addonsCost;
          const itemTotalPrice = itemUnitPrice * quantity;
          subtotal += itemTotalPrice;

          // Hitung komisi artist
          const itemEmployee = await this.resolveEmployeeId(item.artistId || artistId);
          const itemComm = Math.round(itemTotalPrice * itemEmployee.rate);
          totalCommission += itemComm;

          saleItemsToCreate.push({
            itemType: 'SERVICE',
            serviceId: item.serviceId,
            itemName: item.itemName || (item as any).serviceName || 'Layanan Seni Kuku',
            basePrice: item.basePrice,
            quantity,
            addonsJson: item.addons && item.addons.length > 0 ? JSON.stringify(item.addons) : undefined,
            totalPrice: itemTotalPrice,
            employeeCommissionAmount: itemComm,
            assignedEmployeeId: itemEmployee.employeeId,
            commissionRate: itemEmployee.rate,
          });
        }
      }

      // Hitung Pajak & Total
      const calculatedTax = tax > 0 ? Math.round((subtotal - discount) * (tax / 100)) : 0;
      const totalAmount = Math.max(0, subtotal - discount + calculatedTax);

      // Kurangi Down Payment jika ada
      const actualDpDeducted = Math.min(downPaymentDeducted, totalAmount);
      const remainingAmount = Math.max(0, totalAmount - actualDpDeducted);

      // Hitung Nominal Bayar & Kembalian
      const cashAmount = paymentDetails?.cashAmount || 0;
      const changeAmount = paymentMethod === 'CASH' && cashAmount > remainingAmount ? cashAmount - remainingAmount : 0;
      const paidAmount = paymentMethod === 'CASH' ? cashAmount : remainingAmount;

      const invoiceNumber = this.generateInvoiceNumber();

      // Buat Transaksi Penjualan (Sale)
      const sale = await tx.sale.create({
        data: {
          invoiceNumber,
          customerId: customerId || null,
          cashierId: resolvedCashierId,
          employeeId: primaryEmployeeId,
          appointmentId: appointmentId || null,
          saleType: (saleType as any) || 'WALK_IN',
          subtotal,
          discountAmount: discount,
          taxAmount: calculatedTax,
          totalAmount,
          paidAmount,
          changeAmount,
          downPaymentDeducted: actualDpDeducted,
          remainingAmount: 0,
          status: 'PAID',
          notes,
        },
      });

      // Update referenceNumber pada inventory movements yang baru dibuat
      await tx.inventoryMovement.updateMany({
        where: { referenceNumber: '', notes: 'Penjualan kasir POS' },
        data: { referenceNumber: invoiceNumber },
      });

      // Simpan Sale Items & Buat Catatan Komisi
      for (const item of saleItemsToCreate) {
        const saleItem = await tx.saleItem.create({
          data: {
            saleId: sale.id,
            itemType: item.itemType,
            serviceId: item.serviceId,
            productId: item.productId,
            itemName: item.itemName,
            basePrice: item.basePrice,
            quantity: item.quantity,
            addonsJson: item.addonsJson,
            totalPrice: item.totalPrice,
            employeeCommissionAmount: item.employeeCommissionAmount,
          },
        });

        // Buat ledger komisi jika ada hak komisi
        if (item.employeeCommissionAmount > 0 && (item.assignedEmployeeId || primaryEmployeeId)) {
          const empId = item.assignedEmployeeId || primaryEmployeeId;
          if (empId) {
            await tx.commission.create({
              data: {
                employeeId: empId,
                saleId: sale.id,
                saleItemId: saleItem.id,
                amount: item.employeeCommissionAmount,
                commissionRate: item.commissionRate,
                status: 'PENDING',
              },
            });
          }
        }
      }

      // Simpan Catatan Pembayaran (Payments)
      // 1. Jika ada DP yang dipotong, catat sebagai DOWN_PAYMENT
      if (actualDpDeducted > 0) {
        await tx.payment.create({
          data: {
            saleId: sale.id,
            paymentMethod: 'CASH', // default atau referensi DP
            paymentType: 'DOWN_PAYMENT',
            amount: actualDpDeducted,
            referenceNumber: `DP-${invoiceNumber}`,
            receivedByUserId: resolvedCashierId,
          },
        });
      }

      // 2. Pembayaran Pelunasan / Utama
      if (paymentMethod === 'SPLIT' && paymentDetails?.splitDetails && paymentDetails.splitDetails.length > 0) {
        for (const split of paymentDetails.splitDetails) {
          await tx.payment.create({
            data: {
              saleId: sale.id,
              paymentMethod: split.method as any,
              paymentType: 'SPLIT',
              amount: split.amount,
              referenceNumber: `${split.method}-${invoiceNumber}`,
              receivedByUserId: resolvedCashierId,
            },
          });
        }
      } else {
        await tx.payment.create({
          data: {
            saleId: sale.id,
            paymentMethod: paymentMethod as any,
            paymentType: actualDpDeducted > 0 ? 'REMAINING' : 'FULL',
            amount: remainingAmount,
            referenceNumber: paymentDetails?.cardRef || paymentDetails?.qrisRef || `${paymentMethod}-${invoiceNumber}`,
            receivedByUserId: resolvedCashierId,
          },
        });
      }

      // Jika ada appointment, update status appointment menjadi COMPLETED
      if (appointmentId) {
        await tx.appointment.update({
          where: { id: appointmentId },
          data: { status: 'COMPLETED' },
        }).catch(() => null);
      }

      // Tambah loyalty points pelanggan jika ada (1 point per Rp 10.000 transaksi)
      if (customerId) {
        const earnedPoints = Math.floor(totalAmount / 10000);
        if (earnedPoints > 0) {
          await tx.customer.update({
            where: { id: customerId },
            data: { loyaltyPoints: { increment: earnedPoints } },
          }).catch(() => null);
        }
      }

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: resolvedCashierId,
          action: 'CREATE_SALE',
          entity: 'Sale',
          entityId: sale.id,
          newValuesJson: JSON.stringify({ invoiceNumber, totalAmount, paymentMethod }),
        },
      });

      // Kembalikan Sale lengkap dengan relasi
      return await tx.sale.findUnique({
        where: { id: sale.id },
        include: {
          customer: true,
          cashier: { select: { id: true, name: true, email: true } },
          employee: { include: { user: true } },
          items: true,
          payments: true,
        },
      });
    });
  }

  /**
   * Refund / Batalkan transaksi
   */
  static async refundSale(saleId: string, userId: string, reason: string) {
    return await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: { items: true },
      });

      if (!sale) throw new Error('Transaksi tidak ditemukan.');
      if (sale.status === 'REFUNDED') throw new Error('Transaksi ini sudah di-refund sebelumnya.');

      // 1. Update status transaksi
      const updated = await tx.sale.update({
        where: { id: saleId },
        data: {
          status: 'REFUNDED',
          notes: `${sale.notes || ''} [REFUNDED: ${reason}]`,
        },
      });

      // 2. Batalkan komisi
      await tx.commission.updateMany({
        where: { saleId },
        data: { status: 'CANCELLED' },
      });

      // 3. Kembalikan stok untuk produk fisik
      for (const item of sale.items) {
        if (item.itemType === 'PRODUCT' && item.productId) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (product) {
            const newQty = product.stockQuantity + item.quantity;
            await tx.product.update({
              where: { id: product.id },
              data: { stockQuantity: newQty },
            });

            await tx.inventoryMovement.create({
              data: {
                productId: product.id,
                movementType: 'ADJUSTMENT',
                quantity: item.quantity,
                beforeQuantity: product.stockQuantity,
                afterQuantity: newQty,
                referenceNumber: `REFUND-${sale.invoiceNumber}`,
                notes: `Restorasi stok akibat refund penjualan: ${reason}`,
              },
            });
          }
        }
      }

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'REFUND_SALE',
          entity: 'Sale',
          entityId: saleId,
          oldValuesJson: JSON.stringify({ status: sale.status }),
          newValuesJson: JSON.stringify({ status: 'REFUNDED', reason }),
        },
      });

      return updated;
    });
  }
}
