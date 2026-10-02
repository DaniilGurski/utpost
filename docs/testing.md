# Teststrategi – Utpost

_Beslutsdokument. Skrivs av teamet i M2 och hålls levande. Det är det första av teamets sex beslutsdokument – samma mall som de andra i `docs/decisions/`._

**Datum:** 2026-10-
**Beslut:** …

## Bakgrund

Vad behövde vi lösa? (Ärvd kod utan tester, pipelinen kör ett röktest, sex vyer kvar att porta …)
Utpost hade bara en sanity test

## Nivåer

Enhet (Vitest): …
Komponent (Vitest + Vue Testing Library): …
API (kommer i M5): …
E2E: …

## Karta: vad testas var

| Del av Utpost | Beteende                                                    | Nivå      | Varför just där?                                           | Finns test i dag? |
| ------------- | ----------------------------------------------------------- | --------- | ---------------------------------------------------------- | ----------------- |
| `elevationGain` | summerar bara stigningar, inte nedförsbackar              | enhet     | ren funktion, ingen Vue eller API behövs                   | ja                |
| `elevationGain` | tom tur ger 0                                             | enhet     | ren funktion, kantfall                                     | ja                |
| `elevationGain` | hoppar över mätpunkter utan höjd i stället för att räkna 0 | enhet     | ren funktion, kantfall som annars ger fel höjdmeter        | ja                |
| `GuidesView`  | sökfältet filtrerar guider på titel                         | komponent | sökningen är logik som användaren ser först                | ja                |
| `GuidesView`  | visar "N träffar" eller "Inga träffar" efter sökning        | komponent | räknaren är det användaren läser av efter en sökning       | nej               |
| `GuidesView`  | visar felmeddelande när API:et failar                       | komponent | felvägen får inte krascha vyn eller lämna den tom          | nej               |
| `ToursView`   | tabellen visar tur, av, guide, längd och bilder när data kommer | komponent | huvudflödet: användaren ska se sina turer                | nej               |
| `ToursView`   | visar "Inga turer" när listan är tom                        | komponent | tomt läge ska skilja sig från laddning och fel             | nej               |
| `ToursView`   | visar felmeddelande när API:et failar                       | komponent | felvägen får inte krascha vyn eller lämna den tom          | nej               |
| `TourDetailView` | visar längd, antal mätpunkter och höjdmeter för en tur   | komponent | här fanns höjdmeterbuggen, siffran måste stämma med datan  | nej               |
| `TourDetailView` | visar felmeddelande när API:et failar                    | komponent | felvägen får inte krascha vyn eller lämna den tom          | nej               |

## Regler

- En PR mergas bara när …
- En buggfix …
- Vi mockar API:et genom …
- Täckning: …
- Testfiler ligger … och heter …

## Vad vi medvetet inte testar

…

## Alternativ vi jämförde

…

## Konsekvenser

…

## Kommandon

npm test · npm run test:watch --workspace=client
