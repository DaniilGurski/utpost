<script setup lang="ts">
import { RouterLink, useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const handleLogout = () => {
  auth.logout();

  // Leave a protected view, the data on it is no longer ours to show
  if (route.meta.requiresAuth) {
    router.push({ name: "guides" });
  }
};
</script>

<template>
  <header class="primary-header">
    <nav>
      <RouterLink to="/guides"> Guides </RouterLink>
      <RouterLink to="/tours"> Tours </RouterLink>
    </nav>
    <div v-if="auth.user">
      <RouterLink to="/profile"> {{ auth.user.display_name }}</RouterLink>
      <button type="button" @click="handleLogout">Logga ut</button>
    </div>
    <RouterLink
      v-else
      :to="{ name: 'login', query: { redirect: route.fullPath } }"
    >
      Logga in
    </RouterLink>
  </header>
</template>

<style scoped>
.primary-header {
  display: flex;
  justify-content: space-between;
}
</style>
