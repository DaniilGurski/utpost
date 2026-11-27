# Prestanda

_Skrivs i M10. Siffrorna kommer ur `npm run perf`: Lighthouse mot den körande appen, som en mobil på långsamt 4G. En mätning per rad, avrundad. Ni ska kunna säga vad ni ändrade, vilken siffra det flyttade och hur mycket – inte mäta samma sak fem gånger._

## Före

_Klistra in tabellen från `npm run perf -- --fore`, körd innan ni ändrade något. Filen `perf-fore.json` committas._

| Sida       | LCP | CLS | JavaScript | Bilder | Totalt |
| ---------- | --- | --- | ---------- | ------ | ------ |
| Startsidan |     |     |            |        |        |
| En guide   |     |     |            |        |        |
| En tur     |     |     |            |        |        |

| Sida       | LCP   | CLS | JavaScript | Bilder | Totalt |
| ---------- | ----- | --- | ---------- | ------ | ------ |
| Startsidan | 0,8 s | 0   | 144 kB     | 0 kB   | 158 kB |
| En guide   | 2 s   | 0   | 144 kB     | 0 kB   | 152 kB |
| En tur     | 2 s   | 0   | 144 kB     | 0 kB   | 155 kB |

**Vad som är LCP-elementet på startsidan:** _(DevTools → Performance → Local metrics)_

## Optimeringarna

_Minst tre. En rad per ändring, mätt direkt efter den. "Siffran" är den ni ville flytta, inte alla._

| #   | Vad vi ändrade | Siffran vi ville flytta | Före | Efter | PR  |
| --- | -------------- | ----------------------- | ---- | ----- | --- |
| 1   |                |                         |      |       |     |
| 2   |                |                         |      |       |     |
| 3   |                |                         |      |       |     |

## Efter

_Tabellen från den sista `npm run perf`, med procenten mot före-värdet._

## Budgeten

_Vad som står i `lighthouserc.json` under `assert`, i ord: vilka gränser, och varför just de. Vilka är `error` (stoppar en merge) och vilka är `warn`? Länk till en pipelinekörning där budgeten sa nej._

## Det vi lät vara

_En eller två saker ni såg men inte lagade, och varför. En flaskhals man känner till och har valt att leva med är också ett beslut._
