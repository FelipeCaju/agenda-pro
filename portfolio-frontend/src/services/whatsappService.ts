import { apiClient } from "@/services/apiClient";
import { executeServiceCall } from "@/services/serviceHelpers";

export type WhatsappStatus = {
  ativo: boolean;
  provider: string | null;
  instanceId: string | null;
  ultimoTesteEm: string | null;
};

export type WhatsappMessageInput = {
  phone: string;
  message: string;
};

export type WhatsappSendResult = {
  success: boolean;
  provider: string | null;
  instanceId: string | null;
  sentAt: string | null;
};

export const whatsappService = {
  async getStatus() {
    return executeServiceCall(
      async () => {
        const response = await apiClient.get<WhatsappStatus>("/whatsapp/status");
        return response.data;
      },
      {
        errorMessage: "Nao foi possivel carregar o status do WhatsApp.",
      },
    );
  },
  async sendTestMessage(input: WhatsappMessageInput) {
    return executeServiceCall(
      async () => {
        const response = await apiClient.post<WhatsappSendResult>("/whatsapp/test-message", input);
        return response.data;
      },
      {
        errorMessage: "Nao foi possivel enviar a mensagem de teste.",
      },
    );
  },
};
