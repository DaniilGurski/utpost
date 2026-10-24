import { ref } from "vue";
import { cleanup, render, screen, within } from "@testing-library/vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useQuery } from "@urql/vue";
import ToursView from "./ToursView.vue";

// gql ska fungera som vanligt, bara useQuery byts ut
vi.mock("@urql/vue", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@urql/vue")>()),
  useQuery: vi.fn(),
}));

const mockedUseQuery = vi.mocked(useQuery);

const makeTour = (title: string, overrides = {}) => ({
  id: "1",
  title,
  distanceM: 12345,
  user: { displayName: "Anna" },
  guide: { title: "Kungsleden" },
  photos: [{ id: "1" }, { id: "2" }, { id: "3" }],
  ...overrides,
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

const renderView = () =>
  render(ToursView, {
    global: { stubs: { RouterLink: { template: "<a><slot /></a>" } } },
  });

afterEach(() => {
  cleanup();
  mockedUseQuery.mockReset();
});

describe("ToursView", () => {
  it("shows tour, user, guide, length and image count in the table when data arrives", async () => {
    respondWith({ data: { tours: [makeTour("Morgontur")] } });
    renderView();

    const row = (await screen.findByText("Morgontur")).closest("tr")!;
    const cells = within(row).getAllByRole("cell");

    expect(cells.map((cell) => cell.textContent?.trim())).toEqual([
      "Morgontur",
      "Anna",
      "Kungsleden",
      "12.3km",
      "3",
    ]);
  });

  it("shows 'Inga turer' when the list is empty", async () => {
    respondWith({ data: { tours: [] } });
    renderView();

    expect(await screen.findByText("Inga turer")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByText("Laddar...")).not.toBeInTheDocument();
  });

  it("shows the error message when GraphQL returns an error", async () => {
    respondWith({ error: { message: "Databasen är nere" } });
    renderView();

    expect(await screen.findByText("Databasen är nere")).toBeInTheDocument();
    expect(screen.queryByText("Laddar...")).not.toBeInTheDocument();
    expect(screen.queryByText("Inga turer")).not.toBeInTheDocument();
  });
});
