# --- deps: install the whole workspace once (cached until a package.json/lockfile changes)
FROM oven/bun:1.3 AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN bun install --frozen-lockfile

# --- build: static export of the Next.js frontend
FROM deps AS build
COPY . .
RUN bun run --cwd apps/web build

# --- runtime: one Bun process serves the API and the static frontend
FROM oven/bun:1.3-slim
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    STATIC_DIR=/app/apps/web/out \
    MIGRATE_ON_START=1 \
    SEED_ON_START=1
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/api ./apps/api
COPY --from=build /app/apps/web/out ./apps/web/out
EXPOSE 3000
USER bun
CMD ["bun", "apps/api/src/index.ts"]
