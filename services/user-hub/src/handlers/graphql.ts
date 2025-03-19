import { YogaSchemaDefinition, createYoga } from "graphql-yoga";
import { drizzle } from "drizzle-orm/d1";
import { schema } from "@src/schemas";
import { GraphQLError } from "graphql";
import { addCORSHeaders } from "@src/cors-headers";
import { APIs, createAPIs, SessionUserType } from "@src/services";
import { Role } from "db/schema/user";
import crypto from "crypto";

export interface YogaInitialContext {
  jwtSecret: string;
  accessToken: string | null;
  sessionUser: SessionUserType;
  apis: APIs;
}

const GRAPHQL_PATH = "/graphql";

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

export default async function handleGraphQL(request: Request, env: Env): Promise<Response> {
  const db = drizzle(env.DB);
  const yoga = createYoga({
    schema: schema as YogaSchemaDefinition<object, YogaInitialContext>,
    cors: false, // manually added CORS headers in addCORSHeaders
    landingPage: false,
    graphqlEndpoint: GRAPHQL_PATH,
    context: async ({ request }) => {
      const headers = request.headers;
      const projectToken = getHeader(headers, "X-Project-Token");
      const authorization = getHeader(headers, "Authorization");
      // Extract user info from gateway headers for session
      const userId = getHeader(headers, "X-User-Id");
      const userRole = getHeader(headers, "X-User-Role");
      const userEmail = getHeader(headers, "X-User-Email");
      const userName = getHeader(headers, "X-User-Name");
      const nonce = getHeader(headers, "X-Gateway-Nonce");
      const signature = getHeader(headers, "X-Gateway-Signature");
      const timestamp = getHeader(headers, "X-Gateway-Timestamp");

      // 1. Check if all required headers are present
      if (!timestamp || !signature || !nonce) {
        throw new GraphQLError("Missing required security headers", {
          extensions: { code: "GATEWAY_UNAUTHORIZED", status: 401 },
        });
      }

      // 2. Check if nonce was used before
      const nonceKey = `nonce:${nonce}`;
      // TODO: use service and datasources for any KV operations
      const usedNonce = await env.EXPENSE_AUTH_EVENTS_KV.get(nonceKey);
      if (usedNonce) {
        throw new GraphQLError("Duplicate request", {
          extensions: { code: "REPLAY_ATTACK", status: 401 },
        });
      }

      // 3. Verify request is recent (within 5 minutes)
      const now = Date.now();
      const requestTime = parseInt(timestamp, 10);
      if (Math.abs(now - requestTime) > 5 * 60 * 1000) {
        throw new GraphQLError("Request expired", {
          extensions: { code: "REQUEST_TIMEOUT", status: 408 },
        });
      }

      // TODO: validate public operations
      // 4. Verify signature
      if (signature !== env.GATEWAY_SIGNATURE) {
        let expectedSignature;

        if (authorization) {
          // Regular authenticated request validation
          const payload = `${userId ?? ""}:${userRole ?? ""}:${timestamp}:${nonce}`;
          expectedSignature = crypto.createHmac("sha256", env.GATEWAY_SECRET).update(payload).digest("hex");
        } else {
          // Public operation signature validation
          const payload = `public:${timestamp}:${nonce}`;
          expectedSignature = crypto.createHmac("sha256", env.GATEWAY_SECRET).update(payload).digest("hex");
        }

        if (signature !== expectedSignature) {
          throw new GraphQLError("Invalid signature", {
            extensions: { code: "INVALID_SIGNATURE", status: 401 },
          });
        }
      }

      // TODO: use service and datasources for any KV operations
      // 5. Store the nonce after verification (with TTL matching your time window)
      await env.EXPENSE_AUTH_EVENTS_KV.put(nonceKey, timestamp, { expirationTtl: 5 * 60 });

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

      return {
        jwtSecret: env.JWT_SECRET,
        accessToken,
        sessionUser,
        apis: {
          authAPI,
          userAPI,
          kvStorageAPI,
        },
      };
    },
  });
  // ✅ Ensure CORS Headers Are Set on the Response
  const response = await yoga.fetch(request);
  return addCORSHeaders(request, response, env);
}
