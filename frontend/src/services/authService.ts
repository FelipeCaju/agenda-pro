import { storage } from "@/lib/storage";
import { apiClient } from "@/services/apiClient";

export type UserRole = "owner" | "admin" | "manager" | "staff" | "viewer";

export type SignInInput = {
  email?: string;
  password?: string;
  idToken?: string;
  provider?: "google" | "apple" | "email";
};

export type CompleteOnboardingInput = {
  nome: string;
  nomeEmpresa: string;
  telefone?: string;
  senha?: string;
};

export type SessionUser = {
  id: string | null;
  nome: string;
  email: string;
  role: UserRole | null;
  organizationId: string | null;
  authProvider?: "google" | "apple" | "email";
};

export type SessionOrganization = {
  id: string;
  nomeEmpresa: string;
  monthlyAmount?: number;
  subscriptionStatus:
    | "trialing"
    | "pending_payment"
    | "active"
    | "past_due"
    | "cancelled"
    | "expired"
    | "blocked"
    | "overdue"
    | "trial"
    | "canceled";
  subscriptionPlan: string;
  dueDate: string | null;
  trialEnd: string | null;
  isBlocked: boolean;
  pixKey?: string;
  paymentGraceDays?: number;
  paymentAlertDays?: number;
  graceUntil?: string | null;
};

export type AuthSession = {
  token: string;
  scope: "organization" | "platform";
  user: SessionUser;
  organization: SessionOrganization | null;
  access: {
    isBlocked: boolean;
    canAccess: boolean;
    blockReason: string | null;
    subscriptionStatus: SessionOrganization["subscriptionStatus"] | null;
    isTrialValid: boolean;
    needsOnboarding: boolean;
  };
};

type LoginResponse = {
  token: string;
};

async function fetchSession() {
  const response = await apiClient.get<AuthSession>("/auth/session");
  return response.data;
}

export const authService = {
  async signIn(input: SignInInput): Promise<AuthSession> {
    const response = await apiClient.post<LoginResponse>("/auth/login", input);
    storage.setAuthToken(response.data.token);
    return fetchSession();
  },
  async getSession(): Promise<AuthSession | null> {
    if (!storage.getAuthToken()) {
      return null;
    }

    return fetchSession();
  },
  async completeOnboarding(input: CompleteOnboardingInput): Promise<AuthSession> {
    const response = await apiClient.post<AuthSession>("/auth/onboarding", input);
    storage.setAuthToken(response.data.token);
    return response.data;
  },
  async signOut() {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      storage.clearSession();
    }
  },
  async deleteAccount() {
    await apiClient.delete("/auth/account");
    storage.clearSession();
  },
};
