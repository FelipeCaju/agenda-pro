import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobilePageHeader } from "@/components/layout/mobile-page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FullscreenState } from "@/components/ui/fullscreen-state";
import { useSettingsMutations } from "@/hooks/use-settings-mutations";
import { useSettingsQuery } from "@/hooks/use-settings-query";
import { buildRecurringWhatsappPreviewTemplate } from "@/utils/whatsapp";

export function RecurrenceSettingsPage() {
  const navigate = useNavigate();
  const { data: settings, error, isError, isLoading } = useSettingsQuery();
  const { updateSettings, isUpdatingSettings, updateSettingsError } = useSettingsMutations();
  const [criarRecorrencias, setCriarRecorrencias] = useState(true);
  const [recurringWhatsappAutomatico, setRecurringWhatsappAutomatico] = useState(true);
  const [recurringMarcarVencidoAutomaticamente, setRecurringMarcarVencidoAutomaticamente] =
    useState(true);
  const [recurringChavePixPadrao, setRecurringChavePixPadrao] = useState("");
  const [nomeNegocio, setNomeNegocio] = useState("AgendaPro");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!settings) {
      return;
    }

    setCriarRecorrencias(settings.criarRecorrencias !== false);
    setRecurringWhatsappAutomatico(settings.recurringWhatsappAutomatico !== false);
    setRecurringMarcarVencidoAutomaticamente(
      settings.recurringMarcarVencidoAutomaticamente !== false,
    );
    setRecurringChavePixPadrao(settings.recurringChavePixPadrao ?? "");
    setNomeNegocio(settings.nomeNegocio ?? "AgendaPro");
  }, [settings]);

  const previewMessage = useMemo(
    () => buildRecurringWhatsappPreviewTemplate(nomeNegocio, recurringChavePixPadrao),
    [nomeNegocio, recurringChavePixPadrao],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await updateSettings({
        criarRecorrencias,
        recurringWhatsappAutomatico,
        recurringMarcarVencidoAutomaticamente,
        recurringChavePixPadrao: recurringChavePixPadrao.trim() || null,
      });
      setSuccessMessage("Configuracoes de recorrencia atualizadas com sucesso.");
    } catch {
      return;
    }
  }

  if (isLoading && !settings) {
    return (
      <FullscreenState
        eyebrow="Recorrencia"
        title="Carregando configuracoes"
        description="Estamos abrindo as configuracoes do modulo de recorrencia."
      />
    );
  }

  if (isError) {
    return (
      <FullscreenState
        eyebrow="Recorrencia"
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
        subtitle="Menu, automacao e chave Pix padrao"
        title="Configurar recorrencia"
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
                  checked={criarRecorrencias}
                  className="app-checkbox"
                  onChange={(event) => setCriarRecorrencias(event.target.checked)}
                  type="checkbox"
                />
                <span>
                  <span className="block text-sm font-medium text-ink">Ativar modulo de recorrencia</span>
                  <span className="block text-sm text-slate-500">
                    Quando desligado, o menu de Recorrencia some do app para esta empresa.
                  </span>
                </span>
              </label>
            </div>

            <label className="app-toggle-panel">
              <input
                checked={recurringWhatsappAutomatico}
                className="app-checkbox"
                onChange={(event) => setRecurringWhatsappAutomatico(event.target.checked)}
                type="checkbox"
              />
              <span>
                <span className="block text-sm font-medium text-ink">Enviar WhatsApp automatico</span>
                <span className="block text-sm text-slate-500">
                  Usa a integracao atual do sistema para avisar a cobranca gerada no dia.
                </span>
              </span>
            </label>

            <label className="app-toggle-panel">
              <input
                checked={recurringMarcarVencidoAutomaticamente}
                className="app-checkbox"
                onChange={(event) =>
                  setRecurringMarcarVencidoAutomaticamente(event.target.checked)
                }
                type="checkbox"
              />
              <span>
                <span className="block text-sm font-medium text-ink">
                  Marcar vencido automaticamente
                </span>
                <span className="block text-sm text-slate-500">
                  Atualiza o status das cobrancas pendentes assim que passam da data de vencimento.
                </span>
              </span>
            </label>

            <div className="space-y-2">
              <label className="text-sm font-medium text-ink" htmlFor="recurring-pix-key">
                Chave Pix padrao
              </label>
              <input
                className="app-input"
                id="recurring-pix-key"
                onChange={(event) => setRecurringChavePixPadrao(event.target.value)}
                placeholder="pix@empresa.com"
                value={recurringChavePixPadrao}
              />
              <p className="text-sm text-slate-500">
                Essa chave entra automaticamente em novas recorrencias, mas pode ser ajustada em cada cadastro.
              </p>
            </div>
          </Card>

          <Card className="space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Previa</p>
            <div className="app-whatsapp-device">
              <div className="app-whatsapp-device-header">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-700">
                  Mensagem padrao
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  O texto da cobranca recorrente segue um padrao fixo por enquanto.
                </p>
              </div>

              <div className="app-whatsapp-device-screen">
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
          {isUpdatingSettings ? "Salvando..." : "Salvar configuracoes de recorrencia"}
        </Button>
      </form>
    </section>
  );
}
