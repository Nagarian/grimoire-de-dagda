import type { BookId } from 'services/books'
import { books } from 'services/books'
import { getBookData } from 'services/bookData'
import type { StoryPosition } from 'services/storyProgress'

type StoryCheckboxBase = {
  id: string
  bookId: BookId
  chapterId: string
  label: string
}

export type StoryCheckbox =
  | (StoryCheckboxBase & { kind: 'chapter' })
  | (StoryCheckboxBase & {
      kind: 'line'
      destinationChapterId: string
    })

export type StoryCheckboxSuggestion = {
  checkbox: StoryCheckbox
  source: 'TC' | 'TLC'
}

export function getChapterStoryCheckboxes(
  position: StoryPosition,
): StoryCheckbox[] {
  const chapter = getBookData(position.bookId).chaptersById.get(
    position.chapterId,
  )
  if (!chapter) {
    throw new Error(`Unknown chapter ${position.bookId}-${position.chapterId}`)
  }

  const checkboxes: StoryCheckbox[] = []
  if (
    chapter.tokens.some(token => token.kind === 'marker' && token.key === 'C')
  ) {
    checkboxes.push(createChapterCheckbox(position))
  }

  for (const token of chapter.tokens) {
    if (token.kind !== 'marker' || token.key !== 'LC') {
      continue
    }

    const targetChapter = token.args.at(0)
    if (!targetChapter) {
      throw new Error(
        `LC marker in ${position.bookId}-${position.chapterId} must specify a chapter`,
      )
    }
    const label = token.args.slice(1).join('.') || targetChapter
    checkboxes.push(createLineCheckbox(position, label, targetChapter))
  }

  assertUniqueCheckboxIds(checkboxes)
  return checkboxes
}

export function getStoryCheckboxSuggestions(
  position: StoryPosition,
): StoryCheckboxSuggestion[] {
  const chapter = getBookData(position.bookId).chaptersById.get(
    position.chapterId,
  )
  if (!chapter) {
    throw new Error(`Unknown chapter ${position.bookId}-${position.chapterId}`)
  }

  const suggestions: StoryCheckboxSuggestion[] = []
  const seen = new Set<string>()

  for (const token of chapter.tokens) {
    if (token.kind !== 'marker') {
      continue
    }

    if (token.key === 'TC') {
      for (const target of token.args) {
        const checkbox = getChapterStoryCheckboxes({
          bookId: position.bookId,
          chapterId: target,
        }).find(candidate => candidate.kind === 'chapter')
        if (!checkbox) {
          throw new Error(
            `TC marker in ${position.bookId}-${position.chapterId} points to chapter ${target}, which has no C marker`,
          )
        }
        addSuggestion(suggestions, seen, checkbox, 'TC')
      }
    } else if (token.key === 'TLC') {
      const target = token.args.at(0)
      if (!target) {
        throw new Error(
          `TLC marker in ${position.bookId}-${position.chapterId} must specify a chapter`,
        )
      }
      const label = token.args.slice(1).join('.') || position.chapterId
      const checkbox = getChapterStoryCheckboxes({
        bookId: position.bookId,
        chapterId: target,
      }).find(
        candidate => candidate.kind === 'line' && candidate.label === label,
      )
      if (!checkbox) {
        throw new Error(
          `TLC marker in ${position.bookId}-${position.chapterId} points to missing line checkbox ${label} in chapter ${target}`,
        )
      }
      addSuggestion(suggestions, seen, checkbox, 'TLC')
    }
  }

  return suggestions
}

export function getAllStoryCheckboxes(): StoryCheckbox[] {
  return books.flatMap(book =>
    getBookData(book.id).chapters.flatMap(chapter =>
      getChapterStoryCheckboxes({
        bookId: book.id,
        chapterId: chapter.id,
      }),
    ),
  )
}

function createChapterCheckbox(position: StoryPosition): StoryCheckbox {
  const label = `Chapitre ${position.chapterId}`
  return {
    id: JSON.stringify([position.bookId, position.chapterId, 'chapter', label]),
    ...position,
    kind: 'chapter',
    label,
  }
}

function createLineCheckbox(
  position: StoryPosition,
  label: string,
  destinationChapterId: string,
): StoryCheckbox {
  return {
    id: JSON.stringify([position.bookId, position.chapterId, 'line', label]),
    ...position,
    kind: 'line',
    label,
    destinationChapterId,
  }
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
        `Duplicate checkbox label ${checkbox.label} in ${checkbox.bookId}-${checkbox.chapterId}`,
      )
    }
    ids.add(checkbox.id)
  }
}
