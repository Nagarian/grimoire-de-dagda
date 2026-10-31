import type { BookChapter, BookData, BookRoute } from 'services/bookData'
import type { ChapterToken, MarkerToken } from 'services/chapterDsl'
import type {
  ChapterBadge,
  ChapterShape,
  ChapterType,
} from 'services/chapterType'
import { sortChapterTypes } from 'services/chapterType'

export type GraphNode = {
  /** The chapter number, or `MAP` for the map node. */
  id: string
  shape: ChapterShape
  classNames: string[]
  badges: ChapterBadge[]
}

export type GraphEdge = {
  id: string
  source: string
  target: string
  /** Laid out like any other edge, but not drawn. */
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
    !book.chapterToSkip.includes(target)

  return {
    nodes,
    edges: book.chapters
      .flatMap(chapter =>
        endIds.includes(chapter.id)
          ? []
          : toEdges(chapter, book.id, isReachable),
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

function toMapEdges(
  book: BookData,
  isReachable: (target: string) => boolean,
): GraphEdge[] {
  const mapChapter = book.chaptersById.get('MAP')
  if (!mapChapter) {
    return []
  }

  return mapChapter.routes
    .filter(
      (route): route is Extract<BookRoute, { kind: 'chapter' }> =>
        route.kind === 'chapter' && route.source === 'map',
    )
    .filter(route => isReachable(route.targetChapterId))
    .map((route, index) => ({
      id: `${mapChapter.id}-hm-${index}-${route.targetChapterId}`,
      source: mapChapter.id,
      target: route.targetChapterId,
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
  bookId: BookData['id'],
  isReachable: (target: string) => boolean,
): GraphEdge[] {
  const routes = chapter.routes.filter(
    (route): route is Extract<BookRoute, { kind: 'chapter' }> =>
      route.kind === 'chapter' &&
      route.targetBookId === bookId &&
      route.source !== 'map',
  )

  return routes
    .filter(route => isReachable(route.targetChapterId))
    .map((route, index) => ({
      id: `${chapter.id}-${index}-${route.targetChapterId}`,
      source: chapter.id,
      target: route.targetChapterId,
      hidden: route.hidden,
    }))
}
