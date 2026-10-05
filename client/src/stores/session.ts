import type { AuthResponse, User } from "@utpost/shared";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { post } from "../api";
import { fail } from "../lib/result";

export const useSessionStore = defineStore("session", () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);
  const loggedIn = computed(() => user.value !== null);

  const login = async (email: string, password: string) => {
    const body = { email, password };
    const result = await post<AuthResponse>("/auth/login", body);

    if (!result.ok) {
      return fail(result.error);
    }

    token.value = result.value.token;
    user.value = result.value.user;
    return result;
  };

  const register = async (
    email: string,
    password: string,
    displayName: string,
  ) => {
    const body = { email, password, displayName };
    const result = await post<AuthResponse>("/auth/register", body);

    if (!result.ok) {
      return fail(result.error);
    }

    token.value = result.value.token;
    user.value = result.value.user;
    return result;
  };

  const logout = () => {
    token.value = null;
    user.value = null;
  };

  return { user, loggedIn, login, register, logout };
});
