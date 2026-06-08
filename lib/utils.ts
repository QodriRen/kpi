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
  if (skor >= 90) return { grade: "A", label: "Sangat Baik", color: "green" };
  if (skor >= 75) return { grade: "B", label: "Baik", color: "blue" };
  if (skor >= 60) return { grade: "C", label: "Cukup", color: "yellow" };
  return { grade: "D", label: "Perlu Perbaikan", color: "red" };
};

export const getColorBySkor = (persen: number) => {
  if (persen >= 85) return "bg-green-500";
  if (persen >= 70) return "bg-yellow-500";
  return "bg-red-500";
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
