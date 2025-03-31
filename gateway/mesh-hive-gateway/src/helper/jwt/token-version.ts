import { Redis } from "@upstash/redis";
import { TokenPayload } from ".";
import { RedisCircuitBreaker } from "./redis-circuit-breaker";
import { GraphQLError } from "graphql";

// Redis client
const redisBreaker = new RedisCircuitBreaker();

/* *
 * Retrieve the current token version from KV.
 * We use the user's email as the key identifier; adjust if you have a different unique identifier.
 * Fetch the current token version for this user (default to 0 if not set)
 */
export async function verifyTokenVersion(payload: TokenPayload, redis: Redis, environment: string): Promise<void> {
  const currentVersionStr = await redisBreaker.execute(
    () => redis.get(`user:${environment}:${payload.email}:tokenVersion`),
    () => {
      console.warn("Redis circuit open, skipping token version check");
      return payload.tokenVersion.toString();
    },
  );

  const storedVersion = currentVersionStr ? parseInt(currentVersionStr as string) : 0;

  if (payload.tokenVersion !== storedVersion) {
    throw new GraphQLError("For security reasons, your session is no longer valid. Please sign in again", {
      extensions: {
        code: "REVOKE_TOKEN_ERROR",
        error: `Token has been revoked. payload_version: ${payload.tokenVersion}, stored_version: ${storedVersion}`,
      },
    });
  }
}
