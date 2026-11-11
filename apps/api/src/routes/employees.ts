import { asc, like } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { normalizeSearch, type Employee } from "@shifts/shared";
import type { AppEnv } from "../app";
import { employees } from "../db/schema";
import { validate } from "../validate";

const QuerySchema = z.object({ q: z.string().trim().max(100).optional() });

/** Escape LIKE wildcards so user input is matched literally. */
const escapeLike = (s: string) => s.replace(/[\\%_]/g, (m) => `\\${m}`);

export const employeesRoutes = new Hono<AppEnv>().get("/", validate("query", QuerySchema), async (c) => {
  const { q } = c.req.valid("query");
  const rows = await c.var.db
    .select({
      id: employees.id,
      fullName: employees.fullName,
      position: employees.position,
      avatarUrl: employees.avatarUrl,
    })
    .from(employees)
    .where(q ? like(employees.searchName, `%${escapeLike(normalizeSearch(q))}%`) : undefined)
    .orderBy(asc(employees.sortOrder), asc(employees.id));
  return c.json<Employee[]>(rows);
});
