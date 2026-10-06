import type { Guide } from "@utpost/shared";
import { fireEvent, render, screen } from "@testing-library/vue";
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
});
