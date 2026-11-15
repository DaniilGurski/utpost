<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const email = ref("");
const password = ref("");
const error = ref("");
const busy = ref(false);

// After login: back to where the user was going (?redirect=/tour/1/upload), else the start page.
// Only relative paths: a "redirect" pointing at another site is ignored (open redirect).
const next = () => {
  const redirect = route.query.redirect;
  return typeof redirect === "string" &&
    redirect.startsWith("/") &&
    !redirect.startsWith("//")
    ? redirect
    : "/";
};

const onSubmit = async () => {
  error.value = "";
  busy.value = true;
  const result = await auth.login(email.value, password.value);
  busy.value = false;

  if (!result.ok) {
    error.value = result.error.message;
    return;
  }

  router.push(next());
};
</script>

<template>
  <div class="login">
    <h1>Logga in</h1>
    <form @submit.prevent="onSubmit">
      <label>
        E-post
        <input v-model="email" type="email" autocomplete="username" required />
      </label>
      <label>
        Lösenord
        <input
          v-model="password"
          type="password"
          autocomplete="current-password"
          required
        />
      </label>
      <p v-if="error" role="alert">{{ error }}</p>
      <button type="submit" :disabled="busy">Logga in</button>
    </form>
  </div>
</template>

<style scoped>
.login {
  max-width: 360px;
}
label {
  display: block;
  margin: 12px 0;
}
input {
  display: block;
  width: 100%;
  padding: 8px;
  margin-top: 4px;
}
</style>
