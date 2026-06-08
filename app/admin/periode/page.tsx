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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DataTable from "@/components/tables/DataTable";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";

const schema = z.object({
  nama_periode: z.string().min(2),
  tanggal_mulai: z.string().min(1, "Wajib diisi"),
  tanggal_selesai: z.string().min(1, "Wajib diisi"),
  tipe_periode: z.string().min(1, "Pilih tipe"),
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

export default function PeriodePage() {
  const [periode, setPeriode] = useState<Periode[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Periode | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { is_aktif: true },
  });

  const fetchData = async () => {
    setLoading(true);
    const data = await fetch("/api/admin/periode").then((r) => r.json());
    setPeriode(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditing(null);
    reset({ nama_periode: "", tanggal_mulai: "", tanggal_selesai: "", tipe_periode: "", is_aktif: true });
    setOpen(true);
  };

  const openEdit = (p: Periode) => {
    setEditing(p);
    reset({
      nama_periode: p.nama_periode,
      tanggal_mulai: p.tanggal_mulai.split("T")[0],
      tanggal_selesai: p.tanggal_selesai.split("T")[0],
      tipe_periode: p.tipe_periode,
      is_aktif: p.is_aktif,
    });
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
    { key: "tipe_periode", header: "Tipe" },
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
          <p className="text-muted-foreground">Kelola periode penilaian KPI</p>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Periode" : "Tambah Periode"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Periode</Label>
              <Input {...register("nama_periode")} placeholder="cth. Penilaian Juni 2025" />
              {errors.nama_periode && <p className="text-sm text-destructive">{errors.nama_periode.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Tipe Periode</Label>
              <Select onValueChange={(v) => setValue("tipe_periode", v)} defaultValue={editing?.tipe_periode}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bulanan">Bulanan</SelectItem>
                  <SelectItem value="Triwulan">Triwulan</SelectItem>
                  <SelectItem value="Semesteran">Semesteran</SelectItem>
                  <SelectItem value="Tahunan">Tahunan</SelectItem>
                </SelectContent>
              </Select>
              {errors.tipe_periode && <p className="text-sm text-destructive">{errors.tipe_periode.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Mulai</Label>
                <Input type="date" {...register("tanggal_mulai")} />
                {errors.tanggal_mulai && <p className="text-sm text-destructive">{errors.tanggal_mulai.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Tanggal Selesai</Label>
                <Input type="date" {...register("tanggal_selesai")} />
                {errors.tanggal_selesai && <p className="text-sm text-destructive">{errors.tanggal_selesai.message}</p>}
              </div>
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
