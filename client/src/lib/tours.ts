import type { TourLog } from "@utpost/shared";

export const elevationGain = (
  logs: { elevationM: number | null }[],
): number => {
  let gain = 0;
  let previous: number | null = null;

  for (const log of logs) {
    const current = log.elevationM;

    if (current === null) continue;

    if (previous !== null && current > previous) {
      gain += current - previous;
    }

    previous = current;
  }

  return gain;
};
