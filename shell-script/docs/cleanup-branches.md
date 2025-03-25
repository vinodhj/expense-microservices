## Comprehensive bash script for Git branch cleanup

The bash shell script that makes it easier and safer to delete multiple local branches.

### Example Commands:

```bash
# Delete all local branches except main, staging, dev
./cleanup-branches.sh -a

# Delete all feature branches
./cleanup-branches.sh -p 'feature/\*'

# Add additional protected branches
./cleanup-branches.sh -a -s 'release/2024,hotfix/critical'


# Dry run to see which branches would be deleted
./cleanup-branches.sh -a -d
```

## Protected Branches:

By default, protects main, staging, and dev branches
Allows adding more protected branches via command-line option

## Deletion Modes:

- -a or --all: Delete all local branches except protected ones
- -p or --pattern: Delete branches matching a specific pattern
- -d or --dry-run: Preview branches that would be deleted without actually deleting

## Safety Features

- Prevents deletion of the current branch
- Provides a confirmation prompt before deletion
- Allows skipping specific branches

## Installation and Usage

- Save the script as cleanup-branches.sh
- Make it executable: chmod +x cleanup-branches.sh

## Recommendations:

Place this script in a central location in your home directory or project's script folder
You can easily modify the default PROTECTED_BRANCHES if needed
