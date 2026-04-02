import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PasswordField } from "@/components/ui/password-field";
import { useAuth } from "@/hooks/use-auth";
import { isValidCep, lookupCep, normalizeCep } from "@/services/cepService";
import { getPostAuthRedirect } from "@/utils/auth";

function normalizeDocument(value: string) {
  return value.replace(/\D+/g, "").trim();
}

function isValidCpfCnpj(value: string) {
  const digits = normalizeDocument(value);
  return digits.length === 11 || digits.length === 14;
}

function isValidCityIbge(value: string) {
  return normalizeDocument(value).length === 7;
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const { completeOnboarding, error, signOut, user } = useAuth();
  const isSocialOnboarding = user?.authProvider === "google" || user?.authProvider === "apple";
  const [nome, setNome] = useState(user?.nome === "Novo usuario" ? "" : user?.nome ?? "");
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingAddressNumber, setBillingAddressNumber] = useState("");
  const [billingAddressComplement, setBillingAddressComplement] = useState("");
  const [billingPostalCode, setBillingPostalCode] = useState("");
  const [billingProvince, setBillingProvince] = useState("");
  const [billingCityIbge, setBillingCityIbge] = useState("");
  const [billingCityLabel, setBillingCityLabel] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacaoSenha, setConfirmacaoSenha] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isLookingUpCep, setIsLookingUpCep] = useState(false);

  async function handleBillingCepBlur() {
    if (!isValidCep(billingPostalCode)) {
      return;
    }

    setIsLookingUpCep(true);
    setLocalError(null);

    try {
      const result = await lookupCep(billingPostalCode);

      setBillingPostalCode(normalizeCep(result.cep));
      setBillingAddress((current) => current.trim() || result.address);
      setBillingProvince((current) => current.trim() || result.neighborhood);
      setBillingCityIbge(result.ibge);
      setBillingCityLabel(result.city && result.state ? `${result.city} - ${result.state}` : result.city);
    } catch (lookupError) {
      setLocalError(lookupError instanceof Error ? lookupError.message : "Nao foi possivel consultar o CEP.");
    } finally {
      setIsLookingUpCep(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);

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

    if (!isValidCep(billingPostalCode)) {
      setLocalError("Informe um CEP valido com 8 digitos.");
      return;
    }

    if (!isValidCityIbge(billingCityIbge)) {
      setLocalError("Informe o codigo IBGE da cidade com 7 digitos.");
      return;
    }

    if (!isSocialOnboarding && senha.trim().length < 8) {
      setLocalError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }

    if (!isSocialOnboarding && senha !== confirmacaoSenha) {
      setLocalError("A confirmacao da senha precisa ser igual.");
      return;
    }

    setIsSubmitting(true);

    try {
      const session = await completeOnboarding({
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
      navigate(getPostAuthRedirect(session), { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleBackToLogin() {
    setIsLeaving(true);

    try {
      await signOut();
      navigate("/login", { replace: true });
    } finally {
      setIsLeaving(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <p className="text-xs uppercase tracking-[0.24em] text-brand-600">Primeiro acesso</p>
        <h1 className="mt-2 text-2xl font-bold text-ink">Finalize sua conta</h1>
        <p className="mt-2 text-sm text-slate-500">
          {isSocialOnboarding
            ? "Vamos criar sua empresa e concluir o acesso com sua conta social."
            : "Vamos criar sua empresa e deixar o acesso seguro com email e senha."}
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
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            onChange={(event) => setCpfCnpj(event.target.value)}
            placeholder="CPF ou CNPJ do assinante"
            value={cpfCnpj}
          />
          <p className="-mt-1 text-xs leading-6 text-slate-500">
            Esse documento identifica quem vai assinar o AgendaPro e e obrigatorio para gerar a cobranca.
          </p>
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            onChange={(event) => setBillingAddress(event.target.value)}
            placeholder="Endereco de billing"
            value={billingAddress}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              onChange={(event) => setBillingAddressNumber(event.target.value)}
              placeholder="Numero"
              value={billingAddressNumber}
            />
            <input
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              onChange={(event) => setBillingAddressComplement(event.target.value)}
              placeholder="Complemento"
              value={billingAddressComplement}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              onChange={(event) => setBillingPostalCode(event.target.value)}
              onBlur={() => void handleBillingCepBlur()}
              placeholder="CEP"
              value={billingPostalCode}
            />
            <input
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              onChange={(event) => setBillingProvince(event.target.value)}
              placeholder="Bairro"
              value={billingProvince}
            />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {isLookingUpCep
              ? "Buscando endereco pelo CEP..."
              : billingCityLabel
                ? `Cidade identificada automaticamente: ${billingCityLabel}`
                : "A cidade e o codigo IBGE serao preenchidos automaticamente pelo CEP."}
          </div>
          {!isSocialOnboarding ? (
            <>
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
            </>
          ) : (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Sua senha sera gerenciada pelo provedor social. Depois, se quiser, podemos adicionar uma senha local.
            </div>
          )}
          {localError ? <p className="text-sm text-rose-600">{localError}</p> : null}
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <Button className="w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Concluindo..." : "Concluir cadastro inicial"}
          </Button>
          <Button
            className="w-full"
            disabled={isLeaving || isSubmitting}
            onClick={() => void handleBackToLogin()}
            type="button"
            variant="secondary"
          >
            {isLeaving ? "Voltando..." : "Voltar ao login"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
