#!/usr/bin/env node
// M9 (#198): flyttar guidernas text från Postgres (body_html) till Contentful (rich text).
//
//   npm run cms:migrate-guides
//
// Körs EN gång, lokalt, av den som äger teamets space (management-token finns bara på den datorn),
// mot den egna seedade databasen i Docker. Seeden är deterministisk, så texten blir densamma som i
// staging. Aldrig mot staging-databasen, aldrig i pipelinen. Först npm run cms:setup (skapar Guide).
//
// Går att köra om utan dubbletter: guide 7 skrivs alltid till posten guide-7 (upsert, inte create).
// Kostnad per körning: 1 anrop för språket + högst 3 per guide (läs, skriv, publicera) ≈ 121 anrop,
// 80 av dem skrivningar. Vi pausar 200 ms mellan anropen (≤ 5/s, taket är 7) och väntar vid 429.
//
// Opublicerade guider i Postgres (published = false) blir utkast i Contentful. Det är fortfarande
// Postgres som bestämmer om en guide syns – Contentful bestämmer bara om texten är publicerad.
import { pool } from '../api/src/db/client.js';
import { guideEntryId, htmlToRichText } from '../api/src/cms/guide-migration.js';
import { space, environment, calls, defaultLocale, upsertEntry } from './cma.mjs';

try {
  const { rows: guides } = await pool.query('select id, title, body_html, published from guides order by id');
  const locale = await defaultLocale();
  console.log(`Space ${space}, miljö ${environment}: ${guides.length} guider från Postgres`);

  // Gör om ALLA texter innan vi skriver något: en tagg som inte stöds stoppar körningen här,
  // inte efter halva migreringen.
  const posts = guides.map((g) => {
    try {
      return { g, body: htmlToRichText(g.body_html, { title: g.title }) };
    } catch (err) {
      throw new Error(`guide ${g.id} (${g.title}): ${err.message}`);
    }
  });

  for (const { g, body } of posts) {
    await upsertEntry({
      id: guideEntryId(g.id),
      contentType: 'guide',
      locale,
      fields: { internalTitle: g.title, body },
      publicera: g.published,
    });
    console.log(`✓ ${g.published ? 'publicerad' : 'utkast    '}  ${guideEntryId(g.id).padEnd(9)} ${g.title}`);
  }

  console.log(`\nKlart: ${posts.length} guider, ${calls.count} anrop till Contentful.`);
} catch (err) {
  console.error(`Migreringen stoppade: ${err.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
