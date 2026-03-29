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
      return;
    }

    void localNotificationService.syncAppointmentReminders({
      organizationId,
      appointments,
      preferences,
    });
  }, [appointments, isAuthenticated, organizationId, preferences]);
}
