# LPU Assignment & Rubric Designer

Generates LPU-compliant assignment briefs and grading rubrics from the guideline
*Designing Assignments and Assessment Rubrics in the AI Era* (Lane / AI Role Level /
Miller tier), and includes the guideline's D.1 **AI Stress Test**.

**Stack:** Next.js 16 (App Router) · Tailwind CSS 4 · Supabase (auth + Postgres with row-level
security) · Claude API · Word export via `docx` · hosted on Vercel.

## Environment variables

| Name | Where | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel + local | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Vercel + local | Public (publishable) key — safe in the browser |
| `ANTHROPIC_API_KEY` | Vercel + local | **Secret.** Server-only. Without it the app runs but generation returns "AI service not configured" |
| `ANTHROPIC_MODEL` | optional | Default `claude-opus-5` |
| `ALLOWED_EMAIL_DOMAINS` | optional | e.g. `lpu.co.in,lpu.in` to limit sign-up and AI use |
| `DAILY_GENERATION_LIMIT` / `DAILY_STRESS_TEST_LIMIT` | optional | Per-account caps per 24h (defaults 15 / 10) |

## Supabase setup

1. Create/choose a Supabase project and run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor.
2. **Authentication → URL Configuration:** add your site (e.g. `https://your-app.vercel.app/**`)
   to *Redirect URLs* so confirmation emails return to the app. (Add — don't replace — if the
   project is shared with another app.)
3. Optional: **Authentication → Providers → Email** controls whether new users must confirm
   their email.

## Run locally

```bash
npm install
cp .env.local.example .env.local   # fill in values
npm run dev
```

## Security model

- Auth: Supabase Auth, session cookies refreshed in `src/proxy.ts`; server code trusts only `getClaims()` (verified JWT).
- Data: every table has row-level security — users can only read/modify their own rows. No service-role key is used anywhere.
- AI endpoints require sign-in, honour the optional email-domain allow-list, and enforce per-account daily caps.
