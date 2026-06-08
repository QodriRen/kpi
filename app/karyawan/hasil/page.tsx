"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { getGrade, getColorBySkor, totalSkor } from "@/lib/utils";
import ScoreGauge from "@/components/dashboard/ScoreGauge";

interface HasilItem {
  id_target: number;
  nilai_target: string;
  indikator: { nama_indikator: string; satuan: string | null; bobot_persen: string };
  periode: { nama_periode: string };
  penilaian: {
    nilai_aktual: string;
    skor_akhir: string;
    status_catatan: string | null;
    penilai: { nama_lengkap: string };
  }[];
}

export default function KaryawanHasilPage() {
  const [hasil, setHasil] = useState<HasilItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/karyawan/hasil")
      .then((r) => r.json())
      .then((d) => {
        setHasil(d);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
      </div>
    );
  }

  // Group by periode
  const byPeriode = hasil.reduce<Record<string, HasilItem[]>>((acc, item) => {
    const key = item.periode.nama_periode;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Hasil Penilaian KPI</h2>
        <p className="text-muted-foreground">Riwayat penilaian KPI per periode</p>
      </div>

      {Object.keys(byPeriode).length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Belum ada hasil penilaian</p>
        </div>
      )}

      {Object.entries(byPeriode).map(([namaPeriode, items]) => {
        const dinilai = items.filter((i) => i.penilaian.length > 0);
        const skorTotal = totalSkor(
          dinilai.map((i) => ({
            nilai_aktual: Number(i.penilaian[0].nilai_aktual),
            nilai_target: Number(i.nilai_target),
            bobot_persen: Number(i.indikator.bobot_persen),
          }))
        );
        const { grade, label, color } = getGrade(skorTotal);

        return (
          <div key={namaPeriode} className="space-y-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold">{namaPeriode}</h3>
              {dinilai.length > 0 && (
                <Badge
                  variant={color === "green" ? "success" : color === "blue" ? "info" : color === "yellow" ? "warning" : "destructive"}
                >
                  Grade {grade} — {label}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dinilai.length > 0 && (
                <Card className="flex items-center justify-center p-4">
                  <ScoreGauge skor={skorTotal} />
                </Card>
              )}

              <div className={`space-y-3 ${dinilai.length > 0 ? "md:col-span-2" : "md:col-span-3"}`}>
                {items.map((item) => {
                  const p = item.penilaian[0];
                  const nilaiAktual = p ? Number(p.nilai_aktual) : null;
                  const nilaiTarget = Number(item.nilai_target);
                  const persen = nilaiAktual !== null ? Math.min((nilaiAktual / nilaiTarget) * 100, 100) : 0;
                  const colorBar = getColorBySkor(persen);

                  return (
                    <Card key={item.id_target}>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{item.indikator.nama_indikator}</p>
                          {p ? (
                            <Badge variant="info" className="text-xs">
                              Skor: {Number(p.skor_akhir).toFixed(2)}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Belum dinilai</Badge>
                          )}
                        </div>
                        {p && (
                          <>
                            <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
                              <div
                                className={`absolute top-0 left-0 h-full rounded-full transition-all ${colorBar}`}
                                style={{ width: `${persen}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Aktual: {nilaiAktual} {item.indikator.satuan}</span>
                              <span>Target: {nilaiTarget} {item.indikator.satuan}</span>
                              <span>Bobot: {Number(item.indikator.bobot_persen)}%</span>
                            </div>
                            {p.status_catatan && (
                              <p className="text-xs bg-muted rounded p-2 mt-1">{p.status_catatan}</p>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
