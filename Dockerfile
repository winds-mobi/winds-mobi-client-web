ARG API_HOST

### Stage 1: base installation
FROM node:24.4-alpine AS base
WORKDIR /app
RUN apk add --no-cache \
  rsync \
  bash \
  curl \
  chromium \
  nss \
  freetype \
  harfbuzz \
  ttf-freefont \
  fontconfig
SHELL ["/bin/bash", "-c"]
ENV SHELL=bash
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"

RUN corepack enable && \
  corepack prepare pnpm@10.13.1 --activate && \
  pnpm setup && \
  pnpm config set store-dir "$PNPM_HOME/store" --global

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY patches ./patches
RUN pnpm add -g ember-cli
RUN pnpm install
EXPOSE 4200
CMD ["pnpm", "start"]

### Stage 3: build
FROM base AS build
ARG API_HOST
WORKDIR /app
COPY . .
RUN pnpm run build

### Stage 4: prod
FROM nginx:stable-alpine AS prod
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
