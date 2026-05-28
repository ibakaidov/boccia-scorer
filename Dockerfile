ARG BASE_IMAGE=mcr.microsoft.com/playwright:v1.49.1-noble

FROM ${BASE_IMAGE} AS base

ENV CI=true \
    NPM_CONFIG_CACHE=/cache/npm \
    ELECTRON_CACHE=/cache/electron \
    ELECTRON_BUILDER_CACHE=/cache/electron-builder \
    PLAYWRIGHT_BROWSERS_PATH=/cache/ms-playwright

WORKDIR /workspace

RUN mkdir -p /workspace/node_modules /cache/npm /cache/electron /cache/electron-builder /cache/ms-playwright && \
    chmod -R 0777 /workspace/node_modules /cache

COPY docker/entrypoint.sh /usr/local/bin/boccia-docker-entrypoint
RUN chmod +x /usr/local/bin/boccia-docker-entrypoint
ENTRYPOINT ["/usr/local/bin/boccia-docker-entrypoint"]

FROM base AS deps
COPY package*.json ./
RUN --mount=type=cache,target=/cache/npm,sharing=locked npm install

FROM deps AS source
COPY . .

FROM source AS test
RUN --mount=type=cache,target=/cache/npm,sharing=locked \
    --mount=type=cache,target=/cache/electron,sharing=locked \
    --mount=type=cache,target=/cache/electron-builder,sharing=locked \
    npm run typecheck && npm run lint && npm run test

FROM source AS build
RUN --mount=type=cache,target=/cache/npm,sharing=locked \
    --mount=type=cache,target=/cache/electron,sharing=locked \
    --mount=type=cache,target=/cache/electron-builder,sharing=locked \
    npm run build

FROM build AS package-linux
RUN --mount=type=cache,target=/cache/npm,sharing=locked \
    --mount=type=cache,target=/cache/electron,sharing=locked \
    --mount=type=cache,target=/cache/electron-builder,sharing=locked \
    npx electron-builder --linux AppImage --arm64

FROM source AS dev
CMD ["npm", "run", "dev"]
