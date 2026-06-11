export interface RetryOptions {
  /** Extra attempts after the first (so total tries = retries + 1). Default 2. */
  retries?: number;
  /** Base backoff in ms (doubles each attempt). Default 400. */
  baseDelayMs?: number;
  /** Backoff ceiling in ms. Default 3000. */
  maxDelayMs?: number;
  /** Decide whether a thrown error is worth retrying. Default: retry everything. */
  shouldRetry?: (err: unknown, attempt: number) => boolean;
  /** Side-effect hook (e.g. logging) before each wait. */
  onRetry?: (err: unknown, attempt: number, delayMs: number) => void;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Run `fn` with exponential backoff + jitter. Re-throws the last error once attempts
 * are exhausted or `shouldRetry` returns false.
 */
export async function retry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const {
    retries = 2,
    baseDelayMs = 400,
    maxDelayMs = 3000,
    shouldRetry = () => true,
    onRetry,
  } = opts;

  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= retries || !shouldRetry(err, attempt)) throw err;
      const backoff = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
      const delay = backoff + Math.floor(Math.random() * 200); // jitter
      onRetry?.(err, attempt + 1, delay);
      await sleep(delay);
      attempt += 1;
    }
  }
}
