# 💅 NailArt Studio POS & Salon Management System

Sistem Point of Sale (POS) dan Salon Management operasional kelas produksi untuk salon kuku (nail art salon). Dibangun menggunakan arsitektur modern fullstack: **React + TypeScript + Tailwind CSS** (Frontend), **Node.js + Express** (Backend), **PostgreSQL 18** (Database), dan **Prisma ORM**.

---

## 🏗️ Tech Stack & Arsitektur

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite, Zustand (State Management), Lucide Icons, Axios.
- **Backend**: Node.js, Express, TypeScript, Prisma ORM 6.4.1.
- **Database**: PostgreSQL (Relasional, Normalized, ACID Transaction).
- **Autentikasi & Keamanan**: JWT (JSON Web Token), Bcrypt Password Hashing, Role-Based Access Control (RBAC).
- **Testing**: Automated Unit & Integration Tests (Tsx, PostgreSQL Transaction Runner).

---

## 👥 Peran Pengguna (User Roles & RBAC)

1. **Owner / Admin (`OWNER_ADMIN`, `ADMIN`)**: Akses penuh ke seluruh fitur kasir, inventaris, booking, komisi staf, pengeluaran, laporan laba rugi (P&L), log audit, dan pengaturan salon.
2. **Kasir / Resepsionis (`CASHIER`)**: Akses kasir POS, janji temu (booking), katalog layanan, database pelanggan, stok inventaris, dan pencatatan pengeluaran harian.
3. **Nail Artist / Teknisi (`ARTIST`)**: Akses melihat antrian janji temu, riwayat treatment pelanggan, dan rekap perolehan komisi pengerjaan sendiri.

### Akun Bawaan (Default Credentials)

| Peran (Role) | Email | Password | Hak Akses |
| :--- | :--- | :--- | :--- |
| **Owner / Admin** | `admin@nailart.com` | `admin123` | Semua Modul + Laporan P&L + Log Audit |
| **Kasir / Resepsionis** | `kasir@nailart.com` | `kasir123` | POS, Booking, Pelanggan, Stok, Pengeluaran |
| **Senior Artist (25%)** | `sarah@nailart.com` | `artist123` | Booking, Treatment, Rekap Komisi 25% |
| **Art Specialist (20%)** | `chloe@nailart.com` | `artist123` | Booking, Treatment, Rekap Komisi 20% |

*(Di layar Login, tersedia tombol Demo Login 1-klik untuk pengujian cepat).*

---

## 📦 Skema Database PostgreSQL (21 Model Prisma)

Aplikasi menggunakan skema database relasional yang ternormalisasi:

1. `users`: Kredensial akun, peran, nomor telepon, status aktif.
2. `roles`: Definisi peran (OWNER_ADMIN, CASHIER, ARTIST).
3. `permissions`: Daftar hak akses granular.
4. `role_permissions`: Pemetaan relasi Many-to-Many antara Role dan Permission.
5. `employees`: Profil detail karyawan/teknisi, nomor induk, tarif komisi default (`commissionRate`).
6. `employee_schedules`: Jadwal kerja mingguan dan jam shift nail artist.
7. `customers`: CRM pelanggan, nomor WhatsApp, preferensi bentuk kuku (Almond, Coffin, Oval, Square, Stiletto), riwayat alergi, dan akumulasi loyalty points.
8. `service_categories`: Kategori layanan treatment salon.
9. `services`: Layanan dasar seni kuku, harga, durasi pengerjaan menit, dan status aktif.
10. `service_addons`: Variasi add-on (Chrome powder, charm 3D, swarovski, extra length, massage).
11. `products`: Perlengkapan salon & produk retail (kuteks gel, base/top coat, cuticle oil, press-on nails) dengan `retailPrice`, `costPrice`, `stockQuantity`, `minStockAlert`, dan `unit`.
12. `inventory_movements`: Log mutasi pergerakan stok fisik (STOCK_IN, STOCK_OUT, SALE_DEDUCTION, ADJUSTMENT, REFUND_RESTORE).
13. `appointments`: Jadwal reservasi janji temu dengan kalkulasi durasi, anti double-booking, uang muka (DP), dan status (PENDING, CONFIRMED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW).
14. `appointment_services`: Pemetaan layanan yang dipesan dalam satu janji temu.
15. `sales`: Transaksi penjualan kasir (No. Invoice unik, subtotal, diskon, pajak PPN, DP deducted, remaining amount, status).
16. `sale_items`: Snapshot layanan atau produk yang terjual beserta atribut komisi artis.
17. `payments`: Catatan pembayaran transaksi (CASH, QRIS, CARD, BANK_TRANSFER, SPLIT, DOWN_PAYMENT).
18. `commissions`: Hak komisi teknisi per transaksi dengan status `PENDING` atau `PAID` dan tanggal payout.
19. `expenses`: Beban pengeluaran operasional studio salon berdasarkan kategori (RENT, UTILITIES, SUPPLIES, SALARY, MARKETING, MAINTENANCE, OTHER).
20. `discounts`: Kupon dan promosi diskon salon.
21. `audit_logs`: Log jejak audit keamanan seluruh operasi penting (CREATE_SALE, REFUND_SALE, CREATE_EXPENSE, CANCEL_APPOINTMENT, dll).

---

## 🎯 10 Modul Operasional Utama

### 1. Point of Sale (Kasir POS)
- Tab toggle antara **💅 Layanan Seni Kuku** dan **🛍️ Produk Retail & Perawatan**.
- Pencarian cerdas dan filter kategori layanan / produk.
- Konfigurasi Add-on dinamis dengan penambahan durasi dan harga secara langsung.
- Penugasan Nail Artist per item layanan untuk pembagian komisi akurat.
- Diskon persentase instan (5%, 10%, 15%, 20%) dan kalkulasi PPN 11%.
- Potongan Uang Muka (Down Payment / DP) otomatis jika pesanan berasal dari Janji Temu.
- Dukungan Multi Metode Pembayaran:
  - **Tunai (Cash)** dengan kalkulator uang kembalian dan tombol uang pas.
  - **QRIS Dinamis** (BCA, GoPay, OVO, ShopeePay, DANA).
  - **Transfer Bank & Virtual Account** (BCA, Mandiri) dengan fitur Salin No. Rekening.
  - **Kartu Debit / EDC** dengan input approval code.
  - **Split Bill** (Kombinasi Tunai + QRIS / Transfer / Kartu).
- Invoice otomatis berformat: `INV-YYYYMMDD-XXXX`.
- Cetak Struk Kasir Thermal (80mm) dan fitur **Kirim Struk Digital Gambar PNG ke WhatsApp** pelanggan.

### 2. Jadwal & Janji Temu (Appointments)
- Kalender dan timeline harian jadwal reservasi pelanggan.
- **Sistem Anti Double-Booking**: Memvalidasi ketersediaan waktu teknisi berdasarkan durasi gabungan seluruh layanan; menolak jadwal bentrok secara otomatis.
- Formulir booking mendukung multi-layanan (durasi terakumulasi otomatis).
- Input Down Payment (DP) saat reservasi.
- Siklus status janji temu lengkap: `PENDING` → `CONFIRMED` → `CHECKED_IN` → `IN_PROGRESS` → `COMPLETED` / `CANCELLED` / `NO_SHOW`.
- Tombol **"Buka di Kasir POS"** untuk langsung mentransfer pelanggan, layanan, dan DP ke kasir.
- Modal **Reschedule** untuk mengubah tanggal dan jam janji temu dengan validasi konflik jadwal.

### 3. CRM & Profil Pelanggan
- Profil pelanggan lengkap dengan nomor WhatsApp.
- Catatan preferensi bentuk kuku (Almond, Coffin, Square, Oval, Stiletto) dan alergi bahan.
- Poin loyalitas otomatis (1 poin per Rp 10.000 transaksi belanja).
- Riwayat transaksi dan janji temu masa lalu.

### 4. Manajemen Layanan & Seni Kuku (Catalog)
- Pengaturan kategori treatment.
- Penentuan harga dasar, durasi treatment (menit), dan deskripsi.
- Pengaturan add-on kuku (Cat-Eye 9D Magnet, Swarovski crystals, Chrome powder, dll).
- Override tarif komisi spesifik per treatment jika diperlukan.

### 5. Manajemen Karyawan & Komisi (Staff)
- Profil teknisi nail artist dan shift jadwal kerja.
- Pengaturan tarif komisi per teknisi (misal: 20%, 25%, 30%).
- Dashboard rekap performa: jumlah treatment dikerjakan, kontribusi omzet kotor, dan total komisi.
- Pelacakan status komisi: **Pending Payout** vs **Komisi Sudah Ditransfer (PAID)**.
- Tombol **"Cairkan Komisi"** untuk menandai hak komisi telah dibayarkan kepada teknisi.

### 6. Inventaris & Mutasi Stok (Inventory)
- Pengelolaan bahan baku studio dan produk retail salon.
- Peringatan stok menipis otomatis (`stockQuantity <= minStockAlert`).
- **Pengurangan stok otomatis** ketika produk retail terjual di kasir POS.
- Modal **Mutasi Stok**: Barang Masuk (`STOCK_IN`), Barang Keluar (`STOCK_OUT`), dan Penyesuaian Opname Fisik (`ADJUSTMENT`).
- Log audit pergerakan stok permanen di tabel `inventory_movements`.

### 7. Biaya & Pengeluaran Operasional (Expenses)
- Pencatatan pengeluaran operasional studio salon.
- Kategori pengeluaran: Sewa Tempat, Listrik & Air & Wi-Fi, Bahan Baku & Perlengkapan, Gaji Pokok, Marketing & Endorse, Perawatan Alat, Lain-lain.
- Filter berdasarkan kategori dan pencarian nomor bukti / nota.
- Terintegrasi langsung dengan laporan Laba Rugi (P&L).

### 8. Laporan Finansial & Omzet (Reports)
- **Ringkasan Penjualan**: Omzet hari ini, total transaksi, rata-rata tiket, dan leaderboard layanan terlaris.
- **Laporan Berkala**: Harian (14 hari), Mingguan, Bulanan, dan Tahunan dilengkapi visualisasi barchart interaktif.
- **Ekspor Data**: Download laporan keuangan langsung ke format CSV / Excel.
- **Laporan Laba Rugi (Profit & Loss Statement)**:
  - Pendapatan Kotor (Layanan vs Produk Retail).
  - Beban Operasional berdasarkan kategori.
  - Bagi Hasil Komisi Teknisi.
  - Laba Bersih Salon (Net Profit) dan Net Profit Margin %.
- **Log Audit Keamanan**: Rekam jejak seluruh operasi sensitif di sistem.

### 9. Pengaturan Studio Salon (Settings)
- Nama studio salon, alamat cabang, nomor telepon operasional.
- Kustomisasi catatan footer struk kasir & akun Instagram.
- Pilihan tema warna salon (Blush Pink, Purple, Emerald, Amber, Slate, Sky).

---

## ⚙️ Aturan Bisnis & Integritas Transaksi (Business Rules)

1. **Nomor Invoice Unik**: Format terstandar `INV-YYYYMMDD-XXXX` dijamin unik di tingkat basis data.
2. **Snapshot Transaksi**: Harga layanan dan nama produk dibekukan saat transaksi berlangsung agar perubahan harga katalog di masa depan tidak merusak laporan historis.
3. **Database Transaction ACID**: Checkout POS dan pengurangan stok berjalan dalam blok `prisma.$transaction(async (tx) => ...)`. Jika salah satu gagal, seluruh operasi di-rollback.
4. **Pencegahan Double-Booking**: Pemeriksaan tumpang tindih waktu teknisi menggunakan formula interval menit: `Math.max(start1, start2) < Math.min(end1, end2)`.
5. **Penanganan Uang Muka (DP)**: DP dipotong dari total sisa tagihan saat checkout POS tanpa double-counting pada laporan omzet kotor.
6. **Pemulihan Stok saat Refund**: Pembatalan / refund transaksi kasir secara otomatis mengembalikan jumlah stok produk ke inventaris dan membatalkan komisi terkait.
7. **Jejak Audit**: Seluruh aktivitas checkout, refund, mutasi stok, dan pengeluaran mencatat record ke tabel `audit_logs`.

---

## 🚀 Panduan Menjalankan Sistem

### 1. Kebutuhan Sistem
- Node.js versi 18 atau 20+
- PostgreSQL versi 14+ (Lokal atau Cloud seperti Supabase/Neon/AWS RDS)
- NPM atau PNPM

### 2. Konfigurasi Variabel Lingkungan (`.env`)
Salin file `.env.example` menjadi `.env` di folder root dan folder `server/`:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=super_secret_nailart_pos_jwt_key_2025
DATABASE_URL="postgresql://postgres:123456@localhost:5432/nailarts_pos_db?schema=public"
CLIENT_URL=http://localhost:5173
```

### 3. Migrasi Database & Seeding Data Awal
Jalankan sinkronisasi skema ke PostgreSQL dan masukkan data awal:
```bash
# Push skema tabel ke PostgreSQL
npx --prefix server prisma db push --schema=../prisma/schema.prisma

# Generate Prisma Client
npx --prefix server prisma generate --schema=../prisma/schema.prisma

# Jalankan Seeder data salon
npm run seed --prefix server
```

### 4. Menjalankan Tes Otomatis
```bash
# Uji unit logika POS, invoice, DP, dan stock deduction
npm test --prefix server

# Uji anti-double-booking & kalkulasi durasi teknisi (15 test case)
npm run test:booking --prefix server
```

### 5. Menjalankan Server & Client (Development)
```bash
# Jalankan keduanya secara bersamaan (Port 5000 & Port 5173)
npm run dev
```
Akses aplikasi melalui peramban di **http://localhost:5173**.

---

## 🚢 Panduan Deployment Produksi

### ☁️ Deployment Frontend ke Cloudflare Pages
Frontend sistem ini telah siap untuk di-deploy ke **Cloudflare Pages** dengan routing SPA, chunk splitting, dan security headers.
Lihat panduan lengkap di: **[CLOUDFLARE_PAGES_GUIDE.md](file:///D:/GIT%20SOPAN/pos-nailarts/pos-nailarts/nailarts-pos/CLOUDFLARE_PAGES_GUIDE.md)**.

```bash
# Build frontend siap Cloudflare Pages
npm run build:pages

# Deploy langsung via CLI Wrangler
npm run pages:deploy
```

### 1. Build Client & Server (Self-Hosted / VPS)
```bash
# Kompilasi frontend Vite & backend TypeScript
npm run build
```
File siap pakai akan berada di `dist/` (client) dan `server/dist/` (backend).

### 2. Menjalankan Backend dengan PM2
```bash
npm install -g pm2
pm2 start server/dist/server.js --name "nailarts-pos-api"
pm2 save
```

### 3. Konfigurasi Reverse Proxy Nginx (Contoh)
```nginx
server {
    listen 80;
    server_name salon.domainanda.com;

    # Frontend Static Files
    location / {
        root /var/www/nailarts-pos/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API Proxy
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📄 Lisensi
Hak Cipta © 2026 NailArt Studio POS System. Dilisensikan di bawah lisensi MIT.
