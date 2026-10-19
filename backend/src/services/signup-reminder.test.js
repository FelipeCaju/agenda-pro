import test from "node:test";
import assert from "node:assert/strict";
import { validateOptionalBillingAddress } from "./auth.service.js";
import { isReminderDue } from "./reminder.service.js";

test("cadastro aceita endereco ausente ou parcial, mas valida CEP e IBGE informados", () => {
  assert.doesNotThrow(() => validateOptionalBillingAddress({}));
  assert.doesNotThrow(() => validateOptionalBillingAddress({ billingPostalCode: "12345-678" }));
  assert.doesNotThrow(() => validateOptionalBillingAddress({ billingCityIbge: "3550308" }));
  assert.throws(() => validateOptionalBillingAddress({ billingPostalCode: "123" }), /CEP invalido/);
  assert.throws(() => validateOptionalBillingAddress({ billingPostalCode: "abc" }), /CEP invalido/);
  assert.throws(() => validateOptionalBillingAddress({ billingCityIbge: "123" }), /IBGE/);
});

test("lembrete de dois dias vence no mesmo horario dois dias antes", () => {
  const appointment = { data: "2026-10-22", horario_inicial: "15:00", status: "pendente", lembrete_enviado: false };
  const settings = { lembretes_ativos: true, whatsapp_ativo: true, whatsapp_tempo_lembrete_minutos: 2880, timezone: "America/Sao_Paulo" };
  assert.equal(isReminderDue({ appointment, settings, now: new Date("2026-10-20T17:59:00Z") }), false);
  assert.equal(isReminderDue({ appointment, settings, now: new Date("2026-10-20T18:00:00Z") }), true);
  assert.equal(isReminderDue({ appointment: { ...appointment, lembrete_enviado: true }, settings, now: new Date("2026-10-20T18:00:00Z") }), false);
  assert.equal(isReminderDue({ appointment, settings, now: new Date("2026-10-22T18:01:00Z") }), false);
  assert.equal(isReminderDue({ appointment, settings: { ...settings, whatsapp_tempo_lembrete_minutos: 1440 }, now: new Date("2026-10-21T18:00:00Z") }), true);
  assert.equal(isReminderDue({ appointment, settings: { ...settings, whatsapp_tempo_lembrete_minutos: 60 }, now: new Date("2026-10-22T17:00:00Z") }), true);
});
