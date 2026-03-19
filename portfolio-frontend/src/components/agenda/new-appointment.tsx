import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Card } from "@/components/ui/card";
import { CalendarIcon, ChevronDownIcon, ClockIcon } from "@/components/ui/icons";
import type {
  AppointmentInput,
  AppointmentPaymentStatus,
  AppointmentStatus,
} from "@/services/appointmentService";
import type { Client } from "@/services/clientService";
import type { Professional } from "@/services/professionalService";
import type { BusinessService } from "@/services/serviceService";
import { getTodayDate } from "@/utils/agenda";
import { formatDateBR } from "@/utils/date";

type NewAppointmentValues = {
  clienteId: string;
  servicoId: string;
  professionalId: string;
  data: string;
  horarioInicial: string;
  horarioFinal: string;
  valor: string;
  status: AppointmentStatus;
  paymentStatus: AppointmentPaymentStatus;
  observacoes: string;
  repetir: string;
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
  servicoId: "",
  professionalId: "",
  data: getTodayDate(),
  horarioInicial: "",
  horarioFinal: "",
  valor: "",
  status: "confirmado",
  paymentStatus: "pendente",
  observacoes: "",
  repetir: "nao_repetir",
};

function formatSummaryDate(date: string) {
  return date ? formatDateBR(date) : "--";
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
  });
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    setValues({
      ...EMPTY_VALUES,
      ...initialValues,
    });
  }, [initialValues]);

  const selectedService = useMemo(
    () => services.find((service) => service.id === values.servicoId) ?? null,
    [services, values.servicoId],
  );
  const availableProfessionals = useMemo(
    () =>
      values.servicoId
        ? professionals.filter((professional) => professional.serviceIds.includes(values.servicoId))
        : [],
    [professionals, values.servicoId],
  );

  useEffect(() => {
    if (!selectedService) {
      return;
    }

    setValues((current) => {
      if (current.valor) {
        return current;
      }

      return {
        ...current,
        valor: String(selectedService.valorPadrao),
      };
    });
  }, [selectedService]);

  useEffect(() => {
    if (!values.servicoId) {
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
  }, [availableProfessionals, values.servicoId]);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!values.clienteId) {
      setFieldError("Cliente e obrigatorio.");
      return;
    }

    if (!values.servicoId) {
      setFieldError("Servico e obrigatorio.");
      return;
    }

    if (!values.data) {
      setFieldError("Data e obrigatoria.");
      return;
    }

    if (availableProfessionals.length > 1 && !values.professionalId) {
      setFieldError("Selecione o profissional responsavel.");
      return;
    }

    if (values.data < getTodayDate()) {
      setFieldError("Nao e permitido agendar em data passada.");
      return;
    }

    if (!values.horarioInicial || !values.horarioFinal) {
      setFieldError("Horario inicial e final sao obrigatorios.");
      return;
    }

    if (values.horarioFinal <= values.horarioInicial) {
      setFieldError("Horario final deve ser maior que o inicial.");
      return;
    }

    const parsedValue = values.valor ? Number(values.valor) : undefined;

    if (parsedValue !== undefined && (!Number.isFinite(parsedValue) || parsedValue < 0)) {
      setFieldError("Valor invalido.");
      return;
    }

    await onSubmit({
      clienteId: values.clienteId,
      servicoId: values.servicoId,
      professionalId: values.professionalId || null,
      data: values.data,
      horarioInicial: values.horarioInicial,
      horarioFinal: values.horarioFinal,
      valor: parsedValue,
      status: values.status,
      paymentStatus: values.paymentStatus,
      observacoes: values.observacoes,
      recurrence:
        values.repetir === "toda_semana"
          ? { type: "weekly", count: 4 }
          : values.repetir === "todo_mes"
            ? { type: "monthly", count: 3 }
            : undefined,
    });
  }

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

      <label className="block space-y-2">
        <span className="text-sm font-medium text-ink">Servico</span>
        <div className="relative">
          <select
            className="app-select appearance-none pr-10 text-base"
            onChange={(event) => updateField("servicoId", event.target.value)}
            value={values.servicoId}
          >
            <option value="">Nome do servico</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.nome}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
      </label>

      {values.servicoId ? (
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
                <option value="">Nenhum funcionario vinculado a este servico</option>
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

      <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2 sm:gap-3">
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

        <label className="block min-w-0 space-y-2">
          <span className="text-sm font-medium text-ink">Fim</span>
          <div className="relative">
            <input
              className="app-input px-3 pr-8 text-sm sm:px-4 sm:pr-10 sm:text-base"
              onChange={(event) => updateField("horarioFinal", event.target.value)}
              type="time"
              value={values.horarioFinal}
            />
            <ClockIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 sm:right-4" />
          </div>
        </label>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-ink">Valor (R$)</span>
        <input
          className="app-input text-base"
          min="0"
          onChange={(event) => updateField("valor", event.target.value)}
          step="0.01"
          type="number"
          value={values.valor}
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-ink">Status de pagamento</span>
        <div className="relative">
          <select
            className="app-select appearance-none pr-10 text-base"
            onChange={(event) =>
              updateField("paymentStatus", event.target.value as AppointmentPaymentStatus)
            }
            value={values.paymentStatus}
          >
            <option value="pendente">Pendente</option>
            <option value="pago">Pago</option>
          </select>
          <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
      </label>

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
              onChange={(event) => updateField("repetir", event.target.value)}
              value={values.repetir}
            >
              <option value="nao_repetir">Nao repetir</option>
              <option value="toda_semana">Toda semana (4x)</option>
              <option value="todo_mes">Todo mes (3x)</option>
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
          <p>Status: Confirmado</p>
          <p>Pagamento: {values.paymentStatus === "pago" ? "Pago" : "Pendente"}</p>
          {allowRecurrence && values.repetir !== "nao_repetir" ? (
            <p>Repeticao: {values.repetir === "todo_mes" ? "Todo mes (3x)" : "Toda semana (4x)"}</p>
          ) : null}
          <p>Data: {formatSummaryDate(values.data)}</p>
          {values.professionalId ? (
            <p>
              Profissional:{" "}
              {availableProfessionals.find((professional) => professional.id === values.professionalId)?.nome ??
                "--"}
            </p>
          ) : null}
          <p>Horario: {values.horarioInicial || "--"} - {values.horarioFinal || "--"}</p>
          <p>Valor: R$ {Number(values.valor || 0).toFixed(2)}</p>
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
