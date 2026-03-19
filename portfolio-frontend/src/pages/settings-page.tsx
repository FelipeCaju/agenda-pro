import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MobilePageHeader } from "@/components/layout/mobile-page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FullscreenState } from "@/components/ui/fullscreen-state";
import { useAuth } from "@/hooks/use-auth";
import { useOrganizationMutations } from "@/hooks/use-organization-mutations";
import {
  useOrganizationPaymentsQuery,
  useOrganizationQuery,
} from "@/hooks/use-organization-query";
import { useSettingsMutations } from "@/hooks/use-settings-mutations";
import { useSettingsQuery } from "@/hooks/use-settings-query";
import { formatDateBR, formatMonthYearBR } from "@/utils/date";

const currencyOptions = ["BRL", "USD", "EUR"];
const timezoneOptions = [
  "America/Sao_Paulo",
  "America/Fortaleza",
  "America/Manaus",
  "America/Recife",
];

const WHATSAPP_REMINDER_TEMPLATE =
  "Oie {{cliente_nome}}! \u{1F44B}\n\nAqui e a equipe da {{nome_organizacao}}.\n\nPassando para te lembrar do seu horario de {{servico_nome}}.\n\n\u{1F4C5} Data: {{data}}\n\u23F0 Horario: {{horario}}\n\nEstamos te aguardando por aqui. \u{1F49A}";

type SettingsLocationState = {
  successMessage?: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidTime(value: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) {
    return false;
  }

  const [hours, minutes] = value.split(":").map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function buildPreviewMessage(template: string, organizationName: string) {
  return (template.trim() || WHATSAPP_REMINDER_TEMPLATE)
    .replace(/\{\{cliente_nome\}\}/g, "Cliente")
    .replace(/\{\{nome_organizacao\}\}/g, organizationName || "AgendaPro")
    .replace(/\{\{servico_nome\}\}/g, "Atendimento")
    .replace(/\{\{data\}\}/g, "")
    .replace(/\{\{horario\}\}/g, "")
    .replace(/Data:\s*$/gm, "Data")
    .replace(/Horario:\s*$/gm, "Horario");
}

function normalizeReminderTemplate(template?: string | null) {
  const normalized = template?.trim() ?? "";

  if (!normalized) {
    return WHATSAPP_REMINDER_TEMPLATE;
  }

  if (
    !normalized.includes("{{cliente_nome}}") ||
    !normalized.includes("{{servico_nome}}") ||
    !normalized.includes("{{data}}") ||
    !normalized.includes("{{horario}}")
  ) {
    return WHATSAPP_REMINDER_TEMPLATE;
  }

  return normalized;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getPaymentStatusLabel(status?: string | null) {
  if (status === "paid") return "Pago";
  if (status === "pending") return "Pendente";
  if (status === "overdue") return "Em atraso";
  if (status === "canceled") return "Cancelado";
  return "Sem status";
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

export function SettingsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { deleteAccount, signOut, user } = useAuth();
  const {
    data: organization,
    error: organizationError,
    isError: isOrganizationError,
    isLoading: isLoadingOrganization,
  } = useOrganizationQuery();
  const { data: payments = [] } = useOrganizationPaymentsQuery();
  const {
    data: settings,
    error: settingsError,
    isError: isSettingsError,
    isLoading: isLoadingSettings,
  } = useSettingsQuery();
  const {
    isUpdatingOrganization,
    updateOrganization,
    updateOrganizationError,
  } = useOrganizationMutations();
  const {
    isUpdatingSettings,
    updateSettings,
    updateSettingsError,
  } = useSettingsMutations();

  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [nomeNegocio, setNomeNegocio] = useState("");
  const [subtitulo, setSubtitulo] = useState("");
  const [horaInicioAgenda, setHoraInicioAgenda] = useState("08:00");
  const [horaFimAgenda, setHoraFimAgenda] = useState("18:00");
  const [duracaoPadrao, setDuracaoPadrao] = useState("30");
  const [moeda, setMoeda] = useState("BRL");
  const [timezone, setTimezone] = useState("America/Sao_Paulo");
  const [permitirConflito, setPermitirConflito] = useState(false);
  const [lembretesAtivos, setLembretesAtivos] = useState(true);
  const [lembreteMensagem, setLembreteMensagem] = useState("");
  const [whatsappAtivo, setWhatsappAtivo] = useState(false);
  const [whatsappTempoLembreteMinutos, setWhatsappTempoLembreteMinutos] = useState("60");
  const [companyValidationError, setCompanyValidationError] = useState<string | null>(null);
  const [appValidationError, setAppValidationError] = useState<string | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [successMessage, setSuccessMessage] = useState(
    (location.state as SettingsLocationState | null)?.successMessage ?? "",
  );

  useEffect(() => {
    if (!organization) {
      return;
    }

    setCompanyName(organization.nomeEmpresa ?? "");
    setCompanyEmail(organization.emailResponsavel ?? "");
    setCompanyPhone(organization.telefone ?? "");
  }, [
    organization?.emailResponsavel,
    organization?.id,
    organization?.nomeEmpresa,
    organization?.telefone,
  ]);

  useEffect(() => {
    if (!settings) {
      return;
    }

    setNomeNegocio(settings.nomeNegocio ?? "");
    setSubtitulo(settings.subtitulo ?? "");
    setHoraInicioAgenda(settings.horaInicioAgenda ?? "08:00");
    setHoraFimAgenda(settings.horaFimAgenda ?? "18:00");
    setDuracaoPadrao(String(settings.duracaoPadrao ?? 30));
    setMoeda(settings.moeda ?? "BRL");
    setTimezone(settings.timezone ?? "America/Sao_Paulo");
    setPermitirConflito(Boolean(settings.permitirConflito));
    setLembretesAtivos(Boolean(settings.lembretesAtivos));
    setLembreteMensagem(normalizeReminderTemplate(settings.lembreteMensagem));
    setWhatsappAtivo(Boolean(settings.whatsappAtivo));
    setWhatsappTempoLembreteMinutos(String(settings.whatsappTempoLembreteMinutos ?? 60));
  }, [
    settings?.duracaoPadrao,
    settings?.horaFimAgenda,
    settings?.horaInicioAgenda,
    settings?.id,
    settings?.lembreteMensagem,
    settings?.lembretesAtivos,
    settings?.moeda,
    settings?.nomeNegocio,
    settings?.permitirConflito,
    settings?.subtitulo,
    settings?.timezone,
    settings?.whatsappAtivo,
    settings?.whatsappTempoLembreteMinutos,
  ]);

  const isLoading = isLoadingOrganization || isLoadingSettings;
  const isInitialLoading = isLoading && !organization && !settings;
  const whatsappEnabled = lembretesAtivos && whatsappAtivo;
  const companyErrorMessage = companyValidationError ?? updateOrganizationError?.message ?? null;
  const appErrorMessage = appValidationError ?? updateSettingsError?.message ?? null;
  const subtitleHelper = useMemo(
    () =>
      whatsappEnabled
        ? "O sistema envia a mensagem automaticamente no WhatsApp antes do atendimento."
        : "As mensagens automaticas do WhatsApp ficam pausadas para esta empresa.",
    [whatsappEnabled],
  );
  const whatsappPreviewMessage = useMemo(
    () => buildPreviewMessage(lembreteMensagem, nomeNegocio.trim() || companyName.trim()),
    [companyName, lembreteMensagem, nomeNegocio],
  );

  async function handleCompanySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCompanyValidationError(null);

    const normalizedName = companyName.trim();
    const normalizedEmail = companyEmail.trim().toLowerCase();

    if (!normalizedName) {
      setCompanyValidationError("Nome da empresa e obrigatorio.");
      return;
    }

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      setCompanyValidationError("Email responsavel invalido.");
      return;
    }

    try {
      await updateOrganization({
        nomeEmpresa: normalizedName,
        emailResponsavel: normalizedEmail,
        telefone: companyPhone.trim(),
      });

      setSuccessMessage("Dados da empresa atualizados com sucesso.");
    } catch {
      return;
    }
  }

  async function handleSettingsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppValidationError(null);

    const normalizedBusinessName = nomeNegocio.trim();
    const normalizedDuration = Number(duracaoPadrao);
    const normalizedWhatsappMinutes = Number(whatsappTempoLembreteMinutos);

    if (!normalizedBusinessName) {
      setAppValidationError("Nome do negocio e obrigatorio.");
      return;
    }

    if (!isValidTime(horaInicioAgenda) || !isValidTime(horaFimAgenda)) {
      setAppValidationError("Preencha horarios validos para a agenda.");
      return;
    }

    if (toMinutes(horaFimAgenda) <= toMinutes(horaInicioAgenda)) {
      setAppValidationError("A hora final deve ser maior que a hora inicial.");
      return;
    }

    if (!Number.isFinite(normalizedDuration) || normalizedDuration <= 0) {
      setAppValidationError("Duracao padrao deve ser um numero valido maior que zero.");
      return;
    }

    if (!Number.isFinite(normalizedWhatsappMinutes) || normalizedWhatsappMinutes < 0) {
      setAppValidationError("Tempo do lembrete no WhatsApp invalido.");
      return;
    }

    try {
      await updateSettings({
        nomeNegocio: normalizedBusinessName,
        subtitulo: subtitulo.trim(),
        horaInicioAgenda,
        horaFimAgenda,
        duracaoPadrao: normalizedDuration,
        moeda,
        timezone,
        permitirConflito,
        lembretesAtivos,
        lembreteHorasAntes: Math.ceil(normalizedWhatsappMinutes / 60),
        lembreteMensagem: lembreteMensagem.trim() || WHATSAPP_REMINDER_TEMPLATE,
        whatsappAtivo,
        whatsappTempoLembreteMinutos: normalizedWhatsappMinutes,
      });

      setSuccessMessage("Configuracoes do WhatsApp atualizadas com sucesso.");
    } catch {
      return;
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate("/login", { replace: true });
  }

  async function handleDeleteAccount() {
    if (!confirmDelete) {
      return;
    }

    setIsDeletingAccount(true);

    try {
      await deleteAccount();
      navigate("/login", {
        replace: true,
        state: { successMessage: "Conta encerrada com sucesso." },
      });
    } finally {
      setIsDeletingAccount(false);
    }
  }

  if (isInitialLoading) {
    return (
      <FullscreenState
        eyebrow="Configuracoes"
        title="Carregando preferencias da empresa"
        description="Estamos recuperando os dados da sua organizacao e do sistema sem travar a aplicacao."
      />
    );
  }

  if (isOrganizationError || isSettingsError) {
    return (
      <FullscreenState
        eyebrow="Configuracoes"
        title="Nao foi possivel abrir a pagina"
        description={organizationError?.message ?? settingsError?.message ?? "Erro inesperado."}
        action={
          <Button onClick={() => navigate("/gestao")} type="button">
            Voltar para gestao
          </Button>
        }
      />
    );
  }

  return (
    <section className="space-y-4">
      <MobilePageHeader
        action={
          <Button
            className="min-h-8 rounded-xl px-3 py-2 text-xs md:min-h-[46px] md:rounded-[18px] md:px-4 md:py-3 md:text-sm"
            onClick={() => navigate("/gestao")}
            type="button"
            variant="secondary"
          >
            Gestao
          </Button>
        }
        subtitle="Empresa, agenda e conta"
        title="Configuracoes"
      />

      {successMessage ? (
        <Card className="app-message-success">
          <p className="text-sm font-medium text-emerald-700">{successMessage}</p>
        </Card>
      ) : null}

      <Card>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Empresa</p>
        <h3 className="mt-1 text-lg font-semibold text-ink">Dados da organizacao</h3>
        <form className="mt-4 space-y-4" onSubmit={handleCompanySubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink" htmlFor="company-name">
              Nome da empresa
            </label>
            <input
              className="app-input"
              id="company-name"
              onChange={(event) => setCompanyName(event.target.value)}
              value={companyName}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-ink" htmlFor="company-email">
              Email responsavel
            </label>
            <input
              className="app-input"
              id="company-email"
              onChange={(event) => setCompanyEmail(event.target.value)}
              type="email"
              value={companyEmail}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-ink" htmlFor="company-phone">
              Telefone
            </label>
            <input
              className="app-input"
              id="company-phone"
              onChange={(event) => setCompanyPhone(event.target.value)}
              placeholder="Opcional"
              value={companyPhone}
            />
          </div>

          {companyErrorMessage ? <p className="text-sm text-rose-600">{companyErrorMessage}</p> : null}

          <Button className="w-full sm:w-auto" disabled={isUpdatingOrganization} type="submit">
            {isUpdatingOrganization ? "Salvando empresa..." : "Salvar dados da empresa"}
          </Button>
          <Button
            className="w-full sm:w-auto"
            onClick={() => navigate("/funcionarios")}
            type="button"
            variant="secondary"
          >
            Abrir funcionarios da empresa
          </Button>
          <Button
            className="w-full sm:w-auto"
            onClick={() => navigate("/bloqueios")}
            type="button"
            variant="secondary"
          >
            Gerenciar bloqueios de horario
          </Button>
        </form>
      </Card>

      <Card>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">App</p>
        <h3 className="mt-1 text-lg font-semibold text-ink">Agenda e WhatsApp</h3>
        <form className="mt-4 space-y-4" onSubmit={handleSettingsSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink" htmlFor="business-name">
              Nome do negocio
            </label>
            <input
              className="app-input"
              id="business-name"
              onChange={(event) => setNomeNegocio(event.target.value)}
              value={nomeNegocio}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-ink" htmlFor="business-subtitle">
              Subtitulo
            </label>
            <input
              className="app-input"
              id="business-subtitle"
              onChange={(event) => setSubtitulo(event.target.value)}
              placeholder="Opcional"
              value={subtitulo}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink" htmlFor="agenda-start">
                Hora inicial
              </label>
              <input
                className="app-input"
                id="agenda-start"
                onChange={(event) => setHoraInicioAgenda(event.target.value)}
                type="time"
                value={horaInicioAgenda}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-ink" htmlFor="agenda-end">
                Hora final
              </label>
              <input
                className="app-input"
                id="agenda-end"
                onChange={(event) => setHoraFimAgenda(event.target.value)}
                type="time"
                value={horaFimAgenda}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink" htmlFor="default-duration">
                Duracao padrao
              </label>
              <input
                className="app-input"
                id="default-duration"
                min="5"
                onChange={(event) => setDuracaoPadrao(event.target.value)}
                step="5"
                type="number"
                value={duracaoPadrao}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-ink" htmlFor="currency">
                Moeda
              </label>
              <select
                className="app-input"
                id="currency"
                onChange={(event) => setMoeda(event.target.value)}
                value={moeda}
              >
                {currencyOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-ink" htmlFor="timezone">
              Fuso horario
            </label>
            <select
              className="app-input"
              id="timezone"
              onChange={(event) => setTimezone(event.target.value)}
              value={timezone}
            >
              {timezoneOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <label className="app-toggle-panel">
            <input
              checked={permitirConflito}
              className="app-checkbox"
              onChange={(event) => setPermitirConflito(event.target.checked)}
              type="checkbox"
            />
            <span>
              <span className="block text-sm font-medium text-ink">Permitir conflitos de horario</span>
              <span className="block text-sm text-slate-500">
                Desative para bloquear agendamentos sobrepostos.
              </span>
            </span>
          </label>

          <div className="app-whatsapp-panel space-y-4">
            <div className="flex items-start gap-3">
              <WhatsappBadgeIcon />
              <div className="min-w-0">
                <h4 className="text-xl font-semibold tracking-[-0.03em] text-ink">
                  Lembretes por WhatsApp
                </h4>
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
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink" htmlFor="whatsapp-delay">
                Antecedencia do lembrete
              </label>
              <input
                className="app-select"
                id="whatsapp-delay"
                min="0"
                onChange={(event) => setWhatsappTempoLembreteMinutos(event.target.value)}
                type="number"
                value={whatsappTempoLembreteMinutos}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-ink" htmlFor="business-owner">
                Usuario logado
              </label>
              <input
                className="w-full rounded-[22px] border border-slate-200/80 bg-slate-50/90 px-4 py-3 text-sm text-slate-500"
                disabled
                id="business-owner"
                value={user?.email ?? ""}
              />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-ink">Previa no WhatsApp</p>
            <div className="app-whatsapp-device">
              <div className="app-whatsapp-device-header">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-700">
                  Mensagem automatica
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
          </div>

          {appErrorMessage ? <p className="text-sm text-rose-600">{appErrorMessage}</p> : null}

          <Button className="w-full sm:w-auto" disabled={isUpdatingSettings} type="submit">
            {isUpdatingSettings ? "Salvando configuracoes..." : "Salvar configuracoes do app"}
          </Button>
        </form>
      </Card>

      <Card>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Cobranca</p>
        <h3 className="mt-1 text-lg font-semibold text-ink">Historico da organizacao</h3>

        <div className="mt-4 space-y-3">
          {payments.length ? (
            payments.map((payment) => (
              <div
                className="flex items-start justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-3"
                key={payment.id}
              >
                <div className="min-w-0">
                  <p className="font-medium text-ink">{formatMonthYearBR(payment.referenceMonth)}</p>
                  <p className="text-sm text-slate-500">Vencimento {formatDateBR(payment.dueDate)}</p>
                  {payment.paidAt ? (
                    <p className="text-sm text-slate-500">
                      Pago em {formatDateBR(payment.paidAt)}
                    </p>
                  ) : null}
                </div>
                <div className="text-right">
                  <p className="font-semibold text-ink">{formatCurrency(payment.amount)}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
                    {getPaymentStatusLabel(payment.status)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">Nenhum pagamento registrado para esta organizacao.</p>
          )}
        </div>
      </Card>

      <Card>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Conta</p>
        <h3 className="mt-1 text-lg font-semibold text-ink">Sessao e seguranca</h3>

        <div className="mt-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button className="w-full sm:w-auto" onClick={() => void handleSignOut()} type="button">
              Sair da conta
            </Button>
          </div>

          <div className="rounded-3xl border border-rose-100 bg-rose-50/70 p-4">
            <p className="text-sm font-semibold text-rose-700">Excluir conta</p>
            <p className="mt-2 text-sm text-rose-600">
              Isso encerra o acesso do usuario atual ao sistema. Os dados da empresa nao sao apagados nesta etapa.
            </p>

            <label className="mt-4 flex items-start gap-3">
              <input
                checked={confirmDelete}
                className="app-checkbox app-checkbox-danger"
                onChange={(event) => setConfirmDelete(event.target.checked)}
                type="checkbox"
              />
              <span className="text-sm text-rose-700">
                Entendo que meu acesso sera encerrado e sera necessario novo convite ou novo login para voltar.
              </span>
            </label>

            <Button
              className="mt-4 w-full bg-rose-600 hover:bg-rose-700 sm:w-auto"
              disabled={!confirmDelete || isDeletingAccount}
              onClick={() => void handleDeleteAccount()}
              type="button"
            >
              {isDeletingAccount ? "Excluindo conta..." : "Excluir minha conta"}
            </Button>
          </div>
        </div>
      </Card>
    </section>
  );
}
