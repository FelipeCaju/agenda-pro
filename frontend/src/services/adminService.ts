import { apiClient } from "@/services/apiClient";

export type AdminOrganizationListItem = {
  id: string;
  nomeEmpresa: string;
  emailResponsavel: string;
  telefone: string | null;
  monthlyAmount: number;
  subscriptionStatus: "active" | "overdue" | "blocked" | "trial" | "canceled";
  subscriptionPlan: string;
  dueDate: string | null;
  trialEnd: string | null;
  isBlocked: boolean;
  latestPaymentStatus: string | null;
  latestReferenceMonth: string | null;
  activeUsers: number;
};

export type AdminOrganizationPayment = {
  id: string;
  organizationId: string;
  referenceMonth: string;
  amount: number;
  status: "pending" | "paid" | "overdue" | "canceled";
  paidAt: string | null;
  dueDate: string | null;
  paymentMethod: string | null;
  notes: string | null;
  customerNotifiedPaidAt: string | null;
  customerPaymentNote: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type PlatformSettings = {
  pixKey: string;
  adminWhatsappNumber: string;
  defaultTrialDays: number;
  paymentGraceDays: number;
  paymentAlertDays: number;
};

export type AdminOrganizationDetails = {
  organization: {
    id: string;
    nomeEmpresa: string;
    emailResponsavel: string;
    telefone: string | null;
    monthlyAmount: number;
    subscriptionStatus: "active" | "overdue" | "blocked" | "trial" | "canceled";
    subscriptionPlan: string;
    dueDate: string | null;
    trialEnd: string | null;
    isBlocked: boolean;
    blockReason: string | null;
    canAccess: boolean;
  };
  settings: {
    nomeNegocio: string;
    horaInicioAgenda: string;
    horaFimAgenda: string;
    timezone: string;
    moeda: string;
  } | null;
  members: Array<{
    id: string;
    nome: string;
    email: string;
    role: string;
    ativo: boolean;
  }>;
  payments: AdminOrganizationPayment[];
};

export type AdminPaymentInput = {
  referenceMonth: string;
  amount: number;
  status: "pending" | "paid" | "overdue" | "canceled";
  paidAt?: string | null;
  dueDate?: string | null;
  paymentMethod?: string | null;
  notes?: string | null;
};

export type AdminSubscriptionInput = {
  subscriptionStatus: "active" | "overdue" | "blocked" | "trial" | "canceled";
  subscriptionPlan?: string;
  monthlyAmount?: number;
  dueDate?: string | null;
  trialEnd?: string | null;
};

export type AdminOrganizationCreateInput = {
  nomeEmpresa: string;
  emailResponsavel: string;
  ownerName: string;
  initialPassword: string;
  telefone?: string | null;
  cpfCnpj: string;
  monthlyAmount: number;
  subscriptionPlan: "trial" | "pro";
  trialDays?: number;
  subscriptionStatus?: "active" | "overdue" | "blocked" | "trial" | "canceled";
  dueDate?: string | null;
  trialEnd?: string | null;
};

function mapOrganization(model: any): AdminOrganizationListItem {
  return {
    id: model.id,
    nomeEmpresa: model.nome_empresa,
    emailResponsavel: model.email_responsavel,
    telefone: model.telefone,
    monthlyAmount: Number(model.monthly_amount ?? 0),
    subscriptionStatus: model.subscription_status,
    subscriptionPlan: model.subscription_plan,
    dueDate: model.due_date,
    trialEnd: model.trial_end,
    isBlocked: Boolean(model.is_blocked),
    latestPaymentStatus: model.latest_payment_status ?? null,
    latestReferenceMonth: model.latest_reference_month ?? null,
    activeUsers: Number(model.active_users ?? 0),
  };
}

function mapOrganizationDetails(model: any): AdminOrganizationDetails["organization"] {
  return {
    id: model.id,
    nomeEmpresa: model.nome_empresa,
    emailResponsavel: model.email_responsavel,
    telefone: model.telefone,
    monthlyAmount: Number(model.monthly_amount ?? 0),
    subscriptionStatus: model.subscription_status,
    subscriptionPlan: model.subscription_plan,
    dueDate: model.due_date,
    trialEnd: model.trial_end,
    isBlocked: Boolean(model.is_blocked),
    blockReason: model.block_reason ?? null,
    canAccess: Boolean(model.can_access),
  };
}

function mapPayment(model: any): AdminOrganizationPayment {
  return {
    id: model.id,
    organizationId: model.organization_id,
    referenceMonth: model.reference_month,
    amount: Number(model.amount),
    status: model.status,
    paidAt: model.paid_at,
    dueDate: model.due_date,
    paymentMethod: model.payment_method,
    notes: model.notes,
    customerNotifiedPaidAt: model.customer_notified_paid_at ?? null,
    customerPaymentNote: model.customer_payment_note ?? null,
    createdAt: model.created_at,
    updatedAt: model.updated_at,
  };
}

export const adminService = {
  async listOrganizations() {
    const response = await apiClient.get<any[]>("/admin/organizations");
    return response.data.map(mapOrganization);
  },
  async createOrganization(input: AdminOrganizationCreateInput) {
    const response = await apiClient.post<any>("/admin/organizations", {
      nome_empresa: input.nomeEmpresa,
      email_responsavel: input.emailResponsavel,
      owner_name: input.ownerName,
      initial_password: input.initialPassword,
      telefone: input.telefone,
      cpf_cnpj: input.cpfCnpj,
      monthly_amount: input.monthlyAmount,
      subscription_plan: input.subscriptionPlan,
      trial_days: input.trialDays,
      subscription_status: input.subscriptionStatus,
      due_date: input.dueDate,
      trial_end: input.trialEnd,
    });
    return {
      organization: mapOrganizationDetails(response.data.organization),
      settings: response.data.settings
        ? {
            nomeNegocio: response.data.settings.nome_negocio,
            horaInicioAgenda: response.data.settings.hora_inicio_agenda,
            horaFimAgenda: response.data.settings.hora_fim_agenda,
            timezone: response.data.settings.timezone,
            moeda: response.data.settings.moeda,
          }
        : null,
      members: (response.data.members ?? []).map((member: any) => ({
        id: member.id,
        nome: member.nome,
        email: member.email,
        role: member.role,
        ativo: Boolean(member.ativo),
      })),
      payments: (response.data.payments ?? []).map(mapPayment),
    } satisfies AdminOrganizationDetails;
  },
  async getOrganization(organizationId: string) {
    const response = await apiClient.get<any>(`/admin/organizations/${organizationId}`);
    return {
      organization: mapOrganizationDetails(response.data.organization),
      settings: response.data.settings
        ? {
            nomeNegocio: response.data.settings.nome_negocio,
            horaInicioAgenda: response.data.settings.hora_inicio_agenda,
            horaFimAgenda: response.data.settings.hora_fim_agenda,
            timezone: response.data.settings.timezone,
            moeda: response.data.settings.moeda,
          }
        : null,
      members: (response.data.members ?? []).map((member: any) => ({
        id: member.id,
        nome: member.nome,
        email: member.email,
        role: member.role,
        ativo: Boolean(member.ativo),
      })),
      payments: (response.data.payments ?? []).map(mapPayment),
    } satisfies AdminOrganizationDetails;
  },
  async listPayments(organizationId: string) {
    const response = await apiClient.get<any[]>(`/admin/organizations/${organizationId}/payments`);
    return response.data.map(mapPayment);
  },
  async createPayment(organizationId: string, input: AdminPaymentInput) {
    const response = await apiClient.post<any>(`/admin/organizations/${organizationId}/payments`, {
      reference_month: input.referenceMonth,
      amount: input.amount,
      status: input.status,
      paid_at: input.paidAt,
      due_date: input.dueDate,
      payment_method: input.paymentMethod,
      notes: input.notes,
    });
    return mapPayment(response.data);
  },
  async updateSubscription(organizationId: string, input: AdminSubscriptionInput) {
    const response = await apiClient.patch<any>(
      `/admin/organizations/${organizationId}/subscription`,
      {
        subscription_status: input.subscriptionStatus,
        subscription_plan: input.subscriptionPlan,
        monthly_amount: input.monthlyAmount,
        due_date: input.dueDate,
        trial_end: input.trialEnd,
      },
    );
    return {
      organization: mapOrganizationDetails(response.data.organization),
      settings: response.data.settings,
      members: response.data.members,
      payments: (response.data.payments ?? []).map(mapPayment),
    } satisfies AdminOrganizationDetails;
  },
  async getPlatformSettings() {
    const response = await apiClient.get<any>("/admin/platform-settings");
    return {
      pixKey: response.data.pix_key ?? "",
      adminWhatsappNumber: response.data.admin_whatsapp_number ?? "",
      defaultTrialDays: Number(response.data.default_trial_days ?? 5),
      paymentGraceDays: Number(response.data.payment_grace_days ?? 5),
      paymentAlertDays: Number(response.data.payment_alert_days ?? 5),
    } satisfies PlatformSettings;
  },
  async updatePlatformSettings(input: PlatformSettings) {
    const response = await apiClient.patch<any>("/admin/platform-settings", {
      pix_key: input.pixKey,
      admin_whatsapp_number: input.adminWhatsappNumber,
      default_trial_days: input.defaultTrialDays,
      payment_grace_days: input.paymentGraceDays,
      payment_alert_days: input.paymentAlertDays,
    });
    return {
      pixKey: response.data.pix_key ?? "",
      adminWhatsappNumber: response.data.admin_whatsapp_number ?? "",
      defaultTrialDays: Number(response.data.default_trial_days ?? 5),
      paymentGraceDays: Number(response.data.payment_grace_days ?? 5),
      paymentAlertDays: Number(response.data.payment_alert_days ?? 5),
    } satisfies PlatformSettings;
  },
};
