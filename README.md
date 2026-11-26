# Glance

A daily visual-perception puzzle for iPhone, Android and the web. Three quick puzzle types a day, the same set for everyone, a score, a streak and a worldwide comparison.

Built with Expo (SDK 58, Expo Router) and Supabase.

## Run it

```bash
npm install
npx expo start          # press i / a / w for iOS, Android, web
```

Without Supabase env vars the app runs fully offline and shows sample world stats. To go live, copy `.env.example` to `.env.local` and fill it in.

## Layout

| Path | What |
|---|---|
| `src/engine/` | Pure game logic: seeded puzzles, daily pick, scoring, streaks, profile. Tested with Vitest. |
| `src/app/` | Screens (Expo Router): tabs for Today, Archive, Stats, Settings; `play` and `results`. |
| `src/ui/` | Board (puzzle renderer), charts, shared components, theme. |
| `src/lib/` | Local store (AsyncStorage), API client (retries, offline queue), navigation helpers. |
| `supabase/` | Database migration and the `submit-score` edge function. |

## Checks

```bash
npm run typecheck && npx expo lint && npm test
```

CI runs the same on every push, plus a web export and `deno check` on the edge function.

## Backend

1. Create a Supabase project, then `supabase link --project-ref <ref>`.
2. `supabase db push` applies `supabase/migrations` (scores, day_stats, RLS, a pg_cron job every 10 min).
3. `supabase secrets set IP_SALT=<random string>` and `supabase functions deploy submit-score`.
4. Put the project URL and anon key in `.env.local` (and in EAS environment variables for builds).

How scoring stays honest: the server recomputes every score from the raw answers, checks the day's skills match, rejects impossible times (<150 ms), accepts one score per device per day (retries are safe), rate-limits per IP, and only accepts dates within a day of server UTC time. Clients can read `day_stats`, never raw scores.

## Build and ship

```bash
npx eas-cli@latest build --profile preview --platform all   # installable test builds
npx eas-cli@latest build --profile production
npx eas-cli@latest submit
```

## Known gaps (next milestones)

- Notifications (8:00 reminder, 9 PM streak alert): switches save, scheduling not wired yet.
- Purchases and ads are simulated; wire RevenueCat + AdMob.
- Players are anonymous device ids; add Supabase anonymous auth or Sign in with Apple before prizes or cross-device sync.
- Home-screen widgets (SwiftUI on iOS, Glance/Jetpack on Android).
- Past days on the 7-day chart use sample world means.
