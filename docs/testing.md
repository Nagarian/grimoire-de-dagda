# Testing strategy

The test suite protects the reader's navigation and persistence behavior at
three levels. Keep tests close to the code they cover and avoid relying on
private implementation details.

## Service and component tests

Vitest runs in jsdom. Use it for:

- parsing and normalizing shared book data;
- chapter choice generation, including hidden paths and cross-book routes;
- track validation, navigation history, and localStorage persistence;
- per-track checkbox state, schema migration, and checkbox suggestions;
- dice rolls, their displayed sum, and reduced-motion behavior;
- reader interactions such as choosing a chapter, undoing, and opening the
  history or manual-navigation UI.

Use React Testing Library and `user-event` for component behavior. Prefer
accessible roles and labels in queries. The coverage report includes the core
`storyProgress` and `storyNavigation` services; statements, branches, functions,
and lines each have a minimum 80% threshold.

Story Progresser component tests live alongside each component and exercise
their public props and callbacks in isolation. The page-level test is limited
to verifying composition; navigation and track workflows belong to the
individual reader, drawer, dialog, and hook tests.

Run the suite with:

```sh
pnpm test:run
pnpm test:coverage
```

## Browser tests

Playwright is reserved for behavior that depends on a real browser, including
small viewport overflow, drawer/dialog behavior, and persistence across a page
reload. These tests are local-only and are not a CI gate.

Install Chromium once, then run:

```sh
pnpm exec playwright install chromium
pnpm test:e2e
```

The Playwright configuration starts the Vite development server automatically
and targets the app at its configured GitHub Pages base path.

## Continuous integration

Pull requests targeting `main` and pushes to `main` run lint, the Vitest
coverage gate, and the production build. Only successful main-branch runs
deploy to GitHub Pages. Browser tests remain a local developer check.
