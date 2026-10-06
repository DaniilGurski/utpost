import type { TourEnriched, TourLog } from "@utpost/shared";
import { cleanup, render, screen } from "@testing-library/vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import TourDetailView from "./TourDetailView.vue";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

const makeLog = (id: number, elevation_m: number | null): TourLog => ({
  id,
  tour_id: 1,
  recorded_at: "2026-01-01T10:00:00Z",
  lat: 0,
  lon: 0,
  elevation_m,
  heart_rate: 120,
  note: null,
});

const makeTour = (logs: TourLog[]): TourEnriched =>
  ({
    id: 1,
    title: "Morgontur",
    distance_m: 12345,
    notes: null,
    logs,
  }) as TourEnriched;

const respondWith = (body: unknown, status = 200) =>
  fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status }));

const renderView = () => render(TourDetailView, { props: { id: "1" } });

afterEach(() => {
  cleanup();
  fetchMock.mockReset();
});

describe("TourDetailView", () => {
  it("shows length, number of measurement points and elevation gain", async () => {
    // Gain is 50 + 80 = 130; the drop from 150 to 120 must not count
    respondWith(
      makeTour([
        makeLog(1, 100),
        makeLog(2, 150),
        makeLog(3, 120),
        makeLog(4, 200),
      ]),
    );
    renderView();

    expect(
      await screen.findByText("12.3 km · 4 mätpunkter · 130 höjdmeter"),
    ).toBeInTheDocument();
  });
});
