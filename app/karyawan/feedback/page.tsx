"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { MessageSquare, Send } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";

const schema = z.object({
  id_penilaian: z.number(),
  isi_feedback: z.string().min(5, "Minimal 5 karakter"),
});

type FormData = z.infer<typeof schema>;

interface FeedbackItem {
  id_feedback: number;
  isi_feedback: string | null;
  dibuat_pada: string;
  tipe_feedback: string | null;
  pemberi: { nama_lengkap: string; role: string };
  penilaian: {
    id_penilaian: number;
    target: { indikator: { nama_indikator: string } };
  };
}

export default function KaryawanFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState<FeedbackItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const fetchData = async () => {
    setLoading(true);
    const data = await fetch("/api/karyawan/feedback").then((r) => r.json());
    setFeedbacks(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openReply = (fb: FeedbackItem) => {
    setReplyTarget(fb);
    reset({ id_penilaian: fb.penilaian.id_penilaian, isi_feedback: "" });
    setValue("id_penilaian", fb.penilaian.id_penilaian);
    setOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/hr/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, tipe_feedback: "karyawan_ke_hr" }),
      });

      if (!res.ok) {
        toast.error("Gagal mengirim balasan");
      } else {
        toast.success("Balasan berhasil dikirim");
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
      <div>
        <h2 className="text-2xl font-bold">Feedback KPI Saya</h2>
        <p className="text-muted-foreground">Lihat dan balas feedback dari HR</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MessageSquare className="mx-auto h-10 w-10 mb-3 opacity-40" />
          <p>Belum ada feedback</p>
        </div>
      ) : (
        <div className="space-y-3">
          {feedbacks.map((fb) => (
            <Card key={fb.id_feedback}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={fb.tipe_feedback === "hr_ke_karyawan" ? "info" : "secondary"}>
                      {fb.tipe_feedback === "hr_ke_karyawan" ? "Dari HR" : "Balasan Saya"}
                    </Badge>
                    <span className="text-sm font-medium">{fb.penilaian.target.indikator.nama_indikator}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(fb.dibuat_pada)}</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-3">{fb.isi_feedback}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Dari: {fb.pemberi.nama_lengkap}</p>
                  {fb.tipe_feedback === "hr_ke_karyawan" && (
                    <Button size="sm" variant="outline" onClick={() => openReply(fb)}>
                      <Send className="h-3 w-3 mr-1" />
                      Balas
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Balas Feedback</DialogTitle>
          </DialogHeader>
          {replyTarget && (
            <div className="bg-muted rounded-lg p-3 text-sm">
              <p className="text-muted-foreground italic">"{replyTarget.isi_feedback}"</p>
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Balasan Anda</Label>
              <Textarea {...register("isi_feedback")} rows={4} placeholder="Tulis balasan..." />
              {errors.isi_feedback && <p className="text-sm text-destructive">{errors.isi_feedback.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Mengirim..." : "Kirim Balasan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
