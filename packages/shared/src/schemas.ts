import { z } from "zod";

/** "HH:MM", 00:00–23:59 */
export const TimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Время должно быть в формате ЧЧ:ММ");

/** "YYYY-MM-DD", must be a real calendar date */
export const DateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Дата должна быть в формате ГГГГ-ММ-ДД")
  .refine((s) => {
    const d = new Date(`${s}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
  }, "Несуществующая дата");

export const TemplateColorSchema = z.enum(["blue", "violet", "teal"]);
export type TemplateColor = z.infer<typeof TemplateColorSchema>;

export const EmployeeSchema = z.object({
  id: z.number().int(),
  fullName: z.string(),
  position: z.string(),
  avatarUrl: z.string().nullable(),
});
export type Employee = z.infer<typeof EmployeeSchema>;

export const ShiftTemplateSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  startTime: TimeSchema,
  endTime: TimeSchema,
  color: TemplateColorSchema,
  hotkey: z.number().int().min(1).max(9),
});
export type ShiftTemplate = z.infer<typeof ShiftTemplateSchema>;

export const ShiftStatusSchema = z.enum(["draft", "published"]);
export type ShiftStatus = z.infer<typeof ShiftStatusSchema>;

export const ShiftSchema = z.object({
  id: z.string().uuid(),
  employeeId: z.number().int(),
  date: DateSchema,
  startTime: TimeSchema,
  endTime: TimeSchema,
  /** null => custom ("своя смена") */
  templateId: z.number().int().nullable(),
  status: ShiftStatusSchema,
});
export type Shift = z.infer<typeof ShiftSchema>;

/** Minimal shape the UI works with before it is persisted. */
export const ShiftInputSchema = z
  .object({
    employeeId: z.number().int().positive(),
    date: DateSchema,
    startTime: TimeSchema,
    endTime: TimeSchema,
    templateId: z.number().int().positive().nullable(),
  })
  .refine((s) => s.startTime !== s.endTime, {
    message: "Начало и конец смены совпадают",
    path: ["endTime"],
  });
export type ShiftInput = z.infer<typeof ShiftInputSchema>;

export const CellRefSchema = z.object({
  employeeId: z.number().int().positive(),
  date: DateSchema,
});
export type CellRef = z.infer<typeof CellRefSchema>;

/** Batch of changes produced by the editor. Applied in a single transaction. */
export const SaveShiftsSchema = z
  .object({
    upserts: z.array(ShiftInputSchema).max(5000),
    deletes: z.array(CellRefSchema).max(5000),
  })
  .refine(
    (b) => {
      const keys = new Set<string>();
      for (const c of [...b.upserts, ...b.deletes]) {
        const k = `${c.employeeId}|${c.date}`;
        if (keys.has(k)) return false;
        keys.add(k);
      }
      return true;
    },
    { message: "Одна и та же ячейка встречается в изменениях дважды" },
  );
export type SaveShifts = z.infer<typeof SaveShiftsSchema>;

export const RangeQuerySchema = z
  .object({ from: DateSchema, to: DateSchema })
  .refine((r) => r.from <= r.to, { message: "from должен быть не позже to" })
  .refine(
    (r) =>
      (Date.parse(`${r.to}T00:00:00Z`) - Date.parse(`${r.from}T00:00:00Z`)) / 86_400_000 <= 62,
    { message: "Слишком большой диапазон (максимум 62 дня)" },
  );
export type RangeQuery = z.infer<typeof RangeQuerySchema>;

export type ApiError = { error: { code: string; message: string; details?: unknown } };
