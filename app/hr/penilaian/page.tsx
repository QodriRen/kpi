"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DataTable from "@/components/tables/DataTable";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/utils";

const schema = z.object({
  id_target: z.number(),
  nilai_aktual: z.number().min(0, "Nilai tidak boleh negatif"),
  status_catatan: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Target {
  id_target: number;
  nilai_target: string;
  indikator: { nama_indikator: string; satuan: string | null; bobot_persen: string };
  karyawan: { pengguna: { nama_lengkap: string } };
  periode: { nama_periode: string; is_aktif: boolean };
  penilaian: { id_penilaian: number; nilai_aktual: string; skor_akhir: string }[];
}

interface Periode { id_periode: number; nama_periode: string; is_aktif: boolean }

export default function HrPenilaianPage() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [periode, setPeriode] = useState<Periode[]>([]);
  const [selectedPeriode, setSelectedPeriode] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<Target | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const fetchPeriode = async () => {
    const data = await fetch("/api/admin/periode").then((r) => r.json());
    setPeriode(data);
    const aktif = data.find((p: Periode) => p.is_aktif);
    if (aktif) setSelectedPeriode(String(aktif.id_periode));
  };

  const fetchTargets = async (periodeId: string) => {
    if (!periodeId) return;
    setLoading(true);
    const data = await fetch(`/api/hr/target?id_periode=${periodeId}`).then((r) => r.json());
    setTargets(data);
    setLoading(false);
  };

  useEffect(() => { fetchPeriode(); }, []);
  useEffect(() => { if (selectedPeriode) fetchTargets(selectedPeriode); }, [selectedPeriode]);

  const openPenilaian = (t: Target) => {
    setSelectedTarget(t);
    const existingPenilaian = t.penilaian[0];
    reset({
      id_target: t.id_target,
      nilai_aktual: existingPenilaian ? Number(existingPenilaian.nilai_aktual) : undefined,
      status_catatan: "",
    });
    setOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/hr/penilaian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Terjadi kesalahan");
      } else {
        toast.success("Penilaian berhasil disimpan");
        setOpen(false);
        fetchTargets(selectedPeriode);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: "karyawan", header: "Karyawan", render: (row: Target) => row.karyawan.pengguna.nama_lengkap },
    { key: "indikator", header: "Indikator", render: (row: Target) => row.indikator.nama_indikator },
    { key: "bobot", header: "Bobot", render: (row: Target) => `${Number(row.indikator.bobot_persen)}%` },
    { key: "target", header: "Target", render: (row: Target) => `${Number(row.nilai_target)} ${row.indikator.satuan ?? ""}` },
    {
      key: "aktual",
      header: "Aktual",
      render: (row: Target) =>
        row.penilaian[0] ? `${Number(row.penilaian[0].nilai_aktual)} ${row.indikator.satuan ?? ""}` : "-",
    },
    {
      key: "skor",
      header: "Skor",
      render: (row: Target) =>
        row.penilaian[0] ? (
          <Badge variant="info">{formatNumber(Number(row.penilaian[0].skor_akhir))}</Badge>
        ) : (
          "-"
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (row: Target) => (
        <Badge variant={row.penilaian.length > 0 ? "success" : "warning"}>
          {row.penilaian.length > 0 ? "Dinilai" : "Belum"}
        </Badge>
      ),
    },
    {
      key: "aksi",
      header: "Aksi",
      render: (row: Target) => (
        <Button size="sm" variant="outline" onClick={() => openPenilaian(row)}>
          <ClipboardCheck className="h-3 w-3 mr-1" />
          {row.penilaian.length > 0 ? "Ubah" : "Nilai"}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Input Penilaian KPI</h2>
        <p className="text-muted-foreground">Input nilai aktual dan hitung skor otomatis</p>
      </div>

      <div className="flex items-center gap-4">
        <Label>Filter Periode:</Label>
        <Select value={selectedPeriode} onValueChange={setSelectedPeriode}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Pilih periode" />
          </SelectTrigger>
          <SelectContent>
            {periode.map((p) => (
              <SelectItem key={p.id_periode} value={String(p.id_periode)}>
                {p.nama_periode} {p.is_aktif && "(Aktif)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
        </div>
      ) : (
        <DataTable data={targets} columns={columns} searchKey="id_target" />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Input Penilaian</DialogTitle>
          </DialogHeader>
          {selectedTarget && (
            <div className="bg-muted rounded-lg p-4 text-sm space-y-1">
              <p><span className="font-medium">Karyawan:</span> {selectedTarget.karyawan.pengguna.nama_lengkap}</p>
              <p><span className="font-medium">Indikator:</span> {selectedTarget.indikator.nama_indikator}</p>
              <p><span className="font-medium">Target:</span> {Number(selectedTarget.nilai_target)} {selectedTarget.indikator.satuan}</p>
              <p><span className="font-medium">Bobot:</span> {Number(selectedTarget.indikator.bobot_persen)}%</p>
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Nilai Aktual</Label>
              <Input
                type="number"
                step="0.01"
                {...register("nilai_aktual", { valueAsNumber: true })}
                placeholder={`Satuan: ${selectedTarget?.indikator.satuan ?? "-"}`}
              />
              {errors.nilai_aktual && <p className="text-sm text-destructive">{errors.nilai_aktual.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Catatan (opsional)</Label>
              <Textarea {...register("status_catatan")} rows={3} placeholder="Tambahkan catatan penilaian..." />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Menyimpan..." : "Simpan Penilaian"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
