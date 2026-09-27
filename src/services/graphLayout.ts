import type {
  ELK as ElkEngine,
  ElkExtendedEdge,
  ElkNode,
  LayoutOptions,
} from 'elkjs/lib/elk-api'
import ELK from 'elkjs/lib/elk-api'
import type { GraphNode } from 'services/bookGraph'
import { buildGraph } from 'services/bookGraph'
import type { BookId } from 'services/books'
import { getBook } from 'services/books'
import type { ChapterType } from 'services/chapterType'
import { chapterShapeSize } from 'services/chapterType'

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

export type BookLayout = {
  width: number
  height: number
  nodes: LayoutNode[]
  edges: LayoutEdge[]
  /** The chapter types this book uses, for the legend. */
  usedTypes: ChapterType[]
}

const layoutOptions: LayoutOptions = {
  'elk.algorithm': 'layered',
  'elk.direction': 'DOWN',
  'elk.edgeRouting': 'POLYLINE',
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

const layouts = new Map<BookId, Promise<BookLayout>>()

/**
 * Lays a book's chapter graph out, once per session. Page components remount on
 * every tab switch, and laying out a few hundred chapters is not free.
 */
export function getBookLayout(id: BookId): Promise<BookLayout> {
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

async function computeLayout(id: BookId): Promise<BookLayout> {
  const graph = buildGraph(getBook(id))

  const request: ElkNode = {
    id: 'root',
    layoutOptions,
    children: graph.nodes.map(node => ({
      id: node.id,
      ...chapterShapeSize[node.shape],
      ...(node.id === graph.startId && {
        layoutOptions: { 'elk.layered.layering.layerConstraint': 'FIRST' },
      }),
      ...(node.id === graph.endId && {
        layoutOptions: { 'elk.layered.layering.layerConstraint': 'LAST' },
      }),
    })),
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
  const hiddenEdges = new Set(
    graph.edges.filter(edge => edge.hidden).map(edge => edge.id),
  )

  return {
    width: result.width ?? 0,
    height: result.height ?? 0,
    usedTypes: graph.usedTypes,
    nodes: graph.nodes.map(node => {
      const child = placed.get(node.id)
      return {
        ...node,
        ...chapterShapeSize[node.shape],
        x: child?.x ?? 0,
        y: child?.y ?? 0,
      }
    }),
    edges: (result.edges ?? []).map(edge => ({
      id: edge.id,
      source:
        graph.edges.find(candidate => candidate.id === edge.id)?.source ?? '',
      target:
        graph.edges.find(candidate => candidate.id === edge.id)?.target ?? '',
      hidden: hiddenEdges.has(edge.id),
      points: toPoints(edge),
    })),
  }
}

function toPoints(edge: ElkExtendedEdge): Point[] {
  return (edge.sections ?? []).flatMap(section => [
    section.startPoint,
    ...(section.bendPoints ?? []),
    section.endPoint,
  ])
}
