/**
 * Node.js entry point — for hosts without Bun (e.g. alwaysdata's Node runtime).
 * Same app, different adapter: Hono is runtime-agnostic.
 */
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { createApp } from "./app";
import { createDb } from "./db/client";
import { runMigrations } from "./db/migrate";

const port = Number(process.env.PORT ?? 3001);
const host = process.env.IP ?? process.env.HOST ?? "0.0.0.0";
const staticDir = process.env.STATIC_DIR;

if (process.env.MIGRATE_ON_START === "1") await runMigrations();

const { db } = createDb();
const app = createApp(db, { corsOrigin: process.env.CORS_ORIGIN, log: true });

if (staticDir) {
  app.use("/*", serveStatic({ root: staticDir }));
  app.get("*", serveStatic({ path: `${staticDir}/index.html` }));
}

serve({ fetch: app.fetch, port, hostname: host }, (info) =>
  console.log(`API (node) listening on http://${host}:${info.port}`),
);
