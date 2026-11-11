/** Normalization for name search: case-insensitive and "ё" == "е". */
export function normalizeSearch(s: string): string {
  return s.trim().toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ");
}

/** Minutes since midnight for "HH:MM". */
export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/**
 * Shift duration in minutes. A shift whose end is earlier than its start
 * is treated as overnight (e.g. 22:00–06:00 = 8h).
 */
export function durationMinutes(start: string, end: string): number {
  const diff = toMinutes(end) - toMinutes(start);
  return diff > 0 ? diff : diff + 24 * 60;
}

/** 480 -> "8", 450 -> "7,5" (Russian decimal comma). */
export function formatHours(minutes: number): string {
  const h = Math.round((minutes / 60) * 10) / 10;
  return Number.isInteger(h) ? String(h) : h.toFixed(1).replace(".", ",");
}

/** "08:00" -> "08", "08:30" -> "08:30" — compact label used inside cells. */
export function shortTime(time: string): string {
  return time.endsWith(":00") ? time.slice(0, 2) : time;
}

/** Accepts "9", "930", "9:3", "09:30" etc. and returns a valid "HH:MM" or null. */
export function normalizeTime(raw: string): string | null {
  const s = raw.trim().replace(/[.,\s]/g, ":");
  let h: number;
  let m: number;
  const parts = s.split(":");
  if (parts.length === 2) {
    h = Number(parts[0]);
    m = Number(parts[1]?.padEnd(2, "0"));
  } else if (/^\d{1,4}$/.test(s)) {
    if (s.length <= 2) {
      h = Number(s);
      m = 0;
    } else {
      h = Number(s.slice(0, s.length - 2));
      m = Number(s.slice(-2));
    }
  } else return null;
  if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
