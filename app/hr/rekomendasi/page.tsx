"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getGrade } from "@/lib/utils";
import { ChevronRight, ChevronDown } from "lucide-react";

type KelasNB = "Lanjut Kontrak" | "Pindah Divisi" | "Tidak Lanjut Kontrak";

interface NaiveBayesResult {
  kelas: KelasNB;
  probabilitas: number;
  detail: Record<KelasNB, number>;
}

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
  total_skor: number;
  pct_tercapai: number;
  indikator: IndikatorDetail[];
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
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/hr/rekomendasi")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function togglePeriode(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

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
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground w-6"></th>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">Periode</th>
                          <th className="text-right px-3 py-2 font-medium text-muted-foreground">Skor</th>
                          <th className="px-3 py-2 font-medium text-muted-foreground">Grade</th>
                          <th className="text-right px-3 py-2 font-medium text-muted-foreground">% Tercapai</th>
                          <th className="px-3 py-2 font-medium text-muted-foreground w-24">Grafik</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {item.periode_berurutan.map((p, i) => {
                          const rowKey = `${idx}-${p.id_periode}`;
                          const isOpen = expanded.has(rowKey);
                          const g = getGrade(p.total_skor);

                          return (
                            <>
                              {/* Baris periode — klik untuk expand */}
                              <tr
                                key={rowKey}
                                className="hover:bg-muted/30 cursor-pointer select-none"
                                onClick={() => togglePeriode(rowKey)}
                              >
                                <td className="px-3 py-2 text-muted-foreground">
                                  {isOpen
                                    ? <ChevronDown className="h-3.5 w-3.5" />
                                    : <ChevronRight className="h-3.5 w-3.5" />}
                                </td>
                                <td className="px-3 py-2 font-medium">{p.nama_periode}</td>
                                <td className="px-3 py-2 text-right font-medium">{p.total_skor.toFixed(1)}</td>
                                <td className="px-3 py-2">
                                  <Badge variant={g.variant} className="text-xs">
                                    {g.grade} — {g.label}
                                  </Badge>
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

                              {/* Baris rincian indikator — muncul saat diklik */}
                              {isOpen && (
                                <tr key={`${rowKey}-detail`}>
                                  <td colSpan={6} className="p-0 bg-muted/10">
                                    <div className="px-8 py-3 border-t border-dashed">
                                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                        Rincian Indikator — {p.nama_periode}
                                      </p>
                                      <table className="w-full text-xs">
                                        <thead>
                                          <tr className="text-muted-foreground">
                                            <th className="text-left pb-1 font-medium">Indikator</th>
                                            <th className="text-right pb-1 font-medium">Aktual</th>
                                            <th className="text-right pb-1 font-medium">Target</th>
                                            <th className="text-right pb-1 font-medium">Bobot</th>
                                            <th className="text-right pb-1 font-medium">Skor</th>
                                            <th className="text-center pb-1 font-medium">Status</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                          {p.indikator.map((ind, j) => (
                                            <tr key={j} className="py-1">
                                              <td className="py-1.5 pr-2">{ind.nama_indikator}</td>
                                              <td className="py-1.5 text-right">
                                                {ind.nilai_aktual} {ind.satuan ?? ""}
                                              </td>
                                              <td className="py-1.5 text-right">
                                                {ind.nilai_target} {ind.satuan ?? ""}
                                              </td>
                                              <td className="py-1.5 text-right">{ind.bobot_persen}%</td>
                                              <td className="py-1.5 text-right font-medium">
                                                {ind.skor.toFixed(2)}
                                              </td>
                                              <td className="py-1.5 text-center">
                                                <Badge
                                                  variant={ind.tercapai ? "success" : "destructive"}
                                                  className="text-[10px] px-1.5 py-0"
                                                >
                                                  {ind.tercapai ? "Tercapai" : "Belum"}
                                                </Badge>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </>
                          );
                        })}

                        {/* Baris rata-rata */}
                        <tr className="bg-muted/40 font-semibold">
                          <td className="px-3 py-2"></td>
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
