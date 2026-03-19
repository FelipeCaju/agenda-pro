import { Card } from "@/components/ui/card";

type TimelinePoint = {
  date: string;
  total: number;
  confirmed: number;
  revenue: number;
};

type TimelineChartProps = {
  items: TimelinePoint[];
};

function formatLabel(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(`${date}T12:00:00`));
}

export function TimelineChart({ items }: TimelineChartProps) {
  const maxTotal = Math.max(...items.map((item) => item.total), 1);

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Fluxo</p>
          <h3 className="mt-1 text-lg font-semibold text-ink">Volume de agendamentos</h3>
        </div>
        <p className="text-xs text-slate-500">Confirmados em azul</p>
      </div>

      {items.length ? (
        <div className="mt-5 flex items-end gap-2 overflow-x-auto pb-1">
          {items.map((item) => {
            const totalHeight = Math.max((item.total / maxTotal) * 112, item.total ? 18 : 8);
            const confirmedHeight = item.total
              ? Math.max((item.confirmed / maxTotal) * 112, item.confirmed ? 12 : 0)
              : 0;

            return (
              <div className="min-w-[3rem] flex-1 text-center" key={item.date}>
                <div className="mx-auto flex h-32 w-9 items-end justify-center rounded-3xl bg-slate-100 p-1">
                  <div
                    className="relative w-full rounded-2xl bg-brand-100"
                    style={{ height: `${totalHeight}px` }}
                  >
                    {confirmedHeight ? (
                      <div
                        className="absolute inset-x-0 bottom-0 rounded-2xl bg-brand-500"
                        style={{ height: `${confirmedHeight}px` }}
                      />
                    ) : null}
                  </div>
                </div>
                <p className="mt-2 text-[11px] font-medium text-slate-500">{formatLabel(item.date)}</p>
                <p className="text-[11px] text-slate-400">{item.total} ag.</p>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">Nenhum agendamento encontrado no periodo selecionado.</p>
      )}
    </Card>
  );
}
