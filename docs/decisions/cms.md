# Beslutsdokument: CMS

_Ett av teamets beslutsdokument. Skrivs i M9. Högst en sida. Ni ska inte utvärdera marknaden, ni ska kunna försvara valet: varför det här räcker för Utpost, vad ni valde bort, och vad som hade fått er att byta._

**Datum:**
**Beslut:** _(en eller två meningar: vilket innehåll bor i CMS:et, vilket CMS, och vad ligger kvar i databasen?)_

## Bakgrund

_Skuld 10: redaktionens innehåll låg som `body_html` i Postgres och sattes in med `v-html`. Redaktörerna mejlade ändringar till utvecklarna. Två meningar om vad det kostade, med ett exempel ur er egen kod._

## Innehållsmodellen

_Era innehållstyper och fält. Fälten ska säga vad innehållet är, inte hur det ser ut._

| Innehållstyp | Fält | Typ | Varför ett eget fält |
| ------------ | ---- | --- | -------------------- |
|              |      |     |                      |

_Vad är innehåll och vad är data? Vilka fält ligger kvar i Postgres (till exempel längd och svårighetsgrad), och hur hittar API:et rätt post i CMS:et?_

## Alternativ

_Kursens val och ett alternativ ni valde bort. Det bortvalda ska vara ett riktigt alternativ: ett annat headless CMS, ett som ni driftar själva, eller Markdown i repot._

|                                               | Det vi valde | Det vi valde bort |
| --------------------------------------------- | ------------ | ----------------- |
| Vad det är                                    |              |                   |
| Vem kan redigera, och hur                     |              |                   |
| Utkast och förhandsgranskning                 |              |                   |
| Vad det kostar oss (pengar, drift, inlåsning) |              |                   |

## Motivering

_Varför räcker valet för Utpost just nu? Knyt till vem som redigerar och hur ofta._

## Vad som hade fått oss att byta

_En eller två konkreta saker: en gräns i gratisnivån, ett krav från redaktionen, en lansering i ett land till._

## Konsekvenser

_Vad händer när CMS:et är nere? Hur länge dröjer en publicering innan den syns, och varför? Vad i koden måste skrivas om den dag ni byter CMS?_

### Labben

Vilken nyckel läser vad, och var den ligger (delivery, preview, management)?
Svar: i steg 1 används cms management token, appen använder inte det.

Vad appen gör när Contentful inte svarar: loggraden + vad guidelistan visar
Svar: när vi ändrar contentful delivery token försvinner notiserna och API loggen säger:
`cms: kunde inte hämta notiser (Contentful svarade 401) – svarar med en tom lista`

Ungefär hur lång tid från publicera till synlig notis, utan webhook
Svar:
det gick snabbt, vi såg ändringen efter kanske 5s

En gräns i gratisnivån som skulle få oss att byta, med länk till källan
Svar:
