import type { Photo, TourEnriched, User, Guide } from "@utpost/shared";
import { cleanup, render, screen, within } from "@testing-library/vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import ToursView from "./ToursView.vue";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

const makeTour = (
  title: string,
  overrides: Partial<TourEnriched> = {},
): TourEnriched => ({
  id: 1,
  user_id: 1,
  guide_id: 1,
  title,
  started_at: "",
  distance_m: 12345,
  notes: null,
  user: { id: 1, display_name: "Anna" } as User,
  guide: { id: 1, title: "Kungsleden" } as Guide,
  photos: [{ id: 1 }, { id: 2 }, { id: 3 }] as Photo[],
  logs: [],
  ...overrides,
});

const respondWith = (body: unknown, status = 200) =>
  fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status }));

const renderView = () =>
  render(ToursView, {
    global: { stubs: { RouterLink: { template: "<a><slot /></a>" } } },
  });

afterEach(() => {
  cleanup();
  fetchMock.mockReset();
});

describe("ToursView", () => {
  it("shows tour, user, guide, length and image count in the table when data arrives", async () => {
    respondWith([makeTour("Morgontur")]);
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
});
