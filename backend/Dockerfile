# =============================================================================
# Safick Backend — Production image
# =============================================================================
# Multi-stage build:
#   1. builder → install all deps, generate Prisma client, compile TypeScript
#   2. runner  → slim image with prod deps + compiled output only
#
# Build:
#   docker build -t safick-backend ./backend
#
# Run (reads env from a file):
#   docker run --env-file backend/.env -p 4000:4000 safick-backend
# =============================================================================

# ---- Stage 1: builder --------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

# prisma.config.ts evaluates a DB URL at load time, and `postinstall` runs
# `prisma generate`. Neither connects to a database, but both need *a* URL to
# not throw during build. This dummy value never leaves the build stage.
ENV DIRECT_URL="postgresql://build:build@localhost:5432/build"

# Install dependencies first (better layer caching). Copy the files that
# `postinstall` (prisma generate) needs so the client is generated into
# src/generated/prisma.
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci

# Compile TypeScript, then copy the generated Prisma client into dist. `tsc`
# does not emit the generated JS client, and the runtime imports it via a
# relative path (dist/generated/prisma), so it must be copied explicitly.
COPY tsconfig.json ./
COPY src ./src
RUN npm run build \
    && mkdir -p dist/generated \
    && cp -R src/generated/prisma dist/generated/prisma

# ---- Stage 2: runner ---------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# Prisma's query engine on Alpine needs OpenSSL available at runtime.
RUN apk add --no-cache openssl

# Production dependencies only. --ignore-scripts skips the postinstall
# `prisma generate` (the generated client is copied from the builder instead).
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

# Compiled app (includes dist/generated/prisma) and the schema for optional
# `prisma migrate deploy` at deploy time.
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma
COPY prisma.config.ts ./

# Run as the built-in non-root user shipped with the node image.
USER node

EXPOSE 4000
CMD ["node", "dist/server.js"]
