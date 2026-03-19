import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ClientForm } from "@/components/clients/client-form";
import { MobilePageHeader } from "@/components/layout/mobile-page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InlineStateCard } from "@/components/ui/inline-state-card";
import { useClientMutations } from "@/hooks/use-client-mutations";
import { useClientQuery } from "@/hooks/use-client-query";
import type { ClientInput } from "@/services/clientService";

export function ClientFormPage() {
  const navigate = useNavigate();
  const { clientId } = useParams();
  const isEditing = Boolean(clientId);
  const {
    data: client,
    error: clientError,
    isError,
    isLoading,
  } = useClientQuery(clientId);
  const {
    createClient,
    createError,
    isCreating,
    isUpdating,
    updateClient,
    updateError,
  } = useClientMutations();

  const initialValues = useMemo(
    () => ({
      nome: client?.nome ?? "",
      telefone: client?.telefone ?? "",
      email: client?.email ?? "",
      observacoes: client?.observacoes ?? "",
      ativo: client?.ativo ?? true,
    }),
    [client],
  );

  async function handleSubmit(values: ClientInput) {
    try {
      if (isEditing && clientId) {
        await updateClient({ clientId, input: values });
      } else {
        await createClient(values);
      }

      navigate("/clientes", { replace: true });
    } catch {
      return;
    }
  }

  if (isEditing && isLoading) {
    return <InlineStateCard message="Carregando cliente..." />;
  }

  if (isEditing && isError) {
    return (
      <Card>
        <h1 className="text-xl font-semibold text-ink">Nao foi possivel abrir o cliente</h1>
        <p className="mt-2 text-sm text-rose-600">{clientError.message}</p>
        <Link className="mt-4 inline-block" to="/clientes">
          <Button>Voltar</Button>
        </Link>
      </Card>
    );
  }

  return (
    <section className="space-y-4">
      <MobilePageHeader
        leading={
          <Link className="inline-flex" to="/clientes">
            <Button
              aria-label="Voltar para clientes"
              className="min-h-8 h-8 w-8 rounded-full p-0 md:min-h-[46px] md:h-[46px] md:w-auto md:rounded-[18px] md:px-4"
              variant="secondary"
            >
              <span className="md:hidden">&lt;</span>
              <span className="hidden md:inline">Voltar</span>
            </Button>
          </Link>
        }
        subtitle={isEditing ? "Editar cliente" : "Novo cliente"}
        title="Clientes"
      />

      <ClientForm
        description={
          isEditing
            ? "Ajuste os dados do cliente sem perder o contexto da agenda no celular."
            : "Cadastre um novo cliente vinculado automaticamente a organizacao do usuario logado."
        }
        errorMessage={createError?.message ?? updateError?.message ?? null}
        initialValues={initialValues}
        isSubmitting={isCreating || isUpdating}
        onSubmit={handleSubmit}
        submitLabel={isEditing ? "Salvar alteracoes" : "Cadastrar cliente"}
        title={isEditing ? "Editar cliente" : "Novo cliente"}
      />
    </section>
  );
}
