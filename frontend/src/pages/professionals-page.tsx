import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { MobilePageHeader } from "@/components/layout/mobile-page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { useProfessionalMutations } from "@/hooks/use-professional-mutations";
import { useProfessionalsQuery } from "@/hooks/use-professionals-query";
import { useServicesQuery } from "@/hooks/use-services-query";
import type { ProfessionalInput } from "@/services/professionalService";

const EMPTY_VALUES: ProfessionalInput = {
  nome: "",
  atividade: "",
  ativo: true,
  serviceIds: [],
};

export function ProfessionalsPage() {
  const navigate = useNavigate();
  const { data: professionals = [], error, isError, isLoading } = useProfessionalsQuery();
  const { data: services = [] } = useServicesQuery();
  const {
    createProfessional,
    updateProfessional,
    createError,
    updateError,
    isCreating,
    isUpdating,
  } = useProfessionalMutations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [values, setValues] = useState<ProfessionalInput>(EMPTY_VALUES);
  const [successMessage, setSuccessMessage] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);

  const selectedProfessional = useMemo(
    () => professionals.find((professional) => professional.id === selectedId) ?? null,
    [professionals, selectedId],
  );

  useEffect(() => {
    if (!selectedProfessional) {
      setValues(EMPTY_VALUES);
      return;
    }

    setValues({
      nome: selectedProfessional.nome,
      atividade: selectedProfessional.atividade,
      ativo: selectedProfessional.ativo,
      serviceIds: selectedProfessional.serviceIds,
    });
  }, [selectedProfessional]);

  function updateField<K extends keyof ProfessionalInput>(field: K, value: ProfessionalInput[K]) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
    setFieldError(null);
    setSuccessMessage("");
  }

  function toggleService(serviceId: string) {
    setValues((current) => ({
      ...current,
      serviceIds: current.serviceIds.includes(serviceId)
        ? current.serviceIds.filter((currentId) => currentId !== serviceId)
        : [...current.serviceIds, serviceId],
    }));
    setFieldError(null);
    setSuccessMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!values.nome.trim()) {
      setFieldError("Nome do funcionario e obrigatorio.");
      return;
    }

    try {
      if (selectedProfessional) {
        await updateProfessional({
          professionalId: selectedProfessional.id,
          input: values,
        });
        setSuccessMessage("Funcionario atualizado com sucesso.");
      } else {
        await createProfessional(values);
        setSuccessMessage("Funcionario criado com sucesso.");
      }
    } catch {
      return;
    }
  }

  function handleNewProfessional() {
    setSelectedId(null);
    setValues(EMPTY_VALUES);
    setFieldError(null);
    setSuccessMessage("");
  }

  return (
    <section className="space-y-4">
      <MobilePageHeader
        leading={
          <Button onClick={() => navigate("/configuracoes")} type="button" variant="secondary">
            Voltar
          </Button>
        }
        subtitle="Equipe que atende seus servicos"
        title="Funcionarios"
      />

      {successMessage ? (
        <Card className="app-message-success">
          <p className="text-sm font-medium text-emerald-700">{successMessage}</p>
        </Card>
      ) : null}

      {isLoading ? (
        <Card>
          <p className="text-sm text-slate-500">Carregando funcionarios...</p>
        </Card>
      ) : null}

      {isError ? (
        <Card className="app-message-error">
          <p className="text-sm font-medium">{error.message}</p>
        </Card>
      ) : null}

      <div className="space-y-3">
        {professionals.map((professional) => (
          <button
            className="block w-full text-left"
            key={professional.id}
            onClick={() => setSelectedId(professional.id)}
            type="button"
          >
            <Card
              className={
                selectedId === professional.id ? "border-brand-200 ring-2 ring-brand-100" : ""
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-semibold text-ink">{professional.nome}</h3>
                  <p className="text-sm text-slate-500">
                    {professional.atividade || "Atividade nao informada"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    professional.ativo
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {professional.ativo ? "Ativo" : "Inativo"}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-500">
                {professional.serviceIds.length
                  ? `${professional.serviceIds.length} servico(s) vinculado(s)`
                  : "Nenhum servico vinculado ainda"}
              </p>
            </Card>
          </button>
        ))}

        {!isLoading && !professionals.length ? (
          <Card>
            <p className="text-sm text-slate-500">Nenhum funcionario cadastrado ainda.</p>
          </Card>
        ) : null}
      </div>

      <Card>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
          {selectedProfessional ? "Editar funcionario" : "Novo funcionario"}
        </p>
        <h3 className="mt-1 text-lg font-semibold text-ink">
          {selectedProfessional ? selectedProfessional.nome : "Cadastrar funcionario"}
        </h3>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink" htmlFor="professional-name">
              Nome
            </label>
            <input
              className="app-input"
              id="professional-name"
              onChange={(event) => updateField("nome", event.target.value)}
              placeholder="Nome do funcionario"
              value={values.nome}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-ink" htmlFor="professional-activity">
              Atividade
            </label>
            <input
              className="app-input"
              id="professional-activity"
              onChange={(event) => updateField("atividade", event.target.value)}
              placeholder="Ex.: Cabeleireiro, Manicure"
              value={values.atividade}
            />
          </div>

          <label className="app-toggle-panel">
            <input
              checked={values.ativo}
              className="app-checkbox"
              onChange={(event) => updateField("ativo", event.target.checked)}
              type="checkbox"
            />
            Funcionario ativo
          </label>

          <div className="space-y-3">
            <p className="text-sm font-medium text-ink">Servicos atendidos</p>
            <div className="flex flex-wrap gap-2">
              {services.map((service) => {
                const isSelected = values.serviceIds.includes(service.id);

                return (
                  <button
                    className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                      isSelected
                        ? "border-brand-200 bg-brand-50 text-brand-700"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                    key={service.id}
                    onClick={() => toggleService(service.id)}
                    type="button"
                  >
                    {service.nome}
                  </button>
                );
              })}
            </div>
            {!services.length ? (
              <p className="text-sm text-slate-500">
                Cadastre servicos primeiro para vincular aos funcionarios.
              </p>
            ) : null}
          </div>

          {fieldError ? <p className="text-sm text-rose-600">{fieldError}</p> : null}
          {createError ? <p className="text-sm text-rose-600">{createError.message}</p> : null}
          {updateError ? <p className="text-sm text-rose-600">{updateError.message}</p> : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button className="w-full sm:w-auto" disabled={isCreating || isUpdating} type="submit">
              {isCreating || isUpdating
                ? "Salvando..."
                : selectedProfessional
                  ? "Salvar funcionario"
                  : "Cadastrar funcionario"}
            </Button>
            {selectedProfessional ? (
              <Button onClick={handleNewProfessional} type="button" variant="secondary">
                Novo cadastro
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      <FloatingActionButton label="Novo" onClick={handleNewProfessional} />
    </section>
  );
}
