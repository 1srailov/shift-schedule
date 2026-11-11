import { describe, expect, test } from "bun:test";
import {
  applyDraft,
  cellKey,
  computeCoverage,
  diffDraft,
  durationMinutes,
  formatHours,
  getPeriod,
  minutesByEmployee,
  normalizeTime,
  periodLabel,
  plural,
  SaveShiftsSchema,
  shiftAnchor,
  templateUsage,
  type CellShift,
  type Draft,
} from "./index";

const s = (employeeId: number, date: string, startTime = "08:00", endTime = "16:00", templateId: number | null = 1): CellShift => ({
  employeeId,
  date,
  startTime,
  endTime,
  templateId,
});

describe("time", () => {
  test("duration, incl. overnight", () => {
    expect(durationMinutes("07:00", "15:00")).toBe(480);
    expect(durationMinutes("10:00", "23:00")).toBe(780);
    expect(durationMinutes("22:00", "06:00")).toBe(480);
  });
  test("formatHours", () => {
    expect(formatHours(480)).toBe("8");
    expect(formatHours(450)).toBe("7,5");
  });
  test("normalizeTime", () => {
    expect(normalizeTime("9")).toBe("09:00");
    expect(normalizeTime("930")).toBe("09:30");
    expect(normalizeTime("09:30")).toBe("09:30");
    expect(normalizeTime("9.15")).toBe("09:15");
    expect(normalizeTime("24:00")).toBeNull();
    expect(normalizeTime("abc")).toBeNull();
  });
});

describe("dates", () => {
  test("week period starts on Monday", () => {
    const p = getPeriod("2026-11-12", "week");
    expect(p.from).toBe("2026-11-09");
    expect(p.to).toBe("2026-11-15");
    expect(p.days).toHaveLength(7);
  });
  test("month period", () => {
    expect(getPeriod("2026-02-17", "month").days).toHaveLength(28);
    expect(getPeriod("2028-02-01", "month").days).toHaveLength(29);
  });
  test("navigation across months / years", () => {
    expect(shiftAnchor("2026-01-31", "month", 1)).toBe("2026-02-01");
    expect(shiftAnchor("2026-12-30", "week", 1)).toBe("2027-01-04");
  });
  test("labels", () => {
    expect(periodLabel(getPeriod("2026-09-02", "week"), "week")).toBe("31 августа – 6 сентября 2026");
    expect(periodLabel(getPeriod("2026-09-02", "month"), "month")).toBe("Сентябрь 2026");
  });
});

describe("schedule", () => {
  const days = ["2026-09-01", "2026-09-02", "2026-09-03"];

  test("coverage counts employees per date and ignores out-of-range", () => {
    const cov = computeCoverage([s(1, days[0]!), s(2, days[0]!), s(1, days[1]!), s(1, "2026-08-31")], days);
    expect(cov).toEqual({ "2026-09-01": 2, "2026-09-02": 1, "2026-09-03": 0 });
  });

  test("coverage can be limited to visible employees", () => {
    const cov = computeCoverage([s(1, days[0]!), s(2, days[0]!)], days, new Set([2]));
    expect(cov[days[0]!]).toBe(1);
  });

  test("hours and template usage", () => {
    const shifts = [s(1, days[0]!, "07:00", "15:00", 1), s(1, days[1]!, "10:00", "23:00", null), s(2, days[1]!, "10:00", "18:00", 2)];
    expect(minutesByEmployee(shifts, days).get(1)).toBe(480 + 780);
    expect(templateUsage(shifts, days)).toEqual(new Map([[1, 1], [2, 1]]));
  });

  test("draft overlay: set, replace, clear", () => {
    const server = [s(1, days[0]!), s(2, days[0]!)];
    const draft: Draft = new Map([
      [cellKey(1, days[0]!), null],
      [cellKey(2, days[0]!), s(2, days[0]!, "10:00", "23:00", null)],
      [cellKey(3, days[1]!), s(3, days[1]!)],
    ]);
    const merged = applyDraft(server, draft);
    expect([...merged.keys()].sort()).toEqual([cellKey(2, days[0]!), cellKey(3, days[1]!)].sort());
    expect(merged.get(cellKey(2, days[0]!))?.templateId).toBeNull();
  });

  test("diff drops no-op edits and produces a valid payload", () => {
    const server = [s(1, days[0]!), s(2, days[0]!)];
    const draft: Draft = new Map([
      [cellKey(1, days[0]!), s(1, days[0]!)], // same as server -> dropped
      [cellKey(2, days[0]!), null], // delete
      [cellKey(4, days[2]!), null], // delete of nothing -> dropped
      [cellKey(3, days[1]!), s(3, days[1]!)], // insert
    ]);
    const diff = diffDraft(server, draft);
    expect(diff.deletes).toEqual([{ employeeId: 2, date: days[0]! }]);
    expect(diff.upserts).toHaveLength(1);
    expect(SaveShiftsSchema.safeParse(diff).success).toBe(true);
  });

  test("payload validation rejects duplicates and bad times", () => {
    const dup = { upserts: [s(1, days[0]!)], deletes: [{ employeeId: 1, date: days[0]! }] };
    expect(SaveShiftsSchema.safeParse(dup).success).toBe(false);
    const bad = { upserts: [s(1, days[0]!, "25:00", "10:00")], deletes: [] };
    expect(SaveShiftsSchema.safeParse(bad).success).toBe(false);
    const same = { upserts: [s(1, days[0]!, "10:00", "10:00")], deletes: [] };
    expect(SaveShiftsSchema.safeParse(same).success).toBe(false);
  });
});

test("plural", () => {
  const f = ["ячейка", "ячейки", "ячеек"] as const;
  expect([1, 2, 5, 11, 21, 22, 112].map((n) => plural(n, f))).toEqual([
    "ячейка", "ячейки", "ячеек", "ячеек", "ячейка", "ячейки", "ячеек",
  ]);
});
