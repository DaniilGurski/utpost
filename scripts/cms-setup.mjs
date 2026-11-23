#!/usr/bin/env node
// M9: sätter upp innehållstyperna Notis och Guide, och tre notiser, i ert eget Contentful-space.
//
//   npm run cms:setup
//
// Kräver CONTENTFUL_SPACE_ID och CONTENTFUL_MANAGEMENT_TOKEN i .env (se cma.mjs).
//
// Skriptet pratar med Contentfuls Content Management API (api.contentful.com): det tredje API:et,
// det som SKRIVER. Appen använder det aldrig – den läser bara, med delivery- och preview-nyckeln.
// Går att köra flera gånger: innehållstyperna och notiserna har fasta id:n och uppdateras på plats.
// Två notiser publiceras, den tredje lämnas som utkast (den syns bara i förhandsgranskningen).
// Guiderna själva läggs in av npm run cms:migrate-guides.
import { space, environment, defaultLocale, upsertContentType, upsertEntry } from './cma.mjs';

// Innehållsmodellen: fälten säger vad en notis ÄR. Nivån är ett val mellan två värden, inte en
// färg. Texten får innehålla fet, kursiv och länkar – inga rubriker, bilder eller tabeller –
// så redaktören kan inte förstöra layouten.
const notis = {
  name: 'Notis',
  description: 'En notis från redaktionen: driftinformation och varningar till besökarna.',
  displayField: 'title',
  fields: [
    { id: 'title', name: 'Title', type: 'Symbol', required: true, localized: false, validations: [{ size: { max: 80 } }] },
    {
      id: 'text',
      name: 'Text',
      type: 'RichText',
      required: true,
      localized: false,
      validations: [
        { enabledMarks: ['bold', 'italic'], message: 'Bara fet och kursiv text' },
        { enabledNodeTypes: ['hyperlink'], message: 'Bara stycken och länkar' },
      ],
    },
    { id: 'level', name: 'Level', type: 'Symbol', required: true, localized: false, validations: [{ in: ['info', 'varning'] }] },
    {
      id: 'guideSlug',
      name: 'Applies to guide (slug)',
      type: 'Symbol',
      required: false,
      localized: false,
      validations: [{ regexp: { pattern: '^[a-z0-9-]+$' }, message: 'Guidens slug, som i adressen: norra-myrleden-7' }],
    },
  ],
};

const text = (value, marks = []) => ({ nodeType: 'text', value, marks: marks.map((type) => ({ type })), data: {} });
const stycke = (...content) => ({ nodeType: 'paragraph', data: {}, content });
const dokument = (...content) => ({ nodeType: 'document', data: {}, content });

const notiser = [
  {
    id: 'utpost-notis-1',
    publicera: true,
    fields: {
      title: 'Storforsbron är avstängd',
      level: 'varning',
      text: dokument(
        stycke(text('Bron över Storforsen lagas till och med '), text('30 november', ['bold']), text('.')),
        stycke(text('Räkna med en omväg på tre kilometer.')),
      ),
    },
  },
  {
    id: 'utpost-notis-2',
    publicera: true,
    fields: {
      title: 'Vinterguiderna är på väg',
      level: 'info',
      text: dokument(stycke(text('Redaktionen går igenom lederna inför vintern. Uppdaterade guider kommer i december.'))),
    },
  },
  {
    id: 'utpost-notis-3',
    publicera: false,
    fields: {
      title: 'Ny led till våren',
      level: 'info',
      text: dokument(stycke(text('Vi öppnar en ny led i Jämtland i maj. Mer information kommer.'))),
    },
  },
];

// Guiden (#198): bara texten bor i Contentful. Titel, slug, region, svårighet, längd och bild är
// fakta om leden och ligger kvar i Postgres. internalTitle finns bara för att redaktören ska hitta
// rätt post i listan – appen läser det aldrig. Posten heter guide-<id i Postgres>.
// Texten får rubriker (två nivåer), punktlistor och kursiv – det guiderna har i dag.
const guide = {
  name: 'Guide',
  description: 'Texten till en guide. Fakta om leden (titel, region, längd …) ligger i Utposts databas; posten guide-7 hör till guide 7 där.',
  displayField: 'internalTitle',
  fields: [
    { id: 'internalTitle', name: 'Internal title (only for finding the guide here)', type: 'Symbol', required: true, localized: false },
    {
      id: 'body',
      name: 'Body',
      type: 'RichText',
      required: true,
      localized: false,
      validations: [
        { enabledMarks: ['italic'], message: 'Bara kursiv text' },
        { enabledNodeTypes: ['heading-2', 'heading-3', 'unordered-list'], message: 'Bara stycken, rubriker och punktlistor' },
      ],
    },
  ],
};

const locale = await defaultLocale();
console.log(`Space ${space}, miljö ${environment}, språk ${locale}`);

await upsertContentType('notis', notis);
console.log(`✓ innehållstypen Notis (${notis.fields.length} fält)`);
await upsertContentType('guide', guide);
console.log(`✓ innehållstypen Guide (${guide.fields.length} fält)`);

for (const n of notiser) {
  await upsertEntry({ id: n.id, contentType: 'notis', locale, fields: n.fields, publicera: n.publicera });
  console.log(`✓ ${n.publicera ? 'publicerad' : 'utkast    '}  ${n.fields.title}`);
}

console.log(`
Klart. Nu behöver appen två nycklar till, de som LÄSER:
  Settings > API keys > Add API key. Kopiera till .env:
    CONTENTFUL_DELIVERY_TOKEN  = Content Delivery API – access token   (bara publicerat)
    CONTENTFUL_PREVIEW_TOKEN   = Content Preview API – access token    (även utkast)
Starta om API:et (npm run dev) och öppna startsidan.
Guiderna: npm run cms:migrate-guides.`);
