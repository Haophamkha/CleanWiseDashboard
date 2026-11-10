import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync(new URL("../src/features/reports/report-utils.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
const { adjacentPeriod, shiftDay, displayTime } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

test("month navigation avoids overflowing January 31 into March", () => {
  assert.equal(adjacentPeriod({period: "month", date: "2026-01-31"}, 1).date, "2026-02-01");
  assert.equal(adjacentPeriod({period: "month", date: "2026-01-31"}, -1).date, "2025-12-01");
});
test("quarter and week navigation cross year boundaries", () => {
  assert.equal(adjacentPeriod({period: "quarter", date: "2026-12-31"}, 1).date, "2027-03-01");
  assert.equal(adjacentPeriod({period: "week", date: "2026-12-31"}, 1).date, "2027-01-07");
});
test("inclusive custom end converts correctly across leap day", () => {
  assert.equal(shiftDay("2024-02-28", 1), "2024-02-29");
  assert.equal(shiftDay("2024-02-29", 1), "2024-03-01");
  assert.equal(shiftDay("2024-03-01", -1), "2024-02-29");
});
test("ledger completion timestamps display the Vietnam calendar day", () => {
  assert.match(displayTime("2026-09-30T18:00:00Z"), /01\/10\/2026/);
});
