import { YogaSchemaDefinition, createYoga } from "graphql-yoga";
import { drizzle } from "drizzle-orm/d1";
import { schema } from "@src/schemas";
import { addCORSHeaders } from "@src/cors-headers";
import { APIs, createAPIs, SessionUserType } from "@src/services";
import { Role } from "db/schema/user";
import { createNonceStoragePlugin } from "./graphql-plugins";
import { SecurityMiddleware } from "./security-middleware";

export interface YogaInitialContext {
  jwtSecret: string;
  accessToken: string | null;
  sessionUser: SessionUserType;
  apis: APIs;
  nonceKey: string;
  noncetimestamp: string;
}

const GRAPHQL_PATH = "/graphql";

const getAccessToken = (authorizationHeader: string | null): string | null => {
  if (!authorizationHeader) return null;
  return authorizationHeader.replace(/bearer\s+/i, "").trim();
};

const getHeader = (headers: Headers, key: string): string | null => headers.get(key) ?? headers.get(key.toLowerCase());

export default async function handleGraphQL(request: Request, env: Env): Promise<Response> {
  const db = drizzle(env.DB);

  // Instantiate security middleware
  const securityMiddleware = new SecurityMiddleware();

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

      // Validate project token
      securityMiddleware.validateProjectToken(projectToken, env.PROJECT_TOKEN);

      const accessToken = getAccessToken(authorization);

      // Create session user if all required fields are present
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
      const { nonceKey, noncetimestamp } = await securityMiddleware.verifySecurityHeaders(headers, env, kvStorageAPI);

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
