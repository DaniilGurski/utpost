<script setup lang="ts">
import { computed, ref } from "vue";
import { useQuery } from "@urql/vue";
import GuideCard from "../components/GuideCard.vue";
import NoticeList from "../components/NoticeList.vue";
import { graphql } from "../gql";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const isEditor = computed(() => auth.user?.role === "editor");

// M9: bara redaktionen kan be om utkast. Servern kontrollerar rollen ändå –
// kryssrutan är bekvämlighet, inte skydd.
const preview = ref(false);

const { data, fetching, error } = useQuery({
  query: graphql(`
    query GuidesPage($preview: Boolean!) {
      guides {
        id
        slug
        title
        region
        difficulty
        lengthKm
        bodyHtml
      }
      notices(preview: $preview) {
        id
        title
        level
        status
        guideSlug
        body {
          runs {
            text
            bold
            italic
            href
          }
        }
      }
    }
  `),
  variables: computed(() => ({ preview: preview.value })),
  // Utkast ska alltid vara färska; det publicerade får komma ur cachen.
  requestPolicy: computed(() =>
    preview.value ? "network-only" : "cache-first",
  ),
});

const query = ref("");
const filteredGuides = computed(() =>
  (data.value?.guides ?? []).filter((g) =>
    g.title.toLowerCase().includes(query.value.toLowerCase()),
  ),
);
const filteredGuidesCount = computed(() => filteredGuides.value.length);
</script>

<template>
  <h1>Guides View</h1>

  <label v-if="isEditor">
    <input v-model="preview" type="checkbox" />
    Förhandsgranska: visa utkast
  </label>

  <NoticeList v-if="data" :notices="data.notices" />

  <input v-model="query" type="text" placeholder="sök guider" />

  <div>
    <p v-if="fetching">Laddar...</p>
    <p v-if="error">
      {{ error.message }}
    </p>
  </div>

  <div>
    <p v-if="filteredGuidesCount > 0">{{ filteredGuidesCount }} träffar</p>
    <p v-else>Inga träffar</p>
  </div>

  <ul>
    <li v-for="guide in filteredGuides" :key="guide.id">
      <GuideCard :guide="guide" />
    </li>
  </ul>
</template>

<style></style>
