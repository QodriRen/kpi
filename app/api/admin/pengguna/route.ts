import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const createSchema = z.object({
  nama_lengkap: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["admin", "hr", "karyawan"]),
  is_aktif: z.boolean().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pengguna = await prisma.pengguna.findMany({
    orderBy: { id_pengguna: "desc" },
    select: {
      id_pengguna: true,
      nama_lengkap: true,
      email: true,
      role: true,
      is_aktif: true,
      karyawan: { select: { jabatan: true, divisi: { select: { nama_divisi: true } } } },
    },
  });

  return NextResponse.json(pengguna);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { nama_lengkap, email, password, role, is_aktif } = parsed.data;

  const existing = await prisma.pengguna.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
  }

  const password_hash = await bcrypt.hash(password, 12);
  const pengguna = await prisma.pengguna.create({
    data: { nama_lengkap, email, password_hash, role, is_aktif: is_aktif ?? true },
  });

  await prisma.logAktivitas.create({
    data: {
      id_pengguna: Number(session.user.id),
      aksi: `Menambahkan pengguna baru: ${nama_lengkap} (${role})`,
    },
  });

  return NextResponse.json(pengguna, { status: 201 });
}
