# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tech Stack

- **Frontend:** React 19 (JSX, no TypeScript), Vite 8, Tailwind CSS v4
- **Backend/DB:** Supabase (PostgreSQL + Auth + Storage)
- **Routing:** React Router v7 (SPA, client-side only)
- **Deployment:** Vercel (SPA rewrite rule in `vercel.json`)

## Commands

```bash
npm run dev       # Start dev server with HMR
npm run build     # Production build
npm run lint      # Run ESLint
npm run preview   # Preview production build locally
```

No test runner is configured — ESLint is the only code quality tool.

## Environment Variables

Requires a `.env` file (see `.env.example`):
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Accessed in code via `import.meta.env.VITE_*`.

## Architecture

### Application Structure

This is a pure SPA — all routing is client-side via React Router. There is no Next.js, no server-side rendering, and no API routes. Supabase handles all backend operations directly from the browser using the anon key + Row Level Security.

**Routing** is defined in `src/App.jsx`. All routes under `/` are wrapped in a protected layout that requires authentication. The `/login` route handles both sign-in and first-time registration via invite token.

### Authentication Model

Authentication uses a custom ID + passcode scheme (not standard email/password):
- User IDs are stored as `{code}@it.local` in Supabase auth (e.g., `abc@it.local`)
- Sign-in calls `supabase.auth.signInWithPassword({ email: id + '@it.local', password: passcode })`
- First-time registration validates an invite token via a Supabase RPC before creating the account
- Session state lives in `src/hooks/useAuth.jsx` (React Context), which also fetches the user's role from the `user_roles` table on every auth state change

### Role & Permission System

Roles are stored in the `user_roles` table and are one of: `admin`, `lawyer`, `support`, `readonly`.

`src/hooks/usePermissions.js` maps these to a permissions object (`can.view`, `can.add`, `can.edit`, `can.delete`, `can.upload`, `can.managePeople`, `can.manageCases`, `can.manageUsers`, `can.inviteUsers`, `can.export`). Use `usePermissions()` to gate UI features — never hardcode role strings in page components.

### Database

Schema is in `supabase/migrations/001_initial_schema.sql`. Key tables:
- `incidents` — core data (category enum: `legal/mental_health/police/court/avo/other`; status enum: `documented/pending/resolved`)
- `people` — contacts involved in incidents
- `cases` — court/legal case tracking
- `documents` — file metadata (actual files go to Supabase Storage bucket `documents`)
- `user_roles` — role assignments (one per user)
- `invitations` — one-time invite tokens with auto-assigned user codes

All tables enforce Row Level Security. The helper functions `caller_has_role(role)` and `get_owner_ids()` are used across RLS policies — do not bypass RLS by using the service key in client code.

### MCP Integration

`.mcp.json` configures the Supabase MCP server for this project (`vtltttgmgjjxvaatuyxa`). When working on database changes, use the Supabase MCP tools (`mcp__Supabase__*`) to inspect tables, run SQL, and apply migrations rather than writing raw SQL manually.

### Styling

Tailwind CSS v4 is loaded via the `@tailwindcss/vite` plugin — there is no `tailwind.config.js`. The app uses a dark theme throughout:
- Background: `#0f1117`
- Text: `#e2e8f0`
- Accent: Indigo (`#6366f1` / `#818cf8`)
- Borders: `#2a2d3a`

Status colors: amber = pending, emerald = resolved, slate = documented.
