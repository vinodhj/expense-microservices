import type { CodegenConfig } from "@graphql-codegen/cli";
import dotenv from "dotenv";
dotenv.config();

const config: CodegenConfig = {
  schema: {
    [process.env.GRAPHQL_URL || ""]: {
      headers: {
        "X-Project-Token": process.env.PROJECT_TOKEN || "",
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
