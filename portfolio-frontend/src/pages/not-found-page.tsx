import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function NotFoundPage() {
  return (
    <div className="px-4 py-10">
      <Card>
        <h1 className="text-xl font-semibold text-ink">Pagina nao encontrada</h1>
        <p className="mt-2 text-sm text-slate-500">A rota solicitada nao existe nesta nova base.</p>
        <Link className="mt-4 inline-block" to="/">
          <Button>Voltar ao inicio</Button>
        </Link>
      </Card>
    </div>
  );
}
