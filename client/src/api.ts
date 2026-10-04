import type { ApiError } from "@utpost/shared";
import { success, fail, type Result } from "./lib/result";

export const API_URL = "http://localhost:4000/api";

const NETWORK_ERROR = "Kunde inte nå servern. Försök igen!";
const GENERIC_ERROR = "Ett fel har inträffat. Försök igen!";

const isApiError = (body: unknown): body is ApiError =>
  typeof body === "object" &&
  body !== null &&
  "message" in body &&
  typeof body.message === "string";

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
    const message = isApiError(body) ? body.message : GENERIC_ERROR;
    return fail({ message: message, status: res.status });
  }

  // Unchecked cast: we trust the server to send a T (no runtime validation yet)
  return success(body as T);
};

export const get = <T>(path: string): Promise<Result<T, ApiError>> =>
  request<T>(path);

export const post = <T>(
  path: string,
  body: unknown,
): Promise<Result<T, ApiError>> =>
  request<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
