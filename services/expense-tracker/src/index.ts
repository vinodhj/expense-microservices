import handleGraphQL from "./handlers/graphql";
import { handleCorsPreflight } from "./cors-headers";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    console.log(`Running in: ${env.ENVIRONMENT} mode`);
    const url = new URL(request.url);

    // ✅ Handle CORS Preflight Requests (OPTIONS)
    if (request.method === "OPTIONS") {
      return handleCorsPreflight(request, env);
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
