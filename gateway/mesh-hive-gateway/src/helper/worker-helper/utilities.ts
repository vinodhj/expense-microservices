import { GatewayRuntime } from "@graphql-hive/gateway";
import { Redis } from "@upstash/redis";

export const initializeRedis = (env: Env): Redis => {
  return new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
};

// Gateway disposal
export const disposeGateway = (gateway: GatewayRuntime<Record<string, any>>, ctx: ExecutionContext) => {
  try {
    const disposeMethod = gateway[Symbol.asyncDispose];
    if (typeof disposeMethod === "function") {
      ctx.waitUntil(Promise.resolve(disposeMethod.call(gateway)));
    }
  } catch (error) {
    console.error("Disposal error:", error);
  }
};

// Request processing with performance tracking
export const processRequest = async (request: Request, gateway: GatewayRuntime<Record<string, any>>) => {
  const start = Date.now();
  const response = await gateway(request);
  const processingTime = Date.now() - start;

  // Log performance metrics
  console.log(`Request processed in ${processingTime}ms`);
  return { response, processingTime };
};
