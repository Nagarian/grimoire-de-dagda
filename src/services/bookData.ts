import type { BookId, Book } from 'services/books'
import { books, getBook } from 'services/books'
import type { Chapter, ChapterToken, MarkerToken } from 'services/chapterDsl'
import { parseBook } from 'services/chapterDsl'
import type { ChapterPath } from 'services/chapterType'

export type BookPosition = {
  bookId: string
  chapterId: string
}

export type BookRoute =
  | {
      kind: 'chapter'
      targetBookId: BookId
      targetChapterId: string
      hidden: boolean
      source: 'path' | 'marker' | 'map' | 'ro-return'
    }
  | {
      kind: 'external-chapter'
      targetBookId: string
      targetChapterId: string
      source: 'tome' | 'royaume-secret'
    }
  | {
      kind: 'royaume-entry'
      deathPosition: BookPosition
      returnTo: BookPosition
    }

export type BookChapter = Chapter & {
  routes: BookRoute[]
}

export type BookData = {
  id: BookId
  title: string
  category: Book['category']
  chapterToSkip: readonly string[]
  chapters: BookChapter[]
  chaptersById: ReadonlyMap<string, BookChapter>
  startId: string
  endIds: string[]
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
  const chapters = parseBook(book.content)
  const model = createBookData(book, chapters)
  loadedBooks.set(id, model)
  return model
}

export function isBookId(value: string): value is BookId {
  return books.some(book => book.id === value)
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
    const hiddenTargets = new Set(
      parsedChapters.flatMap(chapter =>
        chapter.tokens
          .filter(isMarker)
          .filter(marker => marker.key === 'HM')
          .flatMap(marker => marker.args),
      ),
    )
    mapChapter.routes.push(
      ...[...hiddenTargets].map((targetChapterId): BookRoute => ({
        kind: 'chapter',
        targetBookId: book.id,
        targetChapterId,
        hidden: true,
        source: 'map',
      })),
    )
  }

  const chapterById = new Map(chapters.map(chapter => [chapter.id, chapter]))

  return {
    id: book.id,
    title: book.title,
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
          targetBookId: bookId,
          targetChapterId: token.target,
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
              targetBookId: token.key,
              targetChapterId,
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
              targetBookId: 'E01',
              targetChapterId,
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
      targetBookId: bookId,
      targetChapterId: path.target,
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
        deathPosition: { bookId: tomeId, chapterId: deathChapterId },
        returnTo: {
          bookId: tomeId,
          chapterId: returnChapterId,
        },
      },
    ]
  })
}

function isMarker(token: ChapterToken): token is MarkerToken {
  return token.kind === 'marker'
}
