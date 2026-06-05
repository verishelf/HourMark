type Options = {
  maxAttempts?: number;
  delayMs?: number;
};

/** Retry transient network / Supabase failures with linear backoff. */
export async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  { maxAttempts = 3, delayMs = 350 }: Options = {}
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
      }
    }
  }

  throw lastError;
}
