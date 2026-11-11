import type { BookId, Book } from 'services/books'
import { books, getBook } from 'services/books'
import type {
  Chapter,
  ChapterId,
  ChapterToken,
  MarkerToken,
} from 'services/chapterDsl'
import { parseBook } from 'services/chapterDsl'
import type { ChapterPath } from 'services/chapterType'

export type BookRoute =
  | {
      kind: 'chapter'
      targetId: string
      hidden: boolean
      source: 'path' | 'marker' | 'map' | 'map-hidden' | 'ro-return'
      mapLabelId?: string
    }
  | {
      kind: 'external-chapter'
      targetId: string
      source: 'tome' | 'royaume-secret'
    }
  | {
      kind: 'royaume-entry'
      deathPosition: string
      returnTo: string
    }

export type BookChapter = Chapter & {
  routes: BookRoute[]
}

export type BookData = {
  id: BookId
  category: Book['category']
  chapterToSkip: readonly string[]
  chapters: BookChapter[]
  chaptersById: ReadonlyMap<string, BookChapter>
  startId: ChapterId | ''
  endIds: ChapterId[]
}

const loadedBooks = new Map<BookId, BookData>()

/**
 * Parses and normalizes a book once. Both the story progresser and visualizer
 * reuse this model for the lifetime of the app session.
 */
export function getBookData(id: BookId): BookData {
  const cached = loadedBooks.get(id)
  if (cached) {
    return cached
  }

  const book = getBook(id)
  const chapters = parseBook(book.content, book.id)
  const model = createBookData(book, chapters)
  loadedBooks.set(id, model)
  return model
}

export function isBookId(value: string): value is BookId {
  return books.some(book => book.id === value)
}

export function toChapterId(bookId: BookId, chapterNumber: string): ChapterId {
  return `${bookId}-${chapterNumber}`
}

export function getBookIdFromChapterId(chapterId: string): BookId | undefined {
  return books.find(book => chapterId.startsWith(`${book.id}-`))?.id
}

export function isChapterId(value: unknown): value is ChapterId {
  if (typeof value !== 'string') {
    return false
  }
  const bookId = getBookIdFromChapterId(value)
  return bookId !== undefined && getBookData(bookId).chaptersById.has(value)
}

function createBookData(book: Book, parsedChapters: Chapter[]): BookData {
  const chapters: BookChapter[] = parsedChapters.map(chapter => ({
    ...chapter,
    routes: chapterRoutes(chapter, book.id),
  }))
  const mapChapter = chapters.find(chapter =>
    chapter.tokens.some(
      token => token.kind === 'marker' && token.type.id === 'MAP',
    ),
  )

  if (mapChapter) {
    const hiddenTargets = new Map(
      parsedChapters.flatMap(chapter =>
        chapter.tokens
          .filter(isMarker)
          .filter(marker => marker.key === 'HM')
          .flatMap(marker => {
            const targetChapterId = marker.args.at(0)
            return targetChapterId
              ? [
                  [
                    toChapterId(book.id, targetChapterId),
                    marker.args.slice(1).join('.') || undefined,
                  ] as const,
                ]
              : []
          }),
      ),
    )
    mapChapter.routes.push(
      ...[...hiddenTargets].map(([targetChapterId, mapLabelId]): BookRoute => ({
        kind: 'chapter',
        targetId: targetChapterId,
        hidden: true,
        source: 'map-hidden',
        ...(mapLabelId !== undefined && { mapLabelId }),
      })),
    )
  }

  const chapterById = new Map(
    chapters.map(chapter => [chapter.id, chapter] as const),
  )

  return {
    id: book.id,
    category: book.category,
    chapterToSkip: book.chapterToSkip,
    chapters,
    chaptersById: chapterById,
    startId:
      chapters.find(chapter =>
        chapter.tokens.some(
          token => token.kind === 'marker' && token.type.id === 'START',
        ),
      )?.id ?? '',
    endIds: chapters
      .filter(chapter =>
        chapter.tokens.some(
          token => token.kind === 'marker' && token.type.id === 'END',
        ),
      )
      .map(chapter => chapter.id),
  }
}

function chapterRoutes(chapter: Chapter, bookId: BookId): BookRoute[] {
  return chapter.tokens.flatMap(token => {
    if (token.kind === 'path') {
      return [
        {
          kind: 'chapter',
          targetId: toChapterId(bookId, token.target),
          hidden: false,
          source: 'path',
        } satisfies BookRoute,
      ]
    }

    if (token.kind !== 'marker') {
      return []
    }

    if (/^T\d{2}$/.test(token.key)) {
      const targetChapterId = token.args.at(0)
      return targetChapterId
        ? [
            {
              kind: 'external-chapter',
              targetId: `${token.key}-${targetChapterId}`,
              source: 'tome',
            } satisfies BookRoute,
          ]
        : []
    }

    if (token.key === 'ROS') {
      const targetChapterId = token.args.at(0)
      return targetChapterId
        ? [
            {
              kind: 'external-chapter',
              targetId: `E01-${targetChapterId}`,
              source: 'royaume-secret',
            } satisfies BookRoute,
          ]
        : []
    }

    const paths: ChapterPath[] =
      token.type.extractPaths?.(token.args) ??
      token.args.map(target => ({ target }))
    const markerRoutes = paths.map((path): BookRoute => ({
      kind: 'chapter',
      targetId: toChapterId(bookId, path.target),
      hidden: path.hidden === true,
      source:
        token.key === 'RO'
          ? 'ro-return'
          : token.key === 'MAP'
            ? 'map'
            : 'marker',
    }))

    if (token.key !== 'RO') {
      return markerRoutes
    }

    const tome = token.args.at(0)
    const deathChapterId = token.args.at(1)
    const returnChapterId = token.args.at(2)
    if (!tome || !deathChapterId || !returnChapterId) {
      return markerRoutes
    }

    const tomeId = tome.startsWith('T') ? tome : `T${tome.padStart(2, '0')}`

    return [
      ...markerRoutes,
      {
        kind: 'royaume-entry',
        deathPosition: `${tomeId}-${deathChapterId}`,
        returnTo: `${tomeId}-${returnChapterId}`,
      },
    ]
  })
}

function isMarker(token: ChapterToken): token is MarkerToken {
  return token.kind === 'marker'
}
