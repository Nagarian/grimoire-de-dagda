import type { ChapterType } from 'services/chapterType'
import { getChapterType } from 'services/chapterType'

export type PathToken = {
  kind: 'path'
  target: string
}

export type MarkerToken = {
  kind: 'marker'
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
  /** The 1-based line number the chapter was parsed from. */
  id: string
  tokens: ChapterToken[]
}

/**
 * Parses a book written in the chapter DSL, one chapter per line.
 *
 * Empty lines are real chapters with no outgoing path, so lines are never
 * filtered out: the line number is the only chapter identifier there is.
 */
export function parseBook(raw: string): Chapter[] {
  return raw.split('\n').map((line, index) => ({
    id: `${index + 1}`,
    tokens: line
      .split(',')
      .map(token => token.trim())
      .filter(token => token !== '')
      .map(parseToken),
  }))
}

function parseToken(token: string): ChapterToken {
  const separator = token.indexOf('-')

  if (separator === -1) {
    const type = getChapterType(token)
    return type
      ? { kind: 'marker', type, args: [] }
      : { kind: 'path', target: token }
  }

  const type = getChapterType(token.slice(0, separator))
  if (!type) {
    return { kind: 'unknown', raw: token }
  }

  return {
    kind: 'marker',
    type,
    args: token
      .slice(separator + 1)
      .split('.')
      .filter(argument => argument !== ''),
  }
}
