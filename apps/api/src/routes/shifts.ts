import { and, asc, between, eq, inArray, or, sql } from "drizzle-orm";
import { Hono } from "hono";
import { RangeQuerySchema, SaveShiftsSchema, type Shift } from "@shifts/shared";
import type { AppEnv } from "../app";
import type { Db } from "../db/client";
import { shifts, shiftTemplates } from "../db/schema";
import { hhmm, validate } from "../validate";

export async function listShifts(db: Db, from: string, to: string): Promise<Shift[]> {
  const rows = await db
    .select({
      id: shifts.id,
      employeeId: shifts.employeeId,
      date: shifts.date,
      startTime: shifts.startTime,
      endTime: shifts.endTime,
      templateId: shifts.templateId,
      status: shifts.status,
    })
    .from(shifts)
    .where(between(shifts.date, from, to))
    .orderBy(asc(shifts.date), asc(shifts.employeeId));
  return rows.map((r) => ({ ...r, startTime: hhmm(r.startTime), endTime: hhmm(r.endTime) }));
}

export const shiftsRoutes = new Hono<AppEnv>()
  .get("/", validate("query", RangeQuerySchema), async (c) => {
    const { from, to } = c.req.valid("query");
    return c.json(await listShifts(c.var.db, from, to));
  })
  /**
   * Applies a batch of edits from the calendar atomically:
   * either every upsert/delete lands, or none does.
   * Any change moves the shift back to "draft" until the schedule is published again.
   */
  .put("/", validate("json", SaveShiftsSchema), async (c) => {
    const { upserts, deletes } = c.req.valid("json");

    const templateIds = [...new Set(upserts.map((u) => u.templateId).filter((id): id is number => id != null))];

    const result = await c.var.db.transaction(async (tx) => {
      if (templateIds.length) {
        const found = await tx
          .select({ id: shiftTemplates.id })
          .from(shiftTemplates)
          .where(inArray(shiftTemplates.id, templateIds));
        if (found.length !== templateIds.length) {
          return { error: "Один из шаблонов не найден" } as const;
        }
      }

      let deleted = 0;
      if (deletes.length) {
        const res = await tx
          .delete(shifts)
          .where(or(...deletes.map((d) => and(eq(shifts.employeeId, d.employeeId), eq(shifts.date, d.date)))))
          .returning({ id: shifts.id });
        deleted = res.length;
      }

      let saved = 0;
      if (upserts.length) {
        const res = await tx
          .insert(shifts)
          .values(upserts.map((u) => ({ ...u, status: "draft" as const })))
          .onConflictDoUpdate({
            target: [shifts.employeeId, shifts.date],
            set: {
              startTime: sql`excluded.start_time`,
              endTime: sql`excluded.end_time`,
              templateId: sql`excluded.template_id`,
              status: sql`'draft'`,
              updatedAt: sql`now()`,
            },
          })
          .returning({ id: shifts.id });
        saved = res.length;
      }
      return { saved, deleted } as const;
    });

    if ("error" in result) {
      return c.json({ error: { code: "invalid_reference", message: result.error } }, 422);
    }
    return c.json(result);
  });
