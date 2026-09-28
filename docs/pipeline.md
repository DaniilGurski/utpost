# CI-pipeline

## Flöde: från commit till merge

```mermaid
flowchart TD
    A[Commit + push till feature-branch] --> B[Öppna/uppdatera PR mot main]
    B --> C{Workflow triggas: on pull_request}
    C --> Q

    subgraph Q [Jobb: quality / Kvalitet]
        Q1[checkout] --> Q2[setup-node 22 + npm-cache]
        Q2 --> Q3[npm ci]
        Q3 --> Q4[npm run lint]
        Q4 --> Q5[npm run format:check]
        Q5 --> Q6[npm run test]
    end

    Q -->|grön| BLD
    Q -->|röd| X[PR blockeras, build körs aldrig]
    X -->|fixa och pusha igen| A.

    subgraph BLD [Jobb: build / Bygg, needs: quality]
        B1[checkout] --> B2[setup-node + cache]
        B2 --> B3[npm ci]
        B3 --> B4[npm run build]
        B4 --> B5[upload-artifact: client/dist]
    end

    BLD -->|grön| R{Ruleset uppfyllt?}
    R -->|ja| M[Merge till main]
    R -->|nej| X
    M --> P[Workflow körs igen: on push till main]
```

## Vad varje steg fångar

| Steg | Fångar |
|---|---|
| `npm ci` | Lockfil och `package.json` som inte stämmer överens; garanterar exakta versioner |
| `lint` | Kodproblem och misstänkta mönster (ESLint) |
| `format:check` | Filer som inte följer Prettier. Kontrollerar bara, ändrar aldrig |
| `test` | Regressioner i beteende (Vitest) |
| `build` | Trasiga importer och byggfel som lint och test kan missa |
| Ruleset | Att inget mergas utan PR, review och gröna checks |

## Uppmätta tider (en körning)

## Uppmätta tider (en körning)

Körning: [2026-09-28] · Sekventiell (`needs: quality`): ja

| Steg | Kvalitet | Bygg |
|---|---|---|
| Set up job | 0s | 1s |
| checkout | 1s | 1s |
| setup-node | 1s | 1s |
| `npm ci` | 5s | 5s |
| lint | 2s | – |
| format:check | 0s | – |
| test | 2s | – |
| build | – | 1s |
| upload-artifact | – | 1s |
| Post-steg + Complete job (differens) | 2s | 2s |
| **Jobbtid enligt GitHub** | **13s** | **12s** |

**Total pipeline-tid (vägg-tid):** 30s (jobben summerar till 25s, resten är
uppstart av runners och väntan mellan jobben)


## Ruleset på `main`

Bekräfta uppgifterna med den som ställt in rulesetet:

- Pull request krävs innan merge
- Minst en godkännare
- Required status checks: `Kvalitet` och `Bygg`
- "Require branch to be up to date before merging": ja
- Direktpush till `main` blockerad: ja