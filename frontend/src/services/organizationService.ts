import { apiClient } from "@/services/apiClient";
import { executeServiceCall } from "@/services/serviceHelpers";
import type { SessionOrganization } from "@/services/authService";

export type OrganizationMember = {
  id: string;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
};

export type OrganizationPayment = {
  id: string;
  organizationId: string;
  referenceMonth: string;
  amount: number;
  status: "pending" | "paid" | "overdue" | "canceled";
  paidAt: string | null;
  dueDate: string | null;
  paymentMethod: string | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type OrganizationProfile = SessionOrganization & {
  emailResponsavel: string;
  telefone: string;
  monthlyAmount: number;
};

type OrganizationApiModel = {
  id: string;
  nome_empresa: string;
  email_responsavel: string;
  telefone: string;
  monthly_amount: number;
  subscription_status: string;
  subscription_plan: string;
  due_date: string | null;
  trial_end: string | null;
  is_blocked: boolean;
  block_reason: string | null;
  can_access: boolean;
  is_trial_valid: boolean;
};

type OrganizationPaymentApiModel = {
  id: string;
  organization_id: string;
  reference_month: string;
  amount: number;
  status: "pending" | "paid" | "overdue" | "canceled";
  paid_at: string | null;
  due_date: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

function mapOrganization(model: OrganizationApiModel): OrganizationProfile {
  return {
    id: model.id,
    nomeEmpresa: model.nome_empresa,
    emailResponsavel: model.email_responsavel,
    telefone: model.telefone ?? "",
    monthlyAmount: Number(model.monthly_amount ?? 0),
    subscriptionStatus: model.subscription_status as SessionOrganization["subscriptionStatus"],
    subscriptionPlan: model.subscription_plan,
    dueDate: model.due_date,
    trialEnd: model.trial_end,
    isBlocked: Boolean(model.is_blocked),
  };
}

function mapPayment(model: OrganizationPaymentApiModel): OrganizationPayment {
  return {
    id: model.id,
    organizationId: model.organization_id,
    referenceMonth: model.reference_month,
    amount: Number(model.amount ?? 0),
    status: model.status,
    paidAt: model.paid_at,
    dueDate: model.due_date,
    paymentMethod: model.payment_method,
    notes: model.notes,
    createdAt: model.created_at,
    updatedAt: model.updated_at,
  };
}

export const organizationService = {
  async getCurrent() {
    return executeServiceCall(
      async () => {
        const response = await apiClient.get<OrganizationApiModel>("/organizations/current");
        return mapOrganization(response.data);
      },
      {
        errorMessage: "Nao foi possivel carregar a organizacao.",
      },
    );
  },
  async listMembers() {
    return executeServiceCall(
      async () => {
        const response = await apiClient.get<OrganizationMember[]>("/organizations/current/users");
        return response.data;
      },
      {
        errorMessage: "Nao foi possivel carregar os usuarios da organizacao.",
      },
    );
  },
  async listPayments() {
    return executeServiceCall(
      async () => {
        const response = await apiClient.get<OrganizationPaymentApiModel[]>(
          "/organizations/current/payments",
        );
        return response.data.map(mapPayment);
      },
      {
        errorMessage: "Nao foi possivel carregar o historico de pagamentos.",
      },
    );
  },
  async updateCurrent(input: Partial<OrganizationProfile>) {
    return executeServiceCall(
      async () => {
        const response = await apiClient.patch<OrganizationApiModel>("/organizations/current", input);
        return mapOrganization(response.data);
      },
      {
        errorMessage: "Nao foi possivel atualizar a organizacao.",
      },
    );
  },
};
