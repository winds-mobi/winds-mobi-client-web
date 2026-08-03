ARG API_HOST

### Stage 1: base installation
# Debian, not Alpine: headless Chromium needs working software WebGL
# (SwiftShader/Vulkan or Mesa llvmpipe) to run this app's MapLibre-dependent
# tests at all. Alpine's musl-based chromium package ships no Vulkan ICD and
# its ANGLE build fails on headless Vulkan surface init; Google's own Chrome
# (which bundles a complete SwiftShader and is what GitHub Actions'
# ubuntu-latest runners have preinstalled -- see .github/workflows/ci.yml,
# which relies on it with no explicit browser setup) is amd64-only, no arm64
# build exists. Debian's own chromium package plus Mesa's Vulkan software
# rasterizer is the best-supported combination on arm64 (Apple Silicon/OrbStack).
FROM node:24.4-bookworm-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
  rsync \
  bash \
  curl \
  chromium \
  mesa-vulkan-drivers \
  libnss3 \
  fonts-freefont-ttf \
  fontconfig \
  && rm -rf /var/lib/apt/lists/*
SHELL ["/bin/bash", "-c"]
ENV SHELL=bash
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"

RUN corepack enable && \
  corepack prepare pnpm@10.13.1 --activate && \
  pnpm setup && \
  pnpm config set store-dir "$PNPM_HOME/store" --global

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
RUN pnpm install
EXPOSE 4200
CMD ["pnpm", "start"]

### Stage 2: build
FROM base AS build
ARG API_HOST
WORKDIR /app
COPY . .
RUN pnpm run build

### Stage 3: prod
FROM nginx:stable-alpine AS prod
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
