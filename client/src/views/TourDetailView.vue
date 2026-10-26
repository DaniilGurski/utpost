<script setup lang="ts">
import { elevationGain } from "../lib/tours";
import { computed } from "vue";
import { useQuery } from "@urql/vue";
import { graphql } from "../gql";

const props = defineProps<{ id: string }>();

const { data, fetching, error } = useQuery({
  query: graphql(`
    query TourDetails($id: ID!) {
      tour(id: $id) {
        title
        distanceM
        notes
        logs {
          recordedAt
          elevationM
          heartRate
        }
      }
    }
  `),
  variables: computed(() => ({ id: props.id })),
});

const tour = computed(() => data.value?.tour ?? null);
const climb = computed(() => {
  if (!tour.value) return;
  return elevationGain(
    tour.value.logs.map((log) => ({ elevationM: log.elevationM })),
  );
});
</script>

<template>
  <p v-if="error">{{ error.message }}</p>
  <p v-else-if="fetching || !data">Laddar...</p>
  <p v-else-if="!tour">Turen finns inte.</p>

  <div v-else>
    <h1>{{ tour.title }}</h1>
    <p>
      {{
        `${Math.round(tour.distanceM / 100) / 10} km · ${tour.logs.length} mätpunkter · ${climb} höjdmeter`
      }}
    </p>
    <p v-if="tour.notes">{{ tour.notes }}</p>

    <h2>Mätpunkter</h2>
    <ol>
      <li v-for="(log, i) in tour.logs" :key="i">
        {{
          `${new Date(log.recordedAt).toLocaleTimeString("sv-SE")} · ${log.elevationM} m · ${log.heartRate} slag/min`
        }}
      </li>
    </ol>
  </div>
</template>

<style></style>
