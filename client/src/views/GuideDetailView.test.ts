import { ref, unref } from "vue";
import { cleanup, render, screen } from "@testing-library/vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useQuery } from "@urql/vue";
import GuideDetailView from "./GuideDetailView.vue";

// Bara useQuery byts ut, resten av @urql/vue fungerar som vanligt
vi.mock("@urql/vue", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@urql/vue")>()),
  useQuery: vi.fn(),
}));

const mockedUseQuery = vi.mocked(useQuery);

const guide = {
  title: "Kungsleden",
  region: "Lappland",
  difficulty: "medel",
  lengthKm: 12,
  bodyHtml: "<p>Gå norrut.</p>",
  notices: [] as unknown[],
};

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

const renderView = () =>
  render(GuideDetailView, {
    props: { slug: "kungsleden" },
    global: { stubs: { RouterLink: { template: "<a><slot /></a>" } } },
  });

afterEach(() => {
  cleanup();
  mockedUseQuery.mockReset();
});

describe("GuideDetailView", () => {
  it("queries the guide with the slug from the prop", () => {
    respondWith({ fetching: true });
    renderView();

    const args = mockedUseQuery.mock.calls[0]![0];
    expect(unref(args.variables)).toEqual({ slug: "kungsleden" });
  });

  it("shows title, region, difficulty, length and body for the slug", async () => {
    respondWith({ data: { guide } });
    renderView();

    expect(
      await screen.findByRole("heading", { level: 1, name: "Kungsleden" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Lappland · medel · 12 km")).toBeInTheDocument();
    expect(screen.getByText("Gå norrut.")).toBeInTheDocument();
  });

  it("shows the guide's notices", async () => {
    respondWith({
      data: {
        guide: {
          ...guide,
          notices: [
            {
              id: "n1",
              title: "Bron är borta",
              level: "varning",
              status: "published",
              guideSlug: "kungsleden",
              body: [
                {
                  runs: [
                    { text: "Vada vid", bold: false, italic: false },
                    { text: " Abisko", bold: true, italic: false },
                  ],
                },
              ],
            },
          ],
        },
      },
    });
    renderView();

    expect(
      await screen.findByRole("heading", { name: "Bron är borta" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Abisko").tagName).toBe("STRONG");
  });

  it("shows 'Guiden finns inte.' when the guide is null", async () => {
    respondWith({ data: { guide: null } });
    renderView();

    expect(await screen.findByText("Guiden finns inte.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  });

  it("shows the error message when GraphQL returns an error", async () => {
    respondWith({ error: { message: "Databasen är nere" } });
    renderView();

    expect(await screen.findByText("Databasen är nere")).toBeInTheDocument();
    expect(screen.queryByText("Guiden finns inte.")).not.toBeInTheDocument();
    expect(screen.queryByText("Laddar...")).not.toBeInTheDocument();
  });

  it("shows 'Laddar...' while fetching", async () => {
    respondWith({ fetching: true });
    renderView();

    expect(await screen.findByText("Laddar...")).toBeInTheDocument();
  });
});
