# Kunskapslogg – Douglas

Cloud, CI/CD och arbetsmetodik + Avancerad fullstackutveckling, v. 38–51 2026

## Sammanfattningstabell

| Kursmål      | Post i vecka | Var det syns i mitt arbete | Siktar på VG |
| ------------ | ------------ | -------------------------- | ------------ |
| Fullstack 4  | 38           |                            | –            |
| Fullstack 5  | 39           |                            | –            |
| Cloud 3      | 39           |                            | –            |
| Fullstack 3  | 40           |                            | –            |
| Cloud 5      | 40           |                            | –            |
| Cloud 6      | 40           |                            | –            |
| Fullstack 1  | 41           |                            | –            |
| Cloud 4      | 41           |                            | –            |
| Fullstack 2  | 42           |                            | –            |
| Cloud 1      | 44           |                            | –            |
| Cloud 2      | 45           |                            | –            |
| Fullstack 8  | 46           |                            | –            |
| Fullstack 9  | 47           |                            | –            |
| Fullstack 6  | 48           |                            | –            |
| Fullstack 7  | 48           |                            | –            |
| Fullstack 19 | 49           |                            | –            |

---

## Vecka 38 – Ramverket och arbetssättet

**Kursmål:** Fullstack 4

### Vad jag förstått

Fullstack 4: Mycket logik som finns i react finns även i vue men under annat namn (custom hook - composable, useEffect - watchEffect). En route i vue skrivs som ett objekt med data men vad den skickar vidare är en URL/slug, precis som i react. Den kan således inte skicka data direkt till GuideCard.

### Var det syns i mitt arbete

`GuideCard.vue` (fungerar korrekt i `v-for` i `GuidesView.vue`)
och `router/index.js`, där routen för `/guider/:slug` felaktigt pekar direkt på GuideCard utan en "mellan-komponent".

### Kvar att förstå

Jag behöver skapa en komponent som är ett mellanled mellan routingen och komponenten som renderar UI.

### Siktar på VG

Nej.

---

## Vecka 39 – Routing, state och CI

**Kursmål:** Fullstack 5 · Cloud 3

### Vad jag förstått

Fullstack 5: Fokus för mig låg helt på Cloud/CI denna vecka.

Cloud 3: Sätta upp en yaml-fil för CI workflow med korrekt indentering och syntax. Den triggas av en PR/push och körs i ordning på tom maskin. Lärde mig att en required status check måste matcha jobbnamnet exakt i rulesetet.
Pipelinen failade första gången ("No test files found") — löste genom ett enkelt fristående test under client.

### Var det syns i mitt arbete

Fullstack 5:

Cloud 3: .github/workflows/ci.yml, client/src/sanity.test.js

### Kvar att förstå

Hur man cachar npm-beroenden i GitHub Actions för att korta ner `npm ci`-
steget (som tog överlägset längst tid i körningen). Även hur man skriver
riktiga komponenttester (t.ex. med @vue/test-utils) mot GuideCard/GuidesView,
i stället för det minimala sanity-testet jag lade till bara för att verifiera
att pipelinen fungerade.

### Siktar på VG

Nej.

---

## Vecka 40 – TypeScript och kvalitetssäkring

**Kursmål:** Fullstack 3 · Cloud 5, 6

### Vad jag förstått

Fullstack 3: `elevation_m` är `number | null`, så TypeScript kräver att jag
hanterar `null` innan jag räknar. I JS hade `150 - null` tyst blivit 150.
I `elevationGain` hoppar jag över `null` med `continue` och sparar senaste giltiga
värdet i `let previous: number | null`. `ref<Guide[]>` talar om vilken typ jag förväntar mig, men TypeScript kontrollerar bara koden, inte vad API:et faktiskt skickar tillbaka vid körning.

Cloud 5: Ett test ska kontrollera ett beteende. Mitt test för `elevationGain`
kontrollerar att bara stigningar räknas: [100, 150, 120, 180] ger 110, och
nedförsbacken drar inte av något. Jag skrev också medvetet ett test som blev rött
lokalt (sökordet 'små' matchar Småland, så texten för tom träff visades aldrig)
och rättade sedan sökordet till 'fjfjg'.

Cloud 6:

### Var det syns i mitt arbete

Fullstack 3: `client/src/views/GuidesView.vue` (`ref<Guide[]>`). `elevationGain` finns i
utpost-ts-douglas-daniil-garen/client/src/lib/tours.ts

```ts
export const elevationGain = (logs: TourLog[]): number => {
  let gain = 0;
  let previous: number | null = null;

  for (const log of logs) {
    const current = log.elevation_m;
    if (current === null) continue;
    if (previous !== null && current > previous) {
      gain += current - previous;
    }
    previous = current;
  }

  return gain;
};
```

Cloud 5: utpost-ts-douglas-daniil-garen/client/src/lib/tour.tests.ts
utpost-ts-douglas-daniil-garen/client/src/views/GuidesView.test.ts

```ts
describe("elevationGain", () => {
  it("summerar bara stigningar, inte nedförsbackar", () => {
    expect(elevationGain([log(100), log(150), log(120), log(180)])).toBe(110);
  });
});
```

```ts
it("visar om sökningen inte matchar någon guide", async () => {
  const user = userEvent.setup();
  renderView();
  await screen.findByText("Kebnekaise");

  await user.type(screen.getByLabelText("Sök"), "fjfjg");

  expect(
    screen.getByText("Inga guider matchar sökningen."),
  ).toBeInTheDocument();
});
```

Cloud 6:

### Kvar att förstå

Typer kontrolleras bara vid kompilering. Jag vet inte hur man verifierar att
API-svaret faktiskt har rätt form vid körning.

### Siktar på VG

Nej.

---

## Vecka 41 – NoSQL och containrar

**Kursmål:** Fullstack 1 · Cloud 4

### Vad jag förstått

Fullstack 1: Ett MongoDB-dokument är ett JSON-liknande objekt (lagrat som BSON) som kan innehålla nästlade objekt och arrayer, till skillnad från Postgres där man använder tabeller och rader. För turer används nu MongoDB (kan ändras senare) och för users och Guides Postgres då dessa delas av flera turer och refereras. För en tur i Mongo bäddas mätpunkter in i samma dokument och läses därför snabbare än via referens, eftersom hela turen med dess data läses på samma gång. "Bucket pattern" används om ett dokument riskerar nå gränsen på 16 MB.

Cloud 4: Skapade en Dockerfile för klienten. Den byggs i roten av repot för att package-lock ligger där. Installeras med npm ci som läser package-lock.json, så alla i teamet får samma versioner. Jag har en lokal .dockerignore med **/node_modules som inte
committas, annars skriver min Windows-node_modules över de paket som installerades i Docker-containern. Porten 4173 i containern kopplas till port 5173 på min dator.

### Var det syns i mitt arbete

Fullstack 1: docs/decisions/databas.md

Cloud 4: client/Dockerfile

### Kvar att förstå

Multi-stage-bygge, som ska göra imagen mindre. Hur Compose använder
Dockerfilerna tillsammans med healthchecks.

### Siktar på VG

Nej.

---

## Vecka 42 – GraphQL

**Kursmål:** Fullstack 2

### Vad jag förstått

Fullstack 2: Typer för GraphQL använder skalärer (int, float) och ett utropstecken för not null, värden som måste finnas. Schema definierar vad som kan tas emot av ett api. En query skickas från klienten med vad som efterfrågas och behöver matcha schemat.Typerna bestäms därmed av datan som backend (eller vad man testar mot) returnerar.

ToursView skickar nu bara en fråga via gql() och ber bara om fält tabellen visar. Typen ToursData skrevs för hand så att ts vet formen på svaret. Testerna för ToursView ändrades för att matcha vad mock api svarar med, med tydliga errors även vid 200-svar.

### Var det syns i mitt arbete

Fullstack 2: api/src/graphql/schema.js
client/src/views/ToursView.vue
client/src/views/ToursView.test.ts

### Kvar att förstå

N+1: varje tur kostar extra databasfrågor för användare, guide och foton. Det ska lösas senare i kursen. Hur codegen ersätter handskrivna typer i M5.

### Siktar på VG

Nej.

---

## Vecka 43 – GraphQL i klienten

**Kursmål:** (fri post)

### Vad jag förstått

### Var det syns i mitt arbete

### Kvar att förstå

### Siktar på VG

Nej.

---

## Vecka 44 – Hosting och moln

**Kursmål:** Cloud 1

### Vad jag förstått

Cloud 1:

### Var det syns i mitt arbete

Cloud 1:

### Kvar att förstå

### Siktar på VG

Nej.

---

## Vecka 45 – Serverless

**Kursmål:** Cloud 2

### Vad jag förstått

Cloud 2:

### Var det syns i mitt arbete

Cloud 2:

### Kvar att förstå

### Siktar på VG

Nej.

---

## Vecka 46 – OWASP

**Kursmål:** Fullstack 8

### Vad jag förstått

Fullstack 8:

### Var det syns i mitt arbete

Fullstack 8:

### Kvar att förstå

### Siktar på VG

Nej.

---

## Vecka 47 – Headless CMS

**Kursmål:** Fullstack 9

### Vad jag förstått

Fullstack 9:

### Var det syns i mitt arbete

Fullstack 9:

### Kvar att förstå

### Siktar på VG

Nej.

---

## Vecka 48 – Rendering, prestanda och struktur

**Kursmål:** Fullstack 6, 7

### Vad jag förstått

Fullstack 6:

Fullstack 7:

### Var det syns i mitt arbete

Fullstack 6:

Fullstack 7:

### Kvar att förstå

### Siktar på VG

Nej.

---

## Vecka 49 – AI i flödet

**Kursmål:** Fullstack 19

### Vad jag förstått

Fullstack 19 (bygger på besluten från v. 41, 42, 46 – sammanfatta här med hänvisning till de beslutsdokumenten):

### Var det syns i mitt arbete

Fullstack 19:

### Kvar att förstå

### Siktar på VG

Nej.

---

## Vecka 50 – Tekniska motiveringar

**Kursmål:** (fri post)

### Vad jag förstått

### Var det syns i mitt arbete

### Kvar att förstå

### Siktar på VG

Nej.
