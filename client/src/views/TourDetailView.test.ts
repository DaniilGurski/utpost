import { ref, unref } from "vue";
import { cleanup, render, screen } from "@testing-library/vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useQuery } from "@urql/vue";
import TourDetailView from "./TourDetailView.vue";

// Bara useQuery byts ut, resten av @urql/vue fungerar som vanligt
vi.mock("@urql/vue", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@urql/vue")>()),
  useQuery: vi.fn(),
}));

const mockedUseQuery = vi.mocked(useQuery);

const makeLog = (elevationM: number | null) => ({
  recordedAt: "2026-01-01T10:00:00Z",
  elevationM,
  heartRate: 120,
});

const makeTour = (logs: ReturnType<typeof makeLog>[]) => ({
  title: "Morgontur",
  distanceM: 12345,
  notes: null,
  logs,
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

const renderView = () => render(TourDetailView, { props: { id: "1" } });

afterEach(() => {
  cleanup();
  mockedUseQuery.mockReset();
});

describe("TourDetailView", () => {
  it("queries the tour with the id from the prop", () => {
    respondWith({ fetching: true });
    renderView();

    const args = mockedUseQuery.mock.calls[0]![0];
    expect(unref(args.variables)).toEqual({ id: "1" });
  });

  it("shows length, number of measurement points and elevation gain", async () => {
    // Gain is 50 + 80 = 130; the drop from 150 to 120 must not count
    respondWith({
      data: {
        tour: makeTour([
          makeLog(100),
          makeLog(150),
          makeLog(120),
          makeLog(200),
        ]),
      },
    });
    renderView();

    expect(
      await screen.findByRole("heading", { level: 1, name: "Morgontur" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("12.3 km · 4 mätpunkter · 130 höjdmeter"),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
  });

  it("shows 'Laddar...' while fetching", async () => {
    respondWith({ fetching: true });
    renderView();

    expect(await screen.findByText("Laddar...")).toBeInTheDocument();
    expect(screen.queryByText("Turen finns inte.")).not.toBeInTheDocument();
  });

  it("shows 'Turen finns inte.' when the tour is null", async () => {
    respondWith({ data: { tour: null } });
    renderView();

    expect(await screen.findByText("Turen finns inte.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  });

  it("shows the error message when GraphQL returns an error", async () => {
    respondWith({ error: { message: "Databasen är nere" } });
    renderView();

    expect(await screen.findByText("Databasen är nere")).toBeInTheDocument();
    expect(screen.queryByText("Laddar...")).not.toBeInTheDocument();
    expect(screen.queryByText("Turen finns inte.")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  });
});
