"use client";

import { durationMinutes, formatHours, shortTime, type CellShift, type TemplateColor, type ViewMode } from "@shifts/shared";
import clsx from "clsx";

export type ShiftTone = TemplateColor | "custom";

/** Colors per template, from the "Смена проставленная" component. */
export const toneClasses: Record<ShiftTone, { bg: string; sub: string; main: string; line: string }> = {
  blue: { bg: "bg-tpl-blue", sub: "text-tpl-blue-text", main: "text-ink", line: "border-tpl-blue-line" },
  violet: { bg: "bg-tpl-violet", sub: "text-tpl-violet-text", main: "text-ink", line: "border-tpl-violet-line" },
  teal: { bg: "bg-tpl-teal", sub: "text-tpl-teal-text", main: "text-ink", line: "border-tpl-teal-line" },
  custom: { bg: "bg-primary", sub: "text-white", main: "text-white", line: "border-primary" },
};

export function ShiftCard({
  shift,
  tone,
  mode,
  unpublished,
  className,
}: {
  shift: Pick<CellShift, "startTime" | "endTime">;
  tone: ShiftTone;
  mode: ViewMode;
  /** Not visible to employees yet: shows a small dot until the schedule is published. */
  unpublished?: boolean;
  className?: string;
}) {
  const c = toneClasses[tone];
  const hours = `${formatHours(durationMinutes(shift.startTime, shift.endTime))} ч`;
  const range = `${shortTime(shift.startTime)} - ${shortTime(shift.endTime)}`;
  const title = `${shift.startTime} – ${shift.endTime}${unpublished ? " · не опубликована" : ""}`;
  const dot = unpublished ? (
    <span
      data-testid="unpublished-dot"
      className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-warn ring-1 ring-white"
    />
  ) : null;

  if (mode === "month") {
    return (
      <div
        className={clsx("relative flex h-16 w-14 items-center justify-center rounded p-1", c.bg, className)}
        title={title}
      >
        {dot}
        <span className={clsx("text-base font-semibold", tone === "custom" ? "text-white" : c.sub)}>{hours}</span>
      </div>
    );
  }
  return (
    <div
      className={clsx("relative flex h-16 w-full flex-col items-center justify-center rounded p-1", c.bg, className)}
      title={title}
    >
      {dot}
      <span className={clsx("text-base", c.main)}>{range}</span>
      <span className={clsx("text-xs", c.sub)}>{hours}</span>
    </div>
  );
}
