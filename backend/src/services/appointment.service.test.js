import assert from "node:assert/strict";
import test from "node:test";
import { __testables } from "./appointment.service.js";

const { buildRecurrenceDates, normalizeRecurrence } = __testables;

test("normalizeRecurrence usa janela de 1 ano para recorrencia de agendamento", () => {
  const normalized = normalizeRecurrence({
    recurrence: {
      type: "monthly",
      count: 1,
    },
  });

  assert.equal(normalized.type, "monthly");
  assert.equal(normalized.monthsWindow, 12);
});

test("buildRecurrenceDates gera 12 ocorrencias mensais dentro de 1 ano", () => {
  const dates = buildRecurrenceDates("2026-05-06", {
    type: "monthly",
    monthsWindow: 12,
  });

  assert.equal(dates.length, 12);
  assert.equal(dates[0], "2026-05-06");
  assert.equal(dates.at(-1), "2027-04-06");
});

test("buildRecurrenceDates gera ocorrencias semanais antes de completar 1 ano", () => {
  const dates = buildRecurrenceDates("2026-05-06", {
    type: "weekly",
    monthsWindow: 12,
  });

  assert.equal(dates[0], "2026-05-06");
  assert.equal(dates.at(-1), "2027-05-05");
  assert.ok(!dates.includes("2027-05-06"));
});
