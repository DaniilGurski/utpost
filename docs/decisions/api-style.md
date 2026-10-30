# Beslutsdokument: API-stil

_Ett av teamets sex beslutsdokument. Skrivs i M4, hålls levande. Samma mall som `testing.md` och `database.md`._

**Datum:** 2026-10-19
**Beslut:** _(en eller två meningar: ersätter GraphQL REST, kompletterar det, eller stannar ni på REST för vissa delar? Vilka?)_
GraphQL kompletterar REST: läsvyer med nästlad data går via GraphQL (först turlistan), medan inloggning, bilduppladdning och health stannar i REST.

## Bakgrund

_Skuld 6 med era egna siffror. Hur många anrop gör startsidan i React-klienten, hur många byte kommer tillbaka, och hur mycket av det används? Samma sak för turlistan. Mät i nätverksfliken eller med `curl … | wc -c`._

| Vy         | REST: anrop | REST: byte | GraphQL: anrop       | GraphQL: byte | Databasfrågor REST / GraphQL |
| ---------- | ----------- | ---------- | -------------------- | ------------- | ---------------------------- |
| Startsidan | 5           | 30 882     | 1 (+ 1 REST, health) | 22 579        | 5 / 3                        |
| Turlistan  | 1           | 292 540    | 1                    | 7 040         | 186 / 136                    |

Byte är svarskroppen okomprimerad (`curl -w '%{size_download}'`); API:et har ingen komprimering. Databasfrågorna är räknade i Postgres egen logg (`log_statement = 'all'`), inte i API-loggen, eftersom API-loggen bara räknar SQL inom `/graphql` och `routes/guides.ts` går direkt mot `pool`. För GraphQL stämmer siffrorna med API-loggen (`[graphql] Turer: 136`, `[graphql] Startsidan: 2`).

### Startsidan

| Anrop                 | Byte   | Frågor |
| --------------------- | ------ | ------ |
| `/api/guides`         | 26 137 | 1      |
| `/api/guides/popular` | 3 941  | 1      |
| `/api/guides/regions` | 96     | 1      |
| `/api/tours/latest`   | 676    | 1      |
| `/api/health`         | 32     | 1      |
| **REST totalt**       | 30 882 | 5      |
| GraphQL `Startsidan`  | 22 547 | 2      |
| `/api/health`         | 32     | 1      |
| **GraphQL totalt**    | 22 579 | 3      |

- Fem anrop för en sida. `popular` är en delmängd av `guides`, så samma guider skickas två gånger, och `regions` går att räkna fram ur `guides`.
- `health` gör `select 1` och en ping mot Mongo. Inget av det visas för användaren som data; anropet stannar i REST.
- GraphQL sparar bara ~27 %. Nästan allt är `bodyHtml`, som skickas i sin helhet fast `GuideCard` visar 180 tecken. Schemat saknar ett utdrag (och `lengthKm`, som `GuideCard` visar).

### Turlistan

- REST `/api/tours` skickar 292 540 byte, varav **245 743 byte (84 %) är `logs`**: 1 518 loggpunkter (rader i `tour_logs`, en GPS-punkt med tid, position, höjd och puls) som turlistan aldrig visar. Varje tur skickar dessutom `user_id`, `guide_id`, `notes` och hela `user`- och `guide`-objekten, fast sidan bara använder namn, guidetitel, längd och antal bilder.
- GraphQL `Turer` skickar 7 040 byte, **2,4 %** av REST-svaret.
- Båda gör N+1: 1 fråga för turerna, sedan 50 × användare + 50 × bilder + 35 × guide (de turer som har en guide). Det blir 136 frågor. REST lägger till 50 × `tour_logs`, totalt 186. GraphQL tar bort loggfrågorna men inte N+1, se Konsekvenser.

### Kontroll i webbläsaren

- React `/turer`: 2 anrop, 585 kB. `<React.StrictMode>` kör `useEffect` två gånger i utvecklingsläget, så det är samma 292 540 byte två gånger. I ett produktionsbygge blir det 1 anrop.
- Vue `/tours`: 1 anrop, 7,0 kB. Stämmer med curl.

### Frågor under mätningen

**Vad är loggpunkter?** Rader i `tour_logs`: en GPS-punkt per tidpunkt under turen, med tid, position, höjd och puls. Bara detaljsidan använder dem, men REST `/api/tours` skickar alla 1 518.

**Varför ökade Postgres-räknaren med 322 när API-loggen sa 136 för `Turer`?** Kommandot som mätte hur mycket av svaret sidan använder anropar `/api/tours` en gång till, och det kördes efter att räknaren lästs av. 322 − 136 = 186, exakt ett REST-anrop till `/api/tours`. Siffrorna i tabellen påverkas inte.

## Schemat i korthet

_Vilka typer och vilka ingångar i `Query` och `Mutation` har ni i v1? Vad heter fälten, och varför heter de inte som kolumnerna? Vad har ni medvetet lämnat utanför schemat (t.ex. `password_hash`)?_

- **Query:** `guides`, `guide(slug)`, `tours(limit = 50)` (max 200, begränsas i resolvern) och `tour(id)`.
- **Mutation:** `createTour(tour: CreateTourInput!): Tour!`. Kräver en JWT i `Authorization: Bearer …`, annars kommer `UNAUTHENTICATED` i `errors`. `userId` finns inte i inputen utan tas från token, så ingen kan skapa en tur åt någon annan.
- **`TourSummary` och `Tour`:** listan (`tours`) returnerar `TourSummary`, som saknar `logs` och `notes`. Bara `tour(id)` läser `tour_logs`. Det är därför turlistan går från 292 540 till 7 040 byte.
- **Namn:** fälten är camelCase (`displayName`, `distanceM`, `startedAt`) eftersom det är konventionen i GraphQL och i klientens TypeScript. Kolumnerna är snake_case i Postgres och mappas i resolvrarna. `user_id` och `guide_id` blir objekten `user` och `guide`.

Medvetet utanför schemat:

- **User:** `email`, `password_hash`, `role`, `created_at`. Lösenordshash och e-post ska aldrig gå att fråga efter; bara `id` och `displayName` visas för andra.
- **Guide:** `author_id`, och `length_km`. `length_km` är en känd lucka: ingen Vue-vy använder den i dag, men `GuideCard` gör det, så den läggs till när startsidan flyttas till GraphQL.
- **Photo:** `tour_id`, `created_at`. **LogPoint:** `note`.

## Vad som går via GraphQL och vad som stannar i REST

_Endpoint för endpoint eller vy för vy. Inloggning? Bilduppladdning? Health? Motivera varje rad._

| Vy / endpoint                            | Stil    | Varför                                                                                                                                                                                                           |
| ---------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Turlistan (`ToursView`)                  | GraphQL | Störst vinst: 2,4 % av REST-svaret. Nästlad data (användare, guide, bilder) per tur.                                                                                                                             |
| Turdetalj (`TourDetailView`)             | GraphQL | `tour(id)` med loggpunkterna, som läses ur Mongo.                                                                                                                                                                |
| Profil (`ProfileView`)                   | GraphQL | Egna turer: `tours(limit: 200)` filtreras på användaren i klienten, eftersom schemat inte kan filtrera på användare. Namn, e-post och roll kommer ur sessionen.                                                  |
| Guider (`GuidesView`, `GuideDetailView`) | REST    | Mätt i GraphQL men inte flyttad: bara ~27 % mindre, eftersom `bodyHtml` skickas i sin helhet. Kräver ett utdragsfält (och `lengthKm`) först. Startsidan portades inte till Vue i M6, `/` skickas till `/guides`. |
| Inloggning (`routes/auth.js`)            | REST    | En POST med lite data som returnerar en token. GraphQL tillför inget.                                                                                                                                            |
| Bilduppladdning (`photos.js`)            | REST    | Filuppladdning är enkel med multipart i REST; GraphQL saknar ett standardsätt.                                                                                                                                   |
| Health                                   | REST    | Datan visas aldrig för användaren. Används av drift, inte av vyer.                                                                                                                                               |

## Alternativ vi jämförde

_Minst två riktiga alternativ, t.ex. "laga REST-endpointsen" (smalare svar, en sammansatt endpoint för startsidan) och "GraphQL för allt". Vad talar för och emot vart och ett?_

- **Laga REST.** Ta bort `logs` och onödiga fält ur `/api/tours`, och bygg en sammansatt endpoint för startsidan. För: inget nytt verktyg, och bara att släppa `logs` tar bort 84 % av turlistans svar. Emot: varje ny vy kräver en ny eller ändrad endpoint, och den sammansatta endpointen måste ändras varje gång startsidan ändras.
- **GraphQL för allt.** För: ett sätt att prata med API:et, klienten väljer själv sina fält. Emot: det mesta av API:et är REST i dag, och inloggning, uppladdning och health blir krångligare utan vinst.
- **Valt: GraphQL och REST sida vid sida.** GraphQL där vyer behöver nästlad data och olika fält, REST där ett enkelt anrop räcker.

## Konsekvenser

_Vad kostar valet? Tänk på: cachning, felhantering i klienten (200 med `errors`), N+1 i resolvers (åtgärdas i M5), två sätt att prata med API:et under migreringen, typer som skrivs för hand tills codegen finns._

- **N+1:** `Tour.user`, `Tour.guide` och `Tour.photos` gör ett uppslag per tur, 136 frågor för turlistan. Mätt men inte löst; DataLoader eller liknande i M5. Efter M5 kan `user` och `guide` besvaras från namnen i Mongo-dokumentet (se `docs/decisions/database.md`).
- **Fel kommer med status 200:** `gql()` i `client/src/graphql.ts` kastar på `body.errors`, så vyerna hanterar fel på samma sätt som för REST.
- **Ingen HTTP-cache:** allt är POST till `/graphql`, så webbläsaren cachar inget. Inget problem med en vy, men det behövs en klientcache när fler vyer flyttas.
- **Handskrivna typer:** ingenting kontrollerar att typerna i klienten matchar frågan. Codegen kommer i M5.
- **Två sätt att prata med API:et:** `api.ts` för REST och `graphql.ts` för GraphQL. Turer läses dock via samma modul (`api/src/data/tours.js`) i båda, så M5:s `TOURS_SOURCE`-växel byts på ett ställe.

**Skrivet av:** Daniil, Douglas, Cristian, Garen
