import { sql } from "drizzle-orm";
import { addDays, normalizeSearch, startOfWeek, todayISO } from "@shifts/shared";
import { createDb, type Db } from "./client";
import { employees, shifts, shiftTemplates } from "./schema";

const EMPLOYEES = [
  "Кузнецова Алина",
  "Волков Тимур",
  "Морозова Виктория",
  "Соколов Артём",
  "Лебедева Полина",
  "Новиков Кирилл",
  "Ерохина Дарья",
  "Гаврилов Егор",
  "Сергеев Олег", // no photo -> letter-mark avatar from the design system
];

const TEMPLATES = [
  { id: 1, name: "Утро", startTime: "07:00", endTime: "15:00", color: "blue", hotkey: 1 },
  { id: 2, name: "День", startTime: "10:00", endTime: "18:00", color: "violet", hotkey: 2 },
  { id: 3, name: "Вечер", startTime: "15:00", endTime: "23:00", color: "teal", hotkey: 3 },
] as const;

/** Idempotent: reference data is upserted, demo shifts are only added to an empty table. */
export async function seed(db: Db, { demoShifts = true } = {}) {
  await db
    .insert(employees)
    .values(
      EMPLOYEES.map((fullName, i) => ({
        id: i + 1,
        fullName,
        searchName: normalizeSearch(fullName),
        position: "агент",
        avatarUrl: i < 8 ? `/avatars/${i + 1}.png` : null,
        sortOrder: i,
      })),
    )
    .onConflictDoNothing();

  await db.insert(shiftTemplates).values([...TEMPLATES]).onConflictDoNothing();

  // keep serial sequences in sync with the explicit ids above
  await db.execute(sql`select setval('employees_id_seq', (select max(id) from employees))`);
  await db.execute(sql`select setval('shift_templates_id_seq', (select max(id) from shift_templates))`);

  if (!demoShifts) return;
  const [{ count } = { count: 0 }] = await db.select({ count: sql<number>`count(*)::int` }).from(shifts);
  if (count > 0) return;

  const mon = startOfWeek(todayISO());
  const d = (i: number) => addDays(mon, i);
  const t = (id: 1 | 2 | 3) => TEMPLATES[id - 1]!;
  const fromTemplate = (employeeId: number, date: string, id: 1 | 2 | 3) => ({
    employeeId,
    date,
    startTime: t(id).startTime,
    endTime: t(id).endTime,
    templateId: id,
    status: "published" as const,
  });

  await db.insert(shifts).values([
    fromTemplate(1, d(1), 2),
    fromTemplate(1, d(2), 2),
    fromTemplate(2, d(1), 2),
    fromTemplate(2, d(2), 2),
    fromTemplate(2, d(4), 3),
    fromTemplate(3, d(3), 2),
    fromTemplate(4, d(3), 2),
    fromTemplate(5, d(1), 1),
    fromTemplate(5, d(3), 2),
    fromTemplate(5, d(4), 2),
  ]);
}

if (import.meta.main) {
  const { db, client } = createDb();
  await seed(db);
  await client.end();
  console.log("seed done");
}
