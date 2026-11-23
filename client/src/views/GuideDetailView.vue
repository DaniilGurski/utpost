<script setup lang="ts">
import { computed } from "vue";
import { useQuery } from "@urql/vue";
import NoticeList from "../components/NoticeList.vue";
import RichText from "../components/RichText.vue";
import { graphql } from "../gql";

const props = defineProps<{ slug: string }>();

const { data, fetching, error } = useQuery({
  query: graphql(`
    query GuideDetails($slug: String!) {
      guide(slug: $slug) {
        title
        region
        difficulty
        lengthKm
        body {
          type
          runs {
            text
            bold
            italic
            href
          }
          items {
            text
            bold
            italic
            href
          }
        }
        notices {
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
    }
  `),
  variables: computed(() => ({ slug: props.slug })),
});

const guide = computed(() => data.value?.guide ?? null);
</script>

<template>
  <p v-if="error">{{ error.message }}</p>
  <p v-else-if="fetching || !data">Laddar...</p>
  <p v-else-if="!guide">Guiden finns inte.</p>

  <div v-else>
    <h1>{{ guide.title }}</h1>
    <p>{{ guide.region }} · {{ guide.difficulty }} · {{ guide.lengthKm }} km</p>
    <NoticeList :notices="guide.notices" />
    <!-- #199: texten kommer ur CMS:et som block, inte HTML. null = saknas eller CMS:et nere -->
    <RichText v-if="guide.body" :blocks="guide.body" />
    <p v-else>Guidens text kunde inte hämtas just nu.</p>
  </div>
</template>

<style></style>
