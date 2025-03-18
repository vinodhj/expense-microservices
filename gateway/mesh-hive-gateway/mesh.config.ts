import { loadGraphQLHTTPSubgraph, defineConfig as defineComposeConfig } from "@graphql-mesh/compose-cli";
import { defineConfig as defineGatewayConfig } from "@graphql-hive/gateway";
import dotenv from "dotenv";
dotenv.config();

console.log("User Service URL:", process.env.LOCAL_USER_SERVICE_URL);
console.log("Project Token:", process.env.PROJECT_TOKEN);

let USER_SERVICE_URL = process.env.LOCAL_USER_SERVICE_URL;
let CORS_ORIGIN = process.env.LOCAL_CORS_ORIGIN;
if (process.env.IS_ENV === "PROD") {
  USER_SERVICE_URL = process.env.PROD_USER_SERVICE_URL;
  CORS_ORIGIN = process.env.PROD_CORS_ORIGIN;
}

export const composeConfig = defineComposeConfig({
  subgraphs: [
    {
      sourceHandler: loadGraphQLHTTPSubgraph("UserService", {
        endpoint: USER_SERVICE_URL || "",
        method: "POST",
        credentials: "include",
        schemaHeaders: {
          Origin: CORS_ORIGIN,
          "X-Project-Token": process.env.PROJECT_TOKEN,
        },
        operationHeaders: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: "{context.headers.Authorization}",
        },
        retry: 3,
        timeout: 10000,
      }),
    },
  ],
});

export const gatewayConfig = defineGatewayConfig({
  // additionalResolvers: [additionalResolvers$0],
  cors: { origin: CORS_ORIGIN, credentials: true },
  plugins: (ctx) => [],
});
