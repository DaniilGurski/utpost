<script setup>
import { onMounted, ref, computed } from "vue";

const guides = ref([]);
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
  const res = await fetch("http://localhost:4000/api/guides");

  if (!res.ok) {
    error.value = "Ett fel har inträffad. Försök igen!";
    loading.value = false;
    throw new Error("Failed to get guides");
  }

  const data = await res.json();
  guides.value = data;
  loading.value = false;
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
      <span>{{ guide.title }} </span>
    </li>
  </ul>
</template>

<style></style>
