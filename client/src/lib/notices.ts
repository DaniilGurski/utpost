// M9: formen på en notis när den når klienten – samma som schemat (Notice, Paragraph, TextRun).
// Brödtexten är DATA: stycken av textbitar, inte en HTML-sträng. Hur fet text och länkar ska se
// ut bestämmer klienten (components/RichText.vue).
export interface TextRun {
  text: string;
  bold: boolean;
  italic: boolean;
  href?: string | null;
}

export interface Paragraph {
  runs: TextRun[];
}

// #199: guidens text (Guide.body) är block – samma textbitar, men blocket säger vad det ÄR.
// Ett notisstycke är ett PARAGRAPH-block, så RichText.vue ritar båda.
export type BlockType = "PARAGRAPH" | "HEADING_2" | "HEADING_3" | "LIST";

export interface Block {
  type: BlockType | `${BlockType}`;
  runs: TextRun[];
  /** Bara LIST: en rad textbitar per listpunkt */
  items?: TextRun[][] | null;
}

export const paragraphBlocks = (paragraphs: Paragraph[]): Block[] =>
  paragraphs.map((paragraph) => ({ type: "PARAGRAPH", runs: paragraph.runs }));

export interface Notice {
  id: string;
  title: string;
  level: string;
  status: string;
  guideSlug?: string | null;
  body: Paragraph[];
}
