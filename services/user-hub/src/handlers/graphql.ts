import { YogaSchemaDefinition, createYoga } from "graphql-yoga";
import { drizzle } from "drizzle-orm/d1";
import { schema } from "@src/schemas";
import { verifyToken } from "@src/services/helper/jwtUtils";
import { GraphQLError } from "graphql";
import { addCORSHeaders } from "@src/cors-headers";
import { Env } from "@src/index";
import { APIs, createAPIs, SessionUserType } from "@src/services";
import { KvStorageDataSource } from "@src/datasources/kv-storage";

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

export default async function handleGraphQL(request: Request, env: Env): Promise<Response> {
  const db = drizzle(env.DB);
  const yoga = createYoga({
    schema: schema as YogaSchemaDefinition<object, YogaInitialContext>,
    cors: false, // manually added CORS headers in addCORSHeaders
    landingPage: false,
    graphqlEndpoint: GRAPHQL_PATH,
    context: async () => {
      const projectToken = request.headers.get("X-Project-Token") ?? request.headers.get("x-project-token");
      const authorization = request.headers.get("Authorization") ?? request.headers.get("authorization");
      validateProjectToken(projectToken, env.PROJECT_TOKEN);

      const accessToken = getAccessToken(authorization);
      let sessionUser = null;

      if (accessToken) {
        const kvStorageDataSource = new KvStorageDataSource(env.KV_CF_JWT_AUTH);
        try {
          // TODO: jwt verify func should be called on every request, though it's expensive and performance optimizations may be needed.
          const jwtVerifyToken = await verifyToken({ token: accessToken, secret: env.JWT_SECRET, kvStorage: kvStorageDataSource });
          sessionUser = {
            id: jwtVerifyToken.id,
            role: jwtVerifyToken.role,
            email: jwtVerifyToken.email,
            name: jwtVerifyToken.name,
          };
        } catch (error) {
          console.error("Token verification failed:", error);
          const isGraphQLError = error instanceof GraphQLError;
          throw new GraphQLError(isGraphQLError ? error.message : "Invalid token", {
            extensions: {
              code: isGraphQLError ? error.extensions.code : "UNAUTHORIZED",
              error: isGraphQLError && error.extensions?.error ? error.extensions.error : error,
            },
          });
        }
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
