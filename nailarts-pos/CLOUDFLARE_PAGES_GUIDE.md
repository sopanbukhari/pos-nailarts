# Panduan Deployment Frontend ke Cloudflare Pages 🚀

Sistem **Nail Art POS & Salon Management** ini telah dikonfigurasi secara lengkap untuk dapat di-deploy ke **Cloudflare Pages** dengan performa tinggi, caching optimal, dan penanganan routing Single Page Application (SPA).

---

## 🏗️ 1. Arsitektur Deployment

- **Frontend (Client)**: Di-hosting di **Cloudflare Pages** (Global CDN, latency sangat rendah, gratis).
- **Backend (Server)**: Di-hosting di penyedia layanan Node.js seperti **Railway**, **Render**, **Fly.io**, **Supabase / VPS**, atau **Vercel**.
- **Komunikasi**:
  - **Opsi A (Direct Cross-Origin)**: Frontend memanggil langsung URL backend via environment variable `VITE_API_BASE_URL`.
  - **Opsi B (Cloudflare Reverse Proxy)**: Menggunakan file `_redirects` sehingga request `/api/*` diteruskan ke backend tanpa kendala CORS.

---

## ⚙️ 2. File Konfigurasi yang Telah Disiapkan

| File | Lokasi | Fungsi |
|---|---|---|
| `_redirects` | `client/public/_redirects` | Menangani fallback SPA (`/* /index.html 200`) agar refresh halaman tidak 404 & proxy API opsional |
| `_headers` | `client/public/_headers` | HTTP Security Headers & Caching 1 tahun untuk static assets (`/assets/*`) |
| `vite.config.ts` | `client/vite.config.ts` | Optimasi chunk splitting (vendor-react, vendor-icons, vendor-utils) & build target |
| `wrangler.toml` | Root & `client/` | Konfigurasi CLI Cloudflare Wrangler |
| `.env.example` | `client/.env.example` | Panduan environment variable `VITE_API_BASE_URL` |

---

## 🌐 3. Cara Deploy via Cloudflare Pages Dashboard (Git Integration)

Metode ini adalah metode yang paling direkomendasikan karena Cloudflare Pages akan otomatis melakukan build setiap kali Anda melakukan `git push`.

### Langkah-langkah:
1. Buka dashboard [Cloudflare](https://dash.cloudflare.com/) lalu pilih **Compute (Workers & Pages)** > **Create application** > Tab **Pages** > **Connect to Git**.
2. Pilih repository Git proyek ini (`nailarts-pos`).
3. Pada halaman **Set up builds and deployments**, isi konfigurasi berikut:

#### Pengaturan Monorepo Cloudflare Pages:
- **Project name**: `nailarts-pos`
- **Production branch**: `main`
- **Framework preset**: `Vite`
- **Root directory**: `nailarts-pos/client` *(SANGAT PENTING: karena folder project Anda berada di dalam `nailarts-pos/`)*
- **Build command**: `npm run build`
- **Build output directory**: `dist`

> *Catatan: Jika Anda membiarkan **Root directory** kosong (`/`), gunakan:*
> - **Build command**: `npm run build:pages`
> - **Build output directory**: `dist`

### 4. Tambahkan Environment Variable (Wajib untuk API):
Di bagian **Environment variables (advanced)**, tambahkan variabel berikut:
- **Variable name**: `VITE_API_BASE_URL`
- **Value**: Masukkan URL API backend produksi Anda.
  - Contoh jika backend di Railway: `https://nailart-api-production.up.railway.app/api`
  - Contoh jika backend di Render: `https://nailart-pos.onrender.com/api`
  - Contoh jika menggunakan reverse proxy `_redirects`: `/api`

5. Klik **Save and Deploy**. Cloudflare Pages akan otomatis meng-install dependencies dan melakukan build. Selesai! 🎉

---

## 💻 4. Cara Deploy Cepat via Wrangler CLI (Tanpa Git)

Jika Anda ingin langsung mengunggah build frontend dari komputer Anda ke Cloudflare Pages:

```bash
# 1. Pastikan dependencies sudah terinstall
npm install

# 2. Build frontend khusus untuk Cloudflare Pages
npm run build:pages

# 3. Login ke akun Cloudflare Anda (cukup sekali)
npx wrangler login

# 4. Deploy folder client/dist ke Cloudflare Pages
npm run pages:deploy
```

Saat pertama kali dijalankan, Wrangler akan menanyakan nama proyek. Ketik misalnya `nailart-pos` dan pilih `Production`. Wrangler akan langsung memberikan URL live Anda (misal `https://nailart-pos.pages.dev`).

---

## 🔀 5. Opsi Reverse Proxy via `_redirects` (Solusi Anti-CORS)

Jika Anda tidak ingin repot mengatur CORS di backend, Anda dapat memanfaatkan fitur reverse proxy bawaan Cloudflare Pages:

1. Buka file [client/public/_redirects](file:///D:/GIT%20SOPAN/pos-nailarts/pos-nailarts/nailarts-pos/client/public/_redirects).
2. Tambahkan / hapus tanda komentar pada baris proxy:
   ```text
   /api/*  https://nama-backend-anda.railway.app/api/:splat  200
   /*      /index.html                                       200
   ```
3. Di Cloudflare Pages environment variables, cukup set `VITE_API_BASE_URL=/api`.
4. Browser akan memanggil `/api/...` pada domain yang sama, dan Cloudflare di jaringan edge akan meneruskannya ke backend secara transparan!

---

## 🧪 6. Menjalankan Preview Lokal Sebelum Deploy

Anda dapat mensimulasikan lingkungan Cloudflare Pages secara lokal:

```bash
# Masuk ke folder client
cd client

# Build frontend
npm run build

# Jalankan server Cloudflare Pages lokal
npm run pages:dev
# atau
npm run preview
```
Akses di browser: `http://localhost:5173` atau port yang ditampilkan di terminal.
