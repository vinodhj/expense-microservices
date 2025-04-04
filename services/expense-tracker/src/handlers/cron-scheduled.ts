import { categoryCache, expenseCache } from "@src/cache/in-memory-cache";

/**
 * A general rule of thumb is to have the cleanup interval be 1/2 to 1/3 of TTL.
 * With a 15-minute TTL, cleaning every 5-7 minutes would be reasonable.
 * But traffic is currently low, so cleanup interval of about 6 hours.
 * Note: If you're caching a lot of data or have high traffic -> every 30 minutes might be better.
 * Also, we might want to consider more sophisticated caching strategies.
 * such as caching large amounts of data in memory, distributed caching, or even a dedicated cache service(redis).
 */
export async function runCacheCleanup(_env: Env, _ctx: ExecutionContext) {
  console.info("Running scheduled cache cleanup - Expired entries");
  categoryCache.cleanupExpired();
  expenseCache.cleanupExpired();
  console.info("Cache cleanup completed");
}

export async function runCleanCacheAll(_env: Env, _ctx: ExecutionContext) {
  console.info("Running scheduled cache cleanup - All entries");
  categoryCache.clear();
  expenseCache.clear();
  console.info("Cache cleanup completed");
}
