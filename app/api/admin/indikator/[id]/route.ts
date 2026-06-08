import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  nama_indikator: z.string().min(2).optional(),
  kategori: z.string().optional(),
  satuan: z.string().optional(),
  bobot_persen: z.number().min(0).max(100).optional(),
  deskripsi: z.string().optional(),
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

  const indikator = await prisma.indikatorKpi.update({
    where: { id_indikator: Number(params.id) },
    data: parsed.data,
  });

  return NextResponse.json(indikator);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.indikatorKpi.delete({ where: { id_indikator: Number(params.id) } });
  return NextResponse.json({ success: true });
}
