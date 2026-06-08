import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  nama_divisi: z.string().min(2),
  id_kepala: z.number().nullable().optional(),
  deskripsi: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const divisi = await prisma.divisi.findMany({
    include: {
      kepala: { select: { nama_lengkap: true } },
      _count: { select: { karyawan: true, indikator: true } },
    },
    orderBy: { id_divisi: "desc" },
  });

  return NextResponse.json(divisi);
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

  const divisi = await prisma.divisi.create({ data: parsed.data });
  return NextResponse.json(divisi, { status: 201 });
}
