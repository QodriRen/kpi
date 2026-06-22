import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const skorIndikator = (
  nilaiAktual: number,
  nilaiTarget: number,
  bobotPersen: number
) => (nilaiAktual / nilaiTarget) * bobotPersen;

export const totalSkor = (
  items: { nilai_aktual: number; nilai_target: number; bobot_persen: number }[]
) =>
  items.reduce(
    (sum, i) =>
      sum + skorIndikator(i.nilai_aktual, i.nilai_target, i.bobot_persen),
    0
  );

export const getGrade = (skor: number) => {
  if (skor >= 96) return { grade: "A", label: "Baik", color: "green",  variant: "success"     as const };
  if (skor >= 88) return { grade: "B", label: "Cukup", color: "yellow", variant: "warning"     as const };
  return           { grade: "C", label: "Kurang", color: "red",    variant: "destructive" as const };
};

export const getColorBySkor = (persen: number) => {
  if (persen >= 96) return "bg-green-500";
  if (persen >= 88) return "bg-yellow-500";
  return "bg-red-500";
};

export const isPeriodeSixMonths = (start: Date | string, end: Date | string): boolean => {
  const s = new Date(start);
  const e = new Date(end);
  // Hitung bulan secara inklusif: Jan s/d Jun = 6 bulan
  const months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + 1;
  return months >= 6;
};

export const getRekomendasiKontrak = (grade: string): { rekomendasi: string; variant: "success" | "warning" | "destructive" } => {
  if (grade === "A") return { rekomendasi: "Lanjut Kontrak", variant: "success" };   // Baik ≥ 96%
  if (grade === "B") return { rekomendasi: "Pindah Divisi", variant: "warning" };    // Cukup 88–95%
  return { rekomendasi: "Tidak Lanjut Kontrak", variant: "destructive" };             // Kurang < 88%
};

export const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export const formatNumber = (num: number, decimals = 2) =>
  Number(num).toFixed(decimals);
