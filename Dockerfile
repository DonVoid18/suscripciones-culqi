# syntax=docker/dockerfile:1

ARG NODE_VERSION=22.14.0

################################################################################
# Base
################################################################################
FROM node:${NODE_VERSION}-alpine AS base

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

################################################################################
# Dependencies
################################################################################
FROM base AS deps

COPY package.json pnpm-lock.yaml ./

# Corepack usará la versión del packageManager
RUN corepack enable

RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
  pnpm install --frozen-lockfile

################################################################################
# Build
################################################################################
FROM deps AS build

ARG NEXT_PUBLIC_NEXTAUTH_URL
ARG NEXT_PUBLIC_CULQI_PUBLIC_KEY

ENV NEXT_PUBLIC_NEXTAUTH_URL=${NEXT_PUBLIC_NEXTAUTH_URL}
ENV NEXT_PUBLIC_CULQI_PUBLIC_KEY=${NEXT_PUBLIC_CULQI_PUBLIC_KEY}
ENV NODE_ENV=production

COPY . .

RUN pnpm run db:generate

RUN pnpm run build

################################################################################
# Runtime
################################################################################
FROM base AS final

ENV NODE_ENV=production

WORKDIR /app

RUN corepack enable

COPY --from=build /app/package.json ./
COPY --from=build /app/pnpm-lock.yaml ./

COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/next.config.ts ./next.config.ts

EXPOSE 3000

USER node

CMD ["pnpm", "start"]