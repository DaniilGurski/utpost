import { describe, it, expect } from "vitest";

describe("CI pipeline sanity check", () => {
  it("runs tests correctly", () => {
    expect(1 + 1).toBe(2);
  });
});
