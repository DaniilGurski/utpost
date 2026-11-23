<script setup lang="ts">
import { RouterLink } from "vue-router";

export interface GuideCardGuide {
  slug: string;
  title: string;
  region: string;
  difficulty: string;
  lengthKm: number;
  /** #199: ren text, kortad i API:et. null när texten inte gick att hämta ur CMS:et */
  excerpt?: string | null;
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
    <p v-if="props.guide.excerpt">{{ props.guide.excerpt }}</p>
  </div>
</template>
