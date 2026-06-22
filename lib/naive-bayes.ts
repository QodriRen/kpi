interface GaussianDist {
  mean: number;
  variance: number;
}

interface ClassModel {
  prior: number;
  totalSkor: GaussianDist;
  pctTercapai: GaussianDist;
}

export type KelasNB = "Lanjut Kontrak" | "Pindah Divisi" | "Tidak Lanjut Kontrak";

const KELAS_LIST: KelasNB[] = ["Lanjut Kontrak", "Pindah Divisi", "Tidak Lanjut Kontrak"];

// Parameter distribusi Gaussian per kelas — disesuaikan dengan skala penilaian:
//   Baik   : skor 96–100%  → Lanjut Kontrak
//   Cukup  : skor 88–95%   → Pindah Divisi
//   Kurang : skor < 88%    → Tidak Lanjut Kontrak
// totalSkor  : rata-rata skor KPI total dari 6 bulan (0–100)
// pctTercapai: fraksi indikator dengan aktual >= 80% target, rata-rata 6 bulan (0–1)
const MODEL: Record<KelasNB, ClassModel> = {
  "Lanjut Kontrak": {
    prior: 0.40,
    totalSkor: { mean: 97.5, variance: 4 },       // Baik: 96–100, σ≈2
    pctTercapai: { mean: 0.90, variance: 0.025 },
  },
  "Pindah Divisi": {
    prior: 0.35,
    totalSkor: { mean: 91, variance: 9 },          // Cukup: 88–95, σ≈3
    pctTercapai: { mean: 0.72, variance: 0.035 },
  },
  "Tidak Lanjut Kontrak": {
    prior: 0.25,
    totalSkor: { mean: 75, variance: 100 },        // Kurang: <88, σ≈10
    pctTercapai: { mean: 0.45, variance: 0.07 },
  },
};

function gaussianLogPdf(x: number, mean: number, variance: number): number {
  return -0.5 * Math.log(2 * Math.PI * variance) - (x - mean) ** 2 / (2 * variance);
}

export interface NaiveBayesResult {
  kelas: KelasNB;
  probabilitas: number;
  detail: Record<KelasNB, number>;
}

/**
 * Gaussian Naive Bayes classifier untuk rekomendasi kelanjutan kontrak.
 *
 * Log-posterior per kelas: log P(C) + log P(skor|C) + log P(pct|C)
 * Normalisasi pakai log-sum-exp trick agar numerik stabil.
 */
export function prediksiNaiveBayes(totalSkor: number, pctTercapai: number): NaiveBayesResult {
  const logScores: Record<KelasNB, number> = {
    "Lanjut Kontrak": 0,
    "Pindah Divisi": 0,
    "Tidak Lanjut Kontrak": 0,
  };

  for (const kelas of KELAS_LIST) {
    const m = MODEL[kelas];
    logScores[kelas] =
      Math.log(m.prior) +
      gaussianLogPdf(totalSkor, m.totalSkor.mean, m.totalSkor.variance) +
      gaussianLogPdf(pctTercapai, m.pctTercapai.mean, m.pctTercapai.variance);
  }

  // Log-sum-exp normalization
  const maxLog = Math.max(...KELAS_LIST.map((k) => logScores[k]));
  const expArr = KELAS_LIST.map((k) => Math.exp(logScores[k] - maxLog));
  const sumExp = expArr.reduce((a, b) => a + b, 0);

  const detail: Record<KelasNB, number> = {
    "Lanjut Kontrak": 0,
    "Pindah Divisi": 0,
    "Tidak Lanjut Kontrak": 0,
  };
  for (let i = 0; i < KELAS_LIST.length; i++) {
    detail[KELAS_LIST[i]] = expArr[i] / sumExp;
  }

  let bestKelas = KELAS_LIST[0];
  for (const k of KELAS_LIST) {
    if (detail[k] > detail[bestKelas]) bestKelas = k;
  }

  return { kelas: bestKelas, probabilitas: detail[bestKelas], detail };
}
