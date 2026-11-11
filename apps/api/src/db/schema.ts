import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  smallint,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const templateColor = pgEnum("template_color", ["blue", "violet", "teal"]);
export const shiftStatus = pgEnum("shift_status", ["draft", "published"]);

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  /**
   * Lower-cased, "ё"→"е" copy of full_name maintained by the app.
   * Makes search independent of the DB's LC_CTYPE (ILIKE on Cyrillic fails under "C").
   */
  searchName: text("search_name").notNull(),
  position: text("position").notNull().default("агент"),
  avatarUrl: text("avatar_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const shiftTemplates = pgTable(
  "shift_templates",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    color: templateColor("color").notNull(),
    hotkey: smallint("hotkey").notNull(),
  },
  (t) => [uniqueIndex("shift_templates_hotkey_uq").on(t.hotkey)],
);

export const shifts = pgTable(
  "shifts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeId: integer("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    date: date("date", { mode: "string" }).notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    /** null = custom shift ("своя смена"); template deletion keeps the shift as custom */
    templateId: integer("template_id").references(() => shiftTemplates.id, { onDelete: "set null" }),
    status: shiftStatus("status").notNull().default("draft"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // One shift per employee per day — the grid has exactly one slot per cell.
    uniqueIndex("shifts_employee_date_uq").on(t.employeeId, t.date),
    // Range queries for the calendar ("give me everything between from and to").
    index("shifts_date_idx").on(t.date),
    check("shifts_time_ck", sql`${t.startTime} <> ${t.endTime}`),
  ],
);
