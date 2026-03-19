import { useEffect, useState } from "react";
import { MobilePageHeader } from "@/components/layout/mobile-page-header";
import { ReminderList } from "@/components/reminders/reminder-list";
import { Card } from "@/components/ui/card";
import { useReminderMutations } from "@/hooks/use-reminder-mutations";
import { useRemindersQuery } from "@/hooks/use-reminders-query";
import type { Reminder } from "@/services/reminderService";

export function RemindersPage() {
  const [successMessage, setSuccessMessage] = useState("");
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);
  const [replyingReminderId, setReplyingReminderId] = useState<string | null>(null);
  const { data = [], error, isLoading, isError } = useRemindersQuery();
  const {
    isRegisteringReminderReply,
    isSendingManualReminder,
    registerReminderReply,
    registerReminderReplyError,
    sendManualReminder,
    sendManualReminderError,
  } = useReminderMutations();

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => setSuccessMessage(""), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [successMessage]);

  async function handleSendManual(reminder: Reminder) {
    setSendingReminderId(reminder.id);

    try {
      await sendManualReminder(reminder.appointmentId);
      setSuccessMessage("Lembrete enviado com sucesso.");
    } catch {
      return;
    } finally {
      setSendingReminderId(null);
    }
  }

  async function handleReply(reminder: Reminder, replyStatus: "confirmado" | "cancelado") {
    setReplyingReminderId(reminder.id);

    try {
      await registerReminderReply({
        appointmentId: reminder.appointmentId,
        input: {
          replyStatus,
          responseText: replyStatus === "confirmado" ? "Cliente confirmou" : "Cliente cancelou",
        },
      });
      setSuccessMessage("Resposta do cliente registrada com sucesso.");
    } catch {
      return;
    } finally {
      setReplyingReminderId(null);
    }
  }

  return (
    <section className="space-y-3">
      <MobilePageHeader subtitle="Automacoes e lembretes" title="Lembretes" />
      {successMessage ? (
        <Card className="border-emerald-100 bg-emerald-50/80">
          <p className="text-sm font-medium text-emerald-700">{successMessage}</p>
        </Card>
      ) : null}
      {isLoading ? <p className="text-sm text-slate-500">Carregando lembretes...</p> : null}
      {isError ? <p className="text-sm text-rose-600">{error.message}</p> : null}
      {sendManualReminderError ? <p className="text-sm text-rose-600">{sendManualReminderError.message}</p> : null}
      {registerReminderReplyError ? (
        <p className="text-sm text-rose-600">{registerReminderReplyError.message}</p>
      ) : null}
      {!isLoading && !isError ? (
        <ReminderList
          items={data}
          onReply={handleReply}
          onSendManual={handleSendManual}
          replyingReminderId={isRegisteringReminderReply ? replyingReminderId : null}
          sendingReminderId={isSendingManualReminder ? sendingReminderId : null}
        />
      ) : null}
    </section>
  );
}
