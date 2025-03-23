import { createGatewayRuntime, GatewayConfig } from "@graphql-hive/gateway-runtime";
import httpTransport from "@graphql-mesh/transport-http";
import { gatewayConfig } from "mesh.config";
import { supergraphSdl } from "supergraph-string";
import { createAuthFunctions } from "./auth-functions";
import { createServiceRouter } from "./service-router";
import { Redis } from "@upstash/redis/cloudflare";

import { GraphQLSchema } from "graphql";
import { mapSchema, getDirective, MapperKind } from "@graphql-tools/utils";

// Define public directive transformer
const publicDirectiveTransformer = (schema: GraphQLSchema): GraphQLSchema => {
  return mapSchema(schema, {
    [MapperKind.MUTATION_ROOT_FIELD]: (fieldConfig) => {
      const publicDirective = getDirective(schema, fieldConfig, "public")?.[0];

      if (publicDirective) {
        console.log("Mutation directive", publicDirective);
        // Implement your public directive logic here
        return fieldConfig;
      }
    },
    [MapperKind.QUERY_ROOT_FIELD]: (fieldConfig) => {
      const publicDirective = getDirective(schema, fieldConfig, "public")?.[0];

      if (publicDirective) {
        // Implement your public directive logic here
        return fieldConfig;
      }
    },
  });
};

// Gateway setup
export const initializeGateway = (env: Env) => {
  try {
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
  } catch (error) {
    console.error("Failed to initialize gateway:", error);
    // Type guard
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to initialize gateway: ${errorMessage}`);
  }
};
