<script setup lang="ts">
import { ref } from "vue";
import { useSessionStore } from "../stores/session";
import { useRouter } from "vue-router";

const { login } = useSessionStore();
const router = useRouter();

const email = ref("");
const password = ref("");
const error = ref("");

const onSubmit = async () => {
  error.value = "";
  const result = await login(email.value, password.value);

  if (!result.ok) {
    error.value = result.error.message;
    return;
  }

  router.push("/guides");
};
</script>

<template>
  <form @submit.prevent="onSubmit">
    <label>
      Email
      <input v-model="email" type="text" />
    </label>
    <label>
      Password
      <input v-model="password" type="password" />
    </label>

    <button type="submit">Login</button>
    <p v-if="error">{{ error }}</p>
  </form>
</template>
