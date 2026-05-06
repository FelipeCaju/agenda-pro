import { useQuery } from "@tanstack/react-query";
import {
  appointmentService,
  type AgendaView,
} from "@/services/appointmentService";
import { shouldRetryTransientQuery } from "@/utils/query";
import { getTodayDate } from "@/utils/agenda";

export const agendaKeys = {
  all: ["agenda"] as const,
  lists: () => [...agendaKeys.all, "list"] as const,
  list: (date: string, view: AgendaView, professionalId?: string) =>
    [...agendaKeys.lists(), { date, view, professionalId: professionalId ?? "" }] as const,
  clientRecent: (clientId: string, limit: number) =>
    [...agendaKeys.all, "client-recent", { clientId, limit }] as const,
  details: () => [...agendaKeys.all, "detail"] as const,
  detail: (appointmentId: string) => [...agendaKeys.details(), appointmentId] as const,
};

export function useAgendaQuery({
  date = getTodayDate(),
  view = "day" as AgendaView,
  professionalId,
}: {
  date?: string;
  view?: AgendaView;
  professionalId?: string;
} = {}) {
  return useQuery({
    queryKey: agendaKeys.list(date, view, professionalId),
    queryFn: () => appointmentService.list({ date, view, professionalId }),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => shouldRetryTransientQuery(error, failureCount),
    retryDelay: 1500,
    placeholderData: (previousData) => previousData,
  });
}

export function useClientRecentAppointmentsQuery(
  clientId: string | undefined,
  { limit = 3, enabled = true }: { limit?: number; enabled?: boolean } = {},
) {
  const canFetch = Boolean(clientId) && enabled;

  return useQuery({
    queryKey: clientId ? agendaKeys.clientRecent(clientId, limit) : agendaKeys.clientRecent("empty", limit),
    queryFn: () => {
      if (!clientId) {
        throw new Error("Cliente invalido para consulta de agendamentos.");
      }

      return appointmentService.listByClient({ clientId, limit });
    },
    enabled: canFetch,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => shouldRetryTransientQuery(error, failureCount),
    retryDelay: 1500,
  });
}
