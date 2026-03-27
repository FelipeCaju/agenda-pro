import { useMemo } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { MobilePageHeader } from "@/components/layout/mobile-page-header";
import { ServiceForm } from "@/components/services/service-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { InlineStateCard } from "@/components/ui/inline-state-card";
import { useServiceMutations } from "@/hooks/use-service-mutations";
import { useServiceQuery } from "@/hooks/use-service-query";
import type { BusinessServiceInput } from "@/services/serviceService";

const FORM_ID = "service-form";

export function ServiceFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { serviceId } = useParams();
  const isEditing = Boolean(serviceId);
  const { data: service, error: serviceError, isError, isLoading } = useServiceQuery(serviceId);
  const {
    createError,
    createService,
    isCreating,
    isUpdating,
    updateError,
    updateService,
  } = useServiceMutations();

  const initialValues = useMemo(
    () => ({
      nome: service?.nome ?? "",
      descricao: service?.descricao ?? "",
      duracaoMinutos: String(service?.duracaoMinutos ?? 30),
      valorPadrao: String(service?.valorPadrao ?? 0),
      cor: service?.cor ?? "#1d8cf8",
      ativo: service?.ativo ?? true,
    }),
    [service],
  );

  async function handleSubmit(values: BusinessServiceInput) {
    try {
      if (isEditing && serviceId) {
        await updateService({ serviceId, input: values });
        navigate("/servicos", {
          replace: true,
          state: { successMessage: "Servico atualizado com sucesso." },
        });
      } else {
        await createService(values);
        navigate("/servicos", {
          replace: true,
          state: { successMessage: "Servico criado com sucesso." },
        });
      }
    } catch {
      return;
    }
  }

  if (isEditing && isLoading) {
    return <InlineStateCard message="Carregando servico..." />;
  }

  if (isEditing && isError) {
    return (
      <Card>
        <h1 className="text-xl font-semibold text-ink">Nao foi possivel abrir o servico</h1>
        <p className="mt-2 text-sm text-rose-600">{serviceError.message}</p>
        <Link className="mt-4 inline-block" to="/servicos" state={location.state}>
          <Button>Voltar</Button>
        </Link>
      </Card>
    );
  }

  return (
    <section className="space-y-4 pb-24">
      <MobilePageHeader
        leading={
          <Link className="inline-flex" to="/servicos">
            <Button
              aria-label="Voltar para servicos"
              className="min-h-8 h-8 w-8 rounded-full p-0 md:min-h-[46px] md:h-[46px] md:w-auto md:rounded-[18px] md:px-4"
              variant="secondary"
            >
              <span className="md:hidden">&lt;</span>
              <span className="hidden md:inline">Voltar</span>
            </Button>
          </Link>
        }
        subtitle={isEditing ? "Editar servico" : "Novo servico"}
        title="Servicos"
      />

      <ServiceForm
        description={
          isEditing
            ? "Ajuste nome, cor, duracao e valor sem sair do fluxo mobile."
            : "Cadastre um novo servico vinculado automaticamente a organizacao do usuario logado."
        }
        errorMessage={createError?.message ?? updateError?.message ?? null}
        formId={FORM_ID}
        initialValues={initialValues}
        isSubmitting={isCreating || isUpdating}
        onSubmit={handleSubmit}
        showInlineSubmit={false}
        submitLabel={isEditing ? "Salvar alteracoes" : "Cadastrar servico"}
        title={isEditing ? "Editar servico" : "Novo servico"}
      />

      <FloatingActionButton
        disabled={isCreating || isUpdating}
        form={FORM_ID}
        label={isCreating || isUpdating ? "Salvando..." : isEditing ? "Salvar" : "Cadastrar"}
        type="submit"
      />
    </section>
  );
}
