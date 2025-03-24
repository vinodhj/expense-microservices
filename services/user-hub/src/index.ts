import handleKVSync from "./handlers/kv-sync";
import handleGraphQL from "./handlers/graphql";
import { handleCorsPreflight } from "./cors-headers";
import { userCache } from "@src/cache/in-memory-cache";

/**
 * A general rule of thumb is to have the cleanup interval be 1/2 to 1/3 of TTL.
 * With a 15-minute TTL, cleaning every 5-7 minutes would be reasonable.
 * But traffic is currently low, so cleanup interval of about 6 hours.
 * Note: If you're caching a lot of data or have high traffic -> every 30 minutes might be better.
 * Also, we might want to consider more sophisticated caching strategies.
 * such as caching large amounts of data in memory, distributed caching, or even a dedicated cache service.
 */
async function runCacheCleanup(env: Env, ctx: ExecutionContext) {
  console.log("Running scheduled cache cleanup - Expired entries");
  userCache.cleanupExpired();
  console.log("Cache cleanup completed");
}

async function runCleanCacheAll(env: Env, ctx: ExecutionContext) {
  console.log("Running scheduled cache cleanup - All entries");
  userCache.clear();
  console.log("Cache cleanup completed");
}

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
        console.log(`Unsupported cron schedule: ${controller.cron}`);
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
