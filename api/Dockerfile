# Build from the repo root: docker build -f api/Dockerfile .
FROM node:22-alpine

WORKDIR /app

# Package files first so the dependency layer is cached
COPY package.json package-lock.json ./
COPY api/package.json api/
COPY shared/package.json shared/

RUN npm ci --workspace=api --omit=dev

# M8 (Trivy image): npm behövs för att installera, inte för att köra. Basimagen node:22-alpine skickar med
# npm och dess egna beroenden – sårbarheter i dem är fynd i VÅR image fast de aldrig står i vår lockfil.
# API:et startas med `node`, så npm tas bort ur den färdiga imagen.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

# Source code
COPY shared/ shared/
COPY api/ api/

WORKDIR /app/api

ARG GIT_SHA=dev
ENV GIT_SHA=$GIT_SHA

EXPOSE 4000

# M8 (A02, Trivy DS-0002): processen kör inte som root. node-imagen har användaren `node` färdig.
# Allt är redan kopierat och installerat ovanför – node behöver bara läsa.
USER node

CMD ["node", "src/boot.js"]

# M8 (Trivy DS-0002): nginx-imagen startar som root för att få lyssna på port 80 och byter sedan
# själv till användaren nginx för arbetsprocesserna. Vi låter det vara – och skriver undantaget
# i .trivyignore med motivering. Alternativet är nginxinc/nginx-unprivileged på port 8080.
