import { GatewayRuntime } from "@graphql-hive/gateway-runtime";
import { initializeGateway } from "./gateway";
import { addCorsHeaders, handleCorsPreflight } from "./helper/cors-helper";
import { Redis } from "@upstash/redis";

const initializeRedis = (env: Env): Redis | null => {
  if (env.ENVIRONMENT !== "DEV") {
    return new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return null;
};

// Gateway disposal
const disposeGateway = (gateway: GatewayRuntime<Record<string, any>>, ctx: ExecutionContext) => {
  try {
    const disposeMethod = gateway[Symbol.asyncDispose];
    if (typeof disposeMethod === "function") {
      ctx.waitUntil(Promise.resolve(disposeMethod.call(gateway)));
    }
  } catch (error) {
    console.error("Disposal error:", error);
  }
};

// Rate limiter config
const RATE_LIMIT = {
  WINDOW_SEC: 60,
  MAX_REQUESTS: 50,
};

// Concurrency control
const MAX_CONCURRENT = 4; // Reduced from 8 to give more headroom
let activeRequests = 0;

// Request processing with performance tracking
const processRequest = async (request: Request, gateway: GatewayRuntime<Record<string, any>>) => {
  const start = Date.now();
  const response = await gateway(request);
  const processingTime = Date.now() - start;

  // Log performance metrics
  console.log(`Request processed in ${processingTime}ms`);
  return response;
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    console.log(`Running in: ${env.ENVIRONMENT} mode`);

    // Handle CORS preflight immediately (fastest path)
    if (request.method === "OPTIONS") {
      return handleCorsPreflight();
    }

    // Initialize Redis
    const redis = initializeRedis(env);

    // Rate limiting (only in non-DEV environments)
    if (redis) {
      const clientId = request.headers.get("CF-Connecting-IP") ?? "anonymous";
      const rateLimitKey = `rate_limit:${clientId}`;
      const blockedKey = `blocked:${clientId}`;

      // Check if client is already blocked
      const isBlocked = await redis.exists(blockedKey);
      if (isBlocked) {
        const remainingBlock = await redis.ttl(blockedKey);
        return new Response(
          JSON.stringify({
            errors: [{ message: `Rate limit exceeded. Please try again in ${remainingBlock} seconds.` }],
            extensions: { code: "RATE_LIMIT_EXCEEDED" },
            data: null,
          }),
          {
            status: 429,
            headers: {
              "Retry-After": remainingBlock.toString(),
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          },
        );
      }

      // Increment rate limit counter
      const current = await redis.incr(rateLimitKey);

      // Set TTL on first request in window
      if (current === 1) {
        ctx.waitUntil(redis.expire(rateLimitKey, RATE_LIMIT.WINDOW_SEC)); // Don't await this
      }

      if (current > RATE_LIMIT.MAX_REQUESTS) {
        // Get remaining window time
        let ttl = await redis.ttl(rateLimitKey);
        if (ttl <= 0) ttl = RATE_LIMIT.WINDOW_SEC; // Fallback if TTL missing

        // Add 40-second penalty to the remaining window time
        const penaltyDuration = ttl + 40;

        // Set block with penalty duration
        await redis.setex(blockedKey, penaltyDuration, "blocked");

        // Delete the rate limit counter to reset for next window
        await redis.del(rateLimitKey);

        return new Response(
          JSON.stringify({
            errors: [{ message: `Rate limit exceeded. Please try again in ${penaltyDuration} seconds.` }],
            data: null,
          }),
          {
            status: 429,
            headers: {
              "Retry-After": penaltyDuration.toString(),
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          },
        );
      }
    }

    // Concurrency control - immediate rejection if too many requests
    if (activeRequests >= MAX_CONCURRENT) {
      console.log("Too many concurrent requests");
      // Immediate rejection rather than queuing for 10ms limit
      return new Response(
        JSON.stringify({
          errors: [{ message: "Too many concurrent requests" }],
          data: null,
        }),
        {
          status: 503,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Retry-After": "5",
          },
        },
      );
    }
    activeRequests++;

    try {
      // Initialize the gateway runtime
      const gateway = initializeGateway(env);

      // Process the request
      const response = await processRequest(request, gateway);

      // Schedule disposal of the gateway (don't await it)
      disposeGateway(gateway, ctx);

      return addCorsHeaders(response);
    } catch (error) {
      console.error("Gateway error:", error);
      return new Response(
        JSON.stringify({
          errors: [
            {
              message: error instanceof Error ? error.message : "Unknown error occurred",
              stack: error instanceof Error && env.ENVIRONMENT === "development" ? error.stack : undefined,
              type: error instanceof Error ? error.constructor.name : typeof error,
            },
          ],
          data: null,
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    } finally {
      activeRequests--;
    }
  },
};
