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

| Variable | Required? | Value |
|----------|-----------|-------|
| `DATABASE_URL` | **Yes** | Auto-set by Vercel PostgreSQL, or your own PG connection string |
| `DIRECT_URL` | **Yes** | Auto-set by Vercel PostgreSQL; needed for connection pooling |
| `OWNER_BOOTSTRAP_TOKEN` | **Yes** | A long random string. **Without this you cannot reach the owner panel.** See below. |
| `OWNER_WHATSAPP_NUMBER` | Recommended | Receiving number, international format, no `+` (e.g. `923001234567`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Your Supabase project URL (has a fallback) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Publishable anon key (has a fallback) |

> There is no `NEXTAUTH_URL`. This app does not use NextAuth — authentication is
> custom and cookie-based.

### 4. Owner access — read this before you deploy

**The owner panel has no password login.** This is deliberate:

- `managementLogin` refuses `OWNER` accounts and returns "Invalid credentials".
- The development-only auth bypass in `src/lib/ownerAuth.ts` is disabled whenever
  `NODE_ENV=production`.

The only way in is a **bootstrap token**:

```bash
# Generate one
openssl rand -hex 32
```

Set it as `OWNER_BOOTSTRAP_TOKEN` in Vercel, deploy, then visit:

```
https://<your-domain>/api/mk-bootstrap?token=<OWNER_BOOTSTRAP_TOKEN>
```

That sets a 7-day httpOnly `owner_session` cookie and redirects to the panel. The
route returns 404 for any wrong token so it cannot be discovered.

**If `OWNER_BOOTSTRAP_TOKEN` is unset in production, the owner panel is
unreachable** — you would have to set it and redeploy. This is the single most
common way to lock yourself out of this deployment.

The token must also match an existing account: the bootstrap route looks for an
`Agent` with `role: "OWNER"` and `status: "ACTIVE"`. The seed creates one — see
the warning about its password below.

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

Then verify the two things that are easy to get wrong:

5. **Owner access.** Visit
   `https://<your-domain>/api/mk-bootstrap?token=<OWNER_BOOTSTRAP_TOKEN>`.
   You should be redirected to the owner panel. If you get a 404, either the token
   does not match `OWNER_BOOTSTRAP_TOKEN`, or no `ACTIVE` owner account exists in
   the database. If you are redirected to `/mk-agents`, the session cookie was not
   accepted.

6. **Settings actually save.** Open **Control Room → Settings**, change the site
   name, and press Save. Confirm a success toast appears *and* that the value is
   still there after a reload.

   This check exists for a reason: `saveSettings` was previously declared with the
   wrong parameter list for `useActionState`, so every save failed silently and no
   setting had ever been persisted. That is fixed, but any values entered in the
   admin panel *before* this deployment will not be present — every setting will be
   at its default until you set it again.

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

- **Never commit `.env` files** - they're in `.gitignore`. `.env.example` *is*
  committed (via a `!.env.example` negation) because it is the only record of which
  variables the app needs.
- **Always set `DATABASE_URL`, `DIRECT_URL` and `OWNER_BOOTSTRAP_TOKEN`** in Vercel
  environment variables. The third one is the one people forget.
- **Run `npx prisma generate`** after any schema changes.
- **The `replace_theme.js` script** can be run once to fix theme CSS classes if needed.

### ⚠️ Change the seeded owner password

`prisma/seed.ts` creates an owner account with the hardcoded password `admin123`:

```ts
const ownerPasswordHash = await argon2.hash('admin123');
```

It is not directly exploitable — the sign-in form refuses `OWNER` accounts, so the
password alone gets nobody in. But it is still a well-known credential on a
privileged row, and it should not survive contact with production. Reset it after
seeding:

```bash
# Replace with a real password before running against production
npx tsx -e "
  import('argon2').then(async (argon2) => {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.agent.update({
      where: { username: 'owner' },
      data: { passwordHash: await argon2.hash(process.env.NEW_OWNER_PASSWORD) },
    });
    await prisma.\$disconnect();
  });
"
```

Or change the seed to read the password from an environment variable rather than
hardcoding it.

### Two settings that change live behaviour

Both are in **Control Room → Settings** and both are **off by default**:

- **Maintenance mode** — rewrites public storefront routes to a maintenance screen.
  The control room, agent workstation and support page stay reachable, so you can
  always switch it back off.
- **Device binding enforcement** — refuses a customer sign-in from a device other
  than the one bound to their account. **There is no self-service reset**: turning
  this on immediately locks out every existing customer who has cleared their
  cookies or changed hardware, until you reset their binding from their customer
  page. Read the warning on the setting before enabling it.
