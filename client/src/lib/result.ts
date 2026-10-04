export type Success<T> = {
  ok: true;
  value: T;
};

export type Failure<E> = {
  ok: false;
  error: E;
};

/*
Result is what `get` and `post` in api.ts return instead of throwing.
It is either a success that holds the data, or a failure that holds an error
with a message and the HTTP status.

Why: with try/catch it is easy to forget the error case. With a Result,
TypeScript will not let you read the data until you have checked `ok`.

In a view: call `get` or `post`, then check `ok` on the result. If it is
false, show `error.message` to the user. If it is true, the data is in `value`.

In api.ts: every request function must return a Result and never throw.
When the request went well, return `success(data)`. When anything goes wrong
(network down, bad status, body that is not JSON), return `fail(error)`.
Both count as a Result, so callers handle the two cases the same way.

In the api package (routes): handlers do not use Result. On success, send the
data as it is. On failure, send a 4xx or 5xx status with a body of
{ error: "message" }. The client's api.ts turns both into a Result, so the
conversion lives in one place and routes stay simple.
*/
export type Result<T, E> = Success<T> | Failure<E>;

export const success = <T>(value: T): Success<T> => {
  return {
    ok: true,
    value,
  };
};

export const fail = <E>(error: E): Failure<E> => {
  return {
    ok: false,
    error,
  };
};
