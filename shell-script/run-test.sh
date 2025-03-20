#!/bin/bash
# run-test.sh: Run tests concurrently for all workspaces
set -e

concurrently --kill-others \
  "cd services/user-hub && bun run test" \
  "cd services/expense-tracker && bun run test" \
  "cd gateway/mesh-hive-gateway && bun run test"
