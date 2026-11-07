import { describe, expect, it } from 'vitest'
import { parseBook } from 'services/chapterDsl'

describe('parseBook', () => {
  it('creates book-prefixed IDs while preserving chapter numbers and empty lines', () => {
    const chapters = parseBook('START\n\nMAP,1', 'T01')

    expect(chapters.map(({ id, number }) => [id, number])).toEqual([
      ['T01-1', '1'],
      ['T01-2', '2'],
      ['T01-MAP', 'MAP'],
    ])
    expect(new Set(chapters.map(chapter => chapter.id)).size).toBe(3)
  })
})
