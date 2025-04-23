import { Redis } from "@upstash/redis";
import { cfCheckRateLimit } from "./helper/worker-helper/cf-check-rate-limit";
import { checkRateLimit } from "./helper/worker-helper/redis-rate-limit";

export async function checkRateLimiting(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  redis: Redis,
  isDev: boolean,
): Promise<Response | null> {
  // Check Cloudflare rate limit
  if (env.RATE_LIMIT_FUNCTION === "CLOUDFLARE") {
    const rateLimitResponse = await cfCheckRateLimit({ request, env, ctx, isDev });
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
  }

  // Check Redis rate limit
  const redis_rateLimitResponse = await checkRateLimit({ request, redis, ctx, isDev });
  if (redis_rateLimitResponse) {
    return redis_rateLimitResponse;
  }
  return null;
}
