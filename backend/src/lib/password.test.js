import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, isValidPassword, validatePasswordChange, verifyPassword } from "./password.js";

test("aceita senhas nao vazias sem exigir comprimento minimo", () => {
  for (const password of ["1", "12345678", "uma senha com espacos", " "]) {
    assert.equal(isValidPassword(password), true);
    assert.equal(verifyPassword(password, hashPassword(password)), true);
  }
  assert.equal(isValidPassword(""), false);
  assert.equal(isValidPassword(undefined), false);
});

test("troca de senha exige a senha atual e confirmacao correta", () => {
  const storedHash = hashPassword("senha atual");
  assert.throws(() => validatePasswordChange("errada", "1", "1", storedHash), /Senha atual incorreta/);
  assert.throws(() => validatePasswordChange("senha atual", "1", "2", storedHash), /confirmacao/);
  assert.throws(() => validatePasswordChange("senha atual", "", "", storedHash), /nova senha/);
  assert.throws(() => validatePasswordChange("qualquer", "1", "1", null), /nao possui senha/);
  assert.doesNotThrow(() => validatePasswordChange("senha atual", "1", "1", storedHash));
  assert.equal(verifyPassword("1", hashPassword("1")), true);
});
