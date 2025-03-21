import { createGatewayRuntime, GatewayConfig } from "@graphql-hive/gateway-runtime";
import httpTransport from "@graphql-mesh/transport-http";
import { gatewayConfig } from "mesh.config";
import { supergraphSdl } from "supergraph-string";
import { createAuthFunctions } from "./auth-functions";
import { createServiceRouter } from "./service-router";
import { Redis } from "@upstash/redis/cloudflare";

// Gateway setup
export const initializeGateway = (env: Env) => {
  // Initialize Redis
  const redis = Redis.fromEnv(env);

  // Create auth functions
  const authFunctions = createAuthFunctions(env, redis);

  // Initialize gateway runtime
  return createGatewayRuntime({
    ...(gatewayConfig as GatewayConfig),
    supergraph: supergraphSdl,
    transports: { http: httpTransport },
    genericAuth: {
      mode: "protect-granular",
      ...authFunctions,
    },
    fetchAPI: {
      fetch: createServiceRouter(env),
    },
  });
};
