function parseDateValue(value?: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  if (/^\d{4}-\d{2}$/.test(normalized)) {
    const [year, month] = normalized.split("-").map(Number);
    return new Date(year, month - 1, 1, 12, 0, 0);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const [year, month, day] = normalized.split("-").map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDateBR(value?: string | null) {
  const parsed = parseDateValue(value);

  if (!parsed) {
    return "Nao informado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

export function formatMonthYearBR(value?: string | null) {
  const parsed = parseDateValue(value);

  if (!parsed) {
    return "Nao informado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

export function formatShortDate(value: string) {
  const parsed = parseDateValue(value);

  if (!parsed) {
    return "--";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}
