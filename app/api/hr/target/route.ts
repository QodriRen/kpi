import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  id_indikator: z.number(),
  id_karyawan: z.number(),
  id_periode: z.number(),
  nilai_target: z.number().positive(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "hr") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id_periode = searchParams.get("id_periode");
  const id_karyawan = searchParams.get("id_karyawan");

  const target = await prisma.targetKpi.findMany({
    where: {
      ...(id_periode ? { id_periode: Number(id_periode) } : {}),
      ...(id_karyawan ? { id_karyawan: Number(id_karyawan) } : {}),
    },
    include: {
      indikator: true,
      karyawan: { include: { pengguna: { select: { nama_lengkap: true } } } },
      periode: true,
      penilaian: true,
    },
    orderBy: { id_target: "desc" },
  });

  return NextResponse.json(target);
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

  // Check for duplicate
  const existing = await prisma.targetKpi.findFirst({
    where: {
      id_indikator: parsed.data.id_indikator,
      id_karyawan: parsed.data.id_karyawan,
      id_periode: parsed.data.id_periode,
    },
  });

  if (existing) {
    return NextResponse.json({ error: "Target sudah ada untuk indikator dan periode ini" }, { status: 400 });
  }

  const target = await prisma.targetKpi.create({
    data: {
      ...parsed.data,
      dibuat_oleh: session.user.name,
    },
  });

  return NextResponse.json(target, { status: 201 });
}
