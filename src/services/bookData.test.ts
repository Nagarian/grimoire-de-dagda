import { describe, expect, it } from 'vitest'
import { getBookData } from 'services/bookData'
import { books } from 'services/books'

describe('getBookData', () => {
  it('reuses the canonical model for a book', () => {
    expect(getBookData('T01')).toBe(getBookData('T01'))
  })

  it('assigns unique book-prefixed IDs across registered books', () => {
    const chapters = books.flatMap(book =>
      getBookData(book.id).chapters.map(chapter => chapter.id),
    )

    expect(new Set(chapters).size).toBe(chapters.length)
    for (const book of books) {
      expect(
        getBookData(book.id).chapters.every(chapter =>
          chapter.id.startsWith(`${book.id}-`),
        ),
      ).toBe(true)
    }
  })

  it('preserves hidden enigma paths in the canonical model', () => {
    const book = getBookData('T01')
    const chapter = book.chapters.find(chapter =>
      chapter.tokens.some(
        token => token.kind === 'marker' && token.key === 'QQ',
      ),
    )

    expect(chapter).toBeDefined()
    expect(chapter?.routes).toContainEqual(
      expect.objectContaining({ kind: 'chapter', hidden: true }),
    )
  })

  it('keeps normalized RO entry and return routes together', () => {
    const book = getBookData('T03')
    const chapter = book.chapters.find(chapter =>
      chapter.tokens.some(
        token => token.kind === 'marker' && token.key === 'RO',
      ),
    )

    expect(chapter?.routes).toContainEqual(
      expect.objectContaining({
        kind: 'royaume-entry',
        returnTo: 'T03-164',
      }),
    )
    expect(chapter?.routes).toContainEqual(
      expect.objectContaining({
        kind: 'chapter',
        source: 'ro-return',
        targetId: 'T03-164',
      }),
    )
  })

  it('retains explicit cross-book destinations and MAP destinations', () => {
    const extension = getBookData('E01')
    const tomeLink = extension.chapters.find(chapter =>
      chapter.tokens.some(
        token => token.kind === 'marker' && token.key === 'T04',
      ),
    )
    const map = getBookData('T05').chaptersById.get('T05-MAP')

    expect(tomeLink?.routes).toContainEqual(
      expect.objectContaining({
        kind: 'external-chapter',
        targetId: expect.stringMatching(/^T04-/),
      }),
    )
    expect(map?.routes).toContainEqual(
      expect.objectContaining({
        kind: 'chapter',
        targetId: 'T05-76',
        hidden: false,
      }),
    )
    expect(map?.routes).toContainEqual(
      expect.objectContaining({
        kind: 'chapter',
        targetId: expect.stringMatching(/^T05-/),
        hidden: true,
        source: 'map-hidden',
      }),
    )
  })
})
