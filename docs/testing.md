# Teststrategi – Utpost

_Beslutsdokument. Skrivs av teamet i M2 och hålls levande. Det är det första av teamets sex beslutsdokument – samma mall som de andra i `docs/decisions/`._

**Datum:** 2026-10-06 · **Uppdaterad:** 2026-10-23 (M5: integrationstester för API:et)
**Beslut:** Vi testar beteende som användaren ser, på lägsta möjliga nivå: ren logik som enhetstester, vyer som komponenttester med mockad `fetch`, och GraphQL-API:et som integrationstester mot riktiga databaser. Ingen PR mergas med rött.

## Bakgrund

Utpost var ärvd kod utan tester, och pipelinen körde bara ett röktest (en sanity test). Tre vyer och en logikfunktion behövde täckas, och höjdmeterbuggen fanns kvar. Vi behövde en gemensam bild av vad som testas var, så att testerna fångar riktiga buggar och inte bara kör kod.

## Nivåer

Enhet (Vitest): ren funktion utan Vue eller nätverk, t.ex. `elevationGain`.
Komponent (Vitest + Vue Testing Library): en hel vy med mockad `fetch`. Testet kollar det användaren ser.
Integration (Vitest i `api/`, från M5): hela kedjan fråga → schema → resolvers → databas. Testerna anropar `yoga.fetch` direkt, så ingen server och ingen port behövs. De kör mot riktiga Postgres och MongoDB: compose-databaserna lokalt, och `services` i jobbet `Integration` i pipelinen. Databasen fylls med `npm run seed` och `npm run migrate:logs` först.
E2E: inte i M2. Vi tar det först när flödet inloggning till tur finns, och verktyget är inte valt.

## Karta: vad testas var

| Del av Utpost    | Beteende                                                        | Nivå        | Varför just där?                                          | Finns test i dag? |
| ---------------- | --------------------------------------------------------------- | ----------- | --------------------------------------------------------- | ----------------- |
| `elevationGain`  | summerar bara stigningar, inte nedförsbackar                    | enhet       | ren funktion, ingen Vue eller API behövs                  | ja                |
| `elevationGain`  | tom tur ger 0                                                   | enhet       | ren funktion, kantfall                                    | ja                |
| `elevationGain`  | hoppar över mätpunkter utan höjd i stället för att räkna 0      | enhet       | ren funktion, kantfall som annars ger fel höjdmeter       | ja                |
| `GuidesView`     | sökfältet filtrerar guider på titel                             | komponent   | sökningen är logik som användaren ser först               | ja                |
| `GuidesView`     | visar "N träffar" eller "Inga träffar" efter sökning            | komponent   | räknaren är det användaren läser av efter en sökning      | ja                |
| `GuidesView`     | visar felmeddelande när API:et failar                           | komponent   | felvägen får inte krascha vyn eller lämna den tom         | ja                |
| `ToursView`      | tabellen visar tur, av, guide, längd och bilder när data kommer | komponent   | huvudflödet: användaren ska se sina turer                 | ja                |
| `ToursView`      | visar "Inga turer" när listan är tom                            | komponent   | tomt läge ska skilja sig från laddning och fel            | ja                |
| `ToursView`      | visar felmeddelande när API:et failar                           | komponent   | felvägen får inte krascha vyn eller lämna den tom         | ja                |
| `TourDetailView` | visar längd, antal mätpunkter och höjdmeter för en tur          | komponent   | här fanns höjdmeterbuggen, siffran måste stämma med datan | ja                |
| `TourDetailView` | visar felmeddelande när API:et failar                           | komponent   | felvägen får inte krascha vyn eller lämna den tom         | ja                |
| GraphQL `tours`  | 50 turer med `user` på 2 databasfrågor, inte 51 (N+1)           | integration | DataLoader-fixen syns bara mot en riktig databas          | ja                |
| GraphQL `guide`  | okänd slug ger `null`, inte ett fel                             | integration | kontraktet mot klienten: "finns inte" är inget fel        | ja                |
| GraphQL          | okänt fält ger `errors` med status 200                          | integration | så svarar GraphQL, klienten måste läsa `errors`           | ja                |
| `createTour`     | utan token avvisas med `UNAUTHENTICATED`                        | integration | inloggningskravet får inte försvinna                      | ja                |
| `createTour`     | med token skapas turen för den inloggade användaren             | integration | skrivvägen hela vägen till databasen (testet städar)      | ja                |
| `Tour.logs`      | mätpunkterna kommer från MongoDB, lika många som i Postgres     | integration | migreringen får inte tappa mätpunkter                     | ja                |

## Regler

- En PR mergas när testerna är gröna både lokalt och i pipelinen. Resten av flödet står i README.
- Varje buggfix ur `docs/debt.md` får ett regressionstest med `TD-xx` i namnet. Vi försöker committa testet (rött) före fixen (grönt), men en annan ordning blockerar inte merge. Buggar utanför `debt.md` omfattas inte av regeln.
- Integrationstester mockar ingenting. De kör mot seedad data, och ett test som skriver till databasen tar bort det efteråt.
- Vi mockar API:et i komponenttester genom att stubba global `fetch` med `vi.stubGlobal("fetch", fetchMock)` och svara med `new Response(JSON.stringify(body), { status })`. `mockReset` körs i `beforeEach`.
- Täckning: inget procentkrav. En siffra uppmuntrar tester som bara kör kod. Kravet är att varje rad i kartan har ett test som blir rött om buggen kommer tillbaka. Vi omprövade det i M5 och behåller regeln även för API-testerna.
- Testfiler ligger bredvid källfilen och heter `<fil>.test.ts`. Testnamn beskriver beteende ur användarens synvinkel.

## Vad vi medvetet inte testar

- Implementation: Vue- och Pinia-internals, klassnamn och stil, och att en ref har ett värde. Den ändras ofta och går dåligt att lita på. Vi testar beteende.
- Routerkonfigurationen och layouten i `App.vue`.
- Inloggningsvyn och `session`-storen. Storen har ännu ingen logik utöver att hålla ett värde.
- REST-routerna i `api/src/routes/`. GraphQL är vägen framåt, och REST finns kvar bara för den gamla klienten.

## Alternativ vi jämförde

- Vitest: fungerar bäst med Vue och Vite.
- happy-dom: snabbare än jsdom, men saknar en del API-funktioner som jsdom har. Vi byter om vi stöter på det.

## Konsekvenser

- Buggar fångas före merge, och vyerna går att refaktorera.
- Mockad `fetch` i komponenttesterna kan fortfarande driva isär från det riktiga API:et. Integrationstesterna täcker API-sidan, och codegen (M5) täcker typerna.
- Integrationstesterna kräver databaser: lokalt måste compose vara igång, och i pipelinen startar jobbet `Integration` egna.
- Kartan måste hållas levande, och kolumnen "Finns test i dag?" måste stämma vid varje merge.

## Kommandon

npm test · npm run test:watch --workspace=client · npm run test:api (kräver compose-databaserna)

## Senaste körning av `npm run test:api` (B6)

6 tester, alla gröna · Tid: _TODO: klistra in de sista raderna ur `npm run test:api`_
