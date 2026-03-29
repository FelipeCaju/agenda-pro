import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Card } from "@/components/ui/card";
import { ChevronDownIcon } from "@/components/ui/icons";
import type { Client } from "@/services/clientService";
import type { BusinessService } from "@/services/serviceService";
import type { OrcamentoInput } from "@/services/orcamentoService";

type OrcamentoFormValues = {
  clientId: string;
  discount: string;
  notes: string;
  items: Array<{
    id: string;
    serviceId: string;
    description: string;
    quantity: string;
    unitPrice: string;
    notes: string;
  }>;
};

type OrcamentoFormProps = {
  clients: Client[];
  services: BusinessService[];
  initialValues?: Partial<OrcamentoFormValues>;
  isSubmitting?: boolean;
  isLocked?: boolean;
  errorMessage?: string | null;
  onSubmit: (values: OrcamentoInput) => Promise<void>;
};

function createEmptyItem() {
  return {
    id: crypto.randomUUID(),
    serviceId: "",
    description: "",
    quantity: "1",
    unitPrice: "0",
    notes: "",
  };
}

const EMPTY_VALUES: OrcamentoFormValues = {
  clientId: "",
  discount: "0",
  notes: "",
  items: [createEmptyItem()],
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function OrcamentoForm({
  clients,
  services,
  initialValues,
  isSubmitting = false,
  isLocked = false,
  errorMessage,
  onSubmit,
}: OrcamentoFormProps) {
  const [values, setValues] = useState<OrcamentoFormValues>({
    ...EMPTY_VALUES,
    ...initialValues,
    items: initialValues?.items?.length ? initialValues.items : EMPTY_VALUES.items,
  });
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    setValues({
      ...EMPTY_VALUES,
      ...initialValues,
      items: initialValues?.items?.length ? initialValues.items : EMPTY_VALUES.items,
    });
  }, [initialValues]);

  const totals = useMemo(() => {
    const subtotal = values.items.reduce((sum, item) => {
      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(item.unitPrice || 0);
      return sum + quantity * unitPrice;
    }, 0);
    const discount = Number(values.discount || 0);

    return {
      subtotal,
      discount,
      total: Math.max(0, subtotal - discount),
    };
  }, [values.discount, values.items]);

  function updateItem(
    itemId: string,
    field: keyof OrcamentoFormValues["items"][number],
    nextValue: string,
  ) {
    setValues((current) => ({
      ...current,
      items: current.items.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        const updated = {
          ...item,
          [field]: nextValue,
        };

        if (field === "serviceId") {
          const selectedService = services.find((service) => service.id === nextValue);
          if (selectedService) {
            updated.description = selectedService.nome;
            if (!item.unitPrice || Number(item.unitPrice) === 0) {
              updated.unitPrice = String(selectedService.valorPadrao);
            }
          }
        }

        return updated;
      }),
    }));
    setFieldError(null);
  }

  function addItem() {
    setValues((current) => ({
      ...current,
      items: [...current.items, createEmptyItem()],
    }));
  }

  function removeItem(itemId: string) {
    setValues((current) => ({
      ...current,
      items: current.items.length === 1 ? current.items : current.items.filter((item) => item.id !== itemId),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!values.clientId) {
      setFieldError("Selecione o cliente do orcamento.");
      return;
    }

    const parsedDiscount = Number(values.discount || 0);

    if (!Number.isFinite(parsedDiscount) || parsedDiscount < 0) {
      setFieldError("Desconto invalido.");
      return;
    }

    const normalizedItems = values.items.map((item) => ({
      id: item.id,
      serviceId: item.serviceId || null,
      description: item.serviceId ? "" : item.description.trim(),
      quantity: Number(item.quantity || 0),
      unitPrice: Number(item.unitPrice || 0),
      notes: item.notes.trim(),
    }));

    if (
      normalizedItems.some(
        (item) =>
          (!item.serviceId && !item.description) ||
          !Number.isFinite(item.quantity) ||
          item.quantity <= 0 ||
          !Number.isFinite(item.unitPrice) ||
          item.unitPrice < 0,
      )
    ) {
      setFieldError("Revise os itens do orcamento antes de salvar.");
      return;
    }

    await onSubmit({
      clientId: values.clientId,
      discount: parsedDiscount,
      notes: values.notes.trim(),
      items: normalizedItems,
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-ink">Cliente</span>
        <div className="relative">
          <select
            className="app-select appearance-none pr-10 text-base"
            disabled={isLocked}
            onChange={(event) => setValues((current) => ({ ...current, clientId: event.target.value }))}
            value={values.clientId}
          >
            <option value="">Selecione o cliente</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.nome}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
      </label>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-ink">Itens do orcamento</p>
            <p className="text-sm text-slate-500">Adicione um ou mais servicos.</p>
          </div>
          <button
            className="rounded-full bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700"
            disabled={isLocked}
            onClick={addItem}
            type="button"
          >
            Adicionar item
          </button>
        </div>

        {values.items.map((item, index) => (
          <Card className="space-y-3" key={item.id}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-ink">Item {index + 1}</p>
              <button
                className="text-sm font-medium text-rose-600"
                disabled={isLocked || values.items.length === 1}
                onClick={() => removeItem(item.id)}
                type="button"
              >
                Remover
              </button>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-ink">Servico vinculado</span>
              <div className="relative">
                <select
                  className="app-select appearance-none pr-10 text-base"
                  disabled={isLocked}
                  onChange={(event) => updateItem(item.id, "serviceId", event.target.value)}
                  value={item.serviceId}
                >
                  <option value="">Descricao livre</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.nome}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </label>

            {!item.serviceId ? (
              <label className="block space-y-2">
                <span className="text-sm font-medium text-ink">Descricao do item</span>
                <input
                  className="app-input"
                  disabled={isLocked}
                  onChange={(event) => updateItem(item.id, "description", event.target.value)}
                  value={item.description}
                />
              </label>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-ink">Quantidade</span>
                <input
                  className="app-input"
                  disabled={isLocked}
                  min="0.01"
                  onChange={(event) => updateItem(item.id, "quantity", event.target.value)}
                  step="0.01"
                  type="number"
                  value={item.quantity}
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-ink">Valor unitario</span>
                <input
                  className="app-input"
                  disabled={isLocked}
                  min="0"
                  onChange={(event) => updateItem(item.id, "unitPrice", event.target.value)}
                  step="0.01"
                  type="number"
                  value={item.unitPrice}
                />
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-ink">Observacoes do item</span>
              <input
                className="app-input"
                disabled={isLocked}
                onChange={(event) => updateItem(item.id, "notes", event.target.value)}
                value={item.notes}
              />
            </label>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-ink">Desconto</span>
          <input
            className="app-input"
            disabled={isLocked}
            min="0"
            onChange={(event) => setValues((current) => ({ ...current, discount: event.target.value }))}
            step="0.01"
            type="number"
            value={values.discount}
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-ink">Observacoes</span>
          <input
            className="app-input"
            disabled={isLocked}
            onChange={(event) => setValues((current) => ({ ...current, notes: event.target.value }))}
            value={values.notes}
          />
        </label>
      </div>

      <Card className="border-brand-100 bg-brand-50/80">
        <p className="text-sm font-medium text-brand-700">Resumo financeiro</p>
        <div className="mt-3 space-y-2 text-sm text-brand-700">
          <p>Subtotal: {formatCurrency(totals.subtotal)}</p>
          <p>Desconto: {formatCurrency(totals.discount)}</p>
          <p className="text-base font-semibold">Total: {formatCurrency(totals.total)}</p>
        </div>
      </Card>

      {isLocked ? (
        <Card className="border-amber-100 bg-amber-50/80">
          <p className="text-sm font-medium text-amber-700">
            Orcamentos aprovados ou recusados ficam bloqueados para edicao.
          </p>
        </Card>
      ) : null}

      {fieldError ? <p className="text-sm text-rose-600">{fieldError}</p> : null}
      {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}

      {!isLocked ? (
        <button
          className="w-full rounded-[18px] bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-soft"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Salvando..." : "Salvar orcamento"}
        </button>
      ) : null}
    </form>
  );
}
