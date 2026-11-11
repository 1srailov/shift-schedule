import { asc } from "drizzle-orm";
import { Hono } from "hono";
import type { ShiftTemplate } from "@shifts/shared";
import type { AppEnv } from "../app";
import { shiftTemplates } from "../db/schema";
import { hhmm } from "../validate";

export const templatesRoutes = new Hono<AppEnv>().get("/", async (c) => {
  const rows = await c.var.db.select().from(shiftTemplates).orderBy(asc(shiftTemplates.hotkey));
  return c.json<ShiftTemplate[]>(
    rows.map((t) => ({ ...t, startTime: hhmm(t.startTime), endTime: hhmm(t.endTime) })),
  );
});
