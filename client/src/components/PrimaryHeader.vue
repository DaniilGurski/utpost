<script setup lang="ts">
import { RouterLink } from "vue-router";
import { useSessionStore } from "../stores/session";
import { storeToRefs } from "pinia";
import { computed } from "vue";

const session = useSessionStore();
const { user, loggedIn } = storeToRefs(session);
const { logout } = session;

const displayName = computed(() => {
  return user.value?.display_name;
});
</script>

<template>
  <header class="primary-header">
    <nav>
      <RouterLink to="/guides"> Guides </RouterLink>
      <RouterLink to="/tours"> Tours </RouterLink>
    </nav>
    <div v-if="loggedIn">
      <RouterLink to="/profile"> {{ displayName }}</RouterLink>
      <button @click="logout()">Logout</button>
    </div>
  </header>
</template>

<style scoped>
.primary-header {
  display: flex;
  justify-content: space-between;
}
</style>
