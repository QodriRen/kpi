"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ScoreGauge from "@/components/dashboard/ScoreGauge";
import { getColorBySkor } from "@/lib/utils";
import { Info } from "lucide-react";

interface TargetItem {
  id_target: number;
  nilai_target: string;
  indikator: { nama_indikator: string; satuan: string | null; bobot_persen: string };
  penilaian: { nilai_aktual: string; skor_akhir: string }[];
}

interface DashboardData {
  periodeAktif: { nama_periode: string; tanggal_mulai: string; tanggal_selesai: string } | null;
  targets: TargetItem[];
  totalSkor: number;
}

export default function KaryawanDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/karyawan/dashboard")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!data?.periodeAktif) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Dashboard KPI Saya</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 flex items-start gap-3">
          <Info className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800">Tidak ada periode aktif</p>
            <p className="text-sm text-yellow-700">
              Belum ada periode penilaian yang aktif. Hubungi HR atau Admin untuk informasi lebih lanjut.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (data.targets.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Dashboard KPI Saya</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800">Menunggu HR menetapkan target</p>
            <p className="text-sm text-blue-700">
              Periode aktif: <strong>{data.periodeAktif.nama_periode}</strong>. Target KPI Anda belum ditetapkan oleh HR.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const targetsWithPenilaian = data.targets.filter((t) => t.penilaian.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard KPI Saya</h2>
        <p className="text-muted-foreground">Periode: {data.periodeAktif.nama_periode}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Skor Total KPI</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center py-4">
            {targetsWithPenilaian.length > 0 ? (
              <ScoreGauge skor={data.totalSkor} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Belum ada penilaian dari HR</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Breakdown per Indikator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.targets.map((t) => {
              const penilaian = t.penilaian[0];
              const nilaiAktual = penilaian ? Number(penilaian.nilai_aktual) : null;
              const nilaiTarget = Number(t.nilai_target);
              const persen = nilaiAktual !== null ? Math.min((nilaiAktual / nilaiTarget) * 100, 100) : 0;
              const colorBar = getColorBySkor(persen);

              return (
                <div key={t.id_target} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{t.indikator.nama_indikator}</span>
                    <div className="flex items-center gap-2">
                      {penilaian ? (
                        <>
                          <span className="text-muted-foreground">
                            {nilaiAktual} / {nilaiTarget} {t.indikator.satuan}
                          </span>
                          <Badge
                            variant={persen >= 96 ? "success" : persen >= 88 ? "warning" : "destructive"}
                            className="text-xs"
                          >
                            {persen.toFixed(0)}%
                          </Badge>
                        </>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Belum dinilai</Badge>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <Progress value={persen} className="h-2" />
                    <div
                      className={`absolute top-0 left-0 h-2 rounded-full transition-all ${colorBar}`}
                      style={{ width: `${persen}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Bobot: {Number(t.indikator.bobot_persen)}% •{" "}
                    Skor: {penilaian ? Number(penilaian.skor_akhir).toFixed(2) : "-"}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
