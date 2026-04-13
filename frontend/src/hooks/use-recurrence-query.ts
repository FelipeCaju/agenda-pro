import { useQuery } from "@tanstack/react-query";
import {
  recurrenceService,
  type RecurringChargeFilters,
  type RecurringProfileFilters,
} from "@/services/recurrenceService";

export const recurrenceKeys = {
  all: ["recurrence"] as const,
  summary: (referenceDate = "") => [...recurrenceKeys.all, "summary", referenceDate] as const,
  profiles: () => [...recurrenceKeys.all, "profiles"] as const,
  profileList: (filters: RecurringProfileFilters) =>
    [...recurrenceKeys.profiles(), "list", filters] as const,
  profileDetail: (profileId: string) => [...recurrenceKeys.profiles(), "detail", profileId] as const,
  charges: () => [...recurrenceKeys.all, "charges"] as const,
  chargeList: (filters: RecurringChargeFilters) =>
    [...recurrenceKeys.charges(), "list", filters] as const,
};

export function useRecurringSummaryQuery(referenceDate = "") {
  return useQuery({
    queryKey: recurrenceKeys.summary(referenceDate),
    queryFn: () => recurrenceService.getSummary(referenceDate),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });
}

export function useRecurringProfilesQuery(filters: RecurringProfileFilters) {
  return useQuery({
    queryKey: recurrenceKeys.profileList(filters),
    queryFn: () => recurrenceService.listProfiles(filters),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });
}

export function useRecurringProfileQuery(profileId?: string) {
  return useQuery({
    queryKey: recurrenceKeys.profileDetail(profileId ?? ""),
    queryFn: () => recurrenceService.getProfile(profileId ?? ""),
    enabled: Boolean(profileId),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });
}

export function useRecurringChargesQuery(filters: RecurringChargeFilters) {
  return useQuery({
    queryKey: recurrenceKeys.chargeList(filters),
    queryFn: () => recurrenceService.listCharges(filters),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });
}
