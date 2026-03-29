import { storage } from "@/lib/storage";

const PREFERENCES_KEY = "agendapro.notification-preferences";
const CHANGED_EVENT = "agendapro:notification-preferences-changed";

export type NotificationPreferences = {
  enabled: boolean;
  soundEnabled: boolean;
  reminderMinutes: number;
};

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  soundEnabled: true,
  reminderMinutes: 10,
};

function isBrowser() {
  return typeof window !== "undefined";
}

function normalizePreferences(input?: Partial<NotificationPreferences> | null): NotificationPreferences {
  const reminderMinutes = Number(input?.reminderMinutes ?? DEFAULT_PREFERENCES.reminderMinutes);

  return {
    enabled: input?.enabled ?? DEFAULT_PREFERENCES.enabled,
    soundEnabled: input?.soundEnabled ?? DEFAULT_PREFERENCES.soundEnabled,
    reminderMinutes:
      Number.isFinite(reminderMinutes) && reminderMinutes >= 0 && reminderMinutes <= 240
        ? Math.trunc(reminderMinutes)
        : DEFAULT_PREFERENCES.reminderMinutes,
  };
}

function dispatchChanged(preferences: NotificationPreferences) {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<NotificationPreferences>(CHANGED_EVENT, {
      detail: preferences,
    }),
  );
}

export const notificationPreferencesService = {
  get() {
    if (!isBrowser()) {
      return DEFAULT_PREFERENCES;
    }

    const saved = storage.getItem(PREFERENCES_KEY);

    if (!saved) {
      return DEFAULT_PREFERENCES;
    }

    try {
      return normalizePreferences(JSON.parse(saved) as Partial<NotificationPreferences>);
    } catch {
      return DEFAULT_PREFERENCES;
    }
  },
  save(input: Partial<NotificationPreferences>) {
    const current = this.get();
    const next = normalizePreferences({
      ...current,
      ...input,
    });

    if (isBrowser()) {
      storage.setItem(PREFERENCES_KEY, JSON.stringify(next));
      dispatchChanged(next);
    }

    return next;
  },
  reset() {
    if (isBrowser()) {
      storage.removeItem(PREFERENCES_KEY);
      dispatchChanged(DEFAULT_PREFERENCES);
    }

    return DEFAULT_PREFERENCES;
  },
  subscribe(listener: (preferences: NotificationPreferences) => void) {
    if (!isBrowser()) {
      return () => undefined;
    }

    const handleChange = (event: Event) => {
      const next = (event as CustomEvent<NotificationPreferences>).detail;
      listener(next ?? this.get());
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== PREFERENCES_KEY) {
        return;
      }

      listener(this.get());
    };

    window.addEventListener(CHANGED_EVENT, handleChange as EventListener);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(CHANGED_EVENT, handleChange as EventListener);
      window.removeEventListener("storage", handleStorage);
    };
  },
  defaults: DEFAULT_PREFERENCES,
};
