import type { ChapterType } from 'services/chapterType'
import { getChapterType } from 'services/chapterType'

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
  /** The 1-based line number, or `MAP` for the map node. */
  id: string
  tokens: ChapterToken[]
}

/**
 * Parses a book written in the chapter DSL, one chapter per line.
 *
 * Empty lines are real chapters with no outgoing path, so lines are never
 * filtered out. The MAP marker is the only non-numbered chapter identifier.
 */
export function parseBook(raw: string): Chapter[] {
  return raw.split('\n').map((line, index) => {
    const tokens = line
      .split(',')
      .map(token => token.trim())
      .filter(token => token !== '')
      .map(parseToken)
    const isMap = tokens.some(
      token => token.kind === 'marker' && token.type.id === 'MAP',
    )

    return {
      id: isMap ? 'MAP' : `${index + 1}`,
      tokens,
    }
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
