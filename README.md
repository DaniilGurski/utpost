# Utpost

Plattform för friluftsdestinationer. Redaktionella guider, användarnas egna turer och bilder.

## Kom igång

Kopiera först `.env.example` till `.env` och fyll i egna användarnamn och lösenord. `.env` committas aldrig.

```bash
cp .env.example .env
```

Det finns två sätt att köra Utpost. Båda använder samma compose-fil (`docker-compose.yml`).

### 1. Allt i Docker

Kräver bara Docker. Klienten, API:et, Postgres och MongoDB startar med ett kommando:

```bash
docker compose up --build
docker compose exec api npm run seed   # i en annan terminal, fyller databasen
```

Kör alltid med `--build` efter ändringar i en Dockerfile eller i koden, annars körs en gammal image.

Client-imagen byggs i två steg (multi-stage): `node:22-alpine` bygger klienten och `nginx:1.27-alpine` serverar `dist/`. Nginx skickar också `/api/` och `/graphql` vidare till API:et.

| Client-image                                      | Storlek (`docker image ls`, DISK USAGE) |
| ------------------------------------------------- | --------------------------------------- |
| Före: ett steg, `node:22-alpine` + `vite preview` | 626 MB                                  |
| Efter: multi-stage, `nginx:1.27-alpine`           | 73,8 MB                                 |

### 2. Databaserna i Docker, koden lokalt

Bra när du utvecklar och vill ha hot reload. Kräver Node lokalt (samma version som i Dockerfilerna, `node:22`).

```bash
docker compose up -d postgres mongo
npm install

# .env pekar på tjänstnamnen (postgres:5432, mongo:27017), som bara finns inne i Docker-nätverket.
# Utanför Docker går vi via de publicerade portarna i stället:
export DATABASE_URL="postgres://<user>:<lösenord>@localhost:5433/utpost"
export MONGO_URL="mongodb://<user>:<lösenord>@localhost:27017/?authSource=admin"

npm run seed
npm run dev
```

Postgres är publicerad på 5433 (inte 5432) för att inte krocka med en lokalt installerad Postgres.

I båda fallen ligger appen på http://localhost:3001 och API:et på http://localhost:4000.

### Skapa en testanvändare

Registrera en användare direkt mot API:et. Svaret innehåller en JWT (`token`) och användaren.

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test1234", "displayName": "Test User"}'
```

För att använda token i anrop mot GraphQL (kräver `jq`):

```bash
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test1234", "displayName": "Test User"}' | jq -r .token)

curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query": "{ __typename }"}'
```

Använd en ny e-postadress varje gång, registreringen saknar felhantering för dubbletter. Om användaren redan finns: logga in med `POST /api/auth/login` (`email` + `password`).

## Struktur

- `api/` – Express + Postgres (Drizzle)
- `client/` – Vue + Vite, den nya appen på http://localhost:3001. Det är här du jobbar.
- `shared/` – `@utpost/shared`, delade TypeScript-typer (API-kontraktet) som både `api` och `client` importerar
- `web/` – React + Vite, den gamla appen som ska översättas till Vue

## Arbetssätt

### Så ser ett vanligt arbetsflöde ut

```bash
# 1. Skapa branchen från din issue på GitHub (Development-sektionen) och checka ut den
git commit --allow-empty -m "chore: #<id> init"
git push origin HEAD          # 2. Skapa sen en draft-PR på GitHub
# 3. Jobba, committa och pusha ofta
npm run lint && npm run format:check && npm run typecheck && npm run test -- --run
# 4. Allt grönt? Markera PR:en som ready for review, och merga till main efter review
```

Brancher ska vara korta: små PR:er mergas snabbt, så vi får färre konflikter och slipper långa brancher som glider isär från `main`.

### Git

1. **Branch:** skapa en branch från en issue på GitHub (under _Development_-sektionen) och följ instruktionerna där.
2. **Init-commit:** gör en tom commit innan du börjar jobba:
   `git commit --allow-empty -m "chore: #<id> init"`
3. **Draft-PR:** skapa en draft-PR för branchen på GitHub, så att teamet kan följa arbetet.
4. **Pusha ofta:** `git push origin HEAD`
5. **Commits:** använd conventional commits (`typ: beskrivning`):
   - `feat`: något nytt
   - `fix`: buggfix
   - `docs`: dokumentation (markdown)
   - `chore`: organisation och justeringar som inte lägger till något nytt
6. **Ready for review:** kör lint, `format:check`, typkontrollen och testerna (`npm run lint`, `npm run format:check`, `npm run typecheck`, `npm run test -- --run`). Fixa allt som är rött innan du markerar PR:en som ready.

### Kommunikation

- Vi når varandra i vår Discord-kanal.
- Fastnar du på en uppgift? Skriv på Discord så snart du kan.

## Workspaces

Repot är ett npm-workspace med `api`, `web`, `client` och `shared`. Alla paket delar en `node_modules` och en `package-lock.json` i roten.

- Kör `npm install` bara i roten, aldrig inne i en workspace-mapp. Annars riskerar vi en extra lockfil.
- Scripten för `client` (lint, test, format) körs direkt från roten, du behöver inte ange workspace.
- Lägg till ett beroende i en workspace med `--workspace` (eller `-w`):
  `npm install <paket> -w client` (`-D` för dev-beroenden)
- Övriga scripts i en workspace: `npm run <script> -w <api|web|client>`.
- Genvägar i roten: `npm run dev:client`, `npm run dev:api`, `npm run dev:web`.

### Lint (ESLint)

```bash
npm run lint        # hitta problem
npm run lint:fix    # fixa det som går automatiskt
```

### Typkontroll (TypeScript)

```bash
npm run typecheck    # vue-tsc i client/ och tsc i api/
```

Körs även i CI (jobbet `Kvalitet`), så typfel stoppar PR:en.

### Tester (Vitest)

```bash
npm run test              # watch-läge, kör om vid ändringar
npm run test -- --run     # kör en gång och avsluta
```

Lägg testfiler bredvid koden de testar, t.ex. `Foo.test.js`.

### Prettier

```bash
npm run format:check    # kolla formatering
npm run format:write    # formatera om filerna i src/
```

Tips: aktivera "format on save" i editorn så slipper du köra det för hand.

## Branchstrategi

Vi använder **trunk-based development med pull requests**. Strategin är ny för oss och vi vill testa den.

- `main` är den enda långlivade branchen. Vi har ingen `dev`-branch.
- Allt arbete sker i korta feature-brancher som mergas till `main` via PR.
- Varför: det tar bort ett lager av komplexitet, vilket passar ett litet team på 4 personer. Genom att merga oftare undviker vi också konflikter och synkroniseringsproblem mellan brancherna.
- Vi använder ändå PR:er (även som drafts) så att teamet kan följa en features framsteg under dagen.

## Mätning före/efter (M5)

B1:
Före M5: När man navigerar från Turer till Guider och tillbaka syns två POST /graphql för turlistan, ett per besök, eftersom gql() gör ett nytt fetch varje gång vyn monteras.
Efter M5: När man navigerar från Turer till Guider och tillbaka syns bara ett POST /graphql för turlistan, eftersom urqls cache svarar på det andra besöket.
Turdetalj (`TourDetails`): första besöket på en tur ger ett POST /graphql, att gå tillbaka till listan och öppna samma tur igen ger inget nytt, en tur med annat `id` ger ett nytt POST (cachen nycklas på fråga + variabler).

B2:
Tog bort `distanceM` från `type Tour` i schemat och körde `npm run typecheck` (kör codegen först):

```
Error 0: Cannot query field "distanceM" on type "Tour".
    at client/src/views/TourDetailView.vue:5:9
```

Codegen stannar vid första frågan som inte validerar, så `ToursView` (som också använder `distanceM`) syns först när `TourDetailView` är fixad.

B4:

```graphql
query TourList {
  tours {
    id
    title
    distanceM
    user {
      displayName
    }
    guide {
      title
    }
    photos {
      id
    }
  }
}
```

Före: [graphql] TourList: 136 databasfrågor, 126 ms
Efter: 2 för varje

B6:
Regressionstestet: "tours returns 50 tours with their user in 2 database queries, not 51"

loader bortkopplad: 51 queries

B7:
PR tog 50s, main tog 44s
Required checks:

- Quality
- Integration
- Build
- Image

## Migrering av turloggar till MongoDB (M5)

`npm run migrate:logs` skriver ett dokument per tur i MongoDB med loggpunkterna inbäddade i `logs`.
Skriptet går att köra om (`replaceOne` med upsert + unikt index på `tour_id`) och avslutar med felkod om antalen inte stämmer.
`Tour.logs` i GraphQL läser nu MongoDB; `tour_logs` i Postgres ligger kvar för REST och den gamla klienten.

Första körningen:

```
Postgres: 201 turer, 5769 rader i tour_logs
MongoDB: 200 nya dokument, 1 ersatta
MongoDB: 201 dokument, 5769 loggpunkter i tours-samlingen
Verifierat
```

Andra körningen (inget nytt skapas):

```
Postgres: 201 turer, 5769 rader i tour_logs
MongoDB: 0 nya dokument, 201 ersatta
MongoDB: 201 dokument, 5769 loggpunkter i tours-samlingen
Verifierat
```

## Deploy

Fråga Marcus.
