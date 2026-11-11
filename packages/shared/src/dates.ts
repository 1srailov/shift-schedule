/**
 * Calendar helpers. All dates are plain "YYYY-MM-DD" strings and all math is
 * done in UTC, so results never depend on the user's timezone / DST.
 */

export type ViewMode = "week" | "month";

const DAY = 86_400_000;
const WEEKDAYS_SHORT = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"] as const;
const MONTHS_GENITIVE = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
] as const;
const MONTHS_NOMINATIVE = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
] as const;

const parse = (d: string) => Date.parse(`${d}T00:00:00Z`);
const fmt = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export function addDays(date: string, days: number): string {
  return fmt(parse(date) + days * DAY);
}

export function todayISO(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** ISO weekday: Monday = 1 … Sunday = 7 */
export function isoWeekday(date: string): number {
  const wd = new Date(parse(date)).getUTCDay();
  return wd === 0 ? 7 : wd;
}

export function startOfWeek(date: string): string {
  return addDays(date, 1 - isoWeekday(date));
}

export function startOfMonth(date: string): string {
  return `${date.slice(0, 7)}-01`;
}

export function daysInMonth(date: string): number {
  const y = Number(date.slice(0, 4));
  const m = Number(date.slice(5, 7));
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function addMonths(date: string, months: number): string {
  const y = Number(date.slice(0, 4));
  const m = Number(date.slice(5, 7)) - 1 + months;
  const first = new Date(Date.UTC(y, m, 1));
  return fmt(first.getTime());
}

export type Period = { from: string; to: string; days: string[] };

/** Visible period for a view mode around an anchor date. */
export function getPeriod(anchor: string, mode: ViewMode): Period {
  const from = mode === "week" ? startOfWeek(anchor) : startOfMonth(anchor);
  const length = mode === "week" ? 7 : daysInMonth(anchor);
  const days = Array.from({ length }, (_, i) => addDays(from, i));
  return { from, to: days[days.length - 1]!, days };
}

/** Anchor for the previous / next period. */
export function shiftAnchor(anchor: string, mode: ViewMode, dir: -1 | 1): string {
  return mode === "week" ? addDays(startOfWeek(anchor), dir * 7) : addMonths(anchor, dir);
}

export function weekdayShort(date: string): string {
  return WEEKDAYS_SHORT[new Date(parse(date)).getUTCDay()]!;
}

export function dayOfMonth(date: string): number {
  return Number(date.slice(8, 10));
}

export function isWeekend(date: string): boolean {
  return isoWeekday(date) >= 6;
}

/** "1 – 7 сентября 2026", "29 сентября – 5 октября 2026", "Сентябрь 2026" */
export function periodLabel(period: Period, mode: ViewMode): string {
  const { from, to } = period;
  const fy = from.slice(0, 4);
  const ty = to.slice(0, 4);
  const fm = Number(from.slice(5, 7)) - 1;
  const tm = Number(to.slice(5, 7)) - 1;
  if (mode === "month") return `${MONTHS_NOMINATIVE[fm]} ${fy}`;
  if (fy !== ty)
    return `${dayOfMonth(from)} ${MONTHS_GENITIVE[fm]} ${fy} – ${dayOfMonth(to)} ${MONTHS_GENITIVE[tm]} ${ty}`;
  if (fm !== tm)
    return `${dayOfMonth(from)} ${MONTHS_GENITIVE[fm]} – ${dayOfMonth(to)} ${MONTHS_GENITIVE[tm]} ${ty}`;
  return `${dayOfMonth(from)} – ${dayOfMonth(to)} ${MONTHS_GENITIVE[tm]} ${ty}`;
}

/** Full human date for tooltips / aria: "четверг, 4 сентября" */
export function longDateLabel(date: string): string {
  const full = ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"];
  const d = new Date(parse(date));
  return `${full[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS_GENITIVE[d.getUTCMonth()]}`;
}
