#!/bin/bash

# update-secrets.sh - Script to update Cloudflare Worker secrets

# Check if a .env.secrets file exists
if [ ! -f .env.secrets ]; then
  echo "Error: .env.secrets file not found. Please create a .env.secrets file with your secrets."
  exit 1
fi

# Load secrets from .env.secrets file
source .env.secrets

echo "Loaded secrets from .env.secrets"

# Process each line in the .env.secrets file
while IFS='=' read -r key value || [ -n "$key" ]; do
  # Skip empty lines and comments
  if [ -z "$key" ] || [[ "$key" =~ ^# ]]; then
    continue
  fi
  
  # Clean up the key and value
  key=$(echo $key | xargs)
  value=$(echo $value | xargs)
  
  # Skip if key or value is empty
  if [ -z "$key" ] || [ -z "$value" ]; then
    continue
  fi
  
  echo "Updating secret: $key"
  echo "$value" | npx wrangler secret put "$key"
  
  # Check if the command succeeded
  if [ $? -eq 0 ]; then
    echo "✓ Successfully updated $key"
  else
    echo "✗ Failed to update $key"
  fi
done < .env.secrets

echo "All secrets have been processed."