import { useQuery } from "@tanstack/react-query";
import { billingService } from "@/services/billingService";

export const billingKeys = {
  all: ["billing"] as const,
  overview: () => [...billingKeys.all, "overview"] as const,
  subscription: () => [...billingKeys.all, "subscription"] as const,
  invoices: () => [...billingKeys.all, "invoices"] as const,
  currentCharge: () => [...billingKeys.all, "current-charge"] as const,
};

export function useBillingOverviewQuery() {
  return useQuery({
    queryKey: billingKeys.overview(),
    queryFn: () => billingService.getOverview(),
    staleTime: 60_000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });
}

export function useBillingSubscriptionQuery() {
  return useQuery({
    queryKey: billingKeys.subscription(),
    queryFn: () => billingService.getSubscription(),
    staleTime: 60_000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });
}

export function useBillingInvoicesQuery() {
  return useQuery({
    queryKey: billingKeys.invoices(),
    queryFn: () => billingService.listInvoices(),
    staleTime: 60_000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });
}

export function useBillingCurrentChargeQuery() {
  return useQuery({
    queryKey: billingKeys.currentCharge(),
    queryFn: () => billingService.getCurrentCharge(),
    staleTime: 60_000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });
}
