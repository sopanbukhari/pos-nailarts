# 💅 NailArt Studio POS & Salon Management System

Sistem Point of Sale (POS), Manajemen Layanan Salon Kuku (Nail Art), Booking Janji Temu, dan Penggajian Komisi Nail Artist modern berbasis **Node.js (Express & Prisma ORM)** dan **React (Vite, TypeScript & Tailwind CSS)**.

---

## 📁 Struktur Direktori (Folder Structure)

```
nailarts-pos/
├── .env.example              # Template variabel lingkungan
├── .env                      # File konfigurasi env aktif
├── .gitignore                # File pengabaian git
├── package.json              # Root package runner (concurrently)
├── tsconfig.json             # Root TypeScript config
├── README.md                 # Dokumentasi sistem lengkap
│
├── prisma/                   # Skema dan Database Prisma ORM (SQLite)
│   ├── schema.prisma         # Model User, Customer, Category, Service, Inventory, Booking, Transaction
│   └── migrations/           # Riwayat migrasi skema database
│
├── server/                   # Backend API (Node.js & Express TypeScript)
│   ├── src/
│   │   ├── config/           # Database instance, environment config, seed data
│   │   ├── controllers/      # Auth, POS, Booking, Catalog, Customer, Inventory, Staff, Report
│   │   ├── middlewares/      # JWT Authentication, RBAC (Admin, Cashier, Artist), Error Handler
│   │   ├── models/           # Interface payload data
│   │   ├── routes/           # REST API Endpoints
│   │   ├── services/         # Logika Checkout, Perhitungan Komisi Artis, Kalkulasi Durasi
│   │   └── server.ts         # Entry point backend server Express
│   │
│   └── tests/                # Automated API & Service unit tests
│
└── client/                   # Frontend Web POS (React, Vite, TypeScript, Tailwind)
    ├── public/               # Favicon & aset publik
    ├── src/
    │   ├── assets/           # Global styles, Tailwind base, thermal print styles
    │   ├── components/
    │   │   ├── ui/           # Button, Input, Modal, Badge
    │   │   └── layout/       # Sidebar, Navbar/Header, AppLayout
    │   │
    │   ├── features/         # Arsitektur Berbasis Fitur (Feature-First)
    │   │   ├── auth/         # Login dengan quick demo account (Admin, Kasir, Nail Artist)
    │   │   ├── pos/          # [Core POS] Keranjang, modal add-on, pembayaran tunai/qris/kartu/split bill, cetak struk thermal
    │   │   ├── booking/      # Kalender jadwal booking & transfer 1-klik ke POS
    │   │   ├── catalog/      # Katalog treatment kuku & konfigurasi add-on
    │   │   ├── inventory/    # Stok botol gel, base/top coat, drill bit & alert stok menipis
    │   │   ├── customers/    # CRM pelanggan, preferensi bentuk kuku (Almond, Coffin, dll), histori visit & poin loyalitas
    │   │   ├── staff/        # Manajemen Nail Artist, konfigurasi % komisi & rekap payout gaji
    │   │   └── reports/      # Dashboard omzet harian/mingguan, top services & laporan finansial
    │   │
    │   ├── hooks/            # Custom hooks (useDebounce, dsb)
    │   ├── lib/              # Axios API client dengan interceptor token JWT
    │   ├── store/            # Global state Zustand (authStore, cartStore)
    │   ├── types/            # TypeScript data models & entities
    │   ├── utils/            # Format Rupiah (IDR) & tanggal lokal
    │   ├── App.tsx           # Router & Tab Switcher
    │   └── main.tsx          # Client Entry Point
    │
    └── tailwind.config.js    # Konfigurasi palet warna salon kuku (Blush Pink, Champagne)
```

---

## 🚀 Fitur Unggulan Sistem

1. **Kasir POS Cepat & Responsif**:
   - Filter kategori (Manicure, Gel Polish, Nail Extension, 3D Nail Art, Removal).
   - Modal pilihan add-on (Chrome Powder, Cat-Eye 9D Magnet, Swarovski Crystals, Extra Length).
   - Penentuan penanggung jawab pengerjaan Nail Artist per layanan untuk atribusi komisi otomatis.
   - Pilihan diskon instan (5%, 10%, 15%, 20%) & kalkulasi PPN 11%.
   - Metode Pembayaran Lengkap: **Tunai (Cash)** dengan kalkulator kembalian otomatis, **QRIS**, **Mesin EDC / Kartu**, serta **Split Bill** (misal: 50% Tunai + 50% QRIS).
   - Cetak struk thermal 80mm instan via browser print preview.

2. **Jadwal & Reservasi (Booking Appointments)**:
   - Kalender harian interaktif dan pembagian slot waktu per jam.
   - Deteksi konflik slot waktu artis agar tidak terjadi double-booking.
   - Tombol **"Buka di Kasir POS"** untuk langsung memindahkan pelanggan dan layanan yang dipesan ke keranjang kasir.

3. **Katalog & Modifikasi Layanan**:
   - Pengaturan harga dasar dan durasi treatment kuku dalam hitungan menit.
   - Konfigurasi add-on dinamis lengkap dengan penambahan waktu pengerjaan.

4. **Inventaris Salon & Peringatan Stok (Low Stock Alert)**:
   - Pelacakan stok kuteks gel, base coat, aseton, soft gel tips, aksesoris 3D.
   - Label otomatis jika stok berada di bawah batas minimum (`≤ 5 pcs/botol`).
   - Modal quick restock.

5. **CRM Pelanggan & Preferensi Kuku**:
   - Catatan khusus bentuk kuku favorit (Almond, Coffin, Square, Oval, Stiletto).
   - Riwayat alergi lem / aseton dan warna kuku kesukaan.
   - Poin loyalitas otomatis (1 poin per Rp 10.000 transaksi).
   - Rekap riwayat invoice & kunjungan terdahulu.

6. **Bagi Hasil & Komisi Nail Artist**:
   - Tarif komisi dinamis per artist (default: 20% - 30%).
   - Rekap omzet yang dihasilkan oleh tiap artist dan hak penerimaan komisi (commission payout).

7. **Laporan & Dashboard Finansial**:
   - Omzet hari ini, transaksi selesai, komisi terbayar, dan net pendapatan salon.
   - Diagram batang omzet 7 hari terakhir.
   - Peringkat layanan paling laris (Top Services Leaderboard).

---

## 🔑 Akun Demo Bawaan (Default Credentials)

| Peran (Role) | Email | Password | Keterangan |
| :--- | :--- | :--- | :--- |
| **Owner / Admin** | `admin@nailart.com` | `admin123` | Akses penuh seluruh fitur, komisi & laporan |
| **Kasir (Cashier)**| `kasir@nailart.com` | `kasir123` | POS Kasir, booking & inventaris |
| **Nail Artist** | `sarah@nailart.com` | `artist123` | Senior Artist (Komisi 25%) |
| **Nail Artist** | `chloe@nailart.com` | `artist123` | Nail Art Specialist (Komisi 20%) |

*(Di halaman login juga telah disediakan tombol akses cepat satu-klik untuk masing-masing role)*

---

## 💻 Panduan Instalasi & Menjalankan

### 1. Instal Dependensi Server & Client
Jalankan perintah berikut di folder root:
```bash
npm.cmd install --prefix server
npm.cmd install --prefix client
```

### 2. Generate Prisma & Inisialisasi Database
```bash
npm.cmd run prisma:generate --prefix server
npm.cmd run prisma:migrate --prefix server
npm.cmd run seed --prefix server
```

### 3. Menjalankan Aplikasi
Jalankan server dan client:
- **Jalankan Server Backend** (Port 5000):
  ```bash
  npm.cmd run dev --prefix server
  ```
- **Jalankan Client Frontend** (Port 5173):
  ```bash
  npm.cmd run dev --prefix client
  ```

Buka peramban (browser) di **http://localhost:5173**.
