import type { Book } from 'services/books'
import type { Chapter, ChapterToken, MarkerToken } from 'services/chapterDsl'
import { parseBook } from 'services/chapterDsl'
import type {
  ChapterBadge,
  ChapterPath,
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

export function buildGraph(book: Book): BookGraph {
  const chapters = parseBook(book.content)
  const nodes = chapters.map(toNode)
  const existing = new Set(nodes.map(node => node.id))
  const startId = nodes.find(node =>
    node.classNames.includes('chapter-start'),
  )?.id
  const endIds = chapters
    .filter(chapter =>
      markers(chapter).some(marker => marker.type.id === 'END'),
    )
    .map(chapter => chapter.id)
  const mapId = chapters.find(chapter =>
    markers(chapter).some(marker => marker.type.id === 'MAP'),
  )?.id

  // Some markers carry values that read like a chapter but point outside the
  // book, and the layout engine rejects an edge to an unknown node.
  const isReachable = (target: string) =>
    existing.has(target) &&
    target !== startId &&
    !book.chapterToSkip.includes(target)

  return {
    nodes,
    edges: [
      ...chapters.flatMap(chapter =>
        endIds.includes(chapter.id) ? [] : toEdges(chapter, isReachable),
      ),
      ...toMapEdges(chapters, mapId, isReachable),
    ],
    startId: startId ?? '',
    endIds,
    usedTypes: sortChapterTypes(
      chapters.flatMap(chapter => markers(chapter).map(marker => marker.type)),
    ),
  }
}

function markers(chapter: Chapter): MarkerToken[] {
  return chapter.tokens.filter(isMarker)
}

function isMarker(token: ChapterToken): token is MarkerToken {
  return token.kind === 'marker'
}

function toNode(chapter: Chapter): GraphNode {
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

function toMapEdges(
  chapters: Chapter[],
  mapId: string | undefined,
  isReachable: (target: string) => boolean,
): GraphEdge[] {
  if (!mapId) {
    return []
  }

  const targets = new Set(
    chapters.flatMap(chapter =>
      markers(chapter)
        .filter(marker => marker.type.id === 'HM')
        .flatMap(marker => marker.args),
    ),
  )

  return [...targets].filter(isReachable).map((target, index) => ({
    id: `${mapId}-hm-${index}-${target}`,
    source: mapId,
    target,
    hidden: true,
  }))
}

function toEdges(
  chapter: Chapter,
  isReachable: (target: string) => boolean,
): GraphEdge[] {
  return chapter.tokens
    .flatMap(token => {
      switch (token.kind) {
        case 'path':
          return [{ target: token.target, hidden: false }]
        case 'marker':
          // Arguments are read by position, so they are only filtered once the
          // marker has picked the ones it actually treats as paths.
          return (
            token.type.extractPaths?.(token.args) ??
            token.args.map((target): ChapterPath => ({ target }))
          ).map(path => ({ target: path.target, hidden: path.hidden === true }))
        case 'unknown':
          return []
      }
    })
    .filter(path => isReachable(path.target))
    .map((path, index) => ({
      id: `${chapter.id}-${index}-${path.target}`,
      source: chapter.id,
      target: path.target,
      hidden: path.hidden,
    }))
}
