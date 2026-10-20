import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useClientsQuery } from "@/hooks/use-clients-query";
import { useProfessionalsQuery } from "@/hooks/use-professionals-query";
import { useServicesQuery } from "@/hooks/use-services-query";
import { ApiError, apiClient } from "@/services/apiClient";

type Plan = { id: string; name: string; priceCents: number; active: boolean; appointmentMode: "weekly" | "quantity"; appointmentCount: number | null; serviceIds: string[] };
type Membership = { id: string; planName: string; clientName: string; endDate: string; startTime: string; reminderStatus: string | null; reminderError: string | null };
type Preview = { planName: string; priceCents: number; startDate: string; endDateExclusive: string; appointments: string[] };
type Conflict = { date: string; message: string };

function displayDate(date: string) { return date.split("-").reverse().join("/"); }
function displayMoney(cents: number) { return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

export function ServicePlanMemberships({ plans }: { plans: Plan[] }) {
  const cache = useQueryClient();
  const { data: clients = [] } = useClientsQuery();
  const { data: professionals = [] } = useProfessionalsQuery();
  const { data: services = [] } = useServicesQuery();
  const { data: memberships = [], error: listError } = useQuery({ queryKey: ["service-plan-memberships"], queryFn: async () => (await apiClient.get<Membership[]>("/service-plan-memberships")).data });
  const [showForm, setShowForm] = useState(false);
  const [input, setInput] = useState({ planId: "", clientId: "", professionalId: "", startDate: "", startTime: "" });
  const [preview, setPreview] = useState<Preview | null>(null);
  const [renewalId, setRenewalId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [success, setSuccess] = useState("");
  const chosenPlan = plans.find((plan) => plan.id === input.planId);
  const planServices = chosenPlan?.serviceIds.map((id) => services.find((service) => service.id === id)).filter((service) => service !== undefined) ?? [];
  const duration = planServices.reduce((total, service) => total + Number(service.duracaoMinutos), 0);
  const [hours, minutes] = input.startTime.split(":").map(Number);
  const endMinutes = hours * 60 + minutes + duration;
  const endTime = input.startTime && duration && endMinutes < 1440 ? `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}` : "—";

  async function check(event?: FormEvent, id?: string) {
    event?.preventDefault(); setError(""); setConflicts([]); setSuccess(""); setBusy(true);
    try {
      const path = id ? `/service-plan-memberships/${id}/preview` : "/service-plan-memberships/preview";
      const result = await apiClient.post<Preview>(path, id ? {} : input);
      setRenewalId(id ?? null); setPreview(result.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Nao foi possivel verificar os horarios.");
      if (caught instanceof ApiError && Array.isArray(caught.details)) setConflicts(caught.details as Conflict[]);
    } finally { setBusy(false); }
  }
  async function save() {
    setBusy(true); setError(""); setConflicts([]);
    try {
      const path = renewalId ? `/service-plan-memberships/${renewalId}/renew` : "/service-plan-memberships";
      const response = await apiClient.post<{ createdCount: number }>(path, renewalId ? { paid: true } : { ...input, paid: true });
      setPreview(null); setShowForm(false); setSuccess(`Plano salvo com ${response.data.createdCount} agendamento(s).`);
      await Promise.all([cache.invalidateQueries({ queryKey: ["service-plan-memberships"] }), cache.invalidateQueries({ queryKey: ["agenda"] }), cache.invalidateQueries({ queryKey: ["dashboard"] })]);
    } catch (caught) {
      setPreview(null); setError(caught instanceof Error ? caught.message : "Nao foi possivel salvar o plano.");
      if (caught instanceof ApiError && Array.isArray(caught.details)) setConflicts(caught.details as Conflict[]);
    } finally { setBusy(false); }
  }
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">Clientes vinculados</h2>{!showForm ? <Button type="button" onClick={() => { setError(""); setSuccess(""); setShowForm(true); }}>Vincular cliente</Button> : null}</div>
    {showForm ? <Card><form className="space-y-4" onSubmit={check}>
      <h3 className="font-semibold">Vincular cliente ao plano</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-2"><span>Plano</span><select className="app-input" required value={input.planId} onChange={(e) => setInput({ ...input, planId: e.target.value })}><option value="">Selecione o plano</option>{plans.filter((p) => p.active).map((p) => <option key={p.id} value={p.id}>{p.name} — {displayMoney(p.priceCents)}</option>)}</select></label>
        <label className="block space-y-2"><span>Cliente</span><select className="app-input" required value={input.clientId} onChange={(e) => setInput({ ...input, clientId: e.target.value })}><option value="">Selecione o cliente</option>{clients.filter((c) => c.ativo).map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></label>
        <label className="block space-y-2"><span>Data do primeiro atendimento</span><input className="app-input" required type="date" value={input.startDate} onChange={(e) => setInput({ ...input, startDate: e.target.value })} /></label>
        <label className="block space-y-2"><span>Horario inicial</span><input className="app-input" required type="time" value={input.startTime} onChange={(e) => setInput({ ...input, startTime: e.target.value })} /></label>
        <label className="block space-y-2"><span>Profissional</span><select className="app-input" value={input.professionalId} onChange={(e) => setInput({ ...input, professionalId: e.target.value })}><option value="">Selecionar automaticamente</option>{professionals.filter((p) => p.ativo).map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></label>
      </div>{chosenPlan ? <div className="rounded-2xl bg-slate-50 p-4 text-sm"><p><strong>Servicos do plano:</strong> {planServices.map((service) => service.nome).join(", ") || "Carregando..."}</p><p className="mt-1"><strong>Horario final calculado:</strong> {endTime}</p><p className="mt-1"><strong>Regra:</strong> {chosenPlan.appointmentMode === "quantity" ? `${chosenPlan.appointmentCount} atendimentos no periodo.` : "Atendimentos semanais durante a vigencia."}</p></div> : null}
      <div className="flex gap-2"><Button disabled={busy} type="submit">{busy ? "Verificando..." : "Verificar horarios"}</Button><Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button></div>
    </form></Card> : null}
    {error ? <div role="alert" className="text-sm text-rose-600"><p>{error}</p>{conflicts.map((item) => <p key={item.date}>{displayDate(item.date)}: {item.message}</p>)}</div> : null}
    {success ? <p className="text-sm text-emerald-700" role="status">{success}</p> : null}
    {listError ? <p className="text-sm text-rose-600">{listError.message}</p> : null}
    {!showForm && memberships.map((membership) => <Card key={membership.id}><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">{membership.clientName} · {membership.planName}</h3><p className="text-sm text-slate-500">Proximo vencimento: {displayDate(membership.endDate)} · {membership.startTime.slice(0, 5)}</p>{membership.reminderStatus === "enviado" ? <p className="text-sm text-emerald-700">Lembrete de renovacao enviado.</p> : null}{membership.reminderStatus === "falha" ? <p className="text-sm text-rose-600">Falha no lembrete; nova tentativa em alguns minutos: {membership.reminderError}</p> : null}{["incerto", "enviando"].includes(membership.reminderStatus ?? "") ? <p className="text-sm text-amber-700">Envio em andamento ou resultado incerto. Confira a conversa no WhatsApp antes de enviar novamente.</p> : null}</div><Button type="button" variant="secondary" disabled={busy} onClick={() => void check(undefined, membership.id)}>Renovar</Button></div></Card>)}
    {!showForm && memberships.length ? <p className="text-sm text-slate-500">Os avisos de renovacao sao enviados automaticamente para planos pendentes perto do vencimento, quando WhatsApp, telefone e chave Pix estiverem configurados.</p> : null}
    <ConfirmationDialog open={Boolean(preview)} title="Pagamento recebido?" description={preview ? `Horarios verificados: ${preview.appointments.length} atendimento(s). A vigencia termina em ${displayDate(preview.endDateExclusive)}. O pagamento de ${displayMoney(preview.priceCents)} foi recebido?` : ""} confirmAction={{ label: "Sim, salvar", onClick: () => void save(), variant: "primary", disabled: busy }} cancelAction={{ label: "Nao", onClick: () => setPreview(null), disabled: busy }} />
  </div>;
}
