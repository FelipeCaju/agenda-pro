import assert from "node:assert/strict";
import test from "node:test";
import { __testables } from "./recurrence.service.js";

const {
  buildTemplateMessage,
  normalizeRecurringInput,
  resolveBillingDateForMonth,
  shouldGenerateChargeForDate,
} = __testables;

test("normalizeRecurringInput aceita payload valido em camelCase", () => {
  const normalized = normalizeRecurringInput({
    clientId: "client-1",
    serviceId: "service-1",
    descricao: "Ballet infantil",
    valor: 150,
    dataInicio: "2026-04-10",
    diaCobranca1: 10,
    ativo: true,
  });

  assert.equal(normalized.client_id, "client-1");
  assert.equal(normalized.service_id, "service-1");
  assert.equal(normalized.valor, 150);
  assert.equal(normalized.dia_cobranca_1, 10);
  assert.equal(normalized.dia_cobranca_2, null);
  assert.equal(normalized.ativo, true);
});

test("normalizeRecurringInput rejeita payload sem dia de cobranca", () => {
  assert.throws(
    () =>
      normalizeRecurringInput({
        clientId: "client-1",
        serviceId: "service-1",
        valor: 150,
        dataInicio: "2026-04-10",
      }),
    /dia do pagamento/i,
  );
});

test("resolveBillingDateForMonth ajusta dia 31 para o ultimo dia do mes", () => {
  assert.equal(resolveBillingDateForMonth(2026, 2, 31), "2026-02-28");
  assert.equal(resolveBillingDateForMonth(2028, 2, 31), "2028-02-29");
});

test("shouldGenerateChargeForDate respeita vigencia, status e ajuste de fim de mes", () => {
  const profile = {
    ativo: true,
    data_inicio: "2026-01-01",
    data_fim: null,
    dia_cobranca_1: 31,
    dia_cobranca_2: null,
    dia_cobranca_3: null,
    dia_cobranca_4: null,
  };

  assert.equal(shouldGenerateChargeForDate(profile, "2026-02-28"), true);
  assert.equal(shouldGenerateChargeForDate(profile, "2026-02-27"), false);
  assert.equal(
    shouldGenerateChargeForDate({ ...profile, ativo: false }, "2026-02-28"),
    false,
  );
});

test("buildTemplateMessage substitui placeholders do WhatsApp", () => {
  const message = buildTemplateMessage(
    "Ola {NOME_CLIENTE} - {NOME_SERVICO} - {VALOR} - {DATA_VENCIMENTO} - {CHAVE_PIX} - {EMPRESA_NOME}",
    {
      clientName: "Maria",
      serviceName: "Ballet",
      valor: 150,
      dataVencimento: "2026-04-20",
      chavePix: "pix-chave",
      organizationName: "AgendaPro Studio",
    },
  );

  assert.equal(
    message,
    "Ola Maria - Ballet - 150,00 - 20/04/2026 - pix-chave - AgendaPro Studio",
  );
});
