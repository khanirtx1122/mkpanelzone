# MK Panel Zone - Deployment Guide

## Step 1: Prepare Vercel

### 1. Create a Vercel Project
```bash
# Install Vercel CLI (optional)
npm install -g vercel

# Login to Vercel
vercel login
```

### 2. Add PostgreSQL Database
Go to the Vercel Dashboard → Your Project → **Resources** → **Add** → **PostgreSQL**
- This creates a database and sets `DATABASE_URL` and `DIRECT_URL` automatically.

### 3. Set Environment Variables
In Vercel Dashboard → Your Project → **Settings** → **Environment Variables**:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | (auto-set by Vercel PostgreSQL, or your own PG connection string) |
| `DIRECT_URL` | (auto-set by Vercel PostgreSQL, needed for connection pooling) |
| `NEXTAUTH_URL` | Your deployment URL (e.g., `https://your-app.vercel.app`) |

## Step 2: Push Database Schema

### Option A: Using Vercel's built-in Prisma
If `DATABASE_URL` and `DIRECT_URL` are set via Vercel PostgreSQL:

```bash
# Push schema to your Vercel database
npx prisma db push
```

### Option B: Create and run migrations
```bash
# Create a migration
npx prisma migrate dev --create-only

# Push to production
npx prisma migrate deploy
```

## Step 3: Seed the Database

After pushing the schema, seed the initial data:

```bash
# Run the seed
npx tsx prisma/seed.ts

# Add more products
npx tsx seed-more.ts
npx tsx seed-more-9.ts
```

## Step 4: Deploy to Vercel

### Option A: Vercel CLI
```bash
# Deploy
vercel --prod
```

### Option B: Git Integration (Recommended)
1. Push your code to GitHub
2. Go to Vercel Dashboard → **Add New Project** → Import your repo
3. Vercel will auto-detect Next.js and run the build
4. Set environment variables in the dashboard

### Option C: Git Push
```bash
# Make sure .gitignore is set (it excludes .env, .vercel, node_modules)
# Commit and push
git add .
git commit -m "Deploy to Vercel"
git push origin main

# Vercel will auto-deploy from the git integration
```

## Step 5: Verify Deployment

1. Visit your Vercel URL (e.g., `https://your-app.vercel.app`)
2. Check the build logs in Vercel Dashboard
3. Verify the homepage loads with products
4. Test product pages, checkout, and dashboard

## Key Files

- `prisma/schema.prisma` - Database schema (PostgreSQL)
- `prisma/seed.ts` - Seeds initial products, packages, and users
- `seed-more.ts` - Adds additional products
- `seed-more-9.ts` - Adds more products
- `src/lib/productContent.ts` - Product metadata (images, highlights, features)
- `src/lib/prisma.ts` - Prisma client singleton
- `.env.example` - Template for environment variables
- `vercel.json` - Vercel build configuration

## Important Notes

- **Never commit `.env` files** - they're in `.gitignore`
- **Always set `DATABASE_URL` and `DIRECT_URL`** in Vercel environment variables
- **Run `npx prisma generate`** after any schema changes
- **The `replace_theme.js` script** can be run once to fix theme CSS classes if needed
