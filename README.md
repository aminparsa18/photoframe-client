# photoframe-client

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Run End-to-End Tests with [Playwright](https://playwright.dev)

```sh
# Install browsers for the first run
npx playwright install

# When testing on CI, must build the project first
npm run build

# Runs the end-to-end tests
npm run test:e2e
# Runs the tests only on Chromium
npm run test:e2e -- --project=chromium
# Runs the tests of a specific file
npm run test:e2e -- tests/example.spec.ts
# Runs the tests in debug mode
npm run test:e2e -- --debug
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

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
