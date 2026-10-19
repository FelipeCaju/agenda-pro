import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, isValidPassword, verifyPassword } from "./password.js";

test("aceita senhas nao vazias sem exigir comprimento minimo", () => {
  for (const password of ["1", "12345678", "uma senha com espacos", " "]) {
    assert.equal(isValidPassword(password), true);
    assert.equal(verifyPassword(password, hashPassword(password)), true);
  }
  assert.equal(isValidPassword(""), false);
  assert.equal(isValidPassword(undefined), false);
});
