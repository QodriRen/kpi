# Sistem Penilaian KPI Karyawan

## Tech Stack
- Next.js 14 App Router + TypeScript
- Prisma ORM + MySQL
- NextAuth.js v5 (Credentials provider)
- Tailwind CSS + shadcn/ui
- React Hook Form + Zod

## Roles
- admin → kelola master data
- hr → kelola karyawan, target, penilaian, feedback
- karyawan → lihat dashboard KPI, target, hasil, feedback

## Scoring Logic
skor_indikator = (nilai_aktual / nilai_target) * bobot_persen
total_skor = SUM semua skor_indikator (max 100)
Grade: A≥96 (Baik), B≥88 (Cukup), C<88 (Kurang)

## Konvensi
- Semua API route di /app/api/*
- Gunakan server actions untuk form mutation
- Prisma client singleton di /lib/prisma.ts
- Validasi pakai Zod di semua form dan API
- Komponen UI pakai shadcn, jangan buat custom dari nol

## Jangan diubah
- Nama tabel Prisma sudah fixed, jangan rename
- Auth logic hanya di /lib/auth.ts dan middleware.ts