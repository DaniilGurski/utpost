# Teststrategi – Utpost

_Beslutsdokument. Skrivs av teamet i M2 och hålls levande. Det är det första av teamets sex beslutsdokument – samma mall som de andra i `docs/decisions/`._

**Datum:** 2026-10-06
**Beslut:** Vi testar beteende som användaren ser, på lägsta möjliga nivå: ren logik som enhetstester, vyer som komponenttester med mockad `fetch`. Ingen PR mergas med rött.

## Bakgrund

Utpost var ärvd kod utan tester, och pipelinen körde bara ett röktest (en sanity test). Tre vyer och en logikfunktion behövde täckas, och höjdmeterbuggen fanns kvar. Vi behövde en gemensam bild av vad som testas var, så att testerna fångar riktiga buggar och inte bara kör kod.

## Nivåer

Enhet (Vitest): ren funktion utan Vue eller nätverk, t.ex. `elevationGain`.
Komponent (Vitest + Vue Testing Library): en hel vy med mockad `fetch`. Testet kollar det användaren ser.
API (kommer i M5): routes mot en testdatabas.
E2E: inte i M2. Vi tar det först när flödet inloggning till tur finns, och verktyget är inte valt.

## Karta: vad testas var

| Del av Utpost    | Beteende                                                        | Nivå      | Varför just där?                                          | Finns test i dag? |
| ---------------- | --------------------------------------------------------------- | --------- | --------------------------------------------------------- | ----------------- |
| `elevationGain`  | summerar bara stigningar, inte nedförsbackar                    | enhet     | ren funktion, ingen Vue eller API behövs                  | ja                |
| `elevationGain`  | tom tur ger 0                                                   | enhet     | ren funktion, kantfall                                    | ja                |
| `elevationGain`  | hoppar över mätpunkter utan höjd i stället för att räkna 0      | enhet     | ren funktion, kantfall som annars ger fel höjdmeter       | ja                |
| `GuidesView`     | sökfältet filtrerar guider på titel                             | komponent | sökningen är logik som användaren ser först               | ja                |
| `GuidesView`     | visar "N träffar" eller "Inga träffar" efter sökning            | komponent | räknaren är det användaren läser av efter en sökning      | ja                |
| `GuidesView`     | visar felmeddelande när API:et failar                           | komponent | felvägen får inte krascha vyn eller lämna den tom         | ja                |
| `ToursView`      | tabellen visar tur, av, guide, längd och bilder när data kommer | komponent | huvudflödet: användaren ska se sina turer                 | ja                |
| `ToursView`      | visar "Inga turer" när listan är tom                            | komponent | tomt läge ska skilja sig från laddning och fel            | ja                |
| `ToursView`      | visar felmeddelande när API:et failar                           | komponent | felvägen får inte krascha vyn eller lämna den tom         | ja                |
| `TourDetailView` | visar längd, antal mätpunkter och höjdmeter för en tur          | komponent | här fanns höjdmeterbuggen, siffran måste stämma med datan | ja                |
| `TourDetailView` | visar felmeddelande när API:et failar                           | komponent | felvägen får inte krascha vyn eller lämna den tom         | ja                |

## Regler

- En PR mergas när testerna är gröna både lokalt och i pipelinen. Resten av flödet står i README.
- Varje buggfix ur `docs/debt.md` får ett regressionstest med `TD-xx` i namnet. Vi försöker committa testet (rött) före fixen (grönt), men en annan ordning blockerar inte merge. Buggar utanför `debt.md` omfattas inte av regeln.
- Vi mockar API:et genom att stubba global `fetch` med `vi.stubGlobal("fetch", fetchMock)` och svara med `new Response(JSON.stringify(body), { status })`. `mockReset` körs i `beforeEach`.
- Täckning: inget procentkrav. En siffra uppmuntrar tester som bara kör kod. Kravet är att varje rad i kartan har ett test som blir rött om buggen kommer tillbaka. Vi omprövar det i M5, när API-testerna kommer.
- Testfiler ligger bredvid källfilen och heter `<fil>.test.ts`. Testnamn beskriver beteende ur användarens synvinkel.

## Vad vi medvetet inte testar

- Implementation: Vue- och Pinia-internals, klassnamn och stil, och att en ref har ett värde. Den ändras ofta och går dåligt att lita på. Vi testar beteende.
- Routerkonfigurationen och layouten i `App.vue`.
- Inloggningsvyn och `session`-storen. Storen har ännu ingen logik utöver att hålla ett värde.
- `api/`, tills M5.

## Alternativ vi jämförde

- Vitest: fungerar bäst med Vue och Vite.
- happy-dom: snabbare än jsdom, men saknar en del API-funktioner som jsdom har. Vi byter om vi stöter på det.

## Konsekvenser

- Buggar fångas före merge, och vyerna går att refaktorera.
- Mockad `fetch` kan driva isär från det riktiga API:et tills M5.
- Kartan måste hållas levande, och kolumnen "Finns test i dag?" måste stämma vid varje merge.

## Kommandon

npm test · npm run test:watch --workspace=client
