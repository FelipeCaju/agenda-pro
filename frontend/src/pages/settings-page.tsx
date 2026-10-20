import { FormEvent, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MobilePageHeader } from "@/components/layout/mobile-page-header";
import { ManagementPage } from "@/pages/management-page";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FullscreenState } from "@/components/ui/fullscreen-state";
import { PasswordField } from "@/components/ui/password-field";
import { useAuth } from "@/hooks/use-auth";
import { useNotificationPreferences } from "@/hooks/use-notification-preferences";
import { useOrganizationMutations } from "@/hooks/use-organization-mutations";
import { useOrganizationQuery } from "@/hooks/use-organization-query";
import { useSettingsMutations } from "@/hooks/use-settings-mutations";
import { useSettingsQuery } from "@/hooks/use-settings-query";
import { isValidCep, lookupCep, normalizeCep } from "@/services/cepService";
import { authService } from "@/services/authService";
import { buildNavigationState } from "@/utils/navigation";

type SettingsLocationState = {
  successMessage?: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeDocument(value: string) {
  return value.replace(/\D+/g, "").trim();
}

function isValidCpfCnpj(value: string) {
  const digits = normalizeDocument(value);
  return !digits || digits.length === 11 || digits.length === 14;
}

function isValidCityIbge(value: string) {
  const digits = normalizeDocument(value);
  return !digits || digits.length === 7;
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

type SettingsPageProps = {
  section?: "company";
};

export function SettingsPage({ section }: SettingsPageProps) {
  const isCompanyPage = section === "company";
  const navigate = useNavigate();
  const location = useLocation();
  const { deleteAccount, signOut } = useAuth();
  const {
    data: organization,
    error: organizationError,
    isError: isOrganizationError,
    isLoading: isLoadingOrganization,
  } = useOrganizationQuery();
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
  const [companyDocument, setCompanyDocument] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingAddressNumber, setBillingAddressNumber] = useState("");
  const [billingAddressComplement, setBillingAddressComplement] = useState("");
  const [billingPostalCode, setBillingPostalCode] = useState("");
  const [billingProvince, setBillingProvince] = useState("");
  const [billingCityIbge, setBillingCityIbge] = useState("");
  const [billingCityLabel, setBillingCityLabel] = useState("");
  const [nomeNegocio, setNomeNegocio] = useState("");
  const [subtitulo, setSubtitulo] = useState("");
  const [horaInicioAgenda, setHoraInicioAgenda] = useState("08:00");
  const [horaFimAgenda, setHoraFimAgenda] = useState("18:00");
  const [permitirConflito, setPermitirConflito] = useState(false);
  const { preferences: notificationPreferences, savePreferences } = useNotificationPreferences();
  const [appNotificationsEnabled, setAppNotificationsEnabled] = useState(notificationPreferences.enabled);
  const [appNotificationSoundEnabled, setAppNotificationSoundEnabled] = useState(
    notificationPreferences.soundEnabled,
  );
  const [companyValidationError, setCompanyValidationError] = useState<string | null>(null);
  const [appValidationError, setAppValidationError] = useState<string | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState(
    (location.state as SettingsLocationState | null)?.successMessage ?? "",
  );
  const [isLookingUpCep, setIsLookingUpCep] = useState(false);

  useEffect(() => {
    if (!organization) {
      return;
    }

    setCompanyName(organization.nomeEmpresa ?? "");
    setCompanyEmail(organization.emailResponsavel ?? "");
    setCompanyPhone(organization.telefone ?? "");
    setCompanyDocument(organization.cpfCnpj ?? "");
    setBillingAddress(organization.billingAddress ?? "");
    setBillingAddressNumber(organization.billingAddressNumber ?? "");
    setBillingAddressComplement(organization.billingAddressComplement ?? "");
    setBillingPostalCode(organization.billingPostalCode ?? "");
    setBillingProvince(organization.billingProvince ?? "");
    setBillingCityIbge(organization.billingCityIbge ?? "");
    setBillingCityLabel("");
  }, [
    organization?.billingAddress,
    organization?.billingAddressComplement,
    organization?.billingAddressNumber,
    organization?.billingCityIbge,
    organization?.billingPostalCode,
    organization?.billingProvince,
    organization?.cpfCnpj,
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
    setPermitirConflito(Boolean(settings.permitirConflito));
  }, [
    settings?.horaFimAgenda,
    settings?.horaInicioAgenda,
    settings?.id,
    settings?.nomeNegocio,
    settings?.permitirConflito,
    settings?.subtitulo,
  ]);

  useEffect(() => {
    setAppNotificationsEnabled(notificationPreferences.enabled);
    setAppNotificationSoundEnabled(notificationPreferences.soundEnabled);
  }, [notificationPreferences]);

  const isLoading = isLoadingOrganization || isLoadingSettings;
  const isInitialLoading = isLoading && !organization && !settings;
  const companyErrorMessage = companyValidationError ?? updateOrganizationError?.message ?? null;
  const appErrorMessage = appValidationError ?? updateSettingsError?.message ?? null;

  async function handleBillingCepBlur() {
    if (!billingPostalCode.trim() || !isValidCep(billingPostalCode)) {
      return;
    }

    setIsLookingUpCep(true);
    setCompanyValidationError(null);

    try {
      const result = await lookupCep(billingPostalCode);

      setBillingPostalCode(normalizeCep(result.cep));
      setBillingAddress((current) => current.trim() || result.address);
      setBillingProvince((current) => current.trim() || result.neighborhood);
      setBillingCityIbge(result.ibge);
      setBillingCityLabel(result.city && result.state ? `${result.city} - ${result.state}` : result.city);
    } catch (lookupError) {
      setCompanyValidationError(
        lookupError instanceof Error ? lookupError.message : "Nao foi possivel consultar o CEP.",
      );
    } finally {
      setIsLookingUpCep(false);
    }
  }

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

    if (!isValidCpfCnpj(companyDocument)) {
      setCompanyValidationError("CPF/CNPJ invalido. Use 11 ou 14 digitos.");
      return;
    }

    if (!billingPostalCode.trim() || !isValidCep(billingPostalCode)) {
      setCompanyValidationError("CEP invalido. Use 8 digitos.");
      return;
    }

    if (!isValidCityIbge(billingCityIbge)) {
      setCompanyValidationError("Nao foi possivel identificar a cidade automaticamente pelo CEP.");
      return;
    }

    try {
      await updateOrganization({
        nomeEmpresa: normalizedName,
        emailResponsavel: normalizedEmail,
        telefone: companyPhone.trim(),
        cpfCnpj: normalizeDocument(companyDocument) || null,
        billingAddress: billingAddress.trim() || null,
        billingAddressNumber: billingAddressNumber.trim() || null,
        billingAddressComplement: billingAddressComplement.trim() || null,
        billingPostalCode: normalizeDocument(billingPostalCode) || null,
        billingProvince: billingProvince.trim() || null,
        billingCityIbge: normalizeDocument(billingCityIbge) || null,
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

    try {
      await updateSettings({
        nomeNegocio: normalizedBusinessName,
        subtitulo: subtitulo.trim(),
        horaInicioAgenda,
        horaFimAgenda,
        permitirConflito,
      });

      setSuccessMessage("Configuracoes principais atualizadas com sucesso.");
    } catch {
      return;
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Preencha todos os campos de senha.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("A confirmacao da nova senha nao confere.");
      return;
    }
    setIsChangingPassword(true);
    try {
      await authService.changePassword(currentPassword, newPassword, confirmPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess("Senha alterada com sucesso.");
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "Nao foi possivel alterar a senha.");
    } finally {
      setIsChangingPassword(false);
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

  function saveNotificationPreferences(nextEnabled: boolean, nextSoundEnabled: boolean) {
    setAppNotificationsEnabled(nextEnabled);
    setAppNotificationSoundEnabled(nextSoundEnabled);
    savePreferences({ enabled: nextEnabled, soundEnabled: nextSoundEnabled, reminderMinutes: notificationPreferences.reminderMinutes });
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
          <Button onClick={() => navigate(isCompanyPage ? "/dados-da-empresa" : "/gestao")} type="button">
            {isCompanyPage ? "Tentar novamente" : "Voltar para gestao"}
          </Button>
        }
      />
    );
  }

  return (
    <section className="space-y-4">
      <MobilePageHeader
        subtitle={isCompanyPage ? "Cadastro e dados para cobranca" : "Empresa, agenda, assinatura e conta"}
        title={isCompanyPage ? "Dados da empresa" : "Configuracoes"}
      />

      {successMessage ? (
        <Card className="app-message-success">
          <p className="text-sm font-medium text-emerald-700">{successMessage}</p>
        </Card>
      ) : null}

      {isCompanyPage ? (
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

          <div className="space-y-2">
            <label className="text-sm font-medium text-ink" htmlFor="company-document">
              CPF ou CNPJ para billing
            </label>
            <input
              className="app-input"
              id="company-document"
              onChange={(event) => setCompanyDocument(event.target.value)}
              placeholder="Somente numeros ou formatado"
              value={companyDocument}
            />
            <p className="text-sm text-slate-500">
              Esse documento e usado para criar a cobranca no gateway e liberar os testes de pagamento.
            </p>
          </div>

          <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Checkout com cartao</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Para liberar o checkout hospedado com cartao recorrente no Asaas, preencha tambem os dados de endereco do pagador.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-ink" htmlFor="billing-address">
              Endereco de billing
            </label>
            <input
              className="app-input"
              id="billing-address"
              onChange={(event) => setBillingAddress(event.target.value)}
              placeholder="Rua, avenida, etc."
              value={billingAddress}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink" htmlFor="billing-address-number">
                Numero
              </label>
              <input
                className="app-input"
                id="billing-address-number"
                onChange={(event) => setBillingAddressNumber(event.target.value)}
                value={billingAddressNumber}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink" htmlFor="billing-address-complement">
                Complemento
              </label>
              <input
                className="app-input"
                id="billing-address-complement"
                onChange={(event) => setBillingAddressComplement(event.target.value)}
                placeholder="Opcional"
                value={billingAddressComplement}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink" htmlFor="billing-postal-code">
                CEP
              </label>
              <input
                className="app-input"
                id="billing-postal-code"
                onChange={(event) => setBillingPostalCode(event.target.value)}
                onBlur={() => void handleBillingCepBlur()}
                placeholder="Somente numeros ou formatado"
                value={billingPostalCode}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink" htmlFor="billing-province">
                Bairro
              </label>
              <input
                className="app-input"
                id="billing-province"
                onChange={(event) => setBillingProvince(event.target.value)}
                value={billingProvince}
              />
            </div>
          </div>

          <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
            {isLookingUpCep
              ? "Buscando cidade automaticamente pelo CEP..."
              : billingCityLabel
                ? `Cidade identificada automaticamente: ${billingCityLabel}`
                : "A cidade e o codigo IBGE sao resolvidos automaticamente pelo CEP."}
          </div>

          {companyErrorMessage ? <p className="text-sm text-rose-600">{companyErrorMessage}</p> : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button className="w-full sm:w-auto" disabled={isUpdatingOrganization} type="submit">
              {isUpdatingOrganization ? "Salvando empresa..." : "Salvar dados da empresa"}
            </Button>
            <Button
              className="w-full sm:w-auto"
              onClick={() => navigate("/funcionarios", { state: buildNavigationState(location.pathname) })}
              type="button"
              variant="secondary"
            >
              Abrir funcionarios da empresa
            </Button>
            <Button
              className="w-full sm:w-auto"
              onClick={() => navigate("/bloqueios", { state: buildNavigationState(location.pathname) })}
              type="button"
              variant="secondary"
            >
              Gerenciar bloqueios de horario
            </Button>
          </div>
        </form>
      </Card>
      ) : null}

      {!isCompanyPage ? (
      <>
      <details className="group rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
        <summary className="cursor-pointer text-lg font-semibold text-ink">Assinatura, pagamentos e atalhos</summary>
        <div className="mt-4"><ManagementPage embedded /></div>
      </details>

      <details className="group rounded-3xl border border-slate-200 bg-white p-4 sm:p-5" open>
      <summary className="cursor-pointer text-lg font-semibold text-ink">Agenda e recursos</summary>
      <div className="mt-4">
      <Card>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">App</p>
        <h3 className="mt-1 text-lg font-semibold text-ink">Agenda principal</h3>
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

          <div className="grid gap-3 sm:grid-cols-3">
            <Button
              className="border-emerald-600 bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-100"
              onClick={() => navigate("/configuracoes/whatsapp")}
              type="button"
            >
              Configurar WhatsApp
            </Button>
            <Button
              className="border-slate-300 bg-slate-500 text-white hover:bg-slate-600 focus:ring-slate-200"
              onClick={() => navigate("/configuracoes/orcamentos")}
              type="button"
            >
              Configurar orcamentos
            </Button>
          </div>

          {appErrorMessage ? <p className="text-sm text-rose-600">{appErrorMessage}</p> : null}

          <Button className="w-full sm:w-auto" disabled={isUpdatingSettings} type="submit">
            {isUpdatingSettings ? "Salvando configuracoes..." : "Salvar configuracoes principais"}
          </Button>
        </form>
      </Card>
      </div>
      </details>

      <details className="group rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
      <summary className="cursor-pointer text-lg font-semibold text-ink">Notificacoes do aplicativo</summary>
      <div className="mt-4">
      <Card className="space-y-4">
          <label className="app-toggle-panel">
            <input
              checked={appNotificationsEnabled}
              className="app-checkbox"
              onChange={(event) => saveNotificationPreferences(event.target.checked, event.target.checked ? appNotificationSoundEnabled : false)}
              type="checkbox"
            />
            <span className="block text-sm font-medium text-ink">Ativar lembretes locais</span>
          </label>

          <label className="app-toggle-panel">
            <input
              checked={appNotificationSoundEnabled}
              className="app-checkbox"
              disabled={!appNotificationsEnabled}
              onChange={(event) => saveNotificationPreferences(appNotificationsEnabled, event.target.checked)}
              type="checkbox"
            />
            <span className="block text-sm font-medium text-ink">Tocar som no lembrete</span>
          </label>

      </Card>
      </div>
      </details>

      <details className="group rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
      <summary className="cursor-pointer text-lg font-semibold text-ink">Conta e seguranca</summary>
      <div className="mt-4">
      <Card>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Conta</p>
        <h3 className="mt-1 text-lg font-semibold text-ink">Sessao e seguranca</h3>

        <div className="mt-4 space-y-4">
          <form className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-4" onSubmit={handlePasswordSubmit}>
            <p className="text-sm font-semibold text-ink">Alterar senha</p>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-2 text-sm font-medium text-ink">
                <span>Senha atual</span>
                <PasswordField autoComplete="current-password" inputClassName="app-input pr-14" onChange={(event) => setCurrentPassword(event.target.value)} value={currentPassword} />
              </label>
              <label className="space-y-2 text-sm font-medium text-ink">
                <span>Nova senha</span>
                <PasswordField autoComplete="new-password" inputClassName="app-input pr-14" onChange={(event) => setNewPassword(event.target.value)} value={newPassword} />
              </label>
              <label className="space-y-2 text-sm font-medium text-ink">
                <span>Confirmar nova senha</span>
                <PasswordField autoComplete="new-password" inputClassName="app-input pr-14" onChange={(event) => setConfirmPassword(event.target.value)} value={confirmPassword} />
              </label>
            </div>
            {passwordError ? <p className="text-sm text-rose-600" role="alert">{passwordError}</p> : null}
            {passwordSuccess ? <p className="text-sm text-emerald-700" role="status">{passwordSuccess}</p> : null}
            <Button className="w-full sm:w-auto" disabled={isChangingPassword} type="submit">
              {isChangingPassword ? "Salvando..." : "Salvar nova senha"}
            </Button>
          </form>
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
      </div>
      </details>
      </>
      ) : null}
    </section>
  );
}
