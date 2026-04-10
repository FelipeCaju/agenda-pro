import { useQuery } from "@tanstack/react-query";
import { agendaKeys } from "@/hooks/use-agenda-query";
import { appointmentService } from "@/services/appointmentService";
import { shouldRetryTransientQuery } from "@/utils/query";

export function useAppointmentQuery(appointmentId: string | undefined) {
  const enabled = Boolean(appointmentId);

  return useQuery({
    queryKey: enabled ? agendaKeys.detail(appointmentId!) : agendaKeys.detail("new"),
    queryFn: () => {
      if (!appointmentId) {
        throw new Error("Agendamento invalido para consulta.");
      }

      return appointmentService.getById(appointmentId);
    },
    enabled,
    retry: (failureCount, error) => shouldRetryTransientQuery(error, failureCount),
    retryDelay: 1500,
  });
}
