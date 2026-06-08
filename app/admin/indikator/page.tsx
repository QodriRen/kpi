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

const schema = z.object({
  id_divisi: z.number({ required_error: "Pilih divisi" }),
  nama_indikator: z.string().min(2, "Minimal 2 karakter"),
  kategori: z.string().optional(),
  satuan: z.string().optional(),
  bobot_persen: z.number().min(0.01).max(100),
  deskripsi: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Divisi { id_divisi: number; nama_divisi: string }
interface Indikator {
  id_indikator: number;
  nama_indikator: string;
  kategori: string | null;
  satuan: string | null;
  bobot_persen: string;
  deskripsi: string | null;
  divisi: { nama_divisi: string };
}

export default function IndikatorPage() {
  const [indikator, setIndikator] = useState<Indikator[]>([]);
  const [divisi, setDivisi] = useState<Divisi[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Indikator | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const fetchData = async () => {
    setLoading(true);
    const [ind, div] = await Promise.all([
      fetch("/api/admin/indikator").then((r) => r.json()),
      fetch("/api/admin/divisi").then((r) => r.json()),
    ]);
    setIndikator(ind);
    setDivisi(div);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditing(null);
    reset({ nama_indikator: "", bobot_persen: 0 });
    setOpen(true);
  };

  const openEdit = (i: Indikator) => {
    setEditing(i);
    reset({
      nama_indikator: i.nama_indikator,
      kategori: i.kategori ?? "",
      satuan: i.satuan ?? "",
      bobot_persen: Number(i.bobot_persen),
      deskripsi: i.deskripsi ?? "",
    });
    setOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const res = await fetch(
        editing ? `/api/admin/indikator/${editing.id_indikator}` : "/api/admin/indikator",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        toast.error(typeof err.error === "string" ? err.error : "Terjadi kesalahan");
      } else {
        toast.success(editing ? "Indikator diperbarui" : "Indikator ditambahkan");
        setOpen(false);
        fetchData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const hapus = async (i: Indikator) => {
    if (!confirm(`Hapus indikator "${i.nama_indikator}"?`)) return;
    const res = await fetch(`/api/admin/indikator/${i.id_indikator}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Indikator dihapus");
      fetchData();
    } else {
      toast.error("Gagal menghapus indikator");
    }
  };

  const columns = [
    { key: "nama_indikator", header: "Nama Indikator" },
    { key: "divisi", header: "Divisi", render: (row: Indikator) => row.divisi.nama_divisi },
    { key: "kategori", header: "Kategori", render: (row: Indikator) => row.kategori ?? "-" },
    { key: "satuan", header: "Satuan", render: (row: Indikator) => row.satuan ?? "-" },
    {
      key: "bobot_persen",
      header: "Bobot",
      render: (row: Indikator) => (
        <Badge variant="info">{Number(row.bobot_persen)}%</Badge>
      ),
    },
    {
      key: "aksi",
      header: "Aksi",
      render: (row: Indikator) => (
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
          <h2 className="text-2xl font-bold">Indikator KPI</h2>
          <p className="text-muted-foreground">Kelola indikator penilaian per divisi</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Indikator
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
        </div>
      ) : (
        <DataTable data={indikator} columns={columns} searchKey="nama_indikator" />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Indikator" : "Tambah Indikator"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Divisi</Label>
              <Select onValueChange={(v) => setValue("id_divisi", Number(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih divisi" />
                </SelectTrigger>
                <SelectContent>
                  {divisi.map((d) => (
                    <SelectItem key={d.id_divisi} value={String(d.id_divisi)}>
                      {d.nama_divisi}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.id_divisi && <p className="text-sm text-destructive">{errors.id_divisi.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Nama Indikator</Label>
              <Input {...register("nama_indikator")} />
              {errors.nama_indikator && <p className="text-sm text-destructive">{errors.nama_indikator.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Input {...register("kategori")} placeholder="cth. Produktivitas" />
              </div>
              <div className="space-y-2">
                <Label>Satuan</Label>
                <Input {...register("satuan")} placeholder="cth. Tiket, %" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Bobot (%)</Label>
              <Input
                type="number"
                step="0.01"
                {...register("bobot_persen", { valueAsNumber: true })}
              />
              {errors.bobot_persen && <p className="text-sm text-destructive">{errors.bobot_persen.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea {...register("deskripsi")} rows={3} />
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
