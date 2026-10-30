<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { Guide } from "@utpost/shared";
import { get } from "../api";

const props = defineProps<{ slug: string }>();

const guide = ref<Guide | null>(null);
const loading = ref(true);
const notFound = ref(false);
const error = ref("");

onMounted(async () => {
  const result = await get<Guide>(`/guides/${props.slug}`);
  loading.value = false;

  if (!result.ok) {
    if (result.error.status === 404) notFound.value = true;
    else error.value = result.error.message;
    return;
  }

  guide.value = result.value;
});
</script>

<template>
  <p v-if="error">{{ error }}</p>
  <p v-else-if="loading">Laddar...</p>
  <p v-else-if="notFound || !guide">Guiden finns inte.</p>

  <div v-else>
    <h1>{{ guide.title }}</h1>
    <p>
      {{ guide.region }} · {{ guide.difficulty }} · {{ guide.length_km }} km
    </p>
    <!-- Guidetexten skrivs av redaktionen och litas på, så den saneras inte -->
    <div v-html="guide.body_html"></div>
  </div>
</template>

<style></style>
