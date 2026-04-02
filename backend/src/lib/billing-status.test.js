import test from "node:test";
import assert from "node:assert/strict";
import { buildBillingAccessSnapshot, mapAsaasPaymentStatus } from "./billing-status.js";

test("buildBillingAccessSnapshot keeps past due subscription accessible during grace window", () => {
  const snapshot = buildBillingAccessSnapshot({
    subscription: {
      status: "past_due",
      next_due_date: "2999-01-01",
      grace_until: "2999-01-04T12:00:00.000Z",
    },
    currentTransaction: {
      status: "overdue",
      due_date: "2999-01-01",
    },
  });

  assert.equal(snapshot.subscriptionStatus, "past_due");
  assert.equal(snapshot.canAccess, true);
  assert.equal(snapshot.isBlocked, false);
  assert.equal(snapshot.blockReason, "payment_overdue");
});

test("buildBillingAccessSnapshot blocks pending first payment", () => {
  const snapshot = buildBillingAccessSnapshot({
    subscription: {
      status: "pending_payment",
      next_due_date: "2999-01-01",
    },
  });

  assert.equal(snapshot.subscriptionStatus, "pending_payment");
  assert.equal(snapshot.canAccess, false);
  assert.equal(snapshot.isBlocked, true);
  assert.equal(snapshot.blockReason, "payment_required");
});

test("mapAsaasPaymentStatus normalizes confirmed-like statuses", () => {
  assert.equal(mapAsaasPaymentStatus("CONFIRMED"), "confirmed");
  assert.equal(mapAsaasPaymentStatus("RECEIVED"), "received");
  assert.equal(mapAsaasPaymentStatus("OVERDUE"), "overdue");
  assert.equal(mapAsaasPaymentStatus("DELETED"), "cancelled");
});
