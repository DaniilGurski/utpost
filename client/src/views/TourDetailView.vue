<script setup lang="ts">
import { computed, ref } from "vue";
import { useQuery } from "@urql/vue";
import type { PhotoUploadRequest, PhotoUploadResponse } from "@utpost/shared";
import { elevationGain } from "../lib/tours";
import { graphql } from "../gql";
import { post } from "../api";

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

// --- Uppladdning (nytt) ---
const uploading = ref(false);
const uploadError = ref("");
const uploaded = ref<{
  filename: string;
  width: number;
  height: number;
  totalMs: number;
  response: PhotoUploadResponse;
} | null>(null);

const onFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  uploading.value = true;
  uploadError.value = "";
  uploaded.value = null;

  // 1. Läs bredd och höjd i webbläsaren. Själva bilden skickas inte.
  let width: number;
  let height: number;
  try {
    const bitmap = await createImageBitmap(file);
    width = bitmap.width;
    height = bitmap.height;
    bitmap.close();
  } catch {
    uploadError.value = "Filen gick inte att läsa som en bild.";
    uploading.value = false;
    input.value = "";
    return;
  }

  // 2. Skicka bara måtten till API:et
  const body: PhotoUploadRequest = {
    tourId: Number(props.id), // id från adressen är en sträng
    filename: file.name,
    width,
    height,
  };
  const start = performance.now();
  const result = await post<PhotoUploadResponse>("/photos", body);
  const totalMs = Math.round(performance.now() - start);

  // 3. Visa svaret, eller ett läsbart fel
  if (!result.ok) {
    uploadError.value =
      result.error.status === 502
        ? "Bildtjänsten svarar inte just nu (502). Försök igen om en stund."
        : result.error.message;
  } else {
    uploaded.value = {
      filename: file.name,
      width,
      height,
      totalMs,
      response: result.value,
    };
  }

  uploading.value = false;
  input.value = ""; // så att samma fil kan väljas igen
};
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

    <h2>Ladda upp bild</h2>
    <input
      type="file"
      accept="image/*"
      :disabled="uploading"
      @change="onFileChange"
    />
    <p v-if="uploading">Bearbetar...</p>
    <p v-if="uploadError">{{ uploadError }}</p>

    <div v-if="uploaded">
      <p>
        {{ uploaded.filename }} · {{ uploaded.width }}x{{ uploaded.height }}
      </p>
      <p>
        Bearbetning: {{ uploaded.response.processingMs }} ms · API:et:
        {{ uploaded.response.apiMs }} ms · Totalt: {{ uploaded.totalMs }} ms
      </p>
      <p v-if="uploaded.response.coldStart">
        Kallstart: funktionen startades från noll
      </p>
      <ul>
        <li v-for="v in uploaded.response.variants" :key="v.size">
          {{ v.size }} px · signatur {{ v.signature }}
        </li>
      </ul>
    </div>

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
