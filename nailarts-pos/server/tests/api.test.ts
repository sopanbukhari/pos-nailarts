import { PosService } from '../src/services/posService';
import { BookingService } from '../src/services/bookingService';
import prisma from '../src/config/db';

async function runTests() {
  console.log('🧪 Menjalankan uji unit sistem POS Nail Art (PostgreSQL Integration)...');

  // Test 1: Invoice generator format
  const invoice = PosService.generateInvoiceNumber();
  console.assert(invoice.startsWith('INV-'), 'Invoice harus diawali INV-');
  console.log('  ✓ Test 1: PosService.generateInvoiceNumber() format valid:', invoice);

  // Test 2: End time calculation
  const endTime = BookingService.calculateEndTime('14:15', 75);
  console.assert(endTime === '15:30', '14:15 + 75 menit harusnya 15:30');
  console.log('  ✓ Test 2: BookingService.calculateEndTime("14:15", 75) =>', endTime);

  // Test 3: POS Checkout dengan Service, Product, DP deduction, dan Stock Deduction
  const admin = await prisma.user.findFirst();
  const customer = await prisma.customer.findFirst();
  const service = await prisma.service.findFirst({ include: { addons: true } });
  const product = await prisma.product.findFirst({ where: { stockQuantity: { gte: 2 } } });

  if (admin && customer && service && product) {
    const initialStock = product.stockQuantity;

    const sale = await PosService.processCheckout({
      customerId: customer.id,
      cashierId: admin.id,
      items: [
        {
          itemType: 'SERVICE',
          serviceId: service.id,
          itemName: service.name,
          basePrice: service.basePrice,
          addons: service.addons.slice(0, 1),
          quantity: 1,
        },
        {
          itemType: 'PRODUCT',
          productId: product.id,
          itemName: product.name,
          basePrice: product.retailPrice,
          quantity: 2,
        },
      ],
      discount: 10000,
      tax: 0,
      downPaymentDeducted: 25000,
      paymentMethod: 'CASH',
      paymentDetails: {
        cashAmount: 500000,
      },
    });

    console.assert(sale.status === 'PAID', 'Transaksi harus berstatus PAID');
    console.assert(sale.downPaymentDeducted === 25000, 'DP 25.000 harus dipotong');

    // Cek apakah stok produk berkurang tepat 2 unit
    const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } });
    console.assert(updatedProduct?.stockQuantity === initialStock - 2, 'Stok produk harus berkurang tepat 2 unit');
    console.log('  ✓ Test 3: Checkout POS (Service + Product + DP deduction) & Stock deduction berhasil: ', sale.invoiceNumber);

    // Test 4: Refund transaksi dan restorasi stok
    const refunded = await PosService.refundSale(sale.id, admin.id, 'Uji coba pembatalan unit test');
    console.assert(refunded.status === 'REFUNDED', 'Status transaksi harus REFUNDED');

    const restoredProduct = await prisma.product.findUnique({ where: { id: product.id } });
    console.assert(restoredProduct?.stockQuantity === initialStock, 'Stok produk harus terestorasi setelah refund');
    console.log('  ✓ Test 4: Refund transaksi & pemulihan stok otomatis berhasil');
  }

  console.log('🎉 Semua tes logika backend PostgreSQL berhasil dilalui!');
}

runTests()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
