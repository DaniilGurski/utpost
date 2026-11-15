import type { ApiError } from "@utpost/shared";
import { success, fail, type Result } from "./lib/result";
import { getToken } from "./lib/token";

export const API_URL = "/api";

const NETWORK_ERROR = "Kunde inte nå servern. Försök igen!";
const GENERIC_ERROR = "Ett fel har inträffat. Försök igen!";

// M8: the token goes with every request when we have one. The protection lives
// in the API (401 without a valid token); the client only sends the proof.
const headers = (extra: Record<string, string> = {}) => {
  const token = getToken();
  return { ...extra, ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

// The API sends failures as { error: "message" } (see lib/result.ts)
const errorMessage = (body: unknown) =>
  typeof body === "object" &&
  body !== null &&
  "error" in body &&
  typeof body.error === "string"
    ? body.error
    : GENERIC_ERROR;

const request = async <T>(
  path: string,
  init?: RequestInit,
): Promise<Result<T, ApiError>> => {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, init);
  } catch {
    return fail({ message: NETWORK_ERROR, status: null });
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    // Body wasn't JSON, e.g. an HTML error page
    return fail({ message: GENERIC_ERROR, status: res.status });
  }

  if (!res.ok) {
    return fail({ message: errorMessage(body), status: res.status });
  }

  // Unchecked cast: we trust the server to send a T (no runtime validation yet)
  return success(body as T);
};

export const get = <T>(path: string): Promise<Result<T, ApiError>> =>
  request<T>(path, { headers: headers() });

export const post = <T>(
  path: string,
  body: unknown,
): Promise<Result<T, ApiError>> =>
  request<T>(path, {
    method: "POST",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
