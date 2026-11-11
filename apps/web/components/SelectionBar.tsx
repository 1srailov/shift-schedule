"use client";

import { parseCellKey, plural, type CellKey, type CellShift, type ShiftTemplate } from "@shifts/shared";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { editorActions } from "@/lib/actions";
import { useEditor } from "@/lib/store";
import { IconClose, IconPencil, IconTemplate, IconTrash } from "./icons";
import { toneClasses } from "./ShiftCard";
import { KeyBadge } from "./ui";

/** Dark "quick actions" bar shown instead of the toolbar while cells are selected. */
export function SelectionBar({
  templates,
  byCell,
}: {
  templates: ShiftTemplate[];
  byCell: Map<CellKey, CellShift>;
}) {
  const selection = useEditor((s) => s.selection);
  const clearSelection = useEditor((s) => s.clearSelection);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const cells = [...selection];
  const employees = new Set(cells.map((k) => parseCellKey(k).employeeId)).size;
  const days = new Set(cells.map((k) => parseCellKey(k).date)).size;
  const hasShifts = cells.some((k) => byCell.has(k));

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [menuOpen]);

  const action = "flex h-8 items-center gap-1 rounded px-2 text-sm text-white transition-colors hover:bg-white/10";

  return (
    <div
      className="-mb-1 flex min-h-[52px] w-full flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded bg-dark py-2 pl-3 pr-3 text-sm text-white"
      data-testid="selection-bar"
    >
      <div className="flex items-center gap-2.5">
        <span>Выделено:</span>
        <span className="rounded-full bg-dark-chip px-2 py-0.5">
          {cells.length} {plural(cells.length, ["ячейка", "ячейки", "ячеек"])}
        </span>
        <span>
          {employees} {plural(employees, ["сотрудник", "сотрудника", "сотрудников"])} · {days} дн.
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative" ref={menuRef}>
          <button type="button" className={action} onClick={() => setMenuOpen((o) => !o)} aria-expanded={menuOpen}>
            <IconTemplate size={16} />
            Применить шаблон
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-10 z-30 w-[260px] rounded-lg bg-white p-1.5 text-ink shadow-pop"
            >
              {templates.map((t) => (
                <button
                  key={t.id}
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    editorActions.applyTemplate(t);
                    setMenuOpen(false);
                  }}
                  className={clsx(
                    "flex w-full items-center justify-between rounded border-l-[3px] px-3 py-2 text-left hover:bg-surface",
                    toneClasses[t.color].line,
                  )}
                >
                  <span>
                    <span className="block text-base font-semibold">{t.name}</span>
                    <span className="text-sm text-muted">
                      {t.startTime} - {t.endTime}
                    </span>
                  </span>
                  <KeyBadge className="bg-surface">{t.hotkey}</KeyBadge>
                </button>
              ))}
            </div>
          )}
        </div>
        {hasShifts && (
          <button type="button" className={action} onClick={() => editorActions.edit(byCell)}>
            <IconPencil size={16} />
            Изменить
          </button>
        )}
        <button type="button" className={action} onClick={() => editorActions.clear(byCell)}>
          <IconTrash size={16} />
          Очистить
        </button>
        <button type="button" className={action} onClick={clearSelection}>
          <IconClose size={16} />
          Снять
        </button>
      </div>
    </div>
  );
}
