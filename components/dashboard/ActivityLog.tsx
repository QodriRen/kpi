import { formatDate } from "@/lib/utils";
import { Activity } from "lucide-react";

interface LogItem {
  id_log: number;
  aksi: string | null;
  waktu: Date;
  pengguna: { nama_lengkap: string };
}

interface ActivityLogProps {
  logs: LogItem[];
}

export default function ActivityLog({ logs }: ActivityLogProps) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Activity className="mx-auto h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">Belum ada aktivitas</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <div key={log.id_log} className="flex items-start gap-3">
          <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <span className="font-medium">{log.pengguna.nama_lengkap}</span>
              <span className="text-muted-foreground"> — {log.aksi}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(log.waktu)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
