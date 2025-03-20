import { createGatewayRuntime, GatewayConfig, ResolveUserFn, ValidateUserFn } from "@graphql-hive/gateway-runtime";
import httpTransport from "@graphql-mesh/transport-http";
import { gatewayConfig } from "../mesh.config";
import { supergraphSdl } from ".././supergraph-string";
import { GraphQLError } from "graphql";
import { jwtVerifyToken } from "./jwt-verify-token";
import crypto from "crypto";

interface Fetcher {
  fetch: typeof fetch;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    try {
      const isDevelopment = env.WORKER_ENV === "dev";
      console.log(`Running in ${isDevelopment ? "development" : "production"} mode`);

      // GenericAuth - resolveUser and validateUser functions for the gateway
      const resolveUserFn: ResolveUserFn<any> = async (context: any) => {
        // Get current timestamp
        const timestamp = Date.now().toString();
        context.gateway_timestamp = timestamp;

        // Generate a unique nonce
        const nonce = crypto.getRandomValues(new Uint8Array(16)).reduce((str, byte) => str + byte.toString(16).padStart(2, "0"), "");
        context.gateway_nonce = nonce;

        // Get auth header
        const accessToken = context.headers?.Authorization;
        if (!accessToken) {
          // TODO : Check if this is a public operation - `public:${operationName}:${timestamp}:${nonce}`;
          // Generate public operation signature including nonce
          const signaturePayload = `public:${timestamp}:${nonce}`;
          const signature = crypto.createHmac("sha256", env.GATEWAY_SECRET).update(signaturePayload).digest("hex");

          context.gateway_signature = signature;
          return null; // No auth token provided
        }
        try {
          const jwtToken = await jwtVerifyToken({ token: accessToken, secret: env.JWT_SECRET, kvStorage: env.EXPENSE_AUTH_EVENTS_KV });
          const user = {
            id: jwtToken.id,
            role: jwtToken.role,
            email: jwtToken.email,
            name: jwtToken.name,
          };
          // Explicitly add a string version to the context
          context.current_session_user = user;

          // Generate signature based on headers and shared secret
          const signaturePayload = `${jwtToken.id}:${jwtToken.role}:${timestamp}:${nonce}`;
          const signature = crypto.createHmac("sha256", env.GATEWAY_SECRET).update(signaturePayload).digest("hex");

          // Add signature and timestamp to context
          context.gateway_signature = signature;

          return user;
        } catch (error) {
          console.error("Token verification failed:", error);
          const isGraphQLError = error instanceof GraphQLError;
          throw new GraphQLError(isGraphQLError ? error.message : "Invalid token", {
            extensions: {
              status: 401,
              code: isGraphQLError ? error.extensions.code : "UNAUTHORIZED",
              error: isGraphQLError && error.extensions?.error ? error.extensions.error : error,
            },
          });
        }
      };

      const validateUser: ValidateUserFn<any> = ({ user, executionArgs }) => {
        // Check if this operation requires auth
        const publicOperations = ["login", "signUp"];
        const operationName = executionArgs.operationName ?? "";
        console.log("Operation name:", operationName);
        if (publicOperations.includes(operationName)) {
          return; // Allow public operations (returning void means valid)
        }
        // Validate auth token
        if (user === null) {
          throw new GraphQLError("Authentication failed", {
            extensions: {
              code: "UNAUTHORIZED",
              status: 401,
              error: { message: "Invalid token" },
            },
          });
        }
      };

      // Create the gateway runtime
      const gateway = createGatewayRuntime({
        ...(gatewayConfig as GatewayConfig),
        supergraph: supergraphSdl,
        transports: {
          http: httpTransport,
        },
        genericAuth: {
          mode: "protect-granular",
          resolveUserFn,
          validateUser,
        },
        fetchAPI: {
          fetch: (url, options) => {
            // Determine which service to call based on the URL
            if (url.includes(env.USER_SERVICE_URL)) {
              return env.USER_SERVICE_WORKER.fetch(url, options);
            }
            // Fallback to default fetch if no match
            return fetch(url, options);
          },
        },
      });

      // Make sure to dispose the gateway when done
      const disposeMethod = gateway[Symbol.asyncDispose];
      if (typeof disposeMethod === "function") {
        const disposePromise = disposeMethod.call(gateway);
        ctx.waitUntil(Promise.resolve(disposePromise));
      }

      // Process the request
      const response = await gateway(request);

      // Add CORS headers to the response if they're not already present
      if (response && !response.headers.has("Access-Control-Allow-Origin")) {
        const headers = new Headers(response.headers);
        headers.set("Access-Control-Allow-Origin", "*");

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      }

      return response;
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
