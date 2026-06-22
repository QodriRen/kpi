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

  if (!karyawan) return NextResponse.json({ items: [] });

  const targets = await prisma.targetKpi.findMany({
    where: { id_karyawan: karyawan.id_karyawan },
    include: {
      indikator: true,
      periode: true,
      penilaian: {
        include: { penilai: { select: { nama_lengkap: true } } },
      },
    },
    orderBy: { id_target: "desc" },
  });

  return NextResponse.json({ items: targets });
}
