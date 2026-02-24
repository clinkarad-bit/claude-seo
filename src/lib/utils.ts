import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("de-DE").format(n);
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "…";
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function parseJSON<T>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

export const STATUS_LABELS: Record<string, string> = {
  in_progress: "In Arbeit",
  done: "Fertig",
  new: "Neu",
  revised: "Überarbeitet",
  draft: "Entwurf",
  approved: "Freigegeben",
  published: "Veröffentlicht",
  refresh: "Refresh nötig",
};

export const STATUS_COLORS: Record<string, string> = {
  in_progress: "bg-yellow-100 text-yellow-800 border-yellow-200",
  done: "bg-green-100 text-green-800 border-green-200",
  new: "bg-blue-100 text-blue-800 border-blue-200",
  revised: "bg-purple-100 text-purple-800 border-purple-200",
  draft: "bg-gray-100 text-gray-700 border-gray-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  published: "bg-brand/10 text-brand border-brand/20",
  refresh: "bg-orange-100 text-orange-800 border-orange-200",
};

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function getStatusColor(status: string): string {
  return STATUS_COLORS[status] ?? "bg-gray-100 text-gray-700 border-gray-200";
}

export const CATEGORY_LABELS: Record<string, string> = {
  conversion: "Conversionnahe Themen",
  produktnah: "Produktnahe Themen",
  enger: "Enger Themenbezug",
  ferner: "Ferner Themenbezug",
};

export const CATEGORY_COLORS: Record<string, string> = {
  conversion: "bg-red-50 text-red-700 border-red-200",
  produktnah: "bg-blue-50 text-blue-700 border-blue-200",
  enger: "bg-purple-50 text-purple-700 border-purple-200",
  ferner: "bg-gray-50 text-gray-700 border-gray-200",
};
