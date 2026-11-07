import { describe, expect, it } from 'vitest'
import { getBookData } from 'services/bookData'

describe('getBookData', () => {
  it('reuses the canonical model for a book', () => {
    expect(getBookData('T01')).toBe(getBookData('T01'))
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
        returnTo: { bookId: 'T03', chapterId: '164' },
      }),
    )
    expect(chapter?.routes).toContainEqual(
      expect.objectContaining({
        kind: 'chapter',
        source: 'ro-return',
        targetChapterId: '164',
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
    const map = getBookData('T05').chaptersById.get('MAP')

    expect(tomeLink?.routes).toContainEqual(
      expect.objectContaining({
        kind: 'external-chapter',
        targetBookId: 'T04',
      }),
    )
    expect(map?.routes).toContainEqual(
      expect.objectContaining({
        kind: 'chapter',
        targetBookId: 'T05',
        targetChapterId: '76',
        hidden: false,
      }),
    )
    expect(map?.routes).toContainEqual(
      expect.objectContaining({
        kind: 'chapter',
        targetBookId: 'T05',
        hidden: true,
        source: 'map-hidden',
      }),
    )
  })
})
