import type { OrganizationPayment, OrganizationProfile } from "@/services/organizationService";

function toDateParts(value?: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function differenceInDays(value?: string | null) {
  const target = toDateParts(value);

  if (!target) {
    return null;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function getPaymentStatusLabel(status?: string | null) {
  if (status === "pending") return "Pendente";
  if (status === "received") return "Recebido";
  if (status === "confirmed") return "Confirmado";
  if (status === "paid") return "Pago";
  if (status === "overdue") return "Em atraso";
  if (status === "refunded") return "Estornado";
  if (status === "failed") return "Falhou";
  if (status === "canceled") return "Cancelado";
  if (status === "cancelled") return "Cancelado";
  return "Sem registro";
}

export function getSubscriptionStatusLabel(status?: string | null) {
  if (status === "active") return "Ativa";
  if (status === "pending_payment") return "Aguardando pagamento";
  if (status === "past_due") return "Em atraso";
  if (status === "overdue") return "Em atraso";
  if (status === "blocked") return "Bloqueada";
  if (status === "expired") return "Expirada";
  if (status === "cancelled") return "Cancelada";
  if (status === "trialing") return "Em teste";
  if (status === "trial") return "Em teste";
  if (status === "canceled") return "Cancelada";
  return status ?? "Indefinido";
}

export function getBillingAlert(
  organization?: OrganizationProfile | null,
  payments: OrganizationPayment[] = [],
) {
  const latestPayment = payments[0] ?? null;
  const alertWindowDays = Number(organization?.paymentAlertDays ?? 5);
  const dueInDays = differenceInDays(organization?.dueDate ?? latestPayment?.dueDate ?? null);

  if (!organization) {
    return {
      hasAlert: false,
      tone: "info" as const,
      title: "",
      description: "",
    };
  }

  if (organization.subscriptionStatus === "pending_payment") {
    return {
      hasAlert: true,
      tone: "warning" as const,
      title: "Pagamento inicial pendente",
      description: "A assinatura ja foi iniciada, mas ainda falta confirmar o primeiro pagamento.",
    };
  }

  if (organization.subscriptionStatus === "overdue" || organization.subscriptionStatus === "past_due") {
    return {
      hasAlert: true,
      tone: "warning" as const,
      title: "Pagamento pendente",
      description:
        organization.graceUntil
          ? `Existe um pagamento pendente. O acesso segue liberado ate ${organization.graceUntil.split("-").reverse().join("/")}.`
          : "Existe um pagamento pendente. Regularize para evitar bloqueio.",
    };
  }

  if (organization.subscriptionStatus === "blocked") {
    return {
      hasAlert: true,
      tone: "danger" as const,
      title: "Conta bloqueada",
      description: "A empresa esta bloqueada por assinatura. Verifique o historico de pagamento.",
    };
  }

  if (organization.subscriptionStatus === "canceled") {
    return {
      hasAlert: true,
      tone: "danger" as const,
      title: "Assinatura cancelada",
      description: "A conta foi cancelada. Os dados seguem intactos, mas o acesso esta limitado.",
    };
  }

  if (organization.subscriptionStatus === "cancelled" || organization.subscriptionStatus === "expired") {
    return {
      hasAlert: true,
      tone: "danger" as const,
      title: organization.subscriptionStatus === "expired" ? "Assinatura expirada" : "Assinatura cancelada",
      description:
        organization.subscriptionStatus === "expired"
          ? "O periodo de uso terminou e a conta agora esta em modo restrito."
          : "A conta foi cancelada. Os dados seguem intactos, mas o acesso esta limitado.",
    };
  }

  if (dueInDays !== null && dueInDays < 0) {
    return {
      hasAlert: true,
      tone: "danger" as const,
      title: "Vencimento expirado",
      description: "O vencimento passou. Confira o historico e regularize o pagamento.",
    };
  }

  if (dueInDays !== null && dueInDays <= alertWindowDays) {
    return {
      hasAlert: true,
      tone: "warning" as const,
      title: "Pagamento proximo do vencimento",
      description: `O vencimento acontece em ${Math.max(dueInDays, 0)} dia(s). Vale se organizar para nao atrasar.`,
    };
  }

  if (latestPayment && latestPayment.status === "pending") {
    return {
      hasAlert: true,
      tone: "warning" as const,
      title: "Pagamento pendente",
      description: latestPayment.customerNotifiedPaidAt
        ? "Voce ja avisou o administrador sobre este pagamento. A notificacao segue visivel ate a baixa."
        : "Existe um pagamento pendente no historico mais recente.",
    };
  }

  return {
    hasAlert: false,
    tone: "info" as const,
    title: "",
    description: "",
  };
}
