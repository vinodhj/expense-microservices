import { GatewayRuntime } from "@graphql-hive/gateway-runtime";
import { initializeGateway } from "./gateway";
import { addCorsHeaders, handleCorsPreflight } from "./helper/cors-helper";
import { Redis } from "@upstash/redis";

// Gateway disposal
const disposeGateway = (gateway: GatewayRuntime<Record<string, any>>, ctx: ExecutionContext) => {
  const disposeMethod = gateway[Symbol.asyncDispose];
  if (typeof disposeMethod === "function") {
    const disposePromise = disposeMethod.call(gateway);
    ctx.waitUntil(Promise.resolve(disposePromise));
  }
};

// Rate limiter config
const RATE_LIMIT = {
  WINDOW_SEC: 60,
  MAX_REQUESTS: 100,
};

const MAX_CONCURRENT = 8;
let activeRequests = 0;
const pendingQueue: ((value: unknown) => void)[] = [];

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    console.log(`Running in: ${env.ENVIRONMENT} mode`);

    // Initialize Redis
    const redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });

    if (env.ENVIRONMENT != "DEV") {
      const clientId = request.headers.get("CF-Connecting-IP") ?? "anonymous";

      const key = `rate_limit:${clientId}`;
      const current = await redis.incr(key);

      if (current > RATE_LIMIT.MAX_REQUESTS) {
        return new Response("Too many requests", {
          status: 429,
          headers: {
            "Retry-After": RATE_LIMIT.WINDOW_SEC.toString(),
          },
        });
      }

      if (current === 1) {
        await redis.expire(key, RATE_LIMIT.WINDOW_SEC);
      }
    }

    if (activeRequests >= MAX_CONCURRENT) {
      // Wait for slot with 10s timeout
      await Promise.race([
        new Promise((resolve) => pendingQueue.push(resolve)),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000)),
      ]);
    }

    activeRequests++;

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return handleCorsPreflight();
    }

    try {
      // Initialize the gateway runtime
      const gateway = initializeGateway(env);

      // Process the request
      const response = await gateway(request);

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
      pendingQueue.shift()?.(undefined); // Pass undefined as resolution value
    }
  },
};
