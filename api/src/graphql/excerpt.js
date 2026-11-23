// Guidekortets utdrag (#198): ren text ur guidens första stycke, högst ~180 tecken. Räknas fram här
// i API:et ur texten från CMS:et – det är inget eget fält i Contentful, och klienten behöver varken
// hela texten eller v-html för att visa det.
const MAX = 180;

export const excerpt = (blocks) => {
  const first = blocks?.find((block) => block.type === 'PARAGRAPH');
  if (!first) return null;
  const text = first.runs.map((run) => run.text).join('').trim();
  if (text.length <= MAX) return text;
  const cut = text.slice(0, MAX);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 0 ? cut.lastIndexOf(' ') : MAX).trimEnd()}…`;
};
