import type { AuthResponse, User } from "@utpost/shared";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { post } from "../api";
import { getToken, setToken } from "../lib/token";

// M8: the store knows who is logged in. The token itself lives in lib/token.ts
// and only goes to api.ts. Nothing here touches localStorage.
export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const isLoggedIn = computed(() => user.value !== null && getToken() !== null);

  // Wrong credentials: the API answers 401 and the Result is a failure,
  // which we hand back to the view. No token is stored.
  const login = async (email: string, password: string) => {
    const result = await post<AuthResponse>("/auth/login", {
      email,
      password,
    });

    if (result.ok) {
      setToken(result.value.token);
      user.value = result.value.user;
    }

    return result;
  };

  const logout = () => {
    setToken(null);
    user.value = null;
  };

  return { user, isLoggedIn, login, logout };
});
