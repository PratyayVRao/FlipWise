#!/bin/bash

# Build and deploy the application
echo "Building and deploying FlipWise..."

# Set environment variables
export SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
export SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Build and start the containers
docker-compose -f deployment.yaml up -d --build

echo "FlipWise has been deployed!"

