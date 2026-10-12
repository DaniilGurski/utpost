FROM node:22-alpine
WORKDIR /app

# Paketfiler först, så att npm ci-lagret cachas
COPY package.json package-lock.json ./
COPY api/package.json api/
COPY web/package.json web/
COPY client/package.json client/
COPY shared/package.json shared/
RUN npm ci --workspace=client

# Koden efter
COPY client/ client/
COPY shared/ shared/

# Bygg till client/dist
RUN npm run build --workspace=client

WORKDIR /app/client
EXPOSE 4173
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]