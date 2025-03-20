import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "./gateway/mesh-hive-gateway/vitest.config.mts",
  "./services/user-hub/vitest.config.mts",
  "./services/expense-tracker/vitest.config.mts",
]);
