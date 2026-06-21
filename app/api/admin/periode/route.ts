import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const BULAN_ID = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

const schema = z.object({
  bulan: z.string().regex(/^\d{4}-\d{2}$/, "Format bulan harus YYYY-MM"),
  is_aktif: z.boolean().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const periode = await prisma.periodePenilaian.findMany({
    orderBy: { tanggal_mulai: "desc" },
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

  const [year, month] = parsed.data.bulan.split("-").map(Number);
  const tanggal_mulai = new Date(year, month - 1, 1);
  const tanggal_selesai = new Date(year, month, 0); // hari terakhir bulan
  const nama_periode = `${BULAN_ID[month - 1]} ${year}`;

  // Cegah duplikasi periode bulan yang sama
  const existing = await prisma.periodePenilaian.findFirst({
    where: { tanggal_mulai },
  });
  if (existing) {
    return NextResponse.json({ error: `Periode ${nama_periode} sudah ada` }, { status: 409 });
  }

  const periode = await prisma.periodePenilaian.create({
    data: {
      nama_periode,
      tanggal_mulai,
      tanggal_selesai,
      tipe_periode: "Bulanan",
      is_aktif: parsed.data.is_aktif ?? true,
    },
  });

  await prisma.logAktivitas.create({
    data: {
      id_pengguna: Number(session.user.id),
      aksi: `Membuat periode penilaian bulanan: ${nama_periode}`,
    },
  });

  return NextResponse.json(periode, { status: 201 });
}
