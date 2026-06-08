import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  nama_periode: z.string().min(2),
  tanggal_mulai: z.string(),
  tanggal_selesai: z.string(),
  tipe_periode: z.string(),
  is_aktif: z.boolean().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const periode = await prisma.periodePenilaian.findMany({
    orderBy: { id_periode: "desc" },
    include: { _count: { select: { target_kpi: true } } },
  });

  return NextResponse.json(periode);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const periode = await prisma.periodePenilaian.create({
    data: {
      ...parsed.data,
      tanggal_mulai: new Date(parsed.data.tanggal_mulai),
      tanggal_selesai: new Date(parsed.data.tanggal_selesai),
    },
  });

  await prisma.logAktivitas.create({
    data: {
      id_pengguna: Number(session.user.id),
      aksi: `Membuat periode penilaian: ${parsed.data.nama_periode}`,
    },
  });

  return NextResponse.json(periode, { status: 201 });
}
