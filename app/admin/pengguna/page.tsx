"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Pencil, UserX, UserCheck } from "lucide-react";
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
  nama_lengkap: z.string().min(2, "Minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Minimal 6 karakter").optional().or(z.literal("")),
  role: z.enum(["admin", "hr", "karyawan"]),
});

type FormData = z.infer<typeof schema>;

interface Pengguna {
  id_pengguna: number;
  nama_lengkap: string;
  email: string;
  role: string;
  is_aktif: boolean;
  karyawan?: { jabatan: string | null; divisi: { nama_divisi: string } | null } | null;
}

export default function PenggunaPage() {
  const [pengguna, setPengguna] = useState<Pengguna[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Pengguna | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/pengguna");
    const data = await res.json();
    setPengguna(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditing(null);
    reset({ nama_lengkap: "", email: "", password: "", role: "karyawan" });
    setOpen(true);
  };

  const openEdit = (p: Pengguna) => {
    setEditing(p);
    reset({ nama_lengkap: p.nama_lengkap, email: p.email, password: "", role: p.role as "admin" | "hr" | "karyawan" });
    setOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const payload = { ...data };
      if (!payload.password) delete payload.password;

      const res = await fetch(
        editing ? `/api/admin/pengguna/${editing.id_pengguna}` : "/api/admin/pengguna",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Terjadi kesalahan");
      } else {
        toast.success(editing ? "Pengguna diperbarui" : "Pengguna ditambahkan");
        setOpen(false);
        fetchData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAktif = async (p: Pengguna) => {
    const res = await fetch(`/api/admin/pengguna/${p.id_pengguna}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_aktif: !p.is_aktif }),
    });
    if (res.ok) {
      toast.success(p.is_aktif ? "Pengguna dinonaktifkan" : "Pengguna diaktifkan");
      fetchData();
    }
  };

  const columns = [
    { key: "nama_lengkap", header: "Nama" },
    { key: "email", header: "Email" },
    {
      key: "role",
      header: "Role",
      render: (row: Pengguna) => (
        <Badge variant={row.role === "admin" ? "default" : row.role === "hr" ? "info" : "secondary"}>
          {row.role}
        </Badge>
      ),
    },
    {
      key: "karyawan",
      header: "Divisi / Jabatan",
      render: (row: Pengguna) =>
        row.karyawan
          ? `${row.karyawan.divisi?.nama_divisi ?? "-"} — ${row.karyawan.jabatan ?? "-"}`
          : "-",
    },
    {
      key: "is_aktif",
      header: "Status",
      render: (row: Pengguna) => (
        <Badge variant={row.is_aktif ? "success" : "destructive"}>
          {row.is_aktif ? "Aktif" : "Nonaktif"}
        </Badge>
      ),
    },
    {
      key: "aksi",
      header: "Aksi",
      render: (row: Pengguna) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant={row.is_aktif ? "destructive" : "outline"}
            onClick={() => toggleAktif(row)}
          >
            {row.is_aktif ? <UserX className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Manajemen Pengguna</h2>
          <p className="text-muted-foreground">Kelola akun pengguna sistem</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Pengguna
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
        </div>
      ) : (
        <DataTable data={pengguna} columns={columns} searchKey="nama_lengkap" />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Pengguna" : "Tambah Pengguna"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
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
              <Label>{editing ? "Password Baru (kosongkan jika tidak diubah)" : "Password"}</Label>
              <Input type="password" {...register("password")} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select onValueChange={(v) => setValue("role", v as "admin" | "hr" | "karyawan")} defaultValue={editing?.role || "karyawan"}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="karyawan">Karyawan</SelectItem>
                </SelectContent>
              </Select>
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
