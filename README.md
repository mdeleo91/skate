# Skate 🛼

A weight-loss and fitness app built entirely around inline skating.

Most fitness apps file skating under "generic cardio." Skate flips that: skating *is* the
experience. Calorie counting, workout planning, programs, gear, and progress are all designed
around becoming a stronger, healthier skater. The goal isn't to lose weight — it's to become a
better skater. The weight loss follows.

The tone is deliberately encouraging rather than obsessive. Instead of "did you lose weight
today?" the app asks: did you get outside? did you move? did you build consistency?

## Features

- **Dashboard** — calories remaining/consumed/burned, today's skate progress, active minutes, water, weight trend, streak, next goal
- **Skate tracking** — 9 disciplines (Outdoor Fitness, Trail, Urban, Speed Training, Aggressive, Hockey, Freestyle, Commute, Recovery), each with its own MET-based calorie model and headline stats
- **Live skate screen** — real GPS via the browser Geolocation API (speed, distance, elevation, calories, laps, pause/resume/finish), with a simulated demo mode fallback
- **GPS route tracking** — recorded traces, post-skate highlights, personal records, route history
- **Lifetime stats** — total miles, hours, calories, workouts, longest skate, fastest speed, pace, active days, streaks
- **Guided programs** — 10 structured plans combining skating, strength, and recovery
- **Nutrition** — food search, restaurant database, recipe builder, saved meals, favorites, meal history, full macro tracking, water intake
- **Weight tracking** — trend-line graphs that emphasize the trend over daily noise, BMI, body fat, measurements
- **Progress photos** — front/side/back, month-over-month comparison (stored locally)
- **Activity calendar** — skate / strength / recovery / rest days at a glance
- **Achievements** — distance, fitness, weight-loss, and consistency milestones
- **Challenges** — weekly and monthly targets
- **Gear tracker** — boots, frames, wheels, bearings, protective gear with auto-logged mileage and replacement estimates
- **Weather** — live open-meteo forecast with a "skate score" that answers *is it a good day to skate?*

## Stack

Vite · React 18 · React Router · Tailwind CSS · Supabase Auth · installable PWA

## Install it on your phone

Skate is a Progressive Web App — it installs to your home screen and runs full screen,
with GPS, no app store involved.

- **iPhone / iPad:** open the site in **Safari** → tap **Share** → **Add to Home Screen** → **Add**.
- **Android:** open in **Chrome** → tap **Install app** (in the app's Profile screen, or the ⋮ menu).

The service worker caches the app shell, so it opens instantly and still loads if you lose
signal mid-trail. It deliberately never caches Supabase auth or the weather API — those
always go to the network.

## Auth

Real email/password auth via Supabase, with session persistence and protected routes.
If the Supabase env vars are absent the app gracefully falls back to a local **demo mode** so it
still loads and works.

## Local development

```bash
npm install
cp .env.example .env
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

## Environment variables

| Variable | Description |
| --- | --- |
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key (safe for browsers; protected by RLS) |

## Data

New accounts start **completely empty** — no seeded workouts, weigh-ins or gear. Every screen has a
first-run empty state that points at the next useful action instead of showing a fake zero.
Example data is opt-in from **Profile → Load sample data**, and can be cleared again at any time.

User data (workouts, meals, weights, photos, gear) persists to `localStorage`, keyed by Supabase
user id. Every collection is shaped like a future Postgres row (`id`, `date`, typed fields) so
moving it into Supabase tables is a mapping exercise rather than a rewrite.

## Known stubs

- **Barcode scanner** — UI and flow exist; needs a barcode-decoding library plus a hosted product database
- **Heart rate** — displayed on the live screen, simulated in demo mode; needs a Web Bluetooth HR strap integration
- **Food & restaurant data** — a curated sample set, not a full nutrition API
- **Route maps** — rendered as SVG traces from GPS points, not tiled basemaps
