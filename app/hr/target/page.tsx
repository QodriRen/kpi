"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const schema = z.object({
  id_indikator: z.number({ required_error: "Pilih indikator" }),
  id_karyawan: z.number({ required_error: "Pilih karyawan" }),
  id_periode: z.number({ required_error: "Pilih periode" }),
  nilai_target: z.number().positive("Nilai harus positif"),
});

type FormData = z.infer<typeof schema>;

interface Target {
  id_target: number;
  nilai_target: string;
  indikator: { nama_indikator: string; satuan: string | null; bobot_persen: string };
  karyawan: { pengguna: { nama_lengkap: string } };
  periode: { nama_periode: string };
  penilaian: { id_penilaian: number }[];
}
interface Karyawan { id_karyawan: number; id_divisi: number; pengguna: { nama_lengkap: string }; divisi: { nama_divisi: string } }
interface Indikator { id_indikator: number; id_divisi: number; nama_indikator: string; satuan: string | null }
interface Periode { id_periode: number; nama_periode: string; is_aktif: boolean }

export default function HrTargetPage() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [karyawan, setKaryawan] = useState<Karyawan[]>([]);
  const [indikator, setIndikator] = useState<Indikator[]>([]);
  const [periode, setPeriode] = useState<Periode[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDivisiId, setSelectedDivisiId] = useState<number | null>(null);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const fetchData = async () => {
    setLoading(true);
    const [t, k, ind, per] = await Promise.all([
      fetch("/api/hr/target").then((r) => r.json()),
      fetch("/api/hr/karyawan").then((r) => r.json()),
      fetch("/api/admin/indikator").then((r) => r.json()),
      fetch("/api/admin/periode").then((r) => r.json()),
    ]);
    setTargets(t);
    setKaryawan(k);
    setIndikator(ind);
    setPeriode(per);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/hr/target", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(typeof err.error === "string" ? err.error : "Terjadi kesalahan");
      } else {
        toast.success("Target KPI berhasil ditetapkan");
        setOpen(false);
        reset();
        fetchData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: "karyawan", header: "Karyawan", render: (row: Target) => row.karyawan.pengguna.nama_lengkap },
    { key: "indikator", header: "Indikator", render: (row: Target) => row.indikator.nama_indikator },
    { key: "periode", header: "Periode", render: (row: Target) => row.periode.nama_periode },
    {
      key: "nilai_target",
      header: "Target",
      render: (row: Target) => `${Number(row.nilai_target)} ${row.indikator.satuan ?? ""}`,
    },
    {
      key: "bobot",
      header: "Bobot",
      render: (row: Target) => <Badge variant="info">{Number(row.indikator.bobot_persen)}%</Badge>,
    },
    {
      key: "status",
      header: "Status Penilaian",
      render: (row: Target) => (
        <Badge variant={row.penilaian.length > 0 ? "success" : "warning"}>
          {row.penilaian.length > 0 ? "Sudah Dinilai" : "Belum Dinilai"}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Target KPI</h2>
          <p className="text-muted-foreground">Tetapkan target KPI untuk karyawan</p>
        </div>
        <Button onClick={() => { reset(); setSelectedDivisiId(null); setOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Tetapkan Target
        </Button>
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
            <DialogTitle>Tetapkan Target KPI</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Karyawan</Label>
              <Select onValueChange={(v) => {
                const id = Number(v);
                setValue("id_karyawan", id);
                const found = karyawan.find((k) => k.id_karyawan === id);
                setSelectedDivisiId(found?.id_divisi ?? null);
                setValue("id_indikator", 0 as unknown as number); // reset indikator
              }}>
                <SelectTrigger><SelectValue placeholder="Pilih karyawan" /></SelectTrigger>
                <SelectContent>
                  {karyawan.map((k) => (
                    <SelectItem key={k.id_karyawan} value={String(k.id_karyawan)}>
                      {k.pengguna.nama_lengkap} — {k.divisi.nama_divisi}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.id_karyawan && <p className="text-sm text-destructive">{errors.id_karyawan.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Periode</Label>
              <Select onValueChange={(v) => setValue("id_periode", Number(v))}>
                <SelectTrigger><SelectValue placeholder="Pilih periode" /></SelectTrigger>
                <SelectContent>
                  {periode.map((p) => (
                    <SelectItem key={p.id_periode} value={String(p.id_periode)}>
                      {p.nama_periode} {p.is_aktif && "(Aktif)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.id_periode && <p className="text-sm text-destructive">{errors.id_periode.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Indikator KPI</Label>
              <Select
                key={selectedDivisiId ?? "none"}
                disabled={!selectedDivisiId}
                onValueChange={(v) => setValue("id_indikator", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedDivisiId ? "Pilih indikator" : "Pilih karyawan dulu"} />
                </SelectTrigger>
                <SelectContent>
                  {indikator
                    .filter((i) => i.id_divisi === selectedDivisiId)
                    .map((i) => (
                      <SelectItem key={i.id_indikator} value={String(i.id_indikator)}>
                        {i.nama_indikator} {i.satuan ? `(${i.satuan})` : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.id_indikator && <p className="text-sm text-destructive">{errors.id_indikator.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Nilai Target</Label>
              <Input
                type="number"
                step="0.01"
                {...register("nilai_target", { valueAsNumber: true })}
              />
              {errors.nilai_target && <p className="text-sm text-destructive">{errors.nilai_target.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
