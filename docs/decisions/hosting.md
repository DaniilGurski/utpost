# Beslutsdokument: hostingval

_Ett av teamets sex beslutsdokument. Skrivs i M6, hålls levande._

**Datum:** 2026-11-02
**Beslut:** Utpost körs i staging som en Azure Container App med Postgres och Mongo som sidecars, deployad från GHCR-images av GitHub Actions. I produktion behåller vi images och pipeline men byter till managed databaser, minst en replica och egen domän.

## Bakgrund

När M5 är klar har vi två images i GHCR, taggade med sha, en CI-pipeline som bygger dem och en compose-fil för lokal körning. Det som saknas för att någon utanför teamet ska kunna öppna appen är en publik URL.

## Vad vi faktiskt hyr

| Del          | Tjänst                                 | Nivå                                           | Vem sköter uppdateringar/skalning | Vad det kostar oss i staging              |
| ------------ | -------------------------------------- | ---------------------------------------------- | --------------------------------- | ----------------------------------------- |
| Klient + API | Azure Container Apps                   | PaaS                                           | Azure sköter, vi äger images      | 0 kr inom gratiskvoten (skalar till noll) |
| Postgres     | Sidecar (`postgres` i containerappen)  | – (körs i vår container, ingen managed tjänst) | Vi                                | 0 kr                                      |
| MongoDB      | Sidecar (`mongo:8.2` i containerappen) | – (körs i vår container, ingen managed tjänst) | Vi                                | 0 kr                                      |
| Images       | GHCR                                   | SaaS                                           | GitHub                            | 0 kr                                      |
| Deploy       | GitHub Actions → Azure                 | SaaS                                           | GitHub                            | 0 kr                                      |

## Alternativ vi jämförde

| Alternativ                        | Vad ändras i repot           | Kostnad (staging)                    | För                         | Emot                            |
| --------------------------------- | ---------------------------- | ------------------------------------ | --------------------------- | ------------------------------- |
| Azure Container Apps (det vi kör) | Infra-koden, env, `ci.yml`   | Gratiskvot (delas i prenumerationen) | Stor leverantör             | Dyrt, kan vara svårt att flytta |
| AWS ECS på Fargate                | Värdena i env, `ci.yml` osv. | Betalt från första timmen            | Stor leverantör också       | Ingen skalning till noll        |
| Render/Railway                    | Konfigurationen              | Gratisnivå med vilande tjänst        | Snabbare och enklare deploy | Mindre kontroll                 |

## Staging och produktion är inte samma sak

I produktion måste databaserna vara managed för att data ska överleva omstarter: Neon (Postgres) och MongoDB Atlas. Vi väljer medvetet inte Azures egna databastjänster, för att inte bli inlåsta i Azure. Appen måste också köra minst en replica så att den aldrig skalar till noll – då försvinner kallstarten. Azures adress byts mot en egen domän med certifikat.

Images och pipeline ändras inte, bara konfigurationen och infrastrukturen.

## Inlåsning

Om Azure försvann i morgon ändras infrastrukturen och deploy-jobbet, men inte images eller koden.

Ändras:

- `infra/azure/` (`staging.yaml`, `create-staging.sh`, `identity.sh`)
- `deploy`-jobbet i `.github/workflows/ci.yml` (`azure/login`, `az containerapp`)
- variablerna i GitHub-miljön `azure-staging` (ligger inte i repot, men måste bytas)

Ändras inte:

- `client/` och `api/`, inklusive båda Dockerfiles
- `build`- och `test`-jobben i `ci.yml`
- `docker-compose.yml`

## Konsekvenser

- **Kallstart:** när appen har skalat till noll tar första anropet ca 30 s (uppmätt, se nedan) eftersom containrarna startar och databaserna seedas. Under väckningen svarar nginx 502 tills api:et är uppe.
- **Gratiskvot:** kvoten delas av alla i prenumerationen, vilket begränsar oss, men staging kostar ingenting.
- **Hemligheter:** de lever på två ställen, lokalt i `.env` och som secrets i molnet. Läcker en hemlighet roterar vi den och gör en rollback.
- **Åtkomst:** contributors har tillgång till portalen.

Kallstart, uppmätt i B5 (från noll replicas, sha-d1a6778):

```
real 0m28.910s
user 0m0.180s
sys  0m0.042s
```

**Skrivet av:** Daniil, Douglas
