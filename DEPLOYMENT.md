# Vercel Deployment Guide

## Server

1. Create a Vercel project pointing to `atomtrack-portal/server`.
2. Add environment variables:
   - `DATABASE_URL`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `JWT_SECRET`
   - `CLIENT_URL`
   - `NODE_ENV=production`
3. Run Prisma migration against the production Supabase database before switching traffic:

```bash
cd server
npm run prisma:generate
npm run prisma:migrate
```

4. Deploy with the included `server/vercel.json`.

## Client

1. Create a Vercel project pointing to `atomtrack-portal/client`.
2. Add environment variables:
   - `NEXT_PUBLIC_API_URL=https://your-backend.vercel.app`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy with the included `client/vercel.json`.

## Production Checklist

- Replace demo `JWT_SECRET` with a long random value.
- Ensure Supabase connection pooling is configured for serverless.
- Enable Supabase row-level security policies for production tables.
- Set `CLIENT_URL` on the server to the deployed frontend origin.
- Seed only non-sensitive demo data in shared environments.
