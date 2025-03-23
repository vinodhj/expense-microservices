import {
  loadGraphQLHTTPSubgraph,
  defineConfig as defineComposeConfig,
  MeshComposeCLIConfig,
  createPrefixTransform,
} from "@graphql-mesh/compose-cli";
import { defineConfig as defineGatewayConfig } from "@graphql-hive/gateway";
import dotenv from "dotenv";
import { GraphQLSchema } from "graphql";
import { mapSchema, getDirective, MapperKind } from "@graphql-tools/utils";
dotenv.config();

let USER_SERVICE_URL = process.env.LOCAL_USER_SERVICE_URL;
let PROXY_ORIGIN = process.env.LOCAL_PROXY_ORIGIN;
if (process.env.IS_ENV === "PROD") {
  USER_SERVICE_URL = process.env.PROD_USER_SERVICE_URL;
  PROXY_ORIGIN = process.env.PROD_PROXY_ORIGIN;
}

// Generate a random 16 character string
function random16() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 16; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

const nonce = random16();

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

export const composeConfig: MeshComposeCLIConfig = defineComposeConfig({
  // Add custom directives at the top level
  additionalTypeDefs: `
    directive @public on FIELD_DEFINITION
    directive @auth(roles: [Role!]) on FIELD_DEFINITION

    enum Role {
      ADMIN
      USER
    }
    type SessionUser {
      id: String!
      email: String!
      name: String!
      role: Role!
    }

    extend type Query {
      current_session_user: SessionUser @auth
    }
  `,
  subgraphs: [
    {
      sourceHandler: loadGraphQLHTTPSubgraph("UserService", {
        // source: "http://localhost:8501/generated.ts",
        endpoint: USER_SERVICE_URL ?? "",
        method: "POST",
        credentials: "include",
        schemaHeaders: {
          "X-Project-Token": process.env.PROJECT_TOKEN,
          "X-Gateway-Timestamp": Date.now().toString(),
          "X-Gateway-Signature": process.env.GATEWAY_SIGNATURE,
          "X-Gateway-Nonce": nonce,
          "X-Schema-Federation": "true",
        },
        operationHeaders: {
          Authorization: "{context.headers.Authorization}",
          "X-Project-Token": "{context.headers.X-Project-Token}",
          "X-Gateway-Nonce": "{context.gateway_nonce}",
          "X-Gateway-Signature": "{context.gateway_signature}",
          "X-Gateway-Timestamp": "{context.gateway_timestamp}",
          "X-User-Id": "{context.current_session_user.id}",
          "X-User-Role": "{context.current_session_user.role}",
          "X-User-Email": "{context.current_session_user.email}",
          "X-User-Name": "{context.current_session_user.name}",
        },
        retry: 3,
        timeout: 10000,
      }),
      transforms: [
        publicDirectiveTransformer,
        // createPrefixTransform({
        //   value: "USER_",
        //   includeRootOperations: true,
        // }),
      ],
    },
  ],
  // alwaysAddTransportDirective: true,
});

export const gatewayConfig = defineGatewayConfig({
  pollingInterval: 5_000,
  cors: { credentials: true },
  plugins: (ctx) => [],
});
