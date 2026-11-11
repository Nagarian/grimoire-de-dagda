import type {
  ELK as ElkEngine,
  ElkExtendedEdge,
  ElkNode,
  LayoutOptions,
} from 'elkjs/lib/elk-api'
import ELK from 'elkjs/lib/elk-api'
import type { GraphNode } from 'services/bookGraph'
import { buildAllBooksGraph, buildGraph } from 'services/bookGraph'
import type { BookSelectionId } from 'services/books'
import { ALL_BOOKS_ID, books } from 'services/books'
import { getBookData } from 'services/bookData'
import type { ChapterType } from 'services/chapterType'
import { chapterNodeSize } from 'services/chapterType'

export type Point = {
  x: number
  y: number
}

export type LayoutNode = GraphNode & {
  x: number
  y: number
  width: number
  height: number
}

export type LayoutEdge = {
  id: string
  source: string
  target: string
  hidden: boolean
  /** Start point, bend points and end point, in diagram coordinates. */
  points: Point[]
}

export type LayoutBookGroup = {
  id: string
  color: string
  x: number
  y: number
  width: number
  height: number
}

export type BookLayout = {
  width: number
  height: number
  nodes: LayoutNode[]
  edges: LayoutEdge[]
  groups: LayoutBookGroup[]
  /** The chapter types this book uses, for the legend. */
  usedTypes: ChapterType[]
}

const layoutOptions: LayoutOptions = {
  'elk.algorithm': 'layered',
  'elk.direction': 'DOWN',
  'elk.edgeRouting': 'POLYLINE',
  'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
  // The chapter graph is full of loops, so the layering has to break them.
  // DEPTH_FIRST stretches the book into a much deeper, slower layout.
  'elk.layered.cycleBreaking.strategy': 'GREEDY',
  'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
  'elk.layered.spacing.nodeNodeBetweenLayers': '80',
  'elk.layered.spacing.edgeNodeBetweenLayers': '40',
  'elk.spacing.nodeNode': '40',
  'elk.spacing.edgeEdge': '20',
  'elk.spacing.edgeNode': '30',
  'elk.padding': '[top=40,left=40,bottom=40,right=40]',
}

let engine: ElkEngine | undefined

function getEngine(): ElkEngine {
  // Created on first use: instantiating it spawns the layout worker.
  engine ??= new ELK({
    workerFactory: () =>
      new Worker(new URL('elkjs/lib/elk-worker.min.js', import.meta.url)),
  })
  return engine
}

const layouts = new Map<BookSelectionId, Promise<BookLayout>>()

/**
 * Lays a book's chapter graph out, once per session. Page components remount on
 * every tab switch, and laying out a few hundred chapters is not free.
 */
export function getBookLayout(id: BookSelectionId): Promise<BookLayout> {
  const cached = layouts.get(id)
  if (cached) {
    return cached
  }

  // A failure is not cached, so selecting the book again retries.
  const layout = computeLayout(id).catch((error: unknown) => {
    layouts.delete(id)
    throw error
  })
  layouts.set(id, layout)
  return layout
}

async function computeLayout(id: BookSelectionId): Promise<BookLayout> {
  const graph =
    id === ALL_BOOKS_ID ? buildAllBooksGraph() : buildGraph(getBookData(id))
  const isCombined = id === ALL_BOOKS_ID
  const nodesByBook = new Map(
    books.map(book => [
      book.id,
      graph.nodes.filter(node => node.bookId === book.id),
    ]),
  )

  const request: ElkNode = {
    id: 'root',
    layoutOptions,
    children: isCombined
      ? books.map(book => ({
          id: book.id,
          layoutOptions: {
            ...layoutOptions,
            'elk.padding': '[top=200,left=180,bottom=160,right=180]',
          },
          children: (nodesByBook.get(book.id) ?? []).map(node =>
            toElkNode(node, graph.startId, graph.endIds),
          ),
        }))
      : graph.nodes.map(node => toElkNode(node, graph.startId, graph.endIds)),
    edges: graph.edges.map(edge => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  }

  const result = await getEngine().layout(request)

  const placed = new Map(
    (result.children ?? []).map(child => [child.id, child] as const),
  )
  const groupNodes = new Map(
    (result.children ?? []).map(child => [child.id, child] as const),
  )
  const placedNodes = new Map(
    (result.children ?? []).flatMap(group =>
      (group.children ?? []).map(
        child => [child.id, { node: child, group }] as const,
      ),
    ),
  )
  const hiddenEdges = new Set(
    graph.edges.filter(edge => edge.hidden).map(edge => edge.id),
  )

  return {
    width: result.width ?? 0,
    height: result.height ?? 0,
    usedTypes: graph.usedTypes,
    groups: isCombined
      ? books.flatMap(book => {
          const group = groupNodes.get(book.id)
          return group
            ? [
                {
                  id: book.id,
                  color: book.accentColor,
                  x: group.x ?? 0,
                  y: group.y ?? 0,
                  width: group.width ?? 0,
                  height: group.height ?? 0,
                },
              ]
            : []
        })
      : [],
    nodes: graph.nodes.map(node => {
      const placement = isCombined
        ? placedNodes.get(node.id)
        : { node: placed.get(node.id), group: undefined }
      const child = placement?.node
      const group = placement?.group
      return {
        ...node,
        ...chapterNodeSize(node.shape, node.badges.length > 0),
        x: (child?.x ?? 0) + (group?.x ?? 0),
        y: (child?.y ?? 0) + (group?.y ?? 0),
      }
    }),
    edges: (result.edges ?? []).map(edge => ({
      id: edge.id,
      source:
        graph.edges.find(candidate => candidate.id === edge.id)?.source ?? '',
      target:
        graph.edges.find(candidate => candidate.id === edge.id)?.target ?? '',
      hidden: hiddenEdges.has(edge.id),
      points: translatePoints(
        toPoints(edge),
        groupNodes.get(edge.container ?? ''),
      ),
    })),
  }
}

function toElkNode(
  node: GraphNode,
  startId: string,
  endIds: string[],
): ElkNode {
  return {
    id: node.id,
    ...chapterNodeSize(node.shape, node.badges.length > 0),
    ...(node.id === startId && {
      layoutOptions: { 'elk.layered.layering.layerConstraint': 'FIRST' },
    }),
    ...(endIds.includes(node.id) && {
      layoutOptions: { 'elk.layered.layering.layerConstraint': 'LAST' },
    }),
  }
}

function toPoints(edge: ElkExtendedEdge): Point[] {
  return (edge.sections ?? []).flatMap(section => [
    section.startPoint,
    ...(section.bendPoints ?? []),
    section.endPoint,
  ])
}

function translatePoints(points: Point[], group: ElkNode | undefined): Point[] {
  if (!group) {
    return points
  }

  return points.map(point => ({
    x: point.x + (group.x ?? 0),
    y: point.y + (group.y ?? 0),
  }))
}
