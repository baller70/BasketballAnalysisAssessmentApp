# SHOTIQ AI — optional container image.
# The primary Contabo deploy runs the app directly under PM2 (see deploy.sh /
# ecosystem.config.js); this Dockerfile is provided for anyone who prefers to
# containerize the Next.js server. Postgres stays in its own 'shotiq-db'
# container — this image is the web app only.
#
#   docker build -t shotiq .
#   docker run -p 3060:3060 --env-file .env.production shotiq

# ---- deps ----
FROM node:20-bookworm-slim AS deps
WORKDIR /app
# libc/openssl bits Prisma's engine needs on slim images.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# ---- build ----
FROM node:20-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS=--max-old-space-size=2048
# A parseable DATABASE_URL is only needed so `prisma generate` (run by the build
# script) succeeds; the build never connects to it.
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build?schema=public
RUN npm run build

# ---- runtime ----
FROM node:20-bookworm-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3060
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.js ./next.config.js
COPY --from=build /app/prisma ./prisma
EXPOSE 3060
CMD ["node_modules/.bin/next", "start", "--port", "3060"]
