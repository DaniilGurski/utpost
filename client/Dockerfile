# Steg 1 – build: Node och alla node_modules, bara för att köra vite build.
FROM node:22-alpine as build
WORKDIR /app

# Paketfiler först, så att npm ci-lagret cachas
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY client/package.json client/
RUN npm ci --workspace=client

# Koden efter
COPY client/ client/
COPY shared/ shared/

# Bygg till client/dist
RUN npm run build --workspace=client

# Steg 2 – det som blir imagen: nginx och de färdiga filerna. Inget Node, inga node_modules,
# ingen källkod. Allt från steg 1 som inte kopieras hit kastas.
FROM nginx:1.27-alpine
ENV API_UPSTREAM=api:4000
COPY client/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/client/dist /usr/share/nginx/html

EXPOSE 80