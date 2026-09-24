# MK PANEL ZONE — Project Memory

_Curated, long-lived notes about this codebase. Daily logs live alongside this file._

## Stack (as installed — do not assume newer docs)

- **Next.js 16.3.5**, App Router, Turbopack. `params` / `searchParams` are **Promises** and must be awaited.
- **React 19.2.8** — `useActionState`, `useFormStatus`, `useId`, `useTransition`.
- **Prisma 5.22.0 + PostgreSQL.** `npx prisma generate` runs via `postinstall`.
- **Tailwind CSS v4** — tokens are declared in `@theme` inside `src/app/globals.css`. There is no `tailwind.config`.
- **next-themes** with `attribute="data-theme"`, `defaultTheme="dark"`.
- **lucide-react 1.47.0** — there is **no `Youtube` export** (use `Video`). `Apple`, `MonitorSmartphone`, `ReceiptText` exist.
- No `.env` file in the repo. `NEXT_PUBLIC_SUPABASE_*` fall back to hardcoded publishable defaults in `src/lib/supabaseClient.ts`.

## Next.js 16 gotcha: `middleware` is now `proxy`

`middleware.ts` is deprecated and renamed. The file is **`src/proxy.ts`**, the exported function is named **`proxy`** (not `middleware`), it **defaults to the Node.js runtime** (so Prisma works directly), and setting the `runtime` config option **throws**. Verified against `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`.

## Next.js gotcha: `redirect()` inside `try`

`redirect()` signals by **throwing**. Calling it inside a `try` block means your own `catch` swallows it, so a **successful** save gets redirected as if it failed. Always put `revalidatePath()` + `redirect()` **after** the `try/catch`. This bug existed in all 7 admin `[id]` editors and in `managementLogin`.

## Currency

**PKR** everywhere (checkout, `submitOrder`, ProductCard, admin). Never `$`.

## Customer session model

- `auth_session` cookie = the **customer id**, httpOnly, 30-day maxAge.
- `device_token` cookie = raw token, 10-year maxAge; only its argon2 hash is stored in `CustomerDevice`.
- `agent_session` / `owner_session` = JSON `{ userId, username, role }`, httpOnly.
- **A session cookie is not proof of access.** Both `/access` and `/dashboard` re-read the customer row; the agent layout and `requireOwner()` re-read the agent row.

## Known unimplemented feature: device binding

A `device_token` is minted on **first** sign-in and stored hashed, but it is **never verified on later logins**. `DEVICE_MISMATCH` is declared in `LoginResult` yet returned by no code path. Consequently the "one account, one device" restriction is **recorded, not enforced**. Implementing it needs an owner decision — there is no self-service reset, so naive enforcement could lock paying customers out.

## Conventions established during the redesign

- One modal system: `src/components/ui/PremiumModal.tsx` (focus trap, Escape, scroll lock, focus restore, portal). No `window.confirm()` anywhere.
- One toast system: `useToast()` → `toast.success(message, description)`. The field is **`message`**, not `title`.
- One upload control: `src/components/ui/AdminMediaUploader.tsx`, with `AdminImageUploader` / `AdminVideoUploader` as thin wrappers. Real XHR upload progress — **never fabricate a percentage**.
- Admin list pages compose `PageHeader` + `StatTile`/`StatGrid` + `FilterBar` + `DataTable*` + `StatusBadge` + `EmptyState`.
- Admin forms compose `SettingsGroup` / `SettingsGrid` / `SettingsField`. `SettingsField`'s `name` is passed through untouched because `saveSettings` strips the `setting_` prefix — **renaming a field silently stops persisting that setting**.
- `ConfirmSubmit` owns its own `<form>`; `SubmitButton` is the variant for use inside an existing form.
- `TabbedForm` hides inactive panels with CSS keyed off `html[data-js="on"]`, so a no-JS visitor sees every field. Panels stay mounted, so all fields always submit.
- Owner authorization lives in `src/lib/ownerAuth.ts` → `requireOwner()`. It is bypassed when `NODE_ENV !== "production"` (there is no `.env`, so `OWNER_BOOTSTRAP_TOKEN` is unset and enforcing everywhere would lock the owner out locally). The admin header shows an amber "Dev · auth bypassed" pill when bypassed.

## Working rules for this repo

- `src/lib/ownerAuth.ts` and the `requireOwner()` guards inside every inline `"use server"` action are **load-bearing**. Preserve them verbatim.
- Never edit the same file with two parallel `Edit` calls — they silently clobber each other (one edit is lost while both report success).
- `AGENTS.md` warns that `node_modules/next/dist/docs/` is authoritative over training data for this Next.js version.
