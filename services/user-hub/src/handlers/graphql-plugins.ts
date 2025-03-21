import { ExecutionArgs, ExecutionResult, getOperationAST, GraphQLError } from "graphql";
import { YogaInitialContext } from "./graphql";
import type { Plugin as EnvelopPlugin } from "@envelop/core";
import { Redis } from "@upstash/redis";

const NONCE_EXPIRATION_TTL = 5 * 60; // 5 minutes in seconds

// Plugin to store nonce in redis
export function createNonceStoragePlugin(redis: Redis) {
  return {
    onExecute: async ({ args }: { args: ExecutionArgs }) => {
      const { document, operationName, contextValue } = args;
      const context = contextValue as YogaInitialContext;

      // Check if this is a mutation operation
      const operationAST = getOperationAST(document, operationName);
      const nonceKey = context.nonceKey;

      if (operationAST && operationAST.operation === "mutation" && nonceKey) {
        const usedNonce = await redis.get(nonceKey);
        if (usedNonce) {
          // Add logging for potential replay attacks
          console.warn(`Potential replay attack detected: Duplicate nonce ${nonceKey} used`);
          throw new GraphQLError("Duplicate request - nonce already used", {
            extensions: { code: "REPLAY_ATTACK", status: 401 },
          });
        }
      }
    },
    onExecutionResult: async ({ result, context }: { result: ExecutionResult; context: YogaInitialContext }) => {
      // Early return if result is invalid or has errors
      if (!result || result.errors || !result.data) return;

      // Early return if not a mutation
      if (result.data.__typename !== "Mutation") return;

      // Store nonce only if request was successful
      try {
        await redis.set(context.nonceKey, context.noncetimestamp, { ex: NONCE_EXPIRATION_TTL });
      } catch (error) {
        console.error(`Failed to store nonce ${context.nonceKey}: ${error}`);
      }
    },
  };
}

// Plugin to log GraphQL execution time
export const createMetricsPlugin: EnvelopPlugin = {
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
