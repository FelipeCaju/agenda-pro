import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { BusinessServiceInput } from "@/services/serviceService";

export type ServiceFormValues = {
  nome: string;
  descricao: string;
  duracaoMinutos: string;
  valorPadrao: string;
  cor: string;
  ativo: boolean;
};

type ServiceFormProps = {
  initialValues?: Partial<ServiceFormValues>;
  isSubmitting?: boolean;
  onSubmit: (values: BusinessServiceInput) => Promise<void>;
  submitLabel: string;
  title: string;
  description: string;
  errorMessage?: string | null;
};

const EMPTY_VALUES: ServiceFormValues = {
  nome: "",
  descricao: "",
  duracaoMinutos: "30",
  valorPadrao: "0",
  cor: "#1d8cf8",
  ativo: true,
};

const COLOR_OPTIONS = ["#1d8cf8", "#0f6dd9", "#14b8a6", "#22c55e", "#f97316", "#ef4444"];

function isValidColor(color: string) {
  return /^#([0-9a-fA-F]{6})$/.test(color);
}

export function ServiceForm({
  initialValues,
  isSubmitting = false,
  onSubmit,
  submitLabel,
  title,
  description,
  errorMessage,
}: ServiceFormProps) {
  const [values, setValues] = useState<ServiceFormValues>({
    ...EMPTY_VALUES,
    ...initialValues,
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ServiceFormValues, string>>>(
    {},
  );

  useEffect(() => {
    setValues({
      ...EMPTY_VALUES,
      ...initialValues,
    });
  }, [initialValues]);

  const formError = useMemo(() => {
    if (!values.nome.trim()) {
      return "Nome e obrigatorio.";
    }

    if (!Number.isFinite(Number(values.duracaoMinutos)) || Number(values.duracaoMinutos) <= 0) {
      return "Duracao deve ser um numero valido.";
    }

    if (!Number.isFinite(Number(values.valorPadrao)) || Number(values.valorPadrao) < 0) {
      return "Valor deve ser um numero valido.";
    }

    if (!isValidColor(values.cor.trim())) {
      return "Cor invalida.";
    }

    return null;
  }, [values.cor, values.duracaoMinutos, values.nome, values.valorPadrao]);

  function updateField<K extends keyof ServiceFormValues>(field: K, value: ServiceFormValues[K]) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));

    setFieldErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: Partial<Record<keyof ServiceFormValues, string>> = {};

    if (!values.nome.trim()) {
      nextErrors.nome = "Nome e obrigatorio.";
    }

    if (!Number.isFinite(Number(values.duracaoMinutos)) || Number(values.duracaoMinutos) <= 0) {
      nextErrors.duracaoMinutos = "Informe uma duracao valida em minutos.";
    }

    if (!Number.isFinite(Number(values.valorPadrao)) || Number(values.valorPadrao) < 0) {
      nextErrors.valorPadrao = "Informe um valor valido.";
    }

    if (!isValidColor(values.cor.trim())) {
      nextErrors.cor = "Use uma cor hexadecimal valida.";
    }

    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    await onSubmit({
      nome: values.nome,
      descricao: values.descricao,
      duracaoMinutos: Number(values.duracaoMinutos),
      valorPadrao: Number(values.valorPadrao),
      cor: values.cor,
      ativo: values.ativo,
    });
  }

  return (
    <Card>
      <p className="text-xs uppercase tracking-[0.24em] text-brand-600">Servicos</p>
      <h1 className="mt-2 text-2xl font-bold text-ink">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-ink" htmlFor="nome">
            Nome
          </label>
          <input
            className="app-input"
            id="nome"
            maxLength={160}
            onChange={(event) => updateField("nome", event.target.value)}
            placeholder="Nome do servico"
            value={values.nome}
          />
          {fieldErrors.nome ? <p className="text-sm text-rose-600">{fieldErrors.nome}</p> : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-ink" htmlFor="descricao">
            Descricao
          </label>
          <textarea
            className="app-textarea"
            id="descricao"
            onChange={(event) => updateField("descricao", event.target.value)}
            placeholder="Explique rapidamente o servico"
            value={values.descricao}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink" htmlFor="duracao">
              Duracao em minutos
            </label>
            <input
              className="app-input"
              id="duracao"
              min="1"
              onChange={(event) => updateField("duracaoMinutos", event.target.value)}
              type="number"
              value={values.duracaoMinutos}
            />
            {fieldErrors.duracaoMinutos ? (
              <p className="text-sm text-rose-600">{fieldErrors.duracaoMinutos}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-ink" htmlFor="valor">
              Valor padrao
            </label>
            <input
              className="app-input"
              id="valor"
              min="0"
              onChange={(event) => updateField("valorPadrao", event.target.value)}
              step="0.01"
              type="number"
              value={values.valorPadrao}
            />
            {fieldErrors.valorPadrao ? (
              <p className="text-sm text-rose-600">{fieldErrors.valorPadrao}</p>
            ) : null}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-ink" htmlFor="cor">
            Cor
          </label>
          <div className="flex flex-wrap gap-3">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color}
                aria-label={`Selecionar cor ${color}`}
                className={`h-10 w-10 rounded-full ring-2 transition ${
                  values.cor === color ? "ring-ink" : "ring-transparent"
                }`}
                onClick={() => updateField("cor", color)}
                style={{ backgroundColor: color }}
                type="button"
              />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <input
              className="h-11 w-16 rounded-xl border border-slate-200 bg-white"
              id="cor"
              onChange={(event) => updateField("cor", event.target.value)}
              type="color"
              value={values.cor}
            />
            <input
              className="app-input flex-1"
              onChange={(event) => updateField("cor", event.target.value)}
              value={values.cor}
            />
          </div>
          {fieldErrors.cor ? <p className="text-sm text-rose-600">{fieldErrors.cor}</p> : null}
        </div>

        <label className="app-toggle-panel">
          <input
            checked={values.ativo}
            className="app-checkbox"
            onChange={(event) => updateField("ativo", event.target.checked)}
            type="checkbox"
          />
          Servico ativo
        </label>

        {formError ? <p className="text-sm text-rose-600">{formError}</p> : null}
        {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}

        <Button className="w-full" disabled={isSubmitting || Boolean(formError)} type="submit">
          {isSubmitting ? "Salvando..." : submitLabel}
        </Button>
      </form>
    </Card>
  );
}
