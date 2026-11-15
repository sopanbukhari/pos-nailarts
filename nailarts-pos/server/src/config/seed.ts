import prisma from './db';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌸 Memulai seeding database PostgreSQL Nail Art POS & Salon Management System...');

  // 1. Bersihkan database terlebih dahulu dengan urutan foreign keys
  await prisma.auditLog.deleteMany().catch(() => {});
  await prisma.commission.deleteMany().catch(() => {});
  await prisma.payment.deleteMany().catch(() => {});
  await prisma.saleItem.deleteMany().catch(() => {});
  await prisma.sale.deleteMany().catch(() => {});
  await prisma.appointmentService.deleteMany().catch(() => {});
  await prisma.appointment.deleteMany().catch(() => {});
  await prisma.inventoryMovement.deleteMany().catch(() => {});
  await prisma.product.deleteMany().catch(() => {});
  await prisma.serviceAddon.deleteMany().catch(() => {});
  await prisma.service.deleteMany().catch(() => {});
  await prisma.serviceCategory.deleteMany().catch(() => {});
  await prisma.customer.deleteMany().catch(() => {});
  await prisma.employeeSchedule.deleteMany().catch(() => {});
  await prisma.employee.deleteMany().catch(() => {});
  await prisma.rolePermission.deleteMany().catch(() => {});
  await prisma.permission.deleteMany().catch(() => {});
  await prisma.expense.deleteMany().catch(() => {});
  await prisma.discount.deleteMany().catch(() => {});
  await prisma.user.deleteMany().catch(() => {});
  await prisma.role.deleteMany().catch(() => {});

  // 2. Buat Roles
  const roleAdmin = await prisma.role.create({
    data: {
      name: 'OWNER_ADMIN',
      displayName: 'Owner / Salon Manager',
      description: 'Akses penuh ke semua modul sistem salon, laporan finansial, dan pengaturan.',
    },
  });

  const roleCashier = await prisma.role.create({
    data: {
      name: 'CASHIER',
      displayName: 'Kasir / Resepsionis',
      description: 'Akses transaksi POS kasir, pembayaran, janji temu, dan CRM pelanggan.',
    },
  });

  const roleArtist = await prisma.role.create({
    data: {
      name: 'ARTIST',
      displayName: 'Nail Artist / Technician',
      description: 'Akses jadwal janji temu dan pencatatan komisi pengerjaan servis.',
    },
  });

  console.log('✅ Roles berhasil dibuat.');

  // 3. Permissions
  const permissionsList = [
    { code: 'pos.access', name: 'Akses POS Kasir', description: 'Membuat transaksi dan checkout' },
    { code: 'appointments.manage', name: 'Kelola Jadwal', description: 'Membuat dan mengedit janji temu' },
    { code: 'customers.manage', name: 'Kelola Pelanggan', description: 'Akses CRM dan preferensi pelanggan' },
    { code: 'inventory.manage', name: 'Kelola Inventaris', description: 'Restock dan monitoring barang' },
    { code: 'expenses.manage', name: 'Kelola Pengeluaran', description: 'Mencatat pengeluaran operasional' },
    { code: 'reports.view', name: 'Lihat Laporan Finansial', description: 'Melihat omzet, P&L, dan performa' },
    { code: 'settings.manage', name: 'Pengaturan Sistem', description: 'Konfigurasi salon, staf, dan tarif' },
  ];

  for (const p of permissionsList) {
    const perm = await prisma.permission.create({ data: p });
    // Assign all to ADMIN
    await prisma.rolePermission.create({
      data: { roleId: roleAdmin.id, permissionId: perm.id },
    });
    // Assign POS, Appointments, Customers to CASHIER
    if (['pos.access', 'appointments.manage', 'customers.manage'].includes(p.code)) {
      await prisma.rolePermission.create({
        data: { roleId: roleCashier.id, permissionId: perm.id },
      });
    }
    // Assign Appointments to ARTIST
    if (['appointments.manage'].includes(p.code)) {
      await prisma.rolePermission.create({
        data: { roleId: roleArtist.id, permissionId: perm.id },
      });
    }
  }

  // 4. Buat Pengguna & Employees (Admin, Kasir, Nail Artists)
  const passwordAdmin = await bcrypt.hash('admin123', 10);
  const passwordKasir = await bcrypt.hash('kasir123', 10);
  const passwordArtist = await bcrypt.hash('artist123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Owner / Salon Manager',
      email: 'admin@nailart.com',
      password: passwordAdmin,
      roleId: roleAdmin.id,
      phone: '081234567890',
    },
  });

  const kasir = await prisma.user.create({
    data: {
      name: 'Bella (Kasir)',
      email: 'kasir@nailart.com',
      password: passwordKasir,
      roleId: roleCashier.id,
      phone: '081234567891',
    },
  });

  const userSarah = await prisma.user.create({
    data: {
      name: 'Sarah - Senior Nail Artist',
      email: 'sarah@nailart.com',
      password: passwordArtist,
      roleId: roleArtist.id,
      phone: '081234567892',
    },
  });

  const userChloe = await prisma.user.create({
    data: {
      name: 'Chloe - Nail Art Specialist',
      email: 'chloe@nailart.com',
      password: passwordArtist,
      roleId: roleArtist.id,
      phone: '081234567893',
    },
  });

  // Employee profiles for Sarah and Chloe
  const empSarah = await prisma.employee.create({
    data: {
      userId: userSarah.id,
      employeeNumber: 'EMP-NA-001',
      position: 'Senior Nail Artist',
      commissionRate: 0.25, // 25% komisi
      baseSalary: 3000000,
    },
  });

  const empChloe = await prisma.employee.create({
    data: {
      userId: userChloe.id,
      employeeNumber: 'EMP-NA-002',
      position: 'Nail Art Specialist',
      commissionRate: 0.20, // 20% komisi
      baseSalary: 2500000,
    },
  });

  // Schedules (Monday to Saturday: 10:00 - 20:00)
  for (let day = 1; day <= 6; day++) {
    await prisma.employeeSchedule.createMany({
      data: [
        { employeeId: empSarah.id, dayOfWeek: day, startTime: '10:00', endTime: '20:00', isWorking: true },
        { employeeId: empChloe.id, dayOfWeek: day, startTime: '10:00', endTime: '20:00', isWorking: true },
      ],
    });
  }

  console.log('✅ Pengguna, Employee profiles, dan shift kerja berhasil dibuat.');

  // 5. Kategori Layanan
  const catManiPedi = await prisma.serviceCategory.create({
    data: {
      name: 'Manicure & Pedicure',
      description: 'Perawatan dasar, pembersihan kutikula, dan shaping kuku alami.',
      icon: 'sparkles',
    },
  });

  const catGelPolish = await prisma.serviceCategory.create({
    data: {
      name: 'Gel Polish & Coating',
      description: 'Pewarnaan kuteks gel tahan lama dengan formula non-chipping.',
      icon: 'palette',
    },
  });

  const catExtension = await prisma.serviceCategory.create({
    data: {
      name: 'Nail Extension',
      description: 'Penyambungan kuku menggunakan polygel, soft gel tips, atau akrilik.',
      icon: 'shield',
    },
  });

  const catArtDesign = await prisma.serviceCategory.create({
    data: {
      name: 'Nail Art Design',
      description: 'Seni lukis kuku bebas, ornamen kristal 3D, permata, dan motif trendy.',
      icon: 'heart',
    },
  });

  const catRemoval = await prisma.serviceCategory.create({
    data: {
      name: 'Removal & Treatment',
      description: 'Pelepasan kuteks gel/extension dengan aman serta nutrisi keratin kuku.',
      icon: 'refresh',
    },
  });

  console.log('✅ Kategori layanan salon berhasil dibuat.');

  // 6. Layanan Utama & Add-ons
  const srv1 = await prisma.service.create({
    data: {
      name: 'Russian E-File Dry Manicure',
      categoryId: catManiPedi.id,
      basePrice: 120000,
      durationMinutes: 45,
      description: 'Pembersihan kutikula mendalam dengan e-file mata bor diamond steril.',
      image: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=500&q=80',
    },
  });

  await prisma.serviceAddon.createMany({
    data: [
      { serviceId: srv1.id, name: 'Scrub & Masker Tangan Organik', price: 35000, extraMinutes: 15 },
      { serviceId: srv1.id, name: 'Paraffin Wax Hydration', price: 50000, extraMinutes: 20 },
    ],
  });

  const srv2 = await prisma.service.create({
    data: {
      name: 'Gel Polish Korea/Jepang Full Color',
      categoryId: catGelPolish.id,
      basePrice: 160000,
      durationMinutes: 60,
      description: 'Kuteks gel premium non-toxic tahan hingga 4-5 minggu tanpa chipping.',
      image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=500&q=80',
    },
  });

  await prisma.serviceAddon.createMany({
    data: [
      { serviceId: srv2.id, name: 'Chrome Powder Finish (Glazed Donut Effect)', price: 40000, extraMinutes: 15 },
      { serviceId: srv2.id, name: 'Cat-Eye 9D Magnet Reflection', price: 45000, extraMinutes: 15 },
      { serviceId: srv2.id, name: 'Matte Top Coat Velvet Finish', price: 20000, extraMinutes: 10 },
    ],
  });

  const srv3 = await prisma.service.create({
    data: {
      name: 'Full Set Polygel Extension + Shape',
      categoryId: catExtension.id,
      basePrice: 320000,
      durationMinutes: 90,
      description: 'Sambung kuku ringan dan kokoh bentuk Almond, Coffin, atau Square.',
      image: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=500&q=80',
    },
  });

  await prisma.serviceAddon.createMany({
    data: [
      { serviceId: srv3.id, name: 'Ekstra Panjang (Length XL)', price: 50000, extraMinutes: 20 },
      { serviceId: srv3.id, name: 'Overlay Penguat Kuku Alami', price: 30000, extraMinutes: 15 },
    ],
  });

  const srv4 = await prisma.service.create({
    data: {
      name: '3D Luxury Nail Art & Crystal Charms',
      categoryId: catArtDesign.id,
      basePrice: 240000,
      durationMinutes: 75,
      description: 'Kreasi seni kuku berhiaskan permata Swarovski, pita 3D, dan mutiara.',
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&q=80',
    },
  });

  await prisma.serviceAddon.createMany({
    data: [
      { serviceId: srv4.id, name: 'Swarovski Crystal Cluster (per 2 jari)', price: 50000, extraMinutes: 20 },
      { serviceId: srv4.id, name: 'Hand-painted French Tip / Floral Art', price: 60000, extraMinutes: 25 },
    ],
  });

  const srv5 = await prisma.service.create({
    data: {
      name: 'Safe Soak-Off Gel / Extension Removal',
      categoryId: catRemoval.id,
      basePrice: 60000,
      durationMinutes: 30,
      description: 'Pelepasan kuteks gel/extension dengan aman tanpa merusak lapisan kuku.',
      image: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=500&q=80',
    },
  });

  await prisma.serviceAddon.createMany({
    data: [
      { serviceId: srv5.id, name: 'Keratin Vitamin Nail Booster', price: 25000, extraMinutes: 10 },
    ],
  });

  console.log('✅ Menu layanan salon dan add-on berhasil dibuat.');

  // 7. Produk Retail & Bahan Inventaris
  const productsData = [
    {
      sku: 'INV-POL-001',
      name: 'Kokoist Gel Polish - Rose Nude #04',
      category: 'Gel Polish',
      retailPrice: 150000,
      costPrice: 110000,
      stockQuantity: 14,
      unit: 'botol',
      minStockAlert: 5,
    },
    {
      sku: 'INV-POL-002',
      name: 'Cat-Eye Magnet Gel - Galaxy Silver',
      category: 'Gel Polish',
      retailPrice: 135000,
      costPrice: 95000,
      stockQuantity: 8,
      unit: 'botol',
      minStockAlert: 5,
    },
    {
      sku: 'INV-TOP-001',
      name: 'Non-Wipe Glossy Gel Top Coat 15ml',
      category: 'Coating',
      retailPrice: 120000,
      costPrice: 85000,
      stockQuantity: 4, // Low stock alert!
      unit: 'botol',
      minStockAlert: 5,
    },
    {
      sku: 'INV-BASE-001',
      name: 'Rubber Base Coat Flexible 15ml',
      category: 'Coating',
      retailPrice: 125000,
      costPrice: 90000,
      stockQuantity: 12,
      unit: 'botol',
      minStockAlert: 5,
    },
    {
      sku: 'INV-TIP-001',
      name: 'Full Cover Soft Gel Tips Almond (500 pcs)',
      category: 'Tips & Extension',
      retailPrice: 195000,
      costPrice: 150000,
      stockQuantity: 2, // Low stock alert!
      unit: 'box',
      minStockAlert: 3,
    },
    {
      sku: 'INV-ACC-001',
      name: 'Swarovski Crystal Mix Assorted (1440 pcs)',
      category: 'Accessories',
      retailPrice: 290000,
      costPrice: 220000,
      stockQuantity: 6,
      unit: 'box',
      minStockAlert: 3,
    },
    {
      sku: 'INV-SAN-001',
      name: 'Pure Acetone Salon Grade 1000ml',
      category: 'Sanitizing',
      retailPrice: 90000,
      costPrice: 65000,
      stockQuantity: 9,
      unit: 'botol',
      minStockAlert: 4,
    },
    {
      sku: 'INV-TOOL-001',
      name: 'Diamond Cuticle Drill Bit Set',
      category: 'Tools',
      retailPrice: 180000,
      costPrice: 135000,
      stockQuantity: 10,
      unit: 'set',
      minStockAlert: 3,
    },
    {
      sku: 'RET-OIL-001',
      name: 'Organic Cuticle Revitalizing Oil Peach 15ml',
      category: 'Retail Care',
      retailPrice: 65000,
      costPrice: 35000,
      stockQuantity: 20,
      unit: 'botol',
      minStockAlert: 5,
    },
    {
      sku: 'RET-PRS-001',
      name: 'Handmade Luxury Press-On Nails Set (Almond Pearl)',
      category: 'Retail Beauty',
      retailPrice: 150000,
      costPrice: 75000,
      stockQuantity: 15,
      unit: 'set',
      minStockAlert: 4,
    },
  ];

  for (const item of productsData) {
    const prod = await prisma.product.create({ data: item });
    // Catat initial movement
    await prisma.inventoryMovement.create({
      data: {
        productId: prod.id,
        movementType: 'STOCK_IN',
        quantity: prod.stockQuantity,
        beforeQuantity: 0,
        afterQuantity: prod.stockQuantity,
        referenceNumber: 'INITIAL-STOCK',
        notes: 'Saldo awal inventaris salon',
      },
    });
  }

  console.log('✅ Produk retail dan inventaris salon berhasil dibuat.');

  // 8. Pelanggan (Customers)
  const cust1 = await prisma.customer.create({
    data: {
      name: 'Jessica Tanuwijaya',
      phone: '081899112233',
      email: 'jessica.tan@gmail.com',
      nailShapePreference: 'Medium Almond',
      colorPreferences: 'Nude pink, Chrome glazed, French tip',
      allergies: 'Sensitif terhadap bau aseton tajam',
      loyaltyPoints: 120,
      notes: 'Pelanggan VIP, suka kuku glossy elegan dan bersih.',
    },
  });

  const cust2 = await prisma.customer.create({
    data: {
      name: 'Nadya Putri',
      phone: '081288334455',
      email: 'nadya.putri@yahoo.com',
      nailShapePreference: 'Long Coffin',
      colorPreferences: 'Burgundy, Cat-Eye Dark Velvet, Gothic Glam',
      allergies: 'Tidak ada riwayat alergi',
      loyaltyPoints: 75,
      notes: 'Suka desain kuku panjang berani dan aksen permata gelap.',
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
      notes: 'Lebih menyukai kuku pendek rapi dan warna pastel lembut.',
    },
  });

  console.log('✅ Pelanggan dan preferensi kuku CRM berhasil dibuat.');

  // 9. Janji Temu (Appointments) Hari Ini
  const todayStr = new Date().toISOString().slice(0, 10);

  const appt1 = await prisma.appointment.create({
    data: {
      customerId: cust1.id,
      employeeId: empSarah.id,
      date: todayStr,
      startTime: '10:30',
      endTime: '11:45',
      totalEstimatedDuration: 75,
      totalPrice: 200000,
      downPaymentAmount: 50000,
      status: 'CONFIRMED',
      notes: 'Mau pasang Chrome glazed finish.',
    },
  });

  await prisma.appointmentService.create({
    data: {
      appointmentId: appt1.id,
      serviceId: srv2.id,
      price: 200000,
      durationMinutes: 75,
    },
  });

  const appt2 = await prisma.appointment.create({
    data: {
      customerId: cust2.id,
      employeeId: empChloe.id,
      date: todayStr,
      startTime: '13:00',
      endTime: '14:30',
      totalEstimatedDuration: 90,
      totalPrice: 320000,
      downPaymentAmount: 0,
      status: 'CONFIRMED',
      notes: 'Bawa foto referensi Coffin ombre.',
    },
  });

  await prisma.appointmentService.create({
    data: {
      appointmentId: appt2.id,
      serviceId: srv3.id,
      price: 320000,
      durationMinutes: 90,
    },
  });

  console.log('✅ Janji temu awal hari ini berhasil dibuat.');

  // 10. Sample Sales, SaleItems, Payments, & Commissions (History)
  const initialSale = await prisma.sale.create({
    data: {
      invoiceNumber: 'INV-20261107-1001',
      customerId: cust1.id,
      cashierId: admin.id,
      employeeId: empSarah.id,
      saleType: 'WALK_IN',
      subtotal: 155000,
      discountAmount: 15000,
      discountPercent: 0,
      taxAmount: 0,
      totalAmount: 140000,
      paidAmount: 140000,
      changeAmount: 0,
      downPaymentDeducted: 0,
      remainingAmount: 0,
      status: 'PAID',
      notes: 'Russian Manicure + Scrub',
    },
  });

  const saleItem1 = await prisma.saleItem.create({
    data: {
      saleId: initialSale.id,
      itemType: 'SERVICE',
      serviceId: srv1.id,
      itemName: 'Russian E-File Dry Manicure',
      basePrice: 120000,
      quantity: 1,
      addonsJson: JSON.stringify([{ name: 'Scrub & Masker Tangan Organik', price: 35000 }]),
      totalPrice: 155000,
      employeeCommissionAmount: 38750, // 25% of 155.000
    },
  });

  await prisma.payment.create({
    data: {
      saleId: initialSale.id,
      paymentMethod: 'CASH',
      paymentType: 'FULL',
      amount: 140000,
      receivedByUserId: admin.id,
    },
  });

  await prisma.commission.create({
    data: {
      employeeId: empSarah.id,
      saleId: initialSale.id,
      saleItemId: saleItem1.id,
      amount: 38750,
      commissionRate: 0.25,
      status: 'PENDING',
    },
  });

  // 11. Pengeluaran Operasional (Expenses)
  await prisma.expense.createMany({
    data: [
      {
        category: 'RENT',
        date: todayStr,
        description: 'Sewa ruko cabang Senopati periode bulan ini',
        amount: 7500000,
        createdByUserId: admin.id,
      },
      {
        category: 'UTILITIES',
        date: todayStr,
        description: 'Listrik, Air & Internet Fiber Optic Salon',
        amount: 1250000,
        createdByUserId: admin.id,
      },
      {
        category: 'SUPPLIES',
        date: todayStr,
        description: 'Pengadaan alkohol medis 70%, sarung tangan nitrile, dan masker',
        amount: 450000,
        createdByUserId: admin.id,
      },
    ],
  });

  // 12. Promo & Diskon
  await prisma.discount.createMany({
    data: [
      {
        code: 'GLOW10',
        name: 'Diskon Spesial 10%',
        type: 'PERCENTAGE',
        value: 10,
        minOrderAmount: 100000,
      },
      {
        code: 'WELCOME20',
        name: 'Promo Member Baru 20%',
        type: 'PERCENTAGE',
        value: 20,
        minOrderAmount: 150000,
      },
      {
        code: 'CANTIK50K',
        name: 'Potongan Langsung 50 Ribu',
        type: 'FIXED',
        value: 50000,
        minOrderAmount: 250000,
      },
    ],
  });

  // 13. Audit Log
  await prisma.auditLog.create({
    data: {
      user: { connect: { id: admin.id } },
      action: 'SYSTEM_INITIALIZATION',
      entity: 'SYSTEM',
    },
  });

  console.log('🎉 Seeding PostgreSQL database selesai dengan sukses!');
}

main()
  .catch((e) => {
    console.error('❌ Error saat seeding PostgreSQL:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
