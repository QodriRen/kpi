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
  nama_lengkap: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  id_divisi: z.number({ required_error: "Pilih divisi" }),
  nip: z.string().optional(),
  jabatan: z.string().optional(),
  status_kerja: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Karyawan {
  id_karyawan: number;
  nip: string | null;
  jabatan: string | null;
  status_kerja: string | null;
  pengguna: { nama_lengkap: string; email: string; is_aktif: boolean };
  divisi: { nama_divisi: string };
}

interface Divisi { id_divisi: number; nama_divisi: string }

export default function HrKaryawanPage() {
  const [karyawan, setKaryawan] = useState<Karyawan[]>([]);
  const [divisi, setDivisi] = useState<Divisi[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const fetchData = async () => {
    setLoading(true);
    const [k, d] = await Promise.all([
      fetch("/api/hr/karyawan").then((r) => r.json()),
      fetch("/api/admin/divisi").then((r) => r.json()),
    ]);
    setKaryawan(k);
    setDivisi(d);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/hr/karyawan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Terjadi kesalahan");
      } else {
        toast.success("Karyawan berhasil ditambahkan");
        setOpen(false);
        reset();
        fetchData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: "pengguna", header: "Nama", render: (row: Karyawan) => row.pengguna.nama_lengkap },
    { key: "email", header: "Email", render: (row: Karyawan) => row.pengguna.email },
    { key: "nip", header: "NIP", render: (row: Karyawan) => row.nip ?? "-" },
    { key: "jabatan", header: "Jabatan", render: (row: Karyawan) => row.jabatan ?? "-" },
    { key: "divisi", header: "Divisi", render: (row: Karyawan) => row.divisi.nama_divisi },
    {
      key: "status_kerja",
      header: "Status",
      render: (row: Karyawan) => (
        <Badge variant={row.status_kerja === "Tetap" ? "success" : "secondary"}>
          {row.status_kerja ?? "-"}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Data Karyawan</h2>
          <p className="text-muted-foreground">Kelola data karyawan perusahaan</p>
        </div>
        <Button onClick={() => { reset(); setOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Karyawan
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
        </div>
      ) : (
        <DataTable data={karyawan} columns={columns} searchKey="nip" />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tambah Karyawan Baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Nama Lengkap</Label>
                <Input {...register("nama_lengkap")} />
                {errors.nama_lengkap && <p className="text-sm text-destructive">{errors.nama_lengkap.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" {...register("email")} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" {...register("password")} />
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>NIP</Label>
                <Input {...register("nip")} placeholder="opsional" />
              </div>
              <div className="space-y-2">
                <Label>Jabatan</Label>
                <Input {...register("jabatan")} placeholder="opsional" />
              </div>
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
                <Label>Status Kerja</Label>
                <Select onValueChange={(v) => setValue("status_kerja", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tetap">Tetap</SelectItem>
                    <SelectItem value="Kontrak">Kontrak</SelectItem>
                    <SelectItem value="Magang">Magang</SelectItem>
                  </SelectContent>
                </Select>
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
