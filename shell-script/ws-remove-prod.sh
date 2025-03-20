#!/bin/bash
# ws-remove-prod.sh: Removes one or more production dependencies from multiple specified workspaces.
#
# Usage:
#   ./ws-remove-prod.sh <workspace-name> [<workspace-name> ...] -- <package> [<package>...]
#
# Example:
#   ./ws-remove-prod.sh gateway user-service expense-service -- @graphql-yoga some-other-package
#
# This script treats "gateway" as a special case:
#   - It will iterate over all subdirectories within "./gateway" (useful when gateway has multiple implementations).
# Other workspaces are assumed to be located under "./services/<workspace-name>".

if [ "$#" -lt 3 ]; then
  echo "Usage: $0 <workspace-name> [<workspace-name> ...] -- <package> [<package>...]"
  exit 1
fi

workspaces=()
packages=()
separator_found=false

for arg in "$@"; do
  if [ "$arg" = "--" ]; then
    separator_found=true
    continue
  fi

  if [ "$separator_found" = false ]; then
    workspaces+=("$arg")
  else
    packages+=("$arg")
  fi
done

if [ "${#workspaces[@]}" -eq 0 ] || [ "${#packages[@]}" -eq 0 ]; then
  echo "Usage: $0 <workspace-name> [<workspace-name> ...] -- <package> [<package>...]"
  exit 1
fi

echo "Workspaces: ${workspaces[@]}"
echo "Packages to remove: ${packages[@]}"

for ws in "${workspaces[@]}"; do
  if [ "$ws" = "gateway" ]; then
    # For the "gateway" workspace, iterate over all subdirectories within the gateway folder.
    for dir in gateway/*; do
      if [ -d "$dir" ]; then
        echo "Removing packages in workspace: $dir"
        (cd "$dir" && bun remove "${packages[@]}")
      else
        echo "No directory found in $dir"
      fi
    done
  else
    ws_path="services/$ws"
    if [ -d "$ws_path" ]; then
      echo "Removing packages in workspace: $ws_path"
      (cd "$ws_path" && bun remove "${packages[@]}")
    else
      echo "Workspace directory not found: $ws_path"
    fi
  fi
done
