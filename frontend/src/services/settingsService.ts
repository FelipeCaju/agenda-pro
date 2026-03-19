import { apiClient } from "@/services/apiClient";
import { executeServiceCall } from "@/services/serviceHelpers";

export type AppSettings = {
  id?: string;
  organizationId?: string;
  nomeNegocio: string;
  logo?: string | null;
  subtitulo?: string | null;
  corPrimaria?: string | null;
  horaInicioAgenda: string;
  horaFimAgenda: string;
  duracaoPadrao: number;
  moeda: string;
  timezone: string;
  permitirConflito: boolean;
  lembretesAtivos: boolean;
  lembreteHorasAntes: number;
  lembreteMensagem?: string | null;
  whatsappAtivo?: boolean;
  whatsappApiProvider?: string | null;
  whatsappInstanceId?: string | null;
  whatsappTempoLembreteMinutos?: number;
  createdAt?: string;
  updatedAt?: string;
};

type AppSettingsApiModel = {
  id: string;
  organization_id: string;
  nome_negocio: string;
  subtitulo?: string | null;
  logo?: string | null;
  cor_primaria?: string | null;
  hora_inicio_agenda: string;
  hora_fim_agenda: string;
  duracao_padrao: number;
  moeda: string;
  timezone: string;
  permitir_conflito: boolean;
  lembretes_ativos: boolean;
  lembrete_horas_antes: number;
  lembrete_mensagem?: string | null;
  whatsapp_ativo?: boolean;
  whatsapp_api_provider?: string | null;
  whatsapp_instance_id?: string | null;
  whatsapp_tempo_lembrete_minutos?: number;
  created_at?: string;
  updated_at?: string;
};

function mapSettings(model: AppSettingsApiModel): AppSettings {
  return {
    id: model.id,
    organizationId: model.organization_id,
    nomeNegocio: model.nome_negocio,
    subtitulo: model.subtitulo ?? null,
    logo: model.logo ?? null,
    corPrimaria: model.cor_primaria ?? "#1d8cf8",
    horaInicioAgenda: model.hora_inicio_agenda,
    horaFimAgenda: model.hora_fim_agenda,
    duracaoPadrao: Number(model.duracao_padrao ?? 30),
    moeda: model.moeda,
    timezone: model.timezone,
    permitirConflito: Boolean(model.permitir_conflito),
    lembretesAtivos: Boolean(model.lembretes_ativos),
    lembreteHorasAntes: Number(model.lembrete_horas_antes ?? 24),
    lembreteMensagem: model.lembrete_mensagem ?? null,
    whatsappAtivo: Boolean(model.whatsapp_ativo),
    whatsappApiProvider: model.whatsapp_api_provider ?? null,
    whatsappInstanceId: model.whatsapp_instance_id ?? null,
    whatsappTempoLembreteMinutos: Number(model.whatsapp_tempo_lembrete_minutos ?? 0),
    createdAt: model.created_at,
    updatedAt: model.updated_at,
  };
}

export const settingsService = {
  async get() {
    return executeServiceCall(
      async () => {
        const response = await apiClient.get<AppSettingsApiModel>("/settings");
        return mapSettings(response.data);
      },
      {
        errorMessage: "Nao foi possivel carregar as configuracoes.",
      },
    );
  },
  async update(input: Partial<AppSettings>) {
    return executeServiceCall(
      async () => {
        const response = await apiClient.patch<AppSettingsApiModel>("/settings", input);
        return mapSettings(response.data);
      },
      {
        errorMessage: "Nao foi possivel atualizar as configuracoes.",
      },
    );
  },
};
