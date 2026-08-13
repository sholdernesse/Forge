FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/digital-twin/package.json packages/digital-twin/package.json
COPY packages/ai/coach/package.json packages/ai/coach/package.json
COPY packages/ai/recommendation-engine/package.json packages/ai/recommendation-engine/package.json
RUN pnpm install --frozen-lockfile --filter @forge/web...

COPY apps/web apps/web
COPY packages packages

ARG VITE_FORGE_SYNC_URL=/
ARG VITE_ENTRA_CLIENT_ID
ARG VITE_ENTRA_AUTHORITY
ARG VITE_ENTRA_API_SCOPE
ARG VITE_ENTRA_REDIRECT_URI
ENV VITE_FORGE_SYNC_URL=$VITE_FORGE_SYNC_URL \
    VITE_ENTRA_CLIENT_ID=$VITE_ENTRA_CLIENT_ID \
    VITE_ENTRA_AUTHORITY=$VITE_ENTRA_AUTHORITY \
    VITE_ENTRA_API_SCOPE=$VITE_ENTRA_API_SCOPE \
    VITE_ENTRA_REDIRECT_URI=$VITE_ENTRA_REDIRECT_URI
RUN pnpm --filter @forge/web build

FROM nginx:stable-alpine
ENV FORGE_API_UPSTREAM=http://forge-api \
    NGINX_ENVSUBST_FILTER=FORGE_API_UPSTREAM
COPY apps/web/nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 8080
