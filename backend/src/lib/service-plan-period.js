// Periodos sao tratados como datas civis, sem depender do fuso do servidor.
function parseDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? ""));
  if (!match) throw new Error("Data inicial invalida.");
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new Error("Data inicial invalida.");
  }
  return date;
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

// O fim e exclusivo: evita contar o mesmo dia em dois periodos consecutivos.
export function buildServicePlanPeriod(startDate, durationMonths, weekdayAnchor = startDate) {
  const start = parseDate(startDate);
  const anchor = parseDate(weekdayAnchor);
  if (![1, 2, 6, 12].includes(durationMonths)) throw new Error("Duracao do plano invalida.");
  const targetFirst = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + durationMonths, 1));
  const lastDay = new Date(Date.UTC(targetFirst.getUTCFullYear(), targetFirst.getUTCMonth() + 1, 0)).getUTCDate();
  const end = new Date(Date.UTC(targetFirst.getUTCFullYear(), targetFirst.getUTCMonth(), Math.min(anchor.getUTCDate(), lastDay)));
  const appointments = [];
  const offset = (anchor.getUTCDay() - start.getUTCDay() + 7) % 7;
  const firstAppointment = new Date(start);
  firstAppointment.setUTCDate(firstAppointment.getUTCDate() + offset);
  for (let current = firstAppointment; current < end; current.setUTCDate(current.getUTCDate() + 7)) {
    appointments.push(formatDate(current));
  }
  return { startDate: formatDate(start), endDateExclusive: formatDate(end), appointments };
}
