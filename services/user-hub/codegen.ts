import type { CodegenConfig } from "@graphql-codegen/cli";
import dotenv from "dotenv";
dotenv.config();

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

const config: CodegenConfig = {
  schema: {
    [process.env.GRAPHQL_URL ?? ""]: {
      headers: {
        "X-Project-Token": process.env.PROJECT_TOKEN ?? "",
        "X-Gateway-Timestamp": Date.now().toString(),
        "X-Gateway-Signature": process.env.GATEWAY_SIGNATURE ?? "",
        "X-Gateway-Nonce": nonce,
      },
    },
  },
  generates: {
    "generated.ts": {
      plugins: ["typescript", "typescript-resolvers"],
    },
  },
};
export default config;
