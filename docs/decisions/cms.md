# Beslutsdokument: CMS

_Ett av teamets beslutsdokument. Skrivs i M9. Högst en sida. Ni ska inte utvärdera marknaden, ni ska kunna försvara valet: varför det här räcker för Utpost, vad ni valde bort, och vad som hade fått er att byta._

**Datum:** 2026-11-24 (första versionen 2026-11-20)
**Beslut:** Redaktionens text bor i Contentful: notiserna och guidernas text. Själva guiden (slug, titel, region, svårighetsgrad, längd, bild, publicerad eller inte) och tours ligger kvar i Postgres.

> _"Postgres äger guiden, Contentful äger texten. De kopplas ihop med id: guide 7 = posten `guide-7`. Därför kan migreringen köras om: den skriver till samma 40 id:n varje gång."_

## Bakgrund

Redaktionens innehåll låg som `body_html` i Postgres och sattes in med `v-html`. Varje ändring krävde en utvecklare och en deploy, och `v-html` med redigerbar HTML är en XSS-risk. Först flyttade notiserna (övningen), sedan guidernas text (#197), som är det redaktörerna faktiskt mejlar om. Ingen `v-html` finns kvar i klienten.

## Innehållsmodellen

| Innehållstyp | Fält          | Typ      | Varför ett eget fält                                                                    |
| ------------ | ------------- | -------- | --------------------------------------------------------------------------------------- |
| Notis        | title         | Symbol   | Rubrik i notisen och i listor                                                           |
| Notis        | text          | RichText | Redaktören formaterar utan HTML; klienten renderar noderna, inte `v-html`               |
| Notis        | level         | Symbol   | Klienten väljer ikon/färg utifrån nivån: det är data, inte utseende                     |
| Notis        | guideSlug     | Symbol   | Nyckeln som kopplar en notis till en guide i Postgres                                   |
| Guide        | internalTitle | Symbol   | Bara för att redaktören ska hitta rätt post; API:et läser det aldrig                    |
| Guide        | body          | RichText | Guidens text: rubrik (h2, h3), stycke, punktlista, kursiv. API:et gör om den till block |

Innehåll är det redaktören skriver och ändrar (texten). Data är fakta som listan filtrerar på och visar (region, svårighetsgrad, längd), och de ska fungera när CMS:et är nere, så de ligger kvar i Postgres. Bilden är ett filnamn, inte en asset. Slugen ägs av utvecklarna och har inget fält i Contentful.

**Guide ↔ post:** post-id `guide-<id i Postgres>`. Id:t är stabilt (seeden kör `restart identity` och lägger in guiderna i samma ordning), ett post-id i Contentful går inte att byta, och bara seeden skapar guider. API:et hämtar alla guidetexter i ett anrop och slår upp på id. Utdraget på guidekortet räknas fram i API:et ur första stycket.

**Notis ↔ guide: vi behåller `guideSlug`.** Seeden är deterministisk, så slugen överlever en omseedning. En Reference till guideposten vore nästa steg (då kan en felstavad slug inte tyst ge en notis som aldrig visas), men vi hoppade över den inför deadline och för att notiser är sällsynta.

## Alternativ

|                                               | Det vi valde                                                                             | Det vi valde bort                                                          |
| --------------------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Vad det är                                    | Contentful (headless CMS som tjänst)                                                     | Git-baserat CMS (Markdown i repot)                                         |
| Vem kan redigera, och hur                     | Redaktörer i Contentfuls webbgränssnitt, utan utvecklare                                 | Bara utvecklare, via commit/PR                                             |
| Utkast och förhandsgranskning                 | Inbyggt: utkast, preview-API och publicera-knapp                                         | Utkast som branch/PR; förhandsgranskning kräver extra verktyg              |
| Vad det kostar oss (pengar, drift, inlåsning) | Gratis på free plan; betalplan över gränserna; ingen egen drift; viss inlåsning i API:et | Gratis, ingen inlåsning; kostar hosting och utvecklartid för varje ändring |

## Motivering

Utpost är en skoluppgift utan riktiga användare: få redaktörer som ändrar text sällan. Free plan räcker gott, och redaktörer slipper gå via utvecklare.

## Vad som hade fått oss att byta

1. Riktiga användare: över ca 80 % av API-gränsen, eller fler än 10 redaktörer.
2. Redaktionen behöver fler än 2 roller.

Gränser: [Contentful pricing](https://www.contentful.com/pricing/), 100 000 API-anrop/månad, 10 användare, 2 roller.

## Konsekvenser

- **Migreringen** (`npm run cms:migrate-guides`, körs lokalt av space-ägaren): ca 121 anrop per körning (1 för språket + läs, skriv, publicera per guide), varav 80 skrivningar. 200 ms paus mellan anropen (≤ 5/s, taket är 7). Vid 429 väntar skriptet så många sekunder som Contentful anger och försöker igen, högst 5 gånger. En tagg som inte stöds stoppar körningen innan något skrivs.
- **CMS nere:** API:et loggar felet och svarar med det senast hämtade. Har inget hämtats visas guidesidan med titel, fakta och bild ur Postgres och raden ”Guidens text kunde inte hämtas just nu.” i stället för texten; guidekortet visas utan utdrag. Notiserna blir en tom lista.
- **Publicering:** webhooken tömmer cachen, så ändringen syns direkt. Utan webhook syns den efter upp till 60 s (`CMS_CACHE_SECONDS`). Vi behåller 60 s: bara teamet använder Utpost, och det sparar API-anrop.
- **Vid byte av CMS:** `api/src/cms/contentful.js`, webhook-routen, migreringsskriptet och `.env`-variablerna skrivs om. Schemat och klienten påverkas inte.

### Labben

**1. Vilken nyckel läser vad, och var ligger den?** _(delivery, preview, management)_

- Delivery: läser publicerat innehåll. Appen använder den.
- Preview: läser även utkast. Används för förhandsgranskning.
- Management: har skrivrättigheter. Används bara av `cms:setup` och `cms:migrate-guides`, aldrig av appen.

Alla ligger i `.env` på servern; klienten ser dem aldrig.

**2. Vad gör appen när Contentful inte svarar?** _(loggraden + vad guidelistan visar)_

När vi ändrar delivery-nyckeln försvinner notiserna, och API-loggen säger:

```
cms: kunde inte hämta notiser (Contentful svarade 401) – svarar med en tom lista
```

Guidelistan visas som vanligt, utan notiser.

**3. Ungefär hur lång tid tar det från publicering till synlig notis, utan webhook?**

Det gick snabbt: vi såg ändringen efter ungefär 5 s. Värsta fallet är cachens 60 s.

**5. En gräns i gratisnivån som skulle få oss att byta** _(med länk till källan)_

100 000 API-anrop per månad, max 10 användare, 2 roller. Källa: [contentful.com/pricing](https://www.contentful.com/pricing/)
