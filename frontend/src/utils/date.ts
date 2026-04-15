export function formatDateBr(value?: string | null) {
  if (!value) {
    return "-";
  }

  const normalized = value.includes("T") ? value : `${value}T12:00:00`;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(normalized));
}

export function formatDateTimeBr(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatMonthYearBr(value?: string | null) {
  if (!value) {
    return "-";
  }

  const [year, month] = value.split("-");
  if (!year || !month) {
    return value;
  }

  return `${month.padStart(2, "0")}/${year}`;
}

export function formatShortDate(value?: string | null) {
  return formatDateTimeBr(value);
}

export const formatDateBR = formatDateBr;
export const formatMonthYearBR = formatMonthYearBr;

export function formatDateForInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

export function getCurrentMonthRange() {
  const now = new Date();
  return {
    start: formatDateForInput(new Date(now.getFullYear(), now.getMonth(), 1)),
    end: formatDateForInput(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
}
