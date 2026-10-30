import type { User } from "@utpost/shared";
import { ref } from "vue";
import { createPinia, setActivePinia } from "pinia";
import { cleanup, render, screen } from "@testing-library/vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useQuery } from "@urql/vue";
import { useSessionStore } from "../stores/session";
import ProfileView from "./ProfileView.vue";

// Bara useQuery byts ut, resten av @urql/vue fungerar som vanligt
vi.mock("@urql/vue", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@urql/vue")>()),
  useQuery: vi.fn(),
}));

const mockedUseQuery = vi.mocked(useQuery);

const user: User = {
  id: 7,
  email: "anna@example.com",
  password_hash: "",
  display_name: "Anna Berg",
  role: "user",
  created_at: "",
};

const makeTour = (id: string, title: string, userId: number) => ({
  id,
  title,
  user: { id: String(userId) },
});

const respondWith = (tours: ReturnType<typeof makeTour>[]) =>
  mockedUseQuery.mockReturnValue({
    data: ref({ tours }),
    fetching: ref(false),
    error: ref(undefined),
  } as unknown as ReturnType<typeof useQuery>);

let pinia: ReturnType<typeof createPinia>;

const renderView = () =>
  render(ProfileView, {
    global: {
      plugins: [pinia],
      stubs: {
        RouterLink: { props: ["to"], template: "<a><slot /></a>" },
      },
    },
  });

beforeEach(() => {
  pinia = createPinia();
  setActivePinia(pinia);
  useSessionStore().user = user;
});

afterEach(() => {
  cleanup();
  mockedUseQuery.mockReset();
  localStorage.clear();
});

describe("ProfileView", () => {
  it("shows the user's name, email and role and only their own tours", async () => {
    respondWith([
      makeTour("1", "Min morgontur", 7),
      makeTour("2", "Någon annans tur", 8),
      makeTour("3", "Min kvällstur", 7),
    ]);
    renderView();

    expect(
      await screen.findByRole("heading", { level: 1, name: "Anna Berg" }),
    ).toBeInTheDocument();
    expect(screen.getByText("anna@example.com · user")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Mina turer (2)" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Min morgontur")).toBeInTheDocument();
    expect(screen.getByText("Min kvällstur")).toBeInTheDocument();
    expect(screen.queryByText("Någon annans tur")).not.toBeInTheDocument();
  });

  it("shows 'Du har inga turer än.' when the user has no tours", async () => {
    respondWith([makeTour("2", "Någon annans tur", 8)]);
    renderView();

    expect(
      await screen.findByText("Du har inga turer än."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });
});
