import {
  getAppSettingsByOrganization,
  updateAppSettingsByOrganization,
} from "../lib/data.js";

const DEFAULT_WHATSAPP_REMINDER_TEMPLATE =
  "Oie {{cliente_nome}}! \u{1F44B}\n\nAqui e a equipe da {{nome_organizacao}}.\n\nPassando para te lembrar do seu horario de {{servico_nome}}.\n\n\u{1F4C5} Data: {{data}}\n\u23F0 Horario: {{horario}}\n\nEstamos te aguardando por aqui. \u{1F49A}";

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidTime(value) {
  if (!/^\d{2}:\d{2}$/.test(value)) {
    return false;
  }

  const [hours, minutes] = value.split(":").map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

function toMinutes(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function normalizeBoolean(value) {
  return Boolean(value);
}

function normalizeInteger(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : Number.NaN;
}

function normalizeReminderTemplate(value) {
  const normalized = typeof value === "string" ? value.trim() : "";

  if (!normalized) {
    return DEFAULT_WHATSAPP_REMINDER_TEMPLATE;
  }

  const hasRequiredVariables =
    normalized.includes("{{cliente_nome}}") &&
    normalized.includes("{{servico_nome}}") &&
    normalized.includes("{{data}}") &&
    normalized.includes("{{horario}}");

  return hasRequiredVariables ? normalized : DEFAULT_WHATSAPP_REMINDER_TEMPLATE;
}

function buildSettingsPayload(settings) {
  return {
    id: settings.id,
    organization_id: settings.organization_id,
    nome_negocio: settings.nome_negocio,
    subtitulo: settings.subtitulo,
    logo: settings.logo,
    cor_primaria: settings.cor_primaria,
    hora_inicio_agenda: settings.hora_inicio_agenda,
    hora_fim_agenda: settings.hora_fim_agenda,
    duracao_padrao: settings.duracao_padrao,
    moeda: settings.moeda,
    timezone: settings.timezone,
    permitir_conflito: Boolean(settings.permitir_conflito),
    lembretes_ativos: Boolean(settings.lembretes_ativos),
    lembrete_horas_antes: settings.lembrete_horas_antes,
    lembrete_mensagem: normalizeReminderTemplate(settings.lembrete_mensagem),
    whatsapp_ativo: Boolean(settings.whatsapp_ativo),
    whatsapp_api_provider: settings.whatsapp_api_provider,
    whatsapp_instance_id: settings.whatsapp_instance_id,
    whatsapp_tempo_lembrete_minutos: settings.whatsapp_tempo_lembrete_minutos,
    created_at: settings.created_at,
    updated_at: settings.updated_at,
  };
}

export async function getSettings({ organizationId }) {
  const settings = await getAppSettingsByOrganization(organizationId);

  if (!settings) {
    const error = new Error("Configuracoes da empresa nao encontradas.");
    error.statusCode = 404;
    throw error;
  }

  return buildSettingsPayload(settings);
}

export async function updateSettings({ organizationId, input }) {
  const nomeNegocio = input.nome_negocio ?? input.nomeNegocio;
  const horaInicioAgenda = input.hora_inicio_agenda ?? input.horaInicioAgenda;
  const horaFimAgenda = input.hora_fim_agenda ?? input.horaFimAgenda;
  const duracaoPadrao = input.duracao_padrao ?? input.duracaoPadrao;
  const moeda = input.moeda;
  const timezone = input.timezone;
  const lembreteHorasAntes = input.lembrete_horas_antes ?? input.lembreteHorasAntes;

  if (nomeNegocio !== undefined && !normalizeString(nomeNegocio)) {
    const error = new Error("Nome do negocio e obrigatorio.");
    error.statusCode = 400;
    throw error;
  }

  if (horaInicioAgenda !== undefined && !isValidTime(horaInicioAgenda)) {
    const error = new Error("Hora inicial da agenda invalida.");
    error.statusCode = 400;
    throw error;
  }

  if (horaFimAgenda !== undefined && !isValidTime(horaFimAgenda)) {
    const error = new Error("Hora final da agenda invalida.");
    error.statusCode = 400;
    throw error;
  }

  if (
    horaInicioAgenda !== undefined &&
    horaFimAgenda !== undefined &&
    toMinutes(horaFimAgenda) <= toMinutes(horaInicioAgenda)
  ) {
    const error = new Error("Hora final deve ser maior que a hora inicial.");
    error.statusCode = 400;
    throw error;
  }

  if (duracaoPadrao !== undefined) {
    const normalizedDuration = normalizeInteger(duracaoPadrao);

    if (!Number.isFinite(normalizedDuration) || normalizedDuration <= 0) {
      const error = new Error("Duracao padrao deve ser um numero valido maior que zero.");
      error.statusCode = 400;
      throw error;
    }
  }

  if (moeda !== undefined && !/^[A-Z]{3}$/.test(normalizeString(moeda).toUpperCase())) {
    const error = new Error("Moeda invalida.");
    error.statusCode = 400;
    throw error;
  }

  if (timezone !== undefined && !normalizeString(timezone)) {
    const error = new Error("Timezone invalido.");
    error.statusCode = 400;
    throw error;
  }

  if (lembreteHorasAntes !== undefined) {
    const normalizedHours = normalizeInteger(lembreteHorasAntes);

    if (!Number.isFinite(normalizedHours) || normalizedHours < 0 || normalizedHours > 168) {
      const error = new Error("Horas de antecedencia do lembrete invalidas.");
      error.statusCode = 400;
      throw error;
    }
  }

  const updated = await updateAppSettingsByOrganization(organizationId, {
    nome_negocio: nomeNegocio !== undefined ? normalizeString(nomeNegocio) : undefined,
    subtitulo: input.subtitulo !== undefined ? normalizeString(input.subtitulo) : undefined,
    logo: input.logo,
    cor_primaria: input.cor_primaria ?? input.corPrimaria,
    hora_inicio_agenda:
      horaInicioAgenda !== undefined ? normalizeString(horaInicioAgenda) : undefined,
    hora_fim_agenda: horaFimAgenda !== undefined ? normalizeString(horaFimAgenda) : undefined,
    duracao_padrao:
      duracaoPadrao !== undefined ? normalizeInteger(duracaoPadrao) : undefined,
    moeda: moeda !== undefined ? normalizeString(moeda).toUpperCase() : undefined,
    timezone: timezone !== undefined ? normalizeString(timezone) : undefined,
    permitir_conflito:
      input.permitir_conflito !== undefined || input.permitirConflito !== undefined
        ? normalizeBoolean(input.permitir_conflito ?? input.permitirConflito)
        : undefined,
    lembretes_ativos:
      input.lembretes_ativos !== undefined || input.lembretesAtivos !== undefined
        ? normalizeBoolean(input.lembretes_ativos ?? input.lembretesAtivos)
        : undefined,
    lembrete_horas_antes:
      lembreteHorasAntes !== undefined ? normalizeInteger(lembreteHorasAntes) : undefined,
    lembrete_mensagem:
      input.lembrete_mensagem !== undefined || input.lembreteMensagem !== undefined
        ? normalizeReminderTemplate(input.lembrete_mensagem ?? input.lembreteMensagem)
        : undefined,
    whatsapp_ativo:
      input.whatsapp_ativo !== undefined || input.whatsappAtivo !== undefined
        ? normalizeBoolean(input.whatsapp_ativo ?? input.whatsappAtivo)
        : undefined,
    whatsapp_api_provider:
      input.whatsapp_api_provider !== undefined || input.whatsappApiProvider !== undefined
        ? normalizeString(input.whatsapp_api_provider ?? input.whatsappApiProvider)
        : undefined,
    whatsapp_api_url:
      input.whatsapp_api_url !== undefined || input.whatsappApiUrl !== undefined
        ? normalizeString(input.whatsapp_api_url ?? input.whatsappApiUrl)
        : undefined,
    whatsapp_api_token:
      input.whatsapp_api_token !== undefined || input.whatsappApiToken !== undefined
        ? normalizeString(input.whatsapp_api_token ?? input.whatsappApiToken)
        : undefined,
    whatsapp_instance_id:
      input.whatsapp_instance_id !== undefined || input.whatsappInstanceId !== undefined
        ? normalizeString(input.whatsapp_instance_id ?? input.whatsappInstanceId)
        : undefined,
    whatsapp_tempo_lembrete_minutos:
      input.whatsapp_tempo_lembrete_minutos !== undefined ||
      input.whatsappTempoLembreteMinutos !== undefined
        ? normalizeInteger(
            input.whatsapp_tempo_lembrete_minutos ?? input.whatsappTempoLembreteMinutos,
          )
        : undefined,
  });

  if (!updated) {
    const error = new Error("Configuracoes da empresa nao encontradas.");
    error.statusCode = 404;
    throw error;
  }

  return buildSettingsPayload(updated);
}
