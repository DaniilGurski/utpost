# Labb fredag 20/11 – Redaktören publicerar själv (headless CMS + webhook)

**När:** fredag 20/11 fm, i par, ca 2,5 h (steg 1–3). Klart-linjen checkas av på plats efter lunch.

**Inte examinerande**, men det är M9:s _Från labben_. Vi gör den **direkt i teamrepot**, så den överlappar `TODO.md` steg 1–3. Den här filen är bara labben, i labbens ordning.

**Kursmål:** Fullstack 18 (headless CMS, examineras i M9) · Fullstack 9 (kunskapsloggen) · Cloud 12 (hitta svaren i leverantörens docs – VG).

**Läget i repot:** CMS-lagret (#190) och klientens rich text + förhandsgranskning (#191) är redan mergade. Kvar för labben: **vårt eget space i `.env`**, **notisen på en guide** och **webhooken** (finns inte än).

**I korthet:** eget Contentful-space → notiserna syns lokalt → koppla en notis till en guide utan kod → skriv webhooken (test först) som tömmer cachen.

---

## Ni är klara när

- [ ] Guidelistan (`/guides`, vår startsida) visar notiserna ur **vårt eget space**; inloggad redaktör ser utkastet _Ny led till våren_ med _Förhandsgranska_; en medlem ser ingen kryssruta
- [ ] En notis syns på en guides sida, kopplad med `guideSlug` i Contentful, **utan kodändring** (rad 3)
- [ ] Webhooken: två tester röda före routen, gröna efter. PR:en visar Integration rött (rad 4). `curl` med hemlighet → `204` + loggrad, utan → `401`
- [ ] Vi kan svara på:
  - _Varför har API:et en cache, och vad gör webhooken med den?_
  - _Varför ser en medlem aldrig utkasten, fast kryssrutan bara är klientkod?_

Vid avcheckningen: den som **inte** skrev routen visar PR:en och kör curl. Frågorna tar vi en var. Svaren står under [Fördjupning](#fördjupning-läs-medan-ni-väntar).

---

## Skriv ner längs vägen

Direkt i repot. Inget i README. En avrundad siffra räcker.

| # | Vad | När | Var |
| - | --- | --- | --- |
| 1 | Vilken nyckel läser vad, och var den ligger (delivery, preview, management) | steg 1 | `docs/decisions/cms.md` → _Konsekvenser_ |
| 2 | Vad appen gör när Contentful inte svarar: loggraden + vad guidelistan visar | steg 1 | `docs/decisions/cms.md` → _Konsekvenser_ |
| 3 | Ungefär hur lång tid från publicera till synlig notis, utan webhook | steg 2 | `docs/decisions/cms.md` → _Konsekvenser_ |
| 4 | Testernas namn + länk till PR-körningen där Integration var rött | steg 3 | PR-beskrivningen (Canvas-inlämningen vill ha den PR:en) |
| 5 | En gräns i gratisnivån som skulle få oss att byta, med länk till källan | medan ni väntar | `docs/decisions/cms.md` → _Vad som hade fått oss att byta_ |

---

## Före start

- [ ] `node --version` → 22
- [ ] `docker info` → Docker Desktop igång
- [ ] `gh auth status` → inloggad
- [ ] Senaste `main`:
  ```bash
  git checkout main && git pull
  npm install
  ```
- [ ] Contentful-konto på **Free** (inget kort). Paret delar **ett** space – gärna det som blir teamets space i M9. **Inga personuppgifter** i innehållet (lagras i USA)
- [ ] Portar 5433, 27017, 3001, 4000 lediga (`docker ps`, `docker stop <namn>`, stoppa gamla `npm run dev`)

---

## Steg 1: Eget space, nycklarna, notiserna lokalt (60 min)

Kedjan Contentful → vårt API → klienten finns redan i koden. Nu ska den fungera med **vårt** innehåll. Rad 1, 2.

### Databaserna och testerna

- [ ] ```bash
  docker compose up -d --wait postgres mongo
  npm run seed
  npm run migrate:logs
  npm run test:api       # alla gröna – CMS:et är avstängt utan nycklar, det är meningen
  ```

### `.env`

Vår `.env` har **inga** `CONTENTFUL_*`-rader än (de kom med #190 i `.env.example`).

- [ ] Kopiera CMS-blocket från `.env.example` till slutet av `.env`:
  ```bash
  sed -n '/^# CMS (M9)/,/^CMS_CACHE_SECONDS/p' .env.example >> .env
  ```

| Variabel | Var i Contentful | Hemlig? | Används av |
| -------- | ---------------- | ------- | ---------- |
| `CONTENTFUL_SPACE_ID` | _Settings > General settings > Space ID_ | nej | appen + `cms:setup` |
| `CONTENTFUL_DELIVERY_TOKEN` | _Settings > API keys_ → _Content Delivery API – access token_ | **ja** | appen (bara publicerat) |
| `CONTENTFUL_PREVIEW_TOKEN` | samma API key → _Content Preview API – access token_ | **ja** | appen (även utkast, bara redaktörens preview) |
| `CONTENTFUL_MANAGEMENT_TOKEN` | _Settings > CMA tokens_ (personlig) | **ja** | **bara** `npm run cms:setup`. Aldrig till molnet |
| `CMS_CACHE_SECONDS` | – | – | hur länge publicerade notiser svaras ur minnet (60) |

### Spacet och management-token

Hur ett space hänger ihop: [Contentful 101](https://www.contentful.com/help/getting-started/contentful-101/). Ett space med exempelinnehåll går också bra – `cms:setup` skapar bara sin egen innehållstyp och tre poster med fasta id:n.

- [ ] Fyll i `CONTENTFUL_SPACE_ID`
- [ ] Management-token: _Settings > CMA tokens > Create personal access token_
  - visas **en gång**
  - utgångsdatum **efter onsdag 25/11**
  - **Authorize** för organisationen (i listan under _CMA tokens_) – annars 401
  - klistra in efter `CONTENTFUL_MANAGEMENT_TOKEN=`
  - hittar ni inte: [Contentful – autentisering](https://www.contentful.com/developers/docs/references/authentication/)
- [ ] Skapa innehållstypen och notiserna (från repots rot):
  ```bash
  npm run cms:setup
  ```
  Förväntat: space/miljö/språk, sedan ✓ innehållstypen _Notis_ (4 fält), två publicerade notiser, _Ny led till våren_ som utkast. Går att köra om (uppdaterar samma poster).

### Läsnycklarna och appen

- [ ] _Settings > API keys > Add API key_. **Samma** nyckel har två värden → `CONTENTFUL_DELIVERY_TOKEN` och `CONTENTFUL_PREVIEW_TOKEN`
- [ ] `npm run dev` → öppna `localhost:3001` (skickar vidare till `/guides`)
- [ ] Logga in som `redaktor@utpost.se` / `hemligt123` → kryssa i _Förhandsgranska: visa utkast_
- [ ] Logga ut, in som `medlem@utpost.se` → ingen kryssruta
- [ ] **Rad 1:** skriv ner vilken nyckel läser vad

### När Contentful inte svarar (rad 2)

- [ ] Byt ett tecken i `CONTENTFUL_DELIVERY_TOKEN` → Ctrl+C → `npm run dev` → ladda om `/guides` → läs API-loggen
- [ ] **Rad 2:** skriv ner loggraden och vad sidan visar
- [ ] Sätt tillbaka nyckeln och starta om
- [ ] `git status` visar inte `.env` (gitignorerad – nycklar committas **aldrig**)

**Klart när:**

- [ ] `npm run test:api` grönt
- [ ] `/guides` visar _Storforsbron är avstängd_ och _Vinterguiderna är på väg_
- [ ] API-loggen: `cms: hämtade 2 publicerade notiser från Contentful` – **en gång**, inte vid varje omladdning
- [ ] Redaktören ser _Ny led till våren_ märkt _Utkast_; medlemmen ser ingen kryssruta
- [ ] Med fel nyckel: inga notiser, sidan fungerar ändå, loggen börjar `cms: kunde inte hämta notiser`

---

## Steg 2: En notis på en guide (20 min)

Guiden bor i Postgres, notisen i Contentful. Kopplingen är ett fält som redaktören fyller i. Rad 3.

- [ ] Hämta en slug – ur adressfältet (**hos oss `localhost:3001/guide/<slug>`**) eller alla på en gång:
  ```bash
  curl -s localhost:4000/graphql -H 'content-type: application/json' \
    -d '{"query":"{ guides { slug title } }"}'
  ```
- [ ] I Contentful: öppna _Storforsbron är avstängd_ → fyll i _Gäller guide (slug)_ → **Publish** ([Contentful 101](https://www.contentful.com/help/getting-started/contentful-101/) om ni inte hittar)
- [ ] Ladda om guidens sida tills notisen syns. Håll koll på när `cms: hämtade …` dyker upp i API-loggen. Eller med curl:
  ```bash
  curl -s localhost:4000/graphql -H 'content-type: application/json' \
    -d '{"query":"{ guide(slug: \"<slug>\") { title notices { title level guideSlug } } }"}'
  ```
- [ ] **Rad 3:** ungefär hur lång tid tog det?
- [ ] Prova en slug med stor bokstav eller mellanslag → Contentful ska vägra
- [ ] ⚠️ **Bugg hos oss:** länken _Gäller den här guiden_ i `client/src/components/NoticeList.vue` pekar på `/guider/<slug>` (mallens adress), men vår route är `/guide/:slug` (`client/src/router/index.ts`). Byt till `` `/guide/${notice.guideSlug}` `` och klicka på länken. (Det här är klientkod, inte kopplingen – kopplingen ändrar vi inte.)

Kopplingen finns redan, läs den – `guideSlug`-fältet i `scripts/cms-setup.mjs`:

```js
validations: [{ regexp: { pattern: '^[a-z0-9-]+$' }, message: 'Guidens slug, som i adressen: norra-myrleden-7' }],
```

…och `Guide.notices` i `api/src/graphql/resolvers.js`, som filtrerar notiserna på `notice.guideSlug === guide.slug`.

**Klart när:**

- [ ] Notisen syns ovanför guidens text, och länken _Gäller den här guiden_ på `/guides` leder till rätt guide
- [ ] Vi har en ungefärlig tid (rad 3)
- [ ] Contentful vägrar en slug med stor bokstav eller mellanslag

---

## Steg 3: Webhooken – testerna först, sedan routen (50 min)

Cachen skyddar oss mot Contentfuls tak men gör att redaktören väntar. Webhooken låter Contentful säga till när något ändrats. Rad 4. (= `TODO.md` steg 3, utom staging-delen.)

### 3a. Röda tester och PR

- [ ] Issue + branch enligt vår vana (t.ex. `<nr>-m9-webhook`):
  ```bash
  git checkout -b <nr>-m9-webhook
  ```
- [ ] `api/src/routes/routes.test.js` – **överst**, efter `import { sign } from '../lib/auth.js';`:
  ```js
  import { vi } from 'vitest';
  import { config } from '../config.js';
  import { publishedNotices, clearCmsCache } from '../cms/contentful.js';
  ```
  (eller lägg `vi` i den befintliga `vitest`-importen på rad 2)
- [ ] …och **sist i filen**:
  <details><summary>Testkoden (klicka)</summary>

  ```js
  // Fredagens labb (M9): webhooken från CMS:et. Adressen är publik, så testerna gäller två saker:
  // att ingen kommer in utan hemligheten, och att rätt anrop faktiskt tömmer cachen.
  describe('M9 – webhooken från CMS:et', () => {
    const HEMLIGHET = 'en-lang-webhook-hemlighet-for-testerna';
    const webhook = (headers = {}) => fetch(`${base}/api/cms/webhook`, { method: 'POST', headers });

    it('utan hemlighet, med fel hemlighet eller när ingen är satt på servern: 401', async () => {
      config.cmsWebhookSecret = HEMLIGHET;
      expect((await webhook()).status).toBe(401);
      expect((await webhook({ 'X-Utpost-Webhook-Secret': 'fel' })).status).toBe(401);
      config.cmsWebhookSecret = '';
      expect((await webhook({ 'X-Utpost-Webhook-Secret': '' })).status).toBe(401);
    });

    it('med rätt hemlighet töms cachen: nästa fråga hämtar från CMS:et igen', async () => {
      Object.assign(config, { cmsWebhookSecret: HEMLIGHET, cmsSpaceId: 'space1', cmsDeliveryToken: 'nyckel' });
      clearCmsCache();
      const riktigFetch = globalThis.fetch;
      // Bara anropen till Contentful byts ut – testets egna anrop till API:et går som vanligt.
      const contentful = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ items: [] }) }));
      vi.stubGlobal('fetch', (url, options) =>
        String(url).includes('contentful.com') ? contentful(url, options) : riktigFetch(url, options),
      );
      vi.spyOn(console, 'log').mockImplementation(() => {});

      await publishedNotices();
      await publishedNotices();
      expect(contentful).toHaveBeenCalledTimes(1); // andra frågan svarades ur cachen

      const res = await webhook({
        'X-Utpost-Webhook-Secret': HEMLIGHET,
        'X-Contentful-Topic': 'ContentManagement.Entry.publish',
      });
      expect(res.status).toBe(204);

      await publishedNotices();
      expect(contentful).toHaveBeenCalledTimes(2); // cachen var tömd

      vi.unstubAllGlobals();
      vi.restoreAllMocks();
      Object.assign(config, { cmsWebhookSecret: '', cmsSpaceId: '', cmsDeliveryToken: '' });
      clearCmsCache();
    });
  });
  ```
  </details>

- [ ] Kör bara filen (databaserna ska vara igång) → **två röda**: `expected 404 to be 401` och `expected 404 to be 204`. Alla andra i filen gröna
  ```bash
  cd api && npx vitest run src/routes/routes.test.js; cd ..
  ```
- [ ] Pusha **innan** routen finns och öppna PR:en:
  ```bash
  git add api/src/routes/routes.test.js
  git commit -m "test: M9 webhooken från CMS:et – röda, routen saknas"
  git push -u origin HEAD
  gh pr create --fill
  gh pr checks --watch
  ```
- [ ] **Rad 4:** testernas namn + länken till den röda körningen i PR-beskrivningen (PR → _Checks_ → _Integration_ → adressfältet)

### 3b. Routen

- [ ] Ny fil `api/src/routes/cms.js`:
  ```js
  import { Router } from 'express';
  import crypto from 'node:crypto';
  import { config } from '../config.js';
  import { clearCmsCache } from '../cms/contentful.js';

  export const cmsRouter = Router();

  // Fredagens labb (M9): Contentful anropar den här adressen när en notis publiceras eller
  // avpubliceras (Settings > Webhooks i Contentful). Då töms cachen, och nästa besökare får det
  // nya innehållet direkt – inte efter upp till en minut.
  //
  // Adressen är publik: vem som helst kan anropa den. Därför en hemlighet i en header, som bara vi
  // och Contentful känner till. Utan den: 401. Jämförelsen görs i konstant tid, så att svarstiden
  // inte avslöjar hur många tecken som var rätt. Är hemligheten inte satt på servern går ingen in.
  const sameSecret = (given) => {
    const a = Buffer.from(String(given ?? ''));
    const b = Buffer.from(config.cmsWebhookSecret);
    return b.length > 0 && a.length === b.length && crypto.timingSafeEqual(a, b);
  };

  cmsRouter.post('/webhook', (req, res) => {
    if (!sameSecret(req.headers['x-utpost-webhook-secret'])) {
      return res.status(401).json({ error: 'fel eller ingen webhook-hemlighet' });
    }
    clearCmsCache();
    // Contentful säger vad som hände i en header, t.ex. ContentManagement.Entry.publish
    console.log(`cms: webhook (${req.headers['x-contentful-topic'] ?? 'okänt ämne'}) – cachen tömd`);
    res.status(204).end();
  });
  ```
- [ ] `api/src/app.js` (dubbla citattecken hos oss):
  ```js
  // efter import { photosRouter } from "./routes/photos.js";
  import { cmsRouter } from "./routes/cms.js";

  // efter app.use("/api/photos", photosRouter);
  app.use("/api/cms", cmsRouter); // M9: webhooken från CMS:et
  ```
- [ ] `api/src/config.js` – efter raden med `cmsCacheSeconds`:
  ```js
    // Hemligheten som CMS:et skickar med när det anropar /api/cms/webhook. Tom = webhooken är stängd.
    cmsWebhookSecret: process.env.CMS_WEBHOOK_SECRET ?? "",
  ```
- [ ] `.env.example` – efter `CMS_CACHE_SECONDS=60` (samma stil som raderna ovanför):
  ```
  # HEMLIGHET. Skickas av Contentful i headern X-Utpost-Webhook-Secret. Generera: openssl rand -hex 24. Tom = webhooken är stängd
  CMS_WEBHOOK_SECRET=
  ```
- [ ] **`docker-compose.yml`** (inte `compose.yaml`) – under `api:` → `environment:`, efter `CONTENTFUL_PREVIEW_TOKEN`:
  ```yaml
        CMS_WEBHOOK_SECRET: ${CMS_WEBHOOK_SECRET:-}
  ```
- [ ] Gröna tester:
  ```bash
  cd api && npx vitest run src/routes/routes.test.js; cd ..   # alla gröna i filen
  npm run test:api
  npm run typecheck
  ```

### 3c. Prova med curl

`.env` läses bara när API:et startar.

- [ ] Hemlighet i `.env` och i terminalen, starta om:
  ```bash
  export CMS_WEBHOOK_SECRET=$(openssl rand -hex 24)
  echo "CMS_WEBHOOK_SECRET=$CMS_WEBHOOK_SECRET" >> .env
  npm run dev
  ```
  (fish: `set -x CMS_WEBHOOK_SECRET (openssl rand -hex 24)`)
- [ ] I en annan terminal (sätt variabeln igen om den är ny):
  ```bash
  curl -i -X POST http://localhost:4000/api/cms/webhook                                                    # → 401
  curl -i -X POST http://localhost:4000/api/cms/webhook -H "X-Utpost-Webhook-Secret: $CMS_WEBHOOK_SECRET"  # → 204
  ```
- [ ] Som redaktören: ändra rubriken på en publicerad notis i Contentful → **Publish** → ladda om `/guides` (gamla rubriken kvar) → vänta några sekunder → kör den andra curl-raden → ladda om (nya rubriken syns)

### 3d. Merga

- [ ] När PR:en är grön:
  ```bash
  git add -A
  git commit -m "feat: M9 POST /api/cms/webhook – hemlighet i headern, tömmer cachen"
  git push
  gh pr checks --watch
  gh pr merge --merge
  git checkout main && git pull
  ```

**Klart när:**

- [ ] Först två röda (`expected 404 to be 401`, `expected 404 to be 204`), och PR:en har Integration rött (rad 4)
- [ ] Efter routen: hela filen och `npm run test:api` gröna (två tester fler än före)
- [ ] `curl` utan hemlighet → `401`, med → `204`, loggen: `cms: webhook (okänt ämne) – cachen tömd`
- [ ] Efter curl syns nya rubriken direkt, och loggen har en ny `cms: hämtade …`
- [ ] Mergad till `main`

**Sen:** gå igenom [Ni är klara när](#ni-är-klara-när) själva och skriv upp er på tavlan. Medan ni väntar: rad 5 och Fördjupning.

**Kvar till eftermiddagen (`TODO.md` steg 3):** nycklarna till staging med `infra/azure/cms-till-staging.sh` och den riktiga webhooken i Contentful mot staging.

---

## Stretch (om tid finns – inte provkörda av läraren)

- [ ] **A. Webhooken genom compose + nginx.** Testerna kör mot `npm run dev`-koden, staging kör imagen.
  ```bash
  CMS_WEBHOOK_SECRET=… docker compose up -d --build --wait
  curl -i -X POST http://localhost:3001/api/cms/webhook -H "X-Utpost-Webhook-Secret: …"
  ```
  Släpper nginx igenom headern?
- [ ] **B. Bara notiser.** En webhook kan skickas för allt i spacet. Läs [Contentful – webhooks](https://www.contentful.com/developers/docs/extensibility/webhooks/overview/): går det att begränsa vilka poster som utlöser den? Skriv ner – behövs i eftermiddag.
- [ ] **C. Förhandsgranskning från Contentful.** _Settings > Preview > + Create preview platform_ (localhost tillåtet). Vilken adress i Utpost visar utkasten, och vad måste redaktören göra innan den fungerar? **Aldrig en nyckel i adressen.**

---

## Fördjupning (läs medan ni väntar)

Det här ska vi kunna säga med egna ord vid avcheckningen.

### Tre nycklar, tre rättigheter

| API | Värd | Ger | Nyckel |
| --- | ---- | --- | ------ |
| Content Delivery | `cdn.contentful.com` | bara publicerat | delivery |
| Content Preview | `preview.contentful.com` | senaste versionen, även utkast | preview (delivery funkar **inte**) |
| Content Management | `api.contentful.com` | skriver | management – personlig, bara `cms:setup` lokalt. Läcker den kan någon skriva i spacet som oss |

**Fråga 2 – varför ser en medlem aldrig utkasten?** Preview-nyckeln finns bara på servern. Kryssrutan ber bara om `notices(preview: true)`; det är **resolvern** (`Query.notices` i `resolvers.js`) som kräver rollen `editor` och annars svarar `FORBIDDEN`. Låg nyckeln i klienten kunde vem som helst läsa utkasten direkt från Contentful.

**När Contentful inte svarar:** `publishedNotices()` loggar felet och svarar med senast hämtade, eller en tom lista. Sidan fungerar utan notiser – ett medvetet val: notiserna är inte viktigare än guiderna.

### Två system, ett fält

- Guiden (Postgres) och notisen (Contentful) vet inget om varandra. Kopplingen = en sträng redaktören skriver + resolvern `Guide.notices` som filtrerar
- Valideringen kollar att det **ser ut** som en slug, inte att guiden **finns**. Fel slug → notisen syns ingenstans
- Seeden slumpar sluggarna (bara siffran är fast) → efter en ny seed pekar kopplingen på en guide som inte finns. Tänk på det i M9 steg 4 när guiderna flyttar till Contentful (då kan notisen referera guiden i samma space)
- Det som tog tid i steg 2 var cachen: `CMS_CACHE_SECONDS` (60). `cms: hämtade …` loggas bara när Contentful faktiskt anropas. Delivery-API:et kan dessutom ge gamla versionen några sekunder efter publicering

### Cache och webhook

**Fråga 1 – varför en cache, och vad gör webhooken?** Gratisnivån: **100 000 API-anrop/månad**, alla API:er tillsammans; nås taket pausas läs-API:erna till nästa månad. Utan cache = ett anrop per sidvisning. Med cache = högst ett per minut oavsett trafik, men redaktören väntar upp till en minut. Webhooken: Contentful anropar oss vid publicering → vi tömmer cachen → nästa besök hämtar nytt. Vi frågar bara när det finns något nytt.

- **Hemligheten:** `/api/cms/webhook` är publik. Utan skydd kan vem som helst tömma cachen hur ofta som helst → varje besök blir ett anrop → rakt mot taket. `timingSafeEqual` jämför i konstant tid. Tom hemlighet på servern = webhooken stängd (tom sträng får aldrig vara rätt svar)
- **Varför curl i dag:** Contentful avvisar webhooks mot localhost/privata IP. Den riktiga registreras mot staging i eftermiddag. Contentful försöker två gånger till vid 429 eller 5xx
- **Varför 404 i röda testerna:** routen fanns inte. Ett test kan bli rött av fel anledning – läs `expect`-raden. Testet byter ut `fetch` bara för `contentful.com`, så det når aldrig Contentful men kan räkna anropen

### Till staging (eftermiddagen, `TODO.md` steg 3)

`infra/azure/cms-till-staging.sh` läser `.env`, lägger delivery-, preview- och webhook-hemligheten som secrets på containerappen (`secretref:`), skriver ut webhookens adress. **Management-token följer inte med.** Läs [Contentful – webhooks](https://www.contentful.com/developers/docs/extensibility/webhooks/overview/) före lunch.

---

## Felsökning

| Symptom | Orsak / åtgärd |
| ------- | -------------- |
| Inga notiser, inget fel i loggen | Space-id eller delivery-nyckel saknas i `.env` → CMS:et avstängt med flit. Fyll i, starta om |
| `Saknar CONTENTFUL_SPACE_ID eller CONTENTFUL_MANAGEMENT_TOKEN` | Kör `cms:setup` från repots rot, där `.env` ligger. Värdena i `.env`, inte bara i skalet |
| `cms:setup` → 401/404 | `OrganizationAccessGrantRequired` → _CMA tokens_ → **Authorize**. Annars fel token/space-id (skapa ny token) |
| `cms:setup` → 422 | Contentful underkände innehållstypen. Läs texten, säg till |
| `cms: kunde inte hämta notiser (Contentful svarade …)` | Läs siffran. 401 = delivery och preview förväxlade? |
| `cms: hämtade …` vid varje omladdning | Cachen fungerar inte – kolla `CMS_CACHE_SECONDS` |
| Redaktören ser inget utkast | Preview-nyckeln saknas, inte inloggad som `redaktor@utpost.se`, eller token följer inte med (`fetchOptions` i `urql.ts`) |
| Ändringen syns inte | Cachen (en minut), eller posten är _Changed_ men inte publicerad |
| Notisen syns inte på guiden | Sluggen stämmer inte exakt, eller seedat om. Kopiera igen ur adressfältet |
| _Gäller den här guiden_ leder ingenstans | `/guider/` i stället för `/guide/` i `NoticeList.vue` (se steg 2) |
| Testerna gröna direkt i steg 3 | Routen finns redan: `git stash`, kör, se rött, `git stash pop` |
| Andra tester röda efter webhooktestet | Stubben ligger kvar om testet föll mitt i. Laga det röda först |
| curl → 401 fast rätt hemlighet | API:et startat före `.env`-raden, eller olika värden (`echo $CMS_WEBHOOK_SECRET`, `grep CMS_WEBHOOK .env`). Två rader i `.env`? Ta bort den tomma |
| curl → 404 | Routen inte monterad i `app.js`, eller fel adress/metod (`POST /api/cms/webhook`) |
| Portar upptagna (5433, 27017, 3001, 4000) | `docker ps`, `docker stop <namn>`, stoppa annan `npm run dev` |
| `npm run typecheck` rött | `npm run codegen` (ingår i `typecheck`, men kolla att GraphQL-frågorna stämmer mot schemat) |
