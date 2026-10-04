<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import type { Guide } from "@utpost/shared";
import GuideCard from "../components/GuideCard.vue";
import { get } from "../api";

const guides = ref<Guide[]>([]);
const query = ref("");
const filteredGuides = computed(() => {
  return guides.value.filter((g) =>
    g.title.toLowerCase().includes(query.value.toLowerCase()),
  );
});

const loading = ref(true);
const error = ref("");

const filteredGuidesCount = computed(() => {
  return filteredGuides.value.length;
});

onMounted(async () => {
  loading.value = true;
  const result = await get<Guide[]>("/guides");
  loading.value = false;

  if (!result.ok) {
    error.value = result.error.message;
    return;
  }

  guides.value = result.value;
});
</script>

<template>
  <h1>Guides View</h1>
  <input v-model="query" type="text" placeholder="sök guider" />

  <div>
    <p v-if="loading">Laddar...</p>
    <p v-if="error">
      {{ error }}
    </p>
  </div>

  <div>
    <p v-if="filteredGuidesCount > 0">{{ filteredGuidesCount }} träffar</p>
    <p v-else>Inga träffar</p>
  </div>

  <ul>
    <li v-for="guide in filteredGuides" :key="guide.id">
      <GuideCard :guide="guide" />
    </li>
  </ul>
</template>

<style></style>
