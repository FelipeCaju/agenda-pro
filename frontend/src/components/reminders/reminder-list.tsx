import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Reminder } from "@/services/reminderService";
import { formatShortDate } from "@/utils/date";

type ReminderListProps = {
  items: Reminder[];
  onSendManual?: (reminder: Reminder) => void | Promise<void>;
  onReply?: (
    reminder: Reminder,
    replyStatus: "confirmado" | "cancelado",
  ) => void | Promise<void>;
  sendingReminderId?: string | null;
  replyingReminderId?: string | null;
};

function getStatusText(reminder: Reminder) {
  if (reminder.reminderStatus === "confirmado") return "Confirmado";
  if (reminder.reminderStatus === "cancelado") return "Cancelado";
  if (reminder.reminderStatus === "enviado") return "Enviado";
  return "Pendente";
}

export function ReminderList({
  items,
  onReply,
  onSendManual,
  replyingReminderId = null,
  sendingReminderId = null,
}: ReminderListProps) {
  if (!items.length) {
    return (
      <Card>
        <p className="text-sm text-slate-500">Nenhum lembrete para exibir nesse filtro.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((reminder) => (
        <Card key={reminder.id}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-ink">{reminder.title}</h3>
              <p className="mt-1 text-sm text-slate-500">
                {reminder.clienteNome} - {reminder.servicoNome}
              </p>
            </div>
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600">
              {getStatusText(reminder)}
            </span>
          </div>

          <div className="mt-3 space-y-1 text-sm text-slate-600">
            <p>{formatShortDate(reminder.scheduledAt)}</p>
            <p>{reminder.channel}</p>
            {reminder.clienteTelefone ? <p>Telefone: {reminder.clienteTelefone}</p> : null}
            {reminder.respostaWhatsapp ? <p>Resposta: {reminder.respostaWhatsapp}</p> : null}
          </div>

          {onSendManual || onReply ? (
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              {onSendManual ? (
                <Button
                  className="w-full sm:w-auto"
                  disabled={!reminder.canSend || sendingReminderId === reminder.id}
                  onClick={() => void onSendManual(reminder)}
                  type="button"
                >
                  {sendingReminderId === reminder.id ? "Enviando..." : "Enviar agora"}
                </Button>
              ) : null}
              {onReply ? (
                <>
                  <Button
                    className="w-full sm:w-auto"
                    disabled={replyingReminderId === reminder.id}
                    onClick={() => void onReply(reminder, "confirmado")}
                    type="button"
                    variant="secondary"
                  >
                    Confirmado
                  </Button>
                  <Button
                    className="w-full sm:w-auto"
                    disabled={replyingReminderId === reminder.id}
                    onClick={() => void onReply(reminder, "cancelado")}
                    type="button"
                    variant="secondary"
                  >
                    Cancelado
                  </Button>
                </>
              ) : null}
            </div>
          ) : null}
        </Card>
      ))}
    </div>
  );
}
