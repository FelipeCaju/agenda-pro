import { Card } from "@/components/ui/card";

type WhatsappPanelProps = {
  reminderQueue?: number;
  isActive?: boolean;
};

export function WhatsappPanel({ reminderQueue = 0, isActive = false }: WhatsappPanelProps) {
  return (
    <Card className="border-emerald-100/80 bg-gradient-to-br from-emerald-50/[0.92] via-white to-emerald-100/65">
      <p className="text-xs uppercase tracking-[0.24em] text-emerald-700">WhatsApp</p>
      <h2 className="mt-2 text-lg font-semibold text-ink">
        {isActive ? "Lembretes ativos e desacoplados" : "Canal pronto para ativacao"}
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        {isActive
          ? `${reminderQueue} lembrete(s) em fila com integracao concentrada em services e backend.`
          : "A integracao fica concentrada em services e backend, sem componentes falando direto com SDK externo."}
      </p>
    </Card>
  );
}
