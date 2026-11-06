import prisma from './db';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌸 Memulai seeding database Nail Art POS...');

  // 1. Bersihkan database terlebih dahulu
  await prisma.transactionItem.deleteMany().catch(() => {});
  await prisma.transaction.deleteMany().catch(() => {});
  await prisma.bookingItem.deleteMany().catch(() => {});
  await prisma.booking.deleteMany().catch(() => {});
  await prisma.serviceAddon.deleteMany().catch(() => {});
  await prisma.service.deleteMany().catch(() => {});
  await prisma.category.deleteMany().catch(() => {});
  await prisma.customer.deleteMany().catch(() => {});
  await prisma.inventoryItem.deleteMany().catch(() => {});
  await prisma.user.deleteMany().catch(() => {});

  // 2. Buat Pengguna (Admin, Kasir, Nail Artist)
  const passwordAdmin = await bcrypt.hash('admin123', 10);
  const passwordKasir = await bcrypt.hash('kasir123', 10);
  const passwordArtist = await bcrypt.hash('artist123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Owner / Salon Manager',
      email: 'admin@nailart.com',
      password: passwordAdmin,
      role: 'ADMIN',
      phone: '081234567890',
      commissionRate: 0,
    },
  });

  const kasir = await prisma.user.create({
    data: {
      name: 'Bella (Kasir)',
      email: 'kasir@nailart.com',
      password: passwordKasir,
      role: 'CASHIER',
      phone: '081234567891',
      commissionRate: 0,
    },
  });

  const artistSarah = await prisma.user.create({
    data: {
      name: 'Sarah - Senior Nail Artist',
      email: 'sarah@nailart.com',
      password: passwordArtist,
      role: 'ARTIST',
      phone: '081234567892',
      commissionRate: 0.25, // 25% komisi
    },
  });

  const artistChloe = await prisma.user.create({
    data: {
      name: 'Chloe - Nail Art Specialist',
      email: 'chloe@nailart.com',
      password: passwordArtist,
      role: 'ARTIST',
      phone: '081234567893',
      commissionRate: 0.20, // 20% komisi
    },
  });

  console.log('✅ Pengguna (Admin, Kasir, Nail Artists) berhasil dibuat.');

  // 3. Kategori Layanan
  const catManicure = await prisma.category.create({
    data: { name: 'Manicure & Pedicure', description: 'Perawatan kuku dasar dan higienis', icon: 'Sparkles' },
  });
  const catGel = await prisma.category.create({
    data: { name: 'Gel Polish & Coating', description: 'Pewarnaan kuteks gel UV tahan lama', icon: 'Palette' },
  });
  const catExtension = await prisma.category.create({
    data: { name: 'Nail Extension', description: 'Sambung kuku Polygel, Acrylic & Soft Gel Tips', icon: 'Scissors' },
  });
  const catArt = await prisma.category.create({
    data: { name: 'Nail Art Design', description: 'Desain kustom, 3D charm, glitter, chrome & ombre', icon: 'Wand2' },
  });
  const catRemoval = await prisma.category.create({
    data: { name: 'Removal & Treatment', description: 'Pembersihan gel lama & vitamin keratin kuku', icon: 'ShieldCheck' },
  });

  // 4. Layanan & Add-ons
  // Russian Manicure
  const sRussian = await prisma.service.create({
    data: {
      name: 'Russian E-File Dry Manicure',
      categoryId: catManicure.id,
      basePrice: 120000,
      durationMinutes: 45,
      description: 'Pembersihan kutikula mendalam dengan e-file mata bor diamond steril.',
      addons: {
        create: [
          { name: 'Scrub & Masker Tangan Organik', price: 35000, extraMinutes: 15 },
          { name: 'Paraffin Wax Hydration', price: 50000, extraMinutes: 20 },
        ],
      },
    },
  });

  // Gel Polish Premium
  const sGel = await prisma.service.create({
    data: {
      name: 'Gel Polish Korea/Jepang Full Color',
      categoryId: catGel.id,
      basePrice: 160000,
      durationMinutes: 60,
      description: 'Kuteks gel premium non-toxic tahan hingga 4-5 minggu tanpa chipping.',
      addons: {
        create: [
          { name: 'Chrome Powder Finish (Glazed Donut Effect)', price: 40000, extraMinutes: 15 },
          { name: 'Cat-Eye 9D Magnet Reflection', price: 45000, extraMinutes: 15 },
          { name: 'Matte Top Coat Velvet Finish', price: 20000, extraMinutes: 10 },
        ],
      },
    },
  });

  // Nail Extension
  const sExtension = await prisma.service.create({
    data: {
      name: 'Full Set Polygel Extension + Shape',
      categoryId: catExtension.id,
      basePrice: 320000,
      durationMinutes: 90,
      description: 'Sambung kuku ringan dan kokoh bentuk Almond, Coffin, atau Square.',
      addons: {
        create: [
          { name: 'Ekstra Panjang (Length XL)', price: 50000, extraMinutes: 20 },
          { name: 'Overlay Penguat Kuku Alami', price: 30000, extraMinutes: 10 },
        ],
      },
    },
  });

  // 3D Custom Nail Art
  const sArt = await prisma.service.create({
    data: {
      name: '3D Luxury Nail Art & Crystal Charms',
      categoryId: catArt.id,
      basePrice: 240000,
      durationMinutes: 75,
      description: 'Kreasi seni kuku berhiaskan permata Swarovski, pita 3D, dan mutiara.',
      addons: {
        create: [
          { name: 'Swarovski Crystal Cluster (per 2 jari)', price: 50000, extraMinutes: 15 },
          { name: 'Hand-painted French Tip / Floral Art', price: 60000, extraMinutes: 20 },
        ],
      },
    },
  });

  // Removal
  const sRemoval = await prisma.service.create({
    data: {
      name: 'Safe Soak-Off Gel / Extension Removal',
      categoryId: catRemoval.id,
      basePrice: 60000,
      durationMinutes: 30,
      description: 'Pelepasan kuteks gel/extension dengan aman tanpa merusak lapisan kuku.',
      addons: {
        create: [
          { name: 'Keratin Vitamin Nail Booster', price: 25000, extraMinutes: 10 },
        ],
      },
    },
  });

  console.log('✅ Kategori dan Layanan Nail Art berhasil dibuat.');

  // 5. Data Pelanggan CRM
  const cust1 = await prisma.customer.create({
    data: {
      name: 'Jessica Tanuwijaya',
      phone: '081899112233',
      email: 'jessica@gmail.com',
      nailShapePreference: 'Medium Almond',
      colorPreferences: 'Nude pink, Chrome glazed, French tip',
      allergies: 'Sensitif terhadap bau aseton tajam',
      loyaltyPoints: 120,
      notes: 'Pelanggan VIP mingguan, suka teh hangat saat perawatan',
    },
  });

  const cust2 = await prisma.customer.create({
    data: {
      name: 'Nadya Putri',
      phone: '081288334455',
      email: 'nadya.p@yahoo.com',
      nailShapePreference: 'Long Coffin',
      colorPreferences: 'Burgundy, Cat-Eye Dark Velvet, Gothic Glam',
      allergies: 'Tidak ada riwayat alergi',
      loyaltyPoints: 75,
      notes: 'Suka artist Sarah untuk sambung polygel',
    },
  });

  const cust3 = await prisma.customer.create({
    data: {
      name: 'Clara Michelle',
      phone: '085711223344',
      email: 'clara.m@gmail.com',
      nailShapePreference: 'Short Square',
      colorPreferences: 'Pastel lilac, Baby blue, Clean girl aesthetic',
      allergies: 'Kutikula mudah berdarah jika terlalu ditekan',
      loyaltyPoints: 40,
    },
  });

  console.log('✅ Pelanggan CRM berhasil dibuat.');

  // 6. Inventaris Salon Kuku
  await prisma.inventoryItem.createMany({
    data: [
      { sku: 'INV-POL-001', name: 'Kokoist Gel Polish - Rose Nude #04', category: 'Gel Polish', stockQuantity: 14, unit: 'botol', minStockAlert: 5, costPrice: 110000, supplier: 'Kokoist ID' },
      { sku: 'INV-POL-002', name: 'Cat-Eye Magnet Gel - Galaxy Silver', category: 'Gel Polish', stockQuantity: 8, unit: 'botol', minStockAlert: 4, costPrice: 95000, supplier: 'NailSupply JK' },
      { sku: 'INV-TOP-001', name: 'Non-Wipe Glossy Gel Top Coat 15ml', category: 'Coating', stockQuantity: 3, unit: 'botol', minStockAlert: 5, costPrice: 85000, supplier: 'Gelish Official' }, // Low stock!
      { sku: 'INV-BASE-001', name: 'Rubber Base Coat Flexible 15ml', category: 'Coating', stockQuantity: 12, unit: 'botol', minStockAlert: 5, costPrice: 90000, supplier: 'Gelish Official' },
      { sku: 'INV-TIP-001', name: 'Full Cover Soft Gel Tips Almond (500 pcs)', category: 'Tips & Extension', stockQuantity: 2, unit: 'box', minStockAlert: 3, costPrice: 150000, supplier: 'Apres Nails' }, // Low stock!
      { sku: 'INV-ACC-001', name: 'Swarovski Crystal Mix Assorted (1440 pcs)', category: 'Accessories', stockQuantity: 6, unit: 'box', minStockAlert: 3, costPrice: 220000, supplier: 'Sparkle Gem Store' },
      { sku: 'INV-SAN-001', name: 'Pure Acetone Salon Grade 1000ml', category: 'Sanitizing', stockQuantity: 9, unit: 'botol', minStockAlert: 4, costPrice: 65000, supplier: 'Kimia Farma' },
      { sku: 'INV-TOOL-001', name: 'Diamond Cuticle Drill Bit Set', category: 'Tools', stockQuantity: 10, unit: 'set', minStockAlert: 3, costPrice: 135000, supplier: 'Staleks Pro' },
    ],
  });

  console.log('✅ Data Inventaris dan alert stok berhasil dibuat.');

  // 7. Booking Aktif & Riwayat Transaksi POS
  const todayStr = new Date().toISOString().slice(0, 10);

  // Booking Hari Ini
  const booking1 = await prisma.booking.create({
    data: {
      customerId: cust1.id,
      artistId: artistSarah.id,
      date: todayStr,
      startTime: '13:00',
      endTime: '14:15',
      status: 'CONFIRMED',
      notes: 'Ingin request chrome glazed donut kuku tangan kanan & kiri',
      totalPrice: 200000,
      items: {
        create: [
          {
            serviceId: sGel.id,
            addonNamesJson: JSON.stringify(['Chrome Powder Finish (Glazed Donut Effect)']),
            price: 200000,
          },
        ],
      },
    },
  });

  const booking2 = await prisma.booking.create({
    data: {
      customerId: cust2.id,
      artistId: artistChloe.id,
      date: todayStr,
      startTime: '15:30',
      endTime: '17:00',
      status: 'PENDING',
      notes: 'Extension polygel warna maroon/burgundy',
      totalPrice: 320000,
      items: {
        create: [
          {
            serviceId: sExtension.id,
            addonNamesJson: JSON.stringify([]),
            price: 320000,
          },
        ],
      },
    },
  });

  // Contoh Transaksi Hari Ini
  const tx1 = await prisma.transaction.create({
    data: {
      invoiceNumber: `INV-${todayStr.replace(/-/g, '').slice(2)}-1001`,
      customerId: cust3.id,
      cashierId: kasir.id,
      artistId: artistSarah.id,
      subtotal: 155000,
      discount: 15000,
      tax: 0,
      total: 140000,
      paymentMethod: 'QRIS',
      paymentDetailsJson: JSON.stringify({ qrisRef: 'QRIS-BCA-987654321' }),
      commissionAmount: 38750, // 25% of subtotal
      status: 'COMPLETED',
      items: {
        create: [
          {
            serviceId: sRussian.id,
            serviceName: 'Russian E-File Dry Manicure',
            basePrice: 120000,
            addonsJson: JSON.stringify([{ name: 'Scrub & Masker Tangan Organik', price: 35000 }]),
            quantity: 1,
            totalPrice: 155000,
            artistCommission: 38750,
          },
        ],
      },
    },
  });

  console.log('✅ Sample Transaksi dan Booking berhasil dibuat.');
  console.log('✨ Seeding database selesai sempurna!');
}

main()
  .catch((e) => {
    console.error('Error saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
