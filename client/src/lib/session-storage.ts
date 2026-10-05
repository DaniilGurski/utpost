import type { User } from "@utpost/shared";

const STORAGE_KEYS = {
  session: {
    user: "utpost.session.user",
  },
} as const;

export const loadUser = () => {
  try {
    const body = localStorage.getItem(STORAGE_KEYS.session.user);

    if (!body) {
      return null;
    }

    return JSON.parse(body) as User;
  } catch {
    return null;
  }
};

export const saveUser = (user: User | null) => {
  try {
    if (user !== null) {
      localStorage.setItem(STORAGE_KEYS.session.user, JSON.stringify(user));
    } else {
      return localStorage.removeItem(STORAGE_KEYS.session.user);
    }
  } catch {}
};
