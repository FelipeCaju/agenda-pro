import test from "node:test";
import assert from "node:assert/strict";
import { readIncomingMessage } from "./whatsapp.controller.js";

test("le respostas simples ou aninhadas sem interpretar objetos como texto", () => {
  assert.equal(readIncomingMessage({ text: "Sim" }), "Sim");
  assert.equal(readIncomingMessage({ text: { message: "Não" } }), "Não");
  assert.equal(readIncomingMessage({ message: { text: "Sim" } }), "Sim");
  assert.equal(readIncomingMessage({ data: { text: { message: "Sim" } } }), "Sim");
  assert.equal(readIncomingMessage({ message: {} }), "");
});
