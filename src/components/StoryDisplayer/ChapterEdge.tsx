import type { LayoutEdge, Point } from 'services/graphLayout'

export type ChapterEdgeProps = {
  edge: LayoutEdge
}

export const arrowMarkerId = 'chapter-arrow'

export function ChapterEdge({ edge }: ChapterEdgeProps) {
  return (
    <path
      className="chapter-edge"
      d={toPath(edge.points)}
      markerEnd={`url(#${arrowMarkerId})`}
    />
  )
}

/**
 * Rounds the corners ELK gives us, which keeps long paths readable without the
 * layout drifting away from the polyline it computed.
 */
function toPath(points: Point[]): string {
  const first = points.at(0)
  if (!first) {
    return ''
  }

  const rest = points.slice(1)
  const corner = 14
  let path = `M ${round(first.x)} ${round(first.y)}`

  rest.forEach((point, index) => {
    const next = rest.at(index + 1)
    const previous = index === 0 ? first : rest[index - 1]

    if (!next) {
      path += ` L ${round(point.x)} ${round(point.y)}`
      return
    }

    const from = towards(point, previous, corner)
    const to = towards(point, next, corner)
    path += ` L ${round(from.x)} ${round(from.y)} Q ${round(point.x)} ${round(
      point.y,
    )} ${round(to.x)} ${round(to.y)}`
  })

  return path
}

/** A point `distance` away from `origin`, on its way to `target`. */
function towards(origin: Point, target: Point, distance: number): Point {
  const dx = target.x - origin.x
  const dy = target.y - origin.y
  const length = Math.hypot(dx, dy)
  const step = Math.min(distance, length / 2) / (length || 1)

  return { x: origin.x + dx * step, y: origin.y + dy * step }
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}
