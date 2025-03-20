import { ExecutionResult } from "graphql";
import { YogaInitialContext } from "./graphql";
import type { Plugin } from "@envelop/core";

const NONCE_EXPIRATION_TTL = 5 * 60; // 5 minutes in seconds

// Plugin to store nonce in KV storage
export function createNonceStoragePlugin() {
  return {
    onExecutionResult: async ({ result, context }: { result: ExecutionResult; context: YogaInitialContext }) => {
      // Store nonce only if request was successful
      if (result && !result.errors) {
        try {
          await context.apis.kvStorageAPI.nonceStore(context.nonceKey, context.noncetimestamp, NONCE_EXPIRATION_TTL);
        } catch (error) {
          console.error(`Failed to store nonce ${context.nonceKey}: ${error}`);
        }
      }
    },
  };
}

// Plugin to log GraphQL execution time
export const createMetricsPlugin: Plugin = {
  onExecute() {
    const start = Date.now();
    return {
      onExecuteDone({ args }) {
        const duration = Date.now() - start;
        const operationName = args.operationName || "anonymous";
        console.debug(`GraphQL execution of '${operationName}' completed in ${duration}ms`);
      },
    };
  },
};
