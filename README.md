# Sistem Penilaian KPI Karyawan

Aplikasi web untuk mengelola dan memantau Key Performance Indicator (KPI) karyawan secara terstruktur. Dibangun dengan Next.js 14, Prisma ORM, dan MySQL. Khusus karyawan kontrak, sistem menggunakan algoritma **Gaussian Naive Bayes** untuk menghasilkan rekomendasi kelanjutan kontrak secara probabilistik.

---

## Daftar Isi

- [Kegunaan Aplikasi](#kegunaan-aplikasi)
- [Tech Stack](#tech-stack)
- [Algoritma Naive Bayes](#algoritma-naive-bayes)
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
- **Memantau performa** karyawan melalui dashboard visual dengan gauge skor dan grade (A/B/C)
- **Mengelola periode penilaian** (bulanan, triwulan, semesteran, tahunan)
- **Mengirim feedback** dua arah antara HR dan karyawan berdasarkan hasil penilaian
- **Rekomendasi kontrak berbasis Naive Bayes** — prediksi probabilistik kelanjutan kontrak karyawan kontrak yang sudah dinilai minimal 6 bulan

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
| ML | Gaussian Naive Bayes (implementasi sendiri, tanpa library) |

---

## Algoritma Naive Bayes

Sistem menggunakan **Gaussian Naive Bayes** untuk mengklasifikasikan rekomendasi kelanjutan kontrak karyawan kontrak yang telah dinilai selama ≥ 6 bulan. Implementasi ada di [lib/naive-bayes.ts](lib/naive-bayes.ts).

### Fitur Input (Features)

| Fitur | Keterangan | Rentang |
|---|---|---|
| `total_skor` | Total skor KPI dari semua indikator yang dinilai | 0 – 100 |
| `pct_tercapai` | Fraksi indikator di mana nilai aktual ≥ nilai target | 0 – 1 |

### Kelas Output (Classes)

| Kelas | Arti |
|---|---|
| **Lanjut Kontrak** | Karyawan direkomendasikan melanjutkan kontrak |
| **Pindah Divisi** | Karyawan disarankan berpindah ke divisi yang lebih sesuai |
| **Tidak Lanjut Kontrak** | Kontrak tidak dilanjutkan |

### Parameter Model Gaussian

Parameter distribusi diturunkan dari domain knowledge penilaian KPI (grade threshold A≥80, B≥76, C<76):

| Kelas | Prior | μ Skor | σ² Skor | μ % Tercapai | σ² % Tercapai |
|---|---|---|---|---|---|
| Lanjut Kontrak | 0.40 | 87 | 25 | 0.90 | 0.008 |
| Pindah Divisi | 0.35 | 78 | 4 | 0.78 | 0.012 |
| Tidak Lanjut Kontrak | 0.25 | 60 | 100 | 0.55 | 0.040 |

### Cara Kerja

1. Untuk tiap karyawan kontrak per periode penilaian, hitung `total_skor` dan `pct_tercapai`
2. Hitung **log-posterior** tiap kelas menggunakan rumus Naive Bayes:
   ```
   log P(kelas | data) ∝ log P(kelas) + log P(skor | kelas) + log P(pct | kelas)
   ```
   di mana `P(fitur | kelas)` adalah Gaussian PDF dengan parameter μ dan σ² pada tabel di atas
3. Normalisasi dengan **log-sum-exp trick** agar numerik stabil (menghindari underflow)
4. Prediksi = kelas dengan probabilitas tertinggi; output juga menyertakan distribusi lengkap 3 kelas

### Contoh Prediksi

| Total Skor | % Tercapai | Prediksi NB | Kepercayaan |
|---|---|---|---|
| 87 | 92% | Lanjut Kontrak | ~99% |
| 80 | 80% | Pindah Divisi | ~83% |
| 76 | 78% | Pindah Divisi | ~95% |
| 70 | 60% | Tidak Lanjut Kontrak | ~99% |

### Perbedaan vs Rule-Based (Grade Saja)

| Kondisi | Rule-Based | Naive Bayes |
|---|---|---|
| Skor 80, tercapai 80% | Grade A → Lanjut Kontrak | **Pindah Divisi** (83%) |
| Skor 87, tercapai 92% | Grade A → Lanjut Kontrak | Lanjut Kontrak (99%) ✓ |
| Skor 76, tercapai 78% | Grade B → Pindah Divisi | Pindah Divisi (95%) ✓ |

NB lebih informatif karena mempertimbangkan dua fitur sekaligus secara probabilistik, bukan sekadar threshold tunggal dari skor total.

### Di Mana Tampil

- **HR** → halaman `Rekomendasi Kontrak` (`/hr/rekomendasi`): tampil kartu per karyawan kontrak dengan bar probabilitas 3 kelas
- **Karyawan kontrak** → halaman `Hasil Penilaian` (`/karyawan/hasil`): tampil kotak prediksi per periode, hanya jika status_kerja mengandung kata "kontrak"

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

### 2. Install dependensi

```bash
npm install
```

### 3. Buat database MySQL

```sql
CREATE DATABASE kpi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Konfigurasi environment

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

> **Catatan:** Jika MySQL berjalan tanpa password: `DATABASE_URL="mysql://root:@localhost:3306/kpi_db"`

### 5. Push skema database

```bash
npx prisma db push
```

### 6. Isi data awal (seed)

```bash
npx prisma db seed
```

Output jika berhasil:

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

Buka `http://localhost:3000` → akan diarahkan ke halaman login. Masukkan email dan password sesuai role yang ingin dicoba.

---

### Alur Kerja Normal (End-to-End)

```
Admin → buat periode & indikator KPI
   ↓
HR → tetapkan target per karyawan
   ↓
HR → input nilai aktual (skor dihitung otomatis)
   ↓
HR → lihat Rekomendasi Kontrak (Naive Bayes) untuk karyawan kontrak ≥ 6 bulan
   ↓
HR → kirim feedback ke karyawan
   ↓
Karyawan kontrak → lihat hasil penilaian + prediksi NB per periode
```

---

### Panduan per Role

#### Admin

Login: `admin@kpi.com / admin123`

| Menu | Fungsi |
|---|---|
| **Dashboard** | Statistik total pengguna, divisi, periode aktif, log aktivitas |
| **Pengguna** | Tambah, edit, aktifkan/nonaktifkan akun |
| **Divisi** | Buat divisi, assign kepala divisi |
| **Indikator KPI** | Buat indikator per divisi dengan bobot (%) |
| **Periode** | Buat periode penilaian, toggle aktif/nonaktif |

---

#### HR Manager

Login: `hr@kpi.com / hr123`

| Menu | Fungsi |
|---|---|
| **Dashboard** | Statistik karyawan, target, penilaian pending |
| **Karyawan** | Tambah karyawan baru |
| **Target KPI** | Tetapkan nilai target per karyawan per periode |
| **Penilaian** | Input nilai aktual — skor dihitung otomatis |
| **Rekomendasi** | Lihat prediksi Naive Bayes untuk karyawan kontrak ≥ 6 bulan |
| **Feedback** | Kirim feedback ke karyawan |

**Cara membaca halaman Rekomendasi:**
- Setiap kartu menampilkan nama karyawan kontrak beserta badge rekomendasi NB
- Bagian bawah kartu menampilkan bar probabilitas untuk 3 kelas: Lanjut Kontrak, Pindah Divisi, Tidak Lanjut Kontrak
- Fitur yang digunakan: Total Skor KPI dan % Indikator Tercapai

---

#### Karyawan

Login: `karyawan1@kpi.com / kar123`

| Menu | Fungsi |
|---|---|
| **Dashboard** | Skor KPI total periode aktif (gauge + grade) + breakdown indikator |
| **Target KPI** | Lihat target yang ditetapkan HR |
| **Hasil Penilaian** | Riwayat penilaian per periode + **prediksi NB** (jika status kontrak) |
| **Feedback** | Lihat dan balas feedback HR |

**Prediksi NB di halaman Hasil Penilaian:**
- Muncul otomatis di setiap bagian periode jika karyawan berstatus kontrak
- Menampilkan kelas prediksi, kepercayaan (%), dan bar distribusi 3 kelas

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
├── Rekomendasi kontrak Naive Bayes (khusus karyawan kontrak ≥ 6 bulan)
└── Kirim & lihat feedback

Karyawan
├── Lihat dashboard skor KPI
├── Lihat target yang ditetapkan HR
├── Lihat hasil penilaian per periode (+ prediksi NB jika kontrak)
└── Lihat & balas feedback dari HR
```

Middleware melindungi setiap route:
- `/admin/*` → hanya Admin
- `/hr/*` → hanya HR
- `/karyawan/*` → hanya Karyawan

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
| ≥ 80 | **A** | Baik |
| ≥ 76 | **B** | Cukup |
| < 76 | **C** | Rendah |

---

## Akun Demo

Data dibuat otomatis saat menjalankan `npx prisma db seed`:

| Role | Email | Password | Keterangan |
|---|---|---|---|
| Admin | `admin@kpi.com` | `admin123` | Akses penuh ke semua master data |
| HR | `hr@kpi.com` | `hr123` | Kelola karyawan, target, penilaian, rekomendasi NB |
| Karyawan 1 | `karyawan1@kpi.com` | `kar123` | Bisa dicoba dengan status kontrak untuk melihat prediksi NB |
| Karyawan 2 | `karyawan2@kpi.com` | `kar123` | Karyawan divisi lain |

**Tips melihat fitur NB:**
1. Pastikan karyawan memiliki `status_kerja` yang mengandung kata **"kontrak"**
2. Pastikan ada periode penilaian dengan durasi ≥ 6 bulan
3. Pastikan karyawan sudah memiliki penilaian (nilai aktual) di periode tersebut
4. Buka halaman **Rekomendasi** sebagai HR, atau **Hasil Penilaian** sebagai karyawan kontrak

---

## Script yang Tersedia

```bash
npm run dev          # Jalankan development server (http://localhost:3000)
npm run build        # Build untuk production
npm run start        # Jalankan production build
npx prisma db push   # Sinkronisasi skema ke database
npx prisma db seed   # Isi data awal
npx prisma studio    # GUI browser untuk melihat/edit data database
```

---

## Troubleshooting

**Error: `DATABASE_URL` tidak valid**
→ Pastikan format URL benar dan MySQL sedang berjalan.

**Error saat `prisma db push`**
→ Pastikan database `kpi_db` sudah dibuat di MySQL.

**Halaman login tidak bisa diakses**
→ Pastikan `NEXTAUTH_SECRET` sudah diisi di `.env` dan server sudah di-restart.

**Skor tidak muncul di dashboard karyawan**
→ Pastikan HR sudah menginput penilaian (nilai aktual) untuk periode yang aktif.

**Prediksi Naive Bayes tidak muncul**
→ Pastikan: (1) karyawan `status_kerja` mengandung kata "kontrak", (2) periode ≥ 6 bulan, (3) sudah ada penilaian di periode tersebut.
