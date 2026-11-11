import type { CellRef, SaveShifts, ShiftInput } from "./schemas";
import { durationMinutes } from "./time";

/** Stable key for a calendar cell. */
export type CellKey = `${number}|${string}`;

export const cellKey = (employeeId: number, date: string): CellKey => `${employeeId}|${date}`;

export function parseCellKey(key: CellKey | string): CellRef {
  const [id, date] = key.split("|");
  return { employeeId: Number(id), date: date! };
}

/** Anything that occupies a cell. */
export type CellShift = Pick<ShiftInput, "employeeId" | "date" | "startTime" | "endTime" | "templateId">;

/**
 * Coverage = number of employees with at least one shift on a date.
 * Returns a value for every requested date (0 when nobody works).
 */
export function computeCoverage(
  shifts: Iterable<CellShift>,
  days: readonly string[],
  employeeIds?: ReadonlySet<number>,
): Record<string, number> {
  const result: Record<string, number> = Object.fromEntries(days.map((d) => [d, 0]));
  const seen = new Set<string>();
  for (const s of shifts) {
    if (!(s.date in result)) continue;
    if (employeeIds && !employeeIds.has(s.employeeId)) continue;
    const k = cellKey(s.employeeId, s.date);
    if (seen.has(k)) continue;
    seen.add(k);
    result[s.date]! += 1;
  }
  return result;
}

/** Total scheduled minutes per employee within the given days. */
export function minutesByEmployee(
  shifts: Iterable<CellShift>,
  days: readonly string[],
): Map<number, number> {
  const inRange = new Set(days);
  const out = new Map<number, number>();
  for (const s of shifts) {
    if (!inRange.has(s.date)) continue;
    out.set(s.employeeId, (out.get(s.employeeId) ?? 0) + durationMinutes(s.startTime, s.endTime));
  }
  return out;
}

/** How many shifts in the period use each template. */
export function templateUsage(shifts: Iterable<CellShift>, days: readonly string[]): Map<number, number> {
  const inRange = new Set(days);
  const out = new Map<number, number>();
  for (const s of shifts) {
    if (!inRange.has(s.date) || s.templateId == null) continue;
    out.set(s.templateId, (out.get(s.templateId) ?? 0) + 1);
  }
  return out;
}

/**
 * The editor keeps server state untouched and stores local edits as an
 * overlay: `CellShift` = set/replace, `null` = cleared.
 */
export type Draft = Map<CellKey, CellShift | null>;

export function applyDraft(server: Iterable<CellShift>, draft: Draft): Map<CellKey, CellShift> {
  const out = new Map<CellKey, CellShift>();
  for (const s of server) out.set(cellKey(s.employeeId, s.date), s);
  for (const [k, v] of draft) {
    if (v === null) out.delete(k);
    else out.set(k, v);
  }
  return out;
}

const sameShift = (a: CellShift, b: CellShift) =>
  a.startTime === b.startTime && a.endTime === b.endTime && a.templateId === b.templateId;

/**
 * Turns the overlay into the minimal payload for `PUT /api/shifts`.
 * Edits that end up equal to the server state are dropped (e.g. set then reverted).
 */
export function diffDraft(server: Iterable<CellShift>, draft: Draft): SaveShifts {
  const byKey = new Map<CellKey, CellShift>();
  for (const s of server) byKey.set(cellKey(s.employeeId, s.date), s);

  const upserts: ShiftInput[] = [];
  const deletes: CellRef[] = [];
  for (const [k, v] of draft) {
    const current = byKey.get(k);
    if (v === null) {
      if (current) deletes.push(parseCellKey(k));
    } else if (!current || !sameShift(current, v)) {
      upserts.push({
        employeeId: v.employeeId,
        date: v.date,
        startTime: v.startTime,
        endTime: v.endTime,
        templateId: v.templateId,
      });
    }
  }
  return { upserts, deletes };
}

export const isEmptyDiff = (d: SaveShifts) => d.upserts.length === 0 && d.deletes.length === 0;
