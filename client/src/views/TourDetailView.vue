<script setup>
import { watch, ref, computed } from "vue";

const props = defineProps({
  id: String,
});

const tour = ref(null);
const loading = ref(false);
const error = ref("");

const climb = computed(() => {
  if (!tour.value) return;

  return tour.value?.logs.reduce((sum, log, i) => {
    if (i === 0) return 0;
    const diff = log.elevation_m - tour.value.logs[i - 1].elevation_m;
    return diff > 0 ? sum + diff : sum;
  }, 0);
});

/*
TODO: Should use `tour` as a prop instead of fetching it.
This mirrors the original React component `TourDetail` for M1
*/
const load = async () => {
  loading.value = true;
  const res = await fetch(`http://localhost:4000/api/tours/${props.id}`);

  if (!res.ok) {
    error.value = "Ett fel har inträffad. Försök igen!";
    loading.value = false;
    throw new Error("Failed to get tours");
  }

  const data = await res.json();
  tour.value = data;
  loading.value = false;
};

watch(() => props.id, load, { immediate: true });
</script>

<template>
  <div>
    <p v-if="loading">Laddar...</p>
    <p v-if="error">
      {{ error }}
    </p>
  </div>

  <div v-if="tour">
    <h1>{{ tour.title }}</h1>
    <p>
      {{
        `${Math.round(tour.distance_m / 100) / 10} km · ${tour.logs.length} mätpunkter · ${climb} höjdmeter`
      }}
    </p>
    <p v-if="tour.notes">{{ tour.notes }}</p>

    <h2>Mätpunkter</h2>
    <ol>
      <li v-for="log in tour.logs" :key="log.id">
        {{
          `${new Date(log.recorded_at).toLocaleTimeString("sv-SE")} · ${log.elevation_m} m · ${log.heart_rate} slag/min`
        }}
      </li>
    </ol>
  </div>
</template>

<style></style>
