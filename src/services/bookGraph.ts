import type { BookChapter, BookData, BookRoute } from 'services/bookData'
import type { ChapterToken, MarkerToken } from 'services/chapterDsl'
import { getBookData } from 'services/bookData'
import { books, type BookId } from 'services/books'
import type {
  ChapterBadge,
  ChapterShape,
  ChapterType,
} from 'services/chapterType'
import { sortChapterTypes } from 'services/chapterType'

export type GraphNode = {
  /** Globally unique chapter identifier. */
  id: string
  /** The book-local chapter number, or `MAP` for the map node. */
  label: string
  /** Present when nodes from multiple books share one graph. */
  bookId?: BookId
  shape: ChapterShape
  classNames: string[]
  badges: ChapterBadge[]
}

export type GraphEdge = {
  id: string
  source: string
  target: string
  /** Drawn in the tree, but its target label is concealed until searched. */
  hidden: boolean
}

export type BookGraph = {
  nodes: GraphNode[]
  edges: GraphEdge[]
  startId: string
  /** Chapter IDs with END markers. */
  endIds: string[]
  /** The chapter types this book actually uses, in registry order. */
  usedTypes: ChapterType[]
}

export function buildGraph(book: BookData): BookGraph {
  const nodes = book.chapters.map(toNode)
  const existing = new Set(nodes.map(node => node.id))
  const startId = book.startId
  const endIds = book.endIds

  // Some markers carry values that read like a chapter but point outside the
  // book, and the layout engine rejects an edge to an unknown node.
  const isReachable = (target: string) =>
    existing.has(target) &&
    target !== startId &&
    !book.chapterToSkip.includes(book.chaptersById.get(target)?.number ?? '')

  return {
    nodes,
    edges: book.chapters
      .flatMap(chapter =>
        endIds.includes(chapter.id) ? [] : toEdges(chapter, isReachable),
      )
      .concat(toMapEdges(book, isReachable)),
    startId,
    endIds,
    usedTypes: sortChapterTypes(
      book.chapters.flatMap(chapter =>
        markers(chapter).map(marker => marker.type),
      ),
    ),
  }
}

export function buildAllBooksGraph(): BookGraph {
  const bookGraphs = books.map(book => {
    const data = getBookData(book.id)
    return { book, data, graph: buildGraph(data) }
  })
  const nodes = bookGraphs.flatMap(({ book, graph }) =>
    graph.nodes.map(node => ({ ...node, bookId: book.id })),
  )
  const nodeIds = new Set(nodes.map(node => node.id))
  const extensionStartId = bookGraphs.find(({ book }) => book.id === 'E01')
    ?.data.startId
  const externalEdges = bookGraphs.flatMap(({ data }) =>
    data.chapters.flatMap(chapter =>
      data.endIds.includes(chapter.id)
        ? []
        : chapter.routes.flatMap((route, index) => {
            const targetId =
              route.kind === 'external-chapter'
                ? route.targetId
                : route.kind === 'royaume-entry'
                  ? extensionStartId
                  : undefined
            return targetId && nodeIds.has(targetId)
              ? [
                  {
                    id: `${chapter.id}-external-${index}-${targetId}`,
                    source: chapter.id,
                    target: targetId,
                    hidden: false,
                  },
                ]
              : []
          }),
    ),
  )

  return {
    nodes,
    edges: [
      ...bookGraphs.flatMap(({ graph }) => graph.edges),
      ...externalEdges,
    ],
    startId: '',
    endIds: [],
    usedTypes: sortChapterTypes(
      bookGraphs.flatMap(({ graph }) => graph.usedTypes),
    ),
  }
}

function toMapEdges(
  book: BookData,
  isReachable: (target: string) => boolean,
): GraphEdge[] {
  const mapChapter = book.chaptersById.get(`${book.id}-MAP`)
  if (!mapChapter) {
    return []
  }

  return mapChapter.routes
    .filter(
      (route): route is Extract<BookRoute, { kind: 'chapter' }> =>
        route.kind === 'chapter' && route.source === 'map',
    )
    .filter(route => isReachable(route.targetId))
    .map((route, index) => ({
      id: `${mapChapter.id}-hm-${index}-${route.targetId}`,
      source: mapChapter.id,
      target: route.targetId,
      hidden: true,
    }))
}

function markers(chapter: BookChapter): MarkerToken[] {
  return chapter.tokens.filter(isMarker)
}

function isMarker(token: ChapterToken): token is MarkerToken {
  return token.kind === 'marker'
}

function toNode(chapter: BookChapter): GraphNode {
  const types = markers(chapter).map(marker => marker.type)

  return {
    id: chapter.id,
    label: chapter.number,
    // The first marker that declares a shape wins; a plain chapter is a circle
    // when it is a dead end or a single corridor, a diamond when it branches.
    shape:
      types.find(type => type.shape)?.shape ??
      (chapter.tokens.length > 1 ? 'diamond' : 'circle'),
    classNames: types
      .map(type => type.className)
      .filter((className): className is string => className !== undefined),
    badges: types
      .map(type => type.badge)
      .filter((badge): badge is ChapterBadge => badge !== undefined),
  }
}

function toEdges(
  chapter: BookChapter,
  isReachable: (target: string) => boolean,
): GraphEdge[] {
  const routes = chapter.routes.filter(
    (route): route is Extract<BookRoute, { kind: 'chapter' }> =>
      route.kind === 'chapter' && route.source !== 'map',
  )

  return routes
    .filter(route => isReachable(route.targetId))
    .map((route, index) => ({
      id: `${chapter.id}-${index}-${route.targetId}`,
      source: chapter.id,
      target: route.targetId,
      hidden: route.hidden,
    }))
}
