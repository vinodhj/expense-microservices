#!/bin/bash

# Default branches to ignore
PROTECTED_BRANCHES=("main" "staging" "dev" "master")

# Function to display usage information
usage() {
    echo "Usage: ./cleanup-branches.sh [options]"
    echo ""
    echo "Options:"
    echo "  -a, --all       Delete all local branches except protected branches"
    echo "  -p, --pattern   Delete branches matching a specific pattern"
    echo "  -s, --skip      Specify additional branches to protect (comma-separated)"
    echo "  -d, --dry-run   Show which branches would be deleted without actually deleting"
    echo "  -h, --help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./cleanup-branches.sh -a"
    echo "  ./cleanup-branches.sh -p 'feature/*'"
    echo "  ./cleanup-branches.sh -s 'release/2024,hotfix/critical'"
}

# Parse command-line arguments
POSITIONAL=()
ALL_BRANCHES=false
PATTERN=""
DRY_RUN=false
ADDITIONAL_PROTECTED=()

while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        -a|--all)
        ALL_BRANCHES=true
        shift
        ;;
        -p|--pattern)
        PATTERN="$2"
        shift 2
        ;;
        -s|--skip)
        IFS=',' read -r -a ADDITIONAL_PROTECTED <<< "$2"
        shift 2
        ;;
        -d|--dry-run)
        DRY_RUN=true
        shift
        ;;
        -h|--help)
        usage
        exit 0
        ;;
        *)
        POSITIONAL+=("$1")
        shift
        ;;
    esac
done

# Combine protected branches
PROTECTED_BRANCHES+=("${ADDITIONAL_PROTECTED[@]}")

# Function to check if a branch is protected
is_protected() {
    local branch="$1"
    for protected in "${PROTECTED_BRANCHES[@]}"; do
        if [[ "$branch" == "$protected" ]]; then
            return 0
        fi
    done
    return 1
}

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Delete branches based on different modes
delete_branches() {
    local branches
    
    if [[ "$ALL_BRANCHES" = true ]]; then
        # Get all local branches except current and protected
        branches=$(git branch | grep -v '\*' | grep -vE "$(printf '%s\n' "${PROTECTED_BRANCHES[@]}" | paste -sd '|' -)")
    elif [[ -n "$PATTERN" ]]; then
        # Get branches matching the pattern, excluding protected branches
        branches=$(git branch | grep "$PATTERN" | grep -v '\*' | grep -vE "$(printf '%s\n' "${PROTECTED_BRANCHES[@]}" | paste -sd '|' -)")
    else
        echo "No deletion mode specified. Use -a or -p."
        usage
        exit 1
    fi

    # Count branches
    BRANCH_COUNT=$(echo "$branches" | wc -l)
    
    # Trim whitespace
    branches=$(echo "$branches" | xargs)

    if [[ -z "$branches" ]]; then
        echo "No branches to delete."
        exit 0
    fi

    echo "Branches to be deleted:"
    echo "$branches"
    echo ""
    
    if [[ "$DRY_RUN" = true ]]; then
        echo "Dry run mode. No branches will be deleted."
        exit 0
    fi

    read -p "Are you sure you want to delete these $BRANCH_COUNT branches? (y/N) " confirm
    if [[ "$confirm" =~ ^[Yy]$ ]]; then
        echo "$branches" | xargs -n 1 git branch -D
        echo "Branches deleted successfully."
    else
        echo "Branch deletion cancelled."
    fi
}

# Run the deletion process
delete_branches