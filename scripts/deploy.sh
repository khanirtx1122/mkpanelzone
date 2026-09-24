#!/bin/bash
# Deploy script for MK Panel Zone on Vercel
# Run this locally first to push schema to Vercel DB, then deploy

echo "=== MK Panel Zone Deployment Helper ==="

# Step 1: Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate

# Step 2: Push schema to database
echo "Pushing schema to database..."
npx prisma db push

# Step 3: Run seed (optional - for initial data)
echo "Seeding database..."
npx tsx prisma/seed.ts

# Step 4: Build the project
echo "Building project..."
npx next build

echo "=== Deployment ready! Push to Vercel with: git push origin main ==="
