# react-notification-console

Operations console for [nest-notification-hub](https://github.com/natanws/nest-notification-hub):
browse notifications by status, inspect each delivery attempt, retry dead letters and send test
notifications.

Built with **React 19, TypeScript, TanStack Query and React Router**, tested with **Vitest,
Testing Library and MSW**.

**Live demo:** https://natanws.github.io/react-notification-console/ (runs fully in the browser
with a simulated API: no backend needed).

## Features

- **Notifications by status** (pending, processing, delivered, retrying, dead letter). The
  selected status lives in the URL, and lists poll every 5 seconds while the tab is visible.
- **Detail view** with the payload and a timeline of every delivery attempt (duration and error).
- **Retry dead letters** once the receiver is fixed; refused retries show the API error.
- **Send test notifications** with an editable `Idempotency-Key`. Sending twice with the same key
  shows the API's replay behavior instead of creating a duplicate.

## How the demo works without a backend

The API contract is implemented once as [MSW](https://mswjs.io/) handlers over an in-memory
database (`src/mocks`). The **tests** run those handlers in Node, and the **demo build**
(`VITE_DEMO=true`) answers requests in-page with MSW's `getResponse`, plus a small simulator that
advances deliveries every 2 seconds. Recipients containing `fail` behave like a broken receiver
until they are retried.

No service worker is involved, so the demo works on GitHub Pages and in embedded browsers.

## Running against the real API

```bash
VITE_API_URL=http://localhost:3000 npm run dev
```

Start [nest-notification-hub](https://github.com/natanws/nest-notification-hub) first
(`docker compose --profile app up`). The API must allow the console origin via CORS.

## Development

```bash
npm ci
npm run dev     # http://localhost:5173
npm test
```

## Development workflow

- `main` is protected: changes land through pull requests.
- CI runs on every PR: ESLint, Prettier, typecheck, tests with coverage, production build,
  [Conventional Commits](https://www.conventionalcommits.org/) on every commit and on the PR title.
- Husky runs commitlint and the fast checks locally before each commit.

## License

MIT
