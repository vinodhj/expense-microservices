import handleKVSync from "./handlers/kv-sync";
import handleGraphQL from "./handlers/graphql";
import { getCorsOrigin } from "./cors-headers";

export interface Env {
  DB: D1Database;
  KV_CF_JWT_AUTH: KVNamespace;
  JWT_SECRET: string;
  PROJECT_TOKEN: string;
  KV_SYNC_TOKEN: string;
  ALLOWED_ORIGINS: string;
  EXPENSE_AUTH_EVENTS_KV: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    const allowedOrigins = env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()) : [];
    // ✅ Handle CORS Preflight Requests (OPTIONS)
    if (request.method.toUpperCase() === "OPTIONS") {
      const corsOrigin = getCorsOrigin(request, allowedOrigins);
      const headers = new Headers();

      if (corsOrigin) {
        headers.set("Access-Control-Allow-Origin", corsOrigin);
        headers.set("Access-Control-Allow-Credentials", "true");
      }

      headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
      headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, X-Project-Token, Authorization, apollographql-client-name, apollographql-client-version",
      );
      return new Response(null, { status: 204, headers });
    }

    // ✅ Handle GraphQL
    if (url.pathname === "/graphql") {
      try {
        return await handleGraphQL(request, env);
      } catch (error) {
        console.error("GraphQL Error:", error);
        return new Response(`Internal Server Error: ${error}`, { status: 500 });
      }
    }

    // ✅ Handle KV Sync
    if (url.pathname === "/kv-site-assets" && request.method === "POST") {
      try {
        return await handleKVSync(request, env);
      } catch (error) {
        return new Response(`Internal Server Error: ${error}`, { status: 500 });
      }
    }

    return new Response(
      /* HTML */ `
        <!DOCTYPE html>
        <html>
          <head>
            <title>404 Not Found</title>
          </head>
          <body>
            <h1>404 Not Found</h1>
            <p>Sorry, the page ${url.pathname !== "/" ? `(${url.pathname})` : ""} you are looking for could not be found.</p>
          </body>
        </html>
      `,
      {
        status: 404,
        headers: {
          "Content-Type": "text/html",
        },
      },
    );
  },
} as ExportedHandler<Env>;
