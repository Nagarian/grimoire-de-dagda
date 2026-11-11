# The chapter graph DSL

Each book's branching structure is stored as a plain text file in `src/data/`,
in a custom line-oriented format. The app imports those files with `?raw` and
parses them at runtime; there is no compilation step and no generated artifact.

Read this spec before touching any `.txt` file in `src/data/`.

---

## The one rule that matters

**For numbered chapters, line number equals chapter number.** Line 1 is chapter
1, line 266 is chapter 266. `parseBook` in `src/services/chapterDsl.ts` splits
on `\n` and deliberately does _not_ filter empty lines. Extraction assigns each
chapter a globally unique ID: `<book-id>-<chapter-number>`, such as `T01-1`;
the special map node is `<book-id>-MAP`. The book-local number is kept separately
for DSL references and display.

Line 266 of `src/data/T02-la-confrerie-de-nuada.txt` is empty: that is chapter
266 of _La Confrérie de Nuada_, which has no outgoing paths. Deleting it would
renumber every chapter after it and silently corrupt the whole graph. Never delete, never reorder, never sort lines. To add
a chapter you append at the end; to blank one out you leave an empty line.

## Token grammar

A line is a comma-separated list of tokens. Whitespace around tokens is
trimmed, empty tokens are dropped. There are three forms:

| Form                | Meaning                                                     | Example        |
| ------------------- | ----------------------------------------------------------- | -------------- |
| `<number>`          | A path from this chapter to that chapter                    | `217`          |
| `<KEY>`             | Marks this chapter as a special type, carrying no arguments | `F`            |
| `<KEY>-<a>.<b>.<c>` | Special type with dot-separated arguments                   | `RO-3.320.164` |

A token containing a `-` is always read as a marker: the part before the first
dash is the key, everything after it is the dot-separated argument list. An
unrecognised key is kept as an `unknown` token, which contributes no path and no
shape, so a typo degrades the diagram instead of breaking it.

A chapter can carry several special markers plus its paths on the same line.
`F,C,33,293,18,317,248` (chapter 3 of book 2) means: this chapter is a fight
_and_ contains a checkbox, and leads to chapters 33, 293, 18, 317 and 248.

## Token reference

Edge behaviour below is what `extractPaths` in `src/services/chapterType.ts`
returns. "default" means one path per argument.

| Key         | Label                       | Shape         | Arguments                                                                                               | Edges emitted                |
| ----------- | --------------------------- | ------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------- |
| `START`     | Start                       | circle        | none                                                                                                    | default                      |
| `END`       | End                         | double circle | none                                                                                                    | **none; terminal**           |
| `QQ`        | Riddle                      | hexagon       | the chapter holding the solution                                                                        | hidden path (see below)      |
| `QS`        | Solution                    | diamond       | none                                                                                                    | default                      |
| `F`         | Combat                      | bang          | none                                                                                                    | default                      |
| `S`         | Save point                  | cylinder      | the checkpoint chapter to restore from                                                                  | **none**                     |
| `C`         | Checkbox                    | rectangle     | none                                                                                                    | default                      |
| `TC`        | Check chapter checkboxes    | —             | one or more chapters whose checkbox to tick                                                             | **none**                     |
| `LC`        | Line checkbox               | —             | target chapter and optional label or localized `lc_` catalog key; defaults to the target chapter number | first argument               |
| `TLC`       | Suggest checking a line box | —             | target chapter and optional label or localized `lc_` catalog key; defaults to current chapter           | **none**                     |
| `T01`–`T99` | Cross-book link             | card          | the chapter in the other book                                                                           | **none**                     |
| `RO`        | Cross-extension link        | card          | `<volume>.<chapter>.<resurrection>`                                                                     | one path to the 3rd argument |
| `RRO`       | Shadow Realm required       | dashed card   | the chapter gated behind owning the extension                                                           | default                      |
| `ROLOC`     | Shadow Realm location       | circle        | the location value to record                                                                            | one path to the 1st argument |
| `GT`        | Time Drop                   | double circle | none                                                                                                    | default                      |
| `ROS`       | Shadow Realm secret passage | card          | the RO chapter reached                                                                                  | **none**                     |
| `M`         | Go to the world map         | —             | none                                                                                                    | visible path to `MAP`        |
| `HM`        | World map path              | —             | target chapter and optional localized `hm_` catalog key to reveal on the map                            | hidden `MAP`-to-chapter path |
| `MAP`       | World map                   | map           | none; bare numbers are map paths                                                                        | visible paths to those IDs   |

The tome key is matched by the regular expression `/^T\d{2}$/`, so `T04-24`
resolves as a cross-book reference to chapter 24 of book 4.

"None" means the marker contributes no arrow of its own; the chapter's outgoing
paths come from the other tokens on the same line. `S-10,229,185` is chapter 66
of book 3: a savepoint that restores to chapter 10, and which leads on to 229
and 185.

A **hidden path** is laid out and drawn like any other edge, but the target
chapter's label is concealed so the connection does not reveal the answer.
Searching for that chapter reveals its label. `QQ` uses one to keep an enigma's
answer concealed until the reader looks it up.

Every `END` chapter is placed at the final layout layer and has no outgoing
edges. A book may have multiple `END` chapters.

The final `MAP,...` line is assigned the book-prefixed `MAP` ID, rather than its
line number. Its bare chapter numbers create visible paths from the map. `M`
creates a visible path from its chapter to `MAP`. An `HM-<chapter>.<label>` marker
offers an action in the reader to reveal that chapter's path on the map. The
revealed paths are saved per track and become selectable from `MAP`; repeated
HM targets produce only one map choice per target.

### Worked examples

```
START,61,41,312,164    chapter 1 of book 1: the start node, four opening paths
F,17,287               a fight; on resolution you go to 17 or 287
QS,310                 this chapter is an enigma solution; it continues to 310
QQ-7,217               an enigma whose answer is chapter 7 (the edge is shown,
                       but chapter 7's label is concealed until searched);
                       the readable path goes to 217
C,317,256              contains a checkbox; leads to 317 and 256
TC-8.60.147,57,77,319  tick the checkboxes of chapters 8, 60 and 147,
                       then continue to 57, 77 or 319
LC-126.lc_shop,58      declares a line checkbox linked to chapter 126,
                       labeled from the `lc_shop` catalog entry;
                       also emits a graph path
TLC-5.lc_shop,222      suggests checking that localized line checkbox in
                       chapter 5; the reader chooses whether to check it
ROS-24                 secret passage into chapter 24 of Le Royaume des Ombres
T04-24                 cross-book reference to chapter 24 of book 4
RO-3.320.164           enter the extension from book 3, chapter 320;
                       return to chapter 164 on the way out
ROLOC-12,134           record localisation 12 for the next RO visit,
                       then continue to 134
M                      this chapter has a visible path to the map
HM-23.Le village       offer an action to reveal chapter 23 on the map
MAP,76,323             the final, non-numbered map node, with visible paths
                       to chapters 76 and 323
```

## From text to runtime model and screens

```mermaid
flowchart LR
  txt["src/data/*.txt"] -->|"?raw"| model["bookData.getBookData<br/>parse and normalize once"]
  model --> graph["bookGraph.buildGraph<br/>diagram adapter"]
  graph --> elk["graphLayout: elkjs worker"]
  elk --> svg["StoryDisplayer: SVG"]
  model --> story["storyNavigation<br/>progresser adapter"]
  story --> progress["storyProgress<br/>localStorage tracks"]
```

`getBookData` memoizes a canonical `BookData` per registered book for the app
session. It retains parsed DSL tokens and normalized semantic routes, including
hidden and cross-book routes. Both screens use this same model after page
components remount; neither screen reparses the raw text.

`buildGraph` is the diagram adapter. It turns the canonical chapters into
graph-specific nodes and edges:

- **Shape** is the shape of the **first** marker on the line that declares one;
  otherwise `diamond` when the line has more than one token, `circle` when it
  has one or none.
- **Class names** are collected from every marker on the line, so
  `F,C,33,293` is both a combat and a checkbox. Where two classes set the same
  property, the stylesheet decides, not the order on the line.
- **Paths** come from `extractPaths` per marker, plus one per bare number.
- All `END` nodes are terminal and constrained to the final layer.
- `M` paths point to the special `MAP` node. HM arguments are collected into a
  deduplicated set of hidden paths originating at `MAP`.

`chapterToSkip` (per book, in `src/services/books.ts`) drops _incoming_ paths
from the graph projection to the listed chapters. The registered books
currently have empty `chapterToSkip` lists. This graph-only filter is not used
by story navigation; it must not prevent a reader from following a real path.

The Story Progresser adapter consumes the same normalized routes. It hides
hidden paths from the normal choice list, treats `Tnn` and `ROS` as explicit
cross-book destinations, and resolves `RO` using the active track's saved
localisation and return destination. Manual jumps can target hidden paths or
any registered book/chapter. The `MAP` node is navigable; hidden `HM` routes
remain excluded from normal choices.

The Story Progresser tracks chapter checkboxes (`C`) and line checkboxes
(`LC`) per reading track. `TC` and `TLC` are suggestions only and never update
checkbox state automatically. Checkbox changes are separate from navigation
history and undo. An unlabeled `LC` uses its chapter argument as its label;
an unlabeled `TLC` uses the chapter containing the marker. For wording that
needs translation, use a stable English `snake_case` catalog key: prefix line
checkbox labels with `lc_` and use the same key in `LC` and `TLC` markers.
`HM` map labels use an `hm_` key. For example, `LC-126.lc_shop` can be
suggested by `TLC-5.lc_shop`, while `HM-23.hm_silent_clearing` resolves through
that book's `src/locales/<language>/books.json` catalog. The prefix clarifies
the wording's purpose in the catalog without duplicating entries. Do not use
periods inside keys because periods separate DSL arguments. Keep each key
stable across locales so saved checkbox state remains tied to the same
checkbox.

Placement is elkjs' `layered` algorithm, top-down, in a Web Worker. The result
is cached per book for the session. `StoryDisplayer` then draws it: one `<g>` per
chapter with an id like `chapter-T01-42`, which is what the chapter search looks
up, and one rounded polyline per path. The track history is not currently used
to highlight chapters in the diagram.

## Adding or changing a book

1. Edit or create the `.txt` file in `src/data/`.
2. Register it in the `books` array of `src/services/books.ts` with `id`,
   `title`, `category`, `chapterToSkip` and the `?raw` import as `content`, and
   add the id to the `BookId` union.

That is all: the select in `src/pages/BookVisualizer.tsx` is built from that
array, and there is nothing to regenerate.

`src/data/E02-le-tumulus-abandonne.txt` is a `START`/`END` stub that has not
been through step 2 yet.

## Failure modes

- **Unknown key.** A token like `XX-12` is parsed as an `unknown` token: it
  contributes no path and no shape, and nothing warns about it.
- **Silent graph path loss.** A path pointing at a chapter listed in
  `chapterToSkip`, or at a chapter the book does not have, is dropped from the
  graph projection. The Story Progresser shows invalid route targets as
  unavailable choices.
- **Off-by-one.** Because line position defines the book-local chapter number, a
  stray inserted or removed line shifts everything below it and the diagram
  will look plausible while being wrong.
