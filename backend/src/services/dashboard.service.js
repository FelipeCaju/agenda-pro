import {
  listDashboardAppointmentsByOrganization,
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

function isValidDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function normalizeRange(start, end) {
  if (start <= end) {
    return { start, end };
  }

  return { start: end, end: start };
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

async function filterAppointmentsForDashboard({
  organizationId,
  period,
  status,
  startDate,
  endDate,
  clientId,
  serviceId,
}) {
  const normalizedPeriod = ["today", "7d", "30d"].includes(period) ? period : "today";
  const normalizedStatus = ["all", "pendente", "confirmado", "concluido", "cancelado"].includes(status)
    ? status
    : "all";
  const fallbackStart = getTodayDate();
  const fallbackEnd = getRangeEnd(fallbackStart, normalizedPeriod);
  const normalizedRange = normalizeRange(
    isValidDate(startDate) ? startDate : fallbackStart,
    isValidDate(endDate) ? endDate : fallbackEnd,
  );
  const start = normalizedRange.start;
  const end = normalizedRange.end;
  const filtered = await listDashboardAppointmentsByOrganization(organizationId, {
    startDate: start,
    endDate: end,
    status: normalizedStatus,
    clientId,
    serviceId,
  });

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

function sumRevenueByPaymentStatus(items, paymentStatus) {
  return items.reduce((total, item) => {
    if (item.status === "cancelado") {
      return total;
    }

    if ((item.payment_status ?? "pendente") !== paymentStatus) {
      return total;
    }

    return total + Number(item.valor ?? 0);
  }, 0);
}

export async function getDashboardSummary({
  organizationId,
  period = "today",
  status = "all",
  startDate = null,
  endDate = null,
  clientId = null,
  serviceId = null,
}) {
  const { filtered, start, end, normalizedPeriod, normalizedStatus } =
    await filterAppointmentsForDashboard({
      organizationId,
      period,
      status,
      startDate,
      endDate,
      clientId,
      serviceId,
    });

  const [allClients, allServices, reminders] = await Promise.all([
    listClientsByOrganization(organizationId),
    listServicesByOrganization(organizationId),
    listOrganizationReminders({ organizationId }),
  ]);
  const activeClients = allClients.filter((client) => client.ativo);
  const activeServices = allServices.filter((service) => service.ativo);
  const revenue = sumRevenue(filtered);
  const nonCanceledAppointments = filtered.filter((item) => item.status !== "cancelado");
  const paidRevenue = sumRevenueByPaymentStatus(filtered, "pago");
  const pendingRevenue = sumRevenueByPaymentStatus(filtered, "pendente");
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

  const servicesFinancial = Object.values(
    filtered.reduce((accumulator, appointment) => {
      const current = accumulator[appointment.servico_id] ?? {
        serviceId: appointment.servico_id,
        nome: appointment.servico_nome,
        cor: appointment.servico_cor,
        totalAppointments: 0,
        paidRevenue: 0,
        pendingRevenue: 0,
      };

      current.totalAppointments += 1;

      if (appointment.status !== "cancelado") {
        if (appointment.payment_status === "pago") {
          current.paidRevenue += Number(appointment.valor ?? 0);
        } else {
          current.pendingRevenue += Number(appointment.valor ?? 0);
        }
      }

      accumulator[appointment.servico_id] = current;
      return accumulator;
    }, {}),
  ).sort(
    (left, right) =>
      right.paidRevenue +
      right.pendingRevenue -
      (left.paidRevenue + left.pendingRevenue),
  );

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
      paidRevenue,
      pendingRevenue,
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
      servicesFinancial: servicesFinancial.slice(0, 6),
    },
    lists: {
      upcomingAppointments,
      reminders: reminders.slice(0, 5),
    },
  };
}
