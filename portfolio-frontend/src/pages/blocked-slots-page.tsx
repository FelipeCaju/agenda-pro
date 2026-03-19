import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobilePageHeader } from "@/components/layout/mobile-page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeftIcon, ChevronDownIcon } from "@/components/ui/icons";
import { useBlockedSlotMutations } from "@/hooks/use-blocked-slot-mutations";
import { useBlockedSlotsQuery } from "@/hooks/use-blocked-slots-query";
import { useProfessionalsQuery } from "@/hooks/use-professionals-query";
import { getTodayDate } from "@/utils/agenda";
import { formatDateBR } from "@/utils/date";

export function BlockedSlotsPage() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [professionalId, setProfessionalId] = useState("");
  const [horarioInicial, setHorarioInicial] = useState("");
  const [horarioFinal, setHorarioFinal] = useState("");
  const [motivo, setMotivo] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { data: professionals = [] } = useProfessionalsQuery();
  const { data: blockedSlots = [], error, isError, isLoading } = useBlockedSlotsQuery({
    date: selectedDate,
    view: "day",
    professionalId: professionalId || undefined,
  });
  const {
    createBlockedSlot,
    createBlockedSlotError,
    deleteBlockedSlot,
    deleteBlockedSlotError,
    isCreatingBlockedSlot,
    isDeletingBlockedSlot,
  } = useBlockedSlotMutations();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await createBlockedSlot({
        data: selectedDate,
        professionalId: professionalId || null,
        horarioInicial,
        horarioFinal,
        motivo,
      });
      setHorarioInicial("");
      setHorarioFinal("");
      setMotivo("");
      setSuccessMessage("Bloqueio salvo com sucesso.");
    } catch {
      return;
    }
  }

  async function handleDelete(blockedSlotId: string) {
    try {
      await deleteBlockedSlot(blockedSlotId);
      setSuccessMessage("Bloqueio removido com sucesso.");
    } catch {
      return;
    }
  }

  return (
    <section className="space-y-4">
      <MobilePageHeader
        leading={
          <button className="text-slate-500" onClick={() => navigate("/agenda")} type="button">
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
        }
        subtitle="Impedir agendamentos em horarios indisponiveis"
        title="Bloqueios"
      />

      {successMessage ? (
        <Card className="app-message-success">
          <p className="text-sm font-medium text-emerald-700">{successMessage}</p>
        </Card>
      ) : null}

      <Card>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-ink">Data</span>
            <input
              className="app-input"
              min={getTodayDate()}
              onChange={(event) => setSelectedDate(event.target.value)}
              type="date"
              value={selectedDate}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-ink">Profissional</span>
            <div className="relative">
              <select
                className="app-select appearance-none pr-10"
                onChange={(event) => setProfessionalId(event.target.value)}
                value={professionalId}
              >
                <option value="">Bloqueio geral da agenda</option>
                {professionals.map((professional) => (
                  <option key={professional.id} value={professional.id}>
                    {professional.nome}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-ink">Inicio</span>
              <input
                className="app-input"
                onChange={(event) => setHorarioInicial(event.target.value)}
                type="time"
                value={horarioInicial}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-ink">Fim</span>
              <input
                className="app-input"
                onChange={(event) => setHorarioFinal(event.target.value)}
                type="time"
                value={horarioFinal}
              />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-ink">Motivo</span>
            <input
              className="app-input"
              onChange={(event) => setMotivo(event.target.value)}
              placeholder="Almoco, folga, reuniao..."
              value={motivo}
            />
          </label>

          {createBlockedSlotError ? (
            <p className="text-sm text-rose-600">{createBlockedSlotError.message}</p>
          ) : null}

          <Button disabled={isCreatingBlockedSlot} type="submit">
            {isCreatingBlockedSlot ? "Salvando..." : "Salvar bloqueio"}
          </Button>
        </form>
      </Card>

      <Card>
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Bloqueios do dia</p>
        <h3 className="mt-1 text-lg font-semibold text-ink">{formatDateBR(selectedDate)}</h3>

        <div className="mt-4 space-y-3">
          {isLoading ? <p className="text-sm text-slate-500">Carregando bloqueios...</p> : null}
          {isError ? <p className="text-sm text-rose-600">{error.message}</p> : null}
          {!isLoading && !isError && !blockedSlots.length ? (
            <p className="text-sm text-slate-500">Nenhum bloqueio registrado para esta data.</p>
          ) : null}
          {blockedSlots.map((slot) => (
            <div
              className="flex items-start justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-3"
              key={slot.id}
            >
              <div>
                <p className="font-medium text-ink">
                  {slot.horarioInicial} - {slot.horarioFinal}
                </p>
                <p className="text-sm text-slate-500">{slot.motivo || "Horario indisponivel"}</p>
              </div>
              <Button
                disabled={isDeletingBlockedSlot}
                onClick={() => void handleDelete(slot.id)}
                type="button"
                variant="secondary"
              >
                Remover
              </Button>
            </div>
          ))}
          {deleteBlockedSlotError ? (
            <p className="text-sm text-rose-600">{deleteBlockedSlotError.message}</p>
          ) : null}
        </div>
      </Card>
    </section>
  );
}
