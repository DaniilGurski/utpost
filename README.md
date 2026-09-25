# Utpost

Plattform för friluftsdestinationer. Redaktionella guider, användarnas egna turer och bilder.

## Kom igång

```bash
npm install
docker compose -f docker-compose.dev.yml up -d
npm run seed
npm start
```

Appen ligger sen på http://localhost:3001 och API:et på http://localhost:4000.

## Struktur

- `api/` – Express + Postgres (Drizzle)
- `client/` – Vue + Vite, den nya appen på http://localhost:3001. Det är här du jobbar.
- `web/` – React + Vite, den gamla appen som ska översättas till Vue

## Arbetssätt

```bash
# 1. Skapa branchen från din issue på GitHub (Development-sektionen) och checka ut den
git commit --allow-empty -m "chore: #<id> init"
git push origin HEAD          # 2. Skapa sen en draft-PR på GitHub
# 3. Jobba, committa och pusha ofta
npm run lint && npm run format:check && npm run test -- --run
# 4. Allt grönt? Markera PR:en som ready for review, och merga till main efter review
```

Brancher ska vara korta: små PR:er mergas snabbt, så vi får färre konflikter och slipper långa brancher som glider isär från `main`.

### Kommunikation

- Vi når varandra i vår Discord-kanal.
- Fastnar du på en uppgift? Skriv på Discord så snart du kan.

## Workspaces

Repot är ett npm-workspace med `api`, `web` och `client`. Alla paket delar en `node_modules` och en `package-lock.json` i roten.

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

## Deploy

Fråga Marcus.
