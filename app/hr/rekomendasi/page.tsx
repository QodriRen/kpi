"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getGrade } from "@/lib/utils";

type KelasNB = "Lanjut Kontrak" | "Pindah Divisi" | "Tidak Lanjut Kontrak";

interface NaiveBayesResult {
  kelas: KelasNB;
  probabilitas: number;
  detail: Record<KelasNB, number>;
}

interface PeriodeSkor {
  id_periode: number;
  nama_periode: string;
  total_skor: number;
  pct_tercapai: number;
}

interface RekomendasiItem {
  id_karyawan: number;
  nama: string;
  divisi: string;
  periode_berurutan: PeriodeSkor[];
  avg_skor: number;
  avg_pct_tercapai: number;
  nb: NaiveBayesResult;
}

const NB_CLASSES: KelasNB[] = ["Lanjut Kontrak", "Pindah Divisi", "Tidak Lanjut Kontrak"];

function getNbVariant(kelas: KelasNB): "success" | "warning" | "destructive" {
  if (kelas === "Lanjut Kontrak") return "success";
  if (kelas === "Pindah Divisi") return "warning";
  return "destructive";
}

function getNbBarColor(kelas: KelasNB): string {
  if (kelas === "Lanjut Kontrak") return "bg-green-500";
  if (kelas === "Pindah Divisi") return "bg-yellow-500";
  return "bg-red-500";
}

function getSkorBarColor(skor: number): string {
  if (skor >= 96) return "bg-green-500";
  if (skor >= 88) return "bg-yellow-500";
  return "bg-red-500";
}

export default function HrRekomendasiPage() {
  const [data, setData] = useState<RekomendasiItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/hr/rekomendasi")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Rekomendasi Kontrak</h2>
        <p className="text-muted-foreground">
          Karyawan kontrak yang telah dinilai selama 6 bulan berurutan — prediksi Gaussian Naive Bayes
        </p>
      </div>

      {/* Keterangan algoritma */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <strong>Syarat muncul:</strong> Status karyawan = kontrak <strong>dan</strong> sudah dinilai di{" "}
        <strong>6 periode bulanan berurutan</strong> tanpa jeda.
        <br />
        <strong>Fitur NB:</strong> Rata-rata skor KPI dan rata-rata % indikator tercapai dari 6 bulan tersebut.
      </div>

      {data.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground space-y-2">
          <p className="text-base font-medium">Belum ada rekomendasi</p>
          <p className="text-sm">
            Pastikan karyawan kontrak sudah dinilai pada 6 periode bulanan yang berurutan.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {data.map((item, idx) => {
            const { grade, label, variant: gradeVariant } = getGrade(item.avg_skor);
            const nbVariant = getNbVariant(item.nb.kelas);

            const periodeAwal = item.periode_berurutan[0]?.nama_periode ?? "-";
            const periodeAkhir = item.periode_berurutan[item.periode_berurutan.length - 1]?.nama_periode ?? "-";

            return (
              <Card key={idx}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <CardTitle className="text-base">{item.nama}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {item.divisi} &nbsp;·&nbsp; {periodeAwal} – {periodeAkhir}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Rekomendasi NB:</span>
                      <Badge variant={nbVariant} className="text-sm px-3 py-1">
                        {item.nb.kelas}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Ringkasan rata-rata */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Rata-rata Skor</p>
                      <p className="font-semibold text-lg">{item.avg_skor.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Rata-rata % Tercapai</p>
                      <p className="font-semibold text-lg">{Math.round(item.avg_pct_tercapai * 100)}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Grade Keseluruhan</p>
                      <Badge variant={gradeVariant} className="mt-1">
                        {grade} — {label}
                      </Badge>
                    </div>
                  </div>

                  {/* Breakdown per bulan */}
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">Periode</th>
                          <th className="text-right px-3 py-2 font-medium text-muted-foreground">Skor</th>
                          <th className="px-3 py-2 font-medium text-muted-foreground">Grade</th>
                          <th className="text-right px-3 py-2 font-medium text-muted-foreground">% Tercapai</th>
                          <th className="px-3 py-2 font-medium text-muted-foreground w-24">Grafik</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {item.periode_berurutan.map((p, i) => (
                          <tr key={i} className="hover:bg-muted/20">
                            <td className="px-3 py-2">{p.nama_periode}</td>
                            <td className="px-3 py-2 text-right font-medium">{p.total_skor.toFixed(1)}</td>
                            <td className="px-3 py-2">
                              {(() => {
                                const g = getGrade(p.total_skor);
                                return (
                                  <Badge variant={g.variant} className="text-xs">
                                    {g.grade} — {g.label}
                                  </Badge>
                                );
                              })()}
                            </td>
                            <td className="px-3 py-2 text-right">{Math.round(p.pct_tercapai * 100)}%</td>
                            <td className="px-3 py-2">
                              <div className="h-2 rounded-full bg-secondary overflow-hidden w-20">
                                <div
                                  className={`h-full rounded-full ${getSkorBarColor(p.total_skor)}`}
                                  style={{ width: `${Math.min(p.total_skor, 100)}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                        {/* Baris rata-rata */}
                        <tr className="bg-muted/40 font-semibold">
                          <td className="px-3 py-2 text-muted-foreground">Rata-rata</td>
                          <td className="px-3 py-2 text-right">{item.avg_skor.toFixed(1)}</td>
                          <td className="px-3 py-2">
                            {(() => {
                              const g = getGrade(item.avg_skor);
                              return (
                                <Badge variant={g.variant} className="text-xs">
                                  {g.grade} — {g.label}
                                </Badge>
                              );
                            })()}
                          </td>
                          <td className="px-3 py-2 text-right">{Math.round(item.avg_pct_tercapai * 100)}%</td>
                          <td className="px-3 py-2">
                            <div className="h-2 rounded-full bg-secondary overflow-hidden w-20">
                              <div
                                className={`h-full rounded-full ${getSkorBarColor(item.avg_skor)}`}
                                style={{ width: `${Math.min(item.avg_skor, 100)}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Analisis Naive Bayes */}
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Analisis Gaussian Naive Bayes
                      </p>
                      <p className="text-xs text-muted-foreground">
                        avg_skor = {item.avg_skor.toFixed(1)} &nbsp;|&nbsp;
                        avg_%_tercapai = {Math.round(item.avg_pct_tercapai * 100)}%
                      </p>
                    </div>

                    <div className="space-y-2">
                      {NB_CLASSES.map((kelas) => {
                        const prob = item.nb.detail[kelas];
                        const persen = Math.round(prob * 100);
                        const isWinner = kelas === item.nb.kelas;
                        return (
                          <div key={kelas} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className={isWinner ? "font-semibold" : "text-muted-foreground"}>
                                {kelas}{isWinner ? " ✓" : ""}
                              </span>
                              <span className={isWinner ? "font-semibold" : "text-muted-foreground"}>
                                {persen}%
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-secondary overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${getNbBarColor(kelas)} ${!isWinner ? "opacity-40" : ""}`}
                                style={{ width: `${persen}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Kepercayaan prediksi: <strong>{Math.round(item.nb.probabilitas * 100)}%</strong>
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
