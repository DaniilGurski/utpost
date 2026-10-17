<script setup lang="ts">
import { ref, onMounted } from "vue";
import { gql } from "../graphql";

type ToursData = {
  tours: {
    id: string;
    title: string;
    distanceM: number;
    user: { displayName: string };
    guide: { title: string } | null;
    photos: { id: string }[];
  }[];
};

const QUERY = /* GraphQL */ `
  query Turer {
    tours(limit: 50) {
      id
      title
      distanceM
      user {
        displayName
      }
      guide {
        title
      }
      photos {
        id
      }
    }
  }
`;

const tours = ref<ToursData["tours"]>([]);
const loading = ref(true);
const error = ref("");

onMounted(async () => {
  try {
    const data = await gql<ToursData>(QUERY);
    tours.value = data.tours;
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Något gick fel";
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
        <td>{{ tour.user.displayName }}</td>
        <td>{{ tour.guide ? tour.guide.title : "-" }}</td>
        <td>{{ Math.round(tour.distanceM / 100) / 10 }}km</td>
        <td>{{ tour.photos.length }}</td>
      </tr>
    </tbody>
  </table>

  <p v-else-if="!loading && !error">Inga turer</p>
</template>

<style></style>
