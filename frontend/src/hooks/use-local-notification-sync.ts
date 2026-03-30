import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useUpcomingAppointmentsQuery } from "@/hooks/use-upcoming-appointments-query";
import { localNotificationService } from "@/services/localNotificationService";
import {
  notificationPreferencesService,
  type NotificationPreferences,
} from "@/services/notificationPreferencesService";

export function useLocalNotificationSync() {
  const navigate = useNavigate();
  const { isAuthenticated, organizationId } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(() =>
    notificationPreferencesService.get(),
  );
  const [lastSyncSummary, setLastSyncSummary] = useState<string | null>(null);
  const { data: appointments = [] } = useUpcomingAppointmentsQuery({
    enabled: Boolean(isAuthenticated && organizationId),
  });

  useEffect(() => notificationPreferencesService.subscribe(setPreferences), []);

  useEffect(() => {
    void localNotificationService.initialize((target) => {
      if (target.kind === "appointment") {
        navigate(`/agenda/${target.appointmentId}`);
        return;
      }

      navigate("/agenda", {
        state: {
          selectedDate: target.date,
          notificationSlotKey: target.slotKey,
          notificationAppointmentIds: target.appointmentIds,
        },
      });
    });
  }, [navigate]);

  useEffect(() => {
    if (!organizationId) {
      return;
    }

    if (!isAuthenticated) {
      void localNotificationService.cancelOrganizationReminders(organizationId);
      setLastSyncSummary(null);
      return;
    }

    void localNotificationService
      .syncAppointmentReminders({
        organizationId,
        appointments,
        preferences,
      })
      .then((result) => {
        if (result.skipped === "exact-alarm") {
          setLastSyncSummary(
            "Os lembretes do Android dependem da permissao de alarme exato. Abra as configuracoes do app e permita alarmes exatos para receber no minuto certo.",
          );
          return;
        }

        if (result.skipped === "permission") {
          setLastSyncSummary(
            "As notificacoes do app estao bloqueadas no Android. Libere a permissao para receber os lembretes.",
          );
          return;
        }

        if (result.skipped === "empty") {
          setLastSyncSummary(null);
          return;
        }

        if (result.skipped === "disabled") {
          setLastSyncSummary(null);
          return;
        }

        setLastSyncSummary(
          result.scheduledCount > 0
            ? `${result.scheduledCount} lembrete(s) local(is) agendado(s) no aparelho.`
            : null,
        );
      });
  }, [appointments, isAuthenticated, organizationId, preferences]);

  return {
    lastSyncSummary,
  };
}
