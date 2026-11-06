import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import { photosRouter } from "./photos.js";
import { pool } from "../db/client.js";
import { config } from "../config.js";

vi.mock("../db/client.js", () => ({ pool: { query: vi.fn() } }));
vi.mock("../config.js", () => ({
  config: {
    imageFunctionUrl: "http://function.test/api/process-image",
    imageFunctionKey: "",
  },
}));

// Testet anropar routern med riktig fetch, medan routerns anrop till funktionen går till en mock.
const realFetch = globalThis.fetch;
const functionFetch = vi.fn();

const row = { id: 7, tour_id: 1, filename: "fjall.jpg", width: 4000, height: 3000 };
const functionResponse = {
  variants: [{ size: 1600, signature: "abc" }],
  processingMs: 12,
  coldStart: true,
  instance: "lokal",
  node: "v22",
};

let server;
let baseUrl;

const upload = async () => {
  const res = await realFetch(`${baseUrl}/api/photos`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ tourId: 1, filename: "fjall.jpg", width: 4000, height: 3000 }),
  });
  return { status: res.status, body: await res.json() };
};

beforeAll(async () => {
  vi.stubGlobal("fetch", functionFetch);
  const app = express();
  app.use(express.json());
  app.use("/api/photos", photosRouter);
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  baseUrl = `http://localhost:${server.address().port}`;
});

afterAll(async () => {
  vi.unstubAllGlobals();
  await new Promise((resolve) => server.close(resolve));
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  config.imageFunctionKey = "";
  pool.query.mockResolvedValue({ rows: [row] });
  functionFetch.mockResolvedValue(Response.json(functionResponse));
});

describe("POST /api/photos", () => {
  it("saves the row, then passes the function's result on with apiMs", async () => {
    const { status, body } = await upload();

    expect(status).toBe(200);
    expect(pool.query.mock.invocationCallOrder[0]).toBeLessThan(
      functionFetch.mock.invocationCallOrder[0],
    );
    expect(body).toMatchObject({
      ...row,
      variants: functionResponse.variants,
      processingMs: 12,
      coldStart: true,
      instance: "lokal",
    });
    expect(body.apiMs).toEqual(expect.any(Number));
  });

  it("sends only the image's name and dimensions to the configured URL", async () => {
    await upload();

    const [url, init] = functionFetch.mock.calls[0];
    expect(url).toBe(config.imageFunctionUrl);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({
      filename: "fjall.jpg",
      width: 4000,
      height: 3000,
    });
  });

  it("leaves out x-functions-key when no key is configured", async () => {
    await upload();

    expect(functionFetch.mock.calls[0][1].headers).not.toHaveProperty("x-functions-key");
  });

  it("sends x-functions-key when a key is configured", async () => {
    config.imageFunctionKey = "test-key";

    await upload();

    expect(functionFetch.mock.calls[0][1].headers["x-functions-key"]).toBe("test-key");
  });

  it("responds 502 when the function cannot be reached", async () => {
    functionFetch.mockRejectedValue(new TypeError("fetch failed"));

    const { status, body } = await upload();

    expect(status).toBe(502);
    expect(body).toEqual({ error: "bildfunktionen svarar inte" });
  });

  it("responds 502 when the function answers with an error", async () => {
    functionFetch.mockResolvedValue(new Response("nej", { status: 401 }));

    const { status } = await upload();

    expect(status).toBe(502);
  });

  it("responds 502 when the function's response is not JSON", async () => {
    functionFetch.mockResolvedValue(new Response("<html>", { status: 200 }));

    const { status } = await upload();

    expect(status).toBe(502);
  });
});
