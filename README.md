# Sistem Penilaian KPI Karyawan

Aplikasi web untuk mengelola dan memantau Key Performance Indicator (KPI) karyawan secara terstruktur. Dibangun dengan Next.js 14, Prisma ORM, dan MySQL.

---

## Daftar Isi

- [Kegunaan Aplikasi](#kegunaan-aplikasi)
- [Tech Stack](#tech-stack)
- [Prasyarat](#prasyarat)
- [Instalasi](#instalasi)
- [Cara Penggunaan](#cara-penggunaan)
- [Struktur Role](#struktur-role)
- [Logika Penilaian](#logika-penilaian)
- [Akun Demo](#akun-demo)

---

## Kegunaan Aplikasi

Aplikasi ini dirancang untuk membantu perusahaan dalam:

- **Menetapkan target KPI** per karyawan berdasarkan indikator yang relevan dengan divisinya
- **Mencatat dan menghitung skor** penilaian secara otomatis berdasarkan nilai aktual vs target
- **Memantau performa** karyawan melalui dashboard visual dengan gauge skor dan grade (A/B/C/D)
- **Mengelola periode penilaian** (bulanan, triwulan, semesteran, tahunan)
- **Mengirim feedback** dua arah antara HR dan karyawan berdasarkan hasil penilaian
- **Mencatat log aktivitas** seluruh pengguna untuk keperluan audit

---

## Tech Stack

| Komponen | Teknologi |
|---|---|
| Framework | Next.js 14 (App Router) |
| Bahasa | TypeScript |
| Database | MySQL |
| ORM | Prisma |
| Autentikasi | NextAuth.js v5 (Credentials) |
| UI | Tailwind CSS + shadcn/ui |
| Form | React Hook Form + Zod |
| Notifikasi | Sonner (toast) |

---

## Prasyarat

Pastikan sudah terinstal di komputer Anda:

- **Node.js** v18 atau lebih baru → [nodejs.org](https://nodejs.org)
- **MySQL** v8 atau lebih baru → [mysql.com](https://www.mysql.com)
- **npm** (sudah termasuk bersama Node.js)

---

## Instalasi

### 1. Clone atau unduh project

```bash
git clone <url-repository>
cd kpi
```

Atau jika sudah ada di folder lokal, langsung masuk ke direktori project.

### 2. Install dependensi

```bash
npm install
```

### 3. Buat database MySQL

Buka MySQL client (MySQL Workbench, phpMyAdmin, atau terminal) lalu jalankan:

```sql
CREATE DATABASE kpi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Konfigurasi environment

Salin file contoh lalu sesuaikan:

```bash
cp .env.example .env
```

Edit file `.env`:

```env
# Sesuaikan username dan password MySQL Anda
DATABASE_URL="mysql://root:PASSWORD_ANDA@localhost:3306/kpi_db"

# Ganti dengan string acak yang panjang dan aman
NEXTAUTH_SECRET="ganti-dengan-secret-yang-aman"

NEXTAUTH_URL="http://localhost:3000"
```

> **Catatan:** Jika MySQL berjalan tanpa password (instalasi lokal default), gunakan:
> `DATABASE_URL="mysql://root:@localhost:3306/kpi_db"`

### 5. Push skema database

Perintah ini membuat semua tabel sesuai skema Prisma:

```bash
npx prisma db push
```

### 6. Isi data awal (seed)

Perintah ini mengisi database dengan data demo termasuk akun pengguna, divisi, indikator KPI, dan sample penilaian:

```bash
npx prisma db seed
```

Output yang muncul jika berhasil:

```
🌱 Seeding database...
✅ Seed complete!

📋 Akun login:
  Admin  : admin@kpi.com / admin123
  HR     : hr@kpi.com / hr123
  Kar 1  : karyawan1@kpi.com / kar123
  Kar 2  : karyawan2@kpi.com / kar123
```

### 7. Jalankan aplikasi

```bash
npm run dev
```

Buka browser dan akses: **http://localhost:3000**

---

## Cara Penggunaan

### Login

Buka `http://localhost:3000` → akan diarahkan ke halaman login.

Masukkan email dan password sesuai role yang ingin dicoba. Setelah login, pengguna akan otomatis diarahkan ke dashboard sesuai rolenya.

---

### Alur Kerja Normal (End-to-End)

Berikut urutan penggunaan aplikasi dari awal hingga selesai:

```
Admin → buat periode & indikator KPI
   ↓
HR → tetapkan target per karyawan
   ↓
HR → input nilai aktual (skor dihitung otomatis)
   ↓
HR → kirim feedback ke karyawan
   ↓
Karyawan → lihat hasil & balas feedback
```

---

### Panduan per Role

#### Admin

Login sebagai `admin@kpi.com / admin123`

| Menu | Fungsi |
|---|---|
| **Dashboard** | Lihat statistik total pengguna, divisi, periode aktif, dan log aktivitas terbaru |
| **Pengguna** | Tambah, edit, aktifkan/nonaktifkan akun pengguna (admin, hr, karyawan) |
| **Divisi** | Buat dan kelola divisi perusahaan, assign kepala divisi |
| **Indikator KPI** | Buat indikator penilaian per divisi dengan bobot (%) — total bobot per divisi tidak boleh melebihi 100% |
| **Periode** | Buat periode penilaian, toggle aktif/nonaktif |

**Catatan penting untuk Admin:**
- Buat divisi terlebih dahulu sebelum menambah indikator
- Buat periode aktif sebelum HR bisa menetapkan target
- Total bobot semua indikator dalam satu divisi harus = 100% agar skor total akurat

---

#### HR Manager

Login sebagai `hr@kpi.com / hr123`

| Menu | Fungsi |
|---|---|
| **Dashboard** | Lihat jumlah karyawan, berapa yang belum punya target, berapa penilaian yang pending |
| **Karyawan** | Tambah karyawan baru (sekaligus membuat akun pengguna) |
| **Target KPI** | Tetapkan nilai target per karyawan, per indikator, per periode |
| **Penilaian** | Input nilai aktual — skor dihitung otomatis. Bisa edit penilaian yang sudah ada |
| **Feedback** | Kirim feedback tertulis ke karyawan berdasarkan hasil penilaian tertentu |

**Alur kerja HR:**
1. Pastikan periode aktif sudah dibuat oleh Admin
2. Buka **Target KPI** → tetapkan target untuk setiap karyawan dan indikator
3. Di akhir periode, buka **Penilaian** → pilih periode → klik tombol **Nilai** di setiap baris
4. Input nilai aktual → skor dihitung otomatis → simpan
5. Buka **Feedback** → kirim catatan/apresiasi ke karyawan

---

#### Karyawan

Login sebagai `karyawan1@kpi.com / kar123`

| Menu | Fungsi |
|---|---|
| **Dashboard** | Lihat skor KPI total periode aktif dengan gauge melingkar + grade. Breakdown per indikator dengan progress bar berwarna |
| **Target KPI** | Lihat detail semua target yang telah ditetapkan HR untuk periode aktif |
| **Hasil Penilaian** | Lihat riwayat hasil penilaian dari semua periode, lengkap dengan skor per indikator |
| **Feedback** | Lihat feedback dari HR dan balas langsung di aplikasi |

**Kode warna progress bar:**
- Hijau: pencapaian ≥ 85%
- Kuning: pencapaian 70–84%
- Merah: pencapaian < 70%

---

## Struktur Role

```
Admin
├── Kelola pengguna (CRUD)
├── Kelola divisi (CRUD)
├── Kelola indikator KPI (CRUD, validasi bobot)
└── Kelola periode penilaian (CRUD, toggle aktif)

HR Manager
├── Tambah karyawan baru
├── Tetapkan target KPI
├── Input penilaian (nilai aktual → skor otomatis)
└── Kirim & lihat feedback

Karyawan
├── Lihat dashboard skor KPI
├── Lihat target yang ditetapkan HR
├── Lihat hasil penilaian per periode
└── Lihat & balas feedback dari HR
```

Middleware otomatis melindungi setiap route:
- `/admin/*` → hanya Admin
- `/hr/*` → hanya HR
- `/karyawan/*` → hanya Karyawan
- Pengguna yang belum login akan diarahkan ke `/login`

---

## Logika Penilaian

### Skor per Indikator

```
skor_indikator = (nilai_aktual / nilai_target) × bobot_persen
```

Contoh: Karyawan menyelesaikan 18 dari 20 tiket (bobot 40%)
```
skor = (18 / 20) × 40 = 36
```

### Total Skor

```
total_skor = jumlah semua skor_indikator (maksimum 100)
```

### Konversi ke Grade

| Skor | Grade | Keterangan |
|---|---|---|
| ≥ 90 | **A** | Sangat Baik |
| ≥ 75 | **B** | Baik |
| ≥ 60 | **C** | Cukup |
| < 60 | **D** | Perlu Perbaikan |

---

## Akun Demo

Data ini dibuat otomatis saat menjalankan `npx prisma db seed`:

| Role | Email | Password | Keterangan |
|---|---|---|---|
| Admin | `admin@kpi.com` | `admin123` | Akses penuh ke semua master data |
| HR | `hr@kpi.com` | `hr123` | Kelola karyawan, target, penilaian |
| Karyawan 1 | `karyawan1@kpi.com` | `kar123` | Divisi TI, sudah ada target & penilaian |
| Karyawan 2 | `karyawan2@kpi.com` | `kar123` | Divisi HR, belum ada target |

**Data sample yang tersedia:**
- 2 divisi: Teknologi Informasi, Human Resource
- 3 indikator KPI untuk divisi TI (bobot: 40%, 35%, 25%)
- 1 periode aktif: bulan berjalan
- Target dan penilaian lengkap untuk Karyawan 1 (skor ≈ 94 — Grade A)

---

## Script yang Tersedia

```bash
npm run dev          # Jalankan development server (http://localhost:3000)
npm run build        # Build untuk production
npm run start        # Jalankan production build
npx prisma db push   # Sinkronisasi skema ke database
npx prisma db seed   # Isi data awal
npx prisma studio    # Buka GUI browser untuk melihat/edit data database
```

---

## Troubleshooting

**Error: `DATABASE_URL` tidak valid**
→ Pastikan format URL benar dan MySQL sedang berjalan. Cek username/password.

**Error saat `prisma db push`**
→ Pastikan database `kpi_db` sudah dibuat di MySQL.

**Halaman login tidak bisa diakses**
→ Pastikan `NEXTAUTH_SECRET` sudah diisi di `.env` dan server sudah di-restart.

**Skor tidak muncul di dashboard karyawan**
→ Pastikan HR sudah menginput penilaian (nilai aktual) untuk periode yang aktif.
