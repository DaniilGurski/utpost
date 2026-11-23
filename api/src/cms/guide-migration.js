// M9 (#198): det migreringsskriptet (scripts/migrate-guides.mjs) behöver veta om guiderna:
// vilket id en guide har i Contentful, och hur body_html blir rich text. Rena funktioner utan nät,
// så att de går att testa. Själva anropen till Contentful görs av skriptet.

// Guide 7 i Postgres = posten guide-7 i Contentful. Id:t i Postgres är stabilt (seeden kör
// "restart identity" och lägger in guiderna i samma ordning), och ett post-id i Contentful går
// inte att byta – så kopplingen kan inte gå sönder av att någon döper om en guide.
export const guideEntryId = (id) => `guide-${id}`;

const BLOCKS = { h2: 'heading-2', h3: 'heading-3', p: 'paragraph' };
const KNOWN = new Set(['h2', 'h3', 'p', 'ul', 'li', 'em']);

const text = (value, italic) => ({
  nodeType: 'text',
  value,
  marks: italic ? [{ type: 'italic' }] : [],
  data: {},
});
const node = (nodeType, content) => ({ nodeType, data: {}, content });

// HTML → rich text för exakt de taggar seeden genererar: h2, h3, p, ul/li och em. Allt annat
// (länkar, tabeller, bilder …) stoppar migreringen med ett fel: hellre ett tydligt stopp än en
// guide där en del av texten tyst försvann. Behövs fler taggar byggs det ut här, med ett test.
// Första <h2>Om {titel}</h2> tas bort: titeln bor i Postgres och visas redan på guidesidan.
export const htmlToRichText = (html, { title }) => {
  const tokens = [...html.matchAll(/<(\/?)([a-z0-9]+)[^>]*>|[^<]+/gi)].map((m) =>
    m[2] ? { tag: m[2].toLowerCase(), close: m[1] === '/' } : { text: m[0] },
  );
  for (const t of tokens) {
    if (t.tag && !KNOWN.has(t.tag)) throw new Error(`taggen <${t.tag}> stöds inte i migreringen`);
  }

  let i = 0;
  const expectClose = (tag) => {
    const t = tokens[i++];
    if (!t?.close || t.tag !== tag) throw new Error(`väntade </${tag}>`);
  };

  // Text och <em> fram till </tag>
  const inline = (tag) => {
    const runs = [];
    let italic = false;
    for (;;) {
      const t = tokens[i];
      if (!t) throw new Error(`väntade </${tag}>`);
      if (t.text !== undefined) {
        runs.push(text(t.text, italic));
        i++;
      } else if (t.tag === 'em') {
        italic = !t.close;
        i++;
      } else if (t.close && t.tag === tag) {
        i++;
        return runs;
      } else {
        throw new Error(`<${t.tag}> stöds inte inuti <${tag}>`);
      }
    }
  };

  const list = () => {
    const items = [];
    for (;;) {
      const t = tokens[i++];
      if (!t) throw new Error('väntade </ul>');
      if (t.text !== undefined && !t.text.trim()) continue;
      if (t.close && t.tag === 'ul') return node('unordered-list', items);
      if (t.tag !== 'li' || t.close) throw new Error('bara <li> får ligga i <ul>');
      items.push(node('list-item', [node('paragraph', inline('li'))]));
    }
  };

  const content = [];
  while (i < tokens.length) {
    const t = tokens[i++];
    if (t.text !== undefined) {
      if (t.text.trim()) throw new Error(`text utanför ett block: "${t.text.trim().slice(0, 40)}"`);
      continue;
    }
    if (t.close) throw new Error(`oväntad </${t.tag}>`);
    if (t.tag === 'ul') content.push(list());
    else if (BLOCKS[t.tag]) content.push(node(BLOCKS[t.tag], inline(t.tag)));
    else throw new Error(`<${t.tag}> stöds inte utanför ett block`);
  }

  const first = content[0];
  const plain = (n) => n.content.map((c) => c.value).join('');
  if (first?.nodeType === 'heading-2' && plain(first) === `Om ${title}`) content.shift();

  return node('document', content);
};
