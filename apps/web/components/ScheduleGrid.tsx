"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import {
  cellKey,
  dayOfMonth,
  formatHours,
  longDateLabel,
  todayISO,
  weekdayShort,
  type CellKey,
  type CellShift,
  type Employee,
  type ShiftStatus,
  type ShiftTemplate,
  type ViewMode,
} from "@shifts/shared";
import clsx from "clsx";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { cellRect, useEditor } from "@/lib/store";
import { IconPlusCircle } from "./icons";
import { ShiftCard, type ShiftTone } from "./ShiftCard";

const EMP_COL = 220;
const MONTH_COL = 64;
const WEEK_COL_MIN = 96;

type Props = {
  mode: ViewMode;
  days: string[];
  employees: Employee[];
  byCell: Map<CellKey, CellShift>;
  statusByCell: Map<CellKey, ShiftStatus>;
  templates: ShiftTemplate[];
  coverage: Record<string, number>;
  minutes: Map<number, number>;
  overCell: CellKey | null;
  dragging: boolean;
};

export function ScheduleGrid(p: Props) {
  const selection = useEditor((s) => s.selection);
  const today = todayISO();
  const tplById = useMemo(() => new Map(p.templates.map((t) => [t.id, t])), [p.templates]);
  const employeeIds = useMemo(() => p.employees.map((e) => e.id), [p.employees]);

  const columns =
    p.mode === "week"
      ? `${EMP_COL}px repeat(${p.days.length}, minmax(${WEEK_COL_MIN}px, 1fr))`
      : `${EMP_COL}px repeat(${p.days.length}, ${MONTH_COL}px)`;
  const minWidth = EMP_COL + p.days.length * (p.mode === "week" ? WEEK_COL_MIN : MONTH_COL);

  /* ---------------------------------------------------- mouse selection */
  const drag = useRef<{ origin: CellKey; base: Set<CellKey> } | null>(null);

  const cellFromEvent = (e: React.PointerEvent | PointerEvent): CellKey | null => {
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-cell]");
    return (el?.dataset.cell as CellKey | undefined) ?? null;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const key = cellFromEvent(e);
    if (!key) return;
    const st = useEditor.getState();
    const onShift = !!(e.target as HTMLElement).closest("[data-shift]");
    const additive = e.metaKey || e.ctrlKey;

    if (e.shiftKey && st.selectionOrigin) {
      st.setSelection([...st.selection, ...cellRect(st.selectionOrigin, key, employeeIds, p.days)], st.selectionOrigin);
      return;
    }
    if (additive) {
      st.toggleCell(key);
      return;
    }
    // Plain click on the only selected cell toggles it off
    if (st.selection.size === 1 && st.selection.has(key) && !onShift) {
      st.clearSelection();
      return;
    }
    st.setSelection([key], key);
    // Pressing on a shift may start a DnD move — don't start rubber-band selection then.
    if (!onShift) {
      e.preventDefault();
      drag.current = { origin: key, base: new Set() };
    }
  };

  const onPointerOver = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const key = cellFromEvent(e);
    if (!key) return;
    const { origin, base } = drag.current;
    useEditor.getState().setSelection([...base, ...cellRect(origin, key, employeeIds, p.days)], origin);
  };

  useEffect(() => {
    const up = () => (drag.current = null);
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, []);

  const selectColumn = (date: string, add: boolean) => {
    const keys = employeeIds.map((id) => cellKey(id, date));
    const st = useEditor.getState();
    st.setSelection(add ? [...st.selection, ...keys] : keys, keys[0] ?? null);
  };
  const selectRow = (employeeId: number, add: boolean) => {
    const keys = p.days.map((d) => cellKey(employeeId, d));
    const st = useEditor.getState();
    st.setSelection(add ? [...st.selection, ...keys] : keys, keys[0] ?? null);
  };

  const toneOf = useCallback(
    (s: CellShift): ShiftTone => (s.templateId != null ? (tplById.get(s.templateId)?.color ?? "custom") : "custom"),
    [tplById],
  );

  return (
    <div className="scroll-thin relative min-h-0 flex-1 overflow-auto" data-testid="schedule-grid">
      <div style={{ minWidth }} className="flex min-h-full flex-col">
        {/* ---------------------------------------------------------- header */}
        <div
          role="row"
          className="sticky top-0 z-20 grid bg-white"
          style={{ gridTemplateColumns: columns }}
        >
          <div
            className={clsx(
              "sticky left-0 z-10 flex items-center border-b border-line bg-white p-3 text-base text-muted",
              p.mode === "week" ? "h-12" : "h-[54px]",
            )}
          >
            Сотрудник
          </div>
          {p.days.map((d) => (
            <button
              key={d}
              type="button"
              role="columnheader"
              onClick={(e) => selectColumn(d, e.metaKey || e.ctrlKey || e.shiftKey)}
              title={`${longDateLabel(d)} — выделить столбец`}
              className={clsx(
                "border-b border-line transition-colors hover:bg-surface",
                p.mode === "week"
                  ? "flex h-12 items-center justify-center p-3 text-base text-muted"
                  : "flex h-[54px] flex-col items-center justify-center px-3 py-2 text-sm",
                d === today && "bg-surface",
              )}
            >
              {p.mode === "week" ? (
                <span className={clsx(d === today && "font-semibold text-ink")}>
                  {weekdayShort(d)} {dayOfMonth(d)}
                </span>
              ) : (
                <>
                  <span className="text-muted">{weekdayShort(d)}</span>
                  <span className={clsx("text-ink", d === today && "font-semibold")}>{dayOfMonth(d)}</span>
                </>
              )}
            </button>
          ))}
        </div>

        {/* ------------------------------------------------------------ body */}
        <div
          className="no-select flex-1"
          onPointerDown={onPointerDown}
          onPointerOver={onPointerOver}
          role="rowgroup"
        >
          {p.employees.map((emp, i) => {
            const striped = i % 2 === 1;
            return (
              <div
                key={emp.id}
                role="row"
                className={clsx("grid", striped ? "bg-stripe" : "bg-white")}
                style={{ gridTemplateColumns: columns }}
              >
                <EmployeeCell
                  employee={emp}
                  minutes={p.minutes.get(emp.id) ?? 0}
                  striped={striped}
                  onSelectRow={(add) => selectRow(emp.id, add)}
                />
                {p.days.map((d) => {
                  const k = cellKey(emp.id, d);
                  const shift = p.byCell.get(k);
                  return (
                    <Cell
                      key={k}
                      cell={k}
                      mode={p.mode}
                      shift={shift}
                      tone={shift ? toneOf(shift) : "custom"}
                      published={p.statusByCell.get(k) === "published"}
                      selected={selection.has(k)}
                      isOver={p.overCell === k}
                      dragging={p.dragging}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* -------------------------------------------------------- coverage */}
        <div
          role="row"
          className="sticky bottom-0 z-20 grid border-t border-line bg-white"
          style={{ gridTemplateColumns: columns }}
          data-testid="coverage-row"
        >
          <div className="sticky left-0 z-10 flex h-12 items-center bg-white p-3 text-base text-muted">Покрытие</div>
          {p.days.map((d) => {
            const n = p.coverage[d] ?? 0;
            return (
              <div
                key={d}
                data-coverage={d}
                aria-label={`Покрытие ${longDateLabel(d)}: ${n}`}
                className={clsx(
                  "flex h-12 items-center justify-center p-3 text-base transition-colors duration-300",
                  n > 0 ? "bg-cover-ok text-cover-ok-text" : "bg-cover-none text-cover-none-text",
                )}
              >
                {n}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ================================================================ Employee */

const LETTER_COLORS = ["#3E87FF", "#00C7BE", "#5856D6", "#FFA100"];

function EmployeeCell({
  employee,
  minutes,
  striped,
  onSelectRow,
}: {
  employee: Employee;
  minutes: number;
  striped: boolean;
  onSelectRow: (add: boolean) => void;
}) {
  const initials = employee.fullName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .reverse()
    .join("");
  return (
    <div
      className={clsx(
        "sticky left-0 z-10 flex h-[72px] min-w-0 items-center gap-2 py-3 pl-2 pr-3",
        striped ? "bg-stripe" : "bg-white",
      )}
    >
      {employee.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={employee.avatarUrl}
          alt=""
          width={40}
          height={40}
          draggable={false}
          className="h-10 w-10 shrink-0 rounded-sm border-[0.5px] border-surface bg-[#E7E8EE] object-cover"
        />
      ) : (
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm text-base font-semibold text-white"
          style={{
            background: `linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 100%), ${
              LETTER_COLORS[employee.id % LETTER_COLORS.length]
            }`,
          }}
        >
          {initials}
        </span>
      )}
      <button
        type="button"
        onClick={(e) => onSelectRow(e.metaKey || e.ctrlKey || e.shiftKey)}
        className="flex min-w-0 flex-col items-start text-left"
        title="Выделить строку"
      >
        <span className="w-full truncate text-base text-black">{employee.fullName}</span>
        <span className="flex gap-1 text-xs text-muted">
          <span>{employee.position}</span>
          <span>·</span>
          <span>{formatHours(minutes)} ч</span>
        </span>
      </button>
    </div>
  );
}

/* ==================================================================== Cell */

const Cell = memo(function Cell({
  cell,
  mode,
  shift,
  tone,
  published,
  selected,
  isOver,
  dragging,
}: {
  cell: CellKey;
  mode: ViewMode;
  shift: CellShift | undefined;
  tone: ShiftTone;
  published: boolean;
  selected: boolean;
  isOver: boolean;
  dragging: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: `cell:${cell}` });
  const highlighted = selected || isOver;

  return (
    <div
      ref={setNodeRef}
      data-cell={cell}
      role="gridcell"
      aria-selected={selected}
      className={clsx(
        "group relative flex h-[72px] items-center justify-center p-1",
        highlighted && !shift && "border border-sel-line bg-sel-bg",
        highlighted && shift && "bg-sel-bg",
      )}
    >
      {shift ? (
        <DraggableShift cell={cell} shift={shift} tone={tone} mode={mode} selected={highlighted} published={published} />
      ) : highlighted ? (
        <IconPlusCircle />
      ) : (
        <div
          className={clsx(
            "h-16 rounded border border-dashed border-line transition-colors",
            mode === "week" ? "w-full" : "w-14",
            !dragging && "group-hover:border-[#BCBCC2] group-hover:bg-surface/60",
          )}
        />
      )}
    </div>
  );
});

function DraggableShift({
  cell,
  shift,
  tone,
  mode,
  selected,
  published,
}: {
  cell: CellKey;
  shift: CellShift;
  tone: ShiftTone;
  mode: ViewMode;
  selected: boolean;
  published: boolean;
}) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: `shift:${cell}`,
    data: { kind: "shift", cell },
  });
  return (
    <div
      ref={setNodeRef}
      data-shift
      {...listeners}
      {...attributes}
      aria-label={`Смена ${shift.startTime}–${shift.endTime}${published ? ", опубликована" : ""}`}
      className={clsx(
        "flex w-full cursor-grab touch-none justify-center rounded outline-none active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
    >
      <ShiftCard
        shift={shift}
        tone={tone}
        mode={mode}
        className={clsx(selected && "ring-1 ring-sel-line ring-offset-0")}
      />
    </div>
  );
}
