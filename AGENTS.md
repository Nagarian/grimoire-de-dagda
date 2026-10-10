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

Vite 7 + React 19 + TypeScript, Chakra UI v3 for every component, and `elkjs`
for graph layout. The chapter diagram is our own SVG: nothing renders it for us,
and pan, zoom and the minimap are hand-written. Packaged as a PWA with
`vite-plugin-pwa` and deployed to GitHub Pages under the base path
`/grimoire-de-dagda/`.

Package manager is **pnpm** (`packageManager: pnpm@10.21.0`). Do not use npm or
yarn.

## Commands

| Command        | What it does                                        |
| -------------- | --------------------------------------------------- |
| `pnpm dev`     | Dev server on port 3000                             |
| `pnpm build`   | `tsc -b && vite build` — type errors fail the build |
| `pnpm lint`    | Oxlint defaults plus the React plugin               |
| `pnpm format`  | Oxfmt write over the whole repo                     |
| `pnpm preview` | Serve the production build                          |

There is **no test runner**. Do not assume `pnpm test` exists; if you need to
verify a change, `pnpm build` and `pnpm lint` are the available gates. There is
no generation step either: the book data is read at runtime.

## Layout

```
src/
  data/                       Chapter graph source, in a custom DSL — see docs/chapter-dsl.md
  services/
    books.ts                  Book registry: title, category, chapterToSkip, ?raw content
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

`App.tsx` wires three tabs: `story-progresser` (still empty), `book-visualizer`
and `settings`. Tabs use `lazyMount` + `unmountOnExit`, so page components
remount on every tab switch and must not hold state that needs to survive.

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

- The story progresser is not built. `App.tsx` renders an empty
  `Tabs.Content` for it, and `src/pages/StoryProgresser.tsx` is an orphaned
  empty shell nothing imports. There is no character sheet yet.
- `useTabs({ defaultValue: 'main' })` in `App.tsx` names a tab that does not
  exist, so no tab is selected on first load and the app opens blank.
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
- `.github/workflows/ci-cd.yml` asks `actions/setup-node` for `cache: 'pnpm'`
  without a preceding `pnpm/action-setup` step, which normally fails because
  pnpm is not yet on PATH. Verify the workflow before relying on it.

## Further reading

- `docs/chapter-dsl.md` — the chapter graph file format, token by token.
- `docs/domain.md` — the saga's vocabulary and game mechanics.
