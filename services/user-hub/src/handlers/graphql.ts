import { YogaSchemaDefinition, createYoga } from "graphql-yoga";
import { drizzle } from "drizzle-orm/d1";
import { schema } from "@src/schemas";
import { GraphQLError } from "graphql";
import { addCORSHeaders } from "@src/cors-headers";
import { APIs, createAPIs, SessionUserType } from "@src/services";
import { Role } from "db/schema/user";
import crypto from "crypto";
import { KvStorageServiceAPI } from "@src/services/kv-storage-service";
import { createNonceStoragePlugin } from "./graphql-plugins";

export interface YogaInitialContext {
  jwtSecret: string;
  accessToken: string | null;
  sessionUser: SessionUserType;
  apis: APIs;
  nonceKey: string;
  noncetimestamp: string;
}

const GRAPHQL_PATH = "/graphql";
const MAX_REQUEST_AGE_MS = 5 * 60 * 1000; // 5 minutes

const getAccessToken = (authorizationHeader: string | null): string | null => {
  if (!authorizationHeader) return null;
  return authorizationHeader.replace(/bearer\s+/i, "").trim();
};

const validateProjectToken = (projectToken: string | null, expectedToken: string): void => {
  if (!projectToken || projectToken !== expectedToken) {
    throw new GraphQLError("Missing or invalid project token", {
      extensions: { code: "UNAUTHORIZED", status: 401 },
    });
  }
};

const getHeader = (headers: Headers, key: string): string | null => headers.get(key) ?? headers.get(key.toLowerCase());

// Constant-time string comparison to prevent timing attacks
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Verify request security headers
async function verifySecurityHeaders(
  headers: Headers,
  env: Env,
  kvStorageAPI: KvStorageServiceAPI,
): Promise<{ nonceKey: string; noncetimestamp: string }> {
  const noncetimestamp = getHeader(headers, "X-Gateway-Timestamp");
  const nonce = getHeader(headers, "X-Gateway-Nonce");
  const signature = getHeader(headers, "X-Gateway-Signature");
  const authorization = getHeader(headers, "Authorization");
  const userId = getHeader(headers, "X-User-Id");
  const userRole = getHeader(headers, "X-User-Role");
  const timestamp = noncetimestamp;

  // 1. Check if all required headers are present
  if (!timestamp || !signature || !nonce) {
    throw new GraphQLError("Missing required security headers", {
      extensions: { code: "GATEWAY_UNAUTHORIZED", status: 401 },
    });
  }

  // 2. Check if nonce was used before
  const nonceKey = `nonce:${nonce}`;
  const usedNonce = await kvStorageAPI.nonceExists(nonceKey);
  if (usedNonce) {
    // Add logging for potential replay attacks
    console.warn(`Potential replay attack detected: Duplicate nonce ${nonce} used`);
    throw new GraphQLError("Duplicate request - nonce already used", {
      extensions: { code: "REPLAY_ATTACK", status: 401 },
    });
  }

  // 3. Verify request is recent
  const now = Date.now();
  const requestTime = parseInt(timestamp, 10);
  if (isNaN(requestTime)) {
    throw new GraphQLError("Invalid timestamp format", {
      extensions: { code: "INVALID_TIMESTAMP", status: 400 },
    });
  }
  const timeDifference = Math.abs(now - requestTime);
  if (timeDifference > MAX_REQUEST_AGE_MS) {
    throw new GraphQLError(`Request expired: timestamp too old (${timeDifference}ms difference)`, {
      extensions: { code: "REQUEST_TIMEOUT", status: 408, timeDifference },
    });
  }

  // 4. Verify signature
  const isDev = env.ENVIRONMENT === "dev";
  const matchesGatewaySignature = isDev && constantTimeCompare(signature, env.GATEWAY_SIGNATURE);

  // This is to allow the gateway to build the supergraph without needing to sign requests in dev
  if (matchesGatewaySignature) {
    console.warn("Skipping signature verification in dev environment to allow gateway to build supergraph");
  } else {
    const payload = authorization ? `${userId ?? ""}:${userRole ?? ""}:${timestamp}:${nonce}` : `public:${timestamp}:${nonce}`;
    const expectedSignature = crypto.createHmac("sha256", env.GATEWAY_SECRET).update(payload).digest("hex");

    // Use constant-time comparison
    if (!constantTimeCompare(signature, expectedSignature)) {
      console.warn(`Invalid signature detected for user: ${userId ?? "anonymous"}`);
      throw new GraphQLError("Invalid signature from gateway", {
        extensions: { code: "INVALID_SIGNATURE", status: 401 },
      });
    }
  }

  return { nonceKey, noncetimestamp };
}

export default async function handleGraphQL(request: Request, env: Env): Promise<Response> {
  const db = drizzle(env.DB);

  const yoga = createYoga({
    schema: schema as YogaSchemaDefinition<object, YogaInitialContext>,
    cors: false, // manually added CORS headers in addCORSHeaders
    landingPage: false,
    graphqlEndpoint: GRAPHQL_PATH,
    plugins: [createNonceStoragePlugin()],
    context: async ({ request }) => {
      const headers = request.headers;
      const projectToken = getHeader(headers, "X-Project-Token");
      const authorization = getHeader(headers, "Authorization");

      // Extract user info from gateway headers for session
      const userId = getHeader(headers, "X-User-Id");
      const userRole = getHeader(headers, "X-User-Role");
      const userEmail = getHeader(headers, "X-User-Email");
      const userName = getHeader(headers, "X-User-Name");

      validateProjectToken(projectToken, env.PROJECT_TOKEN);

      const accessToken = getAccessToken(authorization);

      let sessionUser: SessionUserType = null;
      if (accessToken && userId && userRole && userEmail && userName) {
        sessionUser = {
          id: userId,
          role: userRole === "ADMIN" ? Role.Admin : Role.User,
          email: userEmail,
          name: userName,
        };
      }

      // Create service APIs
      const { authAPI, userAPI, kvStorageAPI } = createAPIs({ db, env, sessionUser });

      // Verify security headers
      const { nonceKey, noncetimestamp } = await verifySecurityHeaders(headers, env, kvStorageAPI);

      return {
        jwtSecret: env.JWT_SECRET,
        accessToken,
        sessionUser,
        apis: {
          authAPI,
          userAPI,
          kvStorageAPI,
        },
        nonceKey,
        noncetimestamp,
      };
    },
  });
  // ✅ Ensure CORS Headers Are Set on the Response
  const response = await yoga.fetch(request);
  return addCORSHeaders(request, response, env);
}
