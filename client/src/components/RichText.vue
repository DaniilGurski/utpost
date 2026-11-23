<script setup lang="ts">
import { h, type FunctionalComponent, type VNode } from "vue";
import type { Block, TextRun } from "../lib/notices";

// M9: rich text som data. Servern skickar block av textbitar – inte en HTML-sträng. Varje block
// och varje bit blir ett element som VI har valt (p, h2, h3, ul/li, em, strong, a), och texten
// sätts in som text. Det finns ingen v-html här, alltså inget ställe där en tagg i innehållet kan
// bli kod (skuld 10, och H7 i M8). #199: guidens text går samma väg som notiserna.
defineProps<{ blocks: Block[] }>();

// En textbit kan vara kursiv, fet och länk på samma gång: elementen läggs utanpå varandra.
const Run: FunctionalComponent<{ run: TextRun }> = ({ run }) => {
  let node: string | VNode = run.text;
  if (run.italic) node = h("em", [node]);
  if (run.bold) node = h("strong", [node]);
  if (run.href) node = h("a", { href: run.href }, [node]);
  return node;
};
Run.props = ["run"];
</script>

<template>
  <template v-for="(block, i) in blocks" :key="i">
    <h2 v-if="block.type === 'HEADING_2'">
      <Run v-for="(run, j) in block.runs" :key="j" :run="run" />
    </h2>
    <h3 v-else-if="block.type === 'HEADING_3'">
      <Run v-for="(run, j) in block.runs" :key="j" :run="run" />
    </h3>
    <ul v-else-if="block.type === 'LIST'">
      <li v-for="(item, j) in block.items ?? []" :key="j">
        <Run v-for="(run, k) in item" :key="k" :run="run" />
      </li>
    </ul>
    <!-- PARAGRAPH, och en okänd typ blir hellre ett stycke än försvinner -->
    <p v-else>
      <Run v-for="(run, j) in block.runs" :key="j" :run="run" />
    </p>
  </template>
</template>
