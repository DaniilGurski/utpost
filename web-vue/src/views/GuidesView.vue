<script setup>
import { onMounted, ref, computed } from "vue";

const guides = ref([]);
const query = ref("");
const filteredGuides = computed(() => {
  return guides.value.filter((g) => {
    if (g.title.toLowerCase().includes(query.value.toLowerCase())) {
      return g;
    }
  });
});
const loading = ref(true);
const error = ref("");

const filteredGuidesCount = computed(() => {
  return filteredGuides.value.length;
});

const totalGuidesCount = computed(() => {
  return guides.value.length;
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
  <input type="text" placeholder="sök guider" v-model="query" />

  <div>
    <span v-if="filteredGuidesCount > 0">
      {{ filteredGuidesCount }} av {{ totalGuidesCount }} träffar
    </span>
    <span v-else>Inga träffar</span>
  </div>

  <p v-if="loading">Laddar...</p>
  <p v-if="error">{{ error }}</p>

  <ul>
    <li v-for="guide in filteredGuides" v-key="guide.id">
      <span>{{ guide.title }} </span>
    </li>
  </ul>
</template>

<style></style>
