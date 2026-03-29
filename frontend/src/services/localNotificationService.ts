import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import type { Appointment } from "@/services/appointmentService";
import {
  notificationPreferencesService,
  type NotificationPreferences,
} from "@/services/notificationPreferencesService";

const ACTION_TYPE_ID = "APPOINTMENT_REMINDER";
const SOUND_CHANNEL_ID = "appointment-reminders-sound";
const SILENT_CHANNEL_ID = "appointment-reminders-silent";
const TRACKED_IDS_KEY = "agendapro.local-notification-ids";

type NotificationNavigateTarget =
  | {
      kind: "appointment";
      appointmentId: string;
    }
  | {
      kind: "slot-group";
      date: string;
      slotKey: string;
      appointmentIds: string[];
    };

type ReminderNotificationPayload = {
  id: number;
  title: string;
  body: string;
  largeBody?: string;
  summaryText?: string;
  inboxList?: string[];
  group?: string;
  groupSummary?: boolean;
  at: Date;
  extra: NotificationNavigateTarget & {
    organizationId: string;
    reminderAt: string;
  };
};

type TrackedNotificationEntry = {
  organizationId: string;
  id: number;
};

let isInitialized = false;
let navigateHandler: ((target: NotificationNavigateTarget) => void) | null = null;

function isBrowser() {
  return typeof window !== "undefined";
}

function isNativeNotificationsSupported() {
  return Capacitor.isNativePlatform();
}

function readTrackedIds() {
  if (!isBrowser()) {
    return [] as TrackedNotificationEntry[];
  }

  try {
    return JSON.parse(window.localStorage.getItem(TRACKED_IDS_KEY) ?? "[]") as TrackedNotificationEntry[];
  } catch {
    return [];
  }
}

function writeTrackedIds(entries: TrackedNotificationEntry[]) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(TRACKED_IDS_KEY, JSON.stringify(entries));
}

function setTrackedIdsForOrganization(organizationId: string, ids: number[]) {
  const remaining = readTrackedIds().filter((entry) => entry.organizationId !== organizationId);
  const nextEntries = ids.map((id) => ({ organizationId, id }));
  writeTrackedIds([...remaining, ...nextEntries]);
}

function getTrackedIdsForOrganization(organizationId: string) {
  return readTrackedIds()
    .filter((entry) => entry.organizationId === organizationId)
    .map((entry) => entry.id);
}

function buildHashId(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }

  return Math.abs(hash || 1);
}

function buildDateTime(date: string, time: string) {
  return new Date(`${date}T${time.length === 5 ? `${time}:00` : time}`);
}

function toReminderDate(appointment: Appointment, reminderMinutes: number) {
  const startsAt = buildDateTime(appointment.data, appointment.horarioInicial);
  return new Date(startsAt.getTime() - reminderMinutes * 60_000);
}

function isSchedulableAppointment(
  appointment: Appointment,
  reminderDate: Date,
  now: Date,
) {
  if (appointment.status === "cancelado" || appointment.status === "concluido") {
    return false;
  }

  return reminderDate.getTime() > now.getTime();
}

function formatReminderLead(minutes: number) {
  if (minutes <= 0) {
    return "agora";
  }

  if (minutes === 1) {
    return "em 1 minuto";
  }

  return `em ${minutes} minutos`;
}

function truncateInboxList(lines: string[]) {
  return lines.slice(0, 5);
}

function buildNotificationPayloads(
  organizationId: string,
  appointments: Appointment[],
  preferences: NotificationPreferences,
) {
  const now = new Date();
  const groups = new Map<
    string,
    Array<{
      appointment: Appointment;
      reminderDate: Date;
    }>
  >();

  appointments.forEach((appointment) => {
    const reminderDate = toReminderDate(appointment, preferences.reminderMinutes);

    if (!isSchedulableAppointment(appointment, reminderDate, now)) {
      return;
    }

    const slotKey = `${organizationId}:${reminderDate.toISOString().slice(0, 16)}`;
    const current = groups.get(slotKey) ?? [];
    current.push({ appointment, reminderDate });
    groups.set(slotKey, current);
  });

  const notifications: ReminderNotificationPayload[] = [];

  groups.forEach((entries, slotKey) => {
    const reminderDate = entries[0].reminderDate;
    const leadText = formatReminderLead(preferences.reminderMinutes);
    const groupId = buildHashId(`group:${slotKey}:${preferences.reminderMinutes}`);

    if (entries.length === 1) {
      const [{ appointment }] = entries;
      notifications.push({
        id: buildHashId(`appointment:${appointment.id}:${preferences.reminderMinutes}`),
        title: `${appointment.clienteNome} - ${appointment.servicoNome}`,
        body: `Atendimento ${leadText}.`,
        largeBody: `${appointment.clienteNome} - ${appointment.servicoNome}\n${appointment.data} ${appointment.horarioInicial}`,
        at: reminderDate,
        extra: {
          kind: "appointment",
          appointmentId: appointment.id,
          organizationId,
          reminderAt: reminderDate.toISOString(),
        },
      });
      return;
    }

    const lines = entries.map(
      ({ appointment }) => `${appointment.clienteNome} - ${appointment.servicoNome}`,
    );

    notifications.push({
      id: groupId,
      title: `Voce tem ${entries.length} atendimentos ${leadText}`,
      body: lines.join("\n"),
      largeBody: lines.join("\n"),
      summaryText: `${entries.length} atendimentos no mesmo horario`,
      inboxList: truncateInboxList(lines),
      group: slotKey,
      groupSummary: true,
      at: reminderDate,
      extra: {
        kind: "slot-group",
        date: entries[0].appointment.data,
        slotKey,
        appointmentIds: entries.map(({ appointment }) => appointment.id),
        organizationId,
        reminderAt: reminderDate.toISOString(),
      },
    });
  });

  return notifications.sort((first, second) => first.at.getTime() - second.at.getTime());
}

async function ensureChannels(soundEnabled: boolean) {
  if (Capacitor.getPlatform() !== "android") {
    return;
  }

  const { channels } = await LocalNotifications.listChannels();
  const channelIds = new Set(channels.map((channel) => channel.id));
  const requiredChannels = [
    {
      id: SOUND_CHANNEL_ID,
      name: "Lembretes com som",
      description: "Lembretes de atendimentos com alerta sonoro.",
      importance: 4 as const,
      vibration: true,
    },
    {
      id: SILENT_CHANNEL_ID,
      name: "Lembretes silenciosos",
      description: "Lembretes de atendimentos sem som.",
      importance: 3 as const,
      vibration: false,
    },
  ];

  for (const channel of requiredChannels) {
    if (channelIds.has(channel.id)) {
      continue;
    }

    await LocalNotifications.createChannel(channel);
  }

  if (!soundEnabled) {
    return;
  }
}

function getChannelId(preferences: NotificationPreferences) {
  return preferences.soundEnabled ? SOUND_CHANNEL_ID : SILENT_CHANNEL_ID;
}

async function cancelTrackedNotifications(organizationId: string) {
  const trackedIds = getTrackedIdsForOrganization(organizationId);

  if (trackedIds.length) {
    await LocalNotifications.cancel({
      notifications: trackedIds.map((id) => ({ id })),
    });
  }

  setTrackedIdsForOrganization(organizationId, []);
}

export const localNotificationService = {
  isSupported() {
    return isNativeNotificationsSupported();
  },
  getPreferences() {
    return notificationPreferencesService.get();
  },
  async initialize(onNavigate?: (target: NotificationNavigateTarget) => void) {
    navigateHandler = onNavigate ?? navigateHandler;

    if (!isNativeNotificationsSupported() || isInitialized) {
      return;
    }

    await LocalNotifications.registerActionTypes({
      types: [
        {
          id: ACTION_TYPE_ID,
        },
      ],
    });

    await LocalNotifications.addListener("localNotificationActionPerformed", (event) => {
      const target = event.notification.extra as NotificationNavigateTarget | undefined;

      if (target && navigateHandler) {
        navigateHandler(target);
      }
    });

    isInitialized = true;
  },
  async checkPermissions() {
    if (!isNativeNotificationsSupported()) {
      return { display: "granted" as const };
    }

    return LocalNotifications.checkPermissions();
  },
  async requestPermissions() {
    if (!isNativeNotificationsSupported()) {
      return { display: "granted" as const };
    }

    return LocalNotifications.requestPermissions();
  },
  async syncAppointmentReminders({
    organizationId,
    appointments,
    preferences,
  }: {
    organizationId: string;
    appointments: Appointment[];
    preferences?: NotificationPreferences;
  }) {
    if (!isNativeNotificationsSupported()) {
      return { scheduledCount: 0, skipped: "web" as const };
    }

    const currentPreferences = preferences ?? notificationPreferencesService.get();
    await this.initialize();
    await cancelTrackedNotifications(organizationId);

    if (!currentPreferences.enabled) {
      return { scheduledCount: 0, skipped: "disabled" as const };
    }

    let permission = await this.checkPermissions();

    if (permission.display !== "granted") {
      permission = await this.requestPermissions();
    }

    if (permission.display !== "granted") {
      return { scheduledCount: 0, skipped: "permission" as const };
    }

    await ensureChannels(currentPreferences.soundEnabled);

    const notifications = buildNotificationPayloads(
      organizationId,
      appointments,
      currentPreferences,
    );

    if (!notifications.length) {
      return { scheduledCount: 0, skipped: "empty" as const };
    }

    await LocalNotifications.schedule({
      notifications: notifications.map((notification) => ({
        id: notification.id,
        title: notification.title,
        body: notification.body,
        largeBody: notification.largeBody,
        summaryText: notification.summaryText,
        inboxList: notification.inboxList,
        group: notification.group,
        groupSummary: notification.groupSummary,
        schedule: {
          at: notification.at,
          allowWhileIdle: true,
        },
        actionTypeId: ACTION_TYPE_ID,
        autoCancel: true,
        channelId: getChannelId(currentPreferences),
        extra: notification.extra,
      })),
    });

    setTrackedIdsForOrganization(
      organizationId,
      notifications.map((notification) => notification.id),
    );

    return {
      scheduledCount: notifications.length,
      skipped: null,
    };
  },
  async cancelOrganizationReminders(organizationId: string) {
    if (!isNativeNotificationsSupported()) {
      return;
    }

    await cancelTrackedNotifications(organizationId);
  },
};
