<script setup lang="ts">
import type { TourEnriched } from "@utpost/shared";
import { elevationGain } from "../lib/tours";
import { watch, ref, computed } from "vue";

const props = defineProps<{ id: string }>();

const tour = ref<TourEnriched | null>(null);
const loading = ref(false);
const error = ref("");

const climb = computed(() => {
  if (!tour.value) return;
  return elevationGain(tour.value.logs);
});

/*
TODO: Should use `tour` as a prop instead of fetching it.
This mirrors the original React component `TourDetail` for M1
*/
const load = async () => {
  try {
    loading.value = true;
    tour.value = null;
    error.value = "";
    const res = await fetch(`http://localhost:4000/api/tours/${props.id}`);

    if (!res.ok) {
      throw new Error("Ett fel har inträffad. Försök igen!");
    }

    const data = await res.json();
    tour.value = data;
  } catch (err) {
    if (err instanceof Error) {
      error.value = err.message;
      console.log(err);
    }
  } finally {
    loading.value = false;
  }
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
