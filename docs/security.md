# Säkerhet – Utpost

**Datum:** 2026-11-16
**Hotbilden i en mening:** Kontona, användarnas turer och bilder och redaktionens guider är värda att skydda. Angriparen är oftast ett skript, inte en person.

## Autentiseringen (M8)

- **Lösenord:** hashas med scrypt och salt ([`api/src/lib/password.js`](../api/src/lib/password.js)). Före #177 låg de i klartext.
- **Token:** en JWT (HS256) med id, e-post och roll som gäller i 1 timme. Klienten håller den i minnet, så en omladdning loggar ut.
- **Skyddade routes:** kontrollen sitter i API:et. Att skapa eller ta bort turer och ladda upp bilder kräver inloggning, och man får bara ändra sina egna. Att ändra guider kräver rollen editor.

## OWASP Top 10 – genomgång

Testerna finns i [`api/src/routes/routes.test.js`](../api/src/routes/routes.test.js) och var röda före fixen ([#176](https://github.com/DaniilGurski/utpost/pull/176)).

| # | Risk | Gäller oss? | Vad vi hittade | Vad vi gjorde (PR) | Kontroll |
|---|---|---|---|---|---|
| A01 | Broken Access Control | Ja | Vem som helst kunde ta bort turer och ändra guider, och `GET /api/tours` skickade med `password_hash`. | Inloggning, ägarkontroll, rollen editor och bara publika fält i svaren. [#177](https://github.com/DaniilGurski/utpost/pull/177), [#183](https://github.com/DaniilGurski/utpost/pull/183) | "en medlem kan inte ta bort någon annans tur (403)", "en medlem får inte ändra guider (403) – bara rollen editor" |
| A02 | Security Misconfiguration | Ja | CORS tillät alla origins, och nginx saknade säkerhetsheaders. | Tog bort CORS och lade till säkerhetsheaders i nginx. [#183](https://github.com/DaniilGurski/utpost/pull/183), [#184](https://github.com/DaniilGurski/utpost/pull/184) | "API:et skickar ingen Access-Control-Allow-Origin", ZAP i pipelinen |
| A03 | Software Supply Chain Failures | Ja | Sårbara paket hittades med npm audit och Trivy. | Uppdaterade paketen och lade till skanning i pipelinen. [#184](https://github.com/DaniilGurski/utpost/pull/184) | Jobbet *Säkerhet* blev rött med en gammal express ([#185](https://github.com/DaniilGurski/utpost/pull/185)). |
| A04 | Cryptographic Failures | Ja | Lösenorden låg i klartext. | scrypt med salt. [#177](https://github.com/DaniilGurski/utpost/pull/177) | "lösenordet i databasen är hashat, inte klartext" |
| A05 | Injection | Ja | Sökningen byggde SQL med en template string. | Parametriserad fråga. [#177](https://github.com/DaniilGurski/utpost/pull/177) | "ett citattecken i sökordet ger 200 och en tom lista, inte 500" |
| A06 | Insecure Design | Delvis | Inloggningen har ingen rate limit. | Inget än, se *Kända brister*. | – |
| A07 | Authentication Failures | Ja | Token gällde i 30 dagar, och registreringen tog emot vilket lösenord som helst. | Token gäller i 1 timme, och lösenordet måste ha minst 8 tecken. [#177](https://github.com/DaniilGurski/utpost/pull/177) | "registrering med för kort lösenord ger 400 med vad som var fel" |
| A08 | Software or Data Integrity Failures | Delvis | `jwt.verify` angav ingen algoritm. | Bara HS256 godtas. [#177](https://github.com/DaniilGurski/utpost/pull/177) | – |
| A09 | Security Logging & Alerting Failures | Nej | Misslyckade inloggningar, 401 och 403 loggas inte. | Inget än, se *Kända brister*. | – |
| A10 | Mishandling of Exceptional Conditions | Ja | Fel i async-routes lämnade anropet hängande. | En felhanterare som alltid svarar. [#177](https://github.com/DaniilGurski/utpost/pull/177) | "trasig JSON ger 400 med ett svar – inte ett anrop som hänger" |

## Validering av indata

Valideringen sker med Zod-scheman ([`api/src/lib/schemas.js`](../api/src/lib/schemas.js)) i API:et innan routen körs. Ogiltig indata ger 400 med `{ error, issues }`, och oväntade fel ger 500 utan detaljer.

## Headers vi sätter (nginx)

[`client/security-headers.conf`](../client/security-headers.conf) sätter CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` och `Permissions-Policy`. `server_tokens` är avslaget. Alla syns med `curl -I` mot staging.

## Skanning i pipelinen

Jobbet *Säkerhet* kör npm audit, Trivy (på repot och på api-imagen) och ZAP baseline mot appen. Fynd på nivån high eller critical, eller en saknad säkerhetsheader, gör jobbet rött och blockerar merge.

## Kända brister (medvetet kvar)

- En omladdning loggar ut. En refresh-token i en httpOnly-cookie är nästa steg.
- Inloggningen har ingen rate limit.
- Säkerhetshändelser loggas inte.
