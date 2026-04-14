import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Card } from "@/components/ui/card";
import { CalendarIcon, ChevronDownIcon, ClockIcon } from "@/components/ui/icons";
import type {
  AppointmentInput,
  AppointmentItemInput,
  AppointmentPaymentStatus,
  AppointmentStatus,
} from "@/services/appointmentService";
import type { Client } from "@/services/clientService";
import type { Professional } from "@/services/professionalService";
import type { BusinessService } from "@/services/serviceService";
import { getTodayDate } from "@/utils/agenda";
import { formatDateBR } from "@/utils/date";

type AppointmentFormItemValues = {
  id: string;
  serviceId: string;
  durationMinutes: string;
  unitPrice: string;
};

type NewAppointmentValues = {
  clienteId: string;
  professionalId: string;
  data: string;
  horarioInicial: string;
  valorTotal: string;
  status: AppointmentStatus;
  paymentStatus: AppointmentPaymentStatus;
  observacoes: string;
  quoteId: string;
  serviceOrderId: string;
  repetir: "nao_repetir" | "semanal" | "quinzenal" | "mensal";
  items: AppointmentFormItemValues[];
};

type NewAppointmentProps = {
  clients: Client[];
  professionals: Professional[];
  services: BusinessService[];
  formId?: string;
  showInlineSubmit?: boolean;
  initialValues?: Partial<NewAppointmentValues>;
  isSubmitting?: boolean;
  onSubmit: (values: AppointmentInput) => Promise<void>;
  title: string;
  description: string;
  submitLabel: string;
  errorMessage?: string | null;
  allowRecurrence?: boolean;
};

const EMPTY_VALUES: NewAppointmentValues = {
  clienteId: "",
  professionalId: "",
  data: getTodayDate(),
  horarioInicial: "",
  valorTotal: "",
  status: "pendente",
  paymentStatus: "pendente",
  observacoes: "",
  quoteId: "",
  serviceOrderId: "",
  repetir: "nao_repetir",
  items: [],
};

function createEmptyDraftItem(): AppointmentFormItemValues {
  return {
    id: crypto.randomUUID(),
    serviceId: "",
    durationMinutes: "",
    unitPrice: "",
  };
}

function formatSummaryDate(date: string) {
  return date ? formatDateBR(date) : "--";
}

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

function formatCurrencyValue(value?: number | string | null) {
  const numericValue =
    typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;

  if (!Number.isFinite(numericValue)) {
    return "";
  }

  return numericValue.toLocaleString("pt-BR", {
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
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function addMinutesToTime(time: string, minutesToAdd: number) {
  if (!time || !Number.isFinite(minutesToAdd) || minutesToAdd <= 0) {
    return "";
  }

  const [hours, minutes] = time.split(":").map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return "";
  }

  const totalMinutes = hours * 60 + minutes + minutesToAdd;

  if (totalMinutes < 0 || totalMinutes > 24 * 60) {
    return "";
  }

  const nextHours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const nextMinutes = String(totalMinutes % 60).padStart(2, "0");

  return `${nextHours}:${nextMinutes}`;
}

function formatDuration(durationMinutes: number) {
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}min`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${minutes}min`;
}

function formatCurrencyDisplay(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function NewAppointment({
  clients,
  professionals,
  services,
  formId = "appointment-form",
  showInlineSubmit = true,
  initialValues,
  isSubmitting = false,
  onSubmit,
  title,
  description,
  submitLabel,
  errorMessage,
  allowRecurrence = true,
}: NewAppointmentProps) {
  const [values, setValues] = useState<NewAppointmentValues>({
    ...EMPTY_VALUES,
    ...initialValues,
    items: initialValues?.items?.length ? initialValues.items : [],
  });
  const [draftItem, setDraftItem] = useState<AppointmentFormItemValues>(createEmptyDraftItem());
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isTotalManuallyEdited, setIsTotalManuallyEdited] = useState(false);

  useEffect(() => {
    const nextItems = initialValues?.items?.length ? initialValues.items : [];
    const subtotal = nextItems.reduce((sum, item) => {
      const unitPrice = parseCurrencyInput(item.unitPrice);
      return sum + (Number.isFinite(unitPrice) ? unitPrice ?? 0 : 0);
    }, 0);
    const providedTotal = parseCurrencyInput(initialValues?.valorTotal ?? "");

    setValues({
      ...EMPTY_VALUES,
      ...initialValues,
      items: nextItems,
    });
    setDraftItem(createEmptyDraftItem());
    setEditingItemId(null);
    setIsTotalManuallyEdited(
      providedTotal !== undefined && Number((providedTotal - subtotal).toFixed(2)) !== 0,
    );
  }, [initialValues]);

  const subtotal = useMemo(
    () =>
      Number(
        values.items
          .reduce((sum, item) => sum + (parseCurrencyInput(item.unitPrice) ?? 0), 0)
          .toFixed(2),
      ),
    [values.items],
  );
  const totalDuration = useMemo(
    () =>
      values.items.reduce((sum, item) => {
        const duration = Number(item.durationMinutes || 0);
        return sum + (Number.isFinite(duration) ? duration : 0);
      }, 0),
    [values.items],
  );
  const computedEndTime = useMemo(
    () => addMinutesToTime(values.horarioInicial, totalDuration),
    [totalDuration, values.horarioInicial],
  );
  const selectedServiceIds = useMemo(
    () => [...new Set(values.items.map((item) => item.serviceId).filter(Boolean))],
    [values.items],
  );

  const availableProfessionals = useMemo(() => {
    if (!selectedServiceIds.length) {
      return [];
    }

    const matchingAllServices = professionals.filter((professional) =>
      selectedServiceIds.every((serviceId) => professional.serviceIds.includes(serviceId)),
    );

    if (matchingAllServices.length) {
      return matchingAllServices;
    }

    return professionals;
  }, [professionals, selectedServiceIds]);

  useEffect(() => {
    if (isTotalManuallyEdited) {
      return;
    }

    setValues((current) => ({
      ...current,
      valorTotal: formatCurrencyValue(subtotal),
    }));
  }, [isTotalManuallyEdited, subtotal]);

  useEffect(() => {
    if (!selectedServiceIds.length) {
      setValues((current) => ({
        ...current,
        professionalId: "",
      }));
      return;
    }

    setValues((current) => {
      const hasCurrentProfessional = availableProfessionals.some(
        (professional) => professional.id === current.professionalId,
      );

      if (availableProfessionals.length === 1) {
        if (current.professionalId === availableProfessionals[0].id) {
          return current;
        }

        return {
          ...current,
          professionalId: availableProfessionals[0].id,
        };
      }

      if (!hasCurrentProfessional) {
        return {
          ...current,
          professionalId: "",
        };
      }

      return current;
    });
  }, [availableProfessionals, selectedServiceIds]);

  function updateField<K extends keyof NewAppointmentValues>(
    field: K,
    value: NewAppointmentValues[K],
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
    setFieldError(null);
  }

  function updateDraftItem(field: keyof AppointmentFormItemValues, value: string) {
    setDraftItem((current) => {
      const nextItem = {
        ...current,
        [field]: value,
      };

      if (field === "serviceId") {
        const selectedService = services.find((service) => service.id === value);

        if (selectedService) {
          nextItem.durationMinutes = String(selectedService.duracaoMinutos ?? 0);
          nextItem.unitPrice = formatCurrencyValue(selectedService.valorPadrao);
        } else {
          nextItem.durationMinutes = "";
          nextItem.unitPrice = "";
        }
      }

      return nextItem;
    });

    setFieldError(null);
  }

  function resetDraftItem() {
    setDraftItem(createEmptyDraftItem());
    setEditingItemId(null);
  }

  function validateDraftItem(item: AppointmentFormItemValues) {
    const duration = Number(item.durationMinutes || 0);
    const unitPrice = parseCurrencyInput(item.unitPrice);

    if (!item.serviceId) {
      return "Selecione o servico do item.";
    }

    if (!Number.isInteger(duration) || duration <= 0) {
      return "A duracao do item deve ser maior que zero.";
    }

    if (!Number.isFinite(unitPrice) || (unitPrice ?? 0) < 0) {
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

  function startEditingItem(itemId: string) {
    const item = values.items.find((currentItem) => currentItem.id === itemId);

    if (!item) {
      return;
    }

    setDraftItem({ ...item });
    setEditingItemId(itemId);
    setFieldError(null);
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!values.clienteId) {
      setFieldError("Cliente e obrigatorio.");
      return;
    }

    if (!values.data) {
      setFieldError("Data e obrigatoria.");
      return;
    }

    if (values.data < getTodayDate()) {
      setFieldError("Nao e permitido agendar em data passada.");
      return;
    }

    if (!values.horarioInicial) {
      setFieldError("Horario inicial e obrigatorio.");
      return;
    }

    if (editingItemId) {
      setFieldError("Salve a edicao do item antes de salvar o agendamento.");
      return;
    }

    if (!values.items.length) {
      setFieldError("Adicione pelo menos um servico ao agendamento.");
      return;
    }

    if (!computedEndTime) {
      setFieldError("Nao foi possivel calcular o horario final.");
      return;
    }

    if (availableProfessionals.length > 1 && !values.professionalId) {
      setFieldError("Selecione o profissional responsavel.");
      return;
    }

    const parsedTotal = parseCurrencyInput(values.valorTotal);

    if (parsedTotal !== undefined && (!Number.isFinite(parsedTotal) || parsedTotal < 0)) {
      setFieldError("Valor total invalido.");
      return;
    }

    const normalizedItems: AppointmentItemInput[] = values.items.map((item) => ({
      id: item.id,
      serviceId: item.serviceId,
      durationMinutes: Number(item.durationMinutes || 0),
      unitPrice: parseCurrencyInput(item.unitPrice) ?? 0,
      totalPrice: parseCurrencyInput(item.unitPrice) ?? 0,
    }));

    await onSubmit({
      clienteId: values.clienteId,
      servicoId: normalizedItems[0].serviceId,
      professionalId: values.professionalId || null,
      data: values.data,
      horarioInicial: values.horarioInicial,
      horarioFinal: computedEndTime,
      valor: parsedTotal ?? subtotal,
      status: values.status,
      paymentStatus: values.paymentStatus,
      observacoes: values.observacoes,
      quoteId: values.quoteId || null,
      serviceOrderId: values.serviceOrderId || null,
      items: normalizedItems,
      recurrence:
        values.repetir === "semanal"
          ? { type: "weekly", count: 1 }
          : values.repetir === "quinzenal"
            ? { type: "biweekly", count: 1 }
            : values.repetir === "mensal"
              ? { type: "monthly", count: 1 }
              : undefined,
    });
  }

  function getRecurrenceSummary() {
    if (values.repetir === "semanal") {
      return "Semanal por 6 meses";
    }

    if (values.repetir === "quinzenal") {
      return "Quinzenal por 6 meses";
    }

    if (values.repetir === "mensal") {
      return "Mensal por 6 meses";
    }

    return "Nao repetir";
  }

  const totalValue = parseCurrencyInput(values.valorTotal) ?? subtotal;
  const adjustmentValue = Number((totalValue - subtotal).toFixed(2));

  return (
    <form className="space-y-5" id={formId} onSubmit={handleSubmit}>
      {title || description ? (
        <div>
          {title ? (
            <h1 className="text-[1.8rem] font-semibold tracking-[-0.04em] text-ink">{title}</h1>
          ) : null}
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>
      ) : null}

      <label className="block space-y-2">
        <span className="text-sm font-medium text-ink">Cliente</span>
        <div className="relative">
          <select
            className="app-select appearance-none pr-10 text-base"
            onChange={(event) => updateField("clienteId", event.target.value)}
            value={values.clienteId}
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

      <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-2 sm:gap-3">
        <label className="block min-w-0 space-y-2">
          <span className="text-sm font-medium text-ink">Data</span>
          <div className="relative">
            <input
              className="app-input px-3 pr-9 text-sm sm:px-4 sm:pr-11 sm:text-base"
              min={getTodayDate()}
              onChange={(event) => updateField("data", event.target.value)}
              type="date"
              value={values.data}
            />
            <CalendarIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 sm:right-4" />
          </div>
        </label>

        <label className="block min-w-0 space-y-2">
          <span className="text-sm font-medium text-ink">Inicio</span>
          <div className="relative">
            <input
              className="app-input px-3 pr-8 text-sm sm:px-4 sm:pr-10 sm:text-base"
              onChange={(event) => updateField("horarioInicial", event.target.value)}
              type="time"
              value={values.horarioInicial}
            />
            <ClockIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 sm:right-4" />
          </div>
        </label>
      </div>

      {selectedServiceIds.length ? (
        <label className="block space-y-2">
          <span className="text-sm font-medium text-ink">Profissional</span>
          <div className="relative">
            <select
              className="app-select appearance-none pr-10 text-base"
              disabled={!availableProfessionals.length || availableProfessionals.length === 1}
              onChange={(event) => updateField("professionalId", event.target.value)}
              value={values.professionalId}
            >
              {!availableProfessionals.length ? (
                <option value="">Nenhum profissional cadastrado</option>
              ) : availableProfessionals.length === 1 ? (
                <option value={availableProfessionals[0].id}>{availableProfessionals[0].nome}</option>
              ) : (
                <>
                  <option value="">Selecione o profissional</option>
                  {availableProfessionals.map((professional) => (
                    <option key={professional.id} value={professional.id}>
                      {professional.nome} {professional.atividade ? `- ${professional.atividade}` : ""}
                    </option>
                  ))}
                </>
              )}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </label>
      ) : null}

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-ink">Servicos do atendimento</p>
            <p className="text-sm text-slate-500">
              Monte o atendimento com varios servicos sem criar duas agendas para o mesmo cliente.
            </p>
          </div>
        </div>

        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-ink">
              {editingItemId ? "Editando servico" : "Novo servico"}
            </p>
            {editingItemId ? (
              <button
                className="text-sm font-medium text-slate-500"
                onClick={resetDraftItem}
                type="button"
              >
                Cancelar edicao
              </button>
            ) : null}
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.5fr_0.8fr_0.9fr]">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-ink">Servico</span>
              <div className="relative">
                <select
                  className="app-select appearance-none pr-10 text-base"
                  onChange={(event) => updateDraftItem("serviceId", event.target.value)}
                  value={draftItem.serviceId}
                >
                  <option value="">Selecione o servico</option>
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
              <span className="text-sm font-medium text-ink">Duracao</span>
              <input
                className="app-input"
                min="1"
                onChange={(event) => updateDraftItem("durationMinutes", event.target.value)}
                step="1"
                type="number"
                value={draftItem.durationMinutes}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-ink">Valor unitario</span>
              <input
                className="app-input"
                inputMode="numeric"
                onChange={(event) => updateDraftItem("unitPrice", formatCurrencyInput(event.target.value))}
                placeholder="0,00"
                type="text"
                value={draftItem.unitPrice}
              />
            </label>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              className="rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700"
              onClick={saveDraftItem}
              type="button"
            >
              {editingItemId ? "Salvar edicao" : "Adicionar servico"}
            </button>
            {values.items.length > 0 ? (
              <span className="self-center text-sm text-slate-500">
                {values.items.length} {values.items.length === 1 ? "servico adicionado" : "servicos adicionados"}
              </span>
            ) : null}
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          {values.items.length === 0 ? (
            <div className="px-4 py-6 text-sm text-slate-500">Nenhum servico adicionado ainda.</div>
          ) : (
            <>
              <div className="overflow-x-auto hidden md:block">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                      <th className="px-4 py-3 font-medium">Servico</th>
                      <th className="px-4 py-3 font-medium">Duracao</th>
                      <th className="px-4 py-3 font-medium">Unitario</th>
                      <th className="px-4 py-3 font-medium">Total</th>
                      <th className="px-4 py-3 font-medium text-right">Acoes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-sm text-slate-600">
                    {values.items.map((item) => {
                      const service = services.find((currentService) => currentService.id === item.serviceId);
                      const unitPrice = parseCurrencyInput(item.unitPrice) ?? 0;

                      return (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <div className="font-medium text-ink">{service?.nome ?? "Servico removido"}</div>
                          </td>
                          <td className="px-4 py-3">{formatDuration(Number(item.durationMinutes || 0))}</td>
                          <td className="px-4 py-3">{formatCurrencyDisplay(unitPrice)}</td>
                          <td className="px-4 py-3 font-medium text-ink">{formatCurrencyDisplay(unitPrice)}</td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-3">
                              <button
                                className="text-sm font-medium text-brand-700"
                                onClick={() => startEditingItem(item.id)}
                                type="button"
                              >
                                Editar
                              </button>
                              <button
                                className="text-sm font-medium text-rose-600"
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

              <div className="space-y-3 p-4 md:hidden">
                {values.items.map((item) => {
                  const service = services.find((currentService) => currentService.id === item.serviceId);
                  const unitPrice = parseCurrencyInput(item.unitPrice) ?? 0;

                  return (
                    <div className="rounded-2xl border border-slate-200 p-4" key={item.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-ink">{service?.nome ?? "Servico removido"}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {formatDuration(Number(item.durationMinutes || 0))}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-ink">{formatCurrencyDisplay(unitPrice)}</p>
                      </div>
                      <div className="mt-4 flex gap-3">
                        <button
                          className="text-sm font-medium text-brand-700"
                          onClick={() => startEditingItem(item.id)}
                          type="button"
                        >
                          Editar
                        </button>
                        <button
                          className="text-sm font-medium text-rose-600"
                          onClick={() => removeItem(item.id)}
                          type="button"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-ink">Valor total da agenda</span>
          <input
            className="app-input text-base"
            inputMode="numeric"
            onChange={(event) => {
              setIsTotalManuallyEdited(true);
              updateField("valorTotal", formatCurrencyInput(event.target.value));
            }}
            placeholder="0,00"
            type="text"
            value={values.valorTotal}
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-ink">Horario final calculado</span>
          <div className="relative">
            <input
              className="app-input bg-slate-50 px-3 pr-8 text-sm text-slate-500 sm:px-4 sm:pr-10 sm:text-base"
              readOnly
              type="time"
              value={computedEndTime}
            />
            <ClockIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 sm:right-4" />
          </div>
        </label>
      </div>

      {allowRecurrence ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-ink">
            <svg
              className="h-4 w-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <path d="M4 4v6h6" />
              <path d="M20 20v-6h-6" />
              <path d="M20 10A8 8 0 0 0 6.5 5.4L4 7" />
              <path d="M4 14a8 8 0 0 0 13.5 4.6L20 17" />
            </svg>
            Repeticao simples
          </div>
          <div className="relative">
            <select
              className="app-select appearance-none pr-10 text-base"
              onChange={(event) =>
                updateField(
                  "repetir",
                  event.target.value as NewAppointmentValues["repetir"],
                )
              }
              value={values.repetir}
            >
              <option value="nao_repetir">Nao repetir</option>
              <option value="semanal">Semanal (mesmo dia por 6 meses)</option>
              <option value="quinzenal">Quinzenal (a cada 15 dias por 6 meses)</option>
              <option value="mensal">Mensal (mesmo dia por 6 meses)</option>
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      ) : null}

      <label className="block space-y-2">
        <span className="text-sm font-medium text-ink">Observacoes</span>
        <textarea
          className="app-textarea min-h-32 px-4 py-4 text-base"
          onChange={(event) => updateField("observacoes", event.target.value)}
          placeholder="Observacoes opcionais..."
          value={values.observacoes}
        />
      </label>

      <Card className="rounded-[18px] border border-brand-100 bg-brand-50 px-4 py-4 shadow-none">
        <p className="text-sm font-medium text-brand-700">Resumo</p>
        <div className="mt-3 space-y-2 text-sm text-brand-700">
          <p>Status: Pendente</p>
          <p>Pagamento: Pendente</p>
          {allowRecurrence && values.repetir !== "nao_repetir" ? (
            <p>Repeticao: {getRecurrenceSummary()}</p>
          ) : null}
          <p>Data: {formatSummaryDate(values.data)}</p>
          {values.professionalId ? (
            <p>
              Profissional:{" "}
              {availableProfessionals.find((professional) => professional.id === values.professionalId)?.nome ??
                "--"}
            </p>
          ) : null}
          <p>Horario: {values.horarioInicial || "--"} - {computedEndTime || "--"}</p>
          <p>Duracao total: {totalDuration > 0 ? formatDuration(totalDuration) : "--"}</p>
          <p>Subtotal dos servicos: {formatCurrencyDisplay(subtotal)}</p>
          {adjustmentValue !== 0 ? (
            <p>
              Ajuste no total: {adjustmentValue > 0 ? "+" : ""}
              {formatCurrencyDisplay(adjustmentValue)}
            </p>
          ) : null}
          <p className="text-base font-semibold">Total final: {formatCurrencyDisplay(totalValue)}</p>
        </div>
      </Card>

      {fieldError ? <p className="text-sm text-rose-600">{fieldError}</p> : null}
      {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}

      {showInlineSubmit ? (
        <button
          className="w-full rounded-[18px] bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-soft"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Salvando..." : submitLabel}
        </button>
      ) : (
        <button className="hidden" disabled={isSubmitting} type="submit">
          {submitLabel}
        </button>
      )}
    </form>
  );
}
