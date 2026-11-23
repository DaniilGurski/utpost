import { describe, it, expect } from 'vitest';
import { guideEntryId, htmlToRichText } from './guide-migration.js';

// Migreringen (M9, #198): guidens body_html i Postgres → rich text i Contentful. Rena funktioner,
// inget nät – skriptet (scripts/migrate-guides.mjs) gör anropen.
const text = (value, marks = []) => ({ nodeType: 'text', value, marks: marks.map((type) => ({ type })), data: {} });
const block = (nodeType, ...content) => ({ nodeType, data: {}, content });

describe('guidens id i Contentful', () => {
  it('är guide-<id i Postgres>, så att skriptet skriver till samma post varje gång', () => {
    expect(guideEntryId(7)).toBe('guide-7');
    expect(guideEntryId('12')).toBe('guide-12');
  });
});

describe('body_html → rich text', () => {
  // Exakt det seeden genererar (api/src/db/seed.js)
  const seedHtml = `
<h2>Om Norra Myrleden 7</h2>
<p>En av de mest omtyckta lederna i Jämtland. Passar bra från maj till oktober.</p>
<h3>Så tar du dig hit</h3>
<p>Buss 123 från centralorten, cirka 45 minuter. Parkering finns vid leden.</p>
<h3>Bra att veta</h3>
<ul><li>Vindskydd vid halva sträckan</li><li>Ingen service utmed leden</li></ul>
<p><em>Senast granskad av redaktionen.</em></p>`.trim();

  it('blir rubriker, stycken, en punktlista och kursiv – och första rubriken (titeln) tas bort', () => {
    expect(htmlToRichText(seedHtml, { title: 'Norra Myrleden 7' })).toEqual({
      nodeType: 'document',
      data: {},
      content: [
        block('paragraph', text('En av de mest omtyckta lederna i Jämtland. Passar bra från maj till oktober.')),
        block('heading-3', text('Så tar du dig hit')),
        block('paragraph', text('Buss 123 från centralorten, cirka 45 minuter. Parkering finns vid leden.')),
        block('heading-3', text('Bra att veta')),
        block(
          'unordered-list',
          block('list-item', block('paragraph', text('Vindskydd vid halva sträckan'))),
          block('list-item', block('paragraph', text('Ingen service utmed leden'))),
        ),
        block('paragraph', text('Senast granskad av redaktionen.', ['italic'])),
      ],
    });
  });

  it('en h2 som inte är titeln behålls', () => {
    const doc = htmlToRichText('<h2>Vintertid</h2><p>Snöskor.</p>', { title: 'Norra Myrleden 7' });
    expect(doc.content.map((node) => node.nodeType)).toEqual(['heading-2', 'paragraph']);
  });

  it('kursiv mitt i ett stycke blir en egen textbit', () => {
    const doc = htmlToRichText('<p>Ta med <em>vatten</em> och mat.</p>', { title: 'x' });
    expect(doc.content[0].content).toEqual([text('Ta med '), text('vatten', ['italic']), text(' och mat.')]);
  });

  it('en tagg vi inte känner till stoppar migreringen i stället för att gissa', () => {
    expect(() => htmlToRichText('<p>Se <a href="/x">kartan</a></p>', { title: 'x' })).toThrow(/<a>/);
    expect(() => htmlToRichText('<table></table>', { title: 'x' })).toThrow(/<table>/);
  });

  it('text utanför ett block stoppar också migreringen', () => {
    expect(() => htmlToRichText('lös text<p>Stycke</p>', { title: 'x' })).toThrow(/utanför/);
  });
});
