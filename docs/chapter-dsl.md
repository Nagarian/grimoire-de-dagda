# The chapter graph DSL

Each book's branching structure is stored as a plain text file in `scripts/`,
in a custom line-oriented format. `scripts/to-mermaid.ts` compiles those files
into Mermaid flowcharts (`scripts/*.mermaid`) that the app imports as raw
strings.

This document is the spec, reverse-engineered from the generator. Read it
before touching any `.txt` file in `scripts/`.

---

## The one rule that matters

**Line number equals chapter number.** Line 1 is chapter 1, line 266 is chapter
266. The parser splits on `\n` and deliberately does *not* filter empty lines —
the `.filter(line => line !== '')` call in `deserializeBookChapters` is
commented out on purpose.

Line 266 of `scripts/T02-la-confrerie-de-nuada.txt` is empty: that is chapter
266 of *La Confrérie de Nuada*, which has no outgoing paths. Deleting it would
renumber every chapter after it and silently corrupt the whole graph. Never delete, never reorder, never sort lines. To add
a chapter you append at the end; to blank one out you leave an empty line.

## Token grammar

A line is a comma-separated list of tokens. Whitespace around tokens is
trimmed, empty tokens are dropped. There are three forms:

| Form | Meaning | Example |
| --- | --- | --- |
| `<number>` | A path from this chapter to that chapter | `217` |
| `<KEY>` | Marks this chapter as a special type, carrying no arguments | `F` |
| `<KEY>-<a>.<b>.<c>` | Special type with dot-separated arguments | `RO-3.320.164` |

Parsing quirk worth knowing: the generator checks for a `-` **before** it checks
whether the token is a known keyword, and it splits on the first `-` only,
keeping just the second segment. So any token containing a dash is treated as a
special node, and `A-B-C` silently loses `C`.

A chapter can carry several special markers plus its paths on the same line.
`F,C,33,293,18,317,248` (chapter 3 of book 2) means: this chapter is a fight
*and* contains a checkbox, and leads to chapters 33, 293, 18, 317 and 248.

## Token reference

Edge behaviour below is what `scripts/to-mermaid.ts` actually emits. "default"
means one `-->` edge per argument.

| Key | Label | Shape | Arguments | Edges emitted |
| --- | --- | --- | --- | --- |
| `START` | Start | circle | none | default |
| `END` | End | double circle | none | default |
| `QQ` | Énigme | hexagon | the chapter holding the solution | `~~~` (invisible link) |
| `QS` | Solution | diamond | none | default |
| `F` | Combat | bang | none | default |
| `S` | Point de sauvegarde | cylinder | the checkpoint chapter to restore from | **none** |
| `C` | Checkbox | rectangle | none | default |
| `TC` | Cocher les checkboxes | — | one or more chapters whose checkbox to tick | **none** |
| `T01`–`T99` | Lien vers un autre tome | card | the chapter in the other book | **none** |
| `RO` | Lien vers une extension | card | `<tome>.<chapitre>.<résurrection>` | one edge to the 3rd argument |
| `RRO` | Royaume des Ombres requis | dashed card | the chapter gated behind owning the extension | default |
| `ROLOC` | RO — Localisation | circle | the localisation value to record | one edge to the 1st argument |
| `GT` | RO — Goutte du Temps | double circle | none | default |
| `ROS` | RO — passage secret | card | the RO chapter reached | **none** |

The tome key is matched by the regular expression `/T\d{2}/`, so `T04-24`
resolves even though book 4 is not registered with the generator.

"None" means the marker contributes no arrow of its own; the chapter's outgoing
paths come from the other tokens on the same line. `S-10,229,185` is chapter 66
of book 3: a savepoint that restores to chapter 10, and which leads on to 229
and 185.

### Worked examples

```
START,61,41,312,164    chapter 1 of book 1: the start node, four opening paths
F,17,287               a fight; on resolution you go to 17 or 287
QS,310                 this chapter is an enigma solution; it continues to 310
QQ-7,217               an enigma whose answer is chapter 7 (drawn as an
                       invisible link so it does not distort the layout);
                       the readable path goes to 217
C,317,256              contains a checkbox; leads to 317 and 256
TC-8.60.147,57,77,319  tick the checkboxes of chapters 8, 60 and 147,
                       then continue to 57, 77 or 319
ROS-24                 secret passage into chapter 24 of Le Royaume des Ombres
T04-24                 cross-book reference to chapter 24 of book 4
RO-3.320.164           enter the extension from book 3, chapter 320;
                       return to chapter 164 on the way out
ROLOC-12,134           record localisation 12 for the next RO visit,
                       then continue to 134
```

## How generation works

`generateMermaidDiagram` writes, in order:

1. `flowchart TD`.
2. A `classDef` for every registered type that has a class name and a style —
   including types that do not appear in the book.
3. A `mermaid-legend` subgraph, containing only the types actually used in that
   book. `StoryDisplayer`'s "scroll to legend" button targets `#mermaid-legend`.
4. A `main` subgraph labelled with the book title, holding every node
   declaration followed by every edge.

Node shape is resolved per chapter as: the shape of the **first** special token
on the line that declares one, otherwise `diamond` if the line has more than one
token, otherwise `circle`. Class names from all special tokens on the line are
joined with commas.

`chapterToSkip` (per book, in the `files` array) drops *incoming* edges to the
listed chapters. It exists to hide the "go back to the beginning" link — book 1
and the extension skip chapter `1`, books 2 and 3 skip chapter `42` — which
would otherwise connect nearly every leaf back to one node and wreck the layout.

Two things to be careful about here: `RO` and `ROLOC` read their arguments by
index (`ids[2]` and `ids[0]`) *after* `chapterToSkip` filtering has already
removed entries from the array, so a skipped argument shifts the indices and
produces a wrong or missing edge. And the `config` front-matter string built at
the top of `generateMermaidDiagram` is never concatenated into the output — the
generated files start directly at `flowchart TD`, so the diagram theme comes
from `mermaid.initialize()` in `src/components/Mermaider/index.ts` instead.

## Adding or changing a book

1. Edit or create the `.txt` file in `scripts/`.
2. Register it in the `files` array of `scripts/to-mermaid.ts` with `fileName`,
   `id`, `name` (the label shown on the `main` subgraph) and `chapterToSkip`.
3. Regenerate and commit both files:
   ```sh
   cd scripts && node to-mermaid.ts
   ```
   The generator must run from `scripts/`: it reads via
   `new URL(fileName, import.meta.url)` but writes via a path relative to the
   current working directory.
4. For it to appear in the UI, add a `?raw` import and a `books` entry in
   `src/pages/BookVisualizer.tsx`, and add the id to `BookIds` in
   `src/types/books.ts`.

`scripts/T04-la-sombre-prophetie.txt` and `scripts/E02-le-tumulus-abandonne.txt`
are `START`/`END` stubs that have not been through steps 2–4 yet.

## Failure modes

- **Unknown key.** A token like `XX-12` reaches
  `findSpecialNodeById(...)!` in the generator, which is a non-null assertion on
  `undefined`, and the script dies with a `TypeError` naming no line number. If
  a run crashes, look for a recently added dash token with an unregistered key.
- **Silent edge loss.** A path pointing at a chapter listed in `chapterToSkip`
  is dropped without warning.
- **Off-by-one.** Because line position is the only chapter identifier, a stray
  inserted or removed line shifts everything below it and the diagram will look
  plausible while being wrong.

## Two registries, one format

The token table above exists twice in the codebase, and the copies have
drifted apart:

- `scripts/to-mermaid.ts` — the `specialNodes` array. This is the one that
  generates the committed `.mermaid` files.
- `src/services/chapterType.ts` — the `specialChapter` array. A later rewrite,
  typed with `as const satisfies` so the `ChapterId` union is derived from the
  data. Nothing imports it yet.

The rewrite renamed `name` to `label` and `extractLink` to `extractPaths`,
dropped the `linkStyle` field in favour of expressing it through
`extractPaths`, and renamed every CSS class onto a `chapter-*` / `action-*` /
`requirement-*` scheme. Behaviour also changed in three places:

| Key | `to-mermaid.ts` | `chapterType.ts` |
| --- | --- | --- |
| `T\d{2}` | emits no edge | emits `===>` to each argument |
| `RO` | edge to `ids[2]` | edge to `ids.slice(-1)`, index-shift safe |
| `ROLOC` | edge to `ids[0]` | edge to every argument |

There is also an unknown-key difference: the script asserts non-null and
crashes, whereas `getChapterType` falls back to a `STORY` chapter type and never
throws. And `chapterType.ts` has a typo in one class name, `chaper-solution`.

Changing one file does not change the other. If you touch node semantics,
decide explicitly which copy you mean, and remember that only the script affects
what readers actually see until `to-mermaid.ts` is made to import from
`src/services/chapterType.ts`.
