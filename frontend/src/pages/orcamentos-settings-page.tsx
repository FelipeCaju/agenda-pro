import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobilePageHeader } from "@/components/layout/mobile-page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FullscreenState } from "@/components/ui/fullscreen-state";
import { useSettingsMutations } from "@/hooks/use-settings-mutations";
import { useSettingsQuery } from "@/hooks/use-settings-query";
import { buildQuoteWhatsappPreviewTemplate } from "@/utils/whatsapp";

export function OrcamentosSettingsPage() {
  const navigate = useNavigate();
  const {
    data: settings,
    error,
    isError,
    isLoading,
  } = useSettingsQuery();
  const { updateSettings, isUpdatingSettings, updateSettingsError } = useSettingsMutations();
  const [criarOrcamentos, setCriarOrcamentos] = useState(true);
  const [nomeNegocio, setNomeNegocio] = useState("AgendaPro");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!settings) {
      return;
    }

    setCriarOrcamentos(settings.criarOrcamentos !== false);
    setNomeNegocio(settings.nomeNegocio ?? "AgendaPro");
  }, [settings]);

  const previewMessage = useMemo(
    () => buildQuoteWhatsappPreviewTemplate(nomeNegocio.trim()),
    [nomeNegocio],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await updateSettings({ criarOrcamentos });
      setSuccessMessage("Configuracoes de orcamentos atualizadas com sucesso.");
    } catch {
      return;
    }
  }

  if (isLoading && !settings) {
    return (
      <FullscreenState
        eyebrow="Orcamentos"
        title="Carregando configuracoes"
        description="Estamos abrindo os dados de orcamentos da sua empresa."
      />
    );
  }

  if (isError) {
    return (
      <FullscreenState
        eyebrow="Orcamentos"
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
        subtitle="Visibilidade do menu e envio por WhatsApp"
        title="Configurar orcamentos"
      />

      {successMessage ? (
        <Card className="app-message-success">
          <p className="text-sm font-medium text-emerald-700">{successMessage}</p>
        </Card>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="space-y-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Regras</p>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
              <label className="app-toggle-panel border-none bg-transparent px-0 py-0 shadow-none">
                <input
                  checked={criarOrcamentos}
                  className="app-checkbox"
                  onChange={(event) => setCriarOrcamentos(event.target.checked)}
                  type="checkbox"
                />
                <span>
                  <span className="block text-sm font-medium text-ink">Criar orcamentos</span>
                  <span className="block text-sm text-slate-500">
                    Quando desligado, o menu de Orcamentos some do app para esta empresa.
                  </span>
                </span>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[22px] bg-slate-50 px-4 py-4">
                <p className="text-sm font-semibold text-ink">Menu controlado</p>
                <p className="mt-1 text-sm text-slate-500">
                  O item Orcamentos aparece somente quando esta opcao estiver ligada.
                </p>
              </div>

              <div className="rounded-[22px] bg-slate-50 px-4 py-4">
                <p className="text-sm font-semibold text-ink">Envio por WhatsApp</p>
                <p className="mt-1 text-sm text-slate-500">
                  Cada orcamento pode ser aberto no WhatsApp com texto pronto para o cliente.
                </p>
              </div>
            </div>
          </Card>

          <Card className="space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Previa</p>
            <div className="app-whatsapp-device">
              <div className="app-whatsapp-device-header">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-700">
                  Mensagem do orcamento
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Exemplo do texto basico enviado ao abrir o WhatsApp do cliente.
                </p>
              </div>

              <div className="app-whatsapp-device-screen">
                <div className="app-whatsapp-message-card">
                  <p className="text-base font-semibold text-emerald-900">Fluxo sugerido</p>
                  <div className="mt-3 space-y-2">
                    <div className="app-whatsapp-message-line">
                      <span className="app-whatsapp-message-dot" />
                      <span>Nome do cliente no topo da mensagem.</span>
                    </div>
                    <div className="app-whatsapp-message-line">
                      <span className="app-whatsapp-message-dot" />
                      <span>Itens, servicos, total e pedido de confirmacao.</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-start">
                  <div className="app-whatsapp-bubble">
                    <p className="whitespace-pre-line">{previewMessage}</p>
                    <p className="mt-2 text-right text-[11px] font-medium text-emerald-800/70">
                      15:43
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {updateSettingsError ? (
          <p className="text-sm text-rose-600">{updateSettingsError.message}</p>
        ) : null}

        <Button className="w-full sm:w-auto" disabled={isUpdatingSettings} type="submit">
          {isUpdatingSettings ? "Salvando..." : "Salvar configuracoes de orcamentos"}
        </Button>
      </form>
    </section>
  );
}
