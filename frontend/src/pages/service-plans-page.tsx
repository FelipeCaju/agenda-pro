import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MobilePageHeader } from "@/components/layout/mobile-page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { useServicesQuery } from "@/hooks/use-services-query";
import { apiClient } from "@/services/apiClient";
import { formatCurrencyInput, formatCurrencyValue, parseCurrencyInput } from "@/utils/currency-input";
import { ServicePlanMemberships } from "./service-plan-memberships";

type Plan = { id: string; name: string; description: string; priceCents: number; durationMonths: number; active: boolean; serviceIds: string[] };
type Draft = Omit<Plan, "id" | "priceCents"> & { price: string };
const emptyDraft: Draft = { name: "", description: "", price: "", durationMonths: 1, active: true, serviceIds: [] };

export function ServicePlansPage() {
  const cache = useQueryClient();
  const { data: services = [] } = useServicesQuery();
  const { data: plans = [], error, isLoading } = useQuery({ queryKey: ["service-plans"], queryFn: async () => (await apiClient.get<Plan[]>("/service-plans")).data });
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const save = useMutation({
    mutationFn: async (input: Omit<Plan, "id">) => editingId ? apiClient.put(`/service-plans/${editingId}`, input) : apiClient.post("/service-plans", input),
    onSuccess: async () => { await cache.invalidateQueries({ queryKey: ["service-plans"] }); setShowForm(false); setEditingId(null); setDraft(emptyDraft); },
    onError: (error) => setErrorMessage(error.message),
  });
  function edit(plan: Plan) {
    setEditingId(plan.id);
    setDraft({ name: plan.name, description: plan.description, price: formatCurrencyValue(plan.priceCents / 100), durationMonths: plan.durationMonths, active: plan.active, serviceIds: plan.serviceIds });
    setErrorMessage(""); setShowForm(true);
  }
  function create() {
    setDraft(emptyDraft); setEditingId(null); setErrorMessage(""); setShowForm(true);
  }
  function submit(event: FormEvent) {
    event.preventDefault(); setErrorMessage("");
    const amount = parseCurrencyInput(draft.price);
    if (!amount || amount <= 0 || !draft.name.trim() || !draft.serviceIds.length) { setErrorMessage("Informe nome, valor e pelo menos um servico."); return; }
    save.mutate({ name: draft.name, description: draft.description, priceCents: Math.round(amount * 100), durationMonths: draft.durationMonths, active: draft.active, serviceIds: draft.serviceIds });
  }
  return <section className="space-y-4 pb-8">
    <MobilePageHeader title="Planos de atendimento" subtitle="Cadastre os planos oferecidos aos clientes" action={!showForm ? <Button className="hidden xl:inline-flex" type="button" onClick={create}>Novo plano</Button> : undefined} />
    {showForm ? <Card><form className="space-y-4" onSubmit={submit}>
      <h2 className="text-lg font-semibold">{editingId ? "Editar plano" : "Novo plano"}</h2>
      <label className="block space-y-2"><span>Nome</span><input className="app-input" value={draft.name} maxLength={160} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
      <label className="block space-y-2"><span>Descricao</span><textarea className="app-textarea" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></label>
      <div className="grid gap-4 md:grid-cols-2"><label className="block space-y-2"><span>Valor do periodo</span><input className="app-input" inputMode="numeric" value={draft.price} onChange={(e) => setDraft({ ...draft, price: formatCurrencyInput(e.target.value) })} /></label>
      <label className="block space-y-2"><span>Duracao</span><select className="app-input" value={draft.durationMonths} onChange={(e) => setDraft({ ...draft, durationMonths: Number(e.target.value) })}><option value={1}>Mensal</option><option value={2}>Bimestral</option><option value={6}>Semestral</option><option value={12}>Anual</option></select></label></div>
      <fieldset><legend className="mb-2 font-medium">Servicos do plano</legend><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{Array.from({ length: Math.ceil(services.length / 5) }, (_, column) => <div className="space-y-2" key={column}>{services.slice(column * 5, column * 5 + 5).map((service) => <label className="flex items-center gap-2" key={service.id}><input type="checkbox" className="app-checkbox" checked={draft.serviceIds.includes(service.id)} onChange={(e) => setDraft({ ...draft, serviceIds: e.target.checked ? [...draft.serviceIds, service.id] : draft.serviceIds.filter((id) => id !== service.id) })} />{service.nome}</label>)}</div>)}</div></fieldset>
      {errorMessage ? <p className="text-sm text-rose-600" role="alert">{errorMessage}</p> : null}
      <div className="flex flex-wrap items-center gap-3"><Button disabled={save.isPending} type="submit">{save.isPending ? "Salvando..." : "Salvar plano"}</Button><Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button><label className="flex items-center gap-2"><input type="checkbox" className="app-checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} />Plano ativo</label></div>
    </form></Card> : null}
    {!showForm && isLoading ? <p>Carregando planos...</p> : null}{!showForm && error ? <p className="text-rose-600">{error.message}</p> : null}
    {!showForm && plans.map((plan) => <Card key={plan.id}><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">{plan.name}</h2><p className="text-sm text-slate-500">{(plan.priceCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} · {plan.durationMonths} {plan.durationMonths === 1 ? "mes" : "meses"} · {plan.active ? "Ativo" : "Inativo"}</p><p className="text-sm text-slate-500">{plan.description}</p></div><Button variant="secondary" type="button" onClick={() => edit(plan)}>Editar</Button></div></Card>)}
    {!showForm ? <ServicePlanMemberships plans={plans} /> : null}
    {!showForm ? <FloatingActionButton label="Novo" onClick={create} /> : null}
  </section>;
}
