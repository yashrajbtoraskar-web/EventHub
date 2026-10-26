# Event & Workshop Portal (Supabase version)

## 🌐 Live Demo 👉 **(https://portalwiz-eventhub-yash.vercel.app/#/)**


React + Vite frontend, Supabase (Postgres + Auth) backend.

## Setup
1. Supabase project banao. Settings → API se Project URL aur publishable key lo.
2. Authentication → Providers → Email → "Confirm email" OFF karo (demo ke liye).
3. SQL Editor mein `supabase/schema.sql` poora run karo.
4. `.env` mein URL aur key bharo (`.env.example` dekho).
5. `npm install` then `npm run dev`.

## Admin banana
1. App se `admin@eventhub.com` / `Admin@123` se signup karo.
2. SQL Editor mein schema.sql ke end wala `update profiles set role = 'admin' ...` run karo.

## Security
UI guards sirf UX ke liye hain. Asli security Row Level Security policies aur
`register_for_event` function mein hai (row lock, duplicate, full, closed checks).

## Deploy (Vercel)
Settings → Environment Variables mein `VITE_SUPABASE_URL` aur `VITE_SUPABASE_ANON_KEY` daalo, phir redeploy.
"# EventHub" 
