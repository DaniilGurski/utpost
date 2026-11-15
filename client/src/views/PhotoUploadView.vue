<script setup lang="ts">
import { ref } from "vue";
import { RouterLink } from "vue-router";
import type { PhotoUploadRequest, PhotoUploadResponse } from "@utpost/shared";
import { post } from "../api";

// M8: protected route (meta.requiresAuth). The API behind it, POST /api/photos,
// answers 401 without a token regardless of the guard.
const props = defineProps<{ id: string }>();

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
  <h1>Ladda upp bild</h1>
  <RouterLink :to="{ name: 'tour', params: { id } }"
    >Tillbaka till turen</RouterLink
  >

  <input
    type="file"
    accept="image/*"
    :disabled="uploading"
    @change="onFileChange"
  />
  <p v-if="uploading">Bearbetar...</p>
  <p v-if="uploadError">{{ uploadError }}</p>

  <div v-if="uploaded">
    <p>{{ uploaded.filename }} · {{ uploaded.width }}x{{ uploaded.height }}</p>
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
</template>

<style></style>
