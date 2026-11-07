import { getBookData } from 'services/bookData'
import { buildAllBooksGraph } from 'services/bookGraph'
import { books } from 'services/books'
import { describe, expect, it } from 'vitest'

describe('buildAllBooksGraph', () => {
  it('combines every registered book with globally unique chapter nodes', () => {
    const graph = buildAllBooksGraph()
    const expectedNodeCount = books.reduce(
      (count, book) => count + getBookData(book.id).chapters.length,
      0,
    )

    expect(graph.nodes).toHaveLength(expectedNodeCount)
    expect(new Set(graph.nodes.map(node => node.id)).size).toBe(
      expectedNodeCount,
    )
    expect(
      graph.nodes.every(
        node => node.bookId && node.id.startsWith(`${node.bookId}-`),
      ),
    ).toBe(true)
  })

  it('connects registered cross-book destinations', () => {
    const graph = buildAllBooksGraph()
    const extension = getBookData('E01')
    const source = extension.chapters.find(chapter =>
      chapter.routes.some(
        route =>
          route.kind === 'external-chapter' && route.targetId === 'T04-24',
      ),
    )

    expect(source).toBeDefined()
    expect(graph.edges).toContainEqual(
      expect.objectContaining({
        source: source?.id,
        target: 'T04-24',
        hidden: false,
      }),
    )
  })

  it('connects Royaume des Ombres entries to its registered start chapter', () => {
    const graph = buildAllBooksGraph()
    const tome = getBookData('T04')
    const source = tome.chapters.find(chapter =>
      chapter.routes.some(route => route.kind === 'royaume-entry'),
    )

    expect(source).toBeDefined()
    expect(graph.edges).toContainEqual(
      expect.objectContaining({
        source: source?.id,
        target: getBookData('E01').startId,
        hidden: false,
      }),
    )
  })
})
