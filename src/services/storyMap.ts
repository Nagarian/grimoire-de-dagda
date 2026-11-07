import { books } from 'services/books'
import type { ChapterId } from 'services/chapterDsl'
import {
  getBookData,
  getBookIdFromChapterId,
  toChapterId,
} from 'services/bookData'
import type { StoryPosition } from 'services/storyProgress'

export type StoryMapPathSuggestion = {
  id: string
  targetChapterId: ChapterId
  label: string
}

export function getMapPathId(targetChapterId: string): string {
  return targetChapterId
}

export function getMapPathSuggestions(
  position: StoryPosition,
): StoryMapPathSuggestion[] {
  const bookId = getBookIdFromChapterId(position.chapterId)
  const chapter = bookId
    ? getBookData(bookId).chaptersById.get(position.chapterId)
    : undefined
  if (!bookId || !chapter) {
    throw new Error(`Unknown chapter ${position.chapterId}`)
  }

  return chapter.tokens.flatMap(token => {
    if (token.kind !== 'marker' || token.key !== 'HM') {
      return []
    }

    const targetChapterId = token.args.at(0)
    if (!targetChapterId) {
      throw new Error(
        `HM marker in ${position.chapterId} must specify a chapter`,
      )
    }

    return [
      {
        id: getMapPathId(toChapterId(bookId, targetChapterId)),
        targetChapterId: toChapterId(bookId, targetChapterId),
        label: token.args.slice(1).join('.') || `Chapitre ${targetChapterId}`,
      },
    ]
  })
}

export function getAllMapPathIds(): Set<string> {
  return new Set(
    books.flatMap(book =>
      getBookData(book.id).chapters.flatMap(chapter =>
        chapter.tokens.flatMap(token => {
          if (token.kind !== 'marker' || token.key !== 'HM') {
            return []
          }
          const targetChapterId = token.args.at(0)
          return targetChapterId
            ? [getMapPathId(toChapterId(book.id, targetChapterId))]
            : []
        }),
      ),
    ),
  )
}
