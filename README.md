# Incident Tracker

A private case management web app for tracking incidents, charges, court orders, and legal documents.

## Stack

- **Frontend**: React 19 + Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Hosting**: Vercel

## Features

- **Incidents** — Log and track incidents with dates, descriptions, severity, and linked evidence
- **Charges / AVO** — Track criminal charges (status, plea, conviction) and court orders (AVO, ICO, CCO) with expiry alerts
- **Documents** — Upload and manage legal documents; attach to incidents, charges, or cases
- **Cases** — Group related incidents and documents into case files
- **Admin** — User management, role permissions, registration control, ban list

## Roles

| Role | Access |
|------|--------|
| Admin | Full access including user management |
| Manager | Create/edit/delete all records |
| Viewer | Read-only access |

## Local Development

```bash
npm install
npm run dev
```

Requires a `.env.local` file:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Database

Migrations are in `supabase/migrations/`. Run them in order against your Supabase project.

## Branch Structure

- `main` — production
- `Development` — staging / feature testing (separate environment)
