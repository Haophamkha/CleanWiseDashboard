import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

// Compile the pure layout helper without requiring the Next.js or React runtime.
const source = readFileSync(new URL("../src/lib/workerScheduleLayout.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
const { daySegments } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
const item = (id, start, end) => ({ id, scheduled_start: start, scheduled_end: end });

test("clips cross-midnight events into both Vietnam calendar days", () => {
  const event = item(1, "2026-10-04T23:00:00+07:00", "2026-10-05T01:00:00+07:00");
  assert.deepEqual(daySegments([event], "2026-10-04").map(e => [e.from, e.to]), [[1380, 1440]]);
  assert.deepEqual(daySegments([event], "2026-10-05").map(e => [e.from, e.to]), [[0, 60]]);
  assert.equal(daySegments([event], "2026-10-06").length, 0);
});

test("overlapping cluster gets separate lanes; adjacent events share a lane", () => {
  const events = [item(1, "2026-10-05T09:00+07:00", "2026-10-05T11:00+07:00"),
    item(2, "2026-10-05T10:00+07:00", "2026-10-05T12:00+07:00"),
    item(3, "2026-10-05T11:00+07:00", "2026-10-05T13:00+07:00"),
    item(4, "2026-10-05T13:00+07:00", "2026-10-05T14:00+07:00")];
  assert.deepEqual(daySegments(events, "2026-10-05").map(e => [e.lane, e.lanes]), [[0, 2], [1, 2], [0, 2], [0, 1]]);
});

test("UTC timestamps use Vietnam day and simultaneous events remain visible", () => {
  const events = [item(1, "2026-10-04T18:00:00Z", "2026-10-04T20:00:00Z"),
    item(2, "2026-10-05T01:00+07:00", "2026-10-05T02:00+07:00"),
    item(3, "2026-10-05T01:00+07:00", "2026-10-05T02:30+07:00")];
  assert.equal(daySegments(events, "2026-10-04").length, 0);
  const segments = daySegments(events, "2026-10-05");
  assert.deepEqual(segments.map(e => e.lanes), [3, 3, 3]);
  assert.deepEqual(segments.map(e => e.from), [60, 60, 60]);
});
