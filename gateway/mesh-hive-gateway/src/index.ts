import { GatewayRuntime } from "@graphql-hive/gateway-runtime";
import { initializeGateway } from "./gateway";

// CORS handling
const handleCorsPreflight = (): Response => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
};

// CORS headers middleware
const addCorsHeaders = (response: Response): Response => {
  // Add CORS headers to the response if they're not already present
  if (!response.headers.has("Access-Control-Allow-Origin")) {
    const headers = new Headers(response.headers);
    headers.set("Access-Control-Allow-Origin", "*");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }
  return response;
};

// Gateway disposal
const disposeGateway = (gateway: GatewayRuntime<Record<string, any>>, ctx: ExecutionContext) => {
  const disposeMethod = gateway[Symbol.asyncDispose];
  if (typeof disposeMethod === "function") {
    const disposePromise = disposeMethod.call(gateway);
    ctx.waitUntil(Promise.resolve(disposePromise));
  }
};

export default {
  /**
   * Main request handler. Handles CORS preflight requests, initializes the gateway
   * runtime, processes the request with the gateway, and schedules disposal of the
   * gateway. Adds CORS headers to the response if they're not already present. If an
   * error occurs, logs the error and returns a JSON response with error details.
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight
    if (request.method === "OPTIONS") return handleCorsPreflight();

    try {
      const isDevelopment = env.WORKER_ENV === "dev";
      console.log(`Running in ${isDevelopment ? "development" : "production"} mode`);

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
              stack: error instanceof Error ? error.stack : undefined,
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
    }
  },
};
