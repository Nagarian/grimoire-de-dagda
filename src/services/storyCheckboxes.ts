import { books } from 'services/books'
import {
  getBookData,
  getBookIdFromChapterId,
  toChapterId,
} from 'services/bookData'
import type { ChapterId } from 'services/chapterDsl'
import type { StoryPosition } from 'services/storyProgress'

type StoryCheckboxBase = {
  id: string
  chapterId: ChapterId
  label: string
}

export type StoryCheckbox =
  | (StoryCheckboxBase & { kind: 'chapter' })
  | (StoryCheckboxBase & {
      kind: 'line'
      destinationChapterId: ChapterId
    })

export type StoryCheckboxSuggestion = {
  checkbox: StoryCheckbox
  source: 'TC' | 'TLC'
}

let allStoryCheckboxes: StoryCheckbox[] | undefined

export function getChapterStoryCheckboxes(
  position: StoryPosition,
): StoryCheckbox[] {
  const { bookId, chapter } = requireChapter(position)

  const checkboxes: StoryCheckbox[] = []
  if (
    chapter.tokens.some(token => token.kind === 'marker' && token.key === 'C')
  ) {
    checkboxes.push(createChapterCheckbox(position, chapter.number))
  }

  for (const token of chapter.tokens) {
    if (token.kind !== 'marker' || token.key !== 'LC') {
      continue
    }

    const targetChapter = token.args.at(0)
    if (!targetChapter) {
      throw new Error(
        `LC marker in ${position.chapterId} must specify a chapter`,
      )
    }
    const label = token.args.slice(1).join('.') || targetChapter
    checkboxes.push(
      createLineCheckbox(position, label, toChapterId(bookId, targetChapter)),
    )
  }

  assertUniqueCheckboxIds(checkboxes)
  return checkboxes
}

export function getStoryCheckboxSuggestions(
  position: StoryPosition,
): StoryCheckboxSuggestion[] {
  const { bookId, chapter } = requireChapter(position)

  const suggestions: StoryCheckboxSuggestion[] = []
  const seen = new Set<string>()

  for (const token of chapter.tokens) {
    if (token.kind !== 'marker') {
      continue
    }

    if (token.key === 'TC') {
      for (const target of token.args) {
        const checkbox = getChapterStoryCheckboxes({
          chapterId: toChapterId(bookId, target),
        }).find(candidate => candidate.kind === 'chapter')
        if (!checkbox) {
          throw new Error(
            `TC marker in ${position.chapterId} points to chapter ${target}, which has no C marker`,
          )
        }
        addSuggestion(suggestions, seen, checkbox, 'TC')
      }
    } else if (token.key === 'TLC') {
      const target = token.args.at(0)
      if (!target) {
        throw new Error(
          `TLC marker in ${position.chapterId} must specify a chapter`,
        )
      }
      const label = token.args.slice(1).join('.') || chapter.number
      const checkbox = getChapterStoryCheckboxes({
        chapterId: toChapterId(bookId, target),
      }).find(
        candidate => candidate.kind === 'line' && candidate.label === label,
      )
      if (!checkbox) {
        throw new Error(
          `TLC marker in ${position.chapterId} points to missing line checkbox ${label} in chapter ${target}`,
        )
      }
      addSuggestion(suggestions, seen, checkbox, 'TLC')
    }
  }

  return suggestions
}

export function getAllStoryCheckboxes(): readonly StoryCheckbox[] {
  if (!allStoryCheckboxes) {
    allStoryCheckboxes = books.flatMap(book =>
      getBookData(book.id).chapters.flatMap(chapter =>
        getChapterStoryCheckboxes({ chapterId: chapter.id }),
      ),
    )
  }
  return allStoryCheckboxes
}

function createChapterCheckbox(
  position: StoryPosition,
  chapterNumber: string,
): StoryCheckbox {
  const label = `Chapitre ${chapterNumber}`
  return {
    id: JSON.stringify([position.chapterId, 'chapter', label]),
    ...position,
    kind: 'chapter',
    label,
  }
}

function createLineCheckbox(
  position: StoryPosition,
  label: string,
  destinationChapterId: ChapterId,
): StoryCheckbox {
  return {
    id: JSON.stringify([position.chapterId, 'line', label]),
    ...position,
    kind: 'line',
    label,
    destinationChapterId,
  }
}

function requireChapter(position: StoryPosition) {
  const bookId = getBookIdFromChapterId(position.chapterId)
  const chapter = bookId
    ? getBookData(bookId).chaptersById.get(position.chapterId)
    : undefined
  if (!bookId || !chapter) {
    throw new Error(`Unknown chapter ${position.chapterId}`)
  }
  return { bookId, chapter }
}

function addSuggestion(
  suggestions: StoryCheckboxSuggestion[],
  seen: Set<string>,
  checkbox: StoryCheckbox,
  source: StoryCheckboxSuggestion['source'],
) {
  if (seen.has(checkbox.id)) {
    return
  }
  seen.add(checkbox.id)
  suggestions.push({ checkbox, source })
}

function assertUniqueCheckboxIds(checkboxes: StoryCheckbox[]) {
  const ids = new Set<string>()
  for (const checkbox of checkboxes) {
    if (ids.has(checkbox.id)) {
      throw new Error(
        `Duplicate checkbox label ${checkbox.label} in ${checkbox.chapterId}`,
      )
    }
    ids.add(checkbox.id)
  }
}
