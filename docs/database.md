# Beslutsdokument: databasval

_Ett av teamets sex beslutsdokument. Skrivs i M3, hålls levande. Samma mall som `docs/testing.md`. Fyll i varje rubrik – en sida räcker, men varje påstående ska gå att försvara muntligt på onsdag._

**Datum:** 2026-10-12
**Beslut:** Turer (`tours`), deras loggpunkter (`tour_logs`) och fotometadata (`photos`) flyttas till MongoDB som ett dokument per tur. `users` och `guides` stannar i Postgres. Gränsen går mellan det som skrivs en gång och alltid läses ihop (tur + punkter + foton) och det som delas och pekas på från många håll (användare, guider).

## Bakgrund

Vi ärvde ett API där allt ligger i Postgres och där `GET /api/tours` (skuld TD-11) för varje tur gör fyra frågor (användare, guide, foton, loggpunkter) och skickar med alla loggpunkter. Det här beslutet betalar av första halvan av skuld 4 (allt ligger i Postgres).

Uppmätt mot den seedade databasen:

| Mått                                  | Värde                                      |
| ------------------------------------- | ------------------------------------------ |
| Storlek på `GET /api/tours`           | 291 544 byte (ca 285 kB), ca 0,95 s        |
| Databasfrågor per anrop               | 201 (1 + 50 turer × 4)                     |
| Rader i `tour_logs`                   | 5 976 (200 turer, 20–39 punkter per tur)   |
| Rader i `photos` / `users` / `guides` | 248 / 12 / 40                              |
| Största turen                         | id 103, 39 punkter, ca 3,5 kB som dokument |
| Turer utan guide                      | 43 av 200 (`guide_id` är null)             |

Om `tour_logs`: `elevation_m` och `heart_rate` är aldrig null, `note` är alltid null. Svaret innehåller dessutom hela `users`-raden (inklusive `password_hash`) och hela guiden (inklusive `body_html`) för varje tur, vilket är mer än listan behöver.

Skälet är alltså inte att "MongoDB är snabbare". Skälet är att en tur _läses som en helhet_, och i dag sätts den ihop av fyra tabeller vid varje läsning.

## Dokumentmodellen för turer

Loggpunkter och foton **bäddas in** eftersom de alltid läses tillsammans med turen, aldrig frågas efter för sig och aldrig delas mellan turer. Användare och guide **refereras** med id, plus en liten ögonblicksbild av namnet så att listan kan visas utan ett andra uppslag. Aldrig `password_hash` eller `body_html`.

Ögonblicksbilden kan bli inaktuell om en användare byter namn eller en guide byter titel. Det accepterar vi: det händer sällan, och vid behov uppdateras bilden med ett `updateMany` vid namnbytet.

```json
{
  "_id": "ObjectId",
  "tour_id": 103,
  "user_id": 7,
  "user": { "id": 7, "display_name": "Anna Berg" },
  "guide_id": 12,
  "guide": { "id": 12, "title": "Stora Björnleden 12" },
  "title": "Tur 103",
  "started_at": "2026-05-14T08:30:00Z",
  "distance_m": 14250,
  "notes": null,
  "stats": {
    "points": 39,
    "elevation_gain_m": 410,
    "duration_s": 11400,
    "avg_hr": 128,
    "max_hr": 161
  },
  "logs": [
    {
      "t": "2026-05-14T08:30:00Z",
      "lat": 62.41,
      "lon": 15.2,
      "elevation_m": 420,
      "heart_rate": 112
    }
  ],
  "photos": [{ "filename": "tour-103-1.jpg", "width": 4032, "height": 3024 }]
}
```

- `guide_id` och `guide` är `null` för turer utan guide (43 av 200 i dag).
- `tour_id` från Postgres finns kvar i dokumentet tills migreringen är klar.
- `logs[].note` tas bort, eftersom kolumnen aldrig har ett värde. Läggs till igen om funktionen byggs.
- `stats` förberäknas en gång vid skrivning (av migreringsskriptet i M5, därefter av `POST`). `distance_m` på toppnivå behålls oförändrad så att klientens kontrakt inte ändras i M5.
- **Storlek:** en loggpunkt är ca 81 byte i BSON, så en tur med 39 punkter blir ca 3,5 kB. En mycket lång dagstur (12 timmar, en punkt var femte sekund) blir ca 8 600 punkter, alltså under 1 MB.
- **16 MB-gränsen:** den nås först vid ca 200 000 punkter, så den är ingen risk för våra turer. Om en tur någon gång ändå blir för stor delar vi upp punkterna i flera dokument per tur (_bucket pattern_, t.ex. 1 000 punkter per dokument med `tour_id` som nyckel). Det byggs inte nu.

**Index**

| Index                    | Används av                                       |
| ------------------------ | ------------------------------------------------ |
| `{ tour_id: 1 }`, unique | `GET /tours/:id`, och verifiering av migreringen |
| `{ started_at: -1 }`     | `GET /tours` (nyaste först)                      |

Inget index på `user_id` eller `guide_id` än: ingen skärm frågar efter "alla turer för den här användaren". Det läggs till den dag en sådan skärm byggs.

**Lista mot detalj:** `GET /tours` använder en projektion utan `logs` (titel, datum, `stats`, namn-ögonblicksbilder). `GET /tours/:id` returnerar hela dokumentet. Det är den stora vinsten, och den kommer av modellen plus projektionen.

## Vad som stannar i Postgres

| Tabell      | Var              | Motivering                                                                                                                                   |
| ----------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `users`     | Postgres         | Inloggning och roller. Refereras från turer och guider, ändras på ett ställe och behöver unika e-postadresser och konsekvens.                |
| `guides`    | Postgres         | Redaktionellt innehåll som delas av många turer och refereras med `guide_id`. Passar bra relationellt och är inte en del av en turs läsning. |
| `tours`     | Mongo            | Flyttar till `tours`-dokumentet. Tabellen stannar kvar, fryst (se migreringen).                                                              |
| `tour_logs` | Mongo (inbäddad) | Läses alltid tillsammans med turen. Tabellen stannar kvar, fryst.                                                                            |
| `photos`    | Mongo (inbäddad) | Metadata (`filename`, `width`, `height`) bäddas in. Själva bilderna ligger kvar på disk i `uploadDir`. Tabellen stannar kvar, fryst.         |

## Så här ska migreringen gå till (genomförs i M5)

1. **Kopiera.** Ett skript läser alla turer ur Postgres (`tours` + `tour_logs` + `photos` + namn ur `users`/`guides`), bygger ett dokument per tur med `stats` och skriver det med `replaceOne({ tour_id }, doc, { upsert: true })`. Det går att köra om utan dubbletter.
2. **Index.** Skriptet skapar de två indexen ovan.
3. **Verifiera.**
   - antal turer i Mongo = antal rader i `tours` (200)
   - summan av `logs.length` = antal rader i `tour_logs` (5 976)
   - summan av `photos.length` = antal rader i `photos` (248)
   - stickprov på tre turer, varav en utan guide, där punkterna jämförs en och en
4. **Byt källa.** `/api/tours` byter källa till Mongo via `TOURS_SOURCE=postgres|mongo` med `mongo` som standard. Listan använder projektionen, detaljen hela dokumentet.
5. **Skrivvägar.** `POST /tours`, GraphQL-mutationen `createTour`, `DELETE /tours/:id` och fotouppladdning skriver bara till Mongo. `POST /tours` och `createTour` går genom samma `createTour` i `api/src/data/tours.js`, så när den byter källa följer båda med. Mongo är den enda skrivande källan, så vi har ingen dubbelskrivning och inget synkproblem.
6. **`tour_logs` och de andra turtabellerna efteråt.** De behålls men fryses: ingen kod skriver till dem. Vi tar inte bort dem, eftersom det är osäkert om vi använder MongoDB på sikt.
7. **Reträtt.** Sätt `TOURS_SOURCE=postgres` för att läsa från de frysta tabellerna igen. Det ger de data som fanns vid frysningen. Det som skrivits i Mongo efter bytet följer inte med, så för en riktig reträtt skriver vi ett omvänt skript (Mongo → Postgres). Det skriptet är vår utgångsplan om vi byter bort Mongo.

## Alternativ vi jämförde

**A. Allt kvar i Postgres, med en `jsonb`-kolumn för loggpunkterna.**

- För: en databas, inga nya beroenden, transaktioner över hela turen, ingen ny drift.
- Emot: punkter inuti `jsonb` blir svåra att indexera och uppdatera enskilt. Det löser inte att användare och guide måste slås upp per tur, och det betalar inte av skuld 4 (allt ligger i Postgres).

**B. Allt till MongoDB, även `users` och `guides`.**

- För: en databas att drifta.
- Emot: användare och guider är relationella och delas av många poster. Inloggning, roller och guide→användare passar sämre som dokument, och M5-migreringen blir större och mer riskfylld. Ingen läsning vinner på att flytta dem.

**C. Valt: turer i Mongo, `users` och `guides` i Postgres.**

- För: modellen följer hur data läses. `/api/tours` går från 201 frågor till 1, och punkterna försvinner ur listan. Relationerna stannar där de hör hemma.
- Emot: två databaser att drifta och backa upp, och namn-ögonblicksbilden kan bli inaktuell.

## Konsekvenser

- **Två databaser** att drifta, backa upp (`pg_dump` + `mongodump`) och övervaka.
- **Två anslutningssträngar** i miljön (`DATABASE_URL`, `MONGO_URL`), i `.env` / `.env.example`. Inga nya lösenord i committade filer.
- **Compose (M3 steg 3):** en `mongo`-tjänst med namngiven volym och healthcheck. `api` har `depends_on` med `condition: service_healthy` för båda databaserna.
- **Pipeline:** CI behöver en Mongo-tjänst (service container) för integrationstester som läser och skriver turer.
- **Molnet (M6):** en hanterad Mongo (t.ex. Atlas) eller en extra container, en andra hemlighet och en andra sak att återställa.
- **Kod:** `TOURS_SOURCE`-flaggan lägger en liten gren i tur-routerna. Den tas bort när vi är säkra på Mongo.
- **Frysta Postgres-tabeller** kostar lagring och kan förvirra. Vi accepterar det som priset för att kunna backa.
- Namn-ögonblicksbilden kan bli inaktuell, se dokumentmodellen.

**Skrivet av:** Daniil Gurski
