import { FormEvent, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PasswordField } from "@/components/ui/password-field";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/services/apiClient";
import { getPostAuthRedirect } from "@/utils/auth";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
}

function normalizeDocument(value: string) {
  return value.replace(/\D+/g, "").trim();
}

function isValidCpfCnpj(value: string) {
  const digits = normalizeDocument(value);
  return digits.length === 11 || digits.length === 14;
}

function isValidPostalCode(value: string) {
  return normalizeDocument(value).length === 8;
}

function isValidCityIbge(value: string) {
  return normalizeDocument(value).length === 7;
}

export function SignupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearError, completeOnboarding, error, isLoading, signIn } = useAuth();
  const prefillEmail = useMemo(
    () => ((location.state as { prefillEmail?: string } | null)?.prefillEmail ?? "").trim(),
    [location.state],
  );
  const [email, setEmail] = useState(prefillEmail);
  const [nome, setNome] = useState("");
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingAddressNumber, setBillingAddressNumber] = useState("");
  const [billingAddressComplement, setBillingAddressComplement] = useState("");
  const [billingPostalCode, setBillingPostalCode] = useState("");
  const [billingProvince, setBillingProvince] = useState("");
  const [billingCityIbge, setBillingCityIbge] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacaoSenha, setConfirmacaoSenha] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearError();
    setLocalError(null);

    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      setLocalError("Informe um email valido para criar a conta.");
      return;
    }

    if (!nome.trim() || !nomeEmpresa.trim()) {
      setLocalError("Preencha seu nome e o nome da empresa.");
      return;
    }

    if (!isValidCpfCnpj(cpfCnpj)) {
      setLocalError("Informe um CPF ou CNPJ valido do assinante.");
      return;
    }

    if (!telefone.trim()) {
      setLocalError("Informe o telefone do assinante.");
      return;
    }

    if (!billingAddress.trim() || !billingAddressNumber.trim() || !billingProvince.trim()) {
      setLocalError("Preencha endereco, numero e bairro para billing.");
      return;
    }

    if (!isValidPostalCode(billingPostalCode)) {
      setLocalError("Informe um CEP valido com 8 digitos.");
      return;
    }

    if (!isValidCityIbge(billingCityIbge)) {
      setLocalError("Informe o codigo IBGE da cidade com 7 digitos.");
      return;
    }

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
      const session = await signIn({
        email: normalizedEmail,
        password: "__start_onboarding__",
        provider: "email",
      });

      if (!session.access.needsOnboarding) {
        navigate(getPostAuthRedirect(session), { replace: true });
        return;
      }

      const onboardedSession = await completeOnboarding({
        nome: nome.trim(),
        nomeEmpresa: nomeEmpresa.trim(),
        telefone: telefone.trim(),
        cpfCnpj: normalizeDocument(cpfCnpj),
        billingAddress: billingAddress.trim(),
        billingAddressNumber: billingAddressNumber.trim(),
        billingAddressComplement: billingAddressComplement.trim(),
        billingPostalCode: normalizeDocument(billingPostalCode),
        billingProvince: billingProvince.trim(),
        billingCityIbge: normalizeDocument(billingCityIbge),
        senha,
      });

      navigate(getPostAuthRedirect(onboardedSession), { replace: true });
    } catch (signupError) {
      if (signupError instanceof ApiError && [401, 403, 409].includes(signupError.status)) {
        setLocalError("Esse email ja possui conta. Volte para o login para entrar com sua senha.");
      } else if (signupError instanceof Error) {
        setLocalError(signupError.message);
      } else {
        setLocalError("Nao foi possivel criar sua conta agora.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-lg border-white/90 bg-white/[0.92] p-6 shadow-float">
        <span className="app-pill">Criar conta</span>
        <h1 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-ink">Abra sua conta</h1>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          Preencha os dados da empresa para comecar o trial e entrar direto no AgendaPro.
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <input
            className="app-input"
            onChange={(event) => {
              clearError();
              setEmail(event.target.value);
            }}
            placeholder="Seu email"
            value={email}
          />
          <input
            className="app-input"
            onChange={(event) => setNome(event.target.value)}
            placeholder="Seu nome"
            value={nome}
          />
          <input
            className="app-input"
            onChange={(event) => setNomeEmpresa(event.target.value)}
            placeholder="Nome da empresa"
            value={nomeEmpresa}
          />
          <input
            className="app-input"
            onChange={(event) => setTelefone(event.target.value)}
            placeholder="Telefone"
            value={telefone}
          />
          <input
            className="app-input"
            onChange={(event) => setCpfCnpj(event.target.value)}
            placeholder="CPF ou CNPJ do assinante"
            value={cpfCnpj}
          />
          <input
            className="app-input"
            onChange={(event) => setBillingAddress(event.target.value)}
            placeholder="Endereco de billing"
            value={billingAddress}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              className="app-input"
              onChange={(event) => setBillingAddressNumber(event.target.value)}
              placeholder="Numero"
              value={billingAddressNumber}
            />
            <input
              className="app-input"
              onChange={(event) => setBillingAddressComplement(event.target.value)}
              placeholder="Complemento"
              value={billingAddressComplement}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              className="app-input"
              onChange={(event) => setBillingPostalCode(event.target.value)}
              placeholder="CEP"
              value={billingPostalCode}
            />
            <input
              className="app-input"
              onChange={(event) => setBillingProvince(event.target.value)}
              placeholder="Bairro"
              value={billingProvince}
            />
          </div>
          <input
            className="app-input"
            onChange={(event) => setBillingCityIbge(event.target.value)}
            placeholder="Codigo IBGE da cidade"
            value={billingCityIbge}
          />
          <PasswordField
            inputClassName="app-input pr-14"
            onChange={(event) => setSenha(event.target.value)}
            placeholder="Crie uma senha"
            value={senha}
          />
          <PasswordField
            inputClassName="app-input pr-14"
            onChange={(event) => setConfirmacaoSenha(event.target.value)}
            placeholder="Confirme a senha"
            value={confirmacaoSenha}
          />
          {localError ? <p className="text-sm text-rose-600">{localError}</p> : null}
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <Button className="w-full" disabled={isSubmitting || isLoading} type="submit">
            {isSubmitting ? "Criando conta..." : "Criar conta e iniciar trial"}
          </Button>
          <Button
            className="w-full"
            onClick={() => navigate("/login", { replace: true, state: { prefillEmail: email.trim() } })}
            type="button"
            variant="secondary"
          >
            Voltar ao login
          </Button>
        </form>
      </Card>
    </div>
  );
}
