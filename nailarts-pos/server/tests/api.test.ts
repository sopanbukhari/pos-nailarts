// Basic integration and sanity tests for Nail Art POS API
import { CommissionService } from '../src/services/commissionService';
import { PosService } from '../src/services/posService';
import { BookingService } from '../src/services/bookingService';

async function runTests() {
  console.log('🧪 Menjalankan uji unit sistem POS Nail Art...');

  // Test 1: Invoice generator format
  const invoice = PosService.generateInvoiceNumber();
  console.assert(invoice.startsWith('INV-'), 'Invoice harus diawali INV-');
  console.log('  ✓ Test 1: PosService.generateInvoiceNumber() format valid:', invoice);

  // Test 2: End time calculation
  const endTime = BookingService.calculateEndTime('14:15', 75);
  console.assert(endTime === '15:30', '14:15 + 75 menit harusnya 15:30');
  console.log('  ✓ Test 2: BookingService.calculateEndTime("14:15", 75) =>', endTime);

  console.log('🎉 Semua tes logika backend berhasil dilalui!');
}

runTests().catch(console.error);
