<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { TourEnriched } from "@utpost/shared";

const tours = ref<TourEnriched[]>([]);
const loading = ref(false);
const error = ref("");

onMounted(async () => {
  try {
    loading.value = true;
    const res = await fetch(`http://localhost:4000/api/tours`);

    if (!res.ok) {
      throw new Error("Ett fel har inträffad. Försök igen!");
    }

    const data = await res.json();
    tours.value = data;
  } catch (err) {
    if (err instanceof Error) {
      error.value = err.message;
      console.log(err);
    }
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <h1>Turer</h1>

  <div>
    <p v-if="loading">Laddar...</p>
    <p v-if="error">
      {{ error }}
    </p>
  </div>

  <table v-if="tours.length > 0">
    <thead>
      <tr>
        <th>Tur</th>
        <th>Av</th>
        <th>Guide</th>
        <th>Längd</th>
        <th>Bilder</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="tour in tours" :key="tour.id">
        <td>
          <RouterLink :to="{ name: 'tour', params: { id: tour.id } }">
            {{ tour.title }}
          </RouterLink>
        </td>
        <td>{{ tour.user ? tour.user.display_name : "-" }}</td>
        <td>{{ tour.guide ? tour.guide.title : "-" }}</td>
        <td>{{ Math.round(tour.distance_m / 100) / 10 }}km</td>
        <td>{{ tour.photos?.length }}</td>
      </tr>
    </tbody>
  </table>

  <p v-else-if="!loading && !error">Inga turer</p>
</template>

<style></style>
