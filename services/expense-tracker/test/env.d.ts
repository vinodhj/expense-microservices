declare module "cloudflare:test" {
  // ...or if you have an existing `Env` type...
  interface ProvidedEnv extends Env {
    DB: D1Database;
    PROJECT_TOKEN: string;
    ALLOWED_ORIGINS: string;
    TEST_MIGRATIONS: D1Migration[];
  }
}
