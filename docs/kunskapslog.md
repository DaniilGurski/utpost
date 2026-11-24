# Kunskapslog

| Kursmål                  | Post i vecka | Var det syns i mitt arbete                                                        | Siktar på VG |
| ------------------------ | ------------ | --------------------------------------------------------------------------------- | ------------ |
| Fullstack 4              | V38          | PR #16, `README.md`, `.github/`                                                   | -            |
| Fullstack 5 · Cloud 3    | V39          | PR #32, `README.md` PR #34, `.github/workflows/ci.yml`                            | -            |
| Fullstack 3 · Cloud 5, 6 | V40          | PR #48, PR #68, `docs/testing.md` PR #74, `.github/workflows/ci.yml` PR #60       | -            |
| Fullstack 1 · Cloud 4    | V41          | PR #83, PR #87 `docs/decisions/database.md`, PR #90 `README.md`, PR #92           | -            |
| Fullstack 2              | V42          | PR #97, PR #99, PR #111, PR #114 `docs/decisions/api-style.md`                    | -            |
| Fullstack 2 · Cloud 6    | V43          | PR #118, PR #119, PR #120, PR #122/#125, PR #124, PR #133, `README.md`            | -            |
| Cloud 1                  | V44          | PR #141, PR #142, PR #144, PR #145, PR #152, PR #153, `docs/decisions/hosting.md` | -            |
| Cloud 2                  | V45          | PR #165, PR #166/#167, PR #168, PR #169/#171, `docs/decisions/serverless.md`      | -            |
| Fullstack 8              | V46          | PR #176, PR #177, PR #182, PR #187 `docs/security.md`                             | -            |

## Vecka 38 – Ramverket och arbetssättet

**Kursmål:** Fullstack 4

### Vad jag förstått

Fullstack 4:

- Skillnader mellan Vue och React
- Hur det är att jobba med Vue på grundnivå
- Branchstrategier: Git, GitFlow, Trunc Based

### Var det syns i mitt arbete

Fullstack 4: PR #14 (inte Vue kod, får inte merga kod i M0)

### Kvar att förstå

Hur kan man tillämpa CODEOWNERS i det här projektet. Känns ganska onödigt just nu.

### Siktar på VG

Nej.

## Vecka 39 – Routing, state och CI

**Kursmål:** Fullstack 5 · Cloud 3

### Vad jag förstått

Fullstack 5:

- State management med Pinia

Cloud 3:

- Vad är CI or varför det finns
- Skapa GitHub actions och Rulesets
- Bygga en enkel pipeline

### Var det syns i mitt arbete

Fullstack 5: Har inte använd Pinia än.
Cloud 3: `.github/workflows/ci.yml`, `docs/pipeline.md`

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

Fullstack 1: PR #83 (`api/src/db/mongo.js`, health check, `mongo:smoke`), PR #87 (`docs/decisions/database.md`)
Cloud 4: PR #83 (Mongo-tjänsten i compose), PR #90 (`README.md`), PR #92 (databasadresser i compose)

### Kvar att förstå

Hur Docker-nätverk fungerar mer i detalj.

### Siktar på VG

Nej.

## Vecka 42 – GraphQL

**Kursmål:** Fullstack 2

### Vad jag förstått

Fullstack 2:

- Designa schemat (SDL) utifrån vyerna, inte tabellerna
- Fältresolvers som översätter från kolumnnamn (`length_km` → `lengthKm`)
- N+1-problemet och hur man mäter det (antal databasfrågor per operation i loggen)
- Mutation med en input-typ, och JWT i `context` (`UNAUTHENTICATED` utan token)
- När GraphQL ersätter REST och när det kompletterar

### Var det syns i mitt arbete

Fullstack 2: PR #97 (grund), PR #99 (resolvers, N+1-loggning), PR #111 (mutation, auth), PR #114 (`docs/decisions/api-style.md`)

### Kvar att förstå

Hur man löser N+1 i praktiken (DataLoader) och hur cache fungerar med GraphQL.

### Siktar på VG

Nej.

## Vecka 43 – GraphQL i klienten

**Kursmål:** Fullstack 2 · Cloud 6

### Vad jag förstått

Fullstack 2:

- DataLoader löser N+1 från vecka 42: TourList gick från 136 databasfrågor till 2
- urqls cache nycklas på fråga + variabler: samma tur igen ger inget nytt anrop, ett annat `id` gör det
- Migrera tur-loggar till MongoDB som inbäddade dokument, med ett skript som går att köra om (upsert + unikt index)

Cloud 6:

- Integrationstester mot riktiga databaser, med ett regressionstest som räknar frågor (2 med loader, 51 utan)
- Ett integrationsjobb i CI som kör testerna

### Var det syns i mitt arbete

Fullstack 2: PR #118 (mätning före), PR #119 (DataLoader), PR #120 (Mongo-migrering), PR #133 (`TourDetailView` med urql), `README.md` (B1, B4, B5)
Cloud 6: PR #122/#125 (integrationstester), PR #124 (integrationsjobb), `README.md` (B6, B7)

### Kvar att förstå

Inget just nu.

### Siktar på VG

Nej.

## Vecka 44 – Hosting och moln

**Kursmål:** Cloud 1

### Vad jag förstått

Cloud 1:

- Azure Container Apps: appen körs som en containerapp med fyra containrar (client, api, postgres, mongo) som sidecars, där bara client har ingress utåt. Den skalar till noll, och kallstarten mättes till ca 29 s
- OIDC mot Azure utan lösenord i GitHub: identiteten litar på miljön `azure-staging`, och GitHub har bara variabler på miljön, inga secrets

### Var det syns i mitt arbete

Cloud 1: PR #141 (konfiguration från miljön), PR #142 (`boot.js`, sha i `/api/health`), PR #144 (JWT-hemligheten ur koden och roterad), PR #145 (`web/` bort), PR #149/#151 (bootfix), PR #152 (`infra/azure/identity.sh`, bevis i `README.md`), PR #153 (`docs/decisions/hosting.md`, `README.md`)

### Kvar att förstå

Hur produktionsdatabaserna (Neon och MongoDB Atlas) kopplas in när sidecars försvinner.

### Siktar på VG

Nej.

## Vecka 45 – Serverless

**Kursmål:** Cloud 2

### Vad jag förstått

Cloud 2:

- Bildomskalningen är synkron och CPU-tung och blockerade event loopen i API:et. När den flyttades till funktionen `process-image` gick health max från 1447 ms till 30 ms i staging
- Flex Consumption skalar till noll och skalar ut per anrop. En kallstart tar ca 1 s, och en varm instans återanvänds men det är inte garanterat
- Inlåsning: logiken i `image.js` är portabel, men handlern, konfigurationen och deployen är Azure-specifika. Serverless Framework valdes bort eftersom v4 bara stöder AWS

### Var det syns i mitt arbete

Cloud 2: PR #165 (funktionen i Azure, nyckel till staging), PR #166/#167 (jobbet `deploy-function`), PR #168 (loggrad från pipelinen), PR #169/#171 (kallstart, `docs/decisions/serverless.md`)

### Kvar att förstå

Hur API:et kan slippa vänta på funktionen (kö i stället för synkront HTTP-anrop). Lokalt blev uppladdningen knappt snabbare.

### Siktar på VG

Nej.

## Vecka 46 – OWASP

**Kursmål:** Fullstack 8

### Vad jag förstått

Fullstack 8:

- Största risken var A01 Broken Access Control: routes för att ta bort och ändra saknade kontroll, så vem som helst kunde ta bort turer och ändra guider utan att logga in. Först skrevs tester som var röda (#176), sedan fixen (#177). Att testet är rött först visar att det verkligen fångar hålet, ett test som skrivs efteråt kan vara grönt även om det testar fel sak
- Klienten håller token i minnet (#182), inte i `localStorage`, eftersom ett skadligt skript kan läsa `localStorage` men inte minnet. Priset är att en omladdning loggar ut, vilket en refresh-token kan lösa
- Jobbet _Säkerhet_ i pipelinen (teamets PR #184) kör npm audit (sårbara paket), Trivy (sårbarheter och felkonfiguration i repot och api-imagen) och ZAP (kollar HTTP-svaren från appen, t.ex. saknade säkerhetsheaders). Ett fynd på high eller critical gör jobbet rött och blockerar merge, som när en gammal express gjorde det rött (#185)

### Var det syns i mitt arbete

Fullstack 8: PR #176 (röda tester), PR #177 (API:et lagat), PR #182 (token i minnet, skyddad route), PR #187 (`docs/security.md`)

### Kvar att förstå

Hur rate limiting på inloggningen görs i en större app: var den ska sitta (API:et, nginx eller Azure) och vilken gräns som är rimlig.

### Siktar på VG

Nej.
