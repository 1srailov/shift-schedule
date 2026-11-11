import { and, between, eq } from "drizzle-orm";
import { Hono } from "hono";
import { RangeQuerySchema } from "@shifts/shared";
import type { AppEnv } from "../app";
import { shifts } from "../db/schema";
import { validate } from "../validate";

export const scheduleRoutes = new Hono<AppEnv>()
  /** Marks every draft shift in the period as published. */
  .post("/publish", validate("json", RangeQuerySchema), async (c) => {
    const { from, to } = c.req.valid("json");
    const res = await c.var.db
      .update(shifts)
      .set({ status: "published" })
      .where(and(between(shifts.date, from, to), eq(shifts.status, "draft")))
      .returning({ id: shifts.id });
    return c.json({ published: res.length });
  });
