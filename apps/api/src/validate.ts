import { zValidator } from "@hono/zod-validator";
import type { ApiError } from "@shifts/shared";
import type { ValidationTargets } from "hono";
import type { ZodSchema } from "zod";

/** zod validator that answers with our unified error shape. */
export const validate = <T extends ZodSchema, Target extends keyof ValidationTargets>(
  target: Target,
  schema: T,
) =>
  zValidator(target, schema, (result, c) => {
    if (!result.success) {
      const issues = result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
      return c.json<ApiError>(
        { error: { code: "validation_error", message: issues[0]?.message ?? "Некорректный запрос", details: issues } },
        400,
      );
    }
  });

/** Postgres `time` comes back as "HH:MM:SS"; the API speaks "HH:MM". */
export const hhmm = (t: string) => t.slice(0, 5);
