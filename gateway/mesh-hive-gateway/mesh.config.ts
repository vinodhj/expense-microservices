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

export const composeConfig = defineComposeConfig({
  subgraphs: [
    {
      sourceHandler: loadGraphQLHTTPSubgraph("UserService", {
        endpoint: USER_SERVICE_URL ?? "",
        method: "POST",
        credentials: "include",
        schemaHeaders: {
          "X-Project-Token": process.env.PROJECT_TOKEN,
          "X-Gateway-Timestamp": Date.now().toString(),
          "X-Gateway-Signature": process.env.GATEWAY_SIGNATURE,
          "X-Gateway-Nonce": nonce,
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
    },
  ],
});

export const gatewayConfig = defineGatewayConfig({
  cors: { credentials: true },
  plugins: (ctx) => [],
});
