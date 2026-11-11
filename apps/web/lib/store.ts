"use client";

import {
  cellKey,
  getPeriod,
  parseCellKey,
  shiftAnchor,
  todayISO,
  type CellKey,
  type CellShift,
  type Draft,
  type ShiftTemplate,
  type ViewMode,
} from "@shifts/shared";
import { create } from "zustand";

const HISTORY_LIMIT = 50;

type EditorState = {
  mode: ViewMode;
  anchor: string;
  search: string;

  /** Selected cells */
  selection: Set<CellKey>;
  /** Last clicked cell — origin for Shift+click range selection */
  selectionOrigin: CellKey | null;

  /** Local, unsaved edits on top of server data (null = cleared). */
  draft: Draft;
  /** Snapshots for undo (Ctrl/Cmd+Z). */
  history: Draft[];

  /** "Своя смена" inputs */
  customStart: string;
  customEnd: string;

  setMode: (mode: ViewMode) => void;
  goPeriod: (dir: -1 | 1) => void;
  goToday: () => void;
  setSearch: (q: string) => void;

  setSelection: (keys: Iterable<CellKey>, origin?: CellKey | null) => void;
  toggleCell: (key: CellKey) => void;
  clearSelection: () => void;

  /** Write cells into the draft. `shifts` lookup gives the current effective value for each key. */
  assign: (keys: Iterable<CellKey>, make: (key: CellKey) => CellShift | null) => void;
  undo: () => void;
  resetDraft: () => void;

  setCustom: (start: string, end: string) => void;
};

export const useEditor = create<EditorState>((set, get) => ({
  mode: "week",
  anchor: todayISO(),
  search: "",
  selection: new Set(),
  selectionOrigin: null,
  draft: new Map(),
  history: [],
  customStart: "",
  customEnd: "",

  setMode: (mode) => set({ mode, selection: new Set(), selectionOrigin: null }),
  goPeriod: (dir) => set((s) => ({ anchor: shiftAnchor(s.anchor, s.mode, dir), selection: new Set(), selectionOrigin: null })),
  goToday: () => set({ anchor: todayISO(), selection: new Set(), selectionOrigin: null }),
  setSearch: (search) => set({ search }),

  setSelection: (keys, origin) =>
    set((s) => ({ selection: new Set(keys), selectionOrigin: origin === undefined ? s.selectionOrigin : origin })),
  toggleCell: (key) =>
    set((s) => {
      const next = new Set(s.selection);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { selection: next, selectionOrigin: key };
    }),
  clearSelection: () => set({ selection: new Set(), selectionOrigin: null }),

  assign: (keys, make) =>
    set((s) => {
      const draft = new Map(s.draft);
      for (const k of keys) draft.set(k, make(k));
      return { draft, history: [...s.history.slice(-HISTORY_LIMIT + 1), s.draft] };
    }),
  undo: () =>
    set((s) => {
      const prev = s.history[s.history.length - 1];
      if (!prev) return {};
      return { draft: prev, history: s.history.slice(0, -1) };
    }),
  resetDraft: () => set({ draft: new Map(), history: [] }),

  setCustom: (customStart, customEnd) => set({ customStart, customEnd }),
}));

/** Visible period derived from mode + anchor. */
export const usePeriod = () => {
  const mode = useEditor((s) => s.mode);
  const anchor = useEditor((s) => s.anchor);
  return getPeriod(anchor, mode);
};

/** Shift built from a template for a given cell. */
export const fromTemplate = (key: CellKey, t: ShiftTemplate): CellShift => {
  const { employeeId, date } = parseCellKey(key);
  return { employeeId, date, startTime: t.startTime, endTime: t.endTime, templateId: t.id };
};

export const fromTimes = (key: CellKey, startTime: string, endTime: string): CellShift => {
  const { employeeId, date } = parseCellKey(key);
  return { employeeId, date, startTime, endTime, templateId: null };
};

/** Rectangle of cells between two keys, using the visible order of rows and columns. */
export function cellRect(a: CellKey, b: CellKey, employeeIds: number[], days: string[]): CellKey[] {
  const pa = parseCellKey(a);
  const pb = parseCellKey(b);
  const r1 = employeeIds.indexOf(pa.employeeId);
  const r2 = employeeIds.indexOf(pb.employeeId);
  const c1 = days.indexOf(pa.date);
  const c2 = days.indexOf(pb.date);
  if (r1 < 0 || r2 < 0 || c1 < 0 || c2 < 0) return [b];
  const out: CellKey[] = [];
  for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++)
    for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) out.push(cellKey(employeeIds[r]!, days[c]!));
  return out;
}
