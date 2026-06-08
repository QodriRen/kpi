"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";

const schema = z.object({
  id_penilaian: z.number({ required_error: "Pilih penilaian" }),
  isi_feedback: z.string().min(5, "Minimal 5 karakter"),
});

type FormData = z.infer<typeof schema>;

interface Feedback {
  id_feedback: number;
  isi_feedback: string | null;
  dibuat_pada: string;
  tipe_feedback: string | null;
  pemberi: { nama_lengkap: string };
  penilaian: {
    target: {
      karyawan: { pengguna: { nama_lengkap: string } };
      indikator: { nama_indikator: string };
    };
  };
}

interface Penilaian {
  id_penilaian: number;
  skor_akhir: string;
  target: {
    karyawan: { pengguna: { nama_lengkap: string } };
    indikator: { nama_indikator: string };
    periode: { nama_periode: string };
  };
}

export default function HrFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [penilaian, setPenilaian] = useState<Penilaian[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const fetchData = async () => {
    setLoading(true);
    const [f, p] = await Promise.all([
      fetch("/api/hr/feedback").then((r) => r.json()),
      fetch("/api/hr/penilaian").then((r) => r.json()),
    ]);
    setFeedbacks(f);
    setPenilaian(p);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/hr/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, tipe_feedback: "hr_ke_karyawan" }),
      });

      if (!res.ok) {
        toast.error("Gagal mengirim feedback");
      } else {
        toast.success("Feedback berhasil dikirim");
        setOpen(false);
        reset();
        fetchData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Feedback Penilaian</h2>
          <p className="text-muted-foreground">Kirim dan lihat feedback kepada karyawan</p>
        </div>
        <Button onClick={() => { reset(); setOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Kirim Feedback
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MessageSquare className="mx-auto h-10 w-10 mb-3 opacity-40" />
          <p>Belum ada feedback</p>
        </div>
      ) : (
        <div className="space-y-3">
          {feedbacks.map((f) => (
            <Card key={f.id_feedback}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{f.penilaian.target.karyawan.pengguna.nama_lengkap}</span>
                    <Badge variant="secondary" className="text-xs">{f.penilaian.target.indikator.nama_indikator}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={f.tipe_feedback === "hr_ke_karyawan" ? "info" : "secondary"} className="text-xs">
                      {f.tipe_feedback === "hr_ke_karyawan" ? "HR → Karyawan" : "Karyawan → HR"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(f.dibuat_pada)}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{f.isi_feedback}</p>
                <p className="text-xs text-muted-foreground mt-1">Dari: {f.pemberi.nama_lengkap}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kirim Feedback</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Pilih Penilaian</Label>
              <Select onValueChange={(v) => setValue("id_penilaian", Number(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih hasil penilaian" />
                </SelectTrigger>
                <SelectContent>
                  {penilaian.map((p) => (
                    <SelectItem key={p.id_penilaian} value={String(p.id_penilaian)}>
                      {p.target.karyawan.pengguna.nama_lengkap} — {p.target.indikator.nama_indikator} (Skor: {Number(p.skor_akhir).toFixed(1)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.id_penilaian && <p className="text-sm text-destructive">{errors.id_penilaian.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Isi Feedback</Label>
              <Textarea {...register("isi_feedback")} rows={4} placeholder="Tulis feedback untuk karyawan..." />
              {errors.isi_feedback && <p className="text-sm text-destructive">{errors.isi_feedback.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Mengirim..." : "Kirim Feedback"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
