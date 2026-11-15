# Placera — Placement Preparation Portal

Placera helps students prepare for placements: track subjects topic by topic, revise at the right time, plan backwards from an interview date, follow every application, and share the questions companies actually asked.

**Live demo:** https://placera-placement-portal.vercel.app/

## Features

- **Accounts** — email and password sign-up, sign-in and password reset. Each user's data is private to them.
- **Subjects and topics** — add a ready-made syllabus (DSA, OS, DBMS, CN, OOP, Aptitude, System Design) or your own. Tick topics off, rate your confidence from 1 to 5, and keep notes per topic.
- **Smart revision queue** — a finished topic comes back after 3, 7, 21 and 45 days (spaced repetition). "Got it" moves it to the next gap, "Shaky" brings it back tomorrow.
- **Deadline planner** — pick a date and Placera spreads your unfinished topics evenly across the days before it, keeping the last day for revision.
- **Interview pipeline** — a board with Applied, Online assessment, Interview, Offer and Rejected columns, with countdowns and notes.
- **Experience wall** — everyone on Placera can post the questions they were asked, optionally anonymously, and search by company.
- **Streaks, activity heatmap and badges** — tiers for topics finished, plus achievements for how you prepare.
- **Light and dark theme**, and a layout that works on phones.

## Tech stack

| Part | What it uses |
|---|---|
| Frontend | React 19, Vite, React Router |
| Backend | Supabase: PostgreSQL database + authentication |
| Security | PostgreSQL Row Level Security |
| Hosting | Vercel |

## How it works

There is no custom server. The React app talks to Supabase directly from the browser:

1. **Sign-in** — Supabase Auth checks the email and password and gives the browser a signed token (a JWT) that says who the user is.
2. **Every database request carries that token.** Inside PostgreSQL, `auth.uid()` returns the id of the user who made the request.
3. **Row Level Security (RLS)** — every table has a policy such as `user_id = auth.uid()`. The database itself refuses to return or change rows that belong to someone else, so it doesn't matter what the frontend code asks for.
4. **The experience wall** is the one shared feature. It is read through a database function, `experience_feed()`, which leaves out the author's id and returns the username only when the post is not anonymous.

The key in the frontend (`VITE_SUPABASE_PUBLISHABLE_KEY`) is meant to be public. It only identifies the project; RLS decides what each user can do.

Where things live:

```
supabase/
  schema.sql            all tables, security policies and functions
  tests/                SQL tests proving one user can't touch another's data
src/
  lib/                  plain JavaScript logic (no React)
    revision.js           spaced-repetition rules
    planner.js            spreads topics across days
    stats.js              streaks, heatmap, tiers, achievements
    dates.js, theme.js, supabase.js
  context/
    AuthContext.jsx       who is signed in
    DataContext.jsx       loads the user's data and holds every write
  components/           layout, medals, heatmap, small UI pieces
  pages/                one file per screen
  data/syllabi.js       the ready-made topic lists
tests/logic.test.js     unit tests for src/lib
```

## Set up your own copy

### 1. Create the database (about 5 minutes)

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste the whole of [`supabase/schema.sql`](./supabase/schema.sql) and press **Run**.
3. Open **Authentication → Sign In / Providers → Email**. For the quickest start, turn **Confirm email** off, so friends can use the app straight after signing up. (Supabase's built-in email sender only allows a few emails per hour. If you keep confirmation on, or want password-reset emails to work reliably, add your own SMTP provider under Authentication → Emails.)
4. Open **Authentication → URL Configuration**. Set **Site URL** to your Vercel address and add these **Redirect URLs** (needed for password-reset links):
   - `https://your-app.vercel.app/**`
   - `http://localhost:5173/**`
5. Open **Project Settings → API Keys** and copy the **Project URL** and the **publishable key** (`sb_publishable_...`). Never put the secret key in this project.

### 2. Run it locally

```bash
npm install
cp .env.example .env.local    # then paste your two values into .env.local
npm run dev
```

### 3. Deploy on Vercel

In your Vercel project open **Settings → Environment Variables**, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, then redeploy. `vercel.json` already makes page URLs like `/planner` work on refresh.

## Tests

```bash
npm test         # unit tests for the revision, planner and streak logic
npm run lint
```

To test the security policies, run them against a throwaway local PostgreSQL database (never your live project):

```bash
createdb placera_test
psql -d placera_test -f supabase/tests/local_auth_stub.sql
psql -d placera_test -f supabase/schema.sql
psql -d placera_test -v ON_ERROR_STOP=1 -f supabase/tests/rls_test.sql
```

## Screenshots

The screenshots in [`screenshots/`](./screenshots) are from version 1 and will be updated.
