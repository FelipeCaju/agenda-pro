import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobilePageHeader } from "@/components/layout/mobile-page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FullscreenState } from "@/components/ui/fullscreen-state";
import { useAuth } from "@/hooks/use-auth";
import { useSettingsMutations } from "@/hooks/use-settings-mutations";
import { useSettingsQuery } from "@/hooks/use-settings-query";

const WHATSAPP_REMINDER_TEMPLATE =
  "Oie {{cliente_nome}}!\n\nAqui e a equipe da {{nome_organizacao}}.\n\nPassando para te lembrar do seu horario de {{servico_nome}}.\n\nData: {{data}}\nHorario: {{horario}}\n\nEstamos te aguardando por aqui.\n\nConfirmar agendamento?\nResponda com Sim ou Nao.";
const WHATSAPP_CONFIRMATION_PROMPT = "Confirmar agendamento?\nResponda com Sim ou Nao.";

function appendConfirmationPrompt(template: string) {
  const normalized = template.trim();

  if (!normalized) {
    return WHATSAPP_REMINDER_TEMPLATE;
  }

  return normalized.includes("Confirmar agendamento?") ? normalized : `${normalized}\n\n${WHATSAPP_CONFIRMATION_PROMPT}`;
}

function WhatsappBadgeIcon() {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
      <svg
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
      >
        <path d="M8.5 18.2 4 20l1.8-4.2A7.5 7.5 0 1 1 19.5 12a7.4 7.4 0 0 1-11 6.2Z" />
        <path d="M9.5 9.3c0 2.8 2.4 5.2 5.2 5.2" />
      </svg>
    </div>
  );
}

function ShieldNoteIcon() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-emerald-600">
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
      >
        <path d="M12 3.5 18.5 6v5.6c0 4.2-2.7 7.4-6.5 8.9-3.8-1.5-6.5-4.7-6.5-8.9V6L12 3.5Z" />
        <path d="m9.5 12 1.7 1.7 3.6-3.8" />
      </svg>
    </div>
  );
}

function buildPreviewMessage(template: string, organizationName: string) {
  return appendConfirmationPrompt(template.trim() || WHATSAPP_REMINDER_TEMPLATE)
    .replace(/\{\{cliente_nome\}\}/g, "Cliente")
    .replace(/\{\{nome_organizacao\}\}/g, organizationName || "AgendaPro")
    .replace(/\{\{servico_nome\}\}/g, "Atendimento")
    .replace(/\{\{data\}\}/g, "10/04/2026")
    .replace(/\{\{horario\}\}/g, "14:30");
}

function normalizeReminderTemplate(template?: string | null) {
  const normalized = template?.trim() ?? "";

  if (
    !normalized ||
    !normalized.includes("{{cliente_nome}}") ||
    !normalized.includes("{{servico_nome}}") ||
    !normalized.includes("{{data}}") ||
    !normalized.includes("{{horario}}")
  ) {
    return WHATSAPP_REMINDER_TEMPLATE;
  }

  return normalized;
}

export function WhatsappSettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    data: settings,
    error,
    isError,
    isLoading,
  } = useSettingsQuery();
  const { updateSettings, isUpdatingSettings, updateSettingsError } = useSettingsMutations();
  const [lembretesAtivos, setLembretesAtivos] = useState(true);
  const [whatsappAtivo, setWhatsappAtivo] = useState(false);
  const [whatsappTempoLembreteMinutos, setWhatsappTempoLembreteMinutos] = useState("60");
  const [nomeNegocio, setNomeNegocio] = useState("AgendaPro");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!settings) {
      return;
    }

    setLembretesAtivos(Boolean(settings.lembretesAtivos));
    setWhatsappAtivo(Boolean(settings.whatsappAtivo));
    setWhatsappTempoLembreteMinutos(String(settings.whatsappTempoLembreteMinutos ?? 60));
    setNomeNegocio(settings.nomeNegocio ?? "AgendaPro");
  }, [settings]);

  const whatsappEnabled = lembretesAtivos && whatsappAtivo;
  const subtitleHelper = useMemo(
    () =>
      whatsappEnabled
        ? "O sistema envia a mensagem automaticamente no WhatsApp antes do atendimento."
        : "As mensagens automaticas do WhatsApp ficam pausadas para esta empresa.",
    [whatsappEnabled],
  );
  const whatsappPreviewMessage = useMemo(
    () => buildPreviewMessage(normalizeReminderTemplate(settings?.lembreteMensagem), nomeNegocio.trim()),
    [nomeNegocio, settings?.lembreteMensagem],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);

    const normalizedWhatsappMinutes = Number(whatsappTempoLembreteMinutos);

    if (!Number.isFinite(normalizedWhatsappMinutes) || normalizedWhatsappMinutes < 0) {
      setValidationError("Tempo do lembrete no WhatsApp invalido.");
      return;
    }

    try {
      await updateSettings({
        lembretesAtivos,
        lembreteHorasAntes: Math.ceil(normalizedWhatsappMinutes / 60),
        whatsappAtivo,
        whatsappTempoLembreteMinutos: normalizedWhatsappMinutes,
      });
      setSuccessMessage("Configuracoes de WhatsApp atualizadas com sucesso.");
    } catch {
      return;
    }
  }

  if (isLoading && !settings) {
    return (
      <FullscreenState
        eyebrow="WhatsApp"
        title="Carregando configuracoes"
        description="Estamos abrindo os dados do WhatsApp sem travar o restante do app."
      />
    );
  }

  if (isError) {
    return (
      <FullscreenState
        eyebrow="WhatsApp"
        title="Nao foi possivel abrir a tela"
        description={error?.message ?? "Erro inesperado."}
        action={
          <Button onClick={() => navigate("/configuracoes")} type="button">
            Voltar para configuracoes
          </Button>
        }
      />
    );
  }

  return (
    <section className="space-y-4 pb-8">
      <MobilePageHeader
        action={
          <Button onClick={() => navigate("/configuracoes")} type="button" variant="secondary">
            Voltar
          </Button>
        }
        subtitle="Lembretes automaticos e previa da mensagem"
        title="Configurar WhatsApp"
      />

      {successMessage ? (
        <Card className="app-message-success">
          <p className="text-sm font-medium text-emerald-700">{successMessage}</p>
        </Card>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="app-whatsapp-panel space-y-4">
            <div className="flex items-start gap-3">
              <WhatsappBadgeIcon />
              <div className="min-w-0">
                <h3 className="text-xl font-semibold tracking-[-0.03em] text-ink">
                  Lembretes por WhatsApp
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Envio automatico antes do atendimento, sem uso de email.
                </p>
              </div>
            </div>

            <div className="app-whatsapp-note">
              <div className="flex items-start gap-3">
                <ShieldNoteIcon />
                <p className="text-sm font-medium leading-6 text-emerald-700">
                  Integracao gerenciada automaticamente pelo sistema. Nenhuma configuracao tecnica
                  necessaria.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[22px] bg-slate-50 px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-ink">Ativar lembretes</p>
                    <p className="mt-1 text-sm text-slate-500">{subtitleHelper}</p>
                  </div>
                  <button
                    aria-pressed={whatsappEnabled}
                    className="app-switch"
                    data-state={whatsappEnabled ? "checked" : "unchecked"}
                    onClick={() => {
                      const nextValue = !whatsappEnabled;
                      setLembretesAtivos(nextValue);
                      setWhatsappAtivo(nextValue);
                    }}
                    type="button"
                  >
                    <span className="app-switch-thumb" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 rounded-[22px] bg-slate-50 px-4 py-4">
                <label className="text-sm font-medium text-ink" htmlFor="whatsapp-delay">
                  Antecedencia do lembrete
                </label>
                <input
                  className="app-input"
                  id="whatsapp-delay"
                  min="0"
                  onChange={(event) => setWhatsappTempoLembreteMinutos(event.target.value)}
                  type="number"
                  value={whatsappTempoLembreteMinutos}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-ink" htmlFor="business-owner">
                  Usuario logado
                </label>
                <input
                  className="app-input bg-slate-50 text-slate-500"
                  disabled
                  id="business-owner"
                  value={user?.email ?? ""}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-ink" htmlFor="whatsapp-organization">
                  Nome do negocio
                </label>
                <input
                  className="app-input bg-slate-50 text-slate-500"
                  disabled
                  id="whatsapp-organization"
                  value={nomeNegocio}
                />
              </div>
            </div>
          </Card>

          <Card className="space-y-3">
            <div className="app-whatsapp-device">
              <div className="app-whatsapp-device-header">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-700">
                  Previa da mensagem
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Exemplo visual do lembrete que sera enviado automaticamente.
                </p>
              </div>

              <div className="app-whatsapp-device-screen">
                <div className="app-whatsapp-message-card">
                  <p className="text-base font-semibold text-emerald-900">
                    Mensagem enviada ao cliente
                  </p>
                  <div className="mt-3 space-y-2">
                    <div className="app-whatsapp-message-line">
                      <span className="app-whatsapp-message-dot" />
                      <span>Envio automatico no horario configurado.</span>
                    </div>
                    <div className="app-whatsapp-message-line">
                      <span className="app-whatsapp-message-dot" />
                      <span>Somente WhatsApp. Nenhum lembrete por email sera enviado.</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-start">
                  <div className="app-whatsapp-bubble">
                    <p className="whitespace-pre-line">{whatsappPreviewMessage}</p>
                    <p className="mt-2 text-right text-[11px] font-medium text-emerald-800/70">
                      13:40
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {validationError || updateSettingsError ? (
          <p className="text-sm text-rose-600">{validationError ?? updateSettingsError?.message}</p>
        ) : null}

        <Button className="w-full sm:w-auto" disabled={isUpdatingSettings} type="submit">
          {isUpdatingSettings ? "Salvando..." : "Salvar configuracoes de WhatsApp"}
        </Button>
      </form>
    </section>
  );
}
