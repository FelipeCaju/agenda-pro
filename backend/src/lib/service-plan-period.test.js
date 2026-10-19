import test from "node:test";
import assert from "node:assert/strict";
import { buildServicePlanPeriod } from "./service-plan-period.js";

test("plano mensal gera atendimentos semanais apenas durante a vigencia", () => {
  assert.deepEqual(buildServicePlanPeriod("2026-10-06", 1), {
    startDate: "2026-10-06",
    endDateExclusive: "2026-11-06",
    appointments: ["2026-10-06", "2026-10-13", "2026-10-20", "2026-10-27", "2026-11-03"],
  });
});

test("ajusta datas inexistentes no final do mes e evita sobreposicao na renovacao", () => {
  const first = buildServicePlanPeriod("2027-01-31", 1);
  const second = buildServicePlanPeriod(first.endDateExclusive, 1, first.startDate);
  assert.equal(first.endDateExclusive, "2027-02-28");
  assert.equal(first.appointments.includes("2027-02-28"), false);
  assert.equal(second.appointments[0], "2027-02-28");
  assert.equal(second.endDateExclusive, "2027-03-31");
});

test("renovacao preserva o dia da semana original", () => {
  const first = buildServicePlanPeriod("2026-10-06", 1);
  const second = buildServicePlanPeriod(first.endDateExclusive, 1, first.startDate);
  assert.equal(second.appointments[0], "2026-11-10");
});

test("rejeita datas e periodos invalidos", () => {
  assert.throws(() => buildServicePlanPeriod("2026-02-30", 1));
  assert.throws(() => buildServicePlanPeriod("2026-01-01", 3));
});
