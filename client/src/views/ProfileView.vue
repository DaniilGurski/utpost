<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { storeToRefs } from "pinia";
import { useQuery } from "@urql/vue";
import { graphql } from "../gql";
import { useSessionStore } from "../stores/session";

const { user } = storeToRefs(useSessionStore());

// Schemat kan inte filtrera på användare, så vi hämtar max antal och filtrerar här
const { data, fetching, error } = useQuery({
  query: graphql(`
    query MinaTurer {
      tours(limit: 200) {
        id
        title
        user {
          id
        }
      }
    }
  `),
});

// GraphQL-id är strängar, användaren i sessionen har ett numeriskt id
const myTours = computed(
  () =>
    data.value?.tours.filter(
      (tour) => tour.user.id === String(user.value?.id),
    ) ?? [],
);
</script>

<template>
  <div v-if="user">
    <h1>{{ user.display_name }}</h1>
    <p>{{ user.email }} · {{ user.role }}</p>

    <p v-if="error">{{ error.message }}</p>
    <p v-else-if="fetching || !data">Laddar...</p>

    <template v-else>
      <h2>Mina turer ({{ myTours.length }})</h2>
      <p v-if="myTours.length === 0">Du har inga turer än.</p>
      <ul v-else>
        <li v-for="tour in myTours" :key="tour.id">
          <RouterLink :to="{ name: 'tour', params: { id: tour.id } }">{{
            tour.title
          }}</RouterLink>
        </li>
      </ul>
    </template>
  </div>
</template>

<style></style>
