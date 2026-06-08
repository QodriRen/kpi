import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  nama_periode: z.string().min(2).optional(),
  tanggal_mulai: z.string().optional(),
  tanggal_selesai: z.string().optional(),
  tipe_periode: z.string().optional(),
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

  const { tanggal_mulai, tanggal_selesai, ...rest } = parsed.data;
  const updateData: Record<string, unknown> = { ...rest };
  if (tanggal_mulai) updateData.tanggal_mulai = new Date(tanggal_mulai);
  if (tanggal_selesai) updateData.tanggal_selesai = new Date(tanggal_selesai);

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
