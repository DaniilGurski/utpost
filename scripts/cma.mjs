// M9: anrop till Contentfuls Content Management API (api.contentful.com) – det API som SKRIVER.
// Delas av cms-setup.mjs och migrate-guides.mjs. Appen använder det aldrig.
//
// Kräver två rader i .env (se .env.example):
//   CONTENTFUL_SPACE_ID          – Settings > General settings > Space ID
//   CONTENTFUL_MANAGEMENT_TOKEN  – Settings > CMA tokens > Create personal access token
const space = process.env.CONTENTFUL_SPACE_ID;
const token = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
const environment = process.env.CONTENTFUL_ENVIRONMENT ?? 'master';
if (!space || !token) {
  console.error('Saknar CONTENTFUL_SPACE_ID eller CONTENTFUL_MANAGEMENT_TOKEN i .env – se .env.example.');
  process.exit(1);
}
export { space, environment };

const base = `https://api.contentful.com/spaces/${space}/environments/${environment}`;
const paus = (ms) => new Promise((r) => setTimeout(r, ms));

// Antal anrop under körningen, så att skripten kan säga vad de kostade av gratisnivåns tak.
export const calls = { count: 0 };

// Ett anrop till CMA. version = postens nuvarande version: Contentful vägrar skriva över något
// som har ändrats sedan man läste det (409), så varje ändring måste säga vilken version den utgår från.
export const cma = async (method, path, { body, version, contentType } = {}, retries = 5) => {
  // Gratisnivån tillåter sju skrivningar i sekunden. 200 ms mellan anropen = högst fem i sekunden,
  // läsningar inräknade – vi håller oss under taket i stället för att slå i det.
  await paus(200);
  calls.count++;
  const res = await fetch(base + path, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/vnd.contentful.management.v1+json',
      ...(version !== undefined ? { 'X-Contentful-Version': String(version) } : {}),
      ...(contentType ? { 'X-Contentful-Content-Type': contentType } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  // 429: för många anrop ändå (någon annan använder samma space?). Contentful säger i en header
  // hur många sekunder tills taket släpper. Vänta så länge och försök igen – max fem gånger.
  if (res.status === 429 && retries > 0) {
    const seconds = Number(res.headers.get('X-Contentful-RateLimit-Reset') ?? 1);
    console.warn(`  429 från Contentful – väntar ${seconds} s och försöker igen`);
    await paus(seconds * 1000);
    return cma(method, path, { body, version, contentType }, retries - 1);
  }
  if (res.status === 404 && method === 'GET') return null;
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${(await res.text()).slice(0, 400)}`);
  return res.status === 204 ? null : res.json();
};

export const defaultLocale = async () => (await cma('GET', '/locales')).items.find((l) => l.default).code;

// Skapa eller uppdatera en innehållstyp, och aktivera den (den måste aktiveras innan den går att använda).
export const upsertContentType = async (id, definition) => {
  const befintlig = await cma('GET', `/content_types/${id}`);
  const typ = await cma('PUT', `/content_types/${id}`, { body: definition, version: befintlig?.sys.version });
  await cma('PUT', `/content_types/${id}/published`, { version: typ.sys.version });
};

// Skapa eller uppdatera en post med ett fast id (upsert): kör man igen skrivs samma post över,
// det blir ingen dubblett. publicera = true publicerar; false lämnar ett utkast (och avpublicerar
// om posten var publicerad). fields = { fält: värde }, värdet läggs under språket.
export const upsertEntry = async ({ id, contentType, locale, fields, publicera }) => {
  const body = { fields: Object.fromEntries(Object.entries(fields).map(([falt, varde]) => [falt, { [locale]: varde }])) };
  const finns = await cma('GET', `/entries/${id}`);
  const post = await cma('PUT', `/entries/${id}`, { body, version: finns?.sys.version, contentType });
  if (publicera) {
    await cma('PUT', `/entries/${id}/published`, { version: post.sys.version });
  } else if (finns?.sys.publishedVersion) {
    await cma('DELETE', `/entries/${id}/published`, { version: post.sys.version });
  }
};
