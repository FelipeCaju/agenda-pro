import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PasswordField } from "@/components/ui/password-field";
import { useAuth } from "@/hooks/use-auth";
import { getPostAuthRedirect } from "@/utils/auth";

export function OnboardingPage() {
  const navigate = useNavigate();
  const { completeOnboarding, error, user } = useAuth();
  const [nome, setNome] = useState(user?.nome === "Novo usuario" ? "" : user?.nome ?? "");
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacaoSenha, setConfirmacaoSenha] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);

    if (senha.trim().length < 8) {
      setLocalError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }

    if (senha !== confirmacaoSenha) {
      setLocalError("A confirmacao da senha precisa ser igual.");
      return;
    }

    setIsSubmitting(true);

    try {
      const session = await completeOnboarding({ nome, nomeEmpresa, telefone, senha });
      navigate(getPostAuthRedirect(session), { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <p className="text-xs uppercase tracking-[0.24em] text-brand-600">Primeiro acesso</p>
        <h1 className="mt-2 text-2xl font-bold text-ink">Finalize sua conta</h1>
        <p className="mt-2 text-sm text-slate-500">
          Vamos criar sua empresa e deixar o acesso seguro com email e senha.
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            onChange={(event) => setNome(event.target.value)}
            placeholder="Seu nome"
            value={nome}
          />
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            onChange={(event) => setNomeEmpresa(event.target.value)}
            placeholder="Nome da empresa"
            value={nomeEmpresa}
          />
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            onChange={(event) => setTelefone(event.target.value)}
            placeholder="Telefone"
            value={telefone}
          />
          <PasswordField
            inputClassName="w-full rounded-2xl border border-slate-200 px-4 py-3 pr-14 text-sm"
            onChange={(event) => setSenha(event.target.value)}
            placeholder="Crie uma senha"
            value={senha}
          />
          <PasswordField
            inputClassName="w-full rounded-2xl border border-slate-200 px-4 py-3 pr-14 text-sm"
            onChange={(event) => setConfirmacaoSenha(event.target.value)}
            placeholder="Confirme a senha"
            value={confirmacaoSenha}
          />
          {localError ? <p className="text-sm text-rose-600">{localError}</p> : null}
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <Button className="w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Concluindo..." : "Concluir cadastro inicial"}
          </Button>
          <Button className="w-full" onClick={() => navigate("/login")} type="button" variant="secondary">
            Voltar ao login
          </Button>
        </form>
      </Card>
    </div>
  );
}
