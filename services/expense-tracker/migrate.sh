#!/bin/bash

# Loop through each file in the migrations folder
for file in ./db/migrations/*; do
    # Check if the file is a regular file
    if [ -f "$file" ]; then
        # Execute migration for the current file
        echo "Executing migration for $file"
        npx wrangler d1 execute DB --persist-to=.db-local --local --file="$file"
    fi
done