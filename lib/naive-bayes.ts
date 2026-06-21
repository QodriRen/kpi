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

// Parameter distribusi Gaussian per kelas berdasarkan domain knowledge penilaian KPI.
// totalSkor  : skor KPI total (0–100)
// pctTercapai: fraksi indikator di mana nilai_aktual >= nilai_target (0–1)
const MODEL: Record<KelasNB, ClassModel> = {
  "Lanjut Kontrak": {
    prior: 0.40,
    totalSkor: { mean: 87, variance: 25 },
    pctTercapai: { mean: 0.90, variance: 0.008 },
  },
  "Pindah Divisi": {
    prior: 0.35,
    totalSkor: { mean: 78, variance: 4 },
    pctTercapai: { mean: 0.78, variance: 0.012 },
  },
  "Tidak Lanjut Kontrak": {
    prior: 0.25,
    totalSkor: { mean: 60, variance: 100 },
    pctTercapai: { mean: 0.55, variance: 0.04 },
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
