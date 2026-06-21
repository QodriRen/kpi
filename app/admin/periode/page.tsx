"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import DataTable from "@/components/tables/DataTable";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";

const BULAN_ID = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

function namaDariBulan(yearMonth: string): string {
  const [year, month] = yearMonth.split("-").map(Number);
  return `${BULAN_ID[month - 1]} ${year}`;
}

const schema = z.object({
  bulan: z.string().regex(/^\d{4}-\d{2}$/, "Pilih bulan yang valid"),
  is_aktif: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

interface Periode {
  id_periode: number;
  nama_periode: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  tipe_periode: string;
  is_aktif: boolean;
  _count: { target_kpi: number };
}

function periodeKeBulan(p: Periode): string {
  // Ambil YYYY-MM dari tanggal_mulai
  return p.tanggal_mulai.split("T")[0].slice(0, 7);
}

export default function PeriodePage() {
  const [periode, setPeriode] = useState<Periode[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Periode | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { is_aktif: true },
  });

  const bulanWatch = watch("bulan");

  const fetchData = async () => {
    setLoading(true);
    const data = await fetch("/api/admin/periode").then((r) => r.json());
    setPeriode(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditing(null);
    reset({ bulan: "", is_aktif: true });
    setOpen(true);
  };

  const openEdit = (p: Periode) => {
    setEditing(p);
    reset({ bulan: periodeKeBulan(p), is_aktif: p.is_aktif });
    setOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const res = await fetch(
        editing ? `/api/admin/periode/${editing.id_periode}` : "/api/admin/periode",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Terjadi kesalahan");
      } else {
        toast.success(editing ? "Periode diperbarui" : "Periode ditambahkan");
        setOpen(false);
        fetchData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const hapus = async (p: Periode) => {
    if (!confirm(`Hapus periode "${p.nama_periode}"?`)) return;
    const res = await fetch(`/api/admin/periode/${p.id_periode}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Periode dihapus");
      fetchData();
    } else {
      toast.error("Gagal menghapus periode (mungkin sudah ada data target)");
    }
  };

  const toggleAktif = async (p: Periode) => {
    const res = await fetch(`/api/admin/periode/${p.id_periode}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_aktif: !p.is_aktif }),
    });
    if (res.ok) {
      toast.success(`Periode ${!p.is_aktif ? "diaktifkan" : "dinonaktifkan"}`);
      fetchData();
    }
  };

  const columns = [
    { key: "nama_periode", header: "Nama Periode" },
    {
      key: "tanggal_mulai",
      header: "Mulai",
      render: (row: Periode) => formatDate(row.tanggal_mulai),
    },
    {
      key: "tanggal_selesai",
      header: "Selesai",
      render: (row: Periode) => formatDate(row.tanggal_selesai),
    },
    {
      key: "_count",
      header: "Target",
      render: (row: Periode) => row._count.target_kpi,
    },
    {
      key: "is_aktif",
      header: "Status",
      render: (row: Periode) => (
        <div className="flex items-center gap-2">
          <Switch checked={row.is_aktif} onCheckedChange={() => toggleAktif(row)} />
          <Badge variant={row.is_aktif ? "success" : "secondary"}>
            {row.is_aktif ? "Aktif" : "Nonaktif"}
          </Badge>
        </div>
      ),
    },
    {
      key: "aksi",
      header: "Aksi",
      render: (row: Periode) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="destructive" onClick={() => hapus(row)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Periode Penilaian</h2>
          <p className="text-muted-foreground">Periode penilaian bulanan — satu entri per bulan</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Periode
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
        </div>
      ) : (
        <DataTable data={periode} columns={columns} searchKey="nama_periode" />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Periode" : "Tambah Periode Bulanan"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Bulan & Tahun</Label>
              <Input type="month" {...register("bulan")} />
              {errors.bulan && <p className="text-sm text-destructive">{errors.bulan.message}</p>}
              {bulanWatch && !errors.bulan && (
                <p className="text-sm text-muted-foreground">
                  Nama periode: <strong>{namaDariBulan(bulanWatch)}</strong>
                </p>
              )}
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
