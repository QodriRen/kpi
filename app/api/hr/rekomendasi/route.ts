import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { prediksiNaiveBayes, type NaiveBayesResult } from "@/lib/naive-bayes";

interface PeriodeSkor {
  id_periode: number;
  nama_periode: string;
  tanggal_mulai: Date;
  total_skor: number;
  pct_tercapai: number;
}

/** Indeks bulan linear (unik per bulan kalender) */
function monthIdx(d: Date): number {
  return d.getFullYear() * 12 + d.getMonth();
}

/**
 * Temukan semua run berurutan (tiap periode bulannya tepat = bulan sebelumnya + 1).
 * Mengembalikan array of run, masing-masing run sudah terurut ASC.
 */
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
          indikator: { select: { bobot_persen: true } },
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
    // Kelompokkan target berdasarkan periode
    const byPeriode = new Map<number, typeof k.target_kpi>();
    for (const t of k.target_kpi) {
      const arr = byPeriode.get(t.id_periode) ?? [];
      arr.push(t);
      byPeriode.set(t.id_periode, arr);
    }

    // Hitung skor tiap periode (hanya periode yang sudah dinilai)
    const periodeScores: PeriodeSkor[] = [];
    for (const [idPeriode, targets] of byPeriode.entries()) {
      const dinilai = targets.filter((t) => t.penilaian.length > 0);
      if (dinilai.length === 0) continue;

      const totalSkor = dinilai.reduce((sum, t) => {
        const aktual = Number(t.penilaian[0].nilai_aktual);
        const target = Number(t.nilai_target);
        const bobot = Number(t.indikator.bobot_persen);
        return sum + (aktual / target) * bobot;
      }, 0);

      // Tercapai = aktual >= 80% target (konsisten dengan threshold Grade A)
      const tercapai = dinilai.filter(
        (t) => Number(t.penilaian[0].nilai_aktual) / Number(t.nilai_target) >= 0.8
      ).length;

      periodeScores.push({
        id_periode: idPeriode,
        nama_periode: targets[0].periode.nama_periode,
        tanggal_mulai: new Date(targets[0].periode.tanggal_mulai),
        total_skor: totalSkor,
        pct_tercapai: tercapai / dinilai.length,
      });
    }

    // Cari run berurutan >= 6 bulan
    const runs = findConsecutiveRuns(periodeScores);
    const qualifying = runs.filter((r) => r.length >= 6);
    if (qualifying.length === 0) continue;

    // Ambil run terakhir (paling baru), gunakan 6 bulan terakhirnya
    const latestRun = qualifying[qualifying.length - 1];
    const sixMonths = latestRun.slice(-6);

    const avgSkor = sixMonths.reduce((s, p) => s + p.total_skor, 0) / 6;
    const avgPctTercapai = sixMonths.reduce((s, p) => s + p.pct_tercapai, 0) / 6;

    const nb = prediksiNaiveBayes(avgSkor, avgPctTercapai);

    result.push({
      id_karyawan: k.id_karyawan,
      nama: k.pengguna.nama_lengkap,
      divisi: k.divisi.nama_divisi,
      periode_berurutan: sixMonths,
      avg_skor: avgSkor,
      avg_pct_tercapai: avgPctTercapai,
      nb,
    });
  }

  return NextResponse.json(result);
}
