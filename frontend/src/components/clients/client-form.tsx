import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ClientInput } from "@/services/clientService";

export type ClientFormValues = {
  nome: string;
  telefone: string;
  email: string;
  observacoes: string;
  ativo: boolean;
};

type ClientFormProps = {
  initialValues?: Partial<ClientFormValues>;
  isSubmitting?: boolean;
  onSubmit: (values: ClientInput) => Promise<void>;
  submitLabel: string;
  title: string;
  description: string;
  errorMessage?: string | null;
};

const EMPTY_VALUES: ClientFormValues = {
  nome: "",
  telefone: "",
  email: "",
  observacoes: "",
  ativo: true,
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function ClientForm({
  initialValues,
  isSubmitting = false,
  onSubmit,
  submitLabel,
  title,
  description,
  errorMessage,
}: ClientFormProps) {
  const [values, setValues] = useState<ClientFormValues>({
    ...EMPTY_VALUES,
    ...initialValues,
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ClientFormValues, string>>>(
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

    if (values.email.trim() && !isValidEmail(values.email.trim())) {
      return "Email invalido.";
    }

    return null;
  }, [values.email, values.nome]);

  function updateField<K extends keyof ClientFormValues>(field: K, value: ClientFormValues[K]) {
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

    const nextErrors: Partial<Record<keyof ClientFormValues, string>> = {};

    if (!values.nome.trim()) {
      nextErrors.nome = "Nome e obrigatorio.";
    }

    if (values.email.trim() && !isValidEmail(values.email.trim())) {
      nextErrors.email = "Informe um email valido.";
    }

    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    await onSubmit({
      nome: values.nome,
      telefone: values.telefone,
      email: values.email,
      observacoes: values.observacoes,
      ativo: values.ativo,
    });
  }

  return (
    <Card>
      <p className="text-xs uppercase tracking-[0.24em] text-brand-600">Clientes</p>
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
            placeholder="Nome do cliente"
            value={values.nome}
          />
          {fieldErrors.nome ? <p className="text-sm text-rose-600">{fieldErrors.nome}</p> : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-ink" htmlFor="telefone">
            Telefone
          </label>
          <input
            className="app-input"
            id="telefone"
            maxLength={30}
            onChange={(event) => updateField("telefone", event.target.value)}
            placeholder="Opcional"
            value={values.telefone}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-ink" htmlFor="email">
            Email
          </label>
          <input
            className="app-input"
            id="email"
            onChange={(event) => updateField("email", event.target.value)}
            placeholder="Opcional"
            type="email"
            value={values.email}
          />
          {fieldErrors.email ? <p className="text-sm text-rose-600">{fieldErrors.email}</p> : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-ink" htmlFor="observacoes">
            Observacoes
          </label>
          <textarea
            className="app-textarea"
            id="observacoes"
            onChange={(event) => updateField("observacoes", event.target.value)}
            placeholder="Detalhes importantes sobre o cliente"
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
          Cliente ativo
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
