type ViaCepResponse = {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  ibge?: string;
  erro?: boolean;
};

export type CepLookupResult = {
  cep: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  ibge: string;
};

function normalizeDigits(value: string) {
  return value.replace(/\D+/g, "").trim();
}

export function normalizeCep(value: string) {
  return normalizeDigits(value);
}

export function isValidCep(value: string) {
  return normalizeCep(value).length === 8;
}

export async function lookupCep(value: string): Promise<CepLookupResult> {
  const cep = normalizeCep(value);

  if (cep.length !== 8) {
    throw new Error("Informe um CEP valido com 8 digitos.");
  }

  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);

  if (!response.ok) {
    throw new Error("Nao foi possivel consultar o CEP agora.");
  }

  const payload = (await response.json()) as ViaCepResponse;

  if (payload.erro) {
    throw new Error("CEP nao encontrado.");
  }

  return {
    cep: payload.cep ?? cep,
    address: payload.logradouro ?? "",
    neighborhood: payload.bairro ?? "",
    city: payload.localidade ?? "",
    state: payload.uf ?? "",
    ibge: payload.ibge ?? "",
  };
}
