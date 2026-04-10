import { useQuery } from "@tanstack/react-query";
import { appointmentService } from "@/services/appointmentService";
import { shouldRetryTransientQuery } from "@/utils/query";

export const upcomingAppointmentsKeys = {
  all: ["agenda", "upcoming"] as const,
  list: (daysAhead: number, professionalId?: string) =>
    [...upcomingAppointmentsKeys.all, { daysAhead, professionalId: professionalId ?? "" }] as const,
};

export function useUpcomingAppointmentsQuery({
  daysAhead = 45,
  professionalId,
  enabled = true,
}: {
  daysAhead?: number;
  professionalId?: string;
  enabled?: boolean;
} = {}) {
  return useQuery({
    queryKey: upcomingAppointmentsKeys.list(daysAhead, professionalId),
    queryFn: () => appointmentService.listUpcoming({ daysAhead, professionalId }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => shouldRetryTransientQuery(error, failureCount),
    retryDelay: 1500,
    enabled,
    placeholderData: (previousData) => previousData,
  });
}
