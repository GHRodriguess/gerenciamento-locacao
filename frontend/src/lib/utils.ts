import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "R$ 0,00";
  return num.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatTitleCase(value?: string | null): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function maskPhone(value: string): string {
  if (!value) return "";
  let v = value.replace(/\D/g, "");
  v = v.replace(/(\d{2})(\d)/, "($1) $2");
  v = v.replace(/(\d{5})(\d)/, "$1-$2");
  return v.substring(0, 15);
}

export function formatDateTimeBR(dateString?: string | null): string {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isSameDay(
  d1?: string | Date | null,
  d2?: string | Date | null
): boolean {
  if (!d1 || !d2) return false;
  const date1 = typeof d1 === "string" ? new Date(d1) : d1;
  const date2 = typeof d2 === "string" ? new Date(d2) : d2;
  if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return false;
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function formatTimeBR(dateInput?: string | Date | null): string {
  if (!dateInput) return "";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateShortBR(
  dateInput?: string | Date | null,
  includeYear = false
): string {
  if (!dateInput) return "";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  if (includeYear) {
    return `${day}/${month}/${date.getFullYear()}`;
  }
  return `${day}/${month}`;
}

export function formatDateBadgeBR(
  dMontagemInput?: string | Date | null,
  dDevolucaoInput?: string | Date | null
): string {
  if (!dMontagemInput) return "";
  const d1 = typeof dMontagemInput === "string" ? new Date(dMontagemInput) : dMontagemInput;
  if (isNaN(d1.getTime())) return "";

  if (!dDevolucaoInput || isSameDay(dMontagemInput, dDevolucaoInput)) {
    return d1.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  }

  const d2 = typeof dDevolucaoInput === "string" ? new Date(dDevolucaoInput) : dDevolucaoInput;
  if (isNaN(d2.getTime())) {
    return d1.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  }

  if (d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear()) {
    const d1Day = String(d1.getDate()).padStart(2, "0");
    const d2Day = String(d2.getDate()).padStart(2, "0");
    const month = d1.toLocaleDateString("pt-BR", { month: "short" });
    return `${d1Day} a ${d2Day} de ${month}`;
  }

  const d1Formatted = d1.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  const d2Formatted = d2.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  return `${d1Formatted} a ${d2Formatted}`;
}

export function formatScheduleBR(
  dMontagemInput?: string | Date | null,
  dDevolucaoInput?: string | Date | null
): string {
  if (!dMontagemInput) return "";
  const d1 = typeof dMontagemInput === "string" ? new Date(dMontagemInput) : dMontagemInput;
  if (isNaN(d1.getTime())) return "";

  const time1 = formatTimeBR(d1);

  if (!dDevolucaoInput) return time1;

  const d2 = typeof dDevolucaoInput === "string" ? new Date(dDevolucaoInput) : dDevolucaoInput;
  if (isNaN(d2.getTime())) return time1;

  const time2 = formatTimeBR(d2);

  if (isSameDay(d1, d2)) {
    return `${time1} às ${time2}`;
  }

  const diffYear = d1.getFullYear() !== d2.getFullYear();
  const date1Str = formatDateShortBR(d1, diffYear);
  const date2Str = formatDateShortBR(d2, diffYear);

  return `${date1Str} às ${time1} até ${date2Str} às ${time2}`;
}

export function formatEventTimeBR(
  dateInput?: string | Date | null,
  isDifferentDay = false,
  diffYear = false
): string {
  if (!dateInput) return "";
  const time = formatTimeBR(dateInput);
  if (!isDifferentDay) return time;
  const dateStr = formatDateShortBR(dateInput, diffYear);
  return `${dateStr} às ${time}`;
}
