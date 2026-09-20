# ملاعبك (Mala3bak)

Football pitch discovery & booking MVP for Saudi Arabia — search/filter pitches by
size, coverage and availability, view them on a list or map, and book a slot in a
few clicks. Bilingual (Arabic default / English), RTL-aware.

## Stack

- **Next.js 16** (App Router, TypeScript) + Tailwind v4
- **Supabase** — Postgres, Auth (email + password + OTP), Storage, Row Level Security
- **next-intl** for `ar`/`en` routing and translations
- **Google Maps JS API** for the map view
- **Tap Payments** for deposit charges (mada / Apple Pay)

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Supabase (see below)
npm run dev
```

Without any Supabase credentials, the app still runs against an in-memory
demo catalog (`src/lib/data/mock.ts`) so the home page, search/filters,
pitch detail, and the slot-holding booking flow are all browsable — this is
what a preview deploy without secrets shows. Auth, real persistence, admin
role management, and owner dashboards need a live Supabase project.

### Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Run `supabase/migrations/0001_init.sql` against it (SQL editor, or the
   Supabase CLI: `supabase db push`). This creates every table, the
   `venue_public`/`pitch_public`/`pitch_rating_public` views, and all Row
   Level Security policies — including the ones that keep admin/owner
   identities out of anything a visitor can query.
3. In **Authentication → Email Templates → Confirm signup**, switch the
   template to show `{{ .Token }}` (a 6-digit code) instead of the magic
   link, so `/verify-otp` has something to verify.
4. Copy the project URL and anon key into `.env.local`. The service-role key
   is only needed for the admin dashboard's "assign role" and "list users"
   actions.
5. Promote your first account to `admin` directly in the `profiles` table —
   every other admin/owner account is created from the admin dashboard from
   there on (self-signup only ever produces `player` accounts, by design).

### Optional integrations

- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — without it, the map view shows a
  friendly placeholder instead of failing.
- `TAP_SECRET_KEY` — without it, deposit charges are simulated as
  immediately successful so the booking flow can be demoed end to end.
- `RESEND_API_KEY` — without it, booking confirmation emails are logged to
  the server console instead of sent.

## Project structure

```
src/app/[locale]/            Pages (ar/en, locale-prefixed routes)
  pitches/[id]                 Pitch detail + booking widget
  dashboard/owner              Venue owner: calendar, hours, pricing
  dashboard/admin              Super admin: venues, pitches, roles
src/app/api/                 Route handlers (slot availability, booking hold/confirm)
src/components/              UI, by feature (home, pitches, booking, auth, layout)
src/lib/data/                Server-side data access (Supabase-or-mock)
src/lib/supabase/            Browser/server/admin Supabase clients
supabase/migrations/         Schema + RLS
messages/{ar,en}.json        Translations
```

## Design notes / what's deliberately simplified for the MVP

- **Roles**: `player` (self-signup), `owner`, `admin` — the latter two are
  assigned manually from the admin dashboard, never self-serve.
- **Booking**: selecting a slot creates a 10-minute hold (`booking_holds`,
  enforced with a partial unique index so two people can't hold the same
  slot); confirming inserts into `bookings`, which also has a unique index
  on `(pitch_id, starts_at)` for `status = 'confirmed'` as a hard
  double-booking guard even if two holds race.
- **Deposits**: bookings more than `advance_booking_deposit_days` (default
  5) out require a deposit if the pitch's owner marked it `deposit_required`,
  or offer one optionally otherwise. Everything else is pay-at-venue.
- **Cancellation**: intentionally not self-service — the UI always points
  players to contact the venue directly, matching the product decision.
- **No dedicated design system for the admin/owner dashboards**: those
  screens use plain English labels/forms (Tailwind + the same UI kit) rather
  than full translation coverage, since they're internal tooling rather
  than the bilingual public-facing surface.
