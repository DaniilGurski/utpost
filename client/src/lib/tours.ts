import type { TourLog } from "@utpost/shared";

export const elevationGain = (logs: TourLog[]): number => {
  let gain = 0;
  let previous: number | null = null;

  for (const log of logs) {
    const current = log.elevation_m;

    if (current === null) continue;

    if (previous !== null && current > previous) {
      gain += current - previous;
    }

    previous = current;
  }

  return gain;
};
