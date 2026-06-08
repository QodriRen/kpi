import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { skorIndikator } from "@/lib/utils";

const schema = z.object({
  id_target: z.number(),
  nilai_aktual: z.number().min(0),
  status_catatan: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "hr") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id_periode = searchParams.get("id_periode");

  const penilaian = await prisma.penilaianKpi.findMany({
    where: id_periode
      ? { target: { id_periode: Number(id_periode) } }
      : undefined,
    include: {
      target: {
        include: {
          indikator: true,
          karyawan: { include: { pengguna: { select: { nama_lengkap: true } } } },
          periode: true,
        },
      },
      penilai: { select: { nama_lengkap: true } },
    },
    orderBy: { id_penilaian: "desc" },
  });

  return NextResponse.json(penilaian);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "hr") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const target = await prisma.targetKpi.findUnique({
    where: { id_target: parsed.data.id_target },
    include: { indikator: true },
  });

  if (!target) {
    return NextResponse.json({ error: "Target tidak ditemukan" }, { status: 404 });
  }

  const skor_akhir = skorIndikator(
    parsed.data.nilai_aktual,
    Number(target.nilai_target),
    Number(target.indikator.bobot_persen)
  );

  const existing = await prisma.penilaianKpi.findFirst({
    where: { id_target: parsed.data.id_target },
  });

  let penilaian;
  if (existing) {
    penilaian = await prisma.penilaianKpi.update({
      where: { id_penilaian: existing.id_penilaian },
      data: {
        nilai_aktual: parsed.data.nilai_aktual,
        skor_akhir,
        id_penilai: Number(session.user.id),
        status_catatan: parsed.data.status_catatan,
      },
    });
  } else {
    penilaian = await prisma.penilaianKpi.create({
      data: {
        id_target: parsed.data.id_target,
        id_penilai: Number(session.user.id),
        nilai_aktual: parsed.data.nilai_aktual,
        skor_akhir,
        status_catatan: parsed.data.status_catatan,
      },
    });
  }

  await prisma.logAktivitas.create({
    data: {
      id_pengguna: Number(session.user.id),
      aksi: `Menginput penilaian KPI, skor: ${skor_akhir.toFixed(2)}`,
    },
  });

  return NextResponse.json(penilaian, { status: 201 });
}
