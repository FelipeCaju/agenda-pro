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
  items: OrcamentoFormItemValues[];
};

type OrcamentoFormItemValues = {
  id: string;
  serviceId: string;
  description: string;
  quantity: string;
  unitPrice: string;
  notes: string;
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
  items: [],
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
    items: initialValues?.items?.length ? initialValues.items : [],
  });
  const [draftItem, setDraftItem] = useState<OrcamentoFormItemValues>(createEmptyItem());
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    setValues({
      ...EMPTY_VALUES,
      ...initialValues,
      items: initialValues?.items?.length ? initialValues.items : [],
    });
    setDraftItem(createEmptyItem());
    setEditingItemId(null);
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

  function updateDraftItem(field: keyof OrcamentoFormItemValues, nextValue: string) {
    setDraftItem((current) => {
      const updated = {
        ...current,
        [field]: nextValue,
      };

      if (field === "serviceId") {
        const selectedService = services.find((service) => service.id === nextValue);

        if (selectedService) {
          updated.description = selectedService.nome;
          if (!current.unitPrice || Number(current.unitPrice) === 0) {
            updated.unitPrice = String(selectedService.valorPadrao);
          }
        } else {
          updated.description = "";
        }
      }

      return updated;
    });
    setFieldError(null);
  }

  function resetDraftItem() {
    setDraftItem(createEmptyItem());
    setEditingItemId(null);
  }

  function removeItem(itemId: string) {
    setValues((current) => ({
      ...current,
      items: current.items.filter((item) => item.id !== itemId),
    }));

    if (editingItemId === itemId) {
      resetDraftItem();
    }
  }

  function startEditingItem(itemId: string) {
    const item = values.items.find((currentItem) => currentItem.id === itemId);

    if (!item) {
      return;
    }

    setDraftItem({ ...item });
    setEditingItemId(itemId);
    setFieldError(null);
  }

  function validateDraftItem(item: OrcamentoFormItemValues) {
    const quantity = Number(item.quantity || 0);
    const unitPrice = Number(item.unitPrice || 0);

    if (!item.serviceId && !item.description.trim()) {
      return "Informe um servico ou uma descricao para o item.";
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return "A quantidade do item deve ser maior que zero.";
    }

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      return "O valor unitario do item e invalido.";
    }

    return null;
  }

  function saveDraftItem() {
    const validationError = validateDraftItem(draftItem);

    if (validationError) {
      setFieldError(validationError);
      return;
    }

    setValues((current) => {
      const nextItems = editingItemId
        ? current.items.map((item) => (item.id === editingItemId ? { ...draftItem } : item))
        : [...current.items, { ...draftItem }];

      return {
        ...current,
        items: nextItems,
      };
    });

    resetDraftItem();
    setFieldError(null);
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

    if (editingItemId) {
      setFieldError("Salve a edicao do item antes de salvar o orcamento.");
      return;
    }

    if (values.items.length === 0) {
      setFieldError("Adicione pelo menos um item ao orcamento.");
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
            <p className="text-sm text-slate-500">Preencha o item abaixo e monte a tabela sem abrir outro formulario.</p>
          </div>
        </div>

        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-ink">
              {editingItemId ? "Editando item da tabela" : "Novo item"}
            </p>
            {editingItemId ? (
              <button
                className="text-sm font-medium text-slate-500"
                disabled={isLocked}
                onClick={resetDraftItem}
                type="button"
              >
                Cancelar edicao
              </button>
            ) : null}
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.3fr_1.4fr_0.8fr_0.9fr]">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-ink">Servico vinculado</span>
              <div className="relative">
                <select
                  className="app-select appearance-none pr-10 text-base"
                  disabled={isLocked}
                  onChange={(event) => updateDraftItem("serviceId", event.target.value)}
                  value={draftItem.serviceId}
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

            <label className="block space-y-2">
              <span className="text-sm font-medium text-ink">Descricao do item</span>
              <input
                className="app-input"
                disabled={isLocked || Boolean(draftItem.serviceId)}
                onChange={(event) => updateDraftItem("description", event.target.value)}
                value={draftItem.description}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-ink">Quantidade</span>
              <input
                className="app-input"
                disabled={isLocked}
                min="0.01"
                onChange={(event) => updateDraftItem("quantity", event.target.value)}
                step="0.01"
                type="number"
                value={draftItem.quantity}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-ink">Valor unitario</span>
              <input
                className="app-input"
                disabled={isLocked}
                min="0"
                onChange={(event) => updateDraftItem("unitPrice", event.target.value)}
                step="0.01"
                type="number"
                value={draftItem.unitPrice}
              />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-ink">Observacoes do item</span>
            <input
              className="app-input"
              disabled={isLocked}
              onChange={(event) => updateDraftItem("notes", event.target.value)}
              value={draftItem.notes}
            />
          </label>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              className="rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700"
              disabled={isLocked}
              onClick={saveDraftItem}
              type="button"
            >
              {editingItemId ? "Salvar edicao" : "Adicionar item"}
            </button>
            {!isLocked && values.items.length > 0 ? (
              <span className="self-center text-sm text-slate-500">
                {values.items.length} {values.items.length === 1 ? "item adicionado" : "itens adicionados"}
              </span>
            ) : null}
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          {values.items.length === 0 ? (
            <div className="px-4 py-6 text-sm text-slate-500">Nenhum item adicionado ainda.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                    <th className="px-4 py-3 font-medium">Item</th>
                    <th className="px-4 py-3 font-medium">Qtd.</th>
                    <th className="px-4 py-3 font-medium">Unitario</th>
                    <th className="px-4 py-3 font-medium">Total</th>
                    <th className="px-4 py-3 font-medium">Observacoes</th>
                    <th className="px-4 py-3 font-medium text-right">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-sm text-slate-600">
                  {values.items.map((item) => {
                    const quantity = Number(item.quantity || 0);
                    const unitPrice = Number(item.unitPrice || 0);
                    const totalPrice = quantity * unitPrice;

                    return (
                      <tr key={item.id}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-ink">{item.description}</div>
                          {item.serviceId ? (
                            <div className="text-xs text-slate-500">Servico cadastrado</div>
                          ) : (
                            <div className="text-xs text-slate-500">Descricao livre</div>
                          )}
                        </td>
                        <td className="px-4 py-3">{quantity}</td>
                        <td className="px-4 py-3">{formatCurrency(unitPrice)}</td>
                        <td className="px-4 py-3 font-medium text-ink">{formatCurrency(totalPrice)}</td>
                        <td className="px-4 py-3">{item.notes || "-"}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-3">
                            <button
                              className="text-sm font-medium text-brand-700"
                              disabled={isLocked}
                              onClick={() => startEditingItem(item.id)}
                              type="button"
                            >
                              Editar
                            </button>
                            <button
                              className="text-sm font-medium text-rose-600"
                              disabled={isLocked}
                              onClick={() => removeItem(item.id)}
                              type="button"
                            >
                              Remover
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
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
