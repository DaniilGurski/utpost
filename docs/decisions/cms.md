# Beslutsdokument: CMS

_Ett av teamets beslutsdokument. Skrivs i M9. Högst en sida. Ni ska inte utvärdera marknaden, ni ska kunna försvara valet: varför det här räcker för Utpost, vad ni valde bort, och vad som hade fått er att byta._

**Datum:** 2026-11-20
**Beslut:** Notiser (title, text, level, guideSlug) bor i Contentful. Guides och tours ligger kvar i Postgres, eftersom de är data med relationer och inte innehåll som redaktörer ändrar ofta.

## Bakgrund

Redaktionens innehåll låg som `body_html` i Postgres och sattes in med `v-html` (se `GuideDetailView.vue` och `GuideCard.vue`). Varje ändring krävde en utvecklare och en deploy, och `v-html` med redigerbar HTML är en XSS-risk. Notiser är nu flyttade; guiderna har skulden kvar.

## Innehållsmodellen

| Innehållstyp | Fält      | Typ      | Varför ett eget fält                                                      |
| ------------ | --------- | -------- | ------------------------------------------------------------------------- |
| Notis        | title     | Symbol   | Rubrik i notisen och i listor                                             |
| Notis        | text      | RichText | Redaktören formaterar utan HTML; klienten renderar noderna, inte `v-html` |
| Notis        | level     | Symbol   | Klienten väljer ikon/färg utifrån nivån: det är data, inte utseende       |
| Notis        | guideSlug | Symbol   | Nyckeln som kopplar en notis till en guide i Postgres                     |

Innehåll är det redaktören skriver och ändrar (notisens text). Data är det som har struktur och relationer (guidens längd, svårighetsgrad, tours), och det ligger kvar i Postgres. API:et hämtar notiserna och filtrerar på `notice.guideSlug === guide.slug` i resolvern. Slugen är en vanlig sträng utan främmande nyckel, så en felstavning ger en notis som tyst aldrig visas.

## Alternativ

|                                               | Det vi valde                                                                             | Det vi valde bort                                                          |
| --------------------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Vad det är                                    | Contentful (headless CMS som tjänst)                                                     | Git-baserat CMS (Markdown i repot)                                         |
| Vem kan redigera, och hur                     | Redaktörer i Contentfuls webbgränssnitt, utan utvecklare                                 | Bara utvecklare, via commit/PR                                             |
| Utkast och förhandsgranskning                 | Inbyggt: utkast, preview-API och publicera-knapp                                         | Utkast som branch/PR; förhandsgranskning kräver extra verktyg              |
| Vad det kostar oss (pengar, drift, inlåsning) | Gratis på free plan; betalplan över gränserna; ingen egen drift; viss inlåsning i API:et | Gratis, ingen inlåsning; kostar hosting och utvecklartid för varje ändring |

## Motivering

Utpost är en skoluppgift utan riktiga användare: få redaktörer som ändrar notiser sällan. Free plan räcker gott, och redaktörer slipper gå via utvecklare.

## Vad som hade fått oss att byta

1. Riktiga användare: över ca 80 % av API-gränsen, eller fler än 10 redaktörer.
2. Redaktionen behöver fler än 2 roller.

Gränser: [Contentful pricing](https://www.contentful.com/pricing/), 100 000 API-anrop/månad, 10 användare, 2 roller.

## Konsekvenser

- **CMS nere:** API:et loggar felet och svarar med senast hämtade notiser, eller en tom lista. Guiderna går ändå att läsa.
- **Publicering:** utan webhook syns en ändring efter upp till 60 s (cachen, `CMS_CACHE_SECONDS`) för att spara API-anrop. Med webhooken töms cachen vid publicering och ändringen syns direkt.
- **Vid byte av CMS:** `api/src/cms/contentful.js`, webhook-routen och `.env`-variablerna skrivs om. Schemat, klienten, guides och tours påverkas inte.

### Labben

**1. Vilken nyckel läser vad, och var ligger den?** _(delivery, preview, management)_

- Delivery: läser publicerat innehåll. Appen använder den.
- Preview: läser även utkast. Används för förhandsgranskning.
- Management: har skrivrättigheter. Används bara av `cms:setup` i steg 1, aldrig av appen.

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
