"use client";

import {
  applyDraft,
  cellKey,
  computeCoverage,
  diffDraft,
  isEmptyDiff,
  minutesByEmployee,
  templateUsage,
  type CellKey,
  type CellShift,
  type Shift,
} from "@shifts/shared";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { api } from "./api";
import { useEditor, usePeriod } from "./store";

const sameShift = (a: CellShift, b: CellShift | undefined) =>
  !!b && a.startTime === b.startTime && a.endTime === b.endTime && a.templateId === b.templateId;

const shiftsKey = (from: string, to: string) => ["shifts", from, to] as const;
const EMPTY: Shift[] = [];

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

/**
 * Everything the calendar renders: server data merged with the local draft
 * plus derived numbers (coverage, hours, template usage). Coverage is a pure
 * function of the merged state, so it updates instantly on every edit.
 */
export function useSchedule() {
  const period = usePeriod();
  const search = useEditor((s) => s.search);
  const draft = useEditor((s) => s.draft);
  const q = useDebounced(search.trim(), 200);

  const employees = useQuery({
    queryKey: ["employees", q],
    queryFn: ({ signal }) => api.employees(q, signal),
    placeholderData: keepPreviousData,
  });
  const templates = useQuery({ queryKey: ["templates"], queryFn: api.templates, staleTime: Infinity });
  const shifts = useQuery({
    queryKey: shiftsKey(period.from, period.to),
    queryFn: ({ signal }) => api.shifts(period.from, period.to, signal),
    placeholderData: keepPreviousData,
    // The draft may reference cells of any period visited in this session; the
    // diff is computed against cached server data, so never evict it.
    gcTime: Infinity,
  });

  const serverShifts = shifts.data ?? EMPTY;
  const byCell = useMemo(() => applyDraft(serverShifts, draft), [serverShifts, draft]);
  const serverByCell = useMemo(() => applyDraft(serverShifts, new Map()), [serverShifts]);
  // Cells employees can't see yet: server drafts plus local, unsaved edits.
  const unpublished = useMemo(() => {
    const published = new Set<CellKey>();
    for (const s of serverShifts) if (s.status === "published") published.add(cellKey(s.employeeId, s.date));
    const out = new Set<CellKey>();
    for (const [k, s] of byCell) {
      if (!published.has(k) || (draft.has(k) && !sameShift(s, serverByCell.get(k)))) out.add(k);
    }
    return out;
  }, [serverShifts, byCell, draft]);

  const derived = useMemo(() => {
    const list = [...byCell.values()];
    return {
      coverage: computeCoverage(list, period.days),
      minutes: minutesByEmployee(list, period.days),
      usage: templateUsage(list, period.days),
    };
  }, [byCell, period.days]);

  return {
    period,
    employees: employees.data ?? [],
    employeesLoading: employees.isLoading,
    templates: templates.data ?? [],
    byCell,
    unpublished,
    loading: shifts.isLoading || employees.isLoading || templates.isLoading,
    error: shifts.error ?? employees.error ?? templates.error,
    refetch: () => {
      void shifts.refetch();
      void employees.refetch();
      void templates.refetch();
    },
    ...derived,
  };
}

/** Count of unsaved changes vs. every period we have loaded. */
export function usePendingChanges() {
  const draft = useEditor((s) => s.draft);
  const qc = useQueryClient();
  // Cheap (draft is small) — recomputed on every render of the caller.
  const diff = diffDraft(loadedShifts(qc), draft);
  return diff.upserts.length + diff.deletes.length;
}

function loadedShifts(qc: ReturnType<typeof useQueryClient>): CellShift[] {
  const seen = new Map<string, CellShift>();
  for (const [, data] of qc.getQueriesData<Shift[]>({ queryKey: ["shifts"] }))
    for (const s of data ?? []) seen.set(`${s.employeeId}|${s.date}`, s);
  return [...seen.values()];
}

/**
 * Save = send the minimal diff in one transaction, then refetch.
 * Publish = save pending edits first, then publish the visible period.
 */
export function useSaveSchedule() {
  const qc = useQueryClient();
  const resetDraft = useEditor((s) => s.resetDraft);
  const period = usePeriod();

  // Inactive periods stay in the cache (gcTime: Infinity) and feed diffDraft,
  // so they must be refreshed too — otherwise a stale period can mask an edit.
  const refreshAllPeriods = () => qc.invalidateQueries({ queryKey: ["shifts"], refetchType: "all" });

  const persist = async () => {
    const diff = diffDraft(loadedShifts(qc), useEditor.getState().draft);
    if (isEmptyDiff(diff)) return { changed: 0 };
    const draftAtSave = useEditor.getState().draft;
    const res = await api.saveShifts(diff);
    await refreshAllPeriods();
    // Only drop the draft if nothing was edited while the request was in flight.
    if (useEditor.getState().draft === draftAtSave) resetDraft();
    return { changed: res.saved + res.deleted };
  };

  const save = useMutation({ mutationFn: persist });
  const publish = useMutation({
    mutationFn: async () => {
      await persist();
      const res = await api.publish(period.from, period.to);
      await refreshAllPeriods();
      return res;
    },
  });
  return { save, publish };
}
