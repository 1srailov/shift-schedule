/**
 * Integration tests against a real Postgres (TEST_DATABASE_URL).
 * Each run starts from a clean schema.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { sql } from "drizzle-orm";
import type { Employee, Shift, ShiftTemplate } from "@shifts/shared";
import { createApp } from "./app";
import { createDb } from "./db/client";
import { runMigrations } from "./db/migrate";
import { seed } from "./db/seed";

const url = process.env.TEST_DATABASE_URL;
const d = url ? describe : describe.skip;

d("API", () => {
  const { db, client } = createDb(url);
  const app = createApp(db);
  const req = (path: string, init?: RequestInit) =>
    app.request(path, { ...init, headers: { "content-type": "application/json", ...init?.headers } });
  const put = (body: unknown) => req("/api/shifts", { method: "PUT", body: JSON.stringify(body) });

  beforeAll(async () => {
    await db.execute(sql`drop schema if exists public cascade; drop schema if exists drizzle cascade; create schema public;`);
    await runMigrations(url);
    await seed(db, { demoShifts: false });
  });
  beforeEach(async () => {
    await db.execute(sql`truncate shifts`);
  });
  afterAll(async () => {
    await client.end();
  });

  test("health", async () => {
    expect(await (await req("/api/health")).json()).toEqual({ ok: true });
  });

  test("employees: list and search by name (case-insensitive)", async () => {
    const all: Employee[] = await (await req("/api/employees")).json();
    expect(all).toHaveLength(9);
    const found: Employee[] = await (await req(`/api/employees?q=${encodeURIComponent("вол")}`)).json();
    expect(found.map((e) => e.fullName)).toEqual(["Волков Тимур"]);
    const yo: Employee[] = await (await req(`/api/employees?q=${encodeURIComponent("АРТЕМ")}`)).json();
    expect(yo.map((e) => e.fullName)).toEqual(["Соколов Артём"]);
    const none: Employee[] = await (await req("/api/employees?q=%25")).json();
    expect(none).toHaveLength(0);
  });

  test("templates in HH:MM", async () => {
    const t: ShiftTemplate[] = await (await req("/api/templates")).json();
    expect(t.map((x) => [x.name, x.startTime, x.endTime])).toEqual([
      ["Утро", "07:00", "15:00"],
      ["День", "10:00", "18:00"],
      ["Вечер", "15:00", "23:00"],
    ]);
  });

  test("save batch: insert, update, delete in one request", async () => {
    let res = await put({
      upserts: [
        { employeeId: 1, date: "2026-09-01", startTime: "07:00", endTime: "15:00", templateId: 1 },
        { employeeId: 2, date: "2026-09-01", startTime: "10:00", endTime: "23:00", templateId: null },
      ],
      deletes: [],
    });
    expect(await res.json()).toEqual({ saved: 2, deleted: 0 });

    res = await put({
      upserts: [{ employeeId: 1, date: "2026-09-01", startTime: "15:00", endTime: "23:00", templateId: 3 }],
      deletes: [{ employeeId: 2, date: "2026-09-01" }],
    });
    expect(await res.json()).toEqual({ saved: 1, deleted: 1 });

    const list: Shift[] = await (await req("/api/shifts?from=2026-09-01&to=2026-09-07")).json();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ employeeId: 1, startTime: "15:00", endTime: "23:00", templateId: 3, status: "draft" });
  });

  test("publish marks drafts in range only", async () => {
    await put({
      upserts: [
        { employeeId: 1, date: "2026-09-01", startTime: "07:00", endTime: "15:00", templateId: 1 },
        { employeeId: 1, date: "2026-09-20", startTime: "07:00", endTime: "15:00", templateId: 1 },
      ],
      deletes: [],
    });
    const res = await req("/api/schedule/publish", {
      method: "POST",
      body: JSON.stringify({ from: "2026-09-01", to: "2026-09-07" }),
    });
    expect(await res.json()).toEqual({ published: 1 });
    const list: Shift[] = await (await req("/api/shifts?from=2026-09-01&to=2026-09-30")).json();
    expect(list.map((s) => s.status)).toEqual(["published", "draft"]);
  });

  test("validation errors use a unified shape", async () => {
    const res = await put({
      upserts: [{ employeeId: 1, date: "2026-02-30", startTime: "07:00", endTime: "15:00", templateId: 1 }],
      deletes: [],
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("validation_error");
    expect(body.error.message).toBe("Несуществующая дата");
  });

  test("unknown employee / template -> 422 and nothing is written", async () => {
    let res = await put({
      upserts: [
        { employeeId: 1, date: "2026-09-01", startTime: "07:00", endTime: "15:00", templateId: 1 },
        { employeeId: 999, date: "2026-09-01", startTime: "07:00", endTime: "15:00", templateId: 1 },
      ],
      deletes: [],
    });
    expect(res.status).toBe(422);
    res = await put({
      upserts: [{ employeeId: 1, date: "2026-09-02", startTime: "07:00", endTime: "15:00", templateId: 42 }],
      deletes: [],
    });
    expect(res.status).toBe(422);
    const list: Shift[] = await (await req("/api/shifts?from=2026-09-01&to=2026-09-07")).json();
    expect(list).toHaveLength(0);
  });

  test("range is bounded", async () => {
    const res = await req("/api/shifts?from=2026-01-01&to=2026-12-31");
    expect(res.status).toBe(400);
  });
});
