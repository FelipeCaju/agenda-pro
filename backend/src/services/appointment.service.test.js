import assert from "node:assert/strict";
import test from "node:test";
import { __testables, validatePlanAppointmentDates } from "./appointment.service.js";

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

test("verificacao de plano informa todos os conflitos sem salvar agendamentos", async () => {
  const visited = [];
  const validate = async ({ input }) => {
    visited.push(input.data);
    if (input.data !== "2026-10-13") {
      const error = new Error("Horario indisponivel");
      error.statusCode = 409;
      throw error;
    }
    return { payload: input };
  };
  await assert.rejects(
    () => validatePlanAppointmentDates({ organizationId: "org", input: {}, dates: ["2026-10-06", "2026-10-13", "2026-10-20"], validate }),
    (error) => error.statusCode === 409 && error.conflicts.map((item) => item.date).join(",") === "2026-10-06,2026-10-20",
  );
  assert.equal(visited.length, 3);
});

test("verificacao de plano libera os horarios quando nao ha conflito", async () => {
  const result = await validatePlanAppointmentDates({ organizationId: "org", input: {}, dates: ["2026-10-06"], validate: async ({ input }) => ({ payload: input }) });
  assert.equal(result[0].data, "2026-10-06");
});
