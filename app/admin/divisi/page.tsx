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
  nama_divisi: z.string().min(2, "Minimal 2 karakter"),
  id_kepala: z.number().nullable().optional(),
  deskripsi: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Pengguna { id_pengguna: number; nama_lengkap: string }
interface Divisi {
  id_divisi: number;
  nama_divisi: string;
  deskripsi: string | null;
  kepala: { nama_lengkap: string } | null;
  _count: { karyawan: number; indikator: number };
}

export default function DivisiPage() {
  const [divisi, setDivisi] = useState<Divisi[]>([]);
  const [pengguna, setPengguna] = useState<Pengguna[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Divisi | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const fetchData = async () => {
    setLoading(true);
    const [d, p] = await Promise.all([
      fetch("/api/admin/divisi").then((r) => r.json()),
      fetch("/api/admin/pengguna").then((r) => r.json()),
    ]);
    setDivisi(d);
    setPengguna(p);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditing(null);
    reset({ nama_divisi: "", id_kepala: null, deskripsi: "" });
    setOpen(true);
  };

  const openEdit = (d: Divisi) => {
    setEditing(d);
    reset({ nama_divisi: d.nama_divisi, deskripsi: d.deskripsi ?? "" });
    setOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const res = await fetch(
        editing ? `/api/admin/divisi/${editing.id_divisi}` : "/api/admin/divisi",
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
        toast.success(editing ? "Divisi diperbarui" : "Divisi ditambahkan");
        setOpen(false);
        fetchData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const hapus = async (d: Divisi) => {
    if (!confirm(`Hapus divisi "${d.nama_divisi}"?`)) return;
    const res = await fetch(`/api/admin/divisi/${d.id_divisi}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Divisi dihapus");
      fetchData();
    } else {
      toast.error("Gagal menghapus divisi");
    }
  };

  const columns = [
    { key: "nama_divisi", header: "Nama Divisi" },
    { key: "kepala", header: "Kepala", render: (row: Divisi) => row.kepala?.nama_lengkap ?? "-" },
    { key: "karyawan", header: "Karyawan", render: (row: Divisi) => row._count.karyawan },
    { key: "indikator", header: "Indikator KPI", render: (row: Divisi) => row._count.indikator },
    {
      key: "aksi",
      header: "Aksi",
      render: (row: Divisi) => (
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
          <h2 className="text-2xl font-bold">Manajemen Divisi</h2>
          <p className="text-muted-foreground">Kelola struktur divisi perusahaan</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Divisi
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
        </div>
      ) : (
        <DataTable data={divisi} columns={columns} searchKey="nama_divisi" />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Divisi" : "Tambah Divisi"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Divisi</Label>
              <Input {...register("nama_divisi")} />
              {errors.nama_divisi && <p className="text-sm text-destructive">{errors.nama_divisi.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Kepala Divisi</Label>
              <Select onValueChange={(v) => setValue("id_kepala", v === "none" ? null : Number(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kepala divisi (opsional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Tidak ada —</SelectItem>
                  {pengguna.map((p) => (
                    <SelectItem key={p.id_pengguna} value={String(p.id_pengguna)}>
                      {p.nama_lengkap}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
