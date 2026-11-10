# Beslutsdokument: serverless

_Ett av teamets beslutsdokument. Skrivs i M7, hålls levande._

**Datum:** 2026-11-10
**Beslut:** Bildbearbetningen flyttades ut ur API:et till Azure-funktionen `process-image` (HTTP-trigger, Flex Consumption, Node 22). Den skapas av `infra/azure/skapa-funktion.sh` och deployas av jobbet `deploy-function` i `ci.yml`, inte med Serverless Framework.

## Bakgrund

Skuld 8: före M7 skalade `POST /api/photos` om varje bild till 1600, 800, 400 och 160 px och räknade ut en signatur per variant, i själva anropet.

Node kör vår kod i en tråd. Omskalningen är synkron och CPU-tung och blockerar event loopen, så alla anrop får vänta, även `GET /api/health`. Under tio samtidiga uppladdningar hade health p50 728 ms och max 1447 ms.

## Alternativ vi jämförde

**Serverless Framework** är ett CLI-verktyg där appen beskrivs i `serverless.yml` (`service`, `provider`, `functions`, `events`) och `sls deploy` skapar resurserna i molnet. Version 4 stöder bara AWS och kräver licens för större organisationer. Azure gick via ett plugin i version 3, som inte har haft support sedan slutet av 2024. Det hade passat ett AWS-projekt med många funktioner.

| Alternativ                                     | Vad ändras i repot                                                                      | Kostnad                                                                | För                                                 | Emot                                     |
| ---------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------- | ---------------------------------------- |
| **Azure Functions + Core Tools + `az` (valt)** | `functions/`, `skapa-funktion.sh`, jobbet `deploy-function`, `photos.js` anropar en URL | Gratiskvot, sedan per GB-s                                             | Samma moln, OIDC-identitet och pipeline som staging | Azure-specifik handler och konfiguration |
| Serverless Framework                           | `serverless.yml`, handler per leverantör                                                | Verktyget gratis (licens i v4 för större organisationer) + molnkostnad | En fil beskriver allt                               | v4 stöder bara AWS, v3 har ingen support |
| AWS Lambda + SAM                               | `template.yaml`, ny handler, AWS-konto, ny inloggning i CI                              | Lambdas gratisnivå, sedan per GB-s                                     | Moget och billigt                                   | Nytt moln, nytt konto, ny identitet      |
| Google Cloud Run functions                     | Ny handler, `gcloud`, GCP-konto                                                         | Gratisnivå, sedan per anrop och CPU-s                                  | Enkelt, skalar till noll                            | Ett tredje moln för teamet               |

## Motivering

- Staging kör redan i Azure (Container Apps, M6): samma prenumeration och resursgrupp.
- OIDC-identiteten från M6 återanvänds, så det behövs inga nya secrets i GitHub.
- Pipelinen fick ett jobb till, inget mer.
- Flex Consumption skalar till noll och skalar ut per anrop (`perInstanceConcurrency=1`).
- Mätningen visar att API:et svarar medan bilder bearbetas.

## Mätning före/efter

`npm run mat -- --n 10` (4000x3000). N = 10 är standardvärdet och räckte för en tydlig skillnad. Lokalt kördes båda på samma dator, efter-körningen mot `func start`. Staging kördes med `--api <staging-URL>`.

| Mätning                 | Uppladdning p50 | Uppladdning max | Health p50 | Health max | Total tid |
| ----------------------- | --------------- | --------------- | ---------- | ---------- | --------- |
| Före, lokalt (N = 10)   | 1626 ms         | 1634 ms         | 728 ms     | 1447 ms    | 1638 ms   |
| Efter, lokalt (N = 10)  | 1596 ms         | 1608 ms         | 5 ms       | 24 ms      | 1608 ms   |
| Efter, staging (N = 10) | 394 ms          | 1148 ms         | 14 ms      | 30 ms      | 1156 ms   |

Före, lokalt, hela utskriften:

| Vad                            | p50     | max     |                        |
| ------------------------------ | ------- | ------- | ---------------------- |
| Uppladdning (POST /api/photos) | 1626 ms | 1634 ms | 10/10 ok               |
| Health (GET /api/health)       | 728 ms  | 1447 ms | 15 anrop               |
| processingMs (bildarbetet)     | 120 ms  | 166 ms  |                        |
| apiMs (API:ets totala tid)     | –       | –       | saknas i svaret (före) |

Total tid: 1638 ms · kallstarter i svaren: 0

Efter, lokalt, hela utskriften:

| Vad                            | p50     | max     |          |
| ------------------------------ | ------- | ------- | -------- |
| Uppladdning (POST /api/photos) | 1596 ms | 1608 ms | 10/10 ok |
| Health (GET /api/health)       | 5 ms    | 24 ms   | 15 anrop |
| processingMs (bildarbetet)     | 72 ms   | 88 ms   |          |
| apiMs (API:ets totala tid)     | 1545 ms | 1554 ms |          |

Total tid: 1608 ms · kallstarter i svaren: 1

Efter, staging (2026-11-10), hela utskriften:

| Vad                            | p50    | max     |          |
| ------------------------------ | ------ | ------- | -------- |
| Uppladdning (POST /api/photos) | 394 ms | 1148 ms | 10/10 ok |
| Health (GET /api/health)       | 14 ms  | 30 ms   | 11 anrop |
| processingMs (bildarbetet)     | 81 ms  | 108 ms  |          |
| apiMs (API:ets totala tid)     | 201 ms | 995 ms  |          |

Total tid: 1156 ms · kallstarter i svaren: 4

- **Health:** max 1447 ms → 24 ms lokalt, 30 ms i staging. API:et blockeras inte längre.
- **Uppladdning lokalt:** knappt snabbare. `func start` är en Node-process, så bilderna köar fortfarande. Arbetet flyttade men blev inte mindre.
- **Uppladdning i staging:** p50 394 ms, eftersom Flex startade nya instanser och körde bilderna parallellt. Max (1148 ms) är uppladdningar som väntade på en kallstart.

## Kallstart

Mätt 2026-11-10 med `curl` direkt mot funktionen (4000x3000), ca 80 min efter senaste deployens röktest.

| Anrop                         | Tid (curl) | `processingMs` | `coldStart` | `instance`     |
| ----------------------------- | ---------- | -------------- | ----------- | -------------- |
| Första efter paus (ca 80 min) | 1.02 s     | 76             | true        | `2--32a71365…` |
| Andra                         | 1.00 s     | 85             | true        | `2--33c2636f…` |

Fyra anrop i följd hamnade på fyra nya instanser, alla kalla och runt 1 s. Bildarbetet tar ca 80 ms av det. Det duger för en uppladdning, och health påverkas inte.

Containerappen skalar också till noll och gav 502 i ca 20 s vid väckning. Det hör till hosting-beslutet (se `hosting.md`).

Om kallstarten inte hade dugt:

- **Always-ready:** aldrig kall, ca $21/månad per instans med 2 GB.
- **Mindre paket:** färre `node_modules`, snabbare inläsning.
- **Varmhållning:** timer-anrop några minuter isär. Billigt men ett hack, och Flex träffar inte nödvändigtvis samma instans.

## Var koden bor och vad som låser

| Fil                                                               | Azure-specifik?                    | Flytt till Lambda / Cloud Run                             |
| ----------------------------------------------------------------- | ---------------------------------- | --------------------------------------------------------- |
| `functions/src/image.js`                                          | Nej, ren JS                        | Följer med oförändrad                                     |
| `functions/src/process-image.js` (`app.http`, `@azure/functions`) | Ja                                 | Handlern skrivs om (ca 30 rader)                          |
| `functions/host.json`, `local.settings*.json`, `.funcignore`      | Ja                                 | Tas bort, den nya plattformens konfiguration ersätter dem |
| `infra/azure/skapa-funktion.sh`                                   | Ja                                 | Ersätts (SAM, `gcloud` eller Terraform)                   |
| Jobbet `deploy-function` i `ci.yml`                               | Ja                                 | Nytt inloggnings- och deploysteg                          |
| `api/src/routes/photos.js`                                        | Knappt (headern `x-functions-key`) | Byt URL i env och auth-header                             |

Logiken är portabel, skalet runt den är Azure.

## Konsekvenser

- **Pris:** ungefärliga listpriser i Sweden Central (Azure Retail Prices API, 2026-11-10): $0.000026 per GB-s och $0.40 per miljon körningar. Gratiskvoten är 100 000 GB-s och 250 000 körningar per månad och delas av prenumerationen. Always-ready kostar $0.000004 per GB-s även i vila, ca $0.03/h eller $21/månad med 2 GB. Vi kör ingen always-ready, och `MAX_INSTANCES=10` sätter ett tak för vad en bugg kan kosta.
- **Funktionsnyckeln:** finns i Azure och som secreten `image-function-key` på staging-appen (`IMAGE_FUNCTION_KEY`), aldrig i repot eller GitHub. Rotera med `az functionapp keys set` och kör sedan `skapa-funktion.sh` med `CONTAINER_APP=…`.
- **Två deployjobb:** `deploy` och `deploy-function` är oberoende, eftersom API:et får funktionens URL från env.
- **Åtkomst:** resursgruppen `utpost-daniil-gurski-rg` är registrerad på Daniil. Douglas, Cristian och Garen är Contributors, och GitHubs OIDC-identitet har en roll för deployen.

**Skrivet av:** Daniil, Douglas, Cristian, Garen
