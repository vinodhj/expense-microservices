import { Redis } from "@upstash/redis";

// Rate limiting function
export async function checkRateLimit({
  request,
  redis,
  ctx,
  isDev,
}: {
  request: Request;
  redis: Redis;
  ctx: ExecutionContext;
  isDev: boolean;
}): Promise<Response | null> {
  // Skip rate limiting in DEV environment
  if (isDev) {
    return null;
  }

  // Rate limiter config
  const RATE_LIMIT = {
    WINDOW_SEC: 60,
    MAX_REQUESTS: 50,
    PENALTY_SEC: 40, //  Add 40-second penalty to the remaining window time
  };

  const clientId =
    request.headers.get("CF-Connecting-IP") ??
    request.headers.get("X-Forwarded-For")?.split(",")[0] ??
    request.headers.get("X-Real-IP") ??
    "anonymous";
  const rateLimitKey = `rate_limit:${clientId}`;
  const blockedKey = `blocked:${clientId}`;

  try {
    // Check if client is already blocked
    const isBlocked = await redis.exists(blockedKey);
    if (isBlocked) {
      const remainingBlock = await redis.ttl(blockedKey);
      return createRateLimitResponse(remainingBlock, 0);
    }

    // Increment rate limit counter
    const current = await redis.incr(rateLimitKey);

    // Set TTL on first request in window
    if (current === 1) {
      ctx.waitUntil(redis.expire(rateLimitKey, RATE_LIMIT.WINDOW_SEC));
    }

    // Get remaining window time for headers
    const ttl = await redis.ttl(rateLimitKey);
    const windowReset = Math.max(ttl, 0);
    const remaining = Math.max(RATE_LIMIT.MAX_REQUESTS - current, 0);

    if (current > RATE_LIMIT.MAX_REQUESTS) {
      // Calculate penalty duration
      const penaltyDuration = windowReset + RATE_LIMIT.PENALTY_SEC;

      // Set block with penalty duration
      await redis.setex(blockedKey, penaltyDuration, "blocked");

      // Delete the rate limit counter to reset for next window
      await redis.del(rateLimitKey);

      // Log rate limit violation
      console.warn(`Rate limit exceeded for ${clientId}. Blocked for ${penaltyDuration}s. Remaining requests: ${remaining}`);

      return createRateLimitResponse(penaltyDuration, 0);
    }

    // If we get here, request is allowed
    // For successful requests, we could attach rate limit headers to the actual response later
    return null;
  } catch (error) {
    // Log Redis errors but don't block legitimate traffic
    console.error("Rate limiting error:", error);
    return null;
  }

  // Helper function to create consistent rate limit responses
  function createRateLimitResponse(retryAfter: number, remaining: number): Response {
    return new Response(
      JSON.stringify({
        errors: [{ message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.` }],
        extensions: { code: "RATE_LIMIT_EXCEEDED" },
        data: null,
      }),
      {
        status: 429,
        headers: {
          "Retry-After": retryAfter.toString(),
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "X-RateLimit-Limit": RATE_LIMIT.MAX_REQUESTS.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": retryAfter.toString(),
        },
      },
    );
  }
}
