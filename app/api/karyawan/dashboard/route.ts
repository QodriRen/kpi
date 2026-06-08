import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "karyawan") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const karyawan = await prisma.karyawan.findUnique({
    where: { id_pengguna: Number(session.user.id) },
  });

  if (!karyawan) {
    return NextResponse.json({ error: "Data karyawan tidak ditemukan" }, { status: 404 });
  }

  const periodeAktif = await prisma.periodePenilaian.findFirst({
    where: { is_aktif: true },
  });

  if (!periodeAktif) {
    return NextResponse.json({ periodeAktif: null, targets: [], totalSkor: 0 });
  }

  const targets = await prisma.targetKpi.findMany({
    where: {
      id_karyawan: karyawan.id_karyawan,
      id_periode: periodeAktif.id_periode,
    },
    include: {
      indikator: true,
      penilaian: true,
    },
  });

  const totalSkor = targets.reduce((sum, t) => {
    const p = t.penilaian[0];
    return sum + (p ? Number(p.skor_akhir) : 0);
  }, 0);

  return NextResponse.json({ periodeAktif, targets, totalSkor });
}
