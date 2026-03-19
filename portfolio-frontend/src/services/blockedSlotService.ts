import { apiClient } from "@/services/apiClient";
import { executeServiceCall } from "@/services/serviceHelpers";

export type BlockedSlot = {
  id: string;
  organizationId: string;
  professionalId: string | null;
  data: string;
  horarioInicial: string;
  horarioFinal: string;
  motivo: string;
};

export type BlockedSlotInput = {
  professionalId?: string | null;
  data: string;
  horarioInicial: string;
  horarioFinal: string;
  motivo?: string;
};

type BlockedSlotApiModel = {
  id: string;
  organization_id: string;
  professional_id: string | null;
  data: string;
  horario_inicial: string;
  horario_final: string;
  motivo: string | null;
};

function fromApi(model: BlockedSlotApiModel): BlockedSlot {
  return {
    id: model.id,
    organizationId: model.organization_id,
    professionalId: model.professional_id ?? null,
    data: model.data,
    horarioInicial: model.horario_inicial,
    horarioFinal: model.horario_final,
    motivo: model.motivo ?? "",
  };
}

function toApi(input: BlockedSlotInput) {
  return {
    professional_id: input.professionalId ?? null,
    data: input.data,
    horario_inicial: input.horarioInicial,
    horario_final: input.horarioFinal,
    motivo: input.motivo ?? "",
  };
}

export const blockedSlotService = {
  async list(filters: { date: string; view: "day" | "week" | "month"; professionalId?: string }) {
    return executeServiceCall(
      async () => {
        const response = await apiClient.get<BlockedSlotApiModel[]>("/blocked-slots", {
          query: {
            date: filters.date,
            view: filters.view,
            professionalId: filters.professionalId,
          },
        });

        return (response.data ?? []).map(fromApi);
      },
      {
        errorMessage: "Nao foi possivel carregar os bloqueios de horario.",
      },
    );
  },
  async create(input: BlockedSlotInput) {
    return executeServiceCall(
      async () => {
        const response = await apiClient.post<BlockedSlotApiModel>("/blocked-slots", toApi(input));
        return fromApi(response.data);
      },
      {
        errorMessage: "Nao foi possivel criar o bloqueio de horario.",
      },
    );
  },
  async remove(blockedSlotId: string) {
    return executeServiceCall(
      async () => {
        await apiClient.delete(`/blocked-slots/${blockedSlotId}`);
      },
      {
        errorMessage: "Nao foi possivel remover o bloqueio de horario.",
      },
    );
  },
};
