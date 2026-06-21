import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const BULAN_ID = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

const schema = z.object({
  bulan: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  is_aktif: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};

  if (parsed.data.bulan !== undefined) {
    const [year, month] = parsed.data.bulan.split("-").map(Number);
    updateData.nama_periode = `${BULAN_ID[month - 1]} ${year}`;
    updateData.tanggal_mulai = new Date(year, month - 1, 1);
    updateData.tanggal_selesai = new Date(year, month, 0);
    updateData.tipe_periode = "Bulanan";
  }

  if (parsed.data.is_aktif !== undefined) {
    updateData.is_aktif = parsed.data.is_aktif;
  }

  const periode = await prisma.periodePenilaian.update({
    where: { id_periode: Number(params.id) },
    data: updateData,
  });

  return NextResponse.json(periode);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.periodePenilaian.delete({ where: { id_periode: Number(params.id) } });
  return NextResponse.json({ success: true });
}
