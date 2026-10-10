/** Outcome of an operation that can fail, so callers handle errors without try/catch. */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
