import { loadGraphQLHTTPSubgraph, defineConfig as defineComposeConfig } from "@graphql-mesh/compose-cli";
import { defineConfig as defineGatewayConfig } from "@graphql-hive/gateway";
import dotenv from "dotenv";
dotenv.config();

let USER_SERVICE_URL = process.env.LOCAL_USER_SERVICE_URL;
let PROXY_ORIGIN = process.env.LOCAL_PROXY_ORIGIN;
if (process.env.IS_ENV === "PROD") {
  USER_SERVICE_URL = process.env.PROD_USER_SERVICE_URL;
  PROXY_ORIGIN = process.env.PROD_PROXY_ORIGIN;
}

export const composeConfig = defineComposeConfig({
  subgraphs: [
    {
      sourceHandler: loadGraphQLHTTPSubgraph("UserService", {
        endpoint: USER_SERVICE_URL ?? "",
        method: "POST",
        credentials: "include",
        schemaHeaders: {
          "X-Project-Token": process.env.PROJECT_TOKEN,
        },
        operationHeaders: {
          Authorization: "{context.headers.Authorization}",
          "X-Project-Token": "{context.headers.X-Project-Token}",
        },
        retry: 3,
        timeout: 10000,
      }),
    },
  ],
});

export const gatewayConfig = defineGatewayConfig({
  cors: { credentials: true },
  plugins: (ctx) => [],
});
