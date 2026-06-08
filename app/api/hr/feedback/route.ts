import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  id_penilaian: z.number(),
  isi_feedback: z.string().min(5),
  tipe_feedback: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "hr") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const feedback = await prisma.feedback.findMany({
    include: {
      penilaian: {
        include: {
          target: {
            include: {
              karyawan: { include: { pengguna: { select: { nama_lengkap: true } } } },
              indikator: { select: { nama_indikator: true } },
            },
          },
        },
      },
      pemberi: { select: { nama_lengkap: true } },
    },
    orderBy: { dibuat_pada: "desc" },
  });

  return NextResponse.json(feedback);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user.role !== "hr" && session.user.role !== "karyawan")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const feedback = await prisma.feedback.create({
    data: {
      ...parsed.data,
      id_pemberi: Number(session.user.id),
      tipe_feedback: parsed.data.tipe_feedback ?? (session.user.role === "hr" ? "hr_ke_karyawan" : "karyawan_ke_hr"),
    },
  });

  return NextResponse.json(feedback, { status: 201 });
}
