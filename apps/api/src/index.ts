import { serveStatic } from "hono/bun";
import { createApp } from "./app";
import { createDb } from "./db/client";
import { runMigrations } from "./db/migrate";

const port = Number(process.env.PORT ?? 3001);
const staticDir = process.env.STATIC_DIR; // built frontend (apps/web/out) in production

if (process.env.MIGRATE_ON_START === "1") await runMigrations();

const { db } = createDb();
const app = createApp(db, { corsOrigin: process.env.CORS_ORIGIN, log: true });

if (staticDir) {
  app.use("/*", serveStatic({ root: staticDir }));
  app.get("*", serveStatic({ path: `${staticDir}/index.html` }));
}

export default { port, fetch: app.fetch };
console.log(`API listening on http://localhost:${port}`);
