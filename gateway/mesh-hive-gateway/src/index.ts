import { initializeGateway } from "./gateway";
import { addCorsHeaders, handleCorsPreflight } from "./helper/worker-helper/cors-helper";
import { disposeGateway, initializeRedis, processRequest } from "./helper/worker-helper/utilities";
import { checkRateLimiting } from "./rate-limit";

// Export the Rate Limiter class for Durable Objects to use
export { RateLimiter } from "./helper/worker-helper/rate-limiter-durable-object";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    console.log(`Running in: ${env.ENVIRONMENT} mode`);
    const isDev = env.ENVIRONMENT === "DEV";

    // Handle CORS preflight immediately (fastest path)
    if (request.method === "OPTIONS") {
      return handleCorsPreflight(request, env);
    }

    try {
      // Initialize Redis
      const redis = initializeRedis(env);

      // Check rate limits based on configuration
      const rateLimitResponse = await checkRateLimiting(request, env, ctx, redis, isDev);
      if (rateLimitResponse) {
        return rateLimitResponse;
      }

      // Initialize the gateway runtime
      const gateway = initializeGateway(env, redis);

      // Process the request
      const { response, processingTime } = await processRequest(request, gateway);

      // Add performance metrics header
      const headers = new Headers(response.headers);
      headers.set("X-Processing-Time", processingTime.toString());

      // Schedule disposal of the gateway (don't await it)
      disposeGateway(gateway, ctx);

      // Return with CORS headers
      return addCorsHeaders(
        request,
        new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        }),
        env,
      );
    } catch (error: any) {
      console.error("Gateway error:", error);
      // Determine if this is a GraphQL-specific error
      const isGraphQLError = error.hasOwnProperty("locations") || error.hasOwnProperty("path") || error.extensions?.code;

      return addCorsHeaders(
        request,
        new Response(
          JSON.stringify({
            errors: [
              {
                message: error instanceof Error ? error.message : "Unknown error occurred",
                stack: error instanceof Error && env.ENVIRONMENT === "development" ? error.stack : undefined,
                type: error instanceof Error ? error.constructor.name : typeof error,
                isGraphQLError,
              },
            ],
            data: null,
          }),
          {
            status: isGraphQLError ? 400 : 500,
            headers: {
              "Content-Type": "application/json",
            },
          },
        ),
        env,
      );
    }
  },
};
