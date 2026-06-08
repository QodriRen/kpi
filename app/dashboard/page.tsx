import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Users, Building2, Calendar, Target, BarChart3, Clock } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import ActivityLog from "@/components/dashboard/ActivityLog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "karyawan") redirect("/karyawan/dashboard");

  const role = session.user.role;

  if (role === "admin") {
    const [totalPengguna, totalDivisi, totalPeriodeAktif, logs] = await Promise.all([
      prisma.pengguna.count({ where: { is_aktif: true } }),
      prisma.divisi.count(),
      prisma.periodePenilaian.count({ where: { is_aktif: true } }),
      prisma.logAktivitas.findMany({
        take: 10,
        orderBy: { waktu: "desc" },
        include: { pengguna: { select: { nama_lengkap: true } } },
      }),
    ]);

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Dashboard Administrator</h2>
          <p className="text-muted-foreground">Selamat datang, {session.user.name}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Total Pengguna Aktif" value={totalPengguna} icon={Users} color="blue" />
          <StatCard title="Total Divisi" value={totalDivisi} icon={Building2} color="purple" />
          <StatCard title="Periode Aktif" value={totalPeriodeAktif} icon={Calendar} color="green" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Log Aktivitas Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityLog logs={logs} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // HR Dashboard
  const [periodeAktif, totalKaryawan] = await Promise.all([
    prisma.periodePenilaian.findFirst({ where: { is_aktif: true } }),
    prisma.karyawan.count(),
  ]);
  const [targetBelumDiisi, penilaianPending] = await Promise.all([
    periodeAktif
      ? prisma.karyawan.count({
          where: {
            NOT: {
              target_kpi: {
                some: { id_periode: periodeAktif.id_periode },
              },
            },
          },
        })
      : Promise.resolve(0),
    periodeAktif
      ? prisma.targetKpi.count({
          where: {
            id_periode: periodeAktif.id_periode,
            penilaian: { none: {} },
          },
        })
      : Promise.resolve(0),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard HR</h2>
        <p className="text-muted-foreground">Selamat datang, {session.user.name}</p>
      </div>

      {periodeAktif && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-800">
            Periode Aktif: {periodeAktif.nama_periode}
          </p>
          <p className="text-xs text-blue-600">
            {formatDate(periodeAktif.tanggal_mulai)} — {formatDate(periodeAktif.tanggal_selesai)}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Karyawan" value={totalKaryawan} icon={Users} color="blue" />
        <StatCard title="Karyawan Tanpa Target" value={targetBelumDiisi} icon={Target} color="yellow" description="Perlu penetapan target" />
        <StatCard title="Target Belum Dinilai" value={penilaianPending} icon={BarChart3} color="red" description="Perlu penilaian segera" />
      </div>
    </div>
  );
}
