import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { prediksiNaiveBayes, type NaiveBayesResult } from "@/lib/naive-bayes";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "karyawan") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const karyawan = await prisma.karyawan.findUnique({
    where: { id_pengguna: Number(session.user.id) },
  });

  if (!karyawan) return NextResponse.json({ items: [], statusKerja: null, nb_per_periode: {} });

  const targets = await prisma.targetKpi.findMany({
    where: { id_karyawan: karyawan.id_karyawan },
    include: {
      indikator: true,
      periode: true,
      penilaian: {
        include: { penilai: { select: { nama_lengkap: true } } },
      },
    },
    orderBy: { id_target: "desc" },
  });

  const isKontrak = karyawan.status_kerja?.toLowerCase().includes("kontrak") ?? false;

  // Hitung NB prediction per periode, khusus karyawan kontrak
  const nbPerPeriode: Record<string, NaiveBayesResult> = {};
  if (isKontrak) {
    const byPeriode = new Map<string, typeof targets>();
    for (const t of targets) {
      const key = t.periode.nama_periode;
      const arr = byPeriode.get(key) ?? [];
      arr.push(t);
      byPeriode.set(key, arr);
    }

    for (const [namaPeriode, periodeTargets] of byPeriode.entries()) {
      const dinilai = periodeTargets.filter((t) => t.penilaian.length > 0);
      if (dinilai.length === 0) continue;

      const totalSkor = dinilai.reduce((sum, t) => {
        const aktual = Number(t.penilaian[0].nilai_aktual);
        const target = Number(t.nilai_target);
        const bobot = Number(t.indikator.bobot_persen);
        return sum + (aktual / target) * bobot;
      }, 0);

      const tercapai = dinilai.filter(
        (t) => Number(t.penilaian[0].nilai_aktual) >= Number(t.nilai_target)
      ).length;
      const pctTercapai = tercapai / dinilai.length;

      nbPerPeriode[namaPeriode] = prediksiNaiveBayes(totalSkor, pctTercapai);
    }
  }

  return NextResponse.json({
    items: targets,
    statusKerja: karyawan.status_kerja,
    nb_per_periode: nbPerPeriode,
  });
}
