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

  if (!karyawan) return NextResponse.json([]);

  const feedback = await prisma.feedback.findMany({
    where: {
      penilaian: {
        target: { id_karyawan: karyawan.id_karyawan },
      },
    },
    include: {
      pemberi: { select: { nama_lengkap: true, role: true } },
      penilaian: {
        include: {
          target: { include: { indikator: { select: { nama_indikator: true } } } },
        },
      },
    },
    orderBy: { dibuat_pada: "desc" },
  });

  return NextResponse.json(feedback);
}
