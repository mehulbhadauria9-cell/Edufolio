# Edufolio

**Empowering Student Achievements Across All Domains**

A Midnight Academic Aurora–themed, PWA-enabled achievement ecosystem built with React + Vite, Tailwind CSS, Framer Motion, and Supabase (Postgres, Auth, Storage, Realtime, RLS, Edge Functions).

---

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Note your **Project URL** and **anon public key** (Project Settings → API). You'll also need the **service role key**, but only for the Edge Function secrets — never for the frontend.

## 2. Run the database migration

Using the Supabase CLI (recommended):

```bash
npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

This applies `supabase/migrations/0001_init.sql`, which creates:

- Enums (`user_role`, `achievement_domain`)
- Tables: `profiles`, `students`, `faculty`, `achievements`
- The `handle_new_user` trigger (auto-creates a `profiles` row as `student` on signup — privileged roles are only ever set server-side)
- The `recalc_student_points` trigger (keeps `students.total_points` in sync with `achievements`)
- The `guard_student_self_update` trigger (students can update their own avatar/handle, never their points/roll number/branch)
- The `admin_set_role` RPC (the only way to change a user's role — admin-only, cannot self-target)
- Full Row Level Security policies for every table
- The `avatars` Storage bucket with owner-only write policies
- Realtime publication for `students` and `achievements`

Alternatively, paste the contents of `supabase/migrations/0001_init.sql` into the Supabase Dashboard → SQL Editor and run it.

## 3. Deploy the Edge Function

`create-user` is the only place account creation happens. It uses the service role key **on the server only** and enforces:

- Faculty → can create `student` accounts only.
- Admin → can create `student` or `faculty` accounts.
- Nobody can create `admin` accounts through the app (see step 6).

```bash
supabase functions deploy create-user
supabase secrets set SUPABASE_URL=https://<your-project-ref>.supabase.co
supabase secrets set SUPABASE_ANON_KEY=<your-anon-key>
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

## 4. Configure Supabase Auth

In **Authentication → URL Configuration**:

- **Site URL**: `https://your-deployed-domain.com` (or `http://localhost:5173` for local dev)
- **Redirect URLs**: add both your production URL and `http://localhost:5173`, each with `/reset-password` appended, e.g. `http://localhost:5173/reset-password`

In **Authentication → Providers**, keep Email enabled. Disable public sign-ups is not required since the app never exposes a public sign-up form — all accounts are created via the Edge Function.

## 5. Environment variables

```bash
cp .env.example .env
```

Fill in only the client-safe values:

```
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

Never put `SUPABASE_SERVICE_ROLE_KEY` in this file or anywhere in frontend code.

## 6. Create your first Admin account

The app never lets anyone create an admin through the UI. Bootstrap the first one manually:

1. In Supabase Dashboard → Authentication → Users, click **Add user** and create the admin's account (or have them sign up once via the Supabase Dashboard).
2. In SQL Editor, run:
   ```sql
   update public.profiles set role = 'admin' where email = 'admin@yourcollege.edu';
   ```
3. That admin can now sign in at `/login/admin` and use **Add Faculty Account** / **Manage Roles** to provision everyone else.

## 7. Run locally

```bash
npm install
npm run dev
```

Visit `http://localhost:5173`.

## 8. Build

```bash
npm run build
npm run preview
```

## 9. Deploy

Deploy the `dist/` output to any static host (Vercel, Netlify, Cloudflare Pages). Set the same `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` as environment variables in your host's dashboard, and make sure the Supabase Auth redirect URLs include your production domain.

---

## Project structure

```
src/
├── components/
│   ├── background/   Purpose-built canvas atmospheres per page
│   ├── auth/          FormField, AuthShell
│   ├── cursor/         CustomCursor (magnetic trailing cursor)
│   ├── dashboard/      Sidebar, Metrics, AppLayout
│   ├── leaderboard/    Leaderboard, LeaderboardRow, RankBadge (SVG)
│   ├── profile/        TitleCard, AvatarUpload, AchievementTimeline, LeetCodeTracker
│   └── pwa/            InstallPrompt
├── context/AuthContext.jsx
├── lib/supabaseClient.js
├── pages/               Splash, RoleSelection, auth/*, Dashboard, StudentProfile, forms/*
├── services/accountService.js   (calls the create-user Edge Function)
└── App.jsx

supabase/
├── migrations/0001_init.sql
└── functions/create-user/index.ts
```

## Notes on security

- The **service role key never appears in frontend code**. All privileged account creation runs through the `create-user` Edge Function.
- RLS policies mean the anon/authenticated client can never write outside its role's permissions, and role changes only happen through the `admin_set_role` RPC (admin-only, cannot self-target).
- Students can update their own avatar and LeetCode handle, but a database trigger silently blocks any attempt to alter their own points, roll number, branch, or year — even if the client sends those fields.

## Accessibility & performance

- Full keyboard navigation, focus-visible states, and `Escape`-to-close on the sidebar.
- `prefers-reduced-motion` is respected throughout (cursor, backgrounds, page transitions).
- Canvas backgrounds pause when the tab is hidden and scale particle density down on smaller viewports.
- The custom cursor auto-disables on touch devices.
