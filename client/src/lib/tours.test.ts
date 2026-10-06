import { describe, it, expect } from "vitest";
import type { TourLog } from "@utpost/shared";
import { elevationGain } from "./tours";

const log = (elevation_m: number | null, id = 0): TourLog => ({
  id,
  tour_id: 1,
  recorded_at: "2026-09-01T08:00:00.000Z",
  lat: 67.9,
  lon: 18.5,
  elevation_m,
  heart_rate: null,
  note: null,
});

describe("elevationGain", () => {
  it("sums only climbs, not descents", () => {
    expect(elevationGain([log(100), log(150), log(120), log(180)])).toBe(110);
  });
  it("gives 0 for an empty tour", () => {
    expect(elevationGain([])).toBe(0);
  });
  // Regression test: a measurement point without elevation is skipped, not counted as 0
  it("skips measurement points without elevation instead of counting 0", () => {
    expect(elevationGain([log(100), log(null), log(150)])).toBe(50);
  });
});
