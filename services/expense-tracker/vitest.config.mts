import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";
import path from "path";
import tsconfigPath from "vite-tsconfig-paths";

export default defineWorkersConfig(async () => {
  try {
    const { readD1Migrations } = await import("@cloudflare/vitest-pool-workers/config");
    // const migrations = await readD1Migrations(path.resolve(__dirname, "./db/migrations"));

    return {
      plugins: [tsconfigPath()],
      test: {
        setupFiles: [path.resolve(__dirname, "./test/apply-migrations.ts")],
        coverage: {
          provider: "istanbul" as const,
          thresholds: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
          },
        },
        poolOptions: {
          workers: {
            singleWorker: true,
            wrangler: {
              configPath: "./wrangler.jsonc",
            },
            // miniflare: {
            //   bindings: { TEST_MIGRATIONS: migrations },
            // },
          },
        },
      },
    };
  } catch (error) {
    console.error("Error in vitest config:", error);
    throw error;
  }
});
