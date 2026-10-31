# Build from the repo root: docker build -f api/Dockerfile .
FROM node:22-alpine

WORKDIR /app

# Package files first so the dependency layer is cached
COPY package.json package-lock.json ./
COPY api/package.json api/
COPY shared/package.json shared/

RUN npm ci --workspace=api --omit=dev

# Source code
COPY shared/ shared/
COPY api/ api/

WORKDIR /app/api

ARG GIT_SHA=dev
ENV GIT_SHA=$GIT_SHA

EXPOSE 4000

CMD ["node", "src/boot.js"]
