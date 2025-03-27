import { YogaSchemaDefinition, createYoga } from "graphql-yoga";
import { drizzle } from "drizzle-orm/d1";
import { schema } from "@src/schemas";
import { addCORSHeaders } from "@src/cors-headers";
import { APIs, createAPIs, SessionUserType } from "@src/services";
import { createMetricsPlugin, createNonceStoragePlugin } from "./graphql-plugins";
import { SecurityMiddleware } from "./security-middleware";
import { Redis } from "@upstash/redis/cloudflare";

export enum Role {
  Admin = "ADMIN",
  User = "USER",
}

export interface YogaInitialContext {
  accessToken: string;
  sessionUser: SessionUserType;
  apis: APIs;
  nonceKey: string;
  noncetimestamp: string;
}

const GRAPHQL_PATH = "/graphql";

export default async function handleGraphQL(request: Request, env: Env): Promise<Response> {
  const db = drizzle(env.DB);
  const redis = Redis.fromEnv(env);
  const isDev = env.ENVIRONMENT === "DEV";
  const isNonce = env.NONCE_ENABLED === "true";

  // Instantiate security middleware
  const securityMiddleware = new SecurityMiddleware();

  const yoga = createYoga({
    schema: schema as YogaSchemaDefinition<object, YogaInitialContext>,
    cors: false, // manually added CORS headers in addCORSHeaders
    landingPage: false,
    graphqlEndpoint: GRAPHQL_PATH,
    // Nonce plugins is only active in the production and is controlled through environment variables.
    plugins: [createMetricsPlugin, ...(isNonce && !isDev ? [createNonceStoragePlugin(redis)] : [])],
    context: async ({ request }) => {
      const headers = request.headers;

      // Validate project token
      securityMiddleware.validateProjectToken(headers, env.PROJECT_TOKEN);

      // Extract access token
      const accessToken = securityMiddleware.extractAccessToken(headers);

      // Extract session user
      const sessionUser = securityMiddleware.extractSessionUser(headers);

      // Verify security headers
      const { nonceKey, noncetimestamp } = await securityMiddleware.verifySecurityHeaders(headers, env);

      // Create service APIs
      const { expenseAPI, categoryAPI } = createAPIs({ db, env, sessionUser });

      return {
        accessToken,
        sessionUser,
        apis: {
          expenseAPI,
          categoryAPI,
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
