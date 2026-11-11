"use client";

import { useDraggable } from "@dnd-kit/core";
import { durationMinutes, formatHours, normalizeTime, type ShiftTemplate } from "@shifts/shared";
import clsx from "clsx";
import { useState } from "react";
import { editorActions } from "@/lib/actions";
import { useEditor } from "@/lib/store";
import { IconPlus } from "./icons";
import { toneClasses } from "./ShiftCard";
import { Button, KeyBadge, TextField } from "./ui";

export function TemplatesPanel({ templates }: { templates: ShiftTemplate[] }) {
  return (
    <aside className="flex w-full shrink-0 flex-col gap-6 rounded-lg bg-white p-4 lg:w-[335px]">
      <section className="flex flex-col gap-2">
        <h2 className="text-base text-ink">Шаблоны смен</h2>
        <div className="flex flex-col gap-1">
          {templates.map((t) => (
            <TemplateCard key={t.id} template={t} />
          ))}
        </div>
      </section>
      <CustomShiftForm />
    </aside>
  );
}

export function TemplateCardView({ template, dragging }: { template: ShiftTemplate; dragging?: boolean }) {
  return (
    <div
      className={clsx(
        "flex h-16 w-full items-start justify-between gap-3 rounded border-l-[3px] bg-surface py-2 pl-[13px] pr-2 text-left",
        toneClasses[template.color].line,
        dragging && "shadow-pop",
      )}
    >
      <span className="flex min-w-0 flex-col">
        <span className="text-base font-semibold text-ink">{template.name}</span>
        <span className="flex gap-1 whitespace-nowrap text-base text-ink">
          <span>
            {template.startTime} - {template.endTime}
          </span>
          <span>·</span>
          <span>{formatHours(durationMinutes(template.startTime, template.endTime))} ч</span>
        </span>
      </span>
      <KeyBadge>{template.hotkey}</KeyBadge>
    </div>
  );
}

function TemplateCard({ template }: { template: ShiftTemplate }) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: `tpl:${template.id}`,
    data: { kind: "template", template },
  });
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...listeners}
      {...attributes}
      onClick={() => editorActions.applyTemplate(template)}
      title={`Назначить в выделенные (клавиша ${template.hotkey}) или перетащить в ячейку`}
      className={clsx(
        "block w-full cursor-grab touch-none rounded transition-[filter] hover:brightness-[0.97] active:cursor-grabbing",
        isDragging && "opacity-50",
      )}
    >
      <TemplateCardView template={template} />
    </button>
  );
}

function CustomShiftForm() {
  const start = useEditor((s) => s.customStart);
  const end = useEditor((s) => s.customEnd);
  const setCustom = useEditor((s) => s.setCustom);
  const hasSelection = useEditor((s) => s.selection.size > 0);
  const [errors, setErrors] = useState<{ start?: string; end?: string }>({});

  const blur = (which: "start" | "end", raw: string) => {
    if (!raw) return;
    const t = normalizeTime(raw);
    if (t) {
      if (which === "start") setCustom(t, end);
      else setCustom(start, t);
    }
    setErrors((e) => ({ ...e, [which]: t ? undefined : "Формат ЧЧ:ММ" }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(editorActions.applyCustom() ?? {});
  };

  return (
    <form className="flex flex-col gap-2" onSubmit={submit} noValidate>
      <h2 className="text-base text-ink">Своя смена</h2>
      <div className="flex gap-2">
        <TextField
          id="custom-start"
          label="Начало"
          inputMode="numeric"
          placeholder="09:00"
          maxLength={5}
          value={start}
          error={errors.start}
          onChange={(e) => setCustom(e.target.value, end)}
          onBlur={(e) => blur("start", e.target.value)}
        />
        <TextField
          id="custom-end"
          label="Конец"
          inputMode="numeric"
          placeholder="17:00"
          maxLength={5}
          value={end}
          error={errors.end}
          onChange={(e) => setCustom(start, e.target.value)}
          onBlur={(e) => blur("end", e.target.value)}
        />
      </div>
      <Button
        type="submit"
        variant="secondary"
        title={hasSelection ? undefined : "Сначала выделите ячейки в календаре"}
        icon={<IconPlus size={20} />}
        className="w-full"
      >
        Поставить в выделенные
      </Button>
    </form>
  );
}
