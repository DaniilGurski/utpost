import type { Guide } from "@utpost/shared";
import { cleanup, fireEvent, render, screen } from "@testing-library/vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import GuidesView from "./GuidesView.vue";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

const makeGuide = (title: string, id = 0): Guide => ({
  id,
  title,
  slug: title.split(" ").join("-").toLowerCase(),
  region: "",
  difficulty: "",
  length_km: 10,
  body_html: "",
  hero_image: "",
  published: true,
  author_id: 0,
  updated_at: "",
});

const respondWith = (body: unknown, status = 200) =>
  fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status }));

const renderView = () =>
  render(GuidesView, {
    global: { stubs: { RouterLink: { template: "<a><slot /></a>" } } },
  });

afterEach(() => {
  cleanup();
  fetchMock.mockReset();
});

describe("GuidesView", () => {
  it("filters guides by title when searching", async () => {
    respondWith([
      makeGuide("Kungsleden", 1),
      makeGuide("Sarek", 2),
      makeGuide("Kebnekaise", 3),
    ]);
    renderView();

    await screen.findByText("Sarek");
    await fireEvent.update(screen.getByPlaceholderText("sök guider"), "KUNGS");

    expect(screen.getByText("Kungsleden")).toBeInTheDocument();
    expect(screen.queryByText("Sarek")).not.toBeInTheDocument();
    expect(screen.queryByText("Kebnekaise")).not.toBeInTheDocument();
  });

  it("shows the hit count after a search", async () => {
    respondWith([
      makeGuide("Kungsleden", 1),
      makeGuide("Kungsleden Syd", 2),
      makeGuide("Sarek", 3),
    ]);
    renderView();

    await screen.findByText("3 träffar");
    await fireEvent.update(screen.getByPlaceholderText("sök guider"), "kungs");

    expect(screen.getByText("2 träffar")).toBeInTheDocument();
  });

  it("shows 'Inga träffar' when no guide matches the search", async () => {
    respondWith([makeGuide("Kungsleden", 1)]);
    renderView();

    await screen.findByText("Kungsleden");
    await fireEvent.update(screen.getByPlaceholderText("sök guider"), "zzz");

    expect(screen.getByText("Inga träffar")).toBeInTheDocument();
    expect(screen.queryByText("Kungsleden")).not.toBeInTheDocument();
  });
});
