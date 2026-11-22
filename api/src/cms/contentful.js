import { config } from '../config.js';
import { guideEntryId } from './guide-migration.js';

// M9 (skuld 10): redaktionens innehåll bor i ett headless CMS – här Contentful. Den här filen är
// det ENDA stället i Utpost som vet det. Resolvers frågar efter notiser och får dem i schemats
// form; byter ni CMS är det den här filen som skrivs om, inte schemat och inte klienten.
//
// Contentful har två läs-API:er med samma adresser men olika värd och olika nyckel:
//   cdn.contentful.com      + delivery-token  → bara det som är PUBLICERAT
//   preview.contentful.com  + preview-token   → senaste versionen av allt, även UTKAST
// Två tillstånd, två nycklar. Båda nycklarna stannar här på servern (.env) – klienten ser dem aldrig.
const HOSTS = { published: 'https://cdn.contentful.com', preview: 'https://preview.contentful.com' };

// Utan space och nyckel är CMS:et avstängt: appen fungerar, den har bara inga notiser.
// Så kör pipelinen (inga CMS-hemligheter i testerna) och den som inte har satt upp ett space än.
export const cmsConfigured = () => Boolean(config.cmsSpaceId && config.cmsDeliveryToken);

const entries = async (contentType, { preview = false } = {}) => {
  const host = preview ? HOSTS.preview : HOSTS.published;
  const token = preview ? config.cmsPreviewToken : config.cmsDeliveryToken;
  const url =
    `${host}/spaces/${config.cmsSpaceId}/environments/${config.cmsEnvironment}/entries` +
    `?content_type=${contentType}&order=-sys.updatedAt&limit=100`;
  // Nyckeln går i en header, inte i adressen – adresser hamnar i loggar.
  // Fem sekunder räcker: hellre en startsida utan notiser än en startsida som hänger.
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`Contentful svarade ${res.status}`);
  return (await res.json()).items;
};

// En länk som redaktören skrivit in ska gå till en webbadress eller en sida hos oss. Allt annat
// (javascript:, data:) blir ingen länk alls – href är också ett ställe där skript kan smita in (M8, A05).
const safeHref = (uri) => (typeof uri === 'string' && /^(https?:\/\/|\/)/.test(uri) ? uri : null);

// Rich text i Contentful är inte HTML utan ett träd av noder: ett dokument med stycken, och i
// styckena textbitar med märken (fet, kursiv) och länkar. Här formas trädet om till det schemat
// lovar: stycken av textbitar. Blocktyper vi inte känner till hoppas över – det är här ni bygger
// ut när guiderna flyttar in (rubriker, listor, bilder).
const has = (node, mark) => (node.marks ?? []).some((m) => m.type === mark);
const runs = (nodes, href = null) =>
  (nodes ?? []).flatMap((node) => {
    if (node.nodeType === 'text') {
      return node.value ? [{ text: node.value, bold: has(node, 'bold'), italic: has(node, 'italic'), href }] : [];
    }
    if (node.nodeType === 'hyperlink') return runs(node.content, safeHref(node.data?.uri));
    return [];
  });

export const toParagraphs = (document) =>
  (document?.content ?? [])
    .filter((node) => node.nodeType === 'paragraph')
    .map((node) => ({ runs: runs(node.content) }))
    .filter((paragraph) => paragraph.runs.length > 0);

// Guidens text (#198) har fler blocktyper än notisen: rubriker och punktlistor. Varje block säger
// vad det ÄR (stycke, rubrik, lista) – klienten bestämmer hur det ser ut. En listpunkt i Contentful
// är stycken i en list-item; här blir varje punkt en rad textbitar.
const BLOCK_TYPES = { paragraph: 'PARAGRAPH', 'heading-2': 'HEADING_2', 'heading-3': 'HEADING_3' };
export const toBlocks = (document) =>
  (document?.content ?? []).flatMap((node) => {
    if (BLOCK_TYPES[node.nodeType]) {
      const blockRuns = runs(node.content);
      return blockRuns.length ? [{ type: BLOCK_TYPES[node.nodeType], runs: blockRuns, items: null }] : [];
    }
    if (node.nodeType === 'unordered-list') {
      const items = (node.content ?? [])
        .map((item) => (item.content ?? []).flatMap((child) => runs(child.content)))
        .filter((item) => item.length > 0);
      return items.length ? [{ type: 'LIST', runs: [], items }] : [];
    }
    return [];
  });

// Contentfuls post → schemats Notice. Fälten har engelska id:n (title, level), som resten av API:et.
// Ett utkast kan sakna fält – därav ??.
const toNotice = (entry, status = 'published') => ({
  id: entry.sys.id,
  title: entry.fields?.title ?? '',
  level: entry.fields?.level ?? 'info',
  body: toParagraphs(entry.fields?.text),
  guideSlug: entry.fields?.guideSlug ?? null,
  status,
});

// Cachen: Contentful räknar varje anrop (gratisnivån har ett tak per månad), och en notis ändras
// några gånger i veckan – inte 50 gånger i sekunden. Därför hämtar vi högst en gång i minuten och
// svarar ur minnet däremellan. Priset: en publicerad ändring syns efter upp till en minut.
// En cache per innehållstyp (notiser, guider), med samma regler; webhooken tömmer alla.
const caches = [];
export const clearCmsCache = () => {
  for (const cache of caches) cache.clear();
};

// what: vad som hämtas, för loggen. load: hämtar och formar om. fallback: svaret när CMS:et är
// avstängt, eller nere utan att vi har hämtat något tidigare (empty: samma sak, för loggen).
const cached = (what, load, fallback, empty) => {
  let value = null;
  let at = 0;
  let pending = null; // anropet till Contentful som pågår just nu, om något gör det
  caches.push({ clear: () => ((value = null), (at = 0)) });

  const refresh = async () => {
    try {
      const fresh = await load();
      console.log(`cms: hämtade ${fresh.size ?? fresh.length} publicerade ${what} från Contentful`);
      value = fresh;
      at = Date.now();
      return fresh;
    } catch (err) {
      // CMS:et är ett system till som kan vara nere. Då svarar vi med det vi senast hämtade,
      // eller utan – men resten av sidan ska fortfarande gå att läsa.
      console.error(`cms: kunde inte hämta ${what} (${err.message}) – svarar med ${value ? 'det senast hämtade' : empty}`);
      return value ?? fallback;
    }
  };

  return async () => {
    if (!cmsConfigured()) return fallback;
    if (value && Date.now() - at < config.cmsCacheSeconds * 1000) return value;
    // En lista med 40 guider frågar 40 gånger på samma gång (Guide.notices, Guide.body). Med kall
    // cache ska det bli ETT anrop till Contentful, inte 40: alla som frågar medan anropet pågår
    // väntar på samma svar.
    pending ??= refresh().finally(() => {
      pending = null;
    });
    return pending;
  };
};

export const publishedNotices = cached('notiser', async () => (await entries('notis')).map((entry) => toNotice(entry)), [], 'en tom lista');

// Guidernas text (#198): ALLA guider i ett anrop (40 st, under gränsen 100), som en karta
// post-id → block. Guidelistan behöver ändå utdrag ur alla, så ett anrop per guide vore 40.
const guideBodies = cached(
  'guidetexter',
  async () => new Map((await entries('guide')).map((entry) => [entry.sys.id, toBlocks(entry.fields?.body)])),
  new Map(),
  'ingen text',
);

// Texten till guiden med id:t i Postgres, eller null: posten finns inte (inte migrerad, eller
// borttagen) eller CMS:et är avstängt eller nere utan något hämtat. Resten av guiden kommer
// ändå ur Postgres.
export const guideBody = async (guideId) => (await guideBodies()).get(guideEntryId(guideId)) ?? null;

// Förhandsgranskningen: preview-API:et ger senaste versionen av allt. Vi hämtar det publicerade
// också, för att kunna säga vad som skiljer: finns posten inte publicerad är den ett utkast (draft),
// finns den men med annat innehåll är den ändrad men inte publicerad (changed). Cachas aldrig –
// redaktören vill se det hen just skrev.
export const previewNotices = async () => {
  const [latest, published] = await Promise.all([entries('notis', { preview: true }), entries('notis')]);
  const publishedFields = new Map(published.map((entry) => [entry.sys.id, JSON.stringify(entry.fields)]));
  return latest.map((entry) => {
    const live = publishedFields.get(entry.sys.id);
    const status = live === undefined ? 'draft' : live === JSON.stringify(entry.fields) ? 'published' : 'changed';
    return toNotice(entry, status);
  });
};
