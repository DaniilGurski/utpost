<script setup lang="ts">
import type { TourEnriched } from "@utpost/shared";
import { elevationGain } from "../lib/tours";
import { get } from "../api";
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
  loading.value = true;
  tour.value = null;
  error.value = "";
  const result = await get<TourEnriched>(`/tours/${props.id}`);
  loading.value = false;

  if (!result.ok) {
    error.value =
      result.error.status === 404 ? "Turen finns inte." : result.error.message;
    return;
  }

  tour.value = result.value;
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
