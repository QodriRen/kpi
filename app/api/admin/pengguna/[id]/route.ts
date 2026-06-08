import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const updateSchema = z.object({
  nama_lengkap: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["admin", "hr", "karyawan"]).optional(),
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
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { password, ...rest } = parsed.data;
  const updateData: Record<string, unknown> = { ...rest };

  if (password) {
    updateData.password_hash = await bcrypt.hash(password, 12);
  }

  const pengguna = await prisma.pengguna.update({
    where: { id_pengguna: Number(params.id) },
    data: updateData,
    select: { id_pengguna: true, nama_lengkap: true, email: true, role: true, is_aktif: true },
  });

  return NextResponse.json(pengguna);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Soft delete - nonaktifkan saja
  const pengguna = await prisma.pengguna.update({
    where: { id_pengguna: Number(params.id) },
    data: { is_aktif: false },
  });

  return NextResponse.json(pengguna);
}
