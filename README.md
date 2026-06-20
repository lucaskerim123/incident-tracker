# Incident Tracker

A private case management web app for logging incidents, tracking charges, managing court orders, and storing legal documents.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite, Tailwind CSS |
| Backend | Supabase (PostgreSQL, Auth, Storage) |
| Hosting | Vercel |

## Features

- **Incidents** — Log incidents with date, description, severity, people involved, outcome, and linked evidence. Attach case folder links and link directly to charges.
- **Charges** — Track criminal charges with charge number, breach type (AVO/Bail/ICO), plea, conviction status, outcome, and uploaded fact sheets.
- **Court Orders** — Manage AVOs, ICOs, and CCOs with conditions, parties, expiry dates, and expiry alerts.
- **Documents** — Upload and manage legal documents with signed secure URLs. Attach to incidents, charges, or cases.
- **Cases** — Group related incidents and documents into case files.
- **People** — Maintain profiles for involved persons including labels, legal updates, relationships, and notes.
- **Admin** — User management, role permissions, registration control, suspension/ban system, login history, and ban list.

## Roles

| Role | Access |
|------|--------|
| Admin | Full access including user management and all settings |
| Editor | Create, edit, and delete all records; manage users |
| Viewer | Read-only access to all records |
| Lawyer | Read-only access (restricted fields hidden) |

## Local Development

```bash
npm install
npm run dev
```

Create a `.env.local` file:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Database

Migrations are in `supabase/migrations/` and must be applied in order. Each file is numbered sequentially — run them against your Supabase project via the Supabase dashboard SQL editor or CLI.

## Branch Structure

- `main` — production (deploys to Vercel automatically)
- `Development` — staging and feature testing (separate Supabase + Vercel environment)
