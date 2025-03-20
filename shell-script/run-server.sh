#!/bin/bash
# Ensure the script stops if any command fails
set -e

# Start the services concurrently
concurrently --kill-others \
  "cd services/user-hub && bun dev" \
  "cd services/expense-tracker && bun dev"