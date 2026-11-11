"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { isISODate, periodLabel, type CellKey, type ShiftTemplate } from "@shifts/shared";
import { useEffect, useState } from "react";
import { editorActions } from "@/lib/actions";
import { usePendingChanges, useSaveSchedule, useSchedule } from "@/lib/schedule";
import { useEditor } from "@/lib/store";
import { IconChevronLeft, IconChevronRight } from "./icons";
import { ScheduleGrid } from "./ScheduleGrid";
import { SelectionBar } from "./SelectionBar";
import { ShiftCard } from "./ShiftCard";
import { Sidebar } from "./Sidebar";
import { TemplateCardView, TemplatesPanel } from "./TemplatesPanel";
import { toast, Toaster } from "./Toast";
import { Button, IconButton, SearchInput, Segmented } from "./ui";

type DragData = { kind: "template"; template: ShiftTemplate } | { kind: "shift"; cell: CellKey };

export function SchedulePage() {
  const data = useSchedule();
  const { period, templates, byCell } = data;
  const mode = useEditor((s) => s.mode);
  const search = useEditor((s) => s.search);
  const hasSelection = useEditor((s) => s.selection.size > 0);
  const { setMode, setSearch, goPeriod } = useEditor.getState();
  const pending = usePendingChanges();
  const { save, publish } = useSaveSchedule();

  /* ------------------------------------------------------------- DnD */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );
  const [active, setActive] = useState<DragData | null>(null);
  const [overCell, setOverCell] = useState<CellKey | null>(null);

  const onDragStart = (e: DragStartEvent) => setActive((e.active.data.current as DragData) ?? null);
  const cellOf = (id: unknown) =>
    typeof id === "string" && id.startsWith("cell:") ? (id.slice(5) as CellKey) : null;
  const onDragOver = (e: DragOverEvent) => setOverCell(cellOf(e.over?.id));
  const onDragEnd = (e: DragEndEvent) => {
    // Read target and payload from the event, not from state: a fast drop can
    // arrive before the last onDragOver re-render.
    const target = cellOf(e.over?.id);
    const d = (e.active.data.current as DragData | undefined) ?? null;
    setActive(null);
    setOverCell(null);
    if (!target || !d) return;
    if (d.kind === "template") {
      // Dropping onto a selected cell fills the whole selection
      const sel = useEditor.getState().selection;
      editorActions.applyTemplate(d.template, sel.has(target) ? [...sel] : [target]);
    } else {
      const copy = (e.activatorEvent as PointerEvent | undefined)?.altKey ?? false;
      editorActions.moveShift(d.cell, target, copy, byCell);
    }
  };

  /* -------------------------------------------------------- shortcuts */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof Element && e.target.closest("input, textarea, [contenteditable]");
      const st = useEditor.getState();
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void doSave();
        return;
      }
      if (typing) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        st.undo();
        return;
      }
      if (e.key === "Escape") st.clearSelection();
      if ((e.key === "Delete" || e.key === "Backspace") && st.selection.size) {
        e.preventDefault();
        editorActions.clear(byCell);
      }
      const t = templates.find((x) => String(x.hotkey) === e.key);
      if (t && st.selection.size && !e.metaKey && !e.ctrlKey && !e.altKey) editorActions.applyTemplate(t);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  /* ------------------------------------------ URL <-> view/date sync */
  const anchor = useEditor((s) => s.anchor);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const view = q.get("view");
    const date = q.get("date");
    useEditor.setState({
      ...(view === "month" || view === "week" ? { mode: view } : {}),
      ...(date && isISODate(date) ? { anchor: date } : {}),
    });
  }, []);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    q.set("view", mode);
    q.set("date", period.from);
    window.history.replaceState(null, "", `?${q.toString()}`);
  }, [mode, anchor, period.from]);

  /* ---------------------------------------- unsaved changes protection */
  useEffect(() => {
    if (!pending) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [pending]);

  const doSave = async () => {
    if (!pending) {
      toast("Нет несохранённых изменений");
      return;
    }
    try {
      await save.mutateAsync();
      toast("Изменения сохранены");
    } catch (err) {
      toast((err as Error).message, "error");
    }
  };
  const doPublish = async () => {
    try {
      const res = await publish.mutateAsync();
      toast(res.published ? `График опубликован · ${periodLabel(period, mode)}` : "Все смены периода уже опубликованы");
    } catch (err) {
      toast((err as Error).message, "error");
    }
  };

  const activeShift = active?.kind === "shift" ? byCell.get(active.cell) : undefined;
  const activeTone =
    activeShift?.templateId != null
      ? (templates.find((t) => t.id === activeShift.templateId)?.color ?? "custom")
      : "custom";

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={() => {
          setActive(null);
          setOverCell(null);
        }}
      >
        <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-6 lg:h-screen lg:pl-[30px] lg:pr-[30px]">
          {/* breadcrumbs */}
          <div className="flex h-10 items-center gap-3">
            <IconButton aria-label="Назад к графикам смен">
              <IconChevronLeft />
            </IconButton>
            <span className="text-base leading-[22px] text-ink">Графики смен</span>
          </div>

          {/* title + actions */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <h1 className="text-2xl font-medium tracking-[-1px] text-ink">График</h1>
              <div className="flex items-center gap-1" aria-label="Период">
                <IconButton aria-label="Предыдущий период" onClick={() => goPeriod(-1)}>
                  <IconChevronLeft />
                </IconButton>
                <span className="min-w-[200px] text-center text-base font-semibold" data-testid="period-label">
                  {periodLabel(period, mode)}
                </span>
                <IconButton aria-label="Следующий период" onClick={() => goPeriod(1)}>
                  <IconChevronRight />
                </IconButton>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="secondary" onClick={doPublish} loading={publish.isPending}>
                Опубликовать
              </Button>
              <Button variant="primary" onClick={doSave} loading={save.isPending} className="relative">
                Сохранить
                {pending > 0 && (
                  <span
                    className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1.5 text-xs font-semibold text-white"
                    aria-label={`Несохранённых изменений: ${pending}`}
                  >
                    {pending}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* card + panel */}
          <div className="flex min-h-0 flex-1 flex-col gap-2 lg:flex-row">
            <section className="flex min-h-[560px] min-w-0 flex-1 flex-col gap-5 rounded-xl bg-white p-3 lg:min-h-0">
              {hasSelection ? (
                <SelectionBar templates={templates} byCell={byCell} />
              ) : (
                <div className="flex flex-wrap items-end gap-2">
                  <SearchInput value={search} onChange={setSearch} className="w-full sm:w-[398px]" />
                  <Segmented
                    value={mode}
                    onChange={setMode}
                    className="w-full sm:w-[301px]"
                    options={[
                      { value: "month", label: "Месяц" },
                      { value: "week", label: "Неделя" },
                    ]}
                  />
                </div>
              )}

              {data.error ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                  <p className="text-base text-muted">Не удалось загрузить график: {(data.error as Error).message}</p>
                  <Button variant="secondary" onClick={data.refetch}>
                    Повторить
                  </Button>
                </div>
              ) : data.loading ? (
                <div className="flex flex-1 items-center justify-center text-base text-muted">Загрузка…</div>
              ) : (
                <>
                  <ScheduleGrid
                    mode={mode}
                    days={period.days}
                    employees={data.employees}
                    byCell={byCell}
                    unpublished={data.unpublished}
                    templates={templates}
                    coverage={data.coverage}
                    minutes={data.minutes}
                    overCell={overCell}
                    dragging={!!active}
                  />
                  {data.employees.length === 0 && (
                    <p className="-mt-2 text-center text-base text-muted">
                      Никого не нашли по запросу «{search}»
                    </p>
                  )}
                </>
              )}
            </section>

            <TemplatesPanel templates={templates} />
          </div>
        </main>

        <DragOverlay dropAnimation={null}>
          {active?.kind === "template" ? (
            <div className="w-[303px] rotate-1 opacity-95">
              <TemplateCardView template={active.template} dragging />
            </div>
          ) : activeShift ? (
            <div className="w-[102px] opacity-95 shadow-pop">
              <ShiftCard shift={activeShift} tone={activeTone} mode={mode} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      <Toaster />
    </div>
  );
}
