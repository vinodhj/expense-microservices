import { YogaSchemaDefinition, createYoga } from "graphql-yoga";
import { drizzle } from "drizzle-orm/d1";
import { schema } from "@src/schemas";
import { GraphQLError } from "graphql";
import { addCORSHeaders } from "@src/cors-headers";
import { Env } from "@src/index";
import { APIs, createAPIs, SessionUserType } from "@src/services";
import { Role } from "db/schema/user";

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
      extensions: { code: "UNAUTHORIZED" },
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
