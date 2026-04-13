import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Client } from "@/services/clientService";
import type { BusinessService } from "@/services/serviceService";
import type { RecurringProfileInput } from "@/services/recurrenceService";

type RecurrenceFormValues = {
  clientId: string;
  serviceId: string;
  descricao: string;
  valor: string;
  dataInicio: string;
  dataFim: string;
  diaCobranca1: string;
  diaCobranca2: string;
  diaCobranca3: string;
  diaCobranca4: string;
  chavePix: string;
  mensagemWhatsappPersonalizada: string;
  observacoes: string;
  ativo: boolean;
};

type RecurrenceFormProps = {
  clients: Client[];
  services: BusinessService[];
  initialValues?: Partial<RecurrenceFormValues>;
  isSubmitting?: boolean;
  onSubmit: (values: RecurringProfileInput) => Promise<void>;
  submitLabel: string;
  title: string;
  description: string;
  errorMessage?: string | null;
  formId?: string;
};

const EMPTY_VALUES: RecurrenceFormValues = {
  clientId: "",
  serviceId: "",
  descricao: "",
  valor: "",
  dataInicio: new Date().toISOString().slice(0, 10),
  dataFim: "",
  diaCobranca1: "",
  diaCobranca2: "",
  diaCobranca3: "",
  diaCobranca4: "",
  chavePix: "",
  mensagemWhatsappPersonalizada: "",
  observacoes: "",
  ativo: true,
};

function formatCurrencyInput(value: string) {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  const amount = Number(digits) / 100;
  return amount.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseCurrencyInput(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  const normalized = value.replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function getInitialValues(initialValues?: Partial<RecurrenceFormValues>): RecurrenceFormValues {
  return {
    ...EMPTY_VALUES,
    ...initialValues,
    valor:
      initialValues?.valor !== undefined
        ? formatCurrencyInput(String(initialValues.valor))
        : EMPTY_VALUES.valor,
  };
}

export function RecurrenceForm({
  clients,
  services,
  initialValues,
  isSubmitting = false,
  onSubmit,
  submitLabel,
  title,
  description,
  errorMessage,
  formId = "recurrence-form",
}: RecurrenceFormProps) {
  const [values, setValues] = useState<RecurrenceFormValues>(getInitialValues(initialValues));
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    setValues(getInitialValues(initialValues));
  }, [initialValues]);

  const selectedService = useMemo(
    () => services.find((service) => service.id === values.serviceId) ?? null,
    [services, values.serviceId],
  );

  useEffect(() => {
    if (!selectedService) {
      return;
    }

    setValues((current) => {
      const next = { ...current };

      if (!current.descricao.trim()) {
        next.descricao = selectedService.nome;
      }

      if (!current.valor.trim()) {
        next.valor = formatCurrencyInput(String(selectedService.valorPadrao));
      }

      return next;
    });
  }, [selectedService]);

  function updateField<K extends keyof RecurrenceFormValues>(field: K, value: RecurrenceFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const valor = parseCurrencyInput(values.valor);
    const dias = [
      values.diaCobranca1,
      values.diaCobranca2,
      values.diaCobranca3,
      values.diaCobranca4,
    ]
      .map((value) => (value ? Number(value) : null))
      .filter((value) => value !== null);

    if (!values.clientId) {
      setFieldError("Selecione um cliente.");
      return;
    }

    if (!values.serviceId) {
      setFieldError("Selecione um servico.");
      return;
    }

    if (!Number.isFinite(valor) || (valor ?? 0) <= 0) {
      setFieldError("Informe um valor valido maior que zero.");
      return;
    }

    if (!values.dataInicio) {
      setFieldError("Informe a data inicial.");
      return;
    }

    if (!dias.length) {
      setFieldError("Informe pelo menos um dia de cobranca.");
      return;
    }

    if (dias.some((day) => Number(day) < 1 || Number(day) > 31)) {
      setFieldError("Os dias de cobranca devem ficar entre 1 e 31.");
      return;
    }

    if (values.dataFim && values.dataFim < values.dataInicio) {
      setFieldError("A data final nao pode ser menor que a data inicial.");
      return;
    }

    await onSubmit({
      clientId: values.clientId,
      serviceId: values.serviceId,
      descricao: values.descricao,
      valor: valor ?? 0,
      dataInicio: values.dataInicio,
      dataFim: values.dataFim || null,
      diaCobranca1: Number(values.diaCobranca1),
      diaCobranca2: values.diaCobranca2 ? Number(values.diaCobranca2) : null,
      diaCobranca3: values.diaCobranca3 ? Number(values.diaCobranca3) : null,
      diaCobranca4: values.diaCobranca4 ? Number(values.diaCobranca4) : null,
      chavePix: values.chavePix,
      mensagemWhatsappPersonalizada: values.mensagemWhatsappPersonalizada,
      observacoes: values.observacoes,
      ativo: values.ativo,
    });
  }

  return (
    <Card>
      <p className="text-xs uppercase tracking-[0.24em] text-brand-600">Recorrencia</p>
      <h1 className="mt-2 text-2xl font-bold text-ink">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>

      <form className="mt-6 space-y-4" id={formId} onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink" htmlFor="clientId">
              Cliente
            </label>
            <select
              className="app-input"
              id="clientId"
              onChange={(event) => updateField("clientId", event.target.value)}
              value={values.clientId}
            >
              <option value="">Selecione</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-ink" htmlFor="serviceId">
              Servico
            </label>
            <select
              className="app-input"
              id="serviceId"
              onChange={(event) => updateField("serviceId", event.target.value)}
              value={values.serviceId}
            >
              <option value="">Selecione</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink" htmlFor="descricao">
              Descricao
            </label>
            <input
              className="app-input"
              id="descricao"
              onChange={(event) => updateField("descricao", event.target.value)}
              value={values.descricao}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-ink" htmlFor="valor">
              Valor
            </label>
            <input
              className="app-input"
              id="valor"
              inputMode="numeric"
              onChange={(event) => updateField("valor", formatCurrencyInput(event.target.value))}
              placeholder="0,00"
              value={values.valor}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink" htmlFor="dataInicio">
              Data inicial
            </label>
            <input
              className="app-input"
              id="dataInicio"
              onChange={(event) => updateField("dataInicio", event.target.value)}
              type="date"
              value={values.dataInicio}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-ink" htmlFor="dataFim">
              Data final
            </label>
            <input
              className="app-input"
              id="dataFim"
              onChange={(event) => updateField("dataFim", event.target.value)}
              type="date"
              value={values.dataFim}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            { field: "diaCobranca1", label: "Dia 1" },
            { field: "diaCobranca2", label: "Dia 2" },
            { field: "diaCobranca3", label: "Dia 3" },
            { field: "diaCobranca4", label: "Dia 4" },
          ].map((item) => (
            <div className="space-y-2" key={item.field}>
              <label className="text-sm font-medium text-ink" htmlFor={item.field}>
                {item.label}
              </label>
              <input
                className="app-input"
                id={item.field}
                max="31"
                min="1"
                onChange={(event) =>
                  updateField(item.field as keyof RecurrenceFormValues, event.target.value)
                }
                type="number"
                value={values[item.field as keyof RecurrenceFormValues] as string}
              />
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-ink" htmlFor="chavePix">
            Chave Pix
          </label>
          <input
            className="app-input"
            id="chavePix"
            onChange={(event) => updateField("chavePix", event.target.value)}
            value={values.chavePix}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-ink" htmlFor="mensagem">
            Mensagem personalizada do WhatsApp
          </label>
          <textarea
            className="app-textarea"
            id="mensagem"
            onChange={(event) =>
              updateField("mensagemWhatsappPersonalizada", event.target.value)
            }
            placeholder="Opcional. Se vazio, o template padrao do modulo sera usado."
            value={values.mensagemWhatsappPersonalizada}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-ink" htmlFor="observacoes">
            Observacoes
          </label>
          <textarea
            className="app-textarea"
            id="observacoes"
            onChange={(event) => updateField("observacoes", event.target.value)}
            value={values.observacoes}
          />
        </div>

        <label className="app-toggle-panel">
          <input
            checked={values.ativo}
            className="app-checkbox"
            onChange={(event) => updateField("ativo", event.target.checked)}
            type="checkbox"
          />
          Recorrencia ativa
        </label>

        {fieldError ? <p className="text-sm text-rose-600">{fieldError}</p> : null}
        {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}

        <Button className="w-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Salvando..." : submitLabel}
        </Button>
      </form>
    </Card>
  );
}
