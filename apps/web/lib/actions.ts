"use client";

import { normalizeTime, plural, type CellKey, type CellShift, type ShiftTemplate } from "@shifts/shared";
import { toast } from "@/components/Toast";
import { fromTemplate, fromTimes, useEditor } from "./store";

const cellsWord = (n: number) => `${n} ${plural(n, ["ячейка", "ячейки", "ячеек"])}`;
const undoHint = () =>
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘Z" : "Ctrl+Z";

/** All editing commands live here so every entry point (bar, panel, hotkeys, DnD) behaves the same. */
export const editorActions = {
  applyTemplate(t: ShiftTemplate, keys?: Iterable<CellKey>) {
    const s = useEditor.getState();
    const target = [...(keys ?? s.selection)];
    if (!target.length) {
      toast("Выделите ячейки, чтобы назначить смену");
      return;
    }
    s.assign(target, (k) => fromTemplate(k, t));
    if (!keys) s.clearSelection();
  },

  /** Returns a validation error message, or null on success. */
  applyCustom(): { start?: string; end?: string } | null {
    const s = useEditor.getState();
    const start = normalizeTime(s.customStart || "09:00");
    const end = normalizeTime(s.customEnd || "17:00");
    const errors: { start?: string; end?: string } = {};
    if (!start) errors.start = "Формат ЧЧ:ММ";
    if (!end) errors.end = "Формат ЧЧ:ММ";
    if (start && end && start === end) errors.end = "Совпадает с началом";
    if (errors.start || errors.end) return errors;
    if (!s.selection.size) {
      toast("Выделите ячейки, чтобы поставить смену");
      return null;
    }
    s.setCustom(s.customStart && start!, s.customEnd && end!);
    s.assign([...s.selection], (k) => fromTimes(k, start!, end!));
    s.clearSelection();
    return null;
  },

  clear(byCell: Map<CellKey, CellShift>) {
    const s = useEditor.getState();
    const filled = [...s.selection].filter((k) => byCell.has(k));
    if (!filled.length) return;
    s.assign(filled, () => null);
    toast(`Очищено: ${cellsWord(filled.length)} · ${undoHint()} — отменить`);
  },

  /** "Изменить": load the times of the first selected shift into the custom form. */
  edit(byCell: Map<CellKey, CellShift>) {
    const s = useEditor.getState();
    const first = [...s.selection].map((k) => byCell.get(k)).find(Boolean);
    if (!first) return;
    s.setCustom(first.startTime, first.endTime);
    requestAnimationFrame(() => {
      const el = document.getElementById("custom-start") as HTMLInputElement | null;
      el?.focus();
      el?.select();
    });
  },

  /** Drag & drop of an existing shift. Alt/Option = copy instead of move. */
  moveShift(from: CellKey, to: CellKey, copy: boolean, byCell: Map<CellKey, CellShift>) {
    if (from === to) return;
    const shift = byCell.get(from);
    if (!shift) return;
    const s = useEditor.getState();
    const target = fromTimes(to, shift.startTime, shift.endTime);
    target.templateId = shift.templateId;
    const keys = copy ? [to] : [from, to];
    s.assign(keys, (k) => (k === to ? target : null));
  },
};
