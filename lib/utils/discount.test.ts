import { test } from "node:test";
import assert from "node:assert/strict";
import {
  allocateDiscount,
  applyDiscount,
  computeLine,
  computeQuotation,
  itemsAtFinalPrice,
  type LineInput,
} from "./discount";

const line = (over: Partial<LineInput> = {}): LineInput => ({
  qty: 1,
  rate: 1000,
  amount: 0,
  discount_type: "percent",
  discount_value: 0,
  ...over,
});

test("no discount leaves the line untouched", () => {
  const r = computeLine(line({ qty: 3, rate: 250 }));
  assert.deepEqual(r, { gross: 750, discount: 0, net: 750, issue: null });
});

test("percent discount rounds to the kobo", () => {
  // 10% of 1,234.56 = 123.456 → 123.46
  const r = computeLine(line({ qty: 1, rate: 1234.56, discount_value: 10 }));
  assert.equal(r.discount, 123.46);
  assert.equal(r.net, 1111.1);
});

test("fixed amount discount comes off the line", () => {
  const r = computeLine(line({ qty: 2, rate: 5000, discount_type: "amount", discount_value: 1500 }));
  assert.deepEqual(r, { gross: 10000, discount: 1500, net: 8500, issue: null });
});

test("a discount larger than the line is clamped and flagged", () => {
  const amount = computeLine(line({ rate: 1000, discount_type: "amount", discount_value: 1500 }));
  assert.equal(amount.net, 0);
  assert.equal(amount.issue, "exceeds_base");

  const pct = computeLine(line({ rate: 1000, discount_value: 150 }));
  assert.equal(pct.net, 0);
  assert.equal(pct.issue, "percent_over_100");
});

test("a line with no rate discounts the typed amount", () => {
  const r = computeLine(line({ qty: 1, rate: null, amount: 20000, discount_value: 5 }));
  assert.deepEqual(r, { gross: 20000, discount: 1000, net: 19000, issue: null });
});

test("a zero rate is a free line, not a rate-less one", () => {
  const r = computeLine(line({ qty: 4, rate: 0, amount: 999 }));
  assert.equal(r.gross, 0);
});

test("the overall discount applies to the sub-total after item discounts", () => {
  const t = computeQuotation(
    [
      line({ qty: 2, rate: 5000, discount_value: 10 }), // 10,000 → 9,000
      line({ qty: 1, rate: 3000 }), //                      3,000
    ],
    { type: "percent", value: 5 },
  );
  assert.equal(t.gross, 13000);
  assert.equal(t.itemDiscounts, 1000);
  assert.equal(t.subtotal, 12000);
  assert.equal(t.discount, 600);
  assert.equal(t.total, 11400);
  assert.equal(t.discountIssue, null);
});

test("an overall amount discount larger than the sub-total is flagged", () => {
  const t = computeQuotation([line({ rate: 1000 })], { type: "amount", value: 1001 });
  assert.equal(t.discountIssue, "exceeds_base");
  assert.equal(t.total, 0);
});

test("pennies do not drift when summing", () => {
  const t = computeQuotation(
    [line({ rate: 0.1 }), line({ rate: 0.2 }), line({ rate: 0.3 })],
    { type: "percent", value: 0 },
  );
  assert.equal(t.subtotal, 0.6);
  assert.equal(t.total, 0.6);
});

test("allocation adds back to exactly the discount", () => {
  const shares = allocateDiscount([100, 100, 100], 10);
  assert.deepEqual(shares, [3.34, 3.33, 3.33]);
  assert.equal(shares.reduce((s, n) => Math.round((s + n) * 100) / 100, 0), 10);
});

test("allocation is proportional and never exceeds a line", () => {
  assert.deepEqual(allocateDiscount([300, 100], 40), [30, 10]);
  assert.deepEqual(allocateDiscount([0, 50], 50), [0, 50]);
  assert.deepEqual(allocateDiscount([100], 0), [0]);
  assert.deepEqual(allocateDiscount([], 10), []);
});

test("itemsAtFinalPrice leaves undiscounted quotations alone", () => {
  const items = [{ rate: 100, amount: 100, discount_amount: 0 }];
  assert.equal(itemsAtFinalPrice(items, 0), items);
});

test("itemsAtFinalPrice folds the overall discount into the lines", () => {
  const out = itemsAtFinalPrice(
    [
      { rate: 1000, amount: 900, discount_amount: 100 },
      { rate: 3000, amount: 3000, discount_amount: 0 },
    ],
    390,
  );
  assert.deepEqual(out.map((i) => i.rate), [null, null]);
  assert.deepEqual(out.map((i) => i.amount), [900 - 90, 3000 - 300]);
});

test("property: totals reconcile and allocation is exact for random quotations", () => {
  let seed = 42;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
  for (let n = 0; n < 500; n++) {
    const lines = Array.from({ length: 1 + Math.floor(rnd() * 8) }, () =>
      line({
        qty: Math.round(rnd() * 20 * 100) / 100,
        rate: Math.round(rnd() * 500000) / 100,
        discount_type: rnd() < 0.5 ? "percent" : "amount",
        discount_value: Math.round(rnd() * 30 * 100) / 100,
      }),
    );
    const overall = { type: rnd() < 0.5 ? ("percent" as const) : ("amount" as const), value: Math.round(rnd() * 20 * 100) / 100 };
    const t = computeQuotation(lines, overall);
    const k = (x: number) => Math.round(x * 100);

    assert.equal(k(t.subtotal), t.lines.reduce((s, l) => s + k(l.net), 0));
    assert.equal(k(t.total), k(t.subtotal) - k(t.discount));
    assert.equal(k(t.gross) - k(t.itemDiscounts), k(t.subtotal));
    for (const l of t.lines) assert.equal(k(l.gross) - k(l.discount), k(l.net));

    const items = t.lines.map((l) => ({ rate: null, amount: l.net, discount_amount: l.discount }));
    const final = itemsAtFinalPrice(items, t.discount);
    assert.equal(final.reduce((s, i) => s + k(i.amount), 0), k(t.total));
    assert.ok(final.every((i) => i.amount >= 0));
  }
});

test("applyDiscount ignores blank / zero values", () => {
  assert.deepEqual(applyDiscount(500, "percent", 0), { amount: 0, issue: null });
  assert.deepEqual(applyDiscount(0, "percent", 10), { amount: 0, issue: null });
});

test("issue messages read naturally", async () => {
  const { discountIssueMessage } = await import("./discount");
  assert.equal(
    discountIssueMessage("percent_over_100", { label: "Brake pads", amount: 0, noun: "line amount" }),
    `"Brake pads": discount can't be more than 100%.`,
  );
  assert.equal(
    discountIssueMessage("exceeds_base", { amount: 1500, noun: "sub-total" }),
    "Discount can't be more than the sub-total (₦1,500.00).",
  );
});
