import { useLocation, useNavigate } from "react-router-dom";
import { NewAppointment } from "@/components/agenda/new-appointment";
import { MobilePageHeader } from "@/components/layout/mobile-page-header";
import { Card } from "@/components/ui/card";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { ChevronLeftIcon } from "@/components/ui/icons";
import { useAppointmentMutations } from "@/hooks/use-appointment-mutations";
import { useClientsQuery } from "@/hooks/use-clients-query";
import { useProfessionalsQuery } from "@/hooks/use-professionals-query";
import { useServicesQuery } from "@/hooks/use-services-query";
import type { AppointmentInput } from "@/services/appointmentService";
import { getTodayDate } from "@/utils/agenda";

type NewAppointmentLocationState = {
  selectedDate?: string;
};

const FORM_ID = "new-appointment-form";

export function NewAppointmentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedDate =
    (location.state as NewAppointmentLocationState | null)?.selectedDate ?? getTodayDate();
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
  const { createAppointment, createError, isCreating } = useAppointmentMutations();

  async function handleSubmit(values: AppointmentInput) {
    try {
      const result = await createAppointment(values);
      navigate("/agenda", {
        replace: true,
        state: {
          successMessage:
            result.createdCount > 1
              ? `${result.createdCount} agendamentos criados com sucesso.`
              : "Agendamento criado com sucesso.",
        },
      });
    } catch {
      return;
    }
  }

  if (isLoadingClients || isLoadingServices || isLoadingProfessionals) {
    return (
      <Card className="bg-white">
        <p className="text-sm text-slate-500">Carregando dados do agendamento...</p>
      </Card>
    );
  }

  if (isClientsError || isServicesError || isProfessionalsError) {
    return (
      <Card className="app-message-error">
        <p className="text-sm font-medium">
          {clientsError?.message ??
            servicesError?.message ??
            professionalsError?.message ??
            "Nao foi possivel carregar os dados do agendamento."}
        </p>
      </Card>
    );
  }

  return (
    <section className="space-y-4 pb-24">
      <MobilePageHeader
        leading={
          <button className="text-slate-500" onClick={() => navigate("/agenda")} type="button">
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
        }
        title="Novo Agendamento"
      />

      <NewAppointment
        clients={clients}
        description=""
        errorMessage={createError?.message ?? null}
        formId={FORM_ID}
        initialValues={{ data: selectedDate }}
        isSubmitting={isCreating}
        onSubmit={handleSubmit}
        professionals={professionals}
        services={services}
        showInlineSubmit={false}
        submitLabel="Salvar agendamento"
        title=""
      />

      <FloatingActionButton
        disabled={isCreating}
        form={FORM_ID}
        label={isCreating ? "Salvando..." : "Salvar"}
        type="submit"
      />
    </section>
  );
}
