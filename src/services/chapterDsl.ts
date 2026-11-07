import type { ChapterType } from 'services/chapterType'
import { getChapterType } from 'services/chapterType'
import type { BookId } from 'services/books'

export type PathToken = {
  kind: 'path'
  target: string
}

export type MarkerToken = {
  kind: 'marker'
  /** The literal DSL key, e.g. `T04` for the cross-book marker type. */
  key: string
  type: ChapterType
  /** Dot-separated arguments, e.g. `['3', '320', '164']` for `RO-3.320.164`. */
  args: string[]
}

export type UnknownToken = {
  kind: 'unknown'
  raw: string
}

export type ChapterToken = PathToken | MarkerToken | UnknownToken

export type Chapter = {
  /** Globally unique book-prefixed identifier, e.g. `T01-42` or `E01-MAP`. */
  id: ChapterId
  /** The 1-based line number, or `MAP` for the map node. */
  number: string
  tokens: ChapterToken[]
}

export type ChapterId = `${BookId}-${string}`

export function getChapterNumberFromId(chapterId: string): string {
  return chapterId.slice(chapterId.indexOf('-') + 1)
}

/**
 * Parses a book written in the chapter DSL, one chapter per line.
 *
 * Empty lines are real chapters with no outgoing path, so lines are never
 * filtered out. The MAP marker is the only non-numbered chapter identifier.
 */
export function parseBook(raw: string, bookId: BookId): Chapter[] {
  return raw.split('\n').map((line, index) => {
    const tokens = line
      .split(',')
      .map(token => token.trim())
      .filter(token => token !== '')
      .map(parseToken)
    const isMap = tokens.some(
      token => token.kind === 'marker' && token.type.id === 'MAP',
    )

    const number = isMap ? 'MAP' : `${index + 1}`
    return { id: `${bookId}-${number}`, number, tokens }
  })
}

function parseToken(token: string): ChapterToken {
  const separator = token.indexOf('-')

  if (separator === -1) {
    const type = getChapterType(token)
    return type
      ? { kind: 'marker', key: token, type, args: [] }
      : { kind: 'path', target: token }
  }

  const key = token.slice(0, separator)
  const type = getChapterType(key)
  if (!type) {
    return { kind: 'unknown', raw: token }
  }

  return {
    kind: 'marker',
    key,
    type,
    args: token
      .slice(separator + 1)
      .split('.')
      .filter(argument => argument !== ''),
  }
}
