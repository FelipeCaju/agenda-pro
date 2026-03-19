import { useQuery } from "@tanstack/react-query";
import { organizationService } from "@/services/organizationService";

export const organizationKeys = {
  all: ["organization"] as const,
  current: () => [...organizationKeys.all, "current"] as const,
  members: () => [...organizationKeys.all, "members"] as const,
  payments: () => [...organizationKeys.all, "payments"] as const,
};

export function useOrganizationQuery() {
  return useQuery({
    queryKey: organizationKeys.current(),
    queryFn: () => organizationService.getCurrent(),
    staleTime: 60_000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });
}

export function useOrganizationMembersQuery() {
  return useQuery({
    queryKey: organizationKeys.members(),
    queryFn: () => organizationService.listMembers(),
    staleTime: 60_000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });
}

export function useOrganizationPaymentsQuery() {
  return useQuery({
    queryKey: organizationKeys.payments(),
    queryFn: () => organizationService.listPayments(),
    staleTime: 60_000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });
}
