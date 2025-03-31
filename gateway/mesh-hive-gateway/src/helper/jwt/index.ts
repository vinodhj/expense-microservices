import { GraphQLError } from "graphql";
import jwt from "jsonwebtoken";
import { Role } from "generates";
import { Redis } from "@upstash/redis/cloudflare";
import { KvQueue } from "./kv-queue";
import { verifyTokenVersion } from "./token-version";

export interface TokenPayload {
  id: string;
  email: string;
  name: string;
  role: Role;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

interface CachedToken {
  payload: TokenPayload;
  expiry: number;
}

// Token cache
const tokenCache = new Map<string, CachedToken>();
const CACHE_TTL = 3 * 60 * 1000; // 3 minute in ms

// KV queue
let kvQueuesMap = new WeakMap<KVNamespace, KvQueue>();

export const jwtVerifyToken = async ({
  token,
  secret,
  kvStorage,
  redis,
  ENVIRONMENT,
}: {
  token: string;
  secret: string;
  kvStorage: KVNamespace;
  redis: Redis;
  ENVIRONMENT: string;
}): Promise<TokenPayload> => {
  try {
    // Check cache first
    const cacheKey = `${token}:${ENVIRONMENT}`;

    const cachedResult = tokenCache.get(cacheKey);

    if (cachedResult && cachedResult.expiry > Date.now()) {
      return cachedResult.payload;
    }

    const payload = jwt.verify(token, secret) as TokenPayload;

    // Check expiration before Redis lookup
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      throw new GraphQLError("Token expired", {
        extensions: { code: "TOKEN_EXPIRED" },
      });
    }

    // Verify token version
    await verifyTokenVersion(payload, redis, ENVIRONMENT);

    // Cache successful result
    tokenCache.set(cacheKey, {
      payload,
      expiry: Date.now() + CACHE_TTL,
    });

    return payload;
  } catch (error) {
    console.error("Error verifying token:", error);
    handleTokenError(error, token, kvStorage, ENVIRONMENT);
  }
};

function handleTokenError(error: unknown, token: string, kvStorage: KVNamespace, environment: string): never {
  // Get or create queue for this KV namespace
  if (!kvQueuesMap.has(kvStorage)) {
    kvQueuesMap.set(kvStorage, new KvQueue(kvStorage));
  }
  const queue = kvQueuesMap.get(kvStorage)!;

  // Queue the KV write
  const logKey = `invalid-token:${environment}:${new Date().toISOString()}`;
  const logValue = JSON.stringify({
    token,
    error: error,
    timestamp: new Date().toISOString(),
  });

  queue.push(logKey, logValue, { expirationTtl: 7 * 24 * 60 * 60 });

  const isGraphQLError = error instanceof GraphQLError;
  throw new GraphQLError(isGraphQLError ? error.message : "Invalid token", {
    extensions: {
      code: isGraphQLError && error.extensions?.code ? error.extensions.code : "UNAUTHORIZED",
      error: isGraphQLError && error.extensions?.error ? error.extensions.error : error,
    },
  });
}
