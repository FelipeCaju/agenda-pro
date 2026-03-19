import { apiClient } from "@/services/apiClient";
import { executeServiceCall } from "@/services/serviceHelpers";

export type Reminder = {
  id: string;
  appointmentId: string;
  title: string;
  channel: "whatsapp" | "sms" | "manual";
  scheduledAt: string;
  clienteNome: string;
  clienteTelefone: string | null;
  clienteEmail: string | null;
  servicoNome: string;
  reminderStatus: "pendente" | "enviado" | "confirmado" | "cancelado";
  lembreteEnviado: boolean;
  lembreteConfirmado: boolean;
  lembreteCancelado: boolean;
  confirmacaoCliente: "pendente" | "confirmado" | "cancelado" | "sem_resposta";
  respostaWhatsapp: string | null;
  dataEnvioLembrete: string | null;
  canSend: boolean;
};

export type ReminderReplyInput = {
  replyStatus: "pendente" | "confirmado" | "cancelado" | "sem_resposta";
  responseText?: string;
};

export const reminderService = {
  async list() {
    return executeServiceCall(
      async () => {
        const response = await apiClient.get<Reminder[]>("/reminders");
        return response.data;
      },
      {
        errorMessage: "Nao foi possivel carregar os lembretes.",
      },
    );
  },
  async sendManual(appointmentId: string) {
    return executeServiceCall(
      async () => {
        const response = await apiClient.post<Reminder>("/reminders/manual-send", {
          appointmentId,
        });
        return response.data;
      },
      {
        errorMessage: "Nao foi possivel enviar o lembrete manual.",
      },
    );
  },
  async registerReply(appointmentId: string, input: ReminderReplyInput) {
    return executeServiceCall(
      async () => {
        const response = await apiClient.patch<Reminder>(`/reminders/${appointmentId}/reply`, input);
        return response.data;
      },
      {
        errorMessage: "Nao foi possivel registrar a resposta do cliente.",
      },
    );
  },
};
