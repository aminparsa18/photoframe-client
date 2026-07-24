# photoframe-client

A Vue 3 + Vite + Pinia + TypeScript client for a dedicated desktop photo-frame gadget: a Raspberry Pi driving a 10-inch landscape screen, running full-screen/always-on in a kiosk browser. It's not a typical interactive webpage — no scrolling, no text selection, no cursor.

The device has three views:
- **Dashboard** (default) — live world clock, current weather, and a "Today" calendar agenda pulled from a private Google Calendar iCal feed.
- **Slideshow / album** (`/album`) — full-bleed photo slideshow with import/remove, stored locally in IndexedDB.
- **Voice assistant** — say "Hey Nick" to open a full-screen orb UI that listens for a question and answers it via the OpenAI API, spoken aloud.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Calendar agenda setup

The dashboard's "Today" panel reads events from a Google Calendar's private, read-only iCal feed — no sign-in on the device, no OAuth. Setup:

1. In Google Calendar, go to **Settings** → your calendar → **Integrate calendar** → copy the **Secret address in iCal format**. Treat this URL as a secret — anyone with it can read your calendar.
2. Create a git-ignored `.env.calendar` file in the project root:
   ```
   CALENDAR_ICS_URL=https://calendar.google.com/calendar/ical/.../private-.../basic.ics
   ```
3. Run the sync once to confirm it works:
   ```sh
   npm run sync-calendar
   ```
   This writes `calendar-data/calendar.ics`, which the dev/preview server serves same-origin at `/calendar.ics` (see the `serveCalendarIcs` plugin in `vite.config.ts`). The app never talks to Google directly — Google's feed has no CORS headers, so a browser fetch would fail; the sync script runs server-side instead.
4. On the Pi, schedule the sync on a cron job (every 15–30 min is plenty — Google's own feed is best-effort and doesn't update in real time, so polling faster doesn't buy freshness):
   ```
   */20 * * * * cd /path/to/photoframe-client && node --env-file-if-exists=.env.calendar scripts/sync-calendar.mjs >> calendar-data/sync.log 2>&1
   ```

Until `calendar-data/calendar.ics` exists, the panel shows "Calendar not connected yet."

## Voice assistant setup

Saying "Hey Nick" opens the assistant view, listens for a question, and sends it to the OpenAI Chat Completions API (`gpt-4o-mini`, streamed), then reads the reply aloud with the browser's speech synthesis. Setup:

1. Create an API key at [platform.openai.com](https://platform.openai.com/api-keys).
2. Add it to the git-ignored `.env.local` file in the project root (already scaffolded, just fill in the value):
   ```
   VITE_OPENAI_API_KEY=sk-...
   ```
3. Restart `npm run dev` so Vite picks up the new env var.

The key is bundled into the client-side JS and called directly from the browser — acceptable here since this is a single-user local kiosk, not a public-facing app. Don't reuse this pattern for anything with untrusted visitors.

Without a key configured, the assistant view still opens on the wake word but shows an error after listening, since the OpenAI request fails immediately.
