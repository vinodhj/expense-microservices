import handleGraphQL from "./handlers/graphql";
import { handleCorsPreflight } from "./cors-headers";
import { runCacheCleanup, runCleanCacheAll } from "./handlers/cron-scheduled";

export default {
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    // ✅ Cron Schedule Jobs
    switch (controller.cron) {
      case "0 */6 * * *":
        await runCacheCleanup(env, ctx);
        break;
      case "0 1 * * *":
        await runCleanCacheAll(env, ctx);
        break;
      default:
        console.error(`Unsupported cron schedule: ${controller.cron}`);
    }
  },
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
