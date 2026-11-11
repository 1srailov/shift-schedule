import { migrate } from "drizzle-orm/postgres-js/migrator";
import { fileURLToPath } from "node:url";
import { createDb } from "./client";

export async function runMigrations(url?: string) {
  const { db, client } = createDb(url);
  await migrate(db, { migrationsFolder: fileURLToPath(new URL("../../drizzle", import.meta.url)) });
  await client.end();
}

if (import.meta.main) {
  await runMigrations();
  console.log("migrations applied");
}
