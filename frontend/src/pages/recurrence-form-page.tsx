import { useMemo } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { MobilePageHeader } from "@/components/layout/mobile-page-header";
import { RecurrenceForm } from "@/components/recurrence/recurrence-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InlineStateCard } from "@/components/ui/inline-state-card";
import { useClientsQuery } from "@/hooks/use-clients-query";
import { useRecurrenceMutations } from "@/hooks/use-recurrence-mutations";
import { useRecurringProfileQuery } from "@/hooks/use-recurrence-query";
import { useSettingsQuery } from "@/hooks/use-settings-query";
import { useServicesQuery } from "@/hooks/use-services-query";
import type { RecurringProfileInput } from "@/services/recurrenceService";

export function RecurrenceFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profileId } = useParams();
  const isEditing = Boolean(profileId);
  const { data: profile, error: profileError, isError, isLoading } = useRecurringProfileQuery(profileId);
  const { data: clients = [] } = useClientsQuery();
  const { data: services = [] } = useServicesQuery();
  const { data: settings } = useSettingsQuery();
  const {
    createProfile,
    updateProfile,
    isCreatingProfile,
    isUpdatingProfile,
    createProfileError,
    updateProfileError,
  } = useRecurrenceMutations();

  const initialValues = useMemo(
    () => ({
      clientId: profile?.clientId ?? "",
      serviceId: profile?.serviceId ?? "",
      descricao: profile?.descricao ?? "",
      valor: profile ? String(profile.valor) : "",
      dataInicio: profile?.dataInicio ?? new Date().toISOString().slice(0, 10),
      dataFim: profile?.dataFim ?? "",
      diaCobranca: profile?.diaCobranca ? String(profile.diaCobranca) : "",
      chavePix: profile?.chavePix ?? settings?.recurringChavePixPadrao ?? "",
      observacoes: profile?.observacoes ?? "",
      ativo: profile?.ativo ?? true,
    }),
    [profile, settings?.recurringChavePixPadrao],
  );

  async function handleSubmit(values: RecurringProfileInput) {
    if (isEditing && profileId) {
      await updateProfile({ profileId, input: values });
    } else {
      await createProfile(values);
    }

    navigate("/recorrencia", {
      replace: true,
      state: {
        successMessage: isEditing
          ? "Recorrencia atualizada com sucesso."
          : "Recorrencia criada com sucesso.",
      },
    });
  }

  if (isEditing && isLoading) {
    return <InlineStateCard message="Carregando recorrencia..." />;
  }

  if (isEditing && isError) {
    return (
      <Card>
        <h1 className="text-xl font-semibold text-ink">Nao foi possivel abrir a recorrencia</h1>
        <p className="mt-2 text-sm text-rose-600">{profileError.message}</p>
        <Link className="mt-4 inline-block" to="/recorrencia" state={location.state}>
          <Button>Voltar</Button>
        </Link>
      </Card>
    );
  }

  return (
    <section className="space-y-4 pb-24">
      <MobilePageHeader
        leading={
          <Link className="inline-flex" to="/recorrencia">
            <Button
              aria-label="Voltar para recorrencia"
              className="min-h-8 h-8 w-8 rounded-full p-0 md:min-h-[46px] md:h-[46px] md:w-auto md:rounded-[18px] md:px-4"
              variant="secondary"
            >
              <span className="md:hidden">&lt;</span>
              <span className="hidden md:inline">Voltar</span>
            </Button>
          </Link>
        }
        subtitle={isEditing ? "Editar recorrencia" : "Nova recorrencia"}
        title="Recorrencia"
      />

      <RecurrenceForm
        clients={clients}
        description={
          isEditing
            ? "Ajuste vigencia, valor e dia do pagamento sem encostar na agenda tradicional."
            : "Cadastre uma recorrencia usando clientes e servicos que ja existem no AgendaPro."
        }
        errorMessage={createProfileError?.message ?? updateProfileError?.message ?? null}
        initialValues={initialValues}
        isSubmitting={isCreatingProfile || isUpdatingProfile}
        onSubmit={handleSubmit}
        services={services}
        submitLabel={isEditing ? "Salvar alteracoes" : "Cadastrar recorrencia"}
        title={isEditing ? "Editar recorrencia" : "Nova recorrencia"}
      />
    </section>
  );
}
