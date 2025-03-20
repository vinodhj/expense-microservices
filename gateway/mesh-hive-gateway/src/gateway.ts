import { createGatewayRuntime, GatewayConfig } from "@graphql-hive/gateway-runtime";
import httpTransport from "@graphql-mesh/transport-http";
import { gatewayConfig } from "mesh.config";
import { supergraphSdl } from "supergraph-string";
import { createAuthFunctions } from "./auth-functions";
import { createServiceRouter } from "./service-router";

// Gateway setup
export const initializeGateway = (env: Env) => {
  // Create auth functions
  const authFunctions = createAuthFunctions(env);

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
