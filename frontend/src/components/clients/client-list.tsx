import type { Client } from "@/services/clientService";
import type { Appointment } from "@/services/appointmentService";
import { Card } from "@/components/ui/card";
import { MailIcon, PhoneIcon } from "@/components/ui/icons";
import { useClientRecentAppointmentsQuery } from "@/hooks/use-agenda-query";

type ClientListProps = {
  items: Client[];
  onEdit: (client: Client) => void;
  onOpenAppointment: (appointment: Appointment) => void;
  onSelect: (client: Client) => void;
  selectedClientId: string | null;
};

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function getServiceLabel(appointment: Appointment) {
  const firstService = appointment.items[0]?.servicoNome || appointment.servicoNome || "Servico";
  const extraServices = Math.max(0, appointment.items.length - 1);

  return extraServices ? `${firstService} +${extraServices}` : firstService;
}

function AppointmentStatusIcon({ appointment }: { appointment: Appointment }) {
  const done = appointment.status === "concluido";

  return (
    <span
      aria-label={done ? "Realizado" : "Nao realizado"}
      className={
        done
          ? "inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700"
          : "inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500"
      }
      title={done ? "Realizado" : "Nao realizado"}
    >
      {done ? "OK" : "--"}
    </span>
  );
}

function PaymentBadge({ appointment }: { appointment: Appointment }) {
  const paid = appointment.paymentStatus === "pago";

  return (
    <span
      className={
        paid
          ? "inline-flex min-w-[72px] justify-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
          : "inline-flex min-w-[72px] justify-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700"
      }
    >
      {paid ? "PG" : "Pendente"}
    </span>
  );
}

function ClientAppointmentHistory({
  client,
  expanded,
  onOpenAppointment,
}: {
  client: Client;
  expanded: boolean;
  onOpenAppointment: (appointment: Appointment) => void;
}) {
  const { data = [], error, isError, isLoading } = useClientRecentAppointmentsQuery(client.id, {
    enabled: expanded,
    limit: 3,
  });

  if (!expanded) {
    return null;
  }

  return (
    <div className="mt-4 border-t border-slate-100 pt-3">
      <h4 className="mb-2 text-sm font-semibold text-ink">Ultimos agendamentos</h4>

      {isLoading ? <p className="text-sm text-slate-500">Carregando agendamentos...</p> : null}

      {isError ? (
        <p className="text-sm font-medium text-red-600">
          {error.message}
        </p>
      ) : null}

      {!isLoading && !isError && !data.length ? (
        <p className="text-sm text-slate-500">Nenhum agendamento encontrado.</p>
      ) : null}

      {!isLoading && !isError && data.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-400">
              <tr>
                <th className="py-2 pr-3 font-semibold">Data</th>
                <th className="px-3 py-2 font-semibold">Servico</th>
                <th className="px-3 py-2 text-center font-semibold">Status</th>
                <th className="py-2 pl-3 text-center font-semibold">Pagamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((appointment) => (
                <tr
                  className="cursor-pointer transition hover:bg-slate-50"
                  key={appointment.id}
                  onClick={() => onOpenAppointment(appointment)}
                >
                  <td className="py-2.5 pr-3 font-medium text-ink">
                    {formatDate(appointment.data)}
                  </td>
                  <td className="max-w-[220px] truncate px-3 py-2.5 text-slate-600">
                    {getServiceLabel(appointment)}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <AppointmentStatusIcon appointment={appointment} />
                  </td>
                  <td className="py-2.5 pl-3 text-center">
                    <PaymentBadge appointment={appointment} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

export function ClientList({
  items,
  onEdit,
  onOpenAppointment,
  onSelect,
  selectedClientId,
}: ClientListProps) {
  if (!items.length) {
    return (
      <Card className="bg-white">
        <h3 className="font-semibold text-ink">Nenhum cliente encontrado</h3>
        <p className="mt-2 text-sm text-slate-500">
          Ajuste a busca ou cadastre um novo cliente para comecar.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((client) => (
        <div className="block w-full text-left" key={client.id}>
          <Card className="rounded-[20px] border border-slate-200/70 bg-white px-4 py-4 shadow-[0_4px_16px_rgba(15,23,36,0.06)]">
            <button
              className="flex w-full items-center gap-4 text-left"
              onClick={() => onSelect(client)}
              type="button"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-base font-semibold text-brand-600">
                {getInitial(client.nome || "")}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-[1.08rem] font-semibold tracking-[-0.02em] text-ink">
                    {client.nome || "Sem nome"}
                  </h3>
                  {!client.ativo ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                      Inativo
                    </span>
                  ) : null}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <PhoneIcon className="h-4 w-4" />
                    {client.telefone || "Sem telefone"}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MailIcon className="h-4 w-4" />
                    <span className="truncate">{client.email || "Sem email"}</span>
                  </span>
                </div>
              </div>
            </button>

            <div className="mt-3 flex justify-end">
              <button
                className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
                onClick={() => onEdit(client)}
                type="button"
              >
                Editar
              </button>
            </div>

            <ClientAppointmentHistory
              client={client}
              expanded={selectedClientId === client.id}
              onOpenAppointment={onOpenAppointment}
            />
          </Card>
        </div>
      ))}
    </div>
  );
}
