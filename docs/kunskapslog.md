# Kunskapslog

| Kursmål                  | Post i vecka | Var det syns i mitt arbete                                                  | Siktar på VG |
| ------------------------ | ------------ | --------------------------------------------------------------------------- | ------------ |
| Fullstack 4              | V38          | PR #16, `README.md`, `.github/`                                             | -            |
| Fullstack 5 · Cloud 3    | V39          | PR #32, `README.md` PR #34, `.github/workflows/ci.yml`                      | -            |
| Fullstack 3 · Cloud 5, 6 | V40          | PR #48, PR #68, `docs/testing.md` PR #74, `.github/workflows/ci.yml` PR #60 | -            |
| Fullstack 1 · Cloud 4    | V41          | PR #83, PR #87 `docs/database.md`, PR #90 `README.md`, PR #92               | -            |

## Vecka 38 – Ramverket och arbetssättet

**Kursmål:** Fullstack 4

### Vad jag förstått

Fullstack 4:

- Skillnader mellan Vue och React
- Hur det är att jobba med Vue på grundnivå
- Branchstrategier: Git, GitFlow, Trunc Based

### Var det syns i mitt arbete

Fullstack 1: PR #14 (inte Vue kod, får inte merga kod i M0)

### Kvar att förstå

Hur kan man tillämpa CODEOWNERS i det här projektet. Känns ganska onödigt just nu.

### Siktar på VG

Nej.

## Vecka 39 – Routing, state och CI

**Kursmål:** Fullstack 5 · Cloud 3

### Vad jag förstått

Fullstack 4:

- State management med Pinia

Cloud 5:

- Vad är CI or varför det finns
- Skapa GitHub actions och Rulesets
- Bygga en enkel pipeline

### Var det syns i mitt arbete

Fullstack 4: Har inte använd Pinia än.
Cloud 5: `.github/workflows/ci.yml`, `docs/pipeline.md`

### Kvar att förstå

Använda Pinia i praktiken

### Siktar på VG

Nej.

## Vecka 40 – TypeScript och kvalitetssäkring

**Kursmål:** Fullstack 3 · Cloud 5, 6

### Vad jag förstått

Fullstack 3:

- Hur man skapar en Pinia store för en user session
- Hur man skyddar routes med beforeEach med Vue Router

Cloud 5-6:

- Hur man förbättrar en pipeline med en typecheck script.

### Var det syns i mitt arbete

Fullstack 3: PR #68 (Pinia store, route guards), PR #48 (`shared/`)
Cloud 5, 6: `docs/testing.md` (PR #74), typecheck-steget i `.github/workflows/ci.yml` (PR #60, inte av mig)

### Kvar att förstå

Fortfarande behöver bättre förstå hur man gör TDD i praktiken, hur man skriver komponenttester

### Siktar på VG

Nej.

## Vecka 41 – NoSQL och containrar

**Kursmål:** Fullstack 1 · Cloud 4

### Vad jag förstått

Fullstack 1:

- Fördelar och nackdelar med MongoDB jämfört med Postgres
- Inbäddade och refererade dokumentmodeller
- Gränsen på 16 MB per dokument, och bucket-mönstret för att hantera stora dokument
- Hur man kopplar Mongo till en Express-server

Cloud 4:

- Compose-tjänster, healthchecks och `depends_on` med `service_healthy`
- Tjänstnamn i Docker-nätverket (`postgres:5432`) jämfört med localhost från värden (`localhost:5433`)
- Namngivna volymer

### Var det syns i mitt arbete

Fullstack 1: PR #83 (`api/src/db/mongo.js`, health check, `mongo:smoke`), PR #87 (`docs/database.md`)
Cloud 4: PR #83 (Mongo-tjänsten i compose), PR #90 (`README.md`), PR #92 (databasadresser i compose)

### Kvar att förstå

Hur Docker-nätverk fungerar mer i detalj.

### Siktar på VG

Nej.
