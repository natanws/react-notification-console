# react-notification-console

Operations console for [nest-notification-hub](https://github.com/natanws/nest-notification-hub):
browse notifications by status, inspect each delivery attempt, retry dead letters and send test
notifications.

Built with **React 19, TypeScript, TanStack Query and React Router**, tested with **Vitest,
Testing Library and MSW**.

> Status: work in progress. This README tracks what is already implemented.

## Getting started

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
