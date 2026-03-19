import {
  listAllAppointmentsByOrganization,
  listClientsByOrganization,
  listServicesByOrganization,
} from "../lib/data.js";
import { listOrganizationReminders } from "./reminder.service.js";

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(date, amount) {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + amount);
  return value.toISOString().slice(0, 10);
}

function getRangeEnd(today, period) {
  if (period === "7d") {
    return addDays(today, 6);
  }

  if (period === "30d") {
    return addDays(today, 29);
  }

  return today;
}

function createTimelineRange(start, end) {
  const items = [];
  let cursor = start;

  while (cursor <= end) {
    items.push(cursor);
    cursor = addDays(cursor, 1);
  }

  return items;
}

async function filterAppointmentsForDashboard({ organizationId, period, status }) {
  const normalizedPeriod = ["today", "7d", "30d"].includes(period) ? period : "today";
  const normalizedStatus = ["all", "pendente", "confirmado", "concluido", "cancelado"].includes(status)
    ? status
    : "all";
  const start = getTodayDate();
  const end = getRangeEnd(start, normalizedPeriod);
  const appointments = await listAllAppointmentsByOrganization(organizationId);

  const filtered = appointments
    .filter((appointment) => appointment.data >= start && appointment.data <= end)
    .filter((appointment) => normalizedStatus === "all" || appointment.status === normalizedStatus)
    .sort((left, right) =>
      `${left.data} ${left.horario_inicial}`.localeCompare(`${right.data} ${right.horario_inicial}`),
    );

  return { filtered, start, end, normalizedPeriod, normalizedStatus };
}

function sumRevenue(items) {
  return items.reduce((total, item) => {
    if (item.status === "cancelado") {
      return total;
    }

    return total + Number(item.valor ?? 0);
  }, 0);
}

export async function getDashboardSummary({
  organizationId,
  period = "today",
  status = "all",
}) {
  const { filtered, start, end, normalizedPeriod, normalizedStatus } = await filterAppointmentsForDashboard({
    organizationId,
    period,
    status,
  });

  const activeClients = (await listClientsByOrganization(organizationId)).filter((client) => client.ativo);
  const activeServices = (await listServicesByOrganization(organizationId)).filter((service) => service.ativo);
  const reminders = await listOrganizationReminders({ organizationId });
  const revenue = sumRevenue(filtered);
  const nonCanceledAppointments = filtered.filter((item) => item.status !== "cancelado");
  const upcomingAppointments = filtered.slice(0, 5);
  const timeline = createTimelineRange(start, end).map((date) => {
    const dayAppointments = filtered.filter((appointment) => appointment.data === date);

    return {
      date,
      total: dayAppointments.length,
      confirmed: dayAppointments.filter((appointment) => appointment.status === "confirmado").length,
      revenue: sumRevenue(dayAppointments),
    };
  });

  const statusBreakdown = [
    { status: "pendente", total: filtered.filter((item) => item.status === "pendente").length },
    { status: "confirmado", total: filtered.filter((item) => item.status === "confirmado").length },
    { status: "concluido", total: filtered.filter((item) => item.status === "concluido").length },
    { status: "cancelado", total: filtered.filter((item) => item.status === "cancelado").length },
  ];

  const servicesByVolume = Object.values(
    filtered.reduce((accumulator, appointment) => {
      const current = accumulator[appointment.servico_id] ?? {
        serviceId: appointment.servico_id,
        nome: appointment.servico_nome,
        cor: appointment.servico_cor,
        total: 0,
      };

      current.total += 1;
      accumulator[appointment.servico_id] = current;
      return accumulator;
    }, {}),
  ).sort((left, right) => right.total - left.total);

  return {
    period: normalizedPeriod,
    status: normalizedStatus,
    range: {
      start,
      end,
    },
    kpis: {
      totalAppointments: filtered.length,
      confirmedAppointments: statusBreakdown.find((item) => item.status === "confirmado")?.total ?? 0,
      pendingAppointments: statusBreakdown.find((item) => item.status === "pendente")?.total ?? 0,
      canceledAppointments: statusBreakdown.find((item) => item.status === "cancelado")?.total ?? 0,
      scheduledRevenue: revenue,
      averageTicket: nonCanceledAppointments.length
        ? Number((revenue / nonCanceledAppointments.length).toFixed(2))
        : 0,
      activeClients: activeClients.length,
      activeServices: activeServices.length,
      reminderQueue: reminders.length,
    },
    charts: {
      timeline,
      statusBreakdown,
      servicesByVolume: servicesByVolume.slice(0, 4),
    },
    lists: {
      upcomingAppointments,
      reminders: reminders.slice(0, 5),
    },
  };
}
