<script setup lang="ts">
import { RouterLink } from "vue-router";

export interface GuideCardGuide {
  slug: string;
  title: string;
  region: string;
  difficulty: string;
  lengthKm: number;
  bodyHtml: string;
}

const props = defineProps<{ guide: GuideCardGuide }>();
</script>

<template>
  <div>
    <h3>
      <RouterLink :to="{ name: 'guide', params: { slug: props.guide.slug } }">{{
        props.guide.title
      }}</RouterLink>
    </h3>
    <p>
      {{ props.guide.region }} · {{ props.guide.difficulty }} ·
      {{ props.guide.lengthKm }} km
    </p>
    <div v-html="props.guide.bodyHtml.slice(0, 180)"></div>
  </div>
</template>
