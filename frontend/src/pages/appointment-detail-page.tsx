import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppointmentDetail } from "@/components/agenda/appointment-detail";
import { NewAppointment } from "@/components/agenda/new-appointment";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InlineStateCard } from "@/components/ui/inline-state-card";
import { useAppointmentMutations } from "@/hooks/use-appointment-mutations";
import { useAppointmentQuery } from "@/hooks/use-appointment-query";
import { useClientsQuery } from "@/hooks/use-clients-query";
import { useProfessionalsQuery } from "@/hooks/use-professionals-query";
import { useServicesQuery } from "@/hooks/use-services-query";
import type {
  AppointmentDeleteScope,
  AppointmentInput,
  AppointmentPaymentStatus,
} from "@/services/appointmentService";

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

export function AppointmentDetailPage() {
  const navigate = useNavigate();
  const { appointmentId } = useParams();
  const [successMessage, setSuccessMessage] = useState("");
  const { data: appointment, error, isError, isLoading } = useAppointmentQuery(appointmentId);
  const {
    data: clients = [],
    error: clientsError,
    isError: isClientsError,
    isLoading: isLoadingClients,
  } = useClientsQuery();
  const {
    data: services = [],
    error: servicesError,
    isError: isServicesError,
    isLoading: isLoadingServices,
  } = useServicesQuery();
  const {
    data: professionals = [],
    error: professionalsError,
    isError: isProfessionalsError,
    isLoading: isLoadingProfessionals,
  } = useProfessionalsQuery();
  const {
    deleteAppointment,
    deleteError,
    isDeleting,
    isUpdatingPaymentStatus,
    isUpdating,
    paymentStatusError,
    updateAppointment,
    updateAppointmentPaymentStatus,
    updateError,
  } = useAppointmentMutations();

  const initialValues = useMemo(
    () => ({
      clienteId: appointment?.clienteId ?? "",
      professionalId: appointment?.profissionalId ?? "",
      data: appointment?.data ?? "",
      horarioInicial: appointment?.horarioInicial ?? "",
      valorTotal: appointment ? formatCurrencyValue(appointment.valor) : "",
      status: appointment?.status ?? "pendente",
      paymentStatus: appointment?.paymentStatus ?? "pendente",
      observacoes: appointment?.observacoes ?? "",
      quoteId: appointment?.quoteId ?? "",
      serviceOrderId: appointment?.serviceOrderId ?? "",
      items:
        appointment?.items.map((item) => ({
          id: item.id,
          serviceId: item.servicoId ?? "",
          durationMinutes: String(item.duracaoMinutos ?? 0),
          unitPrice: formatCurrencyValue(item.valorUnitario),
        })) ?? [],
    }),
    [appointment],
  );

  async function handleSubmit(values: AppointmentInput) {
    if (!appointmentId) {
      return;
    }

    try {
      await updateAppointment({
        appointmentId,
        input: values,
      });

      navigate("/agenda", {
        replace: true,
        state: { successMessage: "Agendamento atualizado com sucesso." },
      });
    } catch {
      return;
    }
  }

  async function handleDelete(scope: AppointmentDeleteScope) {
    if (!appointmentId) {
      return;
    }

    try {
      await deleteAppointment({ appointmentId, scope });
      navigate("/agenda", {
        replace: true,
        state: {
          successMessage:
            scope === "series"
              ? "Serie de agendamentos excluida com sucesso."
              : "Agendamento excluido com sucesso.",
        },
      });
    } catch {
      return;
    }
  }

  async function handlePaymentStatusChange(paymentStatus: AppointmentPaymentStatus) {
    if (!appointmentId) {
      return;
    }

    try {
      await updateAppointmentPaymentStatus({ appointmentId, paymentStatus });
      setSuccessMessage("Status de pagamento atualizado com sucesso.");
    } catch {
      return;
    }
  }

  if (isLoading || isLoadingClients || isLoadingServices || isLoadingProfessionals) {
    return <InlineStateCard message="Carregando agendamento..." />;
  }

  if (isClientsError || isServicesError || isProfessionalsError) {
    return (
      <InlineStateCard
        message={
          clientsError?.message ??
          servicesError?.message ??
          professionalsError?.message ??
          "Nao foi possivel carregar os dados auxiliares do agendamento."
        }
        tone="error"
      />
    );
  }

  if (isError || !appointment) {
    return (
      <InlineStateCard
        message={error?.message ?? "Agendamento nao encontrado."}
        tone="error"
      />
    );
  }

  return (
    <section className="space-y-4">
      <Button
        className="w-full sm:w-auto"
        onClick={() => navigate("/agenda")}
        type="button"
        variant="secondary"
      >
        Voltar para agenda
      </Button>

      {successMessage ? (
        <Card className="app-message-success">
          <p className="text-sm font-medium text-emerald-700">{successMessage}</p>
        </Card>
      ) : null}

      <AppointmentDetail
        appointment={appointment}
        isDeleting={isDeleting}
        isUpdatingPaymentStatus={isUpdatingPaymentStatus}
        onDelete={handleDelete}
        onPaymentStatusChange={handlePaymentStatusChange}
      />

      <NewAppointment
        clients={clients}
        description="Revise os dados do atendimento sem perder o contexto da agenda."
        errorMessage={
          updateError?.message ??
          deleteError?.message ??
          paymentStatusError?.message ??
          null
        }
        initialValues={initialValues}
        isSubmitting={isUpdating}
      onSubmit={handleSubmit}
      professionals={professionals}
      services={services}
      allowRecurrence={false}
      submitLabel="Salvar alteracoes"
      title="Editar agendamento"
    />
    </section>
  );
}
