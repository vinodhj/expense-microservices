import { ExecutionResult } from "graphql";
import { YogaInitialContext } from "./graphql";

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
