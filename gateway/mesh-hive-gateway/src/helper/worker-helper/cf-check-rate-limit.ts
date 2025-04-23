// Define the rate limit response type
interface RateLimitData {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

function isRateLimitData(data: any): data is RateLimitData {
  return "remaining" in data && "limit" in data;
}

// Function to check rate limits
export async function cfCheckRateLimit({
  request,
  env,
  ctx,
  isDev,
}: {
  request: Request;
  env: Env;
  ctx: ExecutionContext;
  isDev: boolean;
}): Promise<Response | null> {
  // Skip rate limiting in DEV environment
  if (isDev) {
    return null;
  }

  // Get client identifier
  const clientId = request.headers.get("CF-Connecting-IP") ?? "anonymous";

  try {
    // Create an ID for this client
    const id = env.RATE_LIMITER.idFromName(clientId);

    // Get the Durable Object stub for this client ID
    const rateLimiterStub = env.RATE_LIMITER.get(id);

    // Forward the request to the Durable Object
    const rateLimitResp = await rateLimiterStub.fetch(request.url);

    // Check if rate limited
    if (rateLimitResp.status === 429) {
      return rateLimitResp;
    }

    // Attach rate limit headers to the request context for later use
    const rateLimitData = await rateLimitResp.json();
    // Store rate limit info for optional use in the final response headers
    if (isRateLimitData(rateLimitData)) {
      // rateLimitData is now of type RateLimitData
      ctx.waitUntil(
        Promise.resolve().then(() => {
          // You could store this data and use it later if needed
          console.log(`Rate limit info: ${rateLimitData.remaining}/${rateLimitData.limit}`);
        }),
      );
    }

    // Allow the request to proceed
    return null;
  } catch (error) {
    // Log but don't block traffic if the rate limiter fails
    console.error("Rate limiting error:", error);
    return null;
  }
}
