"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, Info } from "lucide-react";

interface TargetItem {
  id_target: number;
  nilai_target: string;
  dibuat_oleh: string | null;
  indikator: {
    nama_indikator: string;
    kategori: string | null;
    satuan: string | null;
    bobot_persen: string;
    deskripsi: string | null;
  };
  periode: { nama_periode: string; tipe_periode: string };
  penilaian: { nilai_aktual: string }[];
}

export default function KaryawanTargetPage() {
  const [targets, setTargets] = useState<TargetItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/karyawan/target")
      .then((r) => r.json())
      .then((d) => {
        setTargets(d);
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Target KPI Saya</h2>
        <p className="text-muted-foreground">Target yang telah ditetapkan HR untuk periode aktif</p>
      </div>

      {targets.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800">Menunggu HR menetapkan target</p>
            <p className="text-sm text-blue-700">
              Target KPI Anda untuk periode aktif belum ditetapkan oleh HR.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {targets.map((t) => (
            <Card key={t.id_target}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Target className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{t.indikator.nama_indikator}</p>
                      {t.indikator.kategori && (
                        <p className="text-xs text-muted-foreground">{t.indikator.kategori}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={t.penilaian.length > 0 ? "success" : "warning"}>
                    {t.penilaian.length > 0 ? "Sudah Dinilai" : "Belum Dinilai"}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Target</span>
                    <span className="font-medium">
                      {Number(t.nilai_target)} {t.indikator.satuan ?? ""}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bobot</span>
                    <Badge variant="info">{Number(t.indikator.bobot_persen)}%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Periode</span>
                    <span>{t.periode.nama_periode}</span>
                  </div>
                  {t.dibuat_oleh && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ditetapkan oleh</span>
                      <span>{t.dibuat_oleh}</span>
                    </div>
                  )}
                </div>

                {t.indikator.deskripsi && (
                  <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                    {t.indikator.deskripsi}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
