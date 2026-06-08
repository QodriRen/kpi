import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.logAktivitas.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.penilaianKpi.deleteMany();
  await prisma.targetKpi.deleteMany();
  await prisma.periodePenilaian.deleteMany();
  await prisma.indikatorKpi.deleteMany();
  await prisma.karyawan.deleteMany();
  await prisma.divisi.deleteMany();
  await prisma.pengguna.deleteMany();

  // Create users
  const adminHash = await bcrypt.hash("admin123", 12);
  const hrHash = await bcrypt.hash("hr123", 12);
  const karHash = await bcrypt.hash("kar123", 12);

  const admin = await prisma.pengguna.create({
    data: {
      nama_lengkap: "Administrator",
      email: "admin@kpi.com",
      password_hash: adminHash,
      role: "admin",
      is_aktif: true,
    },
  });

  const hr = await prisma.pengguna.create({
    data: {
      nama_lengkap: "HR Manager",
      email: "hr@kpi.com",
      password_hash: hrHash,
      role: "hr",
      is_aktif: true,
    },
  });

  const penggunaKar1 = await prisma.pengguna.create({
    data: {
      nama_lengkap: "Budi Santoso",
      email: "karyawan1@kpi.com",
      password_hash: karHash,
      role: "karyawan",
      is_aktif: true,
    },
  });

  const penggunaKar2 = await prisma.pengguna.create({
    data: {
      nama_lengkap: "Siti Rahayu",
      email: "karyawan2@kpi.com",
      password_hash: karHash,
      role: "karyawan",
      is_aktif: true,
    },
  });

  // Create divisi
  const divisiTI = await prisma.divisi.create({
    data: {
      nama_divisi: "Teknologi Informasi",
      id_kepala: admin.id_pengguna,
      deskripsi: "Divisi yang mengelola infrastruktur dan pengembangan sistem teknologi informasi perusahaan.",
    },
  });

  const divisiHR = await prisma.divisi.create({
    data: {
      nama_divisi: "Human Resource",
      id_kepala: hr.id_pengguna,
      deskripsi: "Divisi yang mengelola sumber daya manusia, rekrutmen, dan pengembangan karyawan.",
    },
  });

  // Create karyawan
  const karyawan1 = await prisma.karyawan.create({
    data: {
      id_pengguna: penggunaKar1.id_pengguna,
      id_divisi: divisiTI.id_divisi,
      nip: "TI-001",
      jabatan: "Software Engineer",
      status_kerja: "Tetap",
    },
  });

  await prisma.karyawan.create({
    data: {
      id_pengguna: penggunaKar2.id_pengguna,
      id_divisi: divisiHR.id_divisi,
      nip: "HR-001",
      jabatan: "HR Specialist",
      status_kerja: "Tetap",
    },
  });

  // Create indikator KPI for TI
  const indikator1 = await prisma.indikatorKpi.create({
    data: {
      id_divisi: divisiTI.id_divisi,
      nama_indikator: "Penyelesaian Tiket Bug",
      kategori: "Produktivitas",
      satuan: "Tiket",
      bobot_persen: 40,
      deskripsi: "Jumlah tiket bug yang diselesaikan per bulan",
    },
  });

  const indikator2 = await prisma.indikatorKpi.create({
    data: {
      id_divisi: divisiTI.id_divisi,
      nama_indikator: "Uptime Sistem",
      kategori: "Kualitas",
      satuan: "Persen",
      bobot_persen: 35,
      deskripsi: "Persentase uptime sistem selama periode berjalan",
    },
  });

  const indikator3 = await prisma.indikatorKpi.create({
    data: {
      id_divisi: divisiTI.id_divisi,
      nama_indikator: "Kehadiran",
      kategori: "Kedisiplinan",
      satuan: "Hari",
      bobot_persen: 25,
      deskripsi: "Jumlah hari kehadiran karyawan",
    },
  });

  // Create active periode
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const periode = await prisma.periodePenilaian.create({
    data: {
      nama_periode: `Penilaian ${now.toLocaleString("id-ID", { month: "long", year: "numeric" })}`,
      tanggal_mulai: startOfMonth,
      tanggal_selesai: endOfMonth,
      tipe_periode: "Bulanan",
      is_aktif: true,
    },
  });

  // Create target KPI for karyawan1
  const target1 = await prisma.targetKpi.create({
    data: {
      id_indikator: indikator1.id_indikator,
      id_karyawan: karyawan1.id_karyawan,
      id_periode: periode.id_periode,
      nilai_target: 20,
      dibuat_oleh: "HR Manager",
    },
  });

  const target2 = await prisma.targetKpi.create({
    data: {
      id_indikator: indikator2.id_indikator,
      id_karyawan: karyawan1.id_karyawan,
      id_periode: periode.id_periode,
      nilai_target: 99,
      dibuat_oleh: "HR Manager",
    },
  });

  const target3 = await prisma.targetKpi.create({
    data: {
      id_indikator: indikator3.id_indikator,
      id_karyawan: karyawan1.id_karyawan,
      id_periode: periode.id_periode,
      nilai_target: 22,
      dibuat_oleh: "HR Manager",
    },
  });

  // Skor: (18/20)*40 + (97/99)*35 + (21/22)*25 = 36 + 34.31 + 23.86 = 94.17
  const penilaian1 = await prisma.penilaianKpi.create({
    data: {
      id_target: target1.id_target,
      id_penilai: hr.id_pengguna,
      nilai_aktual: 18,
      skor_akhir: (18 / 20) * 40,
      status_catatan: "Kinerja baik, namun perlu ditingkatkan untuk kuartal berikutnya",
    },
  });

  const penilaian2 = await prisma.penilaianKpi.create({
    data: {
      id_target: target2.id_target,
      id_penilai: hr.id_pengguna,
      nilai_aktual: 97,
      skor_akhir: (97 / 99) * 35,
      status_catatan: "Uptime sistem sangat baik",
    },
  });

  const penilaian3 = await prisma.penilaianKpi.create({
    data: {
      id_target: target3.id_target,
      id_penilai: hr.id_pengguna,
      nilai_aktual: 21,
      skor_akhir: (21 / 22) * 25,
      status_catatan: "Kehadiran sangat baik",
    },
  });

  // Create feedback
  await prisma.feedback.create({
    data: {
      id_penilaian: penilaian1.id_penilaian,
      id_pemberi: hr.id_pengguna,
      isi_feedback: "Budi, kamu sudah bekerja dengan baik bulan ini. Tingkatkan jumlah tiket yang diselesaikan!",
      tipe_feedback: "hr_ke_karyawan",
    },
  });

  // Log aktivitas
  await prisma.logAktivitas.create({
    data: {
      id_pengguna: hr.id_pengguna,
      aksi: `Menambahkan penilaian KPI untuk Budi Santoso pada periode ${periode.nama_periode}`,
    },
  });

  await prisma.logAktivitas.create({
    data: {
      id_pengguna: admin.id_pengguna,
      aksi: "Membuat periode penilaian baru",
    },
  });

  console.log("✅ Seed complete!");
  console.log("\n📋 Akun login:");
  console.log("  Admin  : admin@kpi.com / admin123");
  console.log("  HR     : hr@kpi.com / hr123");
  console.log("  Kar 1  : karyawan1@kpi.com / kar123");
  console.log("  Kar 2  : karyawan2@kpi.com / kar123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
