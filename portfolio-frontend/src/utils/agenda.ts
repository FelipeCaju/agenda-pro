import type { Appointment } from "@/services/appointmentService";

export function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatAgendaDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(new Date(`${date}T12:00:00`));
}

export function formatAgendaHeroDate(date: string) {
  const formatted = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T12:00:00`));

  return formatted
    .split(" ")
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(" ");
}

export function formatAgendaSectionDate(date: string) {
  const formatted = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T12:00:00`));

  return formatted
    .split(" ")
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(" ");
}

export function addDays(date: string, amount: number) {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + amount);
  return value.toISOString().slice(0, 10);
}

export function getWeekDates(date: string) {
  const current = new Date(`${date}T12:00:00`);
  const weekDay = current.getDay();
  const mondayOffset = weekDay === 0 ? -6 : 1 - weekDay;

  return Array.from({ length: 7 }, (_, index) => addDays(date, mondayOffset + index));
}

export function getMonthGrid(date: string) {
  const current = new Date(`${date}T12:00:00`);
  const firstDay = new Date(current.getFullYear(), current.getMonth(), 1);
  const lastDay = new Date(current.getFullYear(), current.getMonth() + 1, 0);
  const startWeekday = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const totalCells = Math.ceil((startWeekday + lastDay.getDate()) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const cellDate = new Date(firstDay);
    cellDate.setDate(index - startWeekday + 1);
    return cellDate.toISOString().slice(0, 10);
  });
}

export function getAgendaDateLabel(date: string, view: "day" | "week" | "month") {
  if (view === "month") {
    return new Intl.DateTimeFormat("pt-BR", {
      month: "long",
      year: "numeric",
    }).format(new Date(`${date}T12:00:00`));
  }

  if (view === "week") {
    const days = getWeekDates(date);
    return `${formatAgendaDate(days[0])} - ${formatAgendaDate(days[6])}`;
  }

  return formatAgendaDate(date);
}

export function formatTimeRange(appointment: Appointment) {
  return `${appointment.horarioInicial} - ${appointment.horarioFinal}`;
}

export function getTimeLabel(time: string) {
  return time.slice(0, 5);
}

export function groupAppointmentsByDate(appointments: Appointment[]) {
  return appointments.reduce<Record<string, Appointment[]>>((groups, appointment) => {
    if (!groups[appointment.data]) {
      groups[appointment.data] = [];
    }

    groups[appointment.data].push(appointment);
    return groups;
  }, {});
}
