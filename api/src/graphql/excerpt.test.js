import { describe, it, expect } from 'vitest';
import { excerpt } from './excerpt.js';

const run = (text) => ({ text, bold: false, italic: false, href: null });
const block = (type, ...texts) => ({ type, runs: texts.map(run), items: null });

describe('guidens utdrag (#198)', () => {
  it('är texten i första stycket, utan märken – rubriker och listor före hoppas över', () => {
    expect(excerpt([block('HEADING_2', 'Vintertid'), block('PARAGRAPH', 'Ta med ', 'vatten', '.'), block('PARAGRAPH', 'Mer')])).toBe(
      'Ta med vatten.',
    );
  });

  it('kortas vid ett ordslut till högst 180 tecken, med …', () => {
    const lang = 'ord '.repeat(100).trim();
    const kort = excerpt([block('PARAGRAPH', lang)]);
    expect(kort.length).toBeLessThanOrEqual(181);
    expect(kort.endsWith('ord…')).toBe(true);
  });

  it('är null när texten saknas eller inte har något stycke', () => {
    expect(excerpt(null)).toBeNull();
    expect(excerpt([block('HEADING_3', 'Bara rubrik')])).toBeNull();
  });
});
