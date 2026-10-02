import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Sheets request telemetry, scoped per incoming request with AsyncLocalStorage
 * so concurrent requests never mix their counters.
 *
 * - Every Sheets API call slower than SLOW_CALL_MS is logged (succeeded or
 *   failed), as are all automatic retries (gaxios `onRetryAttempt`).
 * - `SHEETS_TIMING_LOG=1` logs every call.
 * - Routes wrapped in `withSheetsTelemetry(label, fn)` log one summary line:
 *   logical calls, retry attempts, total time and time the proposal lock was held.
 *
 * Logs carry the method, the A1 range (or a short operation name) and timings —
 * never request bodies, credentials or the spreadsheet id.
 */

const SLOW_CALL_MS = 1000;
const verbose = () => process.env.SHEETS_TIMING_LOG === "1";

interface RequestStats {
  label: string;
  startedAt: number;
  calls: number;
  retries: number;
  /** Proposal-lock holds in this request and their total duration. */
  locks: number;
  lockHeldMs: number;
}

const store = new AsyncLocalStorage<RequestStats>();

/** Runs `fn` with a fresh counter and logs a one-line summary when it settles. */
export async function withSheetsTelemetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const stats: RequestStats = { label, startedAt: Date.now(), calls: 0, retries: 0, locks: 0, lockHeldMs: 0 };
  try {
    return await store.run(stats, fn);
  } finally {
    const total = Date.now() - stats.startedAt;
    console.info(
      `[sheets] ${stats.label}: ${stats.calls} calls, ${stats.retries} ${stats.retries === 1 ? "retry" : "retries"}, ${total}ms total` +
        (stats.locks ? `, lock held ${stats.lockHeldMs}ms` : "")
    );
  }
}

/** The current request's counters (for tests and the lock helper). */
export const currentSheetsStats = () => store.getStore();

export function noteLockHeld(ms: number): void {
  const stats = store.getStore();
  if (stats) {
    stats.locks++;
    stats.lockHeldMs += ms;
  }
}

/** gaxios `onRetryAttempt`: count and log every automatic retry. */
export function onSheetsRetryAttempt(error: unknown): void {
  const stats = store.getStore();
  if (stats) stats.retries++;
  const err = error as { status?: number; response?: { status?: number }; code?: string; config?: { method?: string; url?: string | URL; retryConfig?: { currentRetryAttempt?: number } } };
  const status = err.response?.status ?? err.status ?? err.code ?? "no response";
  // gaxios has already counted this retry when it calls the hook.
  const attempt = err.config?.retryConfig?.currentRetryAttempt || 1;
  console.warn(`[sheets] retry #${attempt} after ${status}: ${err.config?.method ?? "?"} ${describeUrl(err.config?.url)}${stats ? ` (in ${stats.label})` : ""}`);
}

/** `.../spreadsheets/<id>/values/Tab!A2:B` → `values/Tab!A2:B` (no id, no query). */
function describeUrl(url: string | URL | undefined): string {
  if (!url) return "?";
  try {
    const path = decodeURIComponent(new URL(String(url)).pathname);
    return path.replace(/^.*\/spreadsheets\/[^/]+\/?/, "") || "spreadsheet";
  } catch {
    return "?";
  }
}

/** A short, safe description of a call's target: its A1 range, or the batch operation. */
function describeParams(params: unknown): string {
  const p = (params ?? {}) as { range?: unknown; requestBody?: { requests?: unknown[]; dataFilters?: unknown[]; data?: unknown[] } };
  if (typeof p.range === "string") return p.range;
  const requests = p.requestBody?.requests;
  if (Array.isArray(requests)) return requests.map((r) => Object.keys(r as object)[0]).join(",");
  if (p.requestBody?.dataFilters) return `${p.requestBody.dataFilters.length} data filter(s)`;
  if (p.requestBody?.data) return `${p.requestBody.data.length} anchored write(s)`;
  return "";
}

/**
 * Wraps a googleapis client so every method call is counted and timed. Plain
 * objects (`spreadsheets`, `values`, `developerMetadata`) are wrapped
 * recursively; functions are timed. One logical call = one count, however
 * many retry attempts gaxios makes underneath.
 *
 * The proxy's target is an empty stand-in, not the client itself: googleapis
 * defines its resources as read-only, non-configurable properties, and a
 * proxy may not return a different (wrapped) value for those of its own
 * target. Reads are forwarded to the real object instead.
 */
export function instrumentSheets<T extends object>(target: T, path = "sheets"): T {
  const cache = new Map<PropertyKey, unknown>();
  const obj = target;
  return new Proxy(Object.create(null) as T, {
    get(_standIn, prop) {
      const value = Reflect.get(obj, prop);
      if (typeof prop === "symbol" || prop === "context") return value;
      if (cache.has(prop)) return cache.get(prop);
      let wrapped: unknown = value;
      if (typeof value === "function") {
        const name = `${path}.${prop}`;
        wrapped = async (...args: unknown[]) => {
          const stats = store.getStore();
          if (stats) stats.calls++;
          const started = Date.now();
          try {
            const result = await (value as (...a: unknown[]) => Promise<unknown>).apply(obj, args);
            const ms = Date.now() - started;
            if (ms >= SLOW_CALL_MS || verbose()) console.info(`[sheets] ${name} ${describeParams(args[0])} ${ms}ms`);
            return result;
          } catch (error) {
            const ms = Date.now() - started;
            const status = (error as { status?: number; code?: unknown }).status ?? (error as { code?: unknown }).code ?? "error";
            console.warn(`[sheets] ${name} ${describeParams(args[0])} failed (${String(status)}) after ${ms}ms`);
            throw error;
          }
        };
      } else if (value && typeof value === "object" && !Array.isArray(value)) {
        wrapped = instrumentSheets(value as object, `${path}.${String(prop)}`);
      }
      cache.set(prop, wrapped);
      return wrapped;
    },
  });
}

/**
 * Wraps a route handler so its Sheets calls are counted and summarised, e.g.
 * `[sheets] agreement sign test-proposal: 10 calls, 0 retries, 3.4s total, lock held 2.9s`.
 * The label gets the `[id]` route param when there is one.
 */
export function withRouteTelemetry<Ctx extends { params: Promise<object> }, R>(
  label: string,
  handler: (request: Request, ctx: Ctx) => Promise<R>
): (request: Request, ctx: Ctx) => Promise<R> {
  return async (request, ctx) => {
    // Next always passes a context; tolerate callers that don't.
    const id = ctx?.params ? ((await ctx.params) as { id?: string }).id : undefined;
    return withSheetsTelemetry(id ? `${label} ${id}` : label, () => handler(request, ctx));
  };
}
