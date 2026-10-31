# AGENTS.md

Companion web app for **La Saga de Dagda**, the interactive gamebook series by
Fabien Olicard. Readers use it to visualise the branching chapter graph of each
book and to keep track of their character sheet. Everything runs client-side;
there is no backend, no API and no database.

The user-facing README is French. This file and everything under `docs/` are in
English, and describe the repository as it currently is (including the parts
that are unfinished).

---

## Stack

Vite 8 + React 19 + TypeScript, Chakra UI v3 for every component, and `elkjs`
for graph layout. The chapter diagram is our own SVG: nothing renders it for us,
and pan, zoom and the minimap are hand-written. Packaged as a PWA with
`vite-plugin-pwa` and deployed to GitHub Pages under the base path
`/grimoire-de-dagda/`.

Package manager is **pnpm** (`packageManager: pnpm@12.16.1`). Do not use npm or
yarn.

## Commands

| Command        | What it does                                        |
| -------------- | --------------------------------------------------- |
| `pnpm dev`     | Dev server on port 3000                             |
| `pnpm build`   | `tsc -b && vite build` — type errors fail the build |
| `pnpm lint`    | Oxlint defaults plus the React plugin               |
| `pnpm format`  | Oxfmt write over the whole repo                     |
| `pnpm preview` | Serve the production build                          |
| `pnpm test:run` | Run Vitest and Testing Library tests                 |
| `pnpm test:coverage` | Run service tests with the 80% coverage gate   |
| `pnpm test:e2e` | Run local Playwright browser tests                  |

Vitest uses jsdom for service and component tests; Playwright covers browser
flows locally and is not a CI gate. Install its browser with
`pnpm exec playwright install chromium`. CI runs lint, Vitest with coverage,
and the production build for pull requests and main pushes. There is no
generation step: book data is read at runtime.

## Layout

```
src/
  data/                       Chapter graph source, in a custom DSL — see docs/chapter-dsl.md
  services/
    books.ts                  Book registry: title, category, chapterToSkip, ?raw content
    bookData.ts               Shared canonical model parsed from each book
    storyProgress.ts          Named tracks and localStorage persistence
    storyNavigation.ts        Reader choices and cross-book navigation
    chapterDsl.ts             Parses a .txt into chapters and tokens
    chapterType.ts            The one registry of DSL keys: label, shape, class, paths
    bookGraph.ts              Chapters to nodes and edges
    graphLayout.ts            elkjs in a Web Worker, cached per book
  components/
    StoryDisplayer/           The SVG diagram: shapes, edges, pan/zoom, minimap, legend, search
    ui/                       Chakra provider, theme system, colour mode
  pages/                      One component per tab
```

## Data flow

```mermaid
flowchart LR
  txt["src/data/*.txt<br/>chapter DSL"] -->|"?raw import"| parse["services/chapterDsl.ts"]
  parse --> graph["services/bookGraph.ts"]
  graph --> elk["services/graphLayout.ts<br/>elkjs worker"]
  elk --> disp["components/StoryDisplayer<br/>hand-written SVG"]
  disp --> panzoom["usePanZoom<br/>viewBox"]
```

`BookVisualizer` picks a book id; `StoryDisplayer` asks `getBookLayout` for its
geometry and draws it. Editing a `.txt` is visible on the next reload.

Two things to know before touching `StoryDisplayer`:

- **Layout is asynchronous and cached.** `getBookLayout` memoises one promise per
  book for the session, because a book is ~350 chapters and ~560 paths and ELK
  takes about a second over them.
- **Pan, zoom and the highlight never go through React state.** `usePanZoom`
  writes the `viewBox` attribute straight onto the SVG element and the search
  toggles a class on the chapter's `<g>`. Re-rendering a thousand SVG elements
  per pointer move would stutter. Anything mirroring the view (the minimap) uses
  `panZoom.subscribe`.

`App.tsx` wires three tabs: `story-progresser`, `book-visualizer`, and
`settings`. Tabs use `lazyMount` + `unmountOnExit`, so page components remount
on every tab switch and must not hold state that needs to survive. Story
progress is persisted in localStorage; the reader's history and track controls
live in a drawer while chapter choices stay in the main view.

## Conventions

- **Named exports only.** `export function Foo()`, never `export default`. The
  single exception is `src/components/ui/theme.ts`.
- **Absolute imports rooted at `src`** (`baseUrl: "./src"`, resolved by
  `vite-tsconfig-paths`): `components/...`, `pages/...`, `services/...`,
  `data/...`. Relative paths are only used inside a component folder, e.g.
  `./usePanZoom`.
- **`import type` is mandatory** for type-only imports (`verbatimModuleSyntax`).
- **Oxfmt**: no semicolons, single quotes, `arrowParens: avoid`, print width
  80, trailing commas. Run `pnpm format` rather than hand-formatting.
- **Chakra only.** The theme sets `strictTokens: true`, so token-backed props
  must use design tokens (`padding="2"`, `gap="4"`, `color="fg"`) and never raw
  CSS values like `padding="12px"`. Do not add Tailwind or another CSS
  framework. The one plain stylesheet is
  `components/StoryDisplayer/storyDisplayer.css`, because SVG nodes are not
  Chakra components; it reaches the theme through `var(--chakra-colors-*)`.
- **Language split**: identifiers, file names and comments are English; strings
  shown to the reader are French (`<Field.Label>Points de vie actuels</Field.Label>`).
  Keep French domain terms (énigme, dextérité, Goutte du Temps) as-is.
- TypeScript is strict, including `noUnusedLocals`, `noUnusedParameters` and
  `erasableSyntaxOnly` (no enums, no parameter properties — derive unions from
  data with `as const satisfies` instead).
- `noUncheckedIndexedAccess` is **off**, so `array[i]` is typed as present even
  when it is not. Use `array.at(i)`, which is honestly typed `T | undefined`,
  when the element may be missing.

## Known rough edges

Read these before assuming something is a bug you introduced.

- The character sheet and story progresser's character-stat features are not
  built yet.
- `src/data/T04-la-sombre-prophetie.txt` and
  `src/data/E02-le-tumulus-abandonne.txt` are `START`/`END` stubs, not
  registered in `services/books.ts` and so not offered in the UI.
- The elkjs worker is a 1.4 MB chunk of its own. That is the price of laying
  out these graphs in the browser; it is precached by the service worker.
- The books are far taller than they are wide (book 1 lays out at roughly
  4100 x 13700), so "fit" leaves wide empty margins left and right. That is the
  diagram's shape, not a bug in the framing.
- The GitHub Pages base path is `/grimoire-de-dagda/`. Absolute asset URLs like
  `/foo.svg` break in production — `index.html` still references `/vite.svg`.
- Playwright tests run locally and are intentionally not part of CI; CI runs
  lint, unit/component tests with coverage, and the production build.

## Further reading

- `docs/chapter-dsl.md` — the chapter graph file format, token by token.
- `docs/domain.md` — the saga's vocabulary and game mechanics.
- `docs/testing.md` — the test layers, coverage gate, and local browser tests.
