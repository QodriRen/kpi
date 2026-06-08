import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  nama_lengkap: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  id_divisi: z.number(),
  nip: z.string().optional(),
  jabatan: z.string().optional(),
  status_kerja: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "hr") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const karyawan = await prisma.karyawan.findMany({
    include: {
      pengguna: { select: { nama_lengkap: true, email: true, is_aktif: true } },
      divisi: { select: { nama_divisi: true } },
    },
    orderBy: { id_karyawan: "desc" },
  });

  return NextResponse.json(karyawan);
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

  const { nama_lengkap, email, password, id_divisi, nip, jabatan, status_kerja } = parsed.data;

  const existing = await prisma.pengguna.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
  }

  const password_hash = await bcrypt.hash(password, 12);

  const karyawan = await prisma.$transaction(async (tx) => {
    const pengguna = await tx.pengguna.create({
      data: { nama_lengkap, email, password_hash, role: "karyawan" },
    });

    const kar = await tx.karyawan.create({
      data: { id_pengguna: pengguna.id_pengguna, id_divisi, nip, jabatan, status_kerja },
    });

    await tx.logAktivitas.create({
      data: {
        id_pengguna: Number(session.user.id),
        aksi: `Menambahkan karyawan baru: ${nama_lengkap}`,
      },
    });

    return kar;
  });

  return NextResponse.json(karyawan, { status: 201 });
}
