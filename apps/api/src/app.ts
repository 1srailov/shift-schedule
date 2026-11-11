import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import type { ApiError } from "@shifts/shared";
import type { Db } from "./db/client";
import { employeesRoutes } from "./routes/employees";
import { scheduleRoutes } from "./routes/schedule";
import { shiftsRoutes } from "./routes/shifts";
import { templatesRoutes } from "./routes/templates";

export type AppEnv = { Variables: { db: Db } };

export function createApp(db: Db, opts: { corsOrigin?: string; log?: boolean } = {}) {
  const app = new Hono<AppEnv>();

  if (opts.log) app.use("*", logger());
  if (opts.corsOrigin) app.use("/api/*", cors({ origin: opts.corsOrigin.split(",") }));
  app.use("/api/*", async (c, next) => {
    c.set("db", db);
    await next();
  });

  const api = new Hono<AppEnv>()
    .get("/health", (c) => c.json({ ok: true }))
    .route("/employees", employeesRoutes)
    .route("/templates", templatesRoutes)
    .route("/shifts", shiftsRoutes)
    .route("/schedule", scheduleRoutes);

  app.route("/api", api);

  app.notFound((c) =>
    c.req.path.startsWith("/api")
      ? c.json<ApiError>({ error: { code: "not_found", message: "Маршрут не найден" } }, 404)
      : c.text("Not found", 404),
  );

  app.onError((err, c) => {
    if (err instanceof HTTPException) {
      return c.json<ApiError>({ error: { code: "http_error", message: err.message } }, err.status);
    }
    // Postgres foreign key violation => referenced employee/template does not exist
    const pgCode = (err as { code?: string }).code;
    if (pgCode === "23503") {
      return c.json<ApiError>(
        { error: { code: "invalid_reference", message: "Сотрудник или шаблон не найден" } },
        422,
      );
    }
    console.error(err);
    return c.json<ApiError>({ error: { code: "internal", message: "Внутренняя ошибка сервера" } }, 500);
  });

  return app;
}
