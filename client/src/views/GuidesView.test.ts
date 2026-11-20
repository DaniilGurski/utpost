import type { User } from "@utpost/shared";
import { ref, unref } from "vue";
import { createPinia, setActivePinia } from "pinia";
import { cleanup, fireEvent, render, screen } from "@testing-library/vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useQuery } from "@urql/vue";
import { useAuthStore } from "../stores/auth";
import GuidesView from "./GuidesView.vue";

// Bara useQuery byts ut, resten av @urql/vue fungerar som vanligt
vi.mock("@urql/vue", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@urql/vue")>()),
  useQuery: vi.fn(),
}));

const mockedUseQuery = vi.mocked(useQuery);

const makeGuide = (title: string, id = 0) => ({
  id: String(id),
  title,
  slug: title.split(" ").join("-").toLowerCase(),
  region: "",
  difficulty: "",
  lengthKm: 10,
  bodyHtml: "",
});

const makeNotice = (title: string, status = "published") => ({
  id: title,
  title,
  level: "info",
  status,
  guideSlug: null,
  body: [{ runs: [{ text: `${title} text`, bold: false, italic: false }] }],
});

const respondWith = (result: {
  data?: unknown;
  fetching?: boolean;
  error?: { message: string };
}) =>
  mockedUseQuery.mockReturnValue({
    data: ref(result.data),
    fetching: ref(result.fetching ?? false),
    error: ref(result.error),
  } as unknown as ReturnType<typeof useQuery>);

const respondWithGuides = (
  guides: ReturnType<typeof makeGuide>[],
  notices: ReturnType<typeof makeNotice>[] = [],
) => respondWith({ data: { guides, notices } });

let pinia: ReturnType<typeof createPinia>;

const loginAs = (role: string) => {
  const user: User = {
    id: 1,
    email: "a@example.com",
    display_name: "A",
    role,
    created_at: "",
  };
  useAuthStore().user = user;
};

const renderView = () =>
  render(GuidesView, {
    global: {
      plugins: [pinia],
      stubs: { RouterLink: { template: "<a><slot /></a>" } },
    },
  });

const lastArgs = () => mockedUseQuery.mock.calls.at(-1)![0];

beforeEach(() => {
  pinia = createPinia();
  setActivePinia(pinia);
});

afterEach(() => {
  cleanup();
  mockedUseQuery.mockReset();
});

describe("GuidesView", () => {
  it("filters guides by title when searching", async () => {
    respondWithGuides([
      makeGuide("Kungsleden", 1),
      makeGuide("Sarek", 2),
      makeGuide("Kebnekaise", 3),
    ]);
    renderView();

    await screen.findByText("Sarek");
    await fireEvent.update(screen.getByPlaceholderText("sök guider"), "KUNGS");

    expect(screen.getByText("Kungsleden")).toBeInTheDocument();
    expect(screen.queryByText("Sarek")).not.toBeInTheDocument();
    expect(screen.queryByText("Kebnekaise")).not.toBeInTheDocument();
  });

  it("shows the hit count after a search", async () => {
    respondWithGuides([
      makeGuide("Kungsleden", 1),
      makeGuide("Kungsleden Syd", 2),
      makeGuide("Sarek", 3),
    ]);
    renderView();

    await screen.findByText("3 träffar");
    await fireEvent.update(screen.getByPlaceholderText("sök guider"), "kungs");

    expect(screen.getByText("2 träffar")).toBeInTheDocument();
  });

  it("shows 'Inga träffar' when no guide matches the search", async () => {
    respondWithGuides([makeGuide("Kungsleden", 1)]);
    renderView();

    await screen.findByText("Kungsleden");
    await fireEvent.update(screen.getByPlaceholderText("sök guider"), "zzz");

    expect(screen.getByText("Inga träffar")).toBeInTheDocument();
    expect(screen.queryByText("Kungsleden")).not.toBeInTheDocument();
  });

  it("shows the error message when GraphQL returns an error", async () => {
    respondWith({ error: { message: "Databasen är nere" } });
    renderView();

    expect(await screen.findByText("Databasen är nere")).toBeInTheDocument();
    expect(screen.queryByText("Laddar...")).not.toBeInTheDocument();
  });

  it("shows the notices from the query", async () => {
    respondWithGuides([], [makeNotice("Stängd stuga")]);
    renderView();

    expect(
      await screen.findByRole("heading", { name: "Stängd stuga" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Stängd stuga text")).toBeInTheDocument();
  });

  it("asks for published notices from the cache by default", () => {
    respondWithGuides([]);
    renderView();

    expect(unref(lastArgs().variables)).toEqual({ preview: false });
    expect(unref(lastArgs().requestPolicy)).toBe("cache-first");
  });

  it("hides the preview checkbox from members", () => {
    loginAs("user");
    respondWithGuides([]);
    renderView();

    expect(
      screen.queryByLabelText("Förhandsgranska: visa utkast"),
    ).not.toBeInTheDocument();
  });

  it("lets an editor ask for drafts over the network", async () => {
    loginAs("editor");
    respondWithGuides([]);
    renderView();

    await fireEvent.click(
      screen.getByLabelText("Förhandsgranska: visa utkast"),
    );

    expect(unref(lastArgs().variables)).toEqual({ preview: true });
    expect(unref(lastArgs().requestPolicy)).toBe("network-only");
  });
});
