import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  id_divisi: z.number(),
  nama_indikator: z.string().min(2),
  kategori: z.string().optional(),
  satuan: z.string().optional(),
  bobot_persen: z.number().min(0).max(100),
  deskripsi: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id_divisi = searchParams.get("id_divisi");

  const indikator = await prisma.indikatorKpi.findMany({
    where: id_divisi ? { id_divisi: Number(id_divisi) } : undefined,
    include: { divisi: { select: { nama_divisi: true } } },
    orderBy: { id_indikator: "desc" },
  });

  return NextResponse.json(indikator);
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

  // Validasi total bobot divisi tidak melebihi 100
  const existingTotal = await prisma.indikatorKpi.aggregate({
    where: { id_divisi: parsed.data.id_divisi },
    _sum: { bobot_persen: true },
  });

  const currentTotal = Number(existingTotal._sum.bobot_persen ?? 0);
  if (currentTotal + parsed.data.bobot_persen > 100) {
    return NextResponse.json(
      { error: `Total bobot akan melebihi 100%. Sisa bobot: ${100 - currentTotal}%` },
      { status: 400 }
    );
  }

  const indikator = await prisma.indikatorKpi.create({ data: parsed.data });
  return NextResponse.json(indikator, { status: 201 });
}
