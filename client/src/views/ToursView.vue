<script setup lang="ts">
import { gql, useQuery } from "@urql/vue";

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

const { data, fetching, error } = useQuery<ToursData>({
  query: gql`
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
  `,
});
</script>

<template>
  <h1>Turer</h1>

  <p v-if="error">{{ error.message }}</p>
  <p v-else-if="fetching || !data">Laddar...</p>

  <table v-else-if="data.tours.length > 0">
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
      <tr v-for="tour in data.tours" :key="tour.id">
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

  <p v-else>Inga turer</p>
</template>

<style></style>
