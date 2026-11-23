import { afterEach, describe, it, expect } from "vitest";
import { cleanup, render, screen } from "@testing-library/vue";
import RichText from "./RichText.vue";

// M9: brödtexten kommer som data. Testet visar vad det ger: märken blir element vi har valt,
// och allt som står i texten förblir text – även om det ser ut som en tagg.
const run = (text: string, extra = {}) => ({
  text,
  bold: false,
  italic: false,
  href: null,
  ...extra,
});

afterEach(() => cleanup());

describe("RichText", () => {
  it("ett stycke per stycke, med fet, kursiv och länk som riktiga element", () => {
    const { container } = render(RichText, {
      props: {
        blocks: [
          {
            type: "PARAGRAPH",
            runs: [
              run("Bron vid "),
              run("Storforsen", { bold: true }),
              run(" lagas. "),
              run("Läs mer", { href: "https://utpost.se/leder", italic: true }),
            ],
          },
          { type: "PARAGRAPH", runs: [run("Räkna med en omväg.")] },
        ],
      },
    });

    expect(container.querySelectorAll("p")).toHaveLength(2);
    expect(screen.getByText("Storforsen").tagName).toBe("STRONG");
    const link = screen.getByRole("link", { name: "Läs mer" });
    expect(link).toHaveAttribute("href", "https://utpost.se/leder");
    expect(link.querySelector("em")).not.toBeNull();
  });

  it("en tagg i texten blir text, inte kod – det finns ingen v-html att smita in genom", () => {
    const { container } = render(RichText, {
      props: {
        blocks: [
          { type: "PARAGRAPH", runs: [run("<img src=x onerror=alert(1)>")] },
        ],
      },
    });

    expect(container.querySelector("img")).toBeNull();
    expect(
      screen.getByText("<img src=x onerror=alert(1)>"),
    ).toBeInTheDocument();
  });

  // #199: guidens text har rubriker och listor. Blocktypen säger vad blocket ÄR, och här
  // bestäms vilket element det blir.
  it("rubriker blir h2/h3 och en lista blir ul med en li per punkt", () => {
    const { container } = render(RichText, {
      props: {
        blocks: [
          { type: "HEADING_2", runs: [run("Vägen dit")] },
          { type: "HEADING_3", runs: [run("Med tåg")] },
          {
            type: "LIST",
            runs: [],
            items: [
              [run("Kartor")],
              [run("Ta med "), run("vatten", { italic: true })],
            ],
          },
        ],
      },
    });

    expect(
      screen.getByRole("heading", { level: 2, name: "Vägen dit" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Med tåg" }),
    ).toBeInTheDocument();
    const items = container.querySelectorAll("ul > li");
    expect(items).toHaveLength(2);
    expect(items[1]).toHaveTextContent("Ta med vatten");
    expect(screen.getByText("vatten").tagName).toBe("EM");
    expect(container.querySelector("p")).toBeNull();
  });
});
