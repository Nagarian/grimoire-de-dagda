import type { BookId } from 'services/books'
import { books } from 'services/books'
import { getBookData } from 'services/bookData'
import type { StoryPosition } from 'services/storyProgress'

export type StoryMapPathSuggestion = {
  id: string
  bookId: BookId
  targetChapterId: string
  label: string
}

export function getMapPathId(bookId: BookId, targetChapterId: string): string {
  return JSON.stringify([bookId, targetChapterId])
}

export function getMapPathSuggestions(
  position: StoryPosition,
): StoryMapPathSuggestion[] {
  const chapter = getBookData(position.bookId).chaptersById.get(
    position.chapterId,
  )
  if (!chapter) {
    throw new Error(`Unknown chapter ${position.bookId}-${position.chapterId}`)
  }

  return chapter.tokens.flatMap(token => {
    if (token.kind !== 'marker' || token.key !== 'HM') {
      return []
    }

    const targetChapterId = token.args.at(0)
    if (!targetChapterId) {
      throw new Error(
        `HM marker in ${position.bookId}-${position.chapterId} must specify a chapter`,
      )
    }

    return [
      {
        id: getMapPathId(position.bookId, targetChapterId),
        bookId: position.bookId,
        targetChapterId,
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
          return targetChapterId ? [getMapPathId(book.id, targetChapterId)] : []
        }),
      ),
    ),
  )
}
