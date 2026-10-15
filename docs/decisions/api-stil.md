# Beslutsdokument: API-stil (REST och GraphQL)

_Ett av teamets sex beslutsdokument. Skrivs i M4, hålls levande. Samma mall som `docs/testing.md` och `docs/database.md`._

## Anteckningar till dokumentet

Underlag som ska in i rätt rubrik när dokumentet skrivs.

- **N+1 är mätt, inte löst (M4).** `Tour.user`, `Tour.guide` och `Tour.photos` är fältresolvers som gör ett uppslag per tur. API-loggen skriver varje SQL-fråga (`[sql] …`) och en summering per operation (`[graphql] <operation>: <n> databasfrågor, <ms> ms`). Siffrorna hör hemma i bakgrundstabellen och under Konsekvenser. Lösningen (DataLoader eller liknande) tas i M5.
- **Listan hämtar aldrig `tour_logs`.** `tours` returnerar `TourSummary`, som saknar `logs`. Bara `tour(id)` läser loggpunkterna.
- **Ett ställe för turer.** Resolvrarna och REST-routerna läser turer via samma modul, `api/src/data/tours.js` (ingen SQL i resolvrarna). M5:s `TOURS_SOURCE`-växel byts därför på ett ställe och gäller både REST och GraphQL.
- **Efter M5:** `Tour.user` och `Tour.guide` kan besvaras från namnögonblicksbilderna i Mongo-dokumentet (se `docs/database.md`) utan ett uppslag i Postgres, så länge frågan bara ber om namnet. Inte byggt i M4.
