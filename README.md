# AtomTrack Portal

AtomTrack is a full-stack goal planning, approval, quarterly check-in, and reporting portal.

## Stack

- Client: Next.js 15 App Router, React 18, TypeScript, Tailwind, shadcn-style UI, Zustand, Axios, Supabase client
- Server: Express, TypeScript, Prisma, PostgreSQL/Supabase, JWT auth, Zod validation, ExcelJS, PDFKit

## Quick Start

### 1. Install dependencies

```bash
cd server
npm install

cd ../client
npm install
```

### 2. Configure environment

Copy both examples:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env.local
```

Set `DATABASE_URL`, Supabase keys, and a strong `JWT_SECRET`.

### 3. Prepare the database

```bash
cd server
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

Seed login:

- Admin: `admin@atomtrack.test`
- Password: `Password@123`

The seed creates 1 admin, 3 managers, 10 employees assigned to managers, and an active 2025 cycle.

### 4. Run locally

```bash
cd server
npm run dev
```

In another terminal:

```bash
cd client
npm run dev
```

Open `http://localhost:3000`.

## Main Routes

Server:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/goals`
- `GET /api/goals`
- `POST /api/goals/submit`
- `GET /api/manager/team-goals`
- `PUT /api/manager/goals/:id/approve`
- `PUT /api/manager/goals/:id/reject`
- `POST /api/checkins`
- `POST /api/admin/cycles`
- `GET /api/admin/completion-dashboard`
- `GET /api/reports/achievement-export`
- `GET /api/reports/completion-report`

Client:

- `/login`
- `/register`
- `/employee`
- `/employee/goals/create`
- `/employee/checkins`
- `/manager`
- `/manager/approvals`
- `/admin`
- `/admin/cycles`
- `/admin/users`
- `/admin/reports`

## Validation Rules Implemented

- Maximum 8 goals per employee per active cycle
- Goal weightage must be 10 to 100
- Submission requires total weightage exactly 100
- Draft-only employee edits and deletes
- Manager review supports inline edits, approve, reject with comment
- Approval locks the goal sheet
- Admin unlock creates an audit log
- Check-ins are blocked after the active quarterly window closes

## Notes

The UI components are committed locally in `client/components/ui` in shadcn-compatible style. You can still run `npx shadcn@latest add ...` later if you want to replace them with generated upstream versions.
