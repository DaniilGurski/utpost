import type { Guide } from "@utpost/shared";
import { cleanup, render, screen } from "@testing-library/vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import GuideDetailView from "./GuideDetailView.vue";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

const guide: Guide = {
  id: 1,
  title: "Kungsleden",
  slug: "kungsleden",
  region: "Lappland",
  difficulty: "medel",
  length_km: 12,
  body_html: "<p>Gå norrut.</p>",
  hero_image: "",
  published: true,
  author_id: 0,
  updated_at: "",
};

const respondWith = (body: unknown, status = 200) =>
  fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status }));

const renderView = () =>
  render(GuideDetailView, { props: { slug: "kungsleden" } });

afterEach(() => {
  cleanup();
  fetchMock.mockReset();
});

describe("GuideDetailView", () => {
  it("shows title, region, difficulty, length and body for the slug", async () => {
    respondWith(guide);
    renderView();

    expect(
      await screen.findByRole("heading", { level: 1, name: "Kungsleden" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Lappland · medel · 12 km")).toBeInTheDocument();
    expect(screen.getByText("Gå norrut.")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/guides/kungsleden", undefined);
  });

  it("shows 'Guiden finns inte.' when the API returns 404", async () => {
    respondWith({ error: "hittades inte" }, 404);
    renderView();

    expect(await screen.findByText("Guiden finns inte.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  });

  it("shows the error message for other errors", async () => {
    respondWith({ message: "Databasen är nere" }, 500);
    renderView();

    expect(await screen.findByText("Databasen är nere")).toBeInTheDocument();
    expect(screen.queryByText("Guiden finns inte.")).not.toBeInTheDocument();
    expect(screen.queryByText("Laddar...")).not.toBeInTheDocument();
  });

  it("shows 'Laddar...' while fetching", async () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    renderView();

    expect(await screen.findByText("Laddar...")).toBeInTheDocument();
  });
});
