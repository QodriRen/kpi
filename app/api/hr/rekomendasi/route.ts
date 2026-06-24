import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { prediksiNaiveBayes, type NaiveBayesResult } from "@/lib/naive-bayes";

interface IndikatorDetail {
  nama_indikator: string;
  satuan: string | null;
  nilai_aktual: number;
  nilai_target: number;
  bobot_persen: number;
  skor: number;
  tercapai: boolean;
}

interface PeriodeSkor {
  id_periode: number;
  nama_periode: string;
  tanggal_mulai: Date;
  total_skor: number;
  pct_tercapai: number;
  indikator: IndikatorDetail[];
}

function monthIdx(d: Date): number {
  return d.getFullYear() * 12 + d.getMonth();
}

function findConsecutiveRuns(items: PeriodeSkor[]): PeriodeSkor[][] {
  if (items.length === 0) return [];
  const sorted = [...items].sort((a, b) => monthIdx(a.tanggal_mulai) - monthIdx(b.tanggal_mulai));
  const runs: PeriodeSkor[][] = [[sorted[0]]];
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    if (monthIdx(curr.tanggal_mulai) === monthIdx(prev.tanggal_mulai) + 1) {
      runs[runs.length - 1].push(curr);
    } else {
      runs.push([curr]);
    }
  }
  return runs;
}

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "hr") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const karyawanList = await prisma.karyawan.findMany({
    where: { status_kerja: { contains: "kontrak" } },
    include: {
      pengguna: { select: { nama_lengkap: true } },
      divisi: { select: { nama_divisi: true } },
      target_kpi: {
        include: {
          periode: true,
          indikator: { select: { bobot_persen: true, nama_indikator: true, satuan: true } },
          penilaian: { select: { nilai_aktual: true } },
        },
      },
    },
  });

  const result: {
    id_karyawan: number;
    nama: string;
    divisi: string;
    periode_berurutan: PeriodeSkor[];
    avg_skor: number;
    avg_pct_tercapai: number;
    nb: NaiveBayesResult;
  }[] = [];

  for (const k of karyawanList) {
    const byPeriode = new Map<number, typeof k.target_kpi>();
    for (const t of k.target_kpi) {
      const arr = byPeriode.get(t.id_periode) ?? [];
      arr.push(t);
      byPeriode.set(t.id_periode, arr);
    }

    const periodeScores: PeriodeSkor[] = [];
    for (const [idPeriode, targets] of byPeriode.entries()) {
      const dinilai = targets.filter((t) => t.penilaian.length > 0);
      if (dinilai.length === 0) continue;

      const indikatorDetails: IndikatorDetail[] = dinilai.map((t) => {
        const aktual = Number(t.penilaian[0].nilai_aktual);
        const target = Number(t.nilai_target);
        const bobot = Number(t.indikator.bobot_persen);
        return {
          nama_indikator: t.indikator.nama_indikator,
          satuan: t.indikator.satuan,
          nilai_aktual: aktual,
          nilai_target: target,
          bobot_persen: bobot,
          skor: (aktual / target) * bobot,
          tercapai: aktual / target >= 0.8,
        };
      });

      const totalSkor = indikatorDetails.reduce((s, i) => s + i.skor, 0);
      const tercapai = indikatorDetails.filter((i) => i.tercapai).length;

      periodeScores.push({
        id_periode: idPeriode,
        nama_periode: targets[0].periode.nama_periode,
        tanggal_mulai: new Date(targets[0].periode.tanggal_mulai),
        total_skor: totalSkor,
        pct_tercapai: tercapai / dinilai.length,
        indikator: indikatorDetails,
      });
    }

    const runs = findConsecutiveRuns(periodeScores);
    const qualifying = runs.filter((r) => r.length >= 6);
    if (qualifying.length === 0) continue;

    const latestRun = qualifying[qualifying.length - 1];
    const sixMonths = latestRun.slice(-6);

    const avgSkor = sixMonths.reduce((s, p) => s + p.total_skor, 0) / 6;
    const avgPctTercapai = sixMonths.reduce((s, p) => s + p.pct_tercapai, 0) / 6;

    result.push({
      id_karyawan: k.id_karyawan,
      nama: k.pengguna.nama_lengkap,
      divisi: k.divisi.nama_divisi,
      periode_berurutan: sixMonths,
      avg_skor: avgSkor,
      avg_pct_tercapai: avgPctTercapai,
      nb: prediksiNaiveBayes(avgSkor, avgPctTercapai),
    });
  }

  return NextResponse.json(result);
}
