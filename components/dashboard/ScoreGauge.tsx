import { cn, getGrade } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ScoreGaugeProps {
  skor: number;
}

export default function ScoreGauge({ skor }: ScoreGaugeProps) {
  const { grade, label, color } = getGrade(skor);
  const displaySkor = Math.min(Math.max(skor, 0), 100);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (displaySkor / 100) * circumference;

  const strokeColor =
    color === "green"
      ? "#22c55e"
      : color === "blue"
      ? "#3b82f6"
      : color === "yellow"
      ? "#eab308"
      : "#ef4444";

  const badgeVariant =
    color === "green"
      ? "success"
      : color === "blue"
      ? "info"
      : color === "yellow"
      ? "warning"
      : "destructive";

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-40 h-40">
        <svg className="w-40 h-40 -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="12"
          />
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke={strokeColor}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold">{displaySkor.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">dari 100</span>
        </div>
      </div>
      <div className="text-center space-y-1">
        <Badge variant={badgeVariant as "success" | "info" | "warning" | "destructive"} className="text-lg px-4 py-1">
          Grade {grade}
        </Badge>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
