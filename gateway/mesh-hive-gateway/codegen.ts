import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "./supergraph.graphql",
  generates: {
    "./generates.ts": {
      plugins: ["typescript", "typescript-operations", "typescript-generic-sdk"],
      config: {
        rawRequest: true,
      },
    },
  },
};
export default config;
