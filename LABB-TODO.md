# Labb fredag 27/11 – Budgeten som stoppar en merge: prestanda i pipelinen

**När:** fredag 27/11 fm, i par. ca 1,5 h för steg 1–3, sedan jakten (steg 4) till 13:30. Topp tre berättar 15:45.

**Examinerande (Cloud 11).** Klart-linjen checkas av på plats, par för par. Labben är tänkt i ett eget repo ur mallen. Vi gör den **direkt i teamrepot**, så steg 1–3 är samtidigt M10:s _Från labben_ (`TODO.md` steg 1–2), och inget behöver flyttas in i eftermiddag. Ticket: #205.

**Kursmål:** Cloud 11 (budgeten och jobbet Prestanda) · Fullstack 6 (rendering och prestanda, kunskapsloggen del 2).

**I korthet:** mätskriptet in → före-värdet på `main` → budgeten (`assert`) röd lokalt → jobbet Prestanda rött på en PR → jakten: en ändring i taget.

---

## ⚠️ Det som skiljer sig mest: vårt Utpost är redan lätt

Mallen väger runt **5 500 kB** på startsidan (nästan allt bilder) och JavaScriptet runt 210 kB, så labbets gränser (300 kB totalt, 150 kB JS) blir röda direkt. Vårt Utpost vägde **162 kB** på `/guides` i #203. Med labbets gränser kan budgeten bli **grön**, och klart-linjen kräver att steget Budgeten är **rött**.

Så här gör vi (steg 2):

1. Kör `assert` med labbets gränser först och skriv upp vad den säger (det är också ett svar).
2. Blir det inget ✘: sänk `total-byte-weight` och `resource-summary:script:size` till **strax under** våra `found`-värden från före-mätningen. Då säger budgeten nej mot vårt Utpost som det är, och det är den röda körningen vi visar.
3. Säg det vid avcheckningen: "vi gör labben i teamrepot, vår app klarade labbets gränser, så vi satte dem under vår nivå för att se den säga nej".
4. Efter avcheckningen: gränserna **strax över** våra före-värden → grönt → merga (`TODO.md` steg 2). Gränserna på vår nivå efter optimeringarna är `TODO.md` steg 4.

---

## Hos oss skiljer sig (från labbsidan och mallrepot `utpost-perf-labb`)

| Labben | Hos oss |
| ------ | ------- |
| `gh repo create … --template`, `.env` med `JWT_SECRET` | Inget nytt repo. `.env` finns redan; vår compose skickar inte `JWT_SECRET` till API:et (fallback i `config.js`) |
| `scripts/perf.mjs` och `npm run perf` finns redan | Vi hämtar dem från mallrepot (steg 1) |
| `popularGuides(limit: 1)` i `perf.mjs` | Finns inte: `{ guides { slug } }` |
| `/guider/<slug>`, `/turer/1` | `/guide/<slug>`, `/tour/1` |
| Committa `perf-fore.json` direkt på `main` | `main` kräver PR (rulesetet _main guard_): före-värdet går via PR från `205-m10-lab` |
| `.lighthouseci/` redan gitignorerad | Vi lägger till raden |
| Rubrikraderna överst i `ci.yml` (`# Utpost – CI (M1, …)`) | Vår `ci.yml` har inga sådana: hoppa över |
| Jobbet: `JWT_SECRET="$(openssl rand -hex 32)" docker compose up …` | Pipelinen har ingen `.env`: kopiera steget _Skapa .env med testvärden_ från Säkerhet, sedan `docker compose up -d --build --wait` |
| Branch protection kräver Prestanda | Rulesetet _main guard_ (Settings → Rules → Rulesets) |
| `npm run format --workspace=client` | `npm run format:write` |
| Contentful behövs inte | Stämmer, och jobbet kör utan. Mät likadant lokalt (se steg 1) |
| Mallens flaskhalsar (bilder på 5 MB, …) | Finns inte hos oss. Jakten hittar **våra** (= M10:s tre optimeringar) |
| Facit har lazy routes och startbilden som WebP | Kopiera **inte** in: det ändrar appen före mätningen |
| Sju jobb | Åtta med Prestanda |

---

## Ni är klara när (klart-linjen)

- [ ] `perf-fore.json` är committad på `main`, mätt innan vi ändrat något (steg 1)
- [ ] Jobbet Prestanda kör på vår PR och är rött av budgeten: **steget Budgeten är rött, inte mätningen** (steg 3)
- [ ] Vi pekar på en rad `expected … found …` i jobbets logg och säger vilken gräns som bröts och vad den mäter
- [ ] Var och en svarar på en fråga, t.ex.:
  - _Varför är vikten `error` och LCP `warn`?_
  - _Varför mäter jobbet imagen bakom nginx och inte `npm run dev`?_

Avcheckningen tar en minut. Ha PR:en öppen på **Checks**, med steget Budgeten utfällt. Svaren står i [Fördjupning](#fördjupning).

---

## Skriv ner längs vägen

| #   | Vad | När | Var |
| --- | --- | --- | --- |
| 1   | Tabellen från före-mätningen | steg 1 | `docs/performance.md` → _Före_ |
| 2   | Raden vi pekar på, och länken till den röda körningen | steg 3 | PR-beskrivningen (och `docs/performance.md` → _Budgeten_, M10 DoD 3) |
| 3   | Varje ändring i jakten: vad vi gjorde och poängraden efter | steg 4 | commit-meddelandet |
| 4   | En ändring som inte gav något, eller gjorde det sämre | steg 4 | `docs/performance.md` → _Det vi lät vara_ |
| 5   | Vilken gräns vi ska sätta för vårt Utpost, och varför | när vi väntar | anteckning till `TODO.md` steg 4 |

Siffrorna avrundar vi. En ny mätning av samma kod lär oss ingenting nytt.

---

## Före start

- [ ] `node --version` → 22, `docker info` → igång, `gh auth status` → inloggad
- [ ] Google Chrome installerad, **där skriptet körs** (i WSL: Chrome i Linux)
- [ ] Portarna 3001, 5433 och 27017 lediga (`docker ps`, `docker stop <namn>`)
- [ ] En dator per par
- [ ] ```bash
  git checkout main && git pull
  npm install
  git checkout 205-m10-lab && git pull
  ```

---

## Steg 1: Appen i compose och före-värdet (40 min)

En optimering utan en siffra före är en gissning. Före-värdet tas **en gång**, innan något ändras, och committas. Rad 1.

### Filerna

- [ ] ```bash
  git fetch https://github.com/jonatanhallenberg/utpost-perf-labb.git demo-onsdag-facit
  git checkout FETCH_HEAD -- scripts/perf.mjs lighthouserc.json docs/performance.md docs/decisions/rendering.md
  ```

### `scripts/perf.mjs`: vår app

Det enda i skriptet vi rör: frågan och listan `pages`.

- [ ] I `firstGuideSlug`:
  ```js
  body: JSON.stringify({ query: '{ guides { slug } }' }),
  // …
  const slug = body.data?.guides?.[0]?.slug
  ```
- [ ] `pages`:
  ```js
  pages = [
    { name: 'Startsidan', path: '/' },
    { name: 'En guide', path: `/guide/${await firstGuideSlug()}` },
    { name: 'En tur', path: '/tour/1' },
  ]
  ```

### `package.json` och `.gitignore`

- [ ] Rotens `package.json`, i `scripts`: `"perf": "node scripts/perf.mjs",`
- [ ] `.gitignore`: en rad `.lighthouseci`

### Före-värdet

Jobbet i pipelinen kör utan Contentful. Vi mäter likadant lokalt, så att siffrorna går att jämföra (tomma variabler i skalet vinner över `.env`):

- [ ] ```bash
  CONTENTFUL_SPACE_ID= docker compose up -d --build --wait
  npm run perf -- --fore
  ```
  Första gången hämtar npx Lighthouse CI, det tar en stund. Skriptet väntar själv på API:et (seedar, nginx svarar 502 en kort stund).
- [ ] Tabellen under _Före_ i `docs/performance.md` (rad 1), och LCP-elementet på startsidan (DevTools → Performance, mobilläge → _Local metrics_; #203 sa `<h1>`)
- [ ] ```bash
  git add scripts/perf.mjs lighthouserc.json docs package.json .gitignore perf-fore.json
  git commit -m "feat: #205 perf script and before-value"
  git push
  gh pr create --fill
  ```
  Merga när checkarna är gröna. Ingen ändrar appen förrän den är mergad.

- [ ] **Klart:** `npm run perf -- --fore` har skrivit en tabell med Startsidan, En guide och En tur och raden _Sparat som före-värde i perf-fore.json._, och `perf-fore.json` ligger på `main` på GitHub

---

## Steg 2: Budgeten, röd lokalt (15 min)

En mätning säger hur det står till. En budget säger vad som är för mycket, och den kan bli röd.

- [ ] Ny branch från `main` (före-värdet mergat):
  ```bash
  git checkout main && git pull
  git checkout -b 205-m10-budget
  ```
- [ ] `lighthouserc.json` efteråt. `collect` som förut, `assert` nytt (glöm inte kommatecknet efter `collect`):
  ```json
  {
    "ci": {
      "collect": {
        "numberOfRuns": 1,
        "settings": {
          "onlyCategories": ["performance"],
          "chromeFlags": "--headless=new --no-sandbox"
        }
      },
      "assert": {
        "assertions": {
          "total-byte-weight": ["error", { "maxNumericValue": 300000 }],
          "resource-summary:script:size": ["error", { "maxNumericValue": 150000 }],
          "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
          "largest-contentful-paint": ["warn", { "maxNumericValue": 2500 }]
        }
      }
    }
  }
  ```
  Vikterna i byte (300 000 = 300 kB över nätet per sida, 150 000 = 150 kB JS), CLS som tal, LCP i ms. `error` gör assert röd, `warn` skriver en varning. Gränserna gäller **varje** mätt sida.
- [ ] `assert` läser den senaste mätningen i `.lighthouseci/`, den mäter inget själv:
  ```bash
  npx --yes @lhci/cli@0.16.1 assert
  echo $?
  ```
- [ ] **Inget ✘?** Se [Vårt Utpost är redan lätt](#️-det-som-skiljer-sig-mest-vårt-utpost-är-redan-lätt): sänk vikterna till strax under våra `found`-värden och kör `assert` igen

- [ ] **Klart:** utskriften slutar med `Assertion failed. Exiting with status code 1.`, `echo $?` säger `1`, och vi kan säga vilken gräns varje ✘ gäller

---

## Steg 3: Jobbet Prestanda, rött på en PR (25 min)

En budget som bara körs när någon kommer ihåg det stoppar ingenting. Rad 2.

- [ ] I `.github/workflows/ci.yml`: jobbet efter `security` (efter dess sista steg, _Loggar från appen_) och före `build:`, två mellanslag in:
  ```yaml
    # M10: prestandabudgeten – ett test som alla andra, fast det mäter vikt och tid i stället för rätt och fel.
    # Jobbet startar hela appen som i compose (samma image som deployas, bakom nginx), kör Lighthouse mot
    # startsidan, en guide och en tur (npm run perf, tre körningar per sida) och jämför med gränserna i
    # lighthouserc.json. En gräns med "error" som bryts gör jobbet rött, en med "warn" skriver bara en varning.
    # Storlekarna (byte över nätet) är samma i varje körning och får stoppa en merge. Tiden (LCP) beror på
    # maskinen jobbet råkar få – den varnar bara. Rapporterna laddas upp som artefakt.
    # Rött här blockerar merge (rulesetet main guard kräver "Prestanda").
    performance:
      name: Prestanda
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with:
            node-version: 22

        # Pipelinen har ingen .env. Compose behöver variablerna, så vi skapar en med testvärden (som Säkerhet).
        - name: Skapa .env med testvärden (bara för jobbet)
          run: |
            cat > .env <<'EOF'
            POSTGRES_USER=utpost
            POSTGRES_PASSWORD=utpost
            POSTGRES_DB=utpost
            MONGO_USER=utpost
            MONGO_PASSWORD=utpost
            EOF

        - name: Bygg imagerna och starta appen (compose)
          run: docker compose up -d --build --wait

        # Skriptet väntar själv tills API:et har seedat och svarar. Det behöver inga node_modules:
        # Lighthouse CI hämtas med npx, och Chrome finns redan på runnern.
        - name: Mät – Lighthouse mot startsidan, en guide och en tur
          run: npm run perf -- --runs 3

        - name: Budgeten – gränserna i lighthouserc.json
          run: npx --yes @lhci/cli@0.16.1 assert

        - name: Spara rapporterna
          if: always()
          uses: actions/upload-artifact@v4
          with:
            name: lighthouse-rapporter
            path: .lighthouseci
            include-hidden-files: true   # mappen börjar med punkt – utan den här raden laddas ingenting upp
            retention-days: 7

        - name: Loggar från appen (bara om något gick fel)
          if: failure()
          run: docker compose logs --tail 50 api client
  ```
- [ ] `git status`: bara `lighthouserc.json` och `ci.yml` ändrade (står `package-lock.json` där: `git checkout -- package-lock.json`)
- [ ] ```bash
  git add lighthouserc.json .github/workflows/ci.yml
  git commit -m "feat: #205 performance budget and Prestanda job"
  git push -u origin 205-m10-budget
  gh pr create --fill
  gh pr checks --watch
  ```
- [ ] Den röda körningens adress i PR-beskrivningen (rad 2): PR:en → Checks → Prestanda → adressfältet. Rapporterna: körningens sammanfattning → Artifacts → `lighthouse-rapporter`
- [ ] **Klart:** Prestanda rött, de två mätstegen gröna och steget _Budgeten – gränserna i lighthouserc.json_ rött, med ✘, gränsen, `expected` och `found` i loggen

**Klart-linjen, själva först:** gå igenom [Ni är klara när](#ni-är-klara-när-klart-linjen) och skriv upp oss på tavlan.

### Efter avcheckningen (`TODO.md` steg 2)

- [ ] Gränserna strax över våra före-värden → Prestanda grönt → merga
- [ ] Prestanda i rulesetet: Settings → Rules → Rulesets → _main guard_ → _Require status checks to pass_ → lägg till **Prestanda** (jobbet måste ha kört en gång)
- [ ] Länken till den röda körningen under _Budgeten_ i `docs/performance.md` (M10 DoD 3)

---

## Steg 4: Prestandajakten (till 13:30)

Budgeten säger att appen är för tung, inte varför. Det hittar man genom att mäta. Hos oss är jakten samma sak som M10:s **tre optimeringar** (`TODO.md` steg 3).

**Poängen:** raden sist i `npm run perf`: _Förbättring mot perf-fore.json: N poäng_ (procentförbättring på JS och totalvikt, tre sidor, max 100 per tal, sämre = 0), plus 100 när Prestanda är grönt på PR:en. LCP och CLS ger inga poäng, men CLS kan hålla jobbet rött.

**Hos oss:** labben jagar på samma branch som budgeten. M10 vill ha **en PR per optimering**, så vi tar varje ändring på en egen branch från `main` när budget-PR:en är mergad. Då blir varje PR en rad i _Optimeringarna_.

**Arbetssättet, en ändring i taget:**

- [ ] Ändra **en** sak
- [ ] `docker compose up -d --build --wait client` (även efter ändrad `package.json`/lockfil)
- [ ] `npm run perf`
- [ ] `npm test`, `npm run lint`, `npm run typecheck`
- [ ] Commit med poängraden i meddelandet (rad 3), push
- [ ] Gav den inget: `git checkout -- .` och skriv rad 4

**Var vi tittar** (ingen säger vad som är fel):

- DevTools → Network, mobilläge, _Disable cache_, sorterat på Size: vad väger mest, och vilken typ?
- En rad i Network → Headers: vad säger servern om filen (komprimering, cache)?
- `npm run build` i `client/`: två storlekar per fil. Vilken ser vi i Network?
- `npx vite-bundle-visualizer` i `client/`: vad ligger i varje JS-fil, och hur mycket använder appen? (Alla vyer importeras direkt i `client/src/router/index.ts`)
- En bild i Elements: hur stor är filen, och hur stor visas den?
- GraphQL-svaret i Network → Response: vilka fält hämtas, vilka visas?
- DevTools → Performance: vilket element är LCP, och vad flyttar sig medan sidan laddar?
- `.lighthouseci/lhr-*.html`: vad föreslår Lighthouse själv?

**Reglerna:**

| Regel | Varför |
| ----- | ------ |
| Mät samma sätt varje gång: klienten ombyggd i compose, `npm run perf` mot `localhost:3001`, en körning. `perf-fore.json`, `scripts/perf.mjs` och gränserna är de från steg 1–2 | Annars jämför vi med något annat |
| `npm test`, `npm run lint`, `npm run typecheck` gröna, och Kvalitet grönt på PR:en | En snabb app som är trasig är inte snabb |
| Sidorna ser likadana ut: alla bilder, höjdprofilen på turen, alla guider, alla texter | Ingen vinner genom att ta bort |
| Poängen räknas när läraren sett raden, i terminalen eller jobbets logg, med committen | Topplistan är det läraren sett |

Fusk är allt som får siffran att röra sig utan att besökaren får en snabbare sida.

---

## Fördjupning

**Vad mätningen är.** Lighthouse låtsas vara en mobil på långsamt 4G: sidan laddas i full fart och tiderna räknas fram med en modell. Tider är en modell, inte en stoppklocka: LCP kan bli flera gånger längre i en körning än i nästa, CLS 0 ena gången och över 0,1 nästa. Vikterna beror bara på vad servern skickar. Därför står tider som storleksordning, vikter med siffra, och bara vikterna ger poäng.

**Varför imagen, inte `npm run dev`.** Vite i utvecklingsläge skickar varje källfil för sig, obyggd och ominifierad. Det är inte det besökaren får, och säger ingenting om hur nginx skickar filerna. Mät det som deployas.

**`error` och `warn`.** `error` när ett brott ska stoppa en merge, `warn` när det bara ska synas. Vikterna är samma i varje körning: över gränsen = någon har lagt till något tungt. LCP beror på vilken maskin jobbet får; som `error` blir jobbet rött ibland utan ändring, och då slutar folk lita på det. CLS är `error` fast den varierar: ett hopp syns för alla, och när orsaken är borta hamnar den inte nära gränsen.

**`assert` mäter ingenting.** Den läser rapporterna i `.lighthouseci/` och jämför varje sida med varje gräns. `expected: <=300000` är gränsen, `found:` det som mättes, i samma enhet.

**Varför i pipelinen, och i compose.** Jobbet startar appen exakt som Säkerhet: hela compose, imagerna byggda ur PR:ens kod. Tre körningar per sida, medianen. Inget `npm ci`: skriptet använder bara Node, Lighthouse CI hämtas med npx. Rapporterna sparas även när jobbet är rött (`if: always()`), för det är då man behöver dem. Med Prestanda i _main guard_ kan ingen merga en PR som gör appen tyngre än budgeten.

---

## Felsökning

- **Når inte `localhost:3001`:** `docker compose ps`, sedan `docker compose logs --tail 50 api`
- **502 direkt efter `docker compose up`:** API:et seedar. Skriptet väntar själv, högst en minut
- **Första `npm run perf` står still:** npx hämtar `@lhci/cli`, bara första gången
- **"Svarar appen men inte frågan":** frågan i `firstGuideSlug` är inte bytt till `guides`
- **"Ingen mätning för /…":** adressen i `pages` finns inte hos oss (`/guider/`, `/turer/`?)
- **Lighthouse hittar ingen Chrome:** installera Google Chrome där skriptet körs
- **`assert` hittar inga resultat:** kör `npm run perf` först, från repots rot
- **`assert` grön i steg 2:** troligen vår lätta app, se varningsrutan överst. Eller blocket ligger inte under `ci`
- **`assert` klagar på `lighthouserc.json`:** kommatecknet efter `collect`, eller en kommentar
- **Kvalitet rött på formatkontrollen:** `npm run format:write`, commit, push
- **Jobbet rött i Mät eller Bygg, inte i Budgeten:** det är inte budgeten som sa nej. Klart-linjen kräver Budgeten
- **YAML-fel, inga jobb startar:** `performance:` två mellanslag in, som `security:` och `build:`
- **Siffran rör sig inte:** klienten inte ombyggd (`--build … client`)
- **LCP/CLS hoppar utan ändring:** det är meningen
- **Höjdprofilen syns inte på turen:** vi har ändrat något den behöver. Konsolen säger vad
- **Prestanda går inte att välja i _main guard_:** jobbet har inte kört än
- **`--fore` körd igen:** `git restore perf-fore.json`
- **`.lighthouseci/` committad:** raden saknas i `.gitignore`
- **Kan inte pusha till `main`:** rulesetet kräver PR, gå via PR
