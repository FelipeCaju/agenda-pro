import { useEffect, useState } from "react";
import {
  notificationPreferencesService,
  type NotificationPreferences,
} from "@/services/notificationPreferencesService";

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(() =>
    notificationPreferencesService.get(),
  );

  useEffect(() => notificationPreferencesService.subscribe(setPreferences), []);

  return {
    preferences,
    savePreferences: notificationPreferencesService.save.bind(notificationPreferencesService),
    resetPreferences: notificationPreferencesService.reset.bind(notificationPreferencesService),
  };
}
