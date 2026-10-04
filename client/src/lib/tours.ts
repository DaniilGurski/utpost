import type { TourLog } from "@utpost/shared";

/**
 * Total climbed metres: the sum of all positive elevation steps between
 * consecutive logs. Steps where either elevation is missing are skipped.
 */
export const elevationGain = (logs: TourLog[]): number => {
  let gain = 0;
  for (let i = 1; i < logs.length; i++) {
    const prev = logs[i - 1].elevation_m;
    const curr = logs[i].elevation_m;
    if (prev !== null && curr !== null && curr > prev) gain += curr - prev;
  }
  return gain;
};
